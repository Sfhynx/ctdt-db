import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormationsService } from '../../services/formations.service';
import { Formation, FormationType, StatName } from '../../types/player-types';

const STAT_LABELS: Record<string, string> = {
  dribble: 'Regate', shot: 'Tiro', pass: 'Pase', tackle: 'Entrada', block: 'Bloqueo', intercept: 'Intercepción',
  speed: 'Velocidad', power: 'Potencia', technique: 'Técnica', punch: 'Puño', catchStat: 'Blocaje', energy: 'Energía'
};

const STAT_KEYS: StatName[] = ['dribble', 'shot', 'pass', 'tackle', 'block', 'intercept', 'speed', 'power', 'technique', 'punch', 'catchStat', 'energy'];

const CATEGORY_OPTIONS: { value: FormationType; label: string }[] = [
  { value: 'Ninguna', label: 'Ninguna' },
  { value: 'Ataque', label: 'Ataque' },
  { value: 'Defensiva', label: 'Defensiva' },
  { value: 'Físico', label: 'Físico' }
];

@Component({
  selector: 'app-admin-formations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-formations.component.html',
  styleUrl: './admin-formations.component.css'
})
export class AdminFormationsComponent implements OnInit {
  formations: Formation[] = [];
  customFormations: Formation[] = [];
  editingId: string | null = null;
  addingNew = false;
  formName = '';
  formCategory: FormationType = 'Ataque';
  formCategoryBonus = 12;
  formExtraStat: StatName | '' = '';
  formExtraPercent = 8;
  saved = false;

  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly statKeys = STAT_KEYS;
  readonly statLabels = STAT_LABELS;

  constructor(private formationsService: FormationsService) {}

  ngOnInit(): void {
    this.loadFormations();
  }

  loadFormations(): void {
    this.formations = this.formationsService.getFormations();
    this.customFormations = this.formationsService.getCustomFormations();
  }

  getFormationLabel(f: Formation): string {
    if (f.category === 'Ninguna' && !f.extraStatBonus) return f.name;
    const parts: string[] = [];
    if (f.category !== 'Ninguna' && f.categoryBonus) {
      parts.push(`+${f.categoryBonus}% ${f.category === 'Ataque' ? 'ATQ' : f.category === 'Defensiva' ? 'DEF' : 'FÍS'}`);
    }
    if (f.extraStatBonus) {
      parts.push(`${this.statLabels[f.extraStatBonus.stat]} +${f.extraStatBonus.percent}%`);
    }
    return parts.length ? `${f.name} (${parts.join(', ')})` : f.name;
  }

  startNew(): void {
    this.editingId = null;
    this.addingNew = true;
    this.formName = '';
    this.formCategory = 'Ataque';
    this.formCategoryBonus = 12;
    this.formExtraStat = '';
    this.formExtraPercent = 8;
  }

  editFormation(f: Formation): void {
    if (f.builtIn) return;
    this.editingId = f.id;
    this.addingNew = false;
    this.formName = f.name;
    this.formCategory = f.category;
    this.formCategoryBonus = f.categoryBonus;
    this.formExtraStat = f.extraStatBonus?.stat ?? '';
    this.formExtraPercent = f.extraStatBonus?.percent ?? 8;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.addingNew = false;
  }

  saveFormation(): void {
    const name = this.formName.trim() || 'Formación';
    const category = this.formCategory;
    const categoryBonus = Math.max(0, Math.min(100, Math.round(this.formCategoryBonus)));
    const extraStatBonus =
      this.formExtraStat && this.formExtraPercent
        ? { stat: this.formExtraStat as StatName, percent: Math.max(0, Math.min(100, Math.round(this.formExtraPercent))) }
        : undefined;

    if (this.editingId) {
      const idx = this.customFormations.findIndex(f => f.id === this.editingId);
      if (idx !== -1) {
        this.customFormations[idx] = {
          ...this.customFormations[idx],
          name: name,
          category,
          categoryBonus,
          extraStatBonus
        };
      }
    } else {
      this.customFormations.push({
        id: this.formationsService.generateCustomId(),
        name,
        category,
        categoryBonus,
        extraStatBonus,
        builtIn: false
      });
    }
    this.formationsService.saveCustomFormations(this.customFormations);
    this.loadFormations();
    this.editingId = null;
    this.addingNew = false;
    this.saved = true;
    setTimeout(() => (this.saved = false), 2000);
  }

  deleteFormation(f: Formation): void {
    if (f.builtIn) return;
    this.customFormations = this.customFormations.filter(x => x.id !== f.id);
    this.formationsService.saveCustomFormations(this.customFormations);
    this.loadFormations();
    if (this.editingId === f.id) this.cancelEdit();
  }

  isEditing(f: Formation): boolean {
    return this.editingId === f.id;
  }

  showForm(): boolean {
    return this.addingNew || this.editingId !== null;
  }
}
