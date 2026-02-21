import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player, PlayerCreateUpdatePayload } from '../models/player.model';
import { Skill, TeamSkill } from '../models/skills.model';
import { Country } from '../models/country.model';
import { Series } from '../models/series.model';
import { Team } from '../models/team.model';
import { Rarity } from '../models/rarity.model';
import { Element } from '../models/element.model';
import { TechType } from '../models/tech-type.model';
import { PlayerBase } from '../models/player-base.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = environment.apiBaseUrl + '/api';

    constructor(private http: HttpClient) { }

    // Players
    getPlayers(): Observable<Player[]> {
        return this.http.get<Player[]>(`${this.apiUrl}/players`);
    }

    getPlayer(id: number): Observable<Player> {
        return this.http.get<Player>(`${this.apiUrl}/players/${id}`);
    }

    createPlayer(payload: PlayerCreateUpdatePayload): Observable<Player> {
        return this.http.post<Player>(`${this.apiUrl}/players`, payload);
    }

    updatePlayer(id: number, payload: PlayerCreateUpdatePayload): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/players/${id}`, payload);
    }

    deletePlayer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/players/${id}`);
    }

    // Skills (unified)
    getSkills(): Observable<Skill[]> {
        return this.http.get<Skill[]>(`${this.apiUrl}/skills`);
    }

    getSkill(id: number): Observable<Skill> {
        return this.http.get<Skill>(`${this.apiUrl}/skills/${id}`);
    }

    createSkill(skill: Skill): Observable<Skill> {
        return this.http.post<Skill>(`${this.apiUrl}/skills`, skill);
    }

    updateSkill(id: number, skill: Skill): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/skills/${id}`, skill);
    }

    deleteSkill(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/skills/${id}`);
    }

    // Team Skills
    getTeamSkills(): Observable<TeamSkill[]> {
        return this.http.get<TeamSkill[]>(`${this.apiUrl}/skills/team`);
    }

    getTeamSkill(id: number): Observable<TeamSkill> {
        return this.http.get<TeamSkill>(`${this.apiUrl}/skills/team/${id}`);
    }

    createTeamSkill(skill: TeamSkill): Observable<TeamSkill> {
        return this.http.post<TeamSkill>(`${this.apiUrl}/skills/team`, skill);
    }

    updateTeamSkill(id: number, skill: TeamSkill): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/skills/team/${id}`, skill);
    }

    deleteTeamSkill(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/skills/team/${id}`);
    }

    // Techniques
    getAvailableTechniques(playerId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/players/${playerId}/available-techniques`);
    }

    getPlayersWithTechniques(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/players/with-techniques`);
    }

    getTechniquesByPlayerName(playerName: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/techniques/player/${encodeURIComponent(playerName)}`);
    }

    createTechnique(technique: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/techniques`, technique);
    }

    updateTechnique(id: number, technique: any): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/techniques/${id}`, technique);
    }

    deleteTechnique(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/techniques/${id}`);
    }

    // Rarities
    getRarities(): Observable<Rarity[]> {
        return this.http.get<Rarity[]>(`${this.apiUrl}/auxiliarydata/rarities`);
    }
    createRarity(rarity: Rarity): Observable<Rarity> {
        return this.http.post<Rarity>(`${this.apiUrl}/auxiliarydata/rarities`, rarity);
    }
    updateRarity(id: number, rarity: Rarity): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/auxiliarydata/rarities/${id}`, rarity);
    }
    deleteRarity(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/auxiliarydata/rarities/${id}`);
    }

    // Elements
    getElements(): Observable<Element[]> {
        return this.http.get<Element[]>(`${this.apiUrl}/auxiliarydata/elements`);
    }
    createElement(element: Element): Observable<Element> {
        return this.http.post<Element>(`${this.apiUrl}/auxiliarydata/elements`, element);
    }
    updateElement(id: number, element: Element): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/auxiliarydata/elements/${id}`, element);
    }
    deleteElement(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/auxiliarydata/elements/${id}`);
    }

    // TechTypes
    getTechTypes(): Observable<TechType[]> {
        return this.http.get<TechType[]>(`${this.apiUrl}/auxiliarydata/techtypes`);
    }
    createTechType(techType: TechType): Observable<TechType> {
        return this.http.post<TechType>(`${this.apiUrl}/auxiliarydata/techtypes`, techType);
    }
    updateTechType(id: number, techType: TechType): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/auxiliarydata/techtypes/${id}`, techType);
    }
    deleteTechType(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/auxiliarydata/techtypes/${id}`);
    }

    // PlayerBases (nombres de jugador para autocompletado y alta)
    getPlayerBases(search?: string): Observable<PlayerBase[]> {
        const url = `${this.apiUrl}/auxiliarydata/playerbases`;
        if (search != null && search.trim() !== '') {
            return this.http.get<PlayerBase[]>(url, { params: { search: search.trim() } });
        }
        return this.http.get<PlayerBase[]>(url);
    }
    createPlayerBase(playerBase: PlayerBase): Observable<PlayerBase> {
        return this.http.post<PlayerBase>(`${this.apiUrl}/auxiliarydata/playerbases`, playerBase);
    }
    updatePlayerBase(id: number, playerBase: PlayerBase): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/auxiliarydata/playerbases/${id}`, playerBase);
    }
    deletePlayerBase(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/auxiliarydata/playerbases/${id}`);
    }

    // Countries
    getCountries(): Observable<Country[]> {
      return this.http.get<Country[]>(`${this.apiUrl}/auxiliarydata/countries`);
    }

    createCountry(country: Country): Observable<Country> {
      return this.http.post<Country>(`${this.apiUrl}/auxiliarydata/countries`, country);
    }

    updateCountry(id: number, country: Country): Observable<void> {
      return this.http.put<void>(`${this.apiUrl}/auxiliarydata/countries/${id}`, country);
    }

    deleteCountry(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/auxiliarydata/countries/${id}`);
    }

    // Series
    getSeries(): Observable<Series[]> {
      return this.http.get<Series[]>(`${this.apiUrl}/auxiliarydata/series`);
    }

    createSeries(series: Series): Observable<Series> {
      return this.http.post<Series>(`${this.apiUrl}/auxiliarydata/series`, series);
    }

    updateSeries(id: number, series: Series): Observable<void> {
      return this.http.put<void>(`${this.apiUrl}/auxiliarydata/series/${id}`, series);
    }

    deleteSeries(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/auxiliarydata/series/${id}`);
    }

    // Teams
    getTeams(): Observable<Team[]> {
      return this.http.get<Team[]>(`${this.apiUrl}/auxiliarydata/teams`);
    }

    createTeam(team: Team): Observable<Team> {
      return this.http.post<Team>(`${this.apiUrl}/auxiliarydata/teams`, team);
    }

    updateTeam(id: number, team: Team): Observable<void> {
      return this.http.put<void>(`${this.apiUrl}/auxiliarydata/teams/${id}`, team);
    }

    deleteTeam(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/auxiliarydata/teams/${id}`);
    }

    uploadPlayerImage(file: File, playerName: string, version: string): Observable<{ imageUrl: string }> {
      const formData = new FormData();
      formData.append('file', file);

      return this.http.post<{ imageUrl: string }>(
          `${this.apiUrl}/players/upload-image?playerName=${encodeURIComponent(playerName)}&version=${encodeURIComponent(version)}`,
          formData
      );
  }
}
