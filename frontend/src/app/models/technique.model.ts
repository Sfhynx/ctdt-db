export interface Technique {
    id: number;
    name: string;
    type: string; // Shot, Dribble, Pass, Block, Tackle, etc.
    power: number;
    staminaCost: number;
    description: string;
    isMain: boolean; // True si es técnica principal
    isCombined: boolean; // True si es una técnica combinada
    playerName: string; // Nombre del jugador al que pertenece la técnica
    /** Si true, en los cálculos se aplica el bono de balón bajo (p. ej. volea). Por defecto true. */
    appliesLowBallBonus?: boolean;
    /** Si true, en los cálculos se aplica el bono de balón alto (p. ej. cabezazo). Por defecto true. */
    appliesHighBallBonus?: boolean;
}
