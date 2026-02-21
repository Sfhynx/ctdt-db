import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { TeamSkill, Skill, SkillBonus } from '../../models/skills.model';

interface DeleteSkillConfig {
    confirmMessage: string;
    deleteAction: () => Observable<void>;
    successLogLabel: string;
    errorLabel: string;
}

@Component({
    selector: 'app-skill-manager',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './skill-manager.component.html',
    styleUrl: './skill-manager.component.css'
})
export class SkillManagerComponent implements OnInit {
    activeTab: 'team' | 'generic' = 'team';
    teamSkills: TeamSkill[] = [];
    genericSkills: Skill[] = [];
    filteredGenericSkills: Skill[] = [];
    searchFilter: string = '';

    constructor(
        private readonly apiService: ApiService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Check query params to set active tab
        this.route.queryParams.subscribe(params => {
            if (params['tab'] === 'generic') {
                this.activeTab = 'generic';
            } else if (params['tab'] === 'team') {
                this.activeTab = 'team';
            }
        });
        this.loadSkills();
    }

    setActiveTab(tab: 'team' | 'generic'): void {
        this.activeTab = tab;
        // Update URL with tab query param
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab: tab },
            queryParamsHandling: 'merge'
        });
    }

    loadSkills(): void {
        // Load team skills
        this.apiService.getTeamSkills().subscribe(skills => {
            this.teamSkills = skills;
        });

        // Load generic skills (unified)
        this.apiService.getSkills().subscribe(skills => {
            this.genericSkills = skills;
            this.genericSkills.sort(
              (a, b) => a.name.localeCompare(b.name)
            );
            this.filteredGenericSkills = [...this.genericSkills];
        });
    }

    editTeamSkill(skillId: number): void {
        this.router.navigate(['/admin/skills/team/new'], {
            queryParams: { edit: skillId, tab: 'team' }
        });
    }

    editSkill(skillId: number): void {
        this.router.navigate(['/admin/skills/generic/new'], {
            queryParams: { edit: skillId, tab: 'generic' }
        });
    }

    deleteTeamSkill(skillId: number, skillName: string): void {
        const config: DeleteSkillConfig = {
            confirmMessage: `¿Estás seguro de que quieres eliminar la Team Skill "${skillName}"?`,
            deleteAction: () => this.apiService.deleteTeamSkill(skillId),
            successLogLabel: 'Team Skill',
            errorLabel: 'Team Skill'
        };
        this.deleteSkillInternal(config);
    }

    deleteSkill(skillId: number, skillName: string): void {
        const config: DeleteSkillConfig = {
            confirmMessage: `¿Estás seguro de que quieres eliminar la habilidad "${skillName}"?`,
            deleteAction: () => this.apiService.deleteSkill(skillId),
            successLogLabel: 'Habilidad',
            errorLabel: 'habilidad'
        };
        this.deleteSkillInternal(config);
    }

    private deleteSkillInternal(config: DeleteSkillConfig): void {
        if (!confirm(config.confirmMessage)) {
            return;
        }

        config.deleteAction().subscribe({
            next: () => {
                this.loadSkills();
            },
            error: (error: unknown) => {
                console.error(`Error al eliminar ${config.successLogLabel}:`, error);
                const httpError = error as { error?: { message?: string } };
                if (httpError.error?.message) {
                    alert(httpError.error.message);
                } else {
                    alert(`Error al eliminar la ${config.errorLabel}`);
                }
            }
        });
    }

    navigateToNewTeamSkill(): void {
        this.router.navigate(['/admin/skills/team/new'], {
            queryParams: { tab: 'team' }
        });
    }

    navigateToNewGenericSkill(): void {
        this.router.navigate(['/admin/skills/generic/new'], {
            queryParams: { tab: 'generic' }
        });
    }

    onSearchChange(): void {
        if (!this.searchFilter.trim()) {
            this.filteredGenericSkills = [...this.genericSkills];
            return;
        }

        const filter = this.searchFilter.toLowerCase().trim();
        this.filteredGenericSkills = this.genericSkills.filter(skill =>
            skill.name.toLowerCase().includes(filter) ||
            skill.effect.toLowerCase().includes(filter)
        );
    }

    copyTeamSkill(skillId: number): void {
        this.router.navigate(['/admin/skills/team/new'], {
            queryParams: { copy: skillId, tab: 'team' }
        });
    }

    copySkill(skillId: number): void {
        this.router.navigate(['/admin/skills/generic/new'], {
            queryParams: { copy: skillId, tab: 'generic' }
        });
    }

    // Helper para mostrar info del bonus
    getBonusDisplayText(bonus: SkillBonus): string {
        const value = bonus.value > 0 ? `+${bonus.value}` : `${bonus.value}`;
        
        switch (bonus.type) {
            case 'stat':
                return `${bonus.statName}: ${value}%`;
            case 'all_stats':
                return `Todos los stats: ${value}%`;
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
