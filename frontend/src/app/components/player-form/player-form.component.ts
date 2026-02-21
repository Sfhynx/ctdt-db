import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Player } from '../../models/player.model';
import { Skill, TeamSkill, SkillBonus } from '../../models/skills.model';
import { Series } from '../../models/series.model';
import { Team } from '../../models/team.model';
import { Rarity } from '../../models/rarity.model';
import { Element } from '../../models/element.model';
import { PlayerCreateUpdatePayload } from '../../models/player.model';
import { TechniqueFormModalComponent } from '../technique-form-modal/technique-form-modal.component';
import { Technique } from '../../models/technique.model';
import { TechType } from '../../models/tech-type.model';
import { PlayerBase } from '../../models/player-base.model';

@Component({
    selector: 'app-player-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TechniqueFormModalComponent],
    templateUrl: './player-form.component.html',
    styleUrl: './player-form.component.css'
})
export class PlayerFormComponent implements OnInit {
    player: Player = this.getEmptyPlayer();
    isEditMode = false;
    playerId?: number;
    activeTab: 'info' | 'skills' | 'techniques' = 'info'; // Tab navigation

    // Skills lists
    latentSkills: Skill[] = [];
    teamSkills: TeamSkill[] = [];

    // Selected skills
    selectedPassiveSkillId?: number;
    selectedTeamSkillId?: number;
    selectedLatentSkillIds: number[] = [];
    
    // Latent skill search
    latentSkillSearchFilter: string = '';

    // Selected Image
    selectedImagePreview: string | null = null;
    selectedImageFile: File | null = null;

    // Techniques
    availableTechniques: any[] = [];
    showSelectTechniqueModal = false;
    showCreateTechniqueModal = false;
    editingTechnique: Technique | null = null;

    series: Series[] = [];
    teams: Team[] = [];
    rarities: Rarity[] = [];
    elements: Element[] = [];
    techTypes: TechType[] = [];

    /** PlayerBase seleccionado en autocompletado (solo alta). */
    selectedPlayerBaseId: number | null = null;
    playerBaseSuggestions: PlayerBase[] = [];
    showPlayerBaseSuggestions = false;

    selectedRarityId?: number;
    selectedElementId?: number;
    selectedSeriesId?: number;
    selectedTeamId?: number;

