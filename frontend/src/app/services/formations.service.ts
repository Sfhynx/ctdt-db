import { Injectable } from '@angular/core';
import { Formation, FormationType, StatName } from '../types/player-types';
import { ATTACK_STATS, DEFENSE_STATS, PHYSICAL_STATS } from '../constants/stats';

const STORAGE_KEY = 'ctdt-custom-formations';

const CATEGORY_BONUS_DEFAULT = 12;

/** IDs de formaciones predefinidas (solo lectura). */
export const BUILT_IN_FORMATION_IDS = ['ninguna', 'ataque', 'defensiva', 'fisico'] as const;

const BUILT_IN: Formation[] = [
  { id: 'ninguna', name: 'Ninguna', category: 'Ninguna', categoryBonus: 0, builtIn: true },
  { id: 'ataque', name: 'Ataque', category: 'Ataque', categoryBonus: CATEGORY_BONUS_DEFAULT, builtIn: true },
  { id: 'defensiva', name: 'Defensiva', category: 'Defensiva', categoryBonus: CATEGORY_BONUS_DEFAULT, builtIn: true },
  { id: 'fisico', name: 'Físico', category: 'Físico', categoryBonus: CATEGORY_BONUS_DEFAULT, builtIn: true }
];

@Injectable({ providedIn: 'root' })
export class FormationsService {
  getBuiltInFormations(): Formation[] {
    return [...BUILT_IN];
  }

  getCustomFormations(): Formation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data
        .filter((f: unknown) => f && typeof f === 'object' && typeof (f as Formation).id === 'string')
        .map((f: Record<string, unknown>) => this.normalizeFormation(f));
    } catch {
      return [];
    }
  }

  getFormations(): Formation[] {
    return [...this.getBuiltInFormations(), ...this.getCustomFormations()];
  }

  getFormationById(id: string): Formation | undefined {
    if (!id) return undefined;
    const built = BUILT_IN.find(f => f.id === id);
    if (built) return built;
    return this.getCustomFormations().find(f => f.id === id);
  }

  saveCustomFormations(formations: Formation[]): void {
    try {
      const custom = formations.filter(f => !f.builtIn);
      const payload = custom.map(f => ({
        id: f.id,
        name: f.name,
        category: f.category,
        categoryBonus: f.categoryBonus,
        extraStatBonus: f.extraStatBonus
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  /** Genera un id único para una formación custom. Compatible con navegadores sin crypto.randomUUID (p. ej. Safari antiguo, HTTP). */
  generateCustomId(): string {
    return 'custom-' + this.generateUuid();
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback: UUID v4 con crypto.getRandomValues (más soportado)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6]! & 0x0f) | 0x40;
      bytes[8] = (bytes[8]! & 0x3f) | 0x80;
      const hex = [...bytes].map(b => b!.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    // Último recurso: timestamp + aleatorio (suficiente para IDs locales)
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Calcula el bono de formación para una stat (categoría + bono extra).
   * Se aplica en el mismo paso que Team Skill: (1 + teamSkill/100 + formationBonus/100).
   */
  getFormationBonus(formation: Formation | null | undefined, statName: StatName, isGK: boolean): number {
    if (!formation) return 0;
    let bonus = 0;
    if (formation.category !== 'Ninguna' && formation.categoryBonus) {
      const map: Record<string, readonly string[]> = {
        Ataque: ATTACK_STATS,
        Defensiva: DEFENSE_STATS,
        Físico: PHYSICAL_STATS
      };
      const allowed = map[formation.category];
      if (allowed && (!isGK || formation.category === 'Físico') && allowed.includes(statName as typeof allowed[number])) {
        bonus += formation.categoryBonus;
      }
    }
    if (formation.extraStatBonus && formation.extraStatBonus.stat === statName) {
      bonus += formation.extraStatBonus.percent;
    }
    return bonus;
  }

  /** Convierte FormationType legacy a id de formación (para migrar preferencias). */
  formationTypeToId(formationType: FormationType): string {
    const lower = formationType?.toLowerCase() ?? 'ninguna';
    if (lower === 'ataque') return 'ataque';
    if (lower === 'defensiva') return 'defensiva';
    if (lower === 'físico' || lower === 'fisico') return 'fisico';
    return 'ninguna';
  }

  private normalizeFormation(raw: Record<string, unknown>): Formation {
    const id = String(raw['id'] ?? '');
    const name = String(raw['name'] ?? 'Formación');
    const category = this.normalizeCategory(raw['category']);
    const categoryBonus = typeof raw['categoryBonus'] === 'number' ? Math.max(0, Math.min(100, Math.round(raw['categoryBonus']))) : CATEGORY_BONUS_DEFAULT;
    const extra = raw['extraStatBonus'];
    let extraStatBonus: Formation['extraStatBonus'] | undefined;
    if (extra && typeof extra === 'object' && extra !== null && typeof (extra as Record<string, unknown>)['stat'] === 'string' && typeof (extra as Record<string, unknown>)['percent'] === 'number') {
      const e = extra as Record<string, unknown>;
      extraStatBonus = { stat: e['stat'] as StatName, percent: Math.max(0, Math.min(100, Math.round((e['percent'] as number)))) };
    }
    return { id, name, category, categoryBonus, extraStatBonus, builtIn: false };
  }

  private normalizeCategory(value: unknown): FormationType {
    if (value === 'Ataque' || value === 'Defensiva' || value === 'Físico' || value === 'Ninguna') return value;
    return 'Ninguna';
  }
}
