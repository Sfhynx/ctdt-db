import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PlayerBase } from '../../models/player-base.model';
import { Country } from '../../models/country.model';

interface PlayerWithTechniquesDto {
    playerName: string;
    techniqueCount: number;
}

@Component({
    selector: 'app-technique-manager',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './technique-manager.component.html',
    styleUrl: './technique-manager.component.css'
})
export class TechniqueManagerComponent implements OnInit {
    allPlayerBases: PlayerBase[] = [];
    countries: Country[] = [];
    /** Mapa nombre del jugador (player base) -> número de técnicas */
    techniqueCountByPlayerName: Record<string, number> = {};
    filterName = '';
    filterCountryId: number | null = null;
    /** Para ir a técnicas de un nombre que no esté en la lista */
    goToPlayerName = '';
    loading = true;
    error: string | null = null;

    constructor(
        private readonly apiService: ApiService,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        this.loadCountries();
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.error = null;
        this.apiService.getPlayerBases().subscribe({
            next: (bases) => {
                this.allPlayerBases = bases || [];
                this.loadTechniqueCounts();
            },
            error: (err) => {
                console.error('Error loading player bases:', err);
                this.error = 'Error al cargar los nombres de jugador';
                this.loading = false;
            }
        });
    }

    private loadTechniqueCounts(): void {
        this.apiService.getPlayersWithTechniques().subscribe({
            next: (list: PlayerWithTechniquesDto[]) => {
                this.techniqueCountByPlayerName = {};
                (list || []).forEach(p => {
                    this.techniqueCountByPlayerName[p.playerName] = p.techniqueCount ?? 0;
                });
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadCountries(): void {
        this.apiService.getCountries().subscribe({
            next: (data) => {
                this.countries = data || [];
            },
            error: () => {}
        });
    }

    get filteredPlayerBases(): PlayerBase[] {
        let list = this.allPlayerBases;
        const name = this.filterName.trim().toLowerCase();
        if (name) {
            list = list.filter(pb =>
                (pb.name || '').toLowerCase().includes(name)
            );
        }
        if (this.filterCountryId != null && this.filterCountryId !== 0) {
            list = list.filter(pb => (pb.country?.id ?? pb.countryId ?? 0) === this.filterCountryId);
        }
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    getTechniqueCount(playerBase: PlayerBase): number {
        return this.techniqueCountByPlayerName[playerBase.name] ?? 0;
    }

    goToTechniques(playerBase: PlayerBase): void {
        this.router.navigate(['/admin/techniques/player', encodeURIComponent(playerBase.name)]);
    }

    goToTechniquesByName(): void {
        const name = this.goToPlayerName.trim();
        if (!name) return;
        this.router.navigate(['/admin/techniques/player', encodeURIComponent(name)]);
    }
}
