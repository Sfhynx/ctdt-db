export interface TechType {
  id: number;
  name: string;
  appliesLowBallBonus?: boolean;
  appliesHighBallBonus?: boolean;
  /** Posiciones que pueden usar este tipo (DL, MCA, MCD, DF, PO). Vacío = todas. */
  allowedPositionCodes?: string[];
}

/** Códigos de posición para restringir tipos de técnica (igual que en jugadores). */
export const TECH_TYPE_POSITION_CODES = ['DL', 'MCA', 'MCD', 'DF', 'PO'] as const;
export const TECH_TYPE_POSITION_LABELS: Record<string, string> = { DL: 'DL', MCA: 'MCA', MCD: 'MCD', DF: 'DF', PO: 'PO' };
