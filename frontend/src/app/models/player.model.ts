import { PlayerStats } from './player-stats.model';
import { Technique } from './technique.model';
import { TeamSkill, Skill } from './skills.model';
import { Rarity } from './rarity.model';
import { Element } from './element.model';
import { Country } from './country.model';
import { Series } from './series.model';
import { Team } from './team.model';

export interface Player {
    id: number;
    name: string;
    version: string; // "As de Japón", "Amigo del Balón", etc.
    cardImageUrl: string;

    // Información básica (objetos desde API; mostrar con .name)
    rarity?: Rarity;
    element?: Element;
    team?: Team | null;
    country?: Country | null;
    series?: Series | null;
    positions: string[]; // DL, MCA, MCD, DF

    // Habilidades con balón
    groundBallSkill: string; // Normal, Bueno, Muy Bueno
    highBallSkill: string; // Normal, Bueno, Muy Bueno

    // Categoría especial (opcional)
    category?: string; // DreamFest, DreamCollection, SuperStar

    // Estadísticas
    stats: PlayerStats;

    // Técnicas (1 principal + hasta 6 secundarias)
    techniques: Technique[];

    // Habilidades
    teamSkill?: TeamSkill;
    passiveSkill?: Skill;
    latentSkills: Skill[];
}

/** Payload para crear/actualizar jugador: el backend espera IDs, no objetos. */
export interface PlayerCreateUpdatePayload {
    id?: number;
    /** Si se envía, el jugador se asocia a este PlayerBase (nombre). Recomendado en alta. */
    playerBaseId?: number | null;
    name: string;
    version: string;
    cardImageUrl: string;
    rarityId: number;
    elementId: number;
    teamId?: number | null;
    seriesId?: number | null;
    positions: string[];
    groundBallSkill: string;
    highBallSkill: string;
    category?: string | null;
    stats: PlayerStats;
    techniques: Technique[];
    teamSkill?: TeamSkill | null;
    passiveSkill?: Skill | null;
    latentSkills: Skill[];
}
