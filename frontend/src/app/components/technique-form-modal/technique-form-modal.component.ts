import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Technique } from '../../models/technique.model';
import { TechType } from '../../models/tech-type.model';

@Component({
    selector: 'app-technique-form-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './technique-form-modal.component.html',
    styleUrl: './technique-form-modal.component.css',
    inputs: ['visible', 'technique', 'playerName', 'playerPositions', 'techTypes', 'isGoalkeeper', 'allowAllTechniqueTypes']
})
export class TechniqueFormModalComponent implements OnInit, OnChanges {
    @Input() visible: boolean = false;
    @Input() technique: Technique | null = null; // Si es null, se crea nueva; si tiene valor, se edita
    @Input() playerName: string = '';
    /** Posiciones del jugador (DL, MCA, PO, etc.) para filtrar tipos permitidos. */
    @Input() playerPositions: string[] = [];
    /** Tipos de técnica desde la API; si hay datos, solo se muestran los permitidos para las posiciones del jugador. */
    @Input() techTypes: TechType[] = [];
    @Input() isGoalkeeper: boolean = false; // Para filtrar tipos de técnicas (cuando no hay allowAllTechniqueTypes)
    /** Si true, se muestran todos los tipos (campo + portero). Uso: administración de técnicas por nombre, sin versión. */
    @Input() allowAllTechniqueTypes: boolean = false;
    
    @Output() save = new EventEmitter<Technique>();
    @Output() cancel = new EventEmitter<void>();

    formTechnique: Technique = {
        id: 0,
        name: '',
        type: '',
        power: 0,
        staminaCost: 0,
        description: '',
        isMain: false,
        isCombined: false,
        playerName: '',
        appliesLowBallBonus: true,
        appliesHighBallBonus: true
    };

    // Tipos de técnicas para jugadores de campo
    fieldPlayerTypes = [
        'Remate',
        'Volea',
        'Cabezazo',
        'Regate',
        'Pase',
        'Pared',
        'Entrada',
        'Intercepción',
        'Bloqueo'
    ];

    // Tipos de técnicas para porteros
    goalkeeperTypes = [
        'Puño',
        'Blocaje'
    ];

    /** Tipos de técnica a mostrar: desde API filtrados por posiciones, lista fija por isGoalkeeper, o todos si allowAllTechniqueTypes. */
    get techniqueTypes(): string[] {
        if (this.allowAllTechniqueTypes) {
            return [...this.fieldPlayerTypes, ...this.goalkeeperTypes];
        }
        if (this.techTypes?.length > 0) {
            const allowed = this.techTypes.filter(tt => {
                const codes = tt.allowedPositionCodes ?? [];
                if (codes.length === 0) return true; // vacío = todas las posiciones
                return codes.some(c => (this.playerPositions ?? []).some(p => (p || '').toUpperCase() === (c || '').toUpperCase()));
            });
            return allowed.map(tt => tt.name);
        }
        return this.isGoalkeeper ? this.goalkeeperTypes : this.fieldPlayerTypes;
    }

    get isEditMode(): boolean {
        return this.technique !== null && this.technique.id !== 0;
    }

    get isValid(): boolean {
        return !!(
            this.formTechnique.name &&
            this.formTechnique.type &&
            this.formTechnique.power !== null &&
            this.formTechnique.power !== undefined &&
            this.formTechnique.staminaCost !== null &&
            this.formTechnique.staminaCost !== undefined
        );
    }

    ngOnInit(): void {
        this.resetForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.resetForm();
            if (this.technique) {
                this.formTechnique = {
                    ...this.technique,
                    appliesLowBallBonus: this.technique.appliesLowBallBonus !== false,
                    appliesHighBallBonus: this.technique.appliesHighBallBonus !== false
                };
            } else {
                this.formTechnique.playerName = this.playerName;
            }
        }
    }

    resetForm(): void {
        this.formTechnique = {
            id: 0,
            name: '',
            type: '',
            power: 0,
            staminaCost: 0,
            description: '',
            isMain: false,
            isCombined: false,
            playerName: this.playerName,
            appliesLowBallBonus: true,
            appliesHighBallBonus: true
        };
    }

    onSave(): void {
        if (!this.isValid) {
            return;
        }
        
        this.formTechnique.playerName = this.playerName;
        this.save.emit({ ...this.formTechnique });
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
