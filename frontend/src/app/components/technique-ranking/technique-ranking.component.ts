import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Player } from '../../models/player.model';
import { Technique } from '../../models/technique.model';
import { ASSOCIATE_PHYSICAL_STATS } from '../../constants/associate-physical-stats';
import { PHYSICAL_STATS, ATTACK_STATS, DEFENSE_STATS, SAVE_STATS } from '../../constants/stats';
import { StatName, Formation } from '../../types/player-types';
import { FormationsService } from '../../services/formations.service';
import { PlayerPreferencesService } from '../../services/player-preferences.service';
import { SkillBonus } from '../../models/skills.model';
import { environment } from '../../../environments/environment';

interface TechniqueRanking {
  technique: Technique;
  player: Player;
  momentum: number;
}

@Component({
  selector: 'app-technique-ranking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './technique-ranking.component.html',
  styleUrl: './technique-ranking.component.css'
})
export class TechniqueRankingComponent implements OnInit {
  allRankings: TechniqueRanking[] = [];
  filteredRankings: TechniqueRanking[] = [];
  selectedType: string = '';
  loading = true;
  error = '';

  // Controles para Team Skill, Bond y Formación
  teamSkillBonus: number = 0;
  bondBonus: number = 0;
  formationId = 'ninguna';
  formations: Formation[] = [];

  imageBaseUrl = environment.apiBaseUrl;
  iconsBaseUrl = environment.apiBaseUrl + '/icons';

  // Tipos de técnicas disponibles
  techniqueTypes = [
    { name: 'Remate', icon: 'remate.png', key: 'remate' },
    { name: 'Volea', icon: 'volea.png', key: 'volea' },
    { name: 'Cabezazo', icon: 'cabezazo.png', key: 'cabezazo' },
    { name: 'Regate', icon: 'regate.png', key: 'regate' },
    { name: 'Pase', icon: 'pase.png', key: 'pase' },
    { name: 'Pared', icon: 'pared.png', key: 'pared' },
    { name: 'Entrada', icon: 'entrada.png', key: 'entrada' },
    { name: 'Bloqueo', icon: 'bloqueo.png', key: 'bloqueo' },
    { name: 'Intercepción', icon: 'intercepcion.png', key: 'intercepción' },
    { name: 'Puño', icon: 'puno.png', key: 'puño' },
    { name: 'Blocaje', icon: 'blocaje.png', key: 'blocaje' }
  ];

  constructor(
    private apiService: ApiService,
    private formationsService: FormationsService,
    private preferencesService: PlayerPreferencesService
  ) {}

