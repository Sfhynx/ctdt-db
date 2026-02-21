import { Country } from './country.model';

export interface PlayerBase {
  id: number;
  name: string;
  countryId?: number | null;
  country?: Country | null;
}
