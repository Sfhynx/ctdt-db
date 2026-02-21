import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { TeamSkill } from '../../models/skills.model';

@Component({
    selector: 'app-team-skill-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './team-skill-form.component.html',
    styleUrl: './team-skill-form.component.css'
})
export class TeamSkillFormComponent implements OnInit {
    teamSkill: TeamSkill = {
        id: 0,
        name: '',
        effect: ''
    };

    isEditMode = false;
    skillId?: number;

    constructor(
        private apiService: ApiService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['edit']) {
                this.isEditMode = true;
                this.skillId = +params['edit'];
                this.loadTeamSkill(this.skillId);
            } else if (params['copy']) {
                // Copy mode: load skill but don't set edit mode, so it creates a new one
                this.isEditMode = false;
                this.skillId = undefined;
                const copyId = +params['copy'];
                this.loadTeamSkillForCopy(copyId);
            }
        });
    }

    loadTeamSkill(id: number): void {
        this.apiService.getTeamSkill(id).subscribe({
            next: (skill) => {
                this.teamSkill = { ...skill };
            },
            error: (error) => {
                console.error('Error loading team skill:', error);
                alert('Error al cargar la team skill: ' + (error.error?.message || error.message));
                this.router.navigate(['/admin/skills'], {
                    queryParams: { tab: 'team' }
                });
            }
        });
    }

    loadTeamSkillForCopy(id: number): void {
        this.apiService.getTeamSkill(id).subscribe({
            next: (skill) => {
                // Copy data but reset ID to 0 so it creates a new skill
                this.teamSkill = {
                    id: 0,
                    name: skill.name,
                    effect: skill.effect
                };
            },
            error: (error) => {
                console.error('Error loading team skill for copy:', error);
                alert('Error al cargar la team skill: ' + (error.error?.message || error.message));
                this.router.navigate(['/admin/skills'], {
                    queryParams: { tab: 'team' }
                });
            }
        });
    }

    onSubmit(): void {
        if (this.isEditMode && this.skillId) {
            // Update existing team skill
            this.apiService.updateTeamSkill(this.skillId, this.teamSkill).subscribe({
                next: () => {
                    this.router.navigate(['/admin/skills'], {
                        queryParams: { tab: 'team' }
                    });
                },
                error: (error) => {
                    console.error('Error updating team skill:', error);
                    alert('Error al actualizar la team skill: ' + (error.error?.message || error.message));
                }
            });
        } else {
            // Create new team skill
            this.apiService.createTeamSkill(this.teamSkill).subscribe({
                next: (response) => {
                    this.router.navigate(['/admin/skills'], {
                        queryParams: { tab: 'team' }
                    });
                },
                error: (error) => {
                    console.error('Error creating team skill:', error);
                    alert('Error al crear la team skill: ' + (error.error?.message || error.message));
                }
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/admin/skills'], {
            queryParams: { tab: 'team' }
        });
    }
}