  ngOnInit(): void {
    this.formations = this.formationsService.getFormations();
    const prefs = this.preferencesService.getPreferences();
    if (prefs) {
      this.teamSkillBonus = prefs.teamSkillBonus;
      this.bondBonus = prefs.bondBonus;
      this.formationId = prefs.formationId || 'ninguna';
    }
    if (this.techniqueTypes.length > 0) {
      this.selectedType = this.techniqueTypes[0].key;
    }
    this.loadRankings();
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

  onBonusChange(): void {
    // Recalcular rankings cuando cambian los bonos
    if (this.allRankings.length > 0) {
      this.recalculateRankings();
    }
  }

  resetBonuses(): void {
    this.teamSkillBonus = 0;
    this.bondBonus = 0;
    this.formationId = 'ninguna';
    this.onBonusChange();
  }

  recalculateRankings(): void {
    // Recalcular momentum para todos los rankings con los nuevos bonos
    this.allRankings.forEach(ranking => {
      ranking.momentum = this.calculateTechniqueMomentum(ranking.player, ranking.technique);
    });

    // Reordenar y aplicar filtro
    this.allRankings.sort((a, b) => b.momentum - a.momentum);
    this.applyTypeFilter();
  }

  loadRankings(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getPlayers().subscribe({
      next: (players) => {
        // Obtener técnicas por nombre de jugador (igual que la pantalla de detalle "Mejores técnicas")
        const uniqueNames = [...new Set(players.map(p => p.name))];
        const techniquesRequests: Record<string, ReturnType<ApiService['getTechniquesByPlayerName']>> = {};
        uniqueNames.forEach(name => {
          techniquesRequests[name] = this.apiService.getTechniquesByPlayerName(name);
        });

        if (Object.keys(techniquesRequests).length === 0) {
          this.allRankings = [];
          this.applyTypeFilter();
          this.loading = false;
          return;
        }

        forkJoin(techniquesRequests).subscribe({
          next: (techniquesByPlayerName) => {
            this.calculateRankings(players, techniquesByPlayerName);
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Error al cargar las técnicas: ' + err.message;
            this.loading = false;
            console.error('Error loading techniques for ranking:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Error al cargar los datos: ' + err.message;
        this.loading = false;
        console.error('Error loading rankings:', err);
      }
    });
  }

  /**
   * Calcula el ranking usando las mejores técnicas por categoría para cada jugador,
   * con la misma lógica que la pantalla de detalle (técnicas por nombre de jugador en BD),
   * sin usar player.techniques (que son solo las técnicas propias de esa versión).
   */
  calculateRankings(players: Player[], techniquesByPlayerName: Record<string, Technique[]>): void {
    const rankings: TechniqueRanking[] = [];

    players.forEach(player => {
      const techniques = techniquesByPlayerName[player.name] || [];
      if (techniques.length === 0) return;

      techniques.forEach(technique => {
        const momentum = this.calculateTechniqueMomentum(player, technique);
        rankings.push({
          technique,
          player,
          momentum
        });
      });
    });

    // Ordenar por momentum descendente
    this.allRankings = rankings.sort((a, b) => b.momentum - a.momentum);
    this.applyTypeFilter();
  }

  calculateTechniqueMomentum(player: Player, technique: Technique): number {
    const type = technique.type.toLowerCase();

    // Determinar si es una técnica de tiro (no aplica "Maestro de los duelos")
    const isShot = type === 'remate' || type === 'volea' || type === 'cabezazo';

    // Determinar las estadísticas asociadas a esta técnica para aplicar el +1000
    const associatedStats = this.getAssociatedStatsForTechnique(type);

    // Obtener la estadística base según el tipo de técnica (con bonos de habilidades aplicados)
    let baseStat = 0;
    let ballTypeModifier = 0;

    if (type === 'remate') {
      baseStat = this.getInGameStatWithBonuses(player, 'shot', isShot, associatedStats);
    } else if (type === 'volea') {
      baseStat = this.getInGameStatWithBonuses(player, 'shot', isShot, associatedStats);
      if (technique.appliesLowBallBonus !== false) {
        const bonus = this.getBallSkillBonus(player.groundBallSkill);
        ballTypeModifier = baseStat * bonus / 100;
      }
    } else if (type === 'cabezazo') {
      baseStat = this.getInGameStatWithBonuses(player, 'shot', isShot, associatedStats);
      if (technique.appliesHighBallBonus !== false) {
        const bonus = this.getBallSkillBonus(player.highBallSkill);
        ballTypeModifier = baseStat * bonus / 100;
      }
    } else if (type === 'regate') {
      baseStat = this.getInGameStatWithBonuses(player, 'dribble', isShot, associatedStats);
    } else if (type === 'pase' || type === 'pared') {
      baseStat = this.getInGameStatWithBonuses(player, 'pass', isShot, associatedStats);
    } else if (type === 'entrada') {
      baseStat = this.getInGameStatWithBonuses(player, 'tackle', isShot, associatedStats);
    } else if (type === 'bloqueo') {
      baseStat = this.getInGameStatWithBonuses(player, 'block', isShot, associatedStats);
    } else if (type === 'intercepción') {
      baseStat = this.getInGameStatWithBonuses(player, 'intercept', isShot, associatedStats);
    } else if (type === 'puño') {
      baseStat = this.getInGamePunchBaseWithBonuses(player, isShot, associatedStats);
    } else if (type === 'blocaje') {
      baseStat = this.getInGameCatchBaseWithBonuses(player, isShot, associatedStats);
    }

    // Aplicar bonos de poder de técnica (excluyendo "Maestro de los duelos" para tiros)
    const modifiedPower = this.getModifiedTechniquePower(technique.power, player, isShot, technique);

    // Calcular momentum: (base * power / 100) + bonus de habilidad con balón si aplica
    const momentum = Math.round((baseStat * modifiedPower / 100) + ballTypeModifier);
    return momentum;
  }

  // Obtener las estadísticas asociadas a una técnica para aplicar el +1000
  getAssociatedStatsForTechnique(techniqueType: string): StatName[] {
    const type = techniqueType.toLowerCase();
    const stats: StatName[] = [];

    if (type === 'remate' || type === 'volea' || type === 'cabezazo') {
      stats.push('shot', 'power');
    } else if (type === 'regate') {
      stats.push('dribble', 'speed');
    } else if (type === 'pase' || type === 'pared') {
      stats.push('pass', 'technique');
    } else if (type === 'entrada') {
      stats.push('tackle', 'speed');
    } else if (type === 'bloqueo') {
      stats.push('block', 'power');
    } else if (type === 'intercepción') {
      stats.push('intercept', 'technique');
    } else if (type === 'puño') {
      stats.push('punch', 'power', 'speed');
    } else if (type === 'blocaje') {
      stats.push('catchStat', 'power', 'technique');
    }

    return stats;
  }

  getInGameStat(player: Player, statName: 'dribble' | 'shot' | 'pass' | 'tackle' | 'block' | 'intercept'): number {
    const statValue = player.stats[statName] ?? 0;
    const physicalStatName = ASSOCIATE_PHYSICAL_STATS[statName];
    const physicalValue = player.stats[physicalStatName] ?? 0;
    return Math.round(statValue + physicalValue / 2);
  }

  // Obtener estadística in-game con bonos de habilidades aplicados
  getInGameStatWithBonuses(player: Player, statName: StatName, excludeDuelMaster: boolean = false, associatedStats: StatName[] = []): number {
    // Aplicar bonos de habilidades a la estadística base
    const baseStat = player.stats[statName] ?? 0;
    const modifiedStat = this.getModifiedStatWithBonuses(baseStat, statName, player, excludeDuelMaster, associatedStats);

    // Obtener la estadística física asociada también con bonos
    const physicalStatName = ASSOCIATE_PHYSICAL_STATS[statName];
    const basePhysicalStat = player.stats[physicalStatName] ?? 0;
    const modifiedPhysicalStat = this.getModifiedStatWithBonuses(basePhysicalStat, physicalStatName, player, excludeDuelMaster, associatedStats);

    return Math.round(modifiedStat + modifiedPhysicalStat / 2);
  }

  // Aplicar bonos de habilidades a una estadística
  getModifiedStatWithBonuses(baseStat: number, statName: StatName, player: Player, excludeDuelMaster: boolean = false, associatedStats: StatName[] = []): number {
    let stat = baseStat;

    // Aplicar +1000 si esta estadística está en las asociadas a la técnica
    if (associatedStats.includes(statName)) {
      stat += 1000;
    }

    // Aplicar bonos de rompebarreras nivel 4
    if (PHYSICAL_STATS.includes(statName as typeof PHYSICAL_STATS[number])) {
      // Niveles 2 y 3: +1200 cada uno = +2400 total
      stat += 2400;
    } else if (ATTACK_STATS.includes(statName as typeof ATTACK_STATS[number])) {
      // Nivel 4: +1200
      stat += 1200;
    } else if (DEFENSE_STATS.includes(statName as typeof DEFENSE_STATS[number])) {
      // Nivel 4: +1200
      stat += 1200;
    } else if (SAVE_STATS.includes(statName as typeof SAVE_STATS[number])) {
      // Nivel 4: +1200 (usa el mismo bonus que ataque)
      stat += 1200;
    }

    // Recopilar todos los bonos activos (pasiva siempre activa, todas las latentes activas)
    // Excluir "Maestro de los duelos" si excludeDuelMaster es true
    const bonuses = this.collectAllBonuses(player, excludeDuelMaster);

    // Aplicar bonos de estadísticas específicas y bonos a todas las estadísticas
    const statBonus = bonuses.reduce((sum, b) => {
      const matchesStat = b.type === 'stat' && b.statName === statName;
      const matchesAll = b.type === 'all_stats';
      return matchesStat || matchesAll ? sum + b.value : sum;
    }, 0);

    // Aplicar Team Skills y Formación
    const formationBonus = this.getFormationBonus(statName, player);
    const totalPercentageBonus = this.teamSkillBonus + formationBonus;
    if (totalPercentageBonus !== 0) {
      stat = Math.round(stat * (1 + totalPercentageBonus / 100));
    }

    // Aplicar bonos de habilidades y Bond
    const totalSkillBonus = statBonus + this.bondBonus;
    if (totalSkillBonus !== 0) {
      stat = Math.round(stat * (1 + totalSkillBonus / 100));
    }

    return stat;
  }

  // Obtener bonus de formación para una estadística (categoría + bono extra, mismo paso que Team Skill)
  getFormationBonus(statName: StatName, player: Player): number {
    const formation = this.formationsService.getFormationById(this.formationId);
    const isGK = player.positions?.includes('PO') ?? false;
    return this.formationsService.getFormationBonus(formation ?? undefined, statName, isGK);
  }

  // Recopilar todos los bonos de habilidades (pasiva + todas las latentes)
  // excludeDuelMaster: si es true, excluye la habilidad "Maestro de los duelos"
  collectAllBonuses(player: Player, excludeDuelMaster: boolean = false): SkillBonus[] {
    const duelMasterSkillNames = ['Maestro de los duelos', 'maestro de los duelos', 'Maestro de los duelos (Múltiple)'];

    // Obtener bonos de la habilidad pasiva (si no es "Maestro de los duelos")
    let passive: SkillBonus[] = [];
    if (player.passiveSkill?.bonuses) {
      if (!excludeDuelMaster || !duelMasterSkillNames.includes(player.passiveSkill.name)) {
        passive = player.passiveSkill.bonuses;
      }
    }

    // Obtener bonos de las habilidades latentes (excluyendo "Maestro de los duelos" si es necesario)
    const latents = (player.latentSkills ?? [])
      .filter(skill => !excludeDuelMaster || !duelMasterSkillNames.includes(skill.name))
      .flatMap(s => s.bonuses ?? []);

    return [...passive, ...latents];
  }

  // Obtener poder de técnica modificado con bonos
  getModifiedTechniquePower(basePower: number, player: Player, excludeDuelMaster: boolean = false, technique?: Technique): number {
    const bonuses = this.collectAllBonuses(player, excludeDuelMaster);
    const powerBonus = bonuses.reduce((sum, b) => {
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

    if (powerBonus === 0) return basePower;
    return Math.round(basePower * (1 + powerBonus / 100));
  }


  getInGamePunchBase(player: Player): number {
    if (!player.positions?.includes('PO')) return 0;
    const punch = player.stats.punch ?? 0;
    const speed = player.stats.speed ?? 0;
    const power = player.stats.power ?? 0;
    return Math.round(punch + (speed + power) / 4);
  }

  getInGameCatchBase(player: Player): number {
    if (!player.positions?.includes('PO')) return 0;
    const catchStat = player.stats.catchStat ?? 0;
    const power = player.stats.power ?? 0;
    const technique = player.stats.technique ?? 0;
    return Math.round(catchStat + (power + technique) / 4);
  }

  // Versiones con bonos para porteros
  getInGamePunchBaseWithBonuses(player: Player, excludeDuelMaster: boolean = false, associatedStats: StatName[] = []): number {
    if (!player.positions?.includes('PO')) return 0;
    const punch = this.getModifiedStatWithBonuses(player.stats.punch ?? 0, 'punch', player, excludeDuelMaster, associatedStats);
    const speed = this.getModifiedStatWithBonuses(player.stats.speed ?? 0, 'speed', player, excludeDuelMaster, associatedStats);
    const power = this.getModifiedStatWithBonuses(player.stats.power ?? 0, 'power', player, excludeDuelMaster, associatedStats);
    return Math.round(punch + (speed + power) / 4);
  }

  getInGameCatchBaseWithBonuses(player: Player, excludeDuelMaster: boolean = false, associatedStats: StatName[] = []): number {
    if (!player.positions?.includes('PO')) return 0;
    const catchStat = this.getModifiedStatWithBonuses(player.stats.catchStat ?? 0, 'catchStat', player, excludeDuelMaster, associatedStats);
    const power = this.getModifiedStatWithBonuses(player.stats.power ?? 0, 'power', player, excludeDuelMaster, associatedStats);
    const technique = this.getModifiedStatWithBonuses(player.stats.technique ?? 0, 'technique', player, excludeDuelMaster, associatedStats);
    return Math.round(catchStat + (power + technique) / 4);
  }

  getBallSkillBonus(ballSkill: string): number {
    if (ballSkill === 'Bueno') return 12.5;
    if (ballSkill === 'Muy Bueno') return 25;
    return 0;
  }

  selectType(typeKey: string): void {
    this.selectedType = typeKey;
    this.applyTypeFilter();
  }

  applyTypeFilter(): void {
    // Filtrar por tipo de técnica
    const filteredByType = this.allRankings.filter(ranking => {
      const type = ranking.technique.type.toLowerCase();
      return type === this.selectedType.toLowerCase();
    });

    // Agrupar por jugador y mantener solo la mejor técnica de cada uno
    const playerBestTechnique = new Map<number, TechniqueRanking>();

    filteredByType.forEach(ranking => {
      const playerId = ranking.player.id;
      const existing = playerBestTechnique.get(playerId);

      if (!existing || ranking.momentum > existing.momentum) {
        playerBestTechnique.set(playerId, ranking);
      }
    });

    // Convertir el Map a array y ordenar por momentum descendente
    this.filteredRankings = Array.from(playerBestTechnique.values())
      .sort((a, b) => b.momentum - a.momentum);
  }

  getTechImageUrl(technique: Technique): string {
    if (!technique?.type) return '';
    let techType = technique.type;
    if (techType === 'Intercepción') {
      techType = 'Intercepcion';
    } else if (techType === 'Puño') {
      techType = 'puno';
    }
    return `${this.iconsBaseUrl}/${techType.toLowerCase()}.png`;
  }

  getPlayerImageUrl(player: Player): string {
    if (!player.cardImageUrl) return '';
    if (player.cardImageUrl.startsWith('http')) return player.cardImageUrl;
    return `${this.imageBaseUrl}${player.cardImageUrl}`;
  }

  getTypeIconUrl(typeKey: string): string {
    const type = this.techniqueTypes.find(t => t.key === typeKey);
    return type ? `${this.iconsBaseUrl}/${type.icon}` : '';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E';
  }
}
