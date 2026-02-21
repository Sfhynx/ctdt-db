export interface Element {
  id: number;
  name: string;
  /** Id del elemento sobre el que este tiene ventaja (p. ej. Fuerza vence a Destreza). */
  advantageOverElementId?: number | null;
  /** Elemento sobre el que este tiene ventaja (cargado desde la API). */
  advantageOver?: Element | null;
}
