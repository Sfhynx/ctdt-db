export type FormationType = 'Ninguna' | 'Ataque' | 'Defensiva' | 'Físico';
export type StatName =
  | 'dribble' | 'shot' | 'pass'
  | 'tackle' | 'block' | 'intercept'
  | 'speed' | 'power' | 'technique'
  | 'punch' | 'catchStat' | 'energy';

/** Bono extra opcional de formación: una stat con un % (ej. Potencia +8%). Se aplica en el mismo paso que el bono de categoría. */
export interface FormationExtraStatBonus {
  stat: StatName;
  percent: number;
}

/** Formación: categoría (Ataque/Defensa/Físico) con bono por defecto 12% y opcional bono extra a una stat. */
export interface Formation {
  id: string;
  name: string;
  /** Categoría que recibe el bono (12%): Ataque, Defensiva o Físico. Ninguna = sin bono de categoría. */
  category: FormationType;
  /** Porcentaje de bono a la categoría (por defecto 12). */
  categoryBonus: number;
  /** Bono adicional a una stat concreta (ej. Potencia +8%); se aplica junto al bono de formación. */
  extraStatBonus?: FormationExtraStatBonus;
  /** true = predefinida (Ninguna, Ataque, Defensiva, Físico), no editable. */
  builtIn?: boolean;
}
