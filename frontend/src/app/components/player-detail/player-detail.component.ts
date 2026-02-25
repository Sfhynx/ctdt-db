import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Player } from '../../models/player.model';
import { PHYSICAL_STATS, ATTACK_STATS, DEFENSE_STATS, SAVE_STATS } from '../../constants/stats';
import { Formation, StatName } from '../../types/player-types';
import { FormationsService } from '../../services/formations.service';
import { SkillBonus } from '../../models/skills.model';
import { ASSOCIATE_PHYSICAL_STATS } from '../../constants/associate-physical-stats';
import { Technique } from '../../models/technique.model';
import { Element } from '../../models/element.model';
import { environment } from '../../../environments/environment';
import { PlayerResumenStateService } from '../../services/player-resumen-state.service';
import {
  PlayerPreferencesService,
  getPositionCodeFromPositions,
  GK_LIMIT_BREAK_STATS,
  FIELD_LIMIT_BREAK_STATS
} from '../../services/player-preferences.service';
import { PlayerResumenState, TechniqueWithSummary } from '../player-resumen/player-resumen.component';

interface StatModifier {
  percentage: number;
  flat: number;
}

/** Fila de comparativa: tipo de ataque vs tipo de defensa; quién ataca (current u opponent) */
export interface CompareRow {
  attackTypeKey: 'remate' | 'volea' | 'cabezazo' | 'pase' | 'pared' | 'regate';
  defendTypeKey: 'gk_save' | 'intercepción' | 'bloqueo' | 'entrada';
  label: string;
  attackerIsCurrent: boolean;
}

/** Fila de comparativa por tipo: mismo tipo de técnica entre dos jugadores (bonos generales) */
export interface ComparativaByTypeRow {
  typeKey: string;
  label: string;
}

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player-detail.component.html',
  styleUrl: './player-detail.component.css'
})
export class PlayerDetailComponent implements OnInit {
  player: Player | null = null;
  loading = true;
  error = '';
  activeTab: 'stats' | 'ingame' | 'techniques' | 'faceoff' | 'compare' = 'stats'; // Default to stats tab. faceoff = enfrentamiento (bonos por jugador), compare = comparativa por tipo (bonos generales)
  statsSubTab: 'base' | 'ingame' = 'base'; // Sub-tab for stats: base or in-game
  rompebarrerasLevel: number = 0; // 0 to 4
  ballBonusType: 'none' | 'low' | 'high' = 'none';
  imageBaseUrl = environment.apiBaseUrl;
  iconsBaseUrl = environment.apiBaseUrl + '/icons';

  // Modifiers
  teamSkillBonus: number = 0; // Team Skills percentage bonus
  bondBonus: number = 0; // Bond percentage bonus
  formationId = 'ninguna'; // Id de formación (built-in o custom)
  selectedStat: StatName | null = null;
  formations: Formation[] = []; // Lista para el selector

  // Techniques tabs
  techniquesTab: 'player' | 'best' | 'all' = 'player';
  allTechniques: any[] = [];
  tooltipTechnique: any = null;
  allPlayers: Player[] = [];

  /** Detecta si el nombre de una skill es "Maestro de los duelos" (cualquier variante de mayúsculas/espacios). */
  private isDuelMasterSkillName(name: string | null | undefined): boolean {
    if (name == null || String(name).trim() === '') return false;
    return (String(name).trim().toLowerCase()).includes('maestro de los duelos');
  }

  // Compare tab: vs goalkeeper
  compareOpponentId: number | null = null;
  compareCurrentTeamSkill = 0;
  compareCurrentBond = 0;
  compareCurrentFormationId = 'ninguna';
  compareOpponentTeamSkill = 0;
  compareOpponentBond = 0;
  compareOpponentFormationId = 'ninguna';
  opponentTechniques: Technique[] = [];
  loadingOpponentTechniques = false;
  showCompareOpponentModal = false;

  /** Comparativa tab: lista de jugadores añadidos para comparar (además del actual). */
  comparativaPlayerIds: number[] = [];
  /** Técnicas por jugador en comparativa (key = playerId). */
  comparativaTechniquesByPlayerId = new Map<number, Technique[]>();
  /** Jugadores cuyas técnicas se están cargando en comparativa. */
  loadingComparativaPlayerIds = new Set<number>();

  /** Elementos con ventaja de afinidad (para cálculos). Cargados al iniciar. */
  elementsWithAdvantage: Element[] = [];

  // Skill activation tracking
  passiveSkillActive: boolean = false;
  activeLatentSkills: Set<number> = new Set(); // Track active latent skill IDs
  skillsSidebarCollapsed: boolean = false; // Control collapse/expand of skills sidebar

  // Stat selection tracking (max 8 stats can be selected for +1000 bonus)
  selectedStats: Set<string> = new Set();

  // Stat modifiers
  modifiers: { [key: string]: StatModifier } = {
    dribble: { percentage: 0, flat: 0 },
    shot: { percentage: 0, flat: 0 },
    pass: { percentage: 0, flat: 0 },
    tackle: { percentage: 0, flat: 0 },
    block: { percentage: 0, flat: 0 },
    intercept: { percentage: 0, flat: 0 },
    speed: { percentage: 0, flat: 0 },
    power: { percentage: 0, flat: 0 },
    technique: { percentage: 0, flat: 0 }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly resumenStateService: PlayerResumenStateService,
    private readonly preferencesService: PlayerPreferencesService,
    private readonly formationsService: FormationsService
  ) { }

  ngOnInit(): void {
    this.formations = this.formationsService.getFormations();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPlayer(parseInt(id, 10));
    }

    // Load all players for technique owner lookup
    this.loadAllPlayers();

