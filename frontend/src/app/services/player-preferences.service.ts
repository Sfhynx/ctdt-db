import { Injectable } from '@angular/core';
import { FormationsService } from './formations.service';

/** Clave = código de posición de la unidad (PO, DL, MCA, MCD, DF); valor = array de StatName con +1000 */
export type LimitBreaksByPositionGroup = Record<string, string[]>;

export interface PlayerPreferences {
  teamSkillBonus: number;
  bondBonus: number;
  /** Id de la formación seleccionada (built-in: ninguna, ataque, defensiva, fisico; o id de formación custom). */
  formationId: string;
  rompebarrerasLevel: number;
  /** Limit breaks (+1000) por código de posición: PO (5), DL/MCA/MCD/DF (8) */
  limitBreaksByPositionGroup?: LimitBreaksByPositionGroup;
}

const STORAGE_KEY = 'ctdt-player-preferences';

/** Stats seleccionables para porteros (máx. 5) */
export const GK_LIMIT_BREAK_STATS: string[] = ['punch', 'catchStat', 'speed', 'power', 'technique'];

/** Stats seleccionables para jugadores de campo (máx. 8) */
export const FIELD_LIMIT_BREAK_STATS: string[] = ['dribble', 'shot', 'pass', 'tackle', 'block', 'intercept', 'speed', 'power', 'technique'];

/** Códigos de posición del modelo de unidad: PO, DL, MCA, MCD, DF */
export const POSITION_CODES = ['PO', 'DL', 'MCA', 'MCD', 'DF'] as const;
export type PositionCodeKey = (typeof POSITION_CODES)[number];

/** Devuelve el código de posición a usar para limit breaks a partir de positions[] del jugador (primera posición que coincida con POSITION_CODES). */
export function getPositionCodeFromPositions(positions: string[] | undefined): PositionCodeKey | null {
  if (!positions?.length) return null;
  const upper = positions.map(s => s.toUpperCase().trim());
  for (const code of POSITION_CODES) {
    if (upper.includes(code)) return code;
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class PlayerPreferencesService {
  constructor(private formationsService: FormationsService) {}

  getPreferences(): PlayerPreferences | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as Partial<PlayerPreferences & { formationType?: string }>;
      if (data == null || typeof data !== 'object') return null;
      const formationId = typeof data.formationId === 'string' && data.formationId
        ? data.formationId
        : this.formationsService.formationTypeToId(data.formationType as any);
      const prefs: PlayerPreferences = {
        teamSkillBonus: typeof data.teamSkillBonus === 'number' ? data.teamSkillBonus : 0,
        bondBonus: typeof data.bondBonus === 'number' ? data.bondBonus : 0,
        formationId: formationId || 'ninguna',
        rompebarrerasLevel: typeof data.rompebarrerasLevel === 'number'
          ? Math.min(4, Math.max(0, Math.round(data.rompebarrerasLevel)))
          : 0
      };
      if (data.limitBreaksByPositionGroup && typeof data.limitBreaksByPositionGroup === 'object') {
        prefs.limitBreaksByPositionGroup = this.normalizeLimitBreaks(data.limitBreaksByPositionGroup);
      }
      return prefs;
    } catch {
      return null;
    }
  }

  setPreferences(prefs: PlayerPreferences): void {
    try {
      const payload: Record<string, unknown> = {
        teamSkillBonus: prefs.teamSkillBonus,
        bondBonus: prefs.bondBonus,
        formationId: prefs.formationId,
        rompebarrerasLevel: prefs.rompebarrerasLevel
      };
      if (prefs['limitBreaksByPositionGroup']) {
        payload['limitBreaksByPositionGroup'] = prefs['limitBreaksByPositionGroup'];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  private normalizeLimitBreaks(raw: Record<string, unknown>): LimitBreaksByPositionGroup {
    const result: LimitBreaksByPositionGroup = {};
    const gkSet = new Set(GK_LIMIT_BREAK_STATS);
    const fieldSet = new Set(FIELD_LIMIT_BREAK_STATS);
    for (const key of POSITION_CODES) {
      const val = raw[key];
      if (!Array.isArray(val)) continue;
      const isGK = key === 'PO';
      const allowed = isGK ? gkSet : fieldSet;
      const max = isGK ? 5 : 8;
      const filtered = val.filter((s): s is string => typeof s === 'string' && allowed.has(s)).slice(0, max);
      if (filtered.length) result[key] = filtered;
    }
    return result;
  }
}
