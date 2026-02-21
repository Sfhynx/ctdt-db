import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Technique } from '../../models/technique.model';
import { environment } from '../../../environments/environment';

interface PlayerWithTechniques {
    playerName: string;
    cardImageUrl: string;
    playerId: number;
    techniqueCount: number;
    techniques: Technique[];
}

@Component({
    selector: 'app-technique-manager',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './technique-manager.component.html',
    styleUrl: './technique-manager.component.css'
})
export class TechniqueManagerComponent implements OnInit {
    playersWithTechniques: PlayerWithTechniques[] = [];
    loading = true;
    error: string | null = null;
    imageBaseUrl = environment.apiBaseUrl;

    constructor(
        private readonly apiService: ApiService,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        this.loadPlayersWithTechniques();
    }

    loadPlayersWithTechniques(): void {
        this.loading = true;
        this.error = null;
        this.apiService.getPlayersWithTechniques().subscribe({
            next: (data) => {
                this.playersWithTechniques = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading players with techniques:', error);
                this.error = 'Error al cargar los jugadores con técnicas';
                this.loading = false;
            }
        });
    }

    getImageUrl(cardImageUrl: string): string {
        if (!cardImageUrl) {
            return '/tsubasa-logo.png';
        }
        if (cardImageUrl.startsWith('http')) {
            return cardImageUrl;
        }
        return `${this.imageBaseUrl}${cardImageUrl}`;
    }

    editPlayerTechniques(playerId: number): void {
        // Encontrar el nombre del jugador
        const player = this.playersWithTechniques.find(p => p.playerId === playerId);
        if (player) {
            // Navegar a la página de gestión de técnicas del jugador
            this.router.navigate(['/admin/techniques/player', encodeURIComponent(player.playerName)]);
        }
    }
}
