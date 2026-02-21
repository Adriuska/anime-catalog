import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Anime, AnimeListResponse } from '../models/anime.model';

export interface AnimeFilters {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  isOngoing?: string;
  inLibrary?: string;
  isFavorite?: string;
  studioId?: string;
  minRating?: string;
  maxRating?: string;
}

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly baseUrl = `${API_BASE_URL}/animes`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: AnimeFilters): Observable<AnimeListResponse> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<AnimeListResponse>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Anime> {
    return this.http.get<Anime>(`${this.baseUrl}/${id}`);
  }

  create(payload: Anime): Observable<Anime> {
    return this.http.post<Anime>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<Anime>): Observable<Anime> {
    return this.http.patch<Anime>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
