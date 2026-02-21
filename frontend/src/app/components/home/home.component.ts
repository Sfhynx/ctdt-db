import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent {
    features = [
        {
            icon: 'storage',
            title: 'Base de Datos Completa',
            description: 'Información detallada de jugadores y equipos'
        },
        {
            icon: 'bar_chart',
            title: 'Estadísticas',
            description: 'Stats completas de cada jugador'
        },
        {
            icon: 'sports_esports',
            title: 'Dream Team',
            description: 'Gestiona tu equipo ideal'
        },
        {
            icon: 'star',
            title: 'Actualizaciones',
            description: 'Datos actualizados del juego'
        }
    ];
}
