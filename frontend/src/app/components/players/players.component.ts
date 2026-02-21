import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Player } from '../../models/player.model';
import { Country } from '../../models/country.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-players',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './players.component.html',
    styleUrl: './players.component.css'
})
export class PlayersComponent implements OnInit, AfterViewInit {
    players: Player[] = [];
    filteredPlayers: Player[] = [];
    paginatedPlayers: Player[] = [];
    loading = true;
    error = '';
    imageBaseUrl = environment.apiBaseUrl;
    iconsBaseUrl = environment.apiBaseUrl + '/icons';

    // Filtros
    filterName: string = '';
    filterPosition: string = '';
    filterElement: string = '';
    filterCountry: string = '';

    // Opciones para los selectores
    availablePositions: string[] = [];
    availableElements: string[] = ['Agilidad', 'Fuerza', 'Destreza'];
    availableCountries: Country[] = [];

    // Paginación
    currentPage: number = 1;
    itemsPerPage: number = 10;
    totalPages: number = 1;
    
    // Altura de cada fila (en píxeles)
    private readonly ROW_HEIGHT = 90; // Altura de cada fila de jugador
    private readonly GRID_CARD_HEIGHT = 280; // Altura aproximada de cada tarjeta en modo grid
    private readonly HEADER_HEIGHT = 60; // Altura aproximada de la cabecera de la tabla
    private readonly PAGINATION_HEIGHT = 50; // Altura aproximada de la paginación (ahora más compacta y arriba)
    private readonly FILTERS_HEIGHT = 180; // Altura aproximada de los filtros cuando están visibles
    private readonly TOGGLE_BUTTON_HEIGHT = 50; // Altura del botón de toggle de filtros
    private readonly CONTAINER_PADDING = 64; // Padding del contenedor (2rem * 2 = 64px)
    private readonly TABLE_BOTTOM_MARGIN = 32; // Margen inferior de la tabla (1rem = 16px, pero usamos 2rem = 32px para el margen + padding)

    showFilters = false;
    viewMode: 'list' | 'grid' = 'grid';

    constructor(
        private apiService: ApiService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadAuxiliaryData();
        this.loadPlayers();
        this.calculateItemsPerPage();
    }

    ngAfterViewInit(): void {
        // Recalcular después de que la vista se haya inicializado
        setTimeout(() => {
            this.calculateItemsPerPage();
            this.updatePagination();
        }, 100);
    }

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.calculateItemsPerPage();
        this.updatePagination();
    }

    calculateItemsPerPage(): void {
        if (this.viewMode === 'grid') {
            // En modo grid: 4 filas x 7 columnas = 28 elementos
            this.itemsPerPage = 28;
        } else {
            // Modo lista/tabla: 30 elementos por página
            this.itemsPerPage = 30;
        }
        
        // Si hay paginación visible, asegurar que siempre haya al menos 1 página
        if (this.itemsPerPage < 1) {
            this.itemsPerPage = 1;
        }
    }
    
    toggleViewMode(): void {
        this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
        this.calculateItemsPerPage();
        this.updatePagination();
    }

    loadAuxiliaryData(): void {
      this.apiService.getCountries().subscribe(data => {
        this.availableCountries = data;
      });
      /*this.apiService.getSeries().subscribe(data => {
        this.series = data;
      });
      this.apiService.getTeams().subscribe(data => {
        this.teams = data;
      });*/
    }

    loadPlayers(): void {
        this.loading = true;
        this.error = '';

        this.apiService.getPlayers().subscribe({
            next: (data) => {
                this.players = data;
                this.extractAvailablePositions();
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Error al conectar con el backend: ' + err.message;
                this.loading = false;
                console.error('Error fetching players:', err);
            }
        });
    }

    extractAvailablePositions(): void {
        const positionsSet = new Set<string>();
        this.players.forEach(player => {
            player.positions.forEach(pos => positionsSet.add(pos));
        });
        this.availablePositions = Array.from(positionsSet).sort();
    }

    applyFilters(): void {
        this.filteredPlayers = this.players.filter(player => {
            // Filtro por nombre
            const matchesName = !this.filterName ||
                player.name.toLowerCase().includes(this.filterName.toLowerCase());

            // Filtro por posición
            const matchesPosition = !this.filterPosition ||
                player.positions.includes(this.filterPosition);

            // Filtro por elemento/color
            const matchesElement = !this.filterElement ||
                (player.element?.name?.toLowerCase() === this.filterElement.toLowerCase());

            // Filtro por nacionalidad
            const matchesCountry = !this.filterCountry ||
                (player.country?.name?.toLowerCase() === this.filterCountry.toLowerCase());

            return matchesName && matchesPosition && matchesElement && matchesCountry;
        });

        // Ordenar por total de mayor a menor
        this.filteredPlayers = this.filteredPlayers.sort(
          (a, b) => (b.stats.total ?? 0) - (a.stats.total ?? 0)
        );
        // Resetear a la primera página cuando se aplican filtros
        this.currentPage = 1;
        this.updatePagination();
    }

    toggleFilters(): void {
      this.showFilters = !this.showFilters;
      
      // Recalcular inmediatamente tanto al abrir como al cerrar los filtros
      // para que el cambio en la tabla sea simultáneo con la animación de los filtros
      this.calculateItemsPerPage();
      this.updatePagination();
    }

    updatePagination(): void {
        // Calcular total de páginas
        this.totalPages = Math.ceil(this.filteredPlayers.length / this.itemsPerPage);

        // Asegurar que currentPage no exceda el total de páginas
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }

        // Calcular índices para la página actual
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;

        // Obtener los jugadores de la página actual
        this.paginatedPlayers = this.filteredPlayers.slice(startIndex, endIndex);
    }

    onFilterChange(): void {
        this.applyFilters();
    }

    clearFilters(): void {
        this.filterName = '';
        this.filterPosition = '';
        this.filterElement = '';
        this.applyFilters();
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const maxVisible = 5; // Máximo de números de página visibles

        if (this.totalPages <= maxVisible) {
            // Si hay pocas páginas, mostrar todas
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Mostrar páginas alrededor de la actual
            let start = Math.max(1, this.currentPage - 2);
            let end = Math.min(this.totalPages, start + maxVisible - 1);

            // Ajustar inicio si estamos cerca del final
            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    }

    onPlayerClick(playerId: number): void {
        this.router.navigate(['/players', playerId]);
    }

    getPositionColor(position: string): string {
        return '#888888';
    }

    getElementColor(element: string): string {
        const elementLower = element.toLowerCase();
        if (elementLower.includes('agilidad')) return '#4169E1'; // Azul
        if (elementLower.includes('fuerza')) return '#DC143C'; // Rojo
        if (elementLower.includes('destreza') || elementLower.includes('destreza')) return '#228B22'; // Verde
        return '#888888'; // Gris por defecto
    }

    getImageUrl(player: Player): string {
      if (!player.cardImageUrl) return '';
      if (player.cardImageUrl.startsWith('http')) return player.cardImageUrl;
      return `${this.imageBaseUrl}${player.cardImageUrl}`;
    }

    getStartIndex(): number {
      return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndIndex(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredPlayers.length);
    }

    getPositionsDisplay(positions: string[]): string {
        return positions.join(' / ');
    }

    getCategoryIconUrl(category: string | undefined): string {
        if (!category) return '';
        const iconMap: { [key: string]: string } = {
            'DreamFest': 'DF.png',
            'DreamCollection': 'DC.png',
            'SuperStar': 'SS.png'
        };
        const iconFile = iconMap[category] || '';
        return iconFile ? `${this.iconsBaseUrl}/${iconFile}` : '';
    }
}
