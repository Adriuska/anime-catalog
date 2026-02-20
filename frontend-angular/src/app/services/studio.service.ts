import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Studio } from '../models/studio.model';

@Injectable({ providedIn: 'root' })
export class StudioService {
  private readonly baseUrl = `${API_BASE_URL}/studios`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Studio[]> {
    return this.http.get<Studio[]>(this.baseUrl);
  }

  getById(id: string): Observable<Studio> {
    return this.http.get<Studio>(`${this.baseUrl}/${id}`);
  }

  create(payload: Studio): Observable<Studio> {
    return this.http.post<Studio>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<Studio>): Observable<Studio> {
    return this.http.patch<Studio>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
