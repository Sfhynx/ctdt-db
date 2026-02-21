import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Technique } from '../../models/technique.model';
import { TechniqueFormModalComponent } from '../technique-form-modal/technique-form-modal.component';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-player-techniques',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TechniqueFormModalComponent],
    templateUrl: './player-techniques.component.html',
    styleUrl: './player-techniques.component.css'
})
export class PlayerTechniquesComponent implements OnInit {
    playerName: string = '';
    techniques: Technique[] = [];
    loading = true;
    error: string | null = null;
    showCreateModal = false;
    editingTechnique: Technique | null = null;
    
    private readonly iconsBaseUrl = environment.apiBaseUrl + '/icons';

    constructor(
        private readonly apiService: ApiService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.playerName = decodeURIComponent(params['playerName']);
            this.loadTechniques();
        });
    }

    loadTechniques(): void {
        this.loading = true;
        this.error = null;
        this.apiService.getTechniquesByPlayerName(this.playerName).subscribe({
            next: (data) => {
                this.techniques = data || [];
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading techniques:', error);
                this.error = 'Error al cargar las técnicas';
                this.loading = false;
            }
        });
    }

    openCreateModal(): void {
        this.editingTechnique = null;
        this.showCreateModal = true;
    }

    openEditModal(technique: Technique): void {
        this.editingTechnique = { ...technique };
        this.showCreateModal = true;
    }

    closeModal(): void {
        this.showCreateModal = false;
        this.editingTechnique = null;
    }

    onTechniqueSave(technique: Technique): void {
        if (this.editingTechnique) {
            // Actualizar técnica existente
            this.apiService.updateTechnique(this.editingTechnique.id, technique).subscribe({
                next: () => {
                    this.loadTechniques();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error updating technique:', error);
                    alert('Error al actualizar la técnica');
                }
            });
        } else {
            // Crear nueva técnica
            this.apiService.createTechnique(technique).subscribe({
                next: () => {
                    this.loadTechniques();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error creating technique:', error);
                    alert('Error al crear la técnica');
                }
            });
        }
    }

    onTechniqueCancel(): void {
        this.closeModal();
    }

    deleteTechnique(technique: Technique): void {
        if (!confirm(`¿Estás seguro de que quieres eliminar la técnica "${technique.name}"?`)) {
            return;
        }

        this.apiService.deleteTechnique(technique.id).subscribe({
            next: () => {
                this.loadTechniques();
            },
            error: (error) => {
                console.error('Error deleting technique:', error);
                alert('Error al eliminar la técnica');
            }
        });
    }

    getTechImageUrl(technique: Technique | null): string {
        if (!technique?.type) return '';
        let techType = technique.type;
        if (techType === 'Intercepción') {
            techType = 'Intercepcion';
        } else if (techType === 'Puño') {
            techType = 'puno';
        }
        return `${this.iconsBaseUrl}/${techType.toLowerCase()}.png`;
    }

    goBack(): void {
        this.router.navigate(['/admin/techniques']);
    }
}
