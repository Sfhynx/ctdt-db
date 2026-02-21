import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Country } from '../../models/country.model';
import { Series } from '../../models/series.model';
import { Team } from '../../models/team.model';
import { Rarity } from '../../models/rarity.model';
import { Element } from '../../models/element.model';
import { TechType, TECH_TYPE_POSITION_CODES } from '../../models/tech-type.model';
import { PlayerBase } from '../../models/player-base.model';

type AuxTab = 'rarities' | 'elements' | 'techtypes' | 'playerbases' | 'countries' | 'series' | 'teams';

@Component({
  selector: 'app-auxiliary-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auxiliary-data.component.html',
  styleUrl: './auxiliary-data.component.css'
})
export class AuxiliaryDataComponent implements OnInit {
  activeTab: AuxTab = 'rarities';

  rarities: Rarity[] = [];
  elements: Element[] = [];
  techTypes: TechType[] = [];
  playerBases: PlayerBase[] = [];
  countries: Country[] = [];
  series: Series[] = [];
  teams: Team[] = [];

  editingRarity?: Rarity;
  editingElement?: Element;
  editingTechType?: TechType;
  editingPlayerBase?: PlayerBase;
  editingCountry?: Country;
  editingSeries?: Series;
  editingTeam?: Team;

  newRarity: Rarity = { id: 0, name: '' };
  newElement: Element = { id: 0, name: '', advantageOverElementId: null };
  newTechType: TechType = { id: 0, name: '', appliesLowBallBonus: false, appliesHighBallBonus: false, allowedPositionCodes: [] };
  readonly positionCodes = TECH_TYPE_POSITION_CODES;
  newPlayerBase: PlayerBase = { id: 0, name: '', countryId: null };
  newCountry: Country = { id: 0, name: '' };
  newSeries: Series = { id: 0, name: '' };
  newTeam: Team = { id: 0, name: '' };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.apiService.getRarities().subscribe(data => this.rarities = data);
    this.apiService.getElements().subscribe(data => this.elements = data);
    this.apiService.getTechTypes().subscribe(data => this.techTypes = data);
    this.apiService.getPlayerBases().subscribe(data => this.playerBases = data);
    this.apiService.getCountries().subscribe(data => this.countries = data);
    this.apiService.getSeries().subscribe(data => this.series = data);
    this.apiService.getTeams().subscribe(data => this.teams = data);
  }

  setActiveTab(tab: AuxTab): void {
    this.activeTab = tab;
    this.cancelEdit();
  }

  // Rarities
  createRarity(): void {
    if (!this.newRarity.name.trim()) return;
    this.apiService.createRarity(this.newRarity).subscribe(() => {
      this.loadAll();
      this.newRarity = { id: 0, name: '' };
    });
  }
  editRarity(r: Rarity): void {
    this.editingRarity = { ...r };
  }
  updateRarity(): void {
    if (!this.editingRarity) return;
    this.apiService.updateRarity(this.editingRarity.id, this.editingRarity).subscribe(() => {
      this.loadAll();
      this.cancelEdit();
    });
  }
  deleteRarity(id: number): void {
    if (confirm('¿Eliminar esta rareza?')) {
      this.apiService.deleteRarity(id).subscribe({
        next: () => this.loadAll(),
        error: (err) => alert(err.error?.message ?? 'No se pudo eliminar la rareza.')
      });
    }
  }

  // Elements
  createElement(): void {
    if (!this.newElement.name.trim()) return;
    this.apiService.createElement(this.newElement).subscribe(() => {
      this.loadAll();
      this.newElement = { id: 0, name: '', advantageOverElementId: null };
    });
  }
  editElement(e: Element): void {
    this.editingElement = {
      ...e,
      advantageOverElementId: e.advantageOver?.id ?? e.advantageOverElementId ?? null
    };
  }
  updateElement(): void {
    if (!this.editingElement) return;
    this.apiService.updateElement(this.editingElement.id, this.editingElement).subscribe(() => {
      this.loadAll();
      this.cancelEdit();
    });
  }
  deleteElement(id: number): void {
    if (confirm('¿Eliminar este elemento?')) {
      this.apiService.deleteElement(id).subscribe({
        next: () => this.loadAll(),
        error: (err) => alert(err.error?.message ?? 'No se pudo eliminar el elemento.')
      });
    }
  }

  // TechTypes
  createTechType(): void {
    if (!this.newTechType.name.trim()) return;
    this.apiService.createTechType(this.newTechType).subscribe(() => {
      this.loadAll();
      this.newTechType = { id: 0, name: '', appliesLowBallBonus: false, appliesHighBallBonus: false, allowedPositionCodes: [] };
    });
  }
  editTechType(t: TechType): void {
    this.editingTechType = {
      ...t,
      appliesLowBallBonus: t.appliesLowBallBonus === true,
      appliesHighBallBonus: t.appliesHighBallBonus === true,
      allowedPositionCodes: t.allowedPositionCodes ? [...t.allowedPositionCodes] : []
    };
  }
  isTechTypePositionSelected(code: string, forNew: boolean): boolean {
    const arr = forNew ? (this.newTechType.allowedPositionCodes ?? []) : (this.editingTechType?.allowedPositionCodes ?? []);
    return arr.includes(code);
  }
  toggleTechTypePosition(code: string, forNew: boolean): void {
    if (forNew) {
      const arr = this.newTechType.allowedPositionCodes ?? [];
      if (arr.includes(code)) {
        this.newTechType.allowedPositionCodes = arr.filter(c => c !== code);
      } else {
        this.newTechType.allowedPositionCodes = [...arr, code];
      }
    } else if (this.editingTechType) {
      const arr = this.editingTechType.allowedPositionCodes ?? [];
      if (arr.includes(code)) {
        this.editingTechType.allowedPositionCodes = arr.filter(c => c !== code);
      } else {
        this.editingTechType.allowedPositionCodes = [...arr, code];
      }
    }
  }
  updateTechType(): void {
    if (!this.editingTechType) return;
    this.apiService.updateTechType(this.editingTechType.id, this.editingTechType).subscribe(() => {
      this.loadAll();
      this.cancelEdit();
    });
  }
  deleteTechType(id: number): void {
    if (confirm('¿Eliminar este tipo de técnica?')) {
      this.apiService.deleteTechType(id).subscribe({
        next: () => this.loadAll(),
        error: (err) => alert(err.error?.message ?? 'No se pudo eliminar el tipo de técnica.')
      });
    }
  }

  // PlayerBases (nombres de jugador para el autocompletado en alta de jugador)
  createPlayerBase(): void {
    if (!this.newPlayerBase.name.trim()) return;
    if (!this.newPlayerBase.countryId) {
      alert('Selecciona un país.');
      return;
    }
    this.apiService.createPlayerBase(this.newPlayerBase).subscribe({
      next: () => {
        this.loadAll();
        this.newPlayerBase = { id: 0, name: '', countryId: null };
      },
      error: (err) => alert(err.error?.message ?? 'No se pudo crear (¿nombre duplicado?).')
    });
  }

  editPlayerBase(pb: PlayerBase): void {
    this.editingPlayerBase = { ...pb };
  }

  updatePlayerBase(): void {
    if (!this.editingPlayerBase) return;
    if (!this.editingPlayerBase.countryId) {
      alert('Selecciona un país.');
      return;
    }
    this.apiService.updatePlayerBase(this.editingPlayerBase.id, this.editingPlayerBase).subscribe({
      next: () => { this.loadAll(); this.cancelEdit(); },
      error: (err) => alert(err.error?.message ?? 'No se pudo actualizar.')
    });
  }

  deletePlayerBase(id: number): void {
    if (confirm('¿Eliminar este nombre de jugador? No se puede si hay jugadores o técnicas asociadas.')) {
      this.apiService.deletePlayerBase(id).subscribe({
        next: () => this.loadAll(),
        error: (err) => alert(err.error?.message ?? 'No se pudo eliminar.')
      });
    }
  }

  // Countries
  createCountry(): void {
    if (!this.newCountry.name.trim()) return;
    this.apiService.createCountry(this.newCountry).subscribe(() => {
      this.loadAll();
      this.newCountry = { id: 0, name: '' };
    });
  }

  editCountry(country: Country): void {
    this.editingCountry = { ...country };
  }

  updateCountry(): void {
    if (!this.editingCountry) return;
    this.apiService.updateCountry(this.editingCountry.id, this.editingCountry).subscribe(() => {
      this.loadAll();
      this.cancelEdit();
    });
  }

  deleteCountry(id: number): void {
    if (confirm('¿Estás seguro de eliminar este país?')) {
      this.apiService.deleteCountry(id).subscribe(() => this.loadAll());
    }
  }

  // Series
  createSeries(): void {
    if (!this.newSeries.name.trim()) return;
    this.apiService.createSeries(this.newSeries).subscribe(() => {
      this.loadAll();
      this.newSeries = { id: 0, name: '' };
    });
  }

  editSeries(s: Series): void {
    this.editingSeries = { ...s };
  }

  updateSeries(): void {
    if (!this.editingSeries) return;
    this.apiService.updateSeries(this.editingSeries.id, this.editingSeries).subscribe(() => {
      this.loadAll();
      this.cancelEdit();
    });
  }

  deleteSeries(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta serie?')) {
      this.apiService.deleteSeries(id).subscribe(() => this.loadAll());
    }
  }

  // Teams
  createTeam(): void {
    if (!this.newTeam.name.trim()) return;
    this.apiService.createTeam(this.newTeam).subscribe(() => {
      this.loadAll();
      this.newTeam = { id: 0, name: '' };
    });
  }

  editTeam(team: Team): void {
    this.editingTeam = { ...team };
  }

  updateTeam(): void {
    if (!this.editingTeam) return;
    this.apiService.updateTeam(this.editingTeam.id, this.editingTeam).subscribe(() => {
      this.loadAll();
      this.cancelEdit();
    });
  }

  deleteTeam(id: number): void {
    if (confirm('¿Estás seguro de eliminar este equipo?')) {
      this.apiService.deleteTeam(id).subscribe(() => this.loadAll());
    }
  }

  cancelEdit(): void {
    this.editingRarity = undefined;
    this.editingElement = undefined;
    this.editingTechType = undefined;
    this.editingPlayerBase = undefined;
    this.editingCountry = undefined;
    this.editingSeries = undefined;
    this.editingTeam = undefined;
  }
}
