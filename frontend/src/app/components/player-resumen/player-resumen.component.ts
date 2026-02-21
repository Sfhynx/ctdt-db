import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeStyle } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerResumenStateService } from '../../services/player-resumen-state.service';
import { FormationsService } from '../../services/formations.service';
import { Player } from '../../models/player.model';
import { Technique } from '../../models/technique.model';
import { environment } from '../../../environments/environment';

export interface TechniqueWithSummary {
  technique: Technique;
  momentum: number;
  modifiedStaminaCost: number;
}

export interface PlayerResumenState {
  player: Player;
  teamSkillBonus: number;
  bondBonus: number;
  formationId: string;
  techniquesWithSummary: TechniqueWithSummary[];
  bestTechniquesWithSummary: TechniqueWithSummary[];
  passiveSkillActive?: boolean;
  activeLatentSkillIds?: number[];
}

@Component({
  selector: 'app-player-resumen',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './player-resumen.component.html',
  styleUrl: './player-resumen.component.css'
})
export class PlayerResumenComponent implements OnInit {
  player: Player | null = null;
  teamSkillBonus = 0;
  bondBonus = 0;
  formationId = 'ninguna';
  techniquesWithSummary: TechniqueWithSummary[] = [];
  bestTechniquesWithSummary: TechniqueWithSummary[] = [];
  /** Pasiva marcada como activa para el momentum (desde estado) */
  passiveSkillActive = false;
  /** IDs de latentes activas para el momentum (desde estado) */
  activeLatentSkillIds: number[] = [];
  loading = true;
  error = '';
  fromState = false;

