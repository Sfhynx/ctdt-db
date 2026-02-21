import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PlayerPreferencesService,
  PlayerPreferences,
  GK_LIMIT_BREAK_STATS,
  FIELD_LIMIT_BREAK_STATS,
  POSITION_CODES,
  PositionCodeKey,
  LimitBreaksByPositionGroup
} from '../../services/player-preferences.service';
import { FormationsService } from '../../services/formations.service';
import { Formation } from '../../types/player-types';

/** Etiquetas para stats en la UI */
const STAT_LABELS: Record<string, string> = {
  dribble: 'Regate',
  shot: 'Tiro',
  pass: 'Pase',
  tackle: 'Entrada',
  block: 'Bloqueo',
  intercept: 'Intercepción',
  speed: 'Velocidad',
  power: 'Potencia',
  technique: 'Técnica',
  punch: 'Puño',
  catchStat: 'Blocaje'
};

/** Etiquetas para códigos de posición del modelo de unidad */
const POSITION_CODE_LABELS: Record<PositionCodeKey, string> = {
  PO: 'PO (5 +1000)',
  DL: 'DL (8 +1000)',
  MCA: 'MCA (8 +1000)',
  MCD: 'MCD (8 +1000)',
  DF: 'DF (8 +1000)'
};

/** Etiquetas cortas para stats (bono extra en formaciones) */
const STAT_LABELS_SHORT: Record<string, string> = {
  dribble: 'Regate', shot: 'Tiro', pass: 'Pase', tackle: 'Entrada', block: 'Bloqueo', intercept: 'Intercepción',
  speed: 'Velocidad', power: 'Potencia', technique: 'Técnica', punch: 'Puño', catchStat: 'Blocaje', energy: 'Energía'
};

@Component({
  selector: 'app-admin-preferences',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-preferences.component.html',
  styleUrl: './admin-preferences.component.css'
})
export class AdminPreferencesComponent implements OnInit {
  teamSkillBonus = 0;
  bondBonus = 0;
  formationId = 'ninguna';
  rompebarrerasLevel = 0;
  /** Por código de posición: array de stat keys seleccionados para +1000 */
  limitBreaksByPositionGroup: Record<PositionCodeKey, string[]> = {
    PO: [],
    DL: [],
    MCA: [],
    MCD: [],
    DF: []
  };
  saved = false;

  formations: Formation[] = [];
  readonly rompebarrerasLevels = [0, 1, 2, 3, 4];
  readonly positionCodes = POSITION_CODES;
  readonly gkStats = GK_LIMIT_BREAK_STATS;
  readonly fieldStats = FIELD_LIMIT_BREAK_STATS;
  readonly statLabels = STAT_LABELS;
  readonly positionCodeLabels = POSITION_CODE_LABELS;
  readonly maxGK = 5;
  readonly maxField = 8;

  constructor(
    private preferencesService: PlayerPreferencesService,
    private formationsService: FormationsService
  ) {}

  ngOnInit(): void {
    this.formations = this.formationsService.getFormations();
    const prefs = this.preferencesService.getPreferences();
    if (prefs) {
      this.teamSkillBonus = prefs.teamSkillBonus;
      this.bondBonus = prefs.bondBonus;
      this.formationId = prefs.formationId || 'ninguna';
      this.rompebarrerasLevel = prefs.rompebarrerasLevel;
      if (prefs.limitBreaksByPositionGroup) {
        for (const key of POSITION_CODES) {
          this.limitBreaksByPositionGroup[key] = prefs.limitBreaksByPositionGroup[key]?.slice() ?? [];
        }
      }
    }
  }

  getStatsForGroup(positionCode: PositionCodeKey): string[] {
    return positionCode === 'PO' ? this.gkStats : this.fieldStats;
  }

  /** Grupos de stats por categoría (igual que en alta de jugador: Ataque, Defensa, Físico; PO: Parada, Físico) */
  getStatGroups(positionCode: PositionCodeKey): { title: string; stats: string[] }[] {
    if (positionCode === 'PO') {
      return [
        { title: 'Parada', stats: ['punch', 'catchStat'] },
        { title: 'Físico', stats: ['speed', 'power', 'technique'] }
      ];
    }
    return [
      { title: 'Ataque', stats: ['dribble', 'shot', 'pass'] },
      { title: 'Defensa', stats: ['tackle', 'block', 'intercept'] },
      { title: 'Físico', stats: ['speed', 'power', 'technique'] }
    ];
  }

  getMaxForGroup(positionCode: PositionCodeKey): number {
    return positionCode === 'PO' ? this.maxGK : this.maxField;
  }

  isLimitBreakSelected(positionCode: PositionCodeKey, statKey: string): boolean {
    return this.limitBreaksByPositionGroup[positionCode].includes(statKey);
  }

  toggleLimitBreak(positionCode: PositionCodeKey, statKey: string): void {
    const arr = this.limitBreaksByPositionGroup[positionCode];
    const max = this.getMaxForGroup(positionCode);
    if (arr.includes(statKey)) {
      this.limitBreaksByPositionGroup[positionCode] = arr.filter(s => s !== statKey);
    } else if (arr.length < max) {
      this.limitBreaksByPositionGroup[positionCode] = [...arr, statKey];
    }
  }

  getFormationLabel(f: Formation): string {
    if (f.category === 'Ninguna' && !f.extraStatBonus) return f.name;
    const parts: string[] = [];
    if (f.category !== 'Ninguna' && f.categoryBonus) {
      parts.push(`+${f.categoryBonus}% ${f.category === 'Ataque' ? 'ATQ' : f.category === 'Defensiva' ? 'DEF' : 'FÍS'}`);
    }
    if (f.extraStatBonus) {
      parts.push(`${STAT_LABELS_SHORT[f.extraStatBonus.stat] ?? f.extraStatBonus.stat} +${f.extraStatBonus.percent}%`);
    }
    return parts.length ? `${f.name} (${parts.join(', ')})` : f.name;
  }

  save(): void {
    const limitBreaks: LimitBreaksByPositionGroup = {};
    for (const key of POSITION_CODES) {
      const arr = this.limitBreaksByPositionGroup[key];
      if (arr.length > 0) limitBreaks[key] = arr;
    }
    const prefs: PlayerPreferences = {
      teamSkillBonus: this.teamSkillBonus,
      bondBonus: this.bondBonus,
      formationId: this.formationId,
      rompebarrerasLevel: this.rompebarrerasLevel,
      limitBreaksByPositionGroup: Object.keys(limitBreaks).length ? limitBreaks : undefined
    };
    this.preferencesService.setPreferences(prefs);
    this.saved = true;
    setTimeout(() => (this.saved = false), 2500);
  }
}
