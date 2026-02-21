import { Injectable } from '@angular/core';
import { Player } from '../models/player.model';
import { Technique } from '../models/technique.model';

export interface TechniqueWithSummary {
  technique: Technique;
  momentum: number;
  modifiedStaminaCost: number;
}

export interface PlayerResumenState {
  player: Player;
  teamSkillBonus: number;
  bondBonus: number;
  /** Id de la formación seleccionada (ninguna, ataque, defensiva, fisico o custom) */
  formationId: string;
  techniquesWithSummary: TechniqueWithSummary[];
  bestTechniquesWithSummary: TechniqueWithSummary[];
  /** Pasiva marcada como activa para el cálculo del momentum */
  passiveSkillActive?: boolean;
  /** IDs de latentes marcadas como activas para el cálculo del momentum */
  activeLatentSkillIds?: number[];
}

/** Servicio para pasar el estado del resumen desde player-detail al componente resumen.
 *  El estado del router no siempre está disponible en ngOnInit del destino. */
@Injectable({ providedIn: 'root' })
export class PlayerResumenStateService {
  private state: PlayerResumenState | null = null;

  setState(state: PlayerResumenState): void {
    this.state = state;
  }

  getState(): PlayerResumenState | null {
    return this.state;
  }

  consumeState(): PlayerResumenState | null {
    const s = this.state;
    this.state = null;
    return s;
  }
}