  private readonly imageBaseUrl = (environment.apiBaseUrl || '').replace(/\/$/, '');
  private readonly iconsBasePath = (environment.apiBaseUrl || '').replace(/\/$/, '') + '/icons';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private resumenStateService: PlayerResumenStateService,
    private formationsService: FormationsService,
    private sanitizer: DomSanitizer
  ) {}

  getFormationDisplayName(): string {
    const f = this.formationsService.getFormationById(this.formationId);
    return f?.name ?? this.formationId;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? parseInt(idParam, 10) : null;

    // Prioridad 1: estado pasado por el servicio (navegación desde player-detail con bonos y momentum calculados)
    const stateFromService = this.resumenStateService.consumeState();
    if (stateFromService?.player && stateFromService.player.id === (id ?? stateFromService.player.id)) {
      this.applyState(stateFromService);
      return;
    }

    // Prioridad 2: estado en la navegación (por si el router lo conserva)
    const nav = this.router.getCurrentNavigation();
    const stateFromRouter = nav?.extras?.state as PlayerResumenState | undefined;
    if (stateFromRouter?.player && stateFromRouter.player.id === (id ?? stateFromRouter.player.id)) {
      this.applyState(stateFromRouter);
      return;
    }

    if (id != null && !isNaN(id)) {
      this.apiService.getPlayer(id).subscribe({
        next: (p) => {
          this.player = p;
          this.teamSkillBonus = 0;
          this.bondBonus = 0;
          this.formationId = 'ninguna';
          this.techniquesWithSummary = (p.techniques ?? []).map(t => ({
            technique: t,
            momentum: 0,
            modifiedStaminaCost: t.staminaCost
          }));
          this.bestTechniquesWithSummary = [];
          this.fromState = false;
          this.loading = false;
        },
        error: () => {
          this.error = 'Jugador no encontrado';
          this.loading = false;
        }
      });
    } else {
      this.error = 'ID de jugador no válido';
      this.loading = false;
    }
  }

  private applyState(state: PlayerResumenState): void {
    this.player = state.player;
    this.teamSkillBonus = state.teamSkillBonus ?? 0;
    this.bondBonus = state.bondBonus ?? 0;
    this.formationId = state.formationId ?? 'ninguna';
    this.techniquesWithSummary = state.techniquesWithSummary ?? [];
    this.bestTechniquesWithSummary = state.bestTechniquesWithSummary ?? [];
    this.passiveSkillActive = state.passiveSkillActive ?? false;
    this.activeLatentSkillIds = state.activeLatentSkillIds ?? [];
    this.fromState = true;
    this.loading = false;
  }

  /** Team Skill está activa para el momentum si hay bonificación aplicada. */
  isTeamSkillActive(): boolean {
    return this.teamSkillBonus > 0;
  }

  /** Pasiva está activa para el momentum (desde estado de estadísticas). */
  isPassiveSkillActive(): boolean {
    return this.passiveSkillActive;
  }

  /** Latente con este id está activa para el momentum. */
  isLatentSkillActive(skillId: number): boolean {
    return this.activeLatentSkillIds.includes(skillId);
  }

  goBack(): void {
    if (this.player) {
      this.router.navigate(['/players', this.player.id]);
    } else {
      this.router.navigate(['/players']);
    }
  }

  getImageUrl(p: Player | null): string {
    if (!p?.cardImageUrl) return '';
    if (p.cardImageUrl.startsWith('http')) return p.cardImageUrl;
    const path = p.cardImageUrl.startsWith('/') ? p.cardImageUrl : '/' + p.cardImageUrl;
    return this.imageBaseUrl ? this.imageBaseUrl + path : path;
  }

  /** Estilo seguro para la imagen de fondo de la tarjeta (permite URLs del backend). */
  getPlayerCardBackgroundStyle(): SafeStyle {
    if (!this.player?.cardImageUrl) return this.sanitizer.bypassSecurityTrustStyle('background-image: none');
    const url = this.getImageUrl(this.player);
    return this.sanitizer.bypassSecurityTrustStyle(`background-image: url(${url})`);
  }

  getElementColor(element: string): string {
    if (!element) return '#888';
    const e = element.toLowerCase();
    if (e.includes('agilidad')) return '#4169E1';
    if (e.includes('fuerza')) return '#DC143C';
    if (e.includes('destreza')) return '#228B22';
    return '#888';
  }

  getPositionsDisplay(positions: string[] | undefined): string {
    return positions?.join(' / ') ?? '';
  }

  getTechniqueIconUrl(type: string): string {
    let t = type;
    if (t === 'Intercepción') t = 'Intercepcion';
    if (t === 'Puño') t = 'puno';
    const base = this.iconsBasePath.replace(/\/$/, '');
    return `${base}/${t.toLowerCase()}.png`;
  }

  /** URL segura para el icono de técnica (evita reescritura con base href en producción). */
  getTechniqueIconSafeUrl(type: string): SafeResourceUrl {
    const url = this.getTechniqueIconUrl(type);
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  getCategoryIconUrl(category: string | undefined): string {
    if (!category) return '';
    const iconMap: { [key: string]: string } = {
      'DreamFest': 'DF.png',
      'DreamCollection': 'DC.png',
      'SuperStar': 'SS.png'
    };
    const iconFile = iconMap[category] || '';
    const base = this.iconsBasePath.replace(/\/$/, '');
    return iconFile ? `${base}/${iconFile}` : '';
  }

  /** URL segura para el icono de categoría (evita reescritura con base href en producción). */
  getCategoryIconSafeUrl(category: string | undefined): SafeResourceUrl {
    const url = this.getCategoryIconUrl(category);
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  /** Convierte una URL de imagen (API estática) en data URL para evitar CORS en html2canvas. */
  private fetchImageAsDataUrl(url: string): Promise<string | null> {
    if (!url) return Promise.resolve(null);
    return fetch(url, { mode: 'cors' })
      .then(res => (res.ok ? res.blob() : Promise.reject(new Error('Failed to load'))))
      .then(blob => new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      }))
      .catch(() => null);
  }

  /** Descarga el contenido del resumen como PNG. Precarga todas las imágenes (jugador, categoría, iconos de técnicas) desde la API como data URLs e las inyecta en el clon para que html2canvas las dibuje. */
  downloadResumenAsImage(): void {
    if (!this.player) return;
    const el = document.getElementById('resumen-capture');
    if (!el) return;

    const urls = new Set<string>();
    const playerImageUrl = this.getImageUrl(this.player);
    if (playerImageUrl) urls.add(playerImageUrl);
    if (this.player.category) {
      const catUrl = this.getCategoryIconUrl(this.player.category);
      if (catUrl) urls.add(catUrl);
    }
    this.techniquesWithSummary.forEach(item => urls.add(this.getTechniqueIconUrl(item.technique.type)));
    this.bestTechniquesWithSummary.forEach(item => urls.add(this.getTechniqueIconUrl(item.technique.type)));

    const urlList = Array.from(urls);
    Promise.all(urlList.map(url => this.fetchImageAsDataUrl(url).then(dataUrl => ({ url, dataUrl }))))
      .then(results => {
        const urlToDataUrl = new Map<string, string>();
        results.forEach(({ url, dataUrl }) => {
          if (dataUrl) urlToDataUrl.set(url, dataUrl);
        });
        this.runHtml2Canvas(el, urlToDataUrl, playerImageUrl);
      })
      .catch(() => this.runHtml2Canvas(el, new Map(), null));
  }

  private runHtml2Canvas(el: HTMLElement, urlToDataUrl: Map<string, string>, playerImageUrl: string | null): void {
    const playerDataUrl = playerImageUrl ? urlToDataUrl.get(playerImageUrl) ?? null : null;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(el, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc, _clonedEl) => {
          const card = clonedDoc.querySelector('.resumen-player-card');
          const domain = window.location.origin;
          if (card && card instanceof HTMLElement && playerDataUrl) {
            card.style.backgroundImage = `url(${playerDataUrl})`;
          }
          clonedDoc.querySelectorAll('img').forEach(img => {
            let src = img.getAttribute('src') || (img as HTMLImageElement).src;
            if (!src.startsWith(domain)) {
              src = domain + src;
            }
            if (src && urlToDataUrl.has(src)) {
              img.setAttribute('src', urlToDataUrl.get(src)!);
            }
          });
        }
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `resumen-${this.player!.name.replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => console.error('Error al exportar resumen:', err));
    }).catch(err => console.error('Error al cargar html2canvas:', err));
  }
}
