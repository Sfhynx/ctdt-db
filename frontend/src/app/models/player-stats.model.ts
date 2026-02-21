export interface PlayerStats {
    energy: number;
    total: number;

    // Ataque - Solo jugadores de campo
    attack: number;
    dribble?: number;
    shot?: number;
    pass?: number;

    // Defensa - Solo jugadores de campo
    defense: number;
    tackle?: number;
    block?: number;
    intercept?: number;

    // Parada - Solo porteros
    catchTotal?: number;
    punch?: number;
    catchStat?: number; // Blocaje

    // Físico - Todos los jugadores
    physical: number;
    speed: number;
    power: number;
    technique: number;
}