    // Cargar elementos con ventaja de afinidad para hasAffinityAdvantage
    this.apiService.getElements().subscribe(data => this.elementsWithAdvantage = data);
  }

  loadPlayer(id: number): void {
    this.loading = true;
    this.error = '';

    this.apiService.getPlayers().subscribe({
      next: (players) => {
        this.player = players.find(p => p.id === id) || null;
        if (!this.player) {
          this.error = 'Jugador no encontrado';
        } else {
          const prefs = this.preferencesService.getPreferences();
          if (prefs) {
            this.teamSkillBonus = prefs.teamSkillBonus;
            this.bondBonus = prefs.bondBonus;
            this.formationId = prefs.formationId || 'ninguna';
            this.rompebarrerasLevel = prefs.rompebarrerasLevel;
            if (prefs.limitBreaksByPositionGroup && this.player.positions?.length) {
              const positionCode = getPositionCodeFromPositions(this.player.positions);
              if (positionCode) {
                const preset = prefs.limitBreaksByPositionGroup[positionCode];
                if (preset?.length) {
                  const isGK = positionCode === 'PO';
                  const allowed = new Set(isGK ? GK_LIMIT_BREAK_STATS : FIELD_LIMIT_BREAK_STATS);
                  this.selectedStats.clear();
                  preset.forEach(stat => {
                    if (allowed.has(stat)) this.selectedStats.add(stat);
                  });
                }
              }
            }
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el jugador: ' + err.message;
        this.loading = false;
      }
    });
  }

  setRompebarrerasLevel(level: number): void {
    this.rompebarrerasLevel = level;
  }

  getRompebarrerasEnergyBonus(): number {
    return this.rompebarrerasLevel >= 1 ? 100 : 0;
  }

  getRompebarrerasPhysicalBonus(): number {
    // Levels 2 and 3 each add 1200 to EACH physical stat (speed, power, technique)
    let bonus = 0;
    if (this.rompebarrerasLevel >= 2) bonus += 1200;
    if (this.rompebarrerasLevel >= 3) bonus += 1200;
    return bonus;
  }

  getRompebarrerasAttackBonus(): number {
    // Level 4 adds 1200 to EACH attack stat (dribble, shot, pass)
    return this.rompebarrerasLevel >= 4 ? 1200 : 0;
  }

  getRompebarrerasDefenseBonus(): number {
    // Level 4 adds 1200 to EACH defense stat (tackle, block, intercept)
    return this.rompebarrerasLevel >= 4 ? 1200 : 0;
  }

  getFormationBonus(statName: StatName): number {
    const formation = this.formationsService.getFormationById(this.formationId);
    return this.formationsService.getFormationBonus(formation ?? undefined, statName, this.isGoalkeeper());
  }

  getFormationLabel(f: Formation): string {
    if (f.category === 'Ninguna' && !f.extraStatBonus) return f.name;
    const parts: string[] = [];
    if (f.category !== 'Ninguna' && f.categoryBonus) {
      parts.push(`+${f.categoryBonus}% ${f.category === 'Ataque' ? 'ATQ' : f.category === 'Defensiva' ? 'DEF' : 'FÍS'}`);
    }
    if (f.extraStatBonus) {
      const statLabels: Record<string, string> = { dribble: 'Regate', shot: 'Tiro', pass: 'Pase', tackle: 'Entrada', block: 'Bloqueo', intercept: 'Intercepción', speed: 'Velocidad', power: 'Potencia', technique: 'Técnica', punch: 'Puño', catchStat: 'Blocaje', energy: 'Energía' };
      parts.push(`${statLabels[f.extraStatBonus.stat] ?? f.extraStatBonus.stat} +${f.extraStatBonus.percent}%`);
    }
    return parts.length ? `${f.name} (${parts.join(', ')})` : f.name;
  }

  isGoalkeeper(): boolean {
    return this.player?.positions?.includes('PO') ?? false;
  }

  getModifiedStat(baseStat: number, statName: StatName): number {
    const modifier = this.modifiers[statName];
    let stat = baseStat;

    // Apply +1000 bonus if this stat is selected (max 8 stats)
    if (this.selectedStats.has(statName)) {
      stat += 1000;
    }

    // Apply rompebarreras bonuses to individual stats (flat bonuses)
    if (PHYSICAL_STATS.includes(statName as typeof PHYSICAL_STATS[number])) {
      stat += this.getRompebarrerasPhysicalBonus();
    } else if (ATTACK_STATS.includes(statName as typeof ATTACK_STATS[number])) {
      stat += this.getRompebarrerasAttackBonus();
    } else if (DEFENSE_STATS.includes(statName as typeof DEFENSE_STATS[number])) {
      stat += this.getRompebarrerasDefenseBonus();
    } else if (SAVE_STATS.includes(statName as typeof SAVE_STATS[number])) {
      stat += this.getRompebarrerasAttackBonus();
    }

    // Apply Team Skills and Formation percentage bonuses
    const formationBonus = this.getFormationBonus(statName);
    const totalPercentageBonus = this.teamSkillBonus + formationBonus;
    stat = Math.round(stat * (1 + totalPercentageBonus / 100));

    // Apply skill bonuses from passive and latent skills (percentage)
    const skillBonus = this.getSkillStatBonus(statName);
    const totalSkillBonus = skillBonus + this.bondBonus;
    stat = Math.round(stat * (1 + totalSkillBonus  / 100));

    if (!modifier) return stat;

    const percentageModified = stat * (1 + modifier.percentage / 100);
    return Math.round(percentageModified + modifier.flat);
  }

  getModifiedEnergy(): number {
    if (!this.player) return 0;
    return this.player.stats.energy + this.getRompebarrerasEnergyBonus();
  }

  // Goalkeeper-specific methods
  getInGamePunch(ballSkill: 'low' | 'high'): number {
    if (!this.player || !this.isGoalkeeper()) return 0;

    const basePunch = this.getInGamePunchBase();
    // Apply ball skill bonus
    const skillValue = ballSkill === 'low' ? this.player.groundBallSkill : this.player.highBallSkill;
    const ballSkillBonus = this.getBallSkillBonus(skillValue);
    let inGamePunch = basePunch;
    if (ballSkillBonus !== 0) {
      inGamePunch = Math.round(inGamePunch + inGamePunch * (ballSkillBonus / 100));
    }

    return inGamePunch;
  }

  getInGameCatch(ballSkill: 'low' | 'high'): number {
    if (!this.player || !this.isGoalkeeper()) return 0;

    const baseCatch = this.getInGameCatchBase();
    // Apply ball skill bonus
    const skillValue = ballSkill === 'low' ? this.player.groundBallSkill : this.player.highBallSkill;
    const ballSkillBonus = this.getBallSkillBonus(skillValue);
    let inGameCatch = baseCatch;
    if (ballSkillBonus !== 0) {
      inGameCatch = Math.round(inGameCatch + inGameCatch * (ballSkillBonus / 100));
    }

    return inGameCatch;
  }

  // Base in-game values without ball skill bonus (for display in stats table)
  getInGamePunchBase(): number {
    if (!this.player || !this.isGoalkeeper()) return 0;

    const statPart = this.getModifiedStat(this.player.stats.punch ?? 0, 'punch');
    const physicalPart = (this.getModifiedStat(this.player.stats.speed ?? 0, 'speed') + this.getModifiedStat(this.player.stats.power ?? 0, 'power')) / 4;
    return Math.round(statPart + physicalPart);
  }

  getInGameCatchBase(): number {
    if (!this.player || !this.isGoalkeeper()) return 0;

    const statPart = this.getModifiedStat(this.player.stats.catchStat ?? 0, 'catchStat');
    const physicalPart = (this.getModifiedStat(this.player.stats.power ?? 0, 'power') + this.getModifiedStat(this.player.stats.technique ?? 0, 'technique')) / 4;
    return Math.round(statPart + physicalPart);
  }

  // Calculate how many times a technique can be executed
  getTechniqueExecutions(staminaCost: number): number {
    if (!this.player || staminaCost === 0) return 0;
    const energy = this.player.stats.energy;
    const modifiedCost = this.getModifiedStaminaCost(staminaCost);
    return Math.floor(energy / modifiedCost);
  }

  // Get modified stamina cost with reduction bonuses applied
  getModifiedStaminaCost(baseCost: number): number {
    const reduction = this.getStaminaReductionBonus();
    if (reduction === 0) return baseCost;
    // Reduction is a percentage, so we reduce the cost
    return Math.round(baseCost * (1 - reduction / 100));
  }

  // Get total stamina cost reduction bonus from active skills (passive + latents)
  getStaminaReductionBonus(): number {
    let bonus = 0;

    // Passive skill bonuses
    if (this.passiveSkillActive && this.player?.passiveSkill?.bonuses) {
      this.player.passiveSkill.bonuses.forEach(b => {
        if (b.type === 'stamina_cost') {
          bonus += b.value;
        }
      });
    }

    // Latent skill bonuses
    this.player?.latentSkills?.forEach(skill => {
      if (this.activeLatentSkills.has(skill.id) && skill.bonuses) {
        skill.bonuses.forEach(b => {
          if (b.type === 'stamina_cost') {
            bonus += b.value;
          }
        });
      }
    });

    return bonus;
  }

  // Techniques tab methods
  setTechniquesTab(tab: 'player' | 'best' | 'all'): void {
    this.techniquesTab = tab;
    // Load all techniques when switching to 'best' or 'all' tab
    if ((tab === 'best' || tab === 'all') && this.allTechniques.length === 0) {
      this.loadAllTechniques();
    }
  }

  getDisplayedTechniques(): any[] {
    if (!this.player) return [];

    switch (this.techniquesTab) {
      case 'player':
        return this.player.techniques || [];
      case 'best':
        return this.getBestTechniques();
      case 'all':
        return this.getAllTechniques();
      default:
        return this.player.techniques || [];
    }
  }

  getBestTechniques(): any[] {
    if (!this.player) return [];

    // Load all techniques for this player name if not loaded
    if (this.allTechniques.length === 0) {
      this.loadAllTechniques();
      return [];
    }

    // Get unique technique types
    const techniqueTypes = this.getTechniqueTypes();
    const bestTechniques: any[] = [];

    // For each type, find the technique with highest power
    techniqueTypes.forEach(type => {
      const techniquesOfType = this.allTechniques.filter(t => t.type === type);
      if (techniquesOfType.length > 0) {
        // Sort by power descending and get the first one
        const best = techniquesOfType.sort((a, b) => b.power - a.power)[0];
        bestTechniques.push({
          ...best,
          isMain: false // Best techniques don't have main flag
        });
      }
    });

    return bestTechniques;
  }

  getAllTechniques(): any[] {
    if (!this.player) return [];

    // Load all techniques for this player name if not loaded
    if (this.allTechniques.length === 0) {
      this.loadAllTechniques();
      return [];
    }

    // Return all techniques sorted by power descending
    return [...this.allTechniques].sort((a, b) => b.power - a.power);
  }

  getTechniqueTypes(): string[] {
    if (!this.player) return [];

    const isGoalkeeper = this.player.positions.includes('PO');

    if (isGoalkeeper) {
      return ['Puño', 'Blocaje'];
    } else {
      return ['Remate', 'Volea', 'Cabezazo', 'Regate', 'Pase', 'Pared', 'Entrada', 'Intercepción', 'Bloqueo'];
    }
  }

  loadAllTechniques(): void {
    if (!this.player) return;

    const playerId = this.player.id;
    this.apiService.getAvailableTechniques(playerId).subscribe({
      next: (techniques) => {
        this.allTechniques = techniques;
      },
      error: (error) => {
        console.error('Error loading techniques:', error);
      }
    });
  }

  isPlayerTechnique(technique: any): boolean {
    if (!this?.player?.techniques) return false;
    return this.player.techniques.some(t => t.id === technique.id);
  }

  toggleTooltip(technique: any): void {
    // Compare by ID instead of reference
    if (this.tooltipTechnique?.id === technique.id) {
      this.tooltipTechnique = null;
    } else {
      this.tooltipTechnique = technique;
      this.getTechniqueOwners(technique);
    }

    // Force change detection
    this.cdr.detectChanges();
  }

  loadAllPlayers(): void {
    this.apiService.getPlayers().subscribe({
      next: (players) => {
        this.allPlayers = players;
      },
      error: (error) => {
        console.error('Error loading players:', error);
      }
    });
  }

  /** Jugadores que se pueden elegir como rival (Enfrentamiento) o para añadir (Comparativa).
   * Enfrentamiento: si actual es GK solo campo; si no, todos. Comparativa: mismo tipo que el actual (GK→solo GK, campo→solo campo). */
  getCompareOpponents(): Player[] {
    let list = this.allPlayers;
    if (this.activeTab === 'compare' && this.player) {
      // Comparativa: mismo tipo que el jugador actual (portero con porteros, campo con campo)
      const currentIsGK = this.isGoalkeeper();
      list = list.filter(p => p.positions?.includes('PO') === currentIsGK);
      list = list.filter(p => p.id !== this.player!.id && !this.comparativaPlayerIds.includes(p.id));
    } else {
      // Enfrentamiento: si actual es GK solo jugadores de campo; si no, todos
      if (this.isGoalkeeper()) {
        list = list.filter(p => !p.positions?.includes('PO'));
      }
    }
    return list;
  }

  getSelectedOpponent(): Player | null {
    if (this.compareOpponentId == null) return null;
    return this.allPlayers.find(p => p.id === this.compareOpponentId!) ?? null;
  }

  isOpponentGoalkeeper(): boolean {
    const opp = this.getSelectedOpponent();
    return opp?.positions?.includes('PO') ?? false;
  }

  onCompareOpponentChange(): void {
    this.opponentTechniques = [];
    if (this.compareOpponentId != null) {
      this.loadOpponentTechniques();
    }
  }

  openCompareOpponentModal(): void {
    this.showCompareOpponentModal = true;
  }

  closeCompareOpponentModal(): void {
    this.showCompareOpponentModal = false;
  }

  selectCompareOpponent(player: Player): void {
    if (this.activeTab === 'compare') {
      this.addPlayerToComparativa(player);
      this.closeCompareOpponentModal();
    } else {
      this.compareOpponentId = player.id;
      this.closeCompareOpponentModal();
      this.loadOpponentTechniques();
    }
    this.cdr.detectChanges();
  }

  addPlayerToComparativa(player: Player): void {
    if (!this.player || player.id === this.player.id || this.comparativaPlayerIds.includes(player.id)) return;
    this.comparativaPlayerIds.push(player.id);
    this.loadTechniquesForComparativaPlayer(player);
  }

  removePlayerFromComparativa(playerId: number): void {
    this.comparativaPlayerIds = this.comparativaPlayerIds.filter(id => id !== playerId);
    this.comparativaTechniquesByPlayerId.delete(playerId);
    this.cdr.detectChanges();
  }

  loadTechniquesForComparativaPlayer(player: Player): void {
    this.loadingComparativaPlayerIds.add(player.id);
    this.apiService.getTechniquesByPlayerName(player.name).subscribe({
      next: (techniques) => {
        this.comparativaTechniquesByPlayerId.set(player.id, techniques);
        this.loadingComparativaPlayerIds.delete(player.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingComparativaPlayerIds.delete(player.id);
        this.cdr.detectChanges();
      }
    });
  }

  /** Lista ordenada de jugadores en comparativa: actual + añadidos. */
  getComparativaPlayers(): Player[] {
    if (!this.player) return [];
    const others = this.comparativaPlayerIds
      .map(id => this.allPlayers.find(p => p.id === id))
      .filter((p): p is Player => p != null);
    return [this.player, ...others];
  }

  isComparativaLoading(): boolean {
    return this.loadingComparativaPlayerIds.size > 0;
  }

  loadOpponentTechniques(): void {
    const opp = this.getSelectedOpponent();
    if (!opp) return;
    this.loadingOpponentTechniques = true;
    this.apiService.getTechniquesByPlayerName(opp.name).subscribe({
      next: (techniques) => {
        this.opponentTechniques = techniques;
        this.loadingOpponentTechniques = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingOpponentTechniques = false;
        this.cdr.detectChanges();
      }
    });
  }

  getTechniqueOwners(technique: any): Player[] {
    if (!technique?.playerName) {
      return [];
    }

    // Find all players that have this technique
    const owners = this.allPlayers.filter(p =>
      p.techniques?.some(t => t.name === technique.name && t.type === technique.type)
    );
    return owners;
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'UR': return 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
      case 'SSR': return 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)';
      case 'SR': return 'linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%)';
      case 'R': return 'linear-gradient(135deg, #4169E1 0%, #6495ED 100%)';
      case 'N': return 'linear-gradient(135deg, #808080 0%, #a9a9a9 100%)';
      default: return '#888888';
    }
  }

  isTechniqueMain(player: Player, technique: any): boolean {
    const playerTech = player.techniques?.find(t =>
      t.name === technique.name && t.type === technique.type
    );
    return playerTech?.isMain || false;
  }

  // Get base stat for momentum calculation (with rompebarreras and skill bonuses, but WITHOUT team skills and bond)
  getBaseStatForMomentum(baseStat: number, statName: StatName): number {
    let stat = baseStat;

    // Apply +1000 bonus if this stat is selected (max 8 stats)
    if (this.selectedStats.has(statName)) {
      stat += 1000;
    }

    // Apply rompebarreras bonuses to individual stats (flat bonuses)
    if (PHYSICAL_STATS.includes(statName as typeof PHYSICAL_STATS[number])) {
      stat += this.getRompebarrerasPhysicalBonus();
    } else if (ATTACK_STATS.includes(statName as typeof ATTACK_STATS[number])) {
      stat += this.getRompebarrerasAttackBonus();
    } else if (DEFENSE_STATS.includes(statName as typeof DEFENSE_STATS[number])) {
      stat += this.getRompebarrerasDefenseBonus();
    } else if (SAVE_STATS.includes(statName as typeof SAVE_STATS[number])) {
      stat += this.getRompebarrerasAttackBonus();
    }

    // Apply skill bonuses from passive and latent skills (percentage)
    const skillBonus = this.getSkillStatBonus(statName);
    if (skillBonus !== 0) {
      stat = Math.round(stat * (1 + skillBonus / 100));
    }

    return stat;
  }

  getModifiedAttack(): number {
    if (!this.player) return 0;
    return this.getModifiedStat(this.player.stats.dribble ?? 0, 'dribble') +
      this.getModifiedStat(this.player.stats.shot ?? 0, 'shot') +
      this.getModifiedStat(this.player.stats.pass ?? 0, 'pass');
  }

  getModifiedDefense(): number {
    if (!this.player) return 0;
    return this.getModifiedStat(this.player.stats.tackle ?? 0, 'tackle') +
      this.getModifiedStat(this.player.stats.block ?? 0, 'block') +
      this.getModifiedStat(this.player.stats.intercept ?? 0, 'intercept');
  }

  getModifiedPhysical(): number {
    if (!this.player) return 0;
    return this.getModifiedStat(this.player.stats.speed, 'speed') +
      this.getModifiedStat(this.player.stats.power, 'power') +
      this.getModifiedStat(this.player.stats.technique, 'technique');
  }

  setActiveTab(tab: 'stats' | 'techniques' | 'faceoff' | 'compare'): void {
    this.activeTab = tab;
    // Load all techniques when switching to techniques tab if needed
    if (tab === 'techniques' && (this.techniquesTab === 'best' || this.techniquesTab === 'all') && this.allTechniques.length === 0) {
      this.loadAllTechniques();
    }
    // Load current player techniques when switching to faceoff or compare tab
    if ((tab === 'faceoff' || tab === 'compare') && this.player && this.allTechniques.length === 0) {
      this.loadAllTechniques();
    }
    if ((tab === 'faceoff' || tab === 'compare') && this.compareOpponentId != null) {
      this.loadOpponentTechniques();
    }
  }

  setStatsSubTab(subTab: 'base' | 'ingame'): void {
    this.statsSubTab = subTab;
  }

  togglePassiveSkill(): void {
    this.passiveSkillActive = !this.passiveSkillActive;
  }

  toggleSkillsSidebar(): void {
    this.skillsSidebarCollapsed = !this.skillsSidebarCollapsed;
  }

  toggleLatentSkill(skillId: number): void {
    if (this.activeLatentSkills.has(skillId)) {
      this.activeLatentSkills.delete(skillId);
    } else {
      this.activeLatentSkills.add(skillId);
    }
  }

  isLatentSkillActive(skillId: number): boolean {
    return this.activeLatentSkills.has(skillId);
  }

  // Toggle stat selection (max 8 stats)
  toggleStatSelection(statName: string): void {
    if (this.selectedStats.has(statName)) {
      this.selectedStats.delete(statName);
    } else if (this.selectedStats.size < this.getMaxSelectedStats()) {
        this.selectedStats.add(statName);
    }
  }

  // Check if a stat is selected
  isStatSelected(statName: string): boolean {
    return this.selectedStats.has(statName);
  }

  // Check if can select more stats
  canSelectMoreStats(): boolean {
    return this.selectedStats.size < this.getMaxSelectedStats();
  }

  // Get total stat bonus from active skills (passive + latents)
  getSkillStatBonus(statName: StatName, excludeDuelMaster = false): number {
    return this.collectActiveBonuses(excludeDuelMaster).reduce((sum, b) => {
      const matchesStat = b.type === 'stat' && b.statName === statName;
      const matchesAll = b.type === 'all_stats';
      return matchesStat || matchesAll ? sum + b.value : sum;
    }, 0);
  }

  // Get total technique power bonus from active skills (passive + latents)
  // Ahora acepta la técnica completa para evaluar bonuses específicos
  getTechniquePowerBonus(technique?: { id: number; type: string; isCombined: boolean }, excludeDuelMaster = false): number {
    return this.collectActiveBonuses(excludeDuelMaster).reduce((sum, b) => {
      // Bonus para todas las técnicas
      if (b.type === 'tech_power_all') {
        return sum + b.value;
      }
      // Bonus por tipo de técnica
      if (b.type === 'tech_power_type' && technique && b.techniqueType) {
        const techType = technique.type.toLowerCase();
        if (techType === b.techniqueType.toLowerCase()) {
          return sum + b.value;
        }
      }
      // Bonus para técnicas combinadas
      if (b.type === 'tech_power_combined' && technique?.isCombined) {
        return sum + b.value;
      }
      // Bonus para técnicas específicas
      if (b.type === 'tech_power_specific' && technique && b.techniqueIds) {
        if (b.techniqueIds.includes(technique.id)) {
          return sum + b.value;
        }
      }
      return sum;
    }, 0);
  }

  // Get modified technique power with skill bonuses applied
  getModifiedTechniquePower(basePower: number, technique?: { id: number; type: string; isCombined: boolean }, excludeDuelMaster = false): number {
    const bonus = this.getTechniquePowerBonus(technique, excludeDuelMaster);
    if (bonus === 0) return basePower;
    return Math.round(basePower * (1 + bonus / 100));
  }

  getInGameStat(statName: StatName): number {
    if (!this.player) return 0;

    const statPart = this.getModifiedStat(this.player.stats[statName] ?? 0, statName);
    const physicalPart = this.getModifiedStat(this.player.stats[ASSOCIATE_PHYSICAL_STATS[statName]] ?? 0, ASSOCIATE_PHYSICAL_STATS[statName]) / 2;
    return Math.round(statPart + physicalPart);
  }

  // In-game stat calculations

  // Get ball skill bonus percentage
  getBallSkillBonus(ballSkill: string): number {
    if (ballSkill === 'Bueno') return 12.5;
    if (ballSkill === 'Muy Bueno') return 25;
    return 0; // Normal
  }

  // Volley (Volea) = Shot * Ground Ball Skill bonus
  getInGameVolley(): number {
    if (!this.player) return 0;
    const shot = this.getInGameStat('shot');
    const bonus = this.getBallSkillBonus(this.player.groundBallSkill);
    return Math.round(shot * (1 + bonus / 100));
  }

  // Header (Cabezazo) = Shot * High Ball Skill bonus
  getInGameHeader(): number {
    if (!this.player) return 0;
    const shot = this.getInGameStat('shot');
    const bonus = this.getBallSkillBonus(this.player.highBallSkill);
    return Math.round(shot * (1 + bonus / 100));
  }

  // Get skill parameter bonus from active skills (passive + latents)
  getSkillParameterBonus(): number {
    return this.collectActiveBonuses().reduce((sum, b) => {
      const matchesParameters = b.type === 'parameters';
      return matchesParameters ? sum + b.value : sum;
    }, 0);
  }

  // Calculate momentum using the spreadsheet formula
  calculateMomentum(primaryStat: number, secondaryStat: number, primaryStatName: StatName, secondaryStatName: StatName): number {
    const teamSkills = this.teamSkillBonus;
    const bond = this.bondBonus;
    const parameters = this.getSkillParameterBonus();
    const formationPrimary = this.getFormationBonus(primaryStatName);
    const formationSecondary = this.getFormationBonus(secondaryStatName);

    // Apply multiplier to primary stat (formation goes with teamSkills)
    const primaryMultiplier = (1 + teamSkills / 100 + formationPrimary / 100) * (1 + bond / 100 + parameters / 100);
    const primaryComponent = primaryStat * primaryMultiplier;

    // Apply multiplier to secondary stat (formation goes with teamSkills)
    const secondaryMultiplier = (1 + teamSkills / 100 + formationSecondary / 100) * (1 + bond / 100 + parameters / 100);
    const secondaryComponent = (secondaryStat / 2) * secondaryMultiplier;

    return Math.round(primaryComponent + secondaryComponent);
  }

  /** Normaliza el tipo de técnica para la búsqueda en TECH_TYPE_HANDLERS (p. ej. intercepcion → intercepción). */
  private normalizeTechniqueTypeForMomentum(type: string): string {
    const t = type.toLowerCase().trim();
    if (t === 'intercepcion') return 'intercepción';
    if (t === 'puno') return 'puño';
    return t;
  }

  // Get momentum for a specific technique based on its type and power
  getTechniqueMomentum(technique: { id: number; type: string; power: number; isCombined: boolean; appliesLowBallBonus?: boolean; appliesHighBallBonus?: boolean }): number {
    if (!this.player) return 0;

    const type = this.normalizeTechniqueTypeForMomentum(technique.type);
    const handler = this.TECH_TYPE_HANDLERS[type];
    if (!handler) return 0;
    let skill =
      this.ballBonusType === 'low'
        ? this.player.groundBallSkill
        : this.player.highBallSkill;
    let base = handler();
    if (type === 'cabezazo') {
      skill = this.player.highBallSkill;
      base = this.getInGameStat('shot');
    } else if (type === 'volea') {
      skill = this.player.groundBallSkill;
      base = this.getInGameStat('shot');
    }
    let ballTypeModifier = 0;
    const applyLow = type === 'volea' && (technique.appliesLowBallBonus !== false);
    const applyHigh = type === 'cabezazo' && (technique.appliesHighBallBonus !== false);
    if (this.ballBonusType === 'low' && applyLow) {
      ballTypeModifier = base * this.getBallSkillBonus(this.player.groundBallSkill) / 100;
    } else if (this.ballBonusType === 'high' && applyHigh) {
      ballTypeModifier = base * this.getBallSkillBonus(this.player.highBallSkill) / 100;
    } else if (type === 'volea' && applyLow) {
      ballTypeModifier = base * this.getBallSkillBonus(skill) / 100;
    } else if (type === 'cabezazo' && applyHigh) {
      ballTypeModifier = base * this.getBallSkillBonus(skill) / 100;
    }
    const modifiedPower = this.getModifiedTechniquePower(technique.power, technique);
    return Math.round(((base * modifiedPower) / 100) + ballTypeModifier);
  }

  // --- Comparativa: afinidad (ventaja +25 poder de técnica) ---

  /** Normaliza el elemento/afinidad a clave: fuerza, destreza, agilidad */
  private normalizeElement(element: string): 'fuerza' | 'destreza' | 'agilidad' | null {
    if (!element) return null;
    const e = element.toLowerCase();
    if (e.includes('fuerza')) return 'fuerza';
    if (e.includes('destreza')) return 'destreza';
    if (e.includes('agilidad')) return 'agilidad';
    return null;
  }

  /** True si el atacante tiene ventaja de afinidad sobre el defensor. Usa datos de elementos (advantageOver) si están cargados; si no, fallback a lógica fija Fuerza > Destreza > Agilidad > Fuerza. */
  hasAffinityAdvantage(attackerElement: string, defenderElement: string): boolean {
    if (this.elementsWithAdvantage.length > 0) {
      const attackerEl = this.elementsWithAdvantage.find(e => (e.name || '').toLowerCase() === (attackerElement || '').toLowerCase());
      if (attackerEl?.advantageOver != null) {
        return (attackerEl.advantageOver.name || '').toLowerCase() === (defenderElement || '').toLowerCase();
      }
    }
    const a = this.normalizeElement(attackerElement);
    const d = this.normalizeElement(defenderElement);
    if (!a || !d) return false;
    return (a === 'fuerza' && d === 'destreza') || (a === 'destreza' && d === 'agilidad') || (a === 'agilidad' && d === 'fuerza');
  }

  /** Bonificación de afinidad en comparativa: +25 al poder base de técnica cuando hay ventaja */
  private readonly AFFINITY_POWER_BONUS = 25;
  /** En duelos defensivos (campo): adivinar duelo da +100 a la fuerza de la técnica. No aplica a porteros ni a duelos ofensivos. */
  private readonly DEFENSIVE_DUEL_POWER_BONUS = 100;

  // --- Comparativa: jugador actual con Team Skill y Bono elegidos, pasivas/latentes marcadas ---

  /** Bonus de formación para comparativa (usa formación del jugador en comparativa) */
  getFormationBonusForCompare(statName: StatName, formationId: string, isGK: boolean): number {
    const formation = this.formationsService.getFormationById(formationId);
    return this.formationsService.getFormationBonus(formation ?? undefined, statName, isGK);
  }

  /** getModifiedStat usando Team Skill, Bono y Formación pasados (para comparativa). excludeDuelMaster=true para atacante, false para defensor (sí aplica Maestro de los duelos). */
  getModifiedStatForCompare(baseStat: number, statName: StatName, teamSkill: number, bond: number, excludeDuelMaster = true): number {
    let stat = baseStat;
    if (this.selectedStats.has(statName)) stat += 1000;
    if (PHYSICAL_STATS.includes(statName as typeof PHYSICAL_STATS[number])) stat += this.getRompebarrerasPhysicalBonus();
    else if (ATTACK_STATS.includes(statName as typeof ATTACK_STATS[number])) stat += this.getRompebarrerasAttackBonus();
    else if (DEFENSE_STATS.includes(statName as typeof DEFENSE_STATS[number])) stat += this.getRompebarrerasDefenseBonus();
    else if (SAVE_STATS.includes(statName as typeof SAVE_STATS[number])) stat += this.getRompebarrerasAttackBonus();
    const formationBonus = this.getFormationBonusForCompare(statName, this.compareCurrentFormationId, this.isGoalkeeper());
    stat = Math.round(stat * (1 + (teamSkill + formationBonus) / 100));
    const skillBonus = this.getSkillStatBonus(statName, excludeDuelMaster);
    stat = Math.round(stat * (1 + (skillBonus + bond) / 100));
    return stat;
  }

  getInGameStatForCompare(statName: StatName, teamSkill: number, bond: number, excludeDuelMaster = true): number {
    if (!this.player) return 0;
    const statPart = this.getModifiedStatForCompare(this.player.stats[statName] ?? 0, statName, teamSkill, bond, excludeDuelMaster);
    const physicalStatName = ASSOCIATE_PHYSICAL_STATS[statName];
    const physicalPart = this.getModifiedStatForCompare(this.player.stats[physicalStatName] ?? 0, physicalStatName, teamSkill, bond, excludeDuelMaster) / 2;
    return Math.round(statPart + physicalPart);
  }

  getInGameVolleyForCompare(teamSkill: number, bond: number): number {
    if (!this.player) return 0;
    const shot = this.getInGameStatForCompare('shot', teamSkill, bond);
    const bonus = this.getBallSkillBonus(this.player.groundBallSkill);
    return Math.round(shot * (1 + bonus / 100));
  }

  getInGameHeaderForCompare(teamSkill: number, bond: number): number {
    if (!this.player) return 0;
    const shot = this.getInGameStatForCompare('shot', teamSkill, bond);
    const bonus = this.getBallSkillBonus(this.player.highBallSkill);
    return Math.round(shot * (1 + bonus / 100));
  }

  // --- Comparativa por tipo (pestaña Comparativa): bonos generales (teamSkillBonus, bondBonus, formationId) ---

  /** getModifiedStat usando bonos generales del panel (para pestaña Comparativa por tipo). */
  private getModifiedStatWithGlobalBonuses(baseStat: number, statName: StatName, excludeDuelMaster = true): number {
    let stat = baseStat;
    if (this.selectedStats.has(statName)) stat += 1000;
    if (PHYSICAL_STATS.includes(statName as typeof PHYSICAL_STATS[number])) stat += this.getRompebarrerasPhysicalBonus();
    else if (ATTACK_STATS.includes(statName as typeof ATTACK_STATS[number])) stat += this.getRompebarrerasAttackBonus();
    else if (DEFENSE_STATS.includes(statName as typeof DEFENSE_STATS[number])) stat += this.getRompebarrerasDefenseBonus();
    else if (SAVE_STATS.includes(statName as typeof SAVE_STATS[number])) stat += this.getRompebarrerasAttackBonus();
    const formationBonus = this.getFormationBonusForCompare(statName, this.formationId, this.isGoalkeeper());
    stat = Math.round(stat * (1 + (this.teamSkillBonus + formationBonus) / 100));
    const skillBonus = this.getSkillStatBonus(statName, excludeDuelMaster);
    stat = Math.round(stat * (1 + (skillBonus + this.bondBonus) / 100));
    return stat;
  }

  private getInGameStatWithGlobalBonuses(statName: StatName, excludeDuelMaster = true): number {
    if (!this.player) return 0;
    const statPart = this.getModifiedStatWithGlobalBonuses(this.player.stats[statName] ?? 0, statName, excludeDuelMaster);
    const physicalStatName = ASSOCIATE_PHYSICAL_STATS[statName];
    const physicalPart = this.getModifiedStatWithGlobalBonuses(this.player.stats[physicalStatName] ?? 0, physicalStatName, excludeDuelMaster) / 2;
    return Math.round(statPart + physicalPart);
  }

  /** Momentum de una técnica del jugador actual usando solo bonos generales (pestaña Comparativa). En Comparativa siempre se aplica Maestro de los duelos; no se aplica afinidad ni el +100 por acertar duelo. */
  getTechniqueMomentumWithGlobalBonuses(technique: Technique): number {
    if (!this.player) return 0;
    const type = this.normalizeTechniqueTypeForMomentum(technique.type ?? '');
    const excludeDuelMaster = false; // En Comparativa siempre aplicamos Maestro de los duelos (solo en Enfrentamiento se excluye por diseño)
    let base: number;
    let ballTypeModifier = 0;
    if (type === 'remate') {
      base = this.getInGameStatWithGlobalBonuses('shot', excludeDuelMaster);
    } else if (type === 'volea') {
      base = this.getInGameStatWithGlobalBonuses('shot', excludeDuelMaster);
      if (technique.appliesLowBallBonus !== false) {
        ballTypeModifier = base * this.getBallSkillBonus(this.player.groundBallSkill) / 100;
      }
    } else if (type === 'cabezazo') {
      base = this.getInGameStatWithGlobalBonuses('shot', excludeDuelMaster);
      if (technique.appliesHighBallBonus !== false) {
        ballTypeModifier = base * this.getBallSkillBonus(this.player.highBallSkill) / 100;
      }
    } else if (type === 'pase' || type === 'pared') {
      base = this.getInGameStatWithGlobalBonuses('pass', excludeDuelMaster);
    } else if (type === 'regate') {
      base = this.getInGameStatWithGlobalBonuses('dribble', excludeDuelMaster);
    } else if (type === 'entrada') {
      base = this.getInGameStatWithGlobalBonuses('tackle', excludeDuelMaster);
    } else if (type === 'bloqueo') {
      base = this.getInGameStatWithGlobalBonuses('block', excludeDuelMaster);
    } else if (type === 'intercepción') {
      base = this.getInGameStatWithGlobalBonuses('intercept', excludeDuelMaster);
    } else if (type === 'puño' || type === 'blocaje') {
      return this.getGkTechniqueMomentumWithGlobalBonuses(this.player, technique, type as 'puño' | 'blocaje');
    } else {
      return 0;
    }
    const modifiedPower = this.getModifiedTechniquePower(technique.power, technique, excludeDuelMaster);
    return Math.round((base * modifiedPower) / 100 + ballTypeModifier);
  }

  /** GK en Comparativa: también aplicamos Maestro de los duelos (solo en Enfrentamiento se excluye para porteros). */
  private getGkTechniqueMomentumWithGlobalBonuses(gk: Player, technique: Technique, type: 'puño' | 'blocaje'): number {
    const excludeDuelMaster = false;
    let base: number;
    if (type === 'puño') {
      const punch = this.getGkModifiedStatWithBonuses(gk, gk.stats.punch ?? 0, 'punch', this.teamSkillBonus, this.bondBonus, ['punch', 'power', 'speed'], this.formationId, excludeDuelMaster);
      const speed = this.getGkModifiedStatWithBonuses(gk, gk.stats.speed ?? 0, 'speed', this.teamSkillBonus, this.bondBonus, ['punch', 'power', 'speed'], this.formationId, excludeDuelMaster);
      const power = this.getGkModifiedStatWithBonuses(gk, gk.stats.power ?? 0, 'power', this.teamSkillBonus, this.bondBonus, ['punch', 'power', 'speed'], this.formationId, excludeDuelMaster);
      base = Math.round(punch + (speed + power) / 4);
    } else {
      const catchStat = this.getGkModifiedStatWithBonuses(gk, gk.stats.catchStat ?? 0, 'catchStat', this.teamSkillBonus, this.bondBonus, ['catchStat', 'power', 'technique'], this.formationId, excludeDuelMaster);
      const power = this.getGkModifiedStatWithBonuses(gk, gk.stats.power ?? 0, 'power', this.teamSkillBonus, this.bondBonus, ['catchStat', 'power', 'technique'], this.formationId, excludeDuelMaster);
      const techniqueStat = this.getGkModifiedStatWithBonuses(gk, gk.stats.technique ?? 0, 'technique', this.teamSkillBonus, this.bondBonus, ['catchStat', 'power', 'technique'], this.formationId, excludeDuelMaster);
      base = Math.round(catchStat + (power + techniqueStat) / 4);
    }
    const modifiedPower = this.getGkModifiedTechniquePower(gk, technique.power, technique, excludeDuelMaster);
    return Math.round((base * modifiedPower) / 100);
  }

  /** Mejor técnica del jugador actual por typeKey usando bonos generales (para pestaña Comparativa). */
  getBestTechniqueWithGlobalBonuses(typeKey: string): Technique | null {
    const key = this.normalizeTechniqueTypeForMomentum(typeKey);
    const list = this.allTechniques.filter(t => this.normalizeTechniqueTypeForMomentum(t.type ?? '') === key);
    if (list.length === 0) return null;
    const withMom = list.map(t => ({ tech: t, mom: this.getTechniqueMomentumWithGlobalBonuses(t) }));
    withMom.sort((a, b) => b.mom - a.mom);
    return withMom[0]?.tech ?? null;
  }

  /** Momentum del jugador actual para un tipo con bonos generales. */
  getMomentumWithGlobalBonuses(typeKey: string): number {
    const tech = this.getBestTechniqueWithGlobalBonuses(typeKey);
    if (!tech) return 0;
    return this.getTechniqueMomentumWithGlobalBonuses(tech);
  }

  /** Mejor técnica del rival por typeKey usando bonos generales. */
  getBestOpponentTechniqueWithGlobalBonuses(typeKey: string): Technique | null {
    const opp = this.getSelectedOpponent();
    if (!opp || this.opponentTechniques.length === 0) return null;
    const key = this.normalizeTechniqueTypeForMomentum(typeKey);
    const list = this.opponentTechniques.filter(t => this.normalizeTechniqueTypeForMomentum(t.type ?? '') === key);
    if (list.length === 0) return null;
    const isDefenseType = key === 'entrada' || key === 'bloqueo' || key === 'intercepción';
    const withMom = list.map(t => ({
      tech: t,
      mom: key === 'puño' || key === 'blocaje'
        ? this.getGkTechniqueMomentumWithGlobalBonuses(opp, t, key as 'puño' | 'blocaje')
        : this.getOpponentFieldMomentum(opp, t, this.teamSkillBonus, this.bondBonus, this.formationId, isDefenseType, true, true)
    }));
    withMom.sort((a, b) => b.mom - a.mom);
    return withMom[0]?.tech ?? null;
  }

  /** Momentum del rival para un tipo con bonos generales. */
  getOpponentMomentumWithGlobalBonuses(typeKey: string): number {
    const opp = this.getSelectedOpponent();
    if (!opp || this.opponentTechniques.length === 0) return 0;
    const tech = this.getBestOpponentTechniqueWithGlobalBonuses(typeKey);
    if (!tech) return 0;
    const key = this.normalizeTechniqueTypeForMomentum(typeKey);
    if (key === 'puño' || key === 'blocaje') {
      return this.getGkTechniqueMomentumWithGlobalBonuses(opp, tech, key);
    }
    const isDefenseType = key === 'entrada' || key === 'bloqueo' || key === 'intercepción';
    return this.getOpponentFieldMomentum(opp, tech, this.teamSkillBonus, this.bondBonus, this.formationId, isDefenseType, true, true);
  }

  /** Momentum de un jugador en comparativa por tipo (índice en getComparativaPlayers()). */
  getComparativaMomentumForPlayer(playerIndex: number, row: ComparativaByTypeRow): number {
    const players = this.getComparativaPlayers();
    if (playerIndex < 0 || playerIndex >= players.length) return 0;
    const p = players[playerIndex];
    if (playerIndex === 0) return this.getMomentumWithGlobalBonuses(row.typeKey);
    const techniques = this.comparativaTechniquesByPlayerId.get(p.id) ?? [];
    return this.getMomentumForPlayerWithTechniques(p, techniques, row.typeKey);
  }

  /** Momentum para un jugador con su lista de técnicas en Comparativa (bonos generales; siempre aplica Maestro de los duelos). */
  private getMomentumForPlayerWithTechniques(pl: Player, techniques: Technique[], typeKey: string): number {
    const key = this.normalizeTechniqueTypeForMomentum(typeKey);
    const list = techniques.filter(t => this.normalizeTechniqueTypeForMomentum(t.type ?? '') === key);
    if (list.length === 0) return 0;
    const applyDuelMaster = true; // En Comparativa siempre aplicamos Maestro de los duelos para todos los tipos
    const withMom = list.map(t => ({
      tech: t,
      mom: key === 'puño' || key === 'blocaje'
        ? this.getGkTechniqueMomentumWithGlobalBonuses(pl, t, key as 'puño' | 'blocaje')
        : this.getOpponentFieldMomentum(pl, t, this.teamSkillBonus, this.bondBonus, this.formationId, applyDuelMaster, true, true)
    }));
    withMom.sort((a, b) => b.mom - a.mom);
    return withMom[0]?.mom ?? 0;
  }

  /** Colores para cada jugador en comparativa (por índice). */
  private readonly COMPARATIVA_COLORS = ['#0d9488', '#7c3aed', '#dc2626', '#2563eb', '#ca8a04', '#059669', '#db2777', '#0891b2'];

  getComparativaColor(playerIndex: number): string {
    return this.COMPARATIVA_COLORS[playerIndex % this.COMPARATIVA_COLORS.length] ?? '#6b7280';
  }

  /** Porcentaje de ancho de barra en comparativa (escala común: el mayor valor = 100%). playerIndex = índice en getComparativaPlayers(). */
  getComparativaBarWidthPct(row: ComparativaByTypeRow, playerIndex: number): number {
    const players = this.getComparativaPlayers();
    let max = 0;
    for (let i = 0; i < players.length; i++) {
      const m = this.getComparativaMomentumForPlayer(i, row);
      if (m > max) max = m;
    }
    if (max === 0) return 0;
    const value = this.getComparativaMomentumForPlayer(playerIndex, row);
    return Math.round((value / max) * 1000) / 10;
  }

  /** Tipos de técnica a mostrar en la comparativa por tipo (mismo tipo entre ambos jugadores). */
  private readonly COMPARATIVA_TYPE_ORDER: { key: string; label: string }[] = [
    { key: 'remate', label: 'Remate' },
    { key: 'volea', label: 'Volea' },
    { key: 'cabezazo', label: 'Cabezazo' },
    { key: 'pase', label: 'Pase' },
    { key: 'pared', label: 'Pared' },
    { key: 'regate', label: 'Regate' },
    { key: 'entrada', label: 'Entrada' },
    { key: 'bloqueo', label: 'Bloqueo' },
    { key: 'intercepción', label: 'Intercepción' },
    { key: 'puño', label: 'Puño' },
    { key: 'blocaje', label: 'Blocaje' }
  ];

  /** URL del icono de un tipo de técnica para la comparativa (por typeKey). */
  getComparativaTypeIconUrl(typeKey: string): string {
    const key = (typeKey || '').toLowerCase();
    const iconFile = key === 'intercepción' ? 'intercepcion.png' : key === 'puño' ? 'puno.png' : `${key}.png`;
    return `${this.iconsBaseUrl}/${iconFile}`;
  }

  getComparativaByTypeRows(): ComparativaByTypeRow[] {
    const rows = this.COMPARATIVA_TYPE_ORDER.map(row => ({ typeKey: row.key, label: row.label }));
    const players = this.getComparativaPlayers();
    return rows.filter(row => {
      for (let i = 0; i < players.length; i++) {
        if (this.getComparativaMomentumForPlayer(i, row) > 0) return true;
      }
      return false;
    });
  }

  getComparativaLeftTechnique(row: ComparativaByTypeRow): Technique | null {
    return this.getBestTechniqueWithGlobalBonuses(row.typeKey);
  }

  getComparativaRightTechnique(row: ComparativaByTypeRow): Technique | null {
    return this.getBestOpponentTechniqueWithGlobalBonuses(row.typeKey);
  }

  getComparativaLeftMomentum(row: ComparativaByTypeRow): number {
    return this.getMomentumWithGlobalBonuses(row.typeKey);
  }

  getComparativaRightMomentum(row: ComparativaByTypeRow): number {
    return this.getOpponentMomentumWithGlobalBonuses(row.typeKey);
  }

  private getComparativaBarExponent(ratio: number): number {
    if (ratio <= 1) return 10;
    const ln = Math.log(ratio);
    if (ln < 0.001) return 10;
    return this.COMPARE_BAR_N_A + this.COMPARE_BAR_N_B / ln;
  }

  getComparativaBarLeftPct(row: ComparativaByTypeRow): number {
    const left = this.getComparativaLeftMomentum(row);
    const right = this.getComparativaRightMomentum(row);
    if (left === 0 && right === 0) return 50;
    if (right === 0) return 100;
    if (left === 0) return 0;
    const ratio = right / left;
    if (ratio <= 1) {
      if (ratio >= 0.999) return 50;
      const ratioInv = left / right;
      const n = this.getComparativaBarExponent(ratioInv);
      const leftPct = 100 * Math.pow(ratioInv, n) / (1 + Math.pow(ratioInv, n));
      return Math.round(leftPct * 10) / 10;
    }
    const n = this.getComparativaBarExponent(ratio);
    const leftPct = 100 / (1 + Math.pow(ratio, n));
    return Math.round(leftPct * 10) / 10;
  }

  getComparativaBarRightPct(row: ComparativaByTypeRow): number {
    const left = this.getComparativaLeftMomentum(row);
    const right = this.getComparativaRightMomentum(row);
    if (left === 0 && right === 0) return 50;
    if (left === 0) return 100;
    if (right === 0) return 0;
    return Math.round((100 - this.getComparativaBarLeftPct(row)) * 10) / 10;
  }

  /** Momentum de una técnica del jugador actual en comparativa. Defensor (entrada/bloqueo/intercepción) sí aplica Maestro de los duelos; atacante no. */
  getTechniqueMomentumForCompare(technique: Technique, teamSkill: number, bond: number): number {
    if (!this.player) return 0;
    const type = technique.type?.toLowerCase();
    const isDefenseType = type === 'entrada' || type === 'bloqueo' || type === 'intercepción';
    const excludeDuelMaster = !isDefenseType; // Defensor sí aplica Maestro de los duelos
    let base: number;
    let ballTypeModifier = 0;
    if (type === 'remate') {
      base = this.getInGameStatForCompare('shot', teamSkill, bond, excludeDuelMaster);
    } else if (type === 'volea') {
      base = this.getInGameStatForCompare('shot', teamSkill, bond, excludeDuelMaster);
      if (technique.appliesLowBallBonus !== false) {
        ballTypeModifier = base * this.getBallSkillBonus(this.player.groundBallSkill) / 100;
      }
    } else if (type === 'cabezazo') {
      base = this.getInGameStatForCompare('shot', teamSkill, bond, excludeDuelMaster);
      if (technique.appliesHighBallBonus !== false) {
        ballTypeModifier = base * this.getBallSkillBonus(this.player.highBallSkill) / 100;
      }
    } else if (type === 'pase' || type === 'pared') {
      base = this.getInGameStatForCompare('pass', teamSkill, bond, excludeDuelMaster);
    } else if (type === 'regate') {
      base = this.getInGameStatForCompare('dribble', teamSkill, bond, excludeDuelMaster);
    } else if (type === 'entrada') {
      base = this.getInGameStatForCompare('tackle', teamSkill, bond, excludeDuelMaster);
    } else if (type === 'bloqueo') {
      base = this.getInGameStatForCompare('block', teamSkill, bond, excludeDuelMaster);
    } else if (type === 'intercepción') {
      base = this.getInGameStatForCompare('intercept', teamSkill, bond, excludeDuelMaster);
    } else {
      return 0;
    }
    const opp = this.getSelectedOpponent();
    let powerBase = technique.power + (opp && this.hasAffinityAdvantage(this.player.element?.name ?? '', opp.element?.name ?? '') ? this.AFFINITY_POWER_BONUS : 0);
    if (isDefenseType) powerBase += this.DEFENSIVE_DUEL_POWER_BONUS; // Adivinar duelo: +100 en defensa (campo, no portero)
    const modifiedPower = this.getModifiedTechniquePower(powerBase, technique, excludeDuelMaster);
    return Math.round((base * modifiedPower) / 100 + ballTypeModifier);
  }

  /** Mejor técnica del jugador actual por tipo (ataque o defensa) para comparativa */
  getBestTechniqueForCompareType(typeKey: 'remate' | 'volea' | 'cabezazo' | 'pase' | 'pared' | 'regate' | 'entrada' | 'bloqueo' | 'intercepción'): Technique | null {
    const list = this.allTechniques.filter(t => t.type?.toLowerCase() === typeKey);
    if (list.length === 0) return null;
    const withMomentum = list.map(t => ({ tech: t, mom: this.getTechniqueMomentumForCompare(t, this.compareCurrentTeamSkill, this.compareCurrentBond) }));
    withMomentum.sort((a, b) => b.mom - a.mom);
    return withMomentum[0]?.tech ?? null;
  }

  /** Momentum del jugador actual en comparativa para un tipo de ataque o defensa */
  getCompareMomentumCurrent(typeKey: 'remate' | 'volea' | 'cabezazo' | 'pase' | 'pared' | 'regate' | 'entrada' | 'bloqueo' | 'intercepción'): number {
    const tech = this.getBestTechniqueForCompareType(typeKey);
    if (!tech) return 0;
    return this.getTechniqueMomentumForCompare(tech, this.compareCurrentTeamSkill, this.compareCurrentBond);
  }

  // --- Comparativa: portero con todos los bonos (pasiva + latentes) y TS/Bono elegidos ---

  private collectAllBonusesForGk(gk: Player, excludeDuelMaster = false): SkillBonus[] {
    const passive = (excludeDuelMaster && this.isDuelMasterSkillName(gk.passiveSkill?.name))
      ? [] : (gk.passiveSkill?.bonuses ?? []);
    const latents = (gk.latentSkills ?? [])
      .filter(s => !excludeDuelMaster || !this.isDuelMasterSkillName(s.name))
      .flatMap(s => s.bonuses ?? []);
    return [...passive, ...latents];
  }

  private getGkModifiedStatWithBonuses(gk: Player, baseStat: number, statName: StatName, teamSkill: number, bond: number, associatedStats: StatName[], gkFormationId: string, excludeDuelMaster = false): number {
    let stat = baseStat;
    if (associatedStats.includes(statName)) stat += 1000;
    if (PHYSICAL_STATS.includes(statName as typeof PHYSICAL_STATS[number])) stat += 2400;
    else if (ATTACK_STATS.includes(statName as typeof ATTACK_STATS[number])) stat += 1200;
    else if (DEFENSE_STATS.includes(statName as typeof DEFENSE_STATS[number])) stat += 1200;
    else if (SAVE_STATS.includes(statName as typeof SAVE_STATS[number])) stat += 1200;
    const bonuses = this.collectAllBonusesForGk(gk, excludeDuelMaster);
    const statBonus = bonuses.reduce((sum, b) => {
      const match = (b.type === 'stat' && b.statName === statName) || b.type === 'all_stats';
      return match ? sum + b.value : sum;
    }, 0);
    const formation = this.formationsService.getFormationById(gkFormationId);
    const formationBonus = this.formationsService.getFormationBonus(formation ?? undefined, statName, gk.positions?.includes('PO') ?? false);
    stat = Math.round(stat * (1 + (teamSkill + formationBonus) / 100));
    stat = Math.round(stat * (1 + (statBonus + bond) / 100));
    return stat;
  }

  private getGkInGamePunchBaseWithBonuses(gk: Player, teamSkill: number, bond: number, gkFormationId: string, excludeDuelMaster = false): number {
    const punch = this.getGkModifiedStatWithBonuses(gk, gk.stats.punch ?? 0, 'punch', teamSkill, bond, ['punch', 'power', 'speed'], gkFormationId, excludeDuelMaster);
    const speed = this.getGkModifiedStatWithBonuses(gk, gk.stats.speed ?? 0, 'speed', teamSkill, bond, ['punch', 'power', 'speed'], gkFormationId, excludeDuelMaster);
    const power = this.getGkModifiedStatWithBonuses(gk, gk.stats.power ?? 0, 'power', teamSkill, bond, ['punch', 'power', 'speed'], gkFormationId, excludeDuelMaster);
    return Math.round(punch + (speed + power) / 4);
  }

  private getGkInGameCatchBaseWithBonuses(gk: Player, teamSkill: number, bond: number, gkFormationId: string, excludeDuelMaster = false): number {
    const catchStat = this.getGkModifiedStatWithBonuses(gk, gk.stats.catchStat ?? 0, 'catchStat', teamSkill, bond, ['catchStat', 'power', 'technique'], gkFormationId, excludeDuelMaster);
    const power = this.getGkModifiedStatWithBonuses(gk, gk.stats.power ?? 0, 'power', teamSkill, bond, ['catchStat', 'power', 'technique'], gkFormationId, excludeDuelMaster);
    const technique = this.getGkModifiedStatWithBonuses(gk, gk.stats.technique ?? 0, 'technique', teamSkill, bond, ['catchStat', 'power', 'technique'], gkFormationId, excludeDuelMaster);
    return Math.round(catchStat + (power + technique) / 4);
  }

  private getGkModifiedTechniquePower(gk: Player, basePower: number, technique: Technique, excludeDuelMaster = false): number {
    const bonuses = this.collectAllBonusesForGk(gk, excludeDuelMaster);
    const powerBonus = bonuses.reduce((sum, b) => {
      if (b.type === 'tech_power_all') return sum + b.value;
      if (b.type === 'tech_power_type' && b.techniqueType && technique.type?.toLowerCase() === b.techniqueType.toLowerCase()) return sum + b.value;
      if (b.type === 'tech_power_combined' && technique.isCombined) return sum + b.value;
      if (b.type === 'tech_power_specific' && b.techniqueIds?.includes(technique.id)) return sum + b.value;
      return sum;
    }, 0);
    if (powerBonus === 0) return basePower;
    return Math.round(basePower * (1 + powerBonus / 100));
  }

  /** shotType: volea = balón bajo → bono groundBallSkill; cabezazo = balón alto → bono highBallSkill; remate = sin bono balón. Afinidad: +25 poder si el portero tiene ventaja sobre el tirador. */
  /** Momentum de parada de un portero. shooterElement = elemento del que tira (el "otro" en el duelo) para aplicar bono de afinidad solo cuando el GK le gana. */
  private getGkTechniqueMomentum(gk: Player, technique: Technique, teamSkill: number, bond: number, gkFormationId: string, shotType?: 'remate' | 'volea' | 'cabezazo', excludeDuelMaster = false, shooterElement?: string): number {
    const type = technique.type?.toLowerCase();
    let base: number;
    if (type === 'puño') {
      base = this.getGkInGamePunchBaseWithBonuses(gk, teamSkill, bond, gkFormationId, excludeDuelMaster);
    } else if (type === 'blocaje') {
      base = this.getGkInGameCatchBaseWithBonuses(gk, teamSkill, bond, gkFormationId, excludeDuelMaster);
    } else return 0;
    const powerBase = technique.power + (shooterElement && this.hasAffinityAdvantage(gk.element?.name ?? '', shooterElement) ? this.AFFINITY_POWER_BONUS : 0);
    const modifiedPower = this.getGkModifiedTechniquePower(gk, powerBase, technique, excludeDuelMaster);
    const baseMom = (base * modifiedPower) / 100;
    let ballModifier = 0;
    // El bono de balón en paradas depende del tipo de tiro (volea/cabezazo); la técnica del GK no tiene appliesLow/High
    if (shotType === 'volea') {
      ballModifier = base * this.getBallSkillBonus(gk.groundBallSkill) / 100;
    } else if (shotType === 'cabezazo') {
      ballModifier = base * this.getBallSkillBonus(gk.highBallSkill) / 100;
    }
    return Math.round(baseMom + ballModifier);
  }

  /** Momentum del portero en comparativa (mejor entre Puño y Blocaje). shooterElement = quien tira, para bono afinidad solo cuando el GK le gana. */
  getGkSaveMomentum(gk: Player, techniques: Technique[], teamSkill: number, bond: number, formationId: string, shotType?: 'remate' | 'volea' | 'cabezazo', excludeDuelMaster = false, shooterElement?: string): number {
    let maxMom = 0;
    for (const tech of techniques) {
      const t = tech.type?.toLowerCase();
      if (t === 'puño' || t === 'blocaje') {
        const mom = this.getGkTechniqueMomentum(gk, tech, teamSkill, bond, formationId, shotType, excludeDuelMaster, shooterElement);
        if (mom > maxMom) maxMom = mom;
      }
    }
    return maxMom;
  }

  /** Mejor técnica de parada del portero. En comparativa pasar excludeDuelMaster=true (portero nunca aplica Maestro de los duelos). */
  getBestGkSaveTechnique(gk: Player, techniques: Technique[], teamSkill: number, bond: number, formationId: string, shotType?: 'remate' | 'volea' | 'cabezazo', shooterElement?: string, excludeDuelMaster = true): Technique | null {
    let best: Technique | null = null;
    let maxMom = 0;
    for (const tech of techniques) {
      const t = tech.type?.toLowerCase();
      if (t === 'puño' || t === 'blocaje') {
        const mom = this.getGkTechniqueMomentum(gk, tech, teamSkill, bond, formationId, shotType, excludeDuelMaster, shooterElement);
        if (mom > maxMom) {
          maxMom = mom;
          best = tech;
        }
      }
    }
    return best;
  }

  /** Filas de comparativa según si actual y rival son GK o campo */
  getCompareRows(): CompareRow[] {
    const currentIsGK = this.isGoalkeeper();
    const opp = this.getSelectedOpponent();
    const opponentIsGK = this.isOpponentGoalkeeper();
    if (!this.player || !opp) return [];

    if (currentIsGK && opponentIsGK) return []; // GK vs GK: sin filas por ahora
    if (currentIsGK && !opponentIsGK) {
      return [
        { attackTypeKey: 'remate', defendTypeKey: 'gk_save', label: 'Remate', attackerIsCurrent: false },
        { attackTypeKey: 'volea', defendTypeKey: 'gk_save', label: 'Volea', attackerIsCurrent: false },
        { attackTypeKey: 'cabezazo', defendTypeKey: 'gk_save', label: 'Cabezazo', attackerIsCurrent: false }
      ];
    }
    if (!currentIsGK && opponentIsGK) {
      return [
        { attackTypeKey: 'remate', defendTypeKey: 'gk_save', label: 'Remate', attackerIsCurrent: true },
        { attackTypeKey: 'volea', defendTypeKey: 'gk_save', label: 'Volea', attackerIsCurrent: true },
        { attackTypeKey: 'cabezazo', defendTypeKey: 'gk_save', label: 'Cabezazo', attackerIsCurrent: true }
      ];
    }
    // Campo vs campo: yo ataco y rival defiende + yo defiendo y rival ataca
    return [
      { attackTypeKey: 'pase', defendTypeKey: 'intercepción', label: 'Pase', attackerIsCurrent: true },
      { attackTypeKey: 'pared', defendTypeKey: 'intercepción', label: 'Pared', attackerIsCurrent: true },
      { attackTypeKey: 'remate', defendTypeKey: 'bloqueo', label: 'Remate', attackerIsCurrent: true },
      { attackTypeKey: 'volea', defendTypeKey: 'bloqueo', label: 'Volea', attackerIsCurrent: true },
      { attackTypeKey: 'cabezazo', defendTypeKey: 'bloqueo', label: 'Cabezazo', attackerIsCurrent: true },
      { attackTypeKey: 'regate', defendTypeKey: 'entrada', label: 'Regate', attackerIsCurrent: true },
      { attackTypeKey: 'pase', defendTypeKey: 'intercepción', label: 'Intercepción vs Pase', attackerIsCurrent: false },
      { attackTypeKey: 'pared', defendTypeKey: 'intercepción', label: 'Intercepción vs Pared', attackerIsCurrent: false },
      { attackTypeKey: 'remate', defendTypeKey: 'bloqueo', label: 'Bloqueo vs Remate', attackerIsCurrent: false },
      { attackTypeKey: 'volea', defendTypeKey: 'bloqueo', label: 'Bloqueo vs Volea', attackerIsCurrent: false },
      { attackTypeKey: 'cabezazo', defendTypeKey: 'bloqueo', label: 'Bloqueo vs Cabezazo', attackerIsCurrent: false },
      { attackTypeKey: 'regate', defendTypeKey: 'entrada', label: 'Entrada vs Regate', attackerIsCurrent: false }
    ];
  }

  /** Filtra filas de comparativa: solo las que tienen técnica el atacante y el defensor */
  getCompareRowsFiltered(): CompareRow[] {
    return this.getCompareRows().filter(row => {
      const leftTech = this.getCompareLeftTechnique(row);
      const rightTech = this.getCompareRightTechnique(row);
      return leftTech != null && rightTech != null;
    });
  }

  /** Izquierda = siempre jugador actual; derecha = siempre rival */
  getCompareLeftTechnique(row: CompareRow): Technique | null {
    if (row.attackerIsCurrent) return this.getBestTechniqueForCompareType(row.attackTypeKey);
    return this.getBestCurrentDefenseTechnique(row);
  }

  getCompareRightTechnique(row: CompareRow): Technique | null {
    if (row.attackerIsCurrent) return this.getBestOpponentDefenseTechnique(row);
    return this.getBestOpponentTechnique(row.attackTypeKey);
  }

  getCompareLeftMomentum(row: CompareRow): number {
    if (row.attackerIsCurrent) return this.getCompareMomentumCurrent(row.attackTypeKey);
    return this.getCurrentDefendMomentum(row);
  }

  getCompareRightMomentum(row: CompareRow): number {
    if (row.attackerIsCurrent) return this.getOpponentDefendMomentum(row);
    return this.getOpponentAttackMomentum(row.attackTypeKey);
  }

  /** Parámetros para % barra: 100/(1+ratio^n) con n = COMPARE_BAR_N_A + COMPARE_BAR_N_B/ln(ratio). Ajustado a: 1604121 vs 1716558 → 33.8% vs 66.2%; 1645913 vs 1687666 → 35.1% vs 64.9% */
  private readonly COMPARE_BAR_N_A = 1.36;
  private readonly COMPARE_BAR_N_B = 0.581;

  private getCompareBarExponent(ratio: number): number {
    if (ratio <= 1) return 10;
    const ln = Math.log(ratio);
    if (ln < 0.001) return 10;
    return this.COMPARE_BAR_N_A + this.COMPARE_BAR_N_B / ln;
  }

  getCompareBarLeftPct(row: CompareRow): number {
    const left = this.getCompareLeftMomentum(row);
    const right = this.getCompareRightMomentum(row);
    if (left === 0 && right === 0) return 50;
    if (right === 0) return 100;
    if (left === 0) return 0;
    const ratio = right / left;
    if (ratio <= 1) {
      if (ratio >= 0.999) return 50;
      const ratioInv = left / right;
      const n = this.getCompareBarExponent(ratioInv);
      const leftPct = 100 * Math.pow(ratioInv, n) / (1 + Math.pow(ratioInv, n));
      return Math.round(leftPct * 10) / 10;
    }
    const n = this.getCompareBarExponent(ratio);
    const leftPct = 100 / (1 + Math.pow(ratio, n));
    return Math.round(leftPct * 10) / 10;
  }

  getCompareBarRightPct(row: CompareRow): number {
    const left = this.getCompareLeftMomentum(row);
    const right = this.getCompareRightMomentum(row);
    if (left === 0 && right === 0) return 50;
    if (left === 0) return 100;
    if (right === 0) return 0;
    const leftPct = this.getCompareBarLeftPct(row);
    return Math.round((100 - leftPct) * 10) / 10;
  }

  /** Técnica de defensa del rival (Intercepción/Bloqueo/Entrada o parada GK) */
  private getBestOpponentDefenseTechnique(row: CompareRow): Technique | null {
    const opp = this.getSelectedOpponent();
    if (!opp || this.opponentTechniques.length === 0) return null;
    if (row.defendTypeKey === 'gk_save') {
      const shotType: 'remate' | 'volea' | 'cabezazo' = row.attackTypeKey as 'remate' | 'volea' | 'cabezazo';
      return this.getBestGkSaveTechnique(opp, this.opponentTechniques, this.compareOpponentTeamSkill, this.compareOpponentBond, this.compareOpponentFormationId, shotType, this.player?.element?.name);
    }
    const typeKey = row.defendTypeKey;
    return this.getBestOpponentTechniqueByType(typeKey);
  }

  /** Técnica de defensa del jugador actual: GK = parada; campo = entrada/bloqueo/intercepción */
  private getBestCurrentDefenseTechnique(row: CompareRow): Technique | null {
    if (!this.player) return null;
    if (this.isGoalkeeper()) {
      const shotType: 'remate' | 'volea' | 'cabezazo' = row.attackTypeKey as 'remate' | 'volea' | 'cabezazo';
      return this.getBestGkSaveTechnique(this.player, this.allTechniques, this.compareCurrentTeamSkill, this.compareCurrentBond, this.compareCurrentFormationId, shotType, this.getSelectedOpponent()?.element?.name);
    }
    if (row.defendTypeKey === 'entrada' || row.defendTypeKey === 'bloqueo' || row.defendTypeKey === 'intercepción') {
      return this.getBestTechniqueForCompareType(row.defendTypeKey);
    }
    return null;
  }

  /** Momentum de defensa del rival. Si es GK nunca aplica Maestro de los duelos; si es campo defensor sí. */
  private getOpponentDefendMomentum(row: CompareRow): number {
    const opp = this.getSelectedOpponent();
    if (!opp || this.opponentTechniques.length === 0) return 0;
    if (row.defendTypeKey === 'gk_save') {
      const shotType: 'remate' | 'volea' | 'cabezazo' = row.attackTypeKey as 'remate' | 'volea' | 'cabezazo';
      return this.getGkSaveMomentum(opp, this.opponentTechniques, this.compareOpponentTeamSkill, this.compareOpponentBond, this.compareOpponentFormationId, shotType, true, this.player?.element?.name);
    }
    const tech = this.getBestOpponentTechniqueByType(row.defendTypeKey);
    if (!tech) return 0;
    return this.getOpponentFieldMomentum(opp, tech, this.compareOpponentTeamSkill, this.compareOpponentBond, this.compareOpponentFormationId, true);
  }

  /** Momentum de defensa del jugador actual: GK nunca aplica Maestro de los duelos; campo defensor (entrada/bloqueo/intercepción) sí. */
  private getCurrentDefendMomentum(row: CompareRow): number {
    if (!this.player) return 0;
    if (this.isGoalkeeper()) {
      const shotType: 'remate' | 'volea' | 'cabezazo' = row.attackTypeKey as 'remate' | 'volea' | 'cabezazo';
      return this.getGkSaveMomentum(this.player, this.allTechniques, this.compareCurrentTeamSkill, this.compareCurrentBond, this.compareCurrentFormationId, shotType, true, this.getSelectedOpponent()?.element?.name);
    }
    if (row.defendTypeKey === 'entrada' || row.defendTypeKey === 'bloqueo' || row.defendTypeKey === 'intercepción') {
      return this.getCompareMomentumCurrent(row.defendTypeKey);
    }
    return 0;
  }

  /** Momentum de ataque del rival (campo). Atacante no aplica Maestro de los duelos. */
  private getOpponentAttackMomentum(attackTypeKey: 'remate' | 'volea' | 'cabezazo' | 'pase' | 'pared' | 'regate'): number {
    const opp = this.getSelectedOpponent();
    if (!opp || this.opponentTechniques.length === 0) return 0;
    const tech = this.getBestOpponentTechnique(attackTypeKey);
    if (!tech) return 0;
    return this.getOpponentFieldMomentum(opp, tech, this.compareOpponentTeamSkill, this.compareOpponentBond, this.compareOpponentFormationId, false);
  }

  /** Mejor técnica del rival por tipo (ataque o defensa) */
  getBestOpponentTechnique(typeKey: 'remate' | 'volea' | 'cabezazo' | 'pase' | 'pared' | 'regate'): Technique | null {
    return this.getBestOpponentTechniqueByType(typeKey);
  }

  private getBestOpponentTechniqueByType(typeKey: string): Technique | null {
    const list = this.opponentTechniques.filter(t => t.type?.toLowerCase() === typeKey.toLowerCase());
    if (list.length === 0) return null;
    const opp = this.getSelectedOpponent();
    if (!opp) return null;
    const isOpponentDefending = typeKey === 'entrada' || typeKey === 'bloqueo' || typeKey === 'intercepción';
    const withMom = list.map(t => ({ tech: t, mom: this.getOpponentFieldMomentum(opp, t, this.compareOpponentTeamSkill, this.compareOpponentBond, this.compareOpponentFormationId, isOpponentDefending) }));
    withMom.sort((a, b) => b.mom - a.mom);
    return withMom[0]?.tech ?? null;
  }

  /** Momentum de un jugador de campo (ataque o defensa). isOpponentDefending: defensor sí aplica skill Maestro de los duelos. skipAffinityBonus: true en Comparativa. skipDefensiveDuelPowerBonus: true en Comparativa (no aplicar +100 por acertar duelo). */
  private getOpponentFieldMomentum(player: Player, technique: Technique, teamSkill: number, bond: number, formationId: string, isOpponentDefending = false, skipAffinityBonus = false, skipDefensiveDuelPowerBonus = false): number {
    const type = technique.type?.toLowerCase();
    const excludeDuelMaster = !isOpponentDefending; // Defensor sí aplica la skill Maestro de los duelos
    const associatedStats = this.getAssociatedStatsForTechnique(type);
    let baseStat = 0;
    let ballMod = 0;
    if (type === 'remate') {
      baseStat = this.getFieldPlayerStatWithBonuses(player, 'shot', excludeDuelMaster, associatedStats, teamSkill, bond, formationId);
    } else if (type === 'volea') {
      baseStat = this.getFieldPlayerStatWithBonuses(player, 'shot', excludeDuelMaster, associatedStats, teamSkill, bond, formationId);
      if (technique.appliesLowBallBonus !== false) {
        ballMod = baseStat * this.getBallSkillBonus(player.groundBallSkill) / 100;
      }
    } else if (type === 'cabezazo') {
      baseStat = this.getFieldPlayerStatWithBonuses(player, 'shot', excludeDuelMaster, associatedStats, teamSkill, bond, formationId);
      if (technique.appliesHighBallBonus !== false) {
        ballMod = baseStat * this.getBallSkillBonus(player.highBallSkill) / 100;
      }
    } else if (type === 'regate') {
      baseStat = this.getFieldPlayerStatWithBonuses(player, 'dribble', excludeDuelMaster, associatedStats, teamSkill, bond, formationId);
    } else if (type === 'pase' || type === 'pared') {
      baseStat = this.getFieldPlayerStatWithBonuses(player, 'pass', excludeDuelMaster, associatedStats, teamSkill, bond, formationId);
    } else if (type === 'entrada') {
      baseStat = this.getFieldPlayerStatWithBonuses(player, 'tackle', excludeDuelMaster, associatedStats, teamSkill, bond, formationId);
    } else if (type === 'bloqueo') {
      baseStat = this.getFieldPlayerStatWithBonuses(player, 'block', excludeDuelMaster, associatedStats, teamSkill, bond, formationId);
    } else if (type === 'intercepción') {
      baseStat = this.getFieldPlayerStatWithBonuses(player, 'intercept', excludeDuelMaster, associatedStats, teamSkill, bond, formationId);
    } else return 0;
    let powerBase = technique.power;
    if (!skipAffinityBonus && this.player && this.hasAffinityAdvantage(player.element?.name ?? '', this.player.element?.name ?? '')) {
      powerBase += this.AFFINITY_POWER_BONUS;
    }
    if (isOpponentDefending && !skipDefensiveDuelPowerBonus) powerBase += this.DEFENSIVE_DUEL_POWER_BONUS; // +100 por acertar duelo: no en Comparativa
    const modifiedPower = this.getFieldPlayerModifiedTechniquePower(player, powerBase, technique, excludeDuelMaster);
    return Math.round((baseStat * modifiedPower) / 100 + ballMod);
  }

  private getAssociatedStatsForTechnique(techniqueType: string): StatName[] {
    const type = techniqueType.toLowerCase();
    if (type === 'remate' || type === 'volea' || type === 'cabezazo') return ['shot', 'power'];
    if (type === 'regate') return ['dribble', 'speed'];
    if (type === 'pase' || type === 'pared') return ['pass', 'technique'];
    if (type === 'entrada') return ['tackle', 'speed'];
    if (type === 'bloqueo') return ['block', 'power'];
    if (type === 'intercepción') return ['intercept', 'technique'];
    return [];
  }

  private getFieldPlayerStatWithBonuses(player: Player, statName: StatName, excludeDuelMaster: boolean, associatedStats: StatName[], teamSkill: number, bond: number, formationId: string): number {
    let stat = player.stats[statName] ?? 0;
    if (associatedStats.includes(statName)) stat += 1000;
    if (PHYSICAL_STATS.includes(statName as typeof PHYSICAL_STATS[number])) stat += 2400;
    else if (ATTACK_STATS.includes(statName as typeof ATTACK_STATS[number])) stat += 1200;
    else if (DEFENSE_STATS.includes(statName as typeof DEFENSE_STATS[number])) stat += 1200;
    else if (SAVE_STATS.includes(statName as typeof SAVE_STATS[number])) stat += 1200;
    const bonuses = this.collectAllBonusesForGk(player, excludeDuelMaster);
    const statBonus = bonuses.reduce((sum, b) => {
      const match = (b.type === 'stat' && b.statName === statName) || b.type === 'all_stats';
      return match ? sum + b.value : sum;
    }, 0);
    const formation = this.formationsService.getFormationById(formationId);
    const formationBonus = this.formationsService.getFormationBonus(formation ?? undefined, statName, player.positions?.includes('PO') ?? false);
    stat = Math.round(stat * (1 + (teamSkill + formationBonus) / 100));
    stat = Math.round(stat * (1 + (statBonus + bond) / 100));
    const physicalStatName = ASSOCIATE_PHYSICAL_STATS[statName];
    const physStat = player.stats[physicalStatName] ?? 0;
    let physMod = physStat;
    if (associatedStats.includes(physicalStatName)) physMod += 1000;
    if (PHYSICAL_STATS.includes(physicalStatName as typeof PHYSICAL_STATS[number])) physMod += 2400;
    else if (ATTACK_STATS.includes(physicalStatName as typeof ATTACK_STATS[number])) physMod += 1200;
    else if (DEFENSE_STATS.includes(physicalStatName as typeof DEFENSE_STATS[number])) physMod += 1200;
    else if (SAVE_STATS.includes(physicalStatName as typeof SAVE_STATS[number])) physMod += 1200;
    const physBonus = bonuses.reduce((sum, b) => {
      const m = (b.type === 'stat' && b.statName === physicalStatName) || b.type === 'all_stats';
      return m ? sum + b.value : sum;
    }, 0);
    const formationBonusPhys = this.formationsService.getFormationBonus(formation ?? undefined, physicalStatName, player.positions?.includes('PO') ?? false);
    physMod = Math.round(physMod * (1 + (teamSkill + formationBonusPhys) / 100));
    physMod = Math.round(physMod * (1 + (physBonus + bond) / 100));
    return Math.round(stat + physMod / 2);
  }

  private getFieldPlayerModifiedTechniquePower(player: Player, basePower: number, technique: Technique, excludeDuelMaster = false): number {
    const bonuses = this.collectAllBonusesForGk(player, excludeDuelMaster);
    const powerBonus = bonuses.reduce((sum, b) => {
      if (b.type === 'tech_power_all') return sum + b.value;
      if (b.type === 'tech_power_type' && b.techniqueType && technique.type?.toLowerCase() === b.techniqueType.toLowerCase()) return sum + b.value;
      if (b.type === 'tech_power_combined' && technique.isCombined) return sum + b.value;
      if (b.type === 'tech_power_specific' && b.techniqueIds?.includes(technique.id)) return sum + b.value;
      return sum;
    }, 0);
    if (powerBonus === 0) return basePower;
    return Math.round(basePower * (1 + powerBonus / 100));
  }

  /** Tipos de tiro a mostrar (solo remate/volea/cabezazo para compatibilidad con vista antigua; getCompareRowsFiltered usa todas las filas) */
  getCompareShotTypes(): Array<'remate' | 'volea' | 'cabezazo'> {
    const types: Array<'remate' | 'volea' | 'cabezazo'> = ['remate', 'volea', 'cabezazo'];
    return types.filter(t => this.getBestTechniqueForCompareType(t) != null);
  }

  /** Porcentaje del jugador para la barra (0-100) - por tipo para vista legacy */
  getCompareBarAttackerPct(typeKey: 'remate' | 'volea' | 'cabezazo'): number {
    const att = this.getCompareMomentumCurrent(typeKey);
    const gk = this.getCompareMomentumGk(typeKey);
    const total = att + gk;
    if (total === 0) return 50;
    return Math.round((att / total) * 100);
  }

  /** Porcentaje del portero para la barra (0-100) - por tipo para vista legacy */
  getCompareBarGoalkeeperPct(typeKey: 'remate' | 'volea' | 'cabezazo'): number {
    const att = this.getCompareMomentumCurrent(typeKey);
    const gk = this.getCompareMomentumGk(typeKey);
    const total = att + gk;
    if (total === 0) return 50;
    return Math.round((gk / total) * 100);
  }

  /** Momentum del portero rival en comparativa (para vista legacy campo vs GK). Portero nunca aplica Maestro de los duelos. */
  getCompareMomentumGk(typeKey: 'remate' | 'volea' | 'cabezazo'): number {
    const opp = this.getSelectedOpponent();
    if (!opp || !opp.positions?.includes('PO') || this.opponentTechniques.length === 0) return 0;
    return this.getGkSaveMomentum(opp, this.opponentTechniques, this.compareOpponentTeamSkill, this.compareOpponentBond, this.compareOpponentFormationId, typeKey, true, this.player?.element?.name);
  }

  /** Mejor técnica del portero rival (para vista legacy) */
  getBestGoalkeeperTechnique(typeKey: 'remate' | 'volea' | 'cabezazo'): Technique | null {
    const opp = this.getSelectedOpponent();
    if (!opp || !opp.positions?.includes('PO') || this.opponentTechniques.length === 0) return null;
    return this.getBestGkSaveTechnique(opp, this.opponentTechniques, this.compareOpponentTeamSkill, this.compareOpponentBond, this.compareOpponentFormationId, typeKey, this.player?.element?.name);
  }

  resetModifiers(): void {
    Object.keys(this.modifiers).forEach(key => {
      this.modifiers[key] = { percentage: 0, flat: 0 };
    });
    this.rompebarrerasLevel = 0;
    this.teamSkillBonus = 0;
    this.bondBonus = 0;
    this.formationId = 'ninguna';
    this.passiveSkillActive = false;
    this.activeLatentSkills.clear();
    this.selectedStats.clear();
  }

  goBack(): void {
    this.router.navigate(['/players']);
  }

  editPlayer(): void {
    if (this.player) {
      this.router.navigate(['/admin/player/edit', this.player.id]);
    }
  }

  /** Navega a la pantalla resumen con el estado actual (bonos y momentum aplicados). */
  goToResumen(): void {
    if (!this.player) return;
    const doNav = () => {
      const state = this.buildResumenState();
      this.resumenStateService.setState(state);
      this.router.navigate(['/players', this.player!.id, 'resumen']);
    };
    if (this.allTechniques.length === 0) {
      this.apiService.getAvailableTechniques(this.player.id).subscribe({
        next: (techniques) => {
          this.allTechniques = techniques;
          doNav();
        },
        error: () => doNav()
      });
    } else {
      doNav();
    }
  }

  private buildResumenState(): PlayerResumenState {
    const techniquesWithSummary: TechniqueWithSummary[] = (this.player!.techniques ?? []).map(t => ({
      technique: t,
      momentum: this.getTechniqueMomentum(t),
      modifiedStaminaCost: this.getModifiedStaminaCost(t.staminaCost)
    }));
    const best = this.getBestTechniques();
    const bestTechniquesWithSummary: TechniqueWithSummary[] = best.map(t => ({
      technique: t,
      momentum: this.getTechniqueMomentum(t),
      modifiedStaminaCost: this.getModifiedStaminaCost(t.staminaCost)
    }));
    return {
      player: this.player!,
      teamSkillBonus: this.teamSkillBonus,
      bondBonus: this.bondBonus,
      formationId: this.formationId,
      techniquesWithSummary,
      bestTechniquesWithSummary,
      passiveSkillActive: this.passiveSkillActive,
      activeLatentSkillIds: Array.from(this.activeLatentSkills)
    };
  }

  getElementColor(element: string): string {
    const elementLower = element.toLowerCase();
    if (elementLower.includes('agilidad')) return '#4169E1';
    if (elementLower.includes('fuerza')) return '#DC143C';
    if (elementLower.includes('destreza') || elementLower.includes('destreza')) return '#228B22';
    return '#888888';
  }

  getPositionColor(position: string): string {
    if (position.includes('FW')) return '#ff4444';
    if (position.includes('AM') || position.includes('MCD') || position.includes('MCA')) return '#4444ff';
    if (position.includes('DF') || position.includes('DM')) return '#44ff44';
    if (position.includes('GK')) return '#ffaa00';
    return '#888888';
  }

  getPositionsDisplay(positions: string[]): string {
    return positions.join(' / ');
  }

  getCountryFlag(countryName: string): string {
    if (!countryName) return '🏳️';

    const countryLower = countryName.toLowerCase();
    const flagMap: { [key: string]: string } = {
      'japón': '🇯🇵',
      'japon': '🇯🇵',
      'japan': '🇯🇵',
      'argentina': '🇦🇷',
      'alemania': '🇩🇪',
      'germany': '🇩🇪',
      'brasil': '🇧🇷',
      'brazil': '🇧🇷',
      'españa': '🇪🇸',
      'spain': '🇪🇸',
      'italia': '🇮🇹',
      'italy': '🇮🇹',
      'francia': '🇫🇷',
      'france': '🇫🇷',
      'méxico': '🇲🇽',
      'mexico': '🇲🇽',
      'uruguay': '🇺🇾',
      'paraguay': '🇵🇾',
      'chile': '🇨🇱',
      'colombia': '🇨🇴',
      'perú': '🇵🇪',
      'peru': '🇵🇪',
      'ecuador': '🇪🇨',
      'venezuela': '🇻🇪',
      'bolivia': '🇧🇴',
      'inglaterra': '🇬🇧',
      'england': '🇬🇧',
      'holanda': '🇳🇱',
      'netherlands': '🇳🇱',
      'portugal': '🇵🇹',
      'rusia': '🇷🇺',
      'russia': '🇷🇺',
      'china': '🇨🇳',
      'corea': '🇰🇷',
      'korea': '🇰🇷',
      'tailandia': '🇹🇭',
      'thailand': '🇹🇭',
      'senegal': '🇸🇳',
      'camerún': '🇨🇲',
      'cameroon': '🇨🇲',
      'nigeria': '🇳🇬',
      'egipto': '🇪🇬',
      'egypt': '🇪🇬',
      'túnez': '🇹🇳',
      'tunisia': '🇹🇳',
      'arabia saudí': '🇸🇦',
      'saudi arabia': '🇸🇦',
      'irán': '🇮🇷',
      'iran': '🇮🇷',
      'irak': '🇮🇶',
      'iraq': '🇮🇶',
      'turquía': '🇹🇷',
      'turkey': '🇹🇷',
      'polonia': '🇵🇱',
      'poland': '🇵🇱',
      'suecia': '🇸🇪',
      'sweden': '🇸🇪',
      'noruega': '🇳🇴',
      'norway': '🇳🇴',
      'dinamarca': '🇩🇰',
      'denmark': '🇩🇰',
      'grecia': '🇬🇷',
      'greece': '🇬🇷',
      'croacia': '🇭🇷',
      'croatia': '🇭🇷',
      'serbia': '🇷🇸',
      'chequia': '🇨🇿',
      'czech republic': '🇨🇿',
      'bélgica': '🇧🇪',
      'belgium': '🇧🇪',
      'suiza': '🇨🇭',
      'switzerland': '🇨🇭',
      'austria': '🇦🇹',
      'hungría': '🇭🇺',
      'hungary': '🇭🇺',
      'rumania': '🇷🇴',
      'romania': '🇷🇴',
      'bulgaria': '🇧🇬',
      'ucrania': '🇺🇦',
      'ukraine': '🇺🇦',
      'australia': '🇦🇺',
      'nueva zelanda': '🇳🇿',
      'new zealand': '🇳🇿',
      'canadá': '🇨🇦',
      'canada': '🇨🇦',
      'estados unidos': '🇺🇸',
      'united states': '🇺🇸',
      'usa': '🇺🇸',
    };

    // Buscar coincidencia exacta o parcial
    for (const [key, flag] of Object.entries(flagMap)) {
      if (countryLower.includes(key) || key.includes(countryLower)) {
        return flag;
      }
    }

    return '🏳️'; // Bandera genérica si no se encuentra
  }

  getMaxSelectedStats(): number {
    if (!this.isGoalkeeper()) return 8;
    return 5;
  }

  getImageUrl(player: Player | null): string {
    if (!player?.cardImageUrl) return '';
    if (player.cardImageUrl.startsWith('http')) return player.cardImageUrl;
    return `${this.imageBaseUrl}${player.cardImageUrl}`;
  }

  getTechImageUrl(technique: Technique | null): string {
    if (!technique?.type) return '';
    let techType = technique.type;
    if (techType === 'Intercepción') {
      techType = 'Intercepcion';
    } else if (techType === 'Puño') {
      techType = 'puno';
    }
    return `${this.iconsBaseUrl}/${techType.toLowerCase()}.png`;
  }

  setBallBonus(type: 'none' | 'low' | 'high'): void {
    if (!this.isGoalkeeper()) return; // Solo porteros pueden cambiarlo
    this.ballBonusType = this.ballBonusType === type ? 'none' : type; // clic de nuevo desactiva
  }

  private collectActiveBonuses(excludeDuelMaster = false): SkillBonus[] {
    const passive = (this.passiveSkillActive && this.player?.passiveSkill?.bonuses)
      ? (excludeDuelMaster && this.isDuelMasterSkillName(this.player.passiveSkill?.name) ? [] : this.player.passiveSkill.bonuses)
      : [];
    const latents = (this.player?.latentSkills ?? [])
      .filter(s => this.activeLatentSkills.has(s.id))
      .filter(s => !excludeDuelMaster || !this.isDuelMasterSkillName(s.name))
      .flatMap(s => s.bonuses ?? []);
    return [...passive, ...latents];
  }

  private readonly TECH_TYPE_HANDLERS: Record<string, () => number> = {
    regate:      () => this.getInGameStat('dribble'),
    cabezazo:    () => this.getInGameHeader(),
    volea:       () => this.getInGameVolley(),
    remate:      () => this.getInGameStat('shot'),
    pase:        () => this.getInGameStat('pass'),
    pared:       () => this.getInGameStat('pass'),
    entrada:     () => this.getInGameStat('tackle'),
    bloqueo:     () => this.getInGameStat('block'),
    'intercepción': () => this.getInGameStat('intercept'),
    puño:        () => this.getInGamePunchBase(),
    blocaje:     () => this.getInGameCatchBase()
  };
}