    constructor(
        private apiService: ApiService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Check if editing
        this.loadAuxiliaryData();

        // Check query params for tab
        this.route.queryParams.subscribe(queryParams => {
            if (queryParams['tab'] === 'techniques') {
                this.activeTab = 'techniques';
            } else if (queryParams['tab'] === 'skills') {
                this.activeTab = 'skills';
            }
        });

        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.playerId = +params['id'];
                // Load skills only in edit mode
                this.loadSkills();
                this.loadPlayer(this.playerId);
            }
        });
    }

    loadAuxiliaryData(): void {
      this.apiService.getRarities().subscribe(data => {
        this.rarities = data;
        if (!this.isEditMode && data.length && this.selectedRarityId == null) this.selectedRarityId = data[0].id;
      });
      this.apiService.getElements().subscribe(data => {
        this.elements = data;
        if (!this.isEditMode && data.length && this.selectedElementId == null) this.selectedElementId = data[0].id;
      });
      this.apiService.getSeries().subscribe(data => {
        this.series = data;
      });
      this.apiService.getTeams().subscribe(data => {
        this.teams = data;
      });
      this.apiService.getTechTypes().subscribe(data => {
        this.techTypes = data;
      });
    }

    /** Buscar nombres de jugador para autocompletado (solo en alta). */
    onPlayerNameInput(): void {
      if (this.isEditMode) return;
      const term = (this.player.name || '').trim();
      this.apiService.getPlayerBases(term || undefined).subscribe(data => {
        this.playerBaseSuggestions = data;
        this.showPlayerBaseSuggestions = term !== '' || data.length > 0;
      });
    }

    selectPlayerBase(pb: PlayerBase): void {
      this.player.name = pb.name;
      this.selectedPlayerBaseId = pb.id;
      this.showPlayerBaseSuggestions = false;
      this.playerBaseSuggestions = [];
    }

    hidePlayerBaseSuggestions(): void {
      setTimeout(() => this.showPlayerBaseSuggestions = false, 150);
    }

    loadSkills(): void {
        // Load all skills (used for both passive and latent selection)
        this.apiService.getSkills().subscribe(skills => {
            this.latentSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));
        });

        this.apiService.getTeamSkills().subscribe(skills => {
            this.teamSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));
        });
    }

    loadPlayer(id: number): void {
        this.apiService.getPlayer(id).subscribe(player => {
            this.player = player;
            this.selectedPassiveSkillId = player.passiveSkill?.id;
            this.selectedTeamSkillId = player.teamSkill?.id;
            this.selectedLatentSkillIds = player.latentSkills?.map(s => s.id) || [];
            this.selectedRarityId = player.rarity?.id;
            this.selectedElementId = player.element?.id;
            this.selectedSeriesId = player.series?.id ?? undefined;
            this.selectedTeamId = player.team?.id ?? undefined;
        });
    }

    onSubmit(): void {
      // Si hay una imagen seleccionada, subirla primero
      if (this.selectedImageFile && this.player.name && this.player.version) {
          this.apiService.uploadPlayerImage(
              this.selectedImageFile,
              this.player.name,
              this.player.version
          ).subscribe({
              next: (response) => {
                  // Asignar la URL de la imagen al jugador
                  this.player.cardImageUrl = response.imageUrl;
                  // Continuar con el guardado del jugador
                  this.savePlayer();
              },
              error: (error) => {
                  console.error('Error uploading image:', error);
                  alert('Error al subir la imagen: ' + (error.error?.message || error.message));
              }
          });
      } else {
          // Si no hay imagen nueva, guardar directamente
          this.savePlayer();
      }
  }


    addLatentSkill(skillId: number): void {
        // If no passive skill, this becomes the passive
        if (!this.selectedPassiveSkillId) {
            this.selectedPassiveSkillId = skillId;
        } else if (this.selectedLatentSkillIds.length < 8) {
            // Otherwise add as latent if there's space
            this.selectedLatentSkillIds.push(skillId);
        } else {
            alert('Solo puedes seleccionar hasta 9 habilidades en total (1 passive + 8 latent)');
        }
    }

    removeLatentSkill(skillId: number): void {
        const index = this.selectedLatentSkillIds.indexOf(skillId);
        if (index > -1) {
            this.selectedLatentSkillIds.splice(index, 1);
        }
    }

    removePassiveSkill(): void {
        this.selectedPassiveSkillId = undefined;
    }

    getSkillById(skillId: number): Skill | undefined {
        return this.latentSkills.find(skill => skill.id === skillId);
    }

    getSelectedLatentSkills(): Skill[] {
        return this.latentSkills.filter(skill =>
            this.selectedLatentSkillIds.includes(skill.id)
        );
    }

    getAvailableLatentSkills(): Skill[] {
        return this.latentSkills
            .filter(skill =>
                !this.selectedLatentSkillIds.includes(skill.id) &&
                skill.id !== this.selectedPassiveSkillId
            )
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    getFilteredAvailableLatentSkills(): Skill[] {
        const available = this.getAvailableLatentSkills();
        if (!this.latentSkillSearchFilter || this.latentSkillSearchFilter.trim() === '') {
            return available;
        }
        const filter = this.latentSkillSearchFilter.toLowerCase().trim();
        return available.filter(skill =>
            skill.name.toLowerCase().includes(filter)
        );
    }

    onLatentSkillSearchChange(): void {
        // Método para manejar cambios en el filtro de búsqueda
        // Se puede usar para lógica adicional si es necesario
    }

    selectLatentSkillFromSearch(skill: Skill): void {
        this.addLatentSkill(skill.id);
        this.latentSkillSearchFilter = ''; // Limpiar el filtro después de seleccionar
    }

    isLatentSkillSelected(skillId: number): boolean {
        return this.selectedLatentSkillIds.includes(skillId);
    }

    setActiveTab(tab: 'info' | 'skills' | 'techniques'): void {
        this.activeTab = tab;

        // Load available techniques when switching to techniques tab
        if (tab === 'techniques' && this.availableTechniques.length === 0) {
            this.loadAvailableTechniques();
        }
    }

    togglePosition(position: string): void {
        const index = this.player.positions.indexOf(position);
        if (index > -1) {
            // Remove position if already selected
            this.player.positions.splice(index, 1);
        } else {
            // Add position if not selected
            this.player.positions.push(position);
        }
    }

    isGoalkeeper(): boolean {
        return this.player.positions.includes('PO');
    }

    cancel(): void {
        this.router.navigate(['/players']);
    }

    private getEmptyPlayer(): Player {
        return {
            id: 0,
            name: '',
            version: '',
            cardImageUrl: '',
            positions: [],
            groundBallSkill: 'Normal',
            highBallSkill: 'Normal',
            category: undefined,
            stats: {
                energy: 0,
                total: 0, // Calculated on backend
                attack: 0, // Calculated on backend
                defense: 0, // Calculated on backend
                physical: 0, // Calculated on backend
                dribble: 0,
                shot: 0,
                pass: 0,
                tackle: 0,
                block: 0,
                intercept: 0,
                speed: 0,
                power: 0,
                technique: 0
            },
            techniques: [],
            teamSkill: undefined,
            passiveSkill: undefined,
            latentSkills: []
        };
    }

    // Technique methods
    loadAvailableTechniques(): void {
        if (!this.playerId) return;

        this.apiService.getAvailableTechniques(this.playerId).subscribe((techniques: any[]) => {
            this.availableTechniques = techniques;
        });
    }

    onTechniqueSave(technique: Technique): void {
        // Create technique via API
        this.apiService.createTechnique(technique).subscribe({
            next: (createdTechnique: any) => {
                // Add to player's techniques
                this.player.techniques.push(createdTechnique);

                // If it's the first technique, make it main
                if (this.player.techniques.length === 1) {
                    createdTechnique.isMain = true;
                }

                // Close modal
                this.showCreateTechniqueModal = false;
                this.editingTechnique = null;
            },
            error: (error: any) => {
                console.error('Error creating technique:', error);
                alert('Error al crear la técnica');
            }
        });
    }

    onTechniqueCancel(): void {
        this.showCreateTechniqueModal = false;
        this.editingTechnique = null;
    }

    openCreateTechniqueModal(): void {
        this.editingTechnique = null;
        this.showCreateTechniqueModal = true;
    }

    selectTechnique(technique: any): void {
        // Clone technique and add to player
        const techniqueCopy = { ...technique, isMain: false };

        // If it's the first technique, make it main
        if (this.player.techniques.length === 0) {
            techniqueCopy.isMain = true;
        }

        this.player.techniques.push(techniqueCopy);
        this.showSelectTechniqueModal = false;
    }

    removeTechnique(index: number): void {
        const wasMain = this.player.techniques[index].isMain;
        this.player.techniques.splice(index, 1);

        // If removed technique was main and there are still techniques, make the first one main
        if (wasMain && this.player.techniques.length > 0) {
            this.player.techniques[0].isMain = true;
        }
    }

    setMainTechnique(index: number): void {
        // Unmark all as main
        this.player.techniques.forEach(t => t.isMain = false);
        // Mark selected as main
        this.player.techniques[index].isMain = true;
    }

    getFilteredAvailableTechniques(): any[] {
        // Filter out techniques already assigned to player
        const assignedTechniqueIds = this.player.techniques.map(t => t.id);
        let filtered = this.availableTechniques.filter(t => !assignedTechniqueIds.includes(t.id));

        // Filter by goalkeeper vs field player types
        const goalkeeperTypes = ['Puño', 'Blocaje'];
        const fieldPlayerTypes = ['Remate', 'Volea', 'Cabezazo', 'Regate', 'Pase', 'Pared', 'Entrada', 'Intercepción', 'Bloqueo'];

        if (this.isGoalkeeper()) {
            filtered = filtered.filter(t => goalkeeperTypes.includes(t.type));
        } else {
            filtered = filtered.filter(t => fieldPlayerTypes.includes(t.type));
        }

        return filtered;
    }


    // Agregar este método para manejar la selección del archivo
    onImageSelected(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
          const file = input.files[0];
          this.selectedImageFile = file;

          // Crear vista previa
          const reader = new FileReader();
          reader.onload = (e: any) => {
              this.selectedImagePreview = e.target.result;
          };
          reader.readAsDataURL(file);
      }

    }
    private savePlayer(): void {
      if (this.selectedRarityId == null || this.selectedElementId == null) {
        alert('Debes seleccionar Rareza y Elemento.');
        return;
      }

      const payload: PlayerCreateUpdatePayload = {
        id: this.player.id,
        playerBaseId: this.selectedPlayerBaseId ?? undefined,
        name: this.player.name,
        version: this.player.version,
        cardImageUrl: this.player.cardImageUrl,
        rarityId: this.selectedRarityId,
        elementId: this.selectedElementId,
        teamId: this.selectedTeamId ?? null,
        seriesId: this.selectedSeriesId ?? null,
        positions: this.player.positions,
        groundBallSkill: this.player.groundBallSkill,
        highBallSkill: this.player.highBallSkill,
        category: this.player.category ?? null,
        stats: this.player.stats,
        techniques: this.player.techniques,
        teamSkill: this.selectedTeamSkillId ? this.teamSkills.find(s => s.id === this.selectedTeamSkillId) ?? null : null,
        passiveSkill: this.selectedPassiveSkillId ? this.latentSkills.find(s => s.id === this.selectedPassiveSkillId) ?? null : null,
        latentSkills: this.latentSkills.filter(s => this.selectedLatentSkillIds.includes(s.id))
      };

      if (this.isEditMode && this.playerId) {
          this.apiService.updatePlayer(this.playerId, payload).subscribe({
              next: () => {
                  this.router.navigate(['/players']);
              },
              error: (error) => {
                  console.error('Error updating player:', error);
                  alert('Error al actualizar el jugador: ' + (error.error?.message || error.message));
              }
          });
      } else {
          this.apiService.createPlayer(payload).subscribe({
              next: (response) => {
                  this.router.navigate(['/players']);
              },
              error: (error) => {
                  console.error('Error creating player:', error);
                  alert('Error al crear el jugador: ' + (error.error?.message || error.message));
              }
          });
      }
    }

    // Helper para mostrar info del bonus
    getBonusDisplayText(bonus: SkillBonus): string {
        const value = bonus.value > 0 ? `+${bonus.value}` : `${bonus.value}`;
        
        switch (bonus.type) {
            case 'stat':
                return `${bonus.statName}: ${value}%`;
            case 'all_stats':
                return `Todos: ${value}%`;
            case 'tech_power_all':
                return `Poder técnicas: ${value}%`;
            case 'tech_power_type':
                return `Poder ${bonus.techniqueType}: ${value}%`;
            case 'tech_power_combined':
                return `Poder combinadas: ${value}%`;
            case 'tech_power_specific':
                const count = bonus.techniqueIds?.length || 0;
                return `Poder ${count} técnica(s): ${value}%`;
            case 'stamina_cost':
                return `Coste stamina: ${value}%`;
            default:
                return `${bonus.type}: ${value}%`;
        }
    }
}
