import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Skill, SkillBonus } from '../../models/skills.model';
import { Technique } from '../../models/technique.model';
import { Player } from '../../models/player.model';

@Component({
    selector: 'app-generic-skill-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './generic-skill-form.component.html',
    styleUrl: './generic-skill-form.component.css'
})
export class GenericSkillFormComponent implements OnInit {
    skill: Skill = {
        id: 0,
        name: '',
        effect: '',
        bonuses: []
    };

    isEditMode = false;
    skillId?: number;

    // Bonus form
    newBonus: SkillBonus = this.getEmptyBonus();

    bonusTypes = [
        { value: 'stat', label: 'Stat específico' },
        { value: 'all_stats', label: 'Todos los stats' },
        { value: 'tech_power_all', label: 'Poder de técnicas (todas)' },
        { value: 'tech_power_type', label: 'Poder de técnicas (tipo)' },
        { value: 'tech_power_combined', label: 'Poder de técnicas combinadas' },
        { value: 'tech_power_specific', label: 'Poder de técnicas concretas' },
        { value: 'stamina_cost', label: 'Coste de stamina' }
    ];

    statNames = ['dribble', 'shot', 'pass', 'tackle', 'block', 'intercept', 'speed', 'power', 'technique'];
    
    // Tipos de técnica en español (como se usan en el juego)
    techTypes = [
        { value: 'remate', label: 'Remate' },
        { value: 'volea', label: 'Volea' },
        { value: 'cabezazo', label: 'Cabezazo' },
        { value: 'regate', label: 'Regate' },
        { value: 'pase', label: 'Pase' },
        { value: 'pared', label: 'Pared' },
        { value: 'entrada', label: 'Entrada' },
        { value: 'bloqueo', label: 'Bloqueo' },
        { value: 'intercepción', label: 'Intercepción' },
        { value: 'puño', label: 'Puño' },
        { value: 'blocaje', label: 'Blocaje' }
    ];

    // Para selección de técnicas concretas
    allPlayers: Player[] = [];
    selectedPlayerName: string = '';
    playerTechniques: Technique[] = [];
    selectedTechniqueIds: number[] = [];

    constructor(
        private apiService: ApiService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Cargar lista de jugadores para el selector de técnicas concretas
        this.loadPlayers();
        
        this.route.queryParams.subscribe(params => {
            if (params['edit']) {
                this.isEditMode = true;
                this.skillId = +params['edit'];
                this.loadSkill(this.skillId);
            } else if (params['copy']) {
                // Copy mode: load skill but don't set edit mode, so it creates a new one
                this.isEditMode = false;
                this.skillId = undefined;
                const copyId = +params['copy'];
                this.loadSkillForCopy(copyId);
            }
        });
    }

    loadPlayers(): void {
        this.apiService.getPlayers().subscribe({
            next: (players) => {
                this.allPlayers = players;
            },
            error: (error) => {
                console.error('Error loading players:', error);
            }
        });
    }

    // Obtener nombres únicos de jugadores
    getUniquePlayerNames(): string[] {
        const names = new Set(this.allPlayers.map(p => p.name));
        return Array.from(names).sort();
    }

    onPlayerNameChange(): void {
        this.selectedTechniqueIds = [];
        this.playerTechniques = [];
        
        if (this.selectedPlayerName) {
            this.apiService.getTechniquesByPlayerName(this.selectedPlayerName).subscribe({
                next: (techniques) => {
                    this.playerTechniques = techniques;
                },
                error: (error) => {
                    console.error('Error loading techniques:', error);
                }
            });
        }
    }

    toggleTechniqueSelection(techniqueId: number): void {
        const index = this.selectedTechniqueIds.indexOf(techniqueId);
        if (index === -1) {
            this.selectedTechniqueIds.push(techniqueId);
        } else {
            this.selectedTechniqueIds.splice(index, 1);
        }
    }

    isTechniqueSelected(techniqueId: number): boolean {
        return this.selectedTechniqueIds.includes(techniqueId);
    }

    loadSkill(id: number): void {
        this.apiService.getSkill(id).subscribe({
            next: (skill) => {
                this.skill = { ...skill };
                if (!this.skill.bonuses) {
                    this.skill.bonuses = [];
                }
            },
            error: (error) => {
                console.error('Error loading skill:', error);
                alert('Error al cargar la habilidad: ' + (error.error?.message || error.message));
                this.router.navigate(['/admin/skills'], {
                    queryParams: { tab: 'generic' }
                });
            }
        });
    }

    loadSkillForCopy(id: number): void {
        this.apiService.getSkill(id).subscribe({
            next: (skill) => {
                // Copy data but reset ID to 0 to name so it creates a new skill
                this.skill = {
                    id: 0,
                    name: skill.name,
                    effect: skill.effect,
                    bonuses: skill.bonuses ? [...skill.bonuses] : []
                };
            },
            error: (error) => {
                console.error('Error loading skill for copy:', error);
                alert('Error al cargar la habilidad: ' + (error.error?.message || error.message));
                this.router.navigate(['/admin/skills'], {
                    queryParams: { tab: 'generic' }
                });
            }
        });
    }

    addBonus(): void {
        if (this.newBonus.type && this.newBonus.value !== undefined) {
            const bonusToAdd: SkillBonus = {
                type: this.newBonus.type,
                value: this.newBonus.value
            };

            // Añadir campos específicos según el tipo
            if (this.newBonus.type === 'stat' && this.newBonus.statName) {
                bonusToAdd.statName = this.newBonus.statName;
            } else if (this.newBonus.type === 'tech_power_type' && this.newBonus.techniqueType) {
                bonusToAdd.techniqueType = this.newBonus.techniqueType;
            } else if (this.newBonus.type === 'tech_power_specific' && this.selectedTechniqueIds.length > 0) {
                bonusToAdd.techniqueIds = [...this.selectedTechniqueIds];
            }

            this.skill.bonuses!.push(bonusToAdd);
            this.resetBonusForm();
        }
    }

    resetBonusForm(): void {
        this.newBonus = this.getEmptyBonus();
        this.selectedPlayerName = '';
        this.playerTechniques = [];
        this.selectedTechniqueIds = [];
    }

    removeBonus(index: number): void {
        this.skill.bonuses!.splice(index, 1);
    }

    onSubmit(): void {
        if (this.isEditMode && this.skillId) {
            // Update existing skill
            this.apiService.updateSkill(this.skillId, this.skill).subscribe({
                next: () => {
                    this.router.navigate(['/admin/skills'], {
                        queryParams: { tab: 'generic' }
                    });
                },
                error: (error: any) => {
                    console.error('Error updating skill:', error);
                    alert('Error al actualizar la habilidad: ' + (error.error?.message || error.message));
                }
            });
        } else {
            // Create new skill
            this.apiService.createSkill(this.skill).subscribe({
                next: (response: Skill) => {
                    this.router.navigate(['/admin/skills'], {
                        queryParams: { tab: 'generic' }
                    });
                },
                error: (error: any) => {
                    console.error('Error creating skill:', error);
                    alert('Error al crear la habilidad: ' + (error.error?.message || error.message));
                }
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/admin/skills'], {
            queryParams: { tab: 'generic' }
        });
    }

    private getEmptyBonus(): SkillBonus {
        return {
            type: 'stat',
            value: 0,
            statName: 'shot',
            techniqueType: 'remate'
        };
    }

    // Helper para mostrar el tipo de técnica en español
    getTechniqueTypeLabel(type: string): string {
        const found = this.techTypes.find(t => t.value === type);
        return found ? found.label : type;
    }

    // Helper para mostrar nombres de técnicas por IDs
    getTechniqueNamesById(ids: number[]): string {
        if (!ids || ids.length === 0) return '';
        // Buscar en todas las técnicas de todos los jugadores
        const names: string[] = [];
        for (const player of this.allPlayers) {
            for (const tech of player.techniques || []) {
                if (ids.includes(tech.id)) {
                    names.push(tech.name);
                }
            }
        }
        return names.length > 0 ? names.join(', ') : `IDs: ${ids.join(', ')}`;
    }

    // Helper para mostrar info del bonus
    getBonusDisplayInfo(bonus: SkillBonus): string {
        switch (bonus.type) {
            case 'stat':
                return bonus.statName || '';
            case 'all_stats':
                return 'Todos los stats';
            case 'tech_power_all':
                return 'Todas las técnicas';
            case 'tech_power_type':
                return this.getTechniqueTypeLabel(bonus.techniqueType || '');
            case 'tech_power_combined':
                return 'Técnicas combinadas';
            case 'tech_power_specific':
                return this.getTechniqueNamesById(bonus.techniqueIds || []);
            case 'stamina_cost':
                return 'Coste de stamina';
            default:
                return bonus.type;
        }
    }
}
