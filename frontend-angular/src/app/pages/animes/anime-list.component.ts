import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Anime } from '../../models/anime.model';
import { Studio } from '../../models/studio.model';
import { AnimeService } from '../../services/anime.service';
import { StudioService } from '../../services/studio.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { getAnimeImageByTitle, getPreferredAnimeImage } from '../../core/anime-images';

@Component({
  selector: 'app-anime-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent, AlertComponent, ConfirmModalComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ pageTitle }}</h2>
      <a class="btn btn-primary" routerLink="/animes/new">Nuevo anime</a>
    </div>

    <div class="d-flex flex-wrap gap-2 mb-3">
      <a class="btn btn-sm" [class.btn-dark]="mode === 'catalog'" [class.btn-outline-dark]="mode !== 'catalog'" routerLink="/animes">Catálogo</a>
      <a class="btn btn-sm" [class.btn-dark]="mode === 'library'" [class.btn-outline-dark]="mode !== 'library'" routerLink="/library">Biblioteca</a>
      <a class="btn btn-sm" [class.btn-dark]="mode === 'favorites'" [class.btn-outline-dark]="mode !== 'favorites'" routerLink="/favorites">Favoritos</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>
    <app-alert [message]="successMessage" type="success"></app-alert>

    <form [formGroup]="filtersForm" class="card card-body mb-3" (ngSubmit)="applyFilters()">
      <div class="row g-2">
        <div class="col-md-3"><input class="form-control" formControlName="search" placeholder="Buscar título" /></div>
        <div class="col-md-2"><input class="form-control" formControlName="genre" placeholder="Género" /></div>
        <div class="col-md-2">
          <select class="form-select" formControlName="isOngoing">
            <option value="">Todos los estados</option>
            <option value="true">En emisión</option>
            <option value="false">Finalizado</option>
          </select>
        </div>
        <div class="col-md-2">
          <select class="form-select" formControlName="studioId">
            <option value="">Todos los estudios</option>
            <option *ngFor="let studio of studios" [value]="studio._id">{{ studio.name }}</option>
          </select>
        </div>
        <div class="col-md-1"><input class="form-control" formControlName="minRating" placeholder="Mín" /></div>
        <div class="col-md-1"><input class="form-control" formControlName="maxRating" placeholder="Máx" /></div>
        <div class="col-md-1"><button class="btn btn-dark w-100" type="submit">Ir</button></div>
      </div>
    </form>

    <app-loader [visible]="loading"></app-loader>

    <div class="table-responsive" *ngIf="!loading">
      <table class="table table-striped align-middle">
        <thead>
          <tr><th style="width: 92px;">Póster</th><th>Título</th><th>Episodios</th><th>Puntuación</th><th>Estado</th><th>Estudio</th><th>Colección</th><th class="text-end">Acciones</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let anime of animes">
            <td>
              <img
                [src]="getPreferredImage(anime, 'poster')"
                class="rounded"
                [alt]="anime.title"
                style="width: 72px; height: 96px; object-fit: cover;"
                (error)="onImageError($event, anime.title, 'poster')"
              />
            </td>
            <td>{{ anime.title }}</td>
            <td>{{ anime.episodes }}</td>
            <td>{{ anime.rating }}</td>
            <td>{{ anime.isOngoing ? 'En emisión' : 'Finalizado' }}</td>
            <td>{{ getStudioName(anime) }}</td>
            <td>
              <div class="d-flex flex-wrap gap-1">
                <button class="btn btn-sm" [class.btn-primary]="anime.inLibrary" [class.btn-outline-primary]="!anime.inLibrary" (click)="toggleLibrary(anime)">
                  {{ anime.inLibrary ? 'En biblioteca' : 'Añadir biblioteca' }}
                </button>
                <button class="btn btn-sm" [class.btn-warning]="anime.isFavorite" [class.btn-outline-warning]="!anime.isFavorite" (click)="toggleFavorite(anime)">
                  {{ anime.isFavorite ? '★ Favorito' : '☆ Favorito' }}
                </button>
              </div>
            </td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary me-2" [routerLink]="['/animes', anime._id]">Detalle</a>
              <a class="btn btn-sm btn-outline-secondary me-2" [routerLink]="['/animes', anime._id, 'edit']">Editar</a>
              <button class="btn btn-sm btn-outline-danger" (click)="openDelete(anime)">Eliminar</button>
            </td>
          </tr>
          <tr *ngIf="animes.length === 0"><td colspan="8" class="text-center">No hay animes en esta sección.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-between align-items-center" *ngIf="!loading">
      <span>Página {{ page }} / {{ totalPages }}</span>
      <div class="btn-group">
        <button class="btn btn-outline-dark" [disabled]="page <= 1" (click)="changePage(page - 1)">Anterior</button>
        <button class="btn btn-outline-dark" [disabled]="page >= totalPages" (click)="changePage(page + 1)">Siguiente</button>
      </div>
    </div>

    <app-confirm-modal [open]="deleteModalOpen" [message]="'Delete anime ' + (selectedAnime?.title || '') + '?'" (cancel)="closeDelete()" (confirm)="deleteAnime()"></app-confirm-modal>
  `,
})
export class AnimeListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  animes: Anime[] = [];
  studios: Studio[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  deleteModalOpen = false;
  selectedAnime: Anime | null = null;
  mode: 'catalog' | 'library' | 'favorites' = 'catalog';
  pageTitle = 'Animes';

  filtersForm = this.fb.nonNullable.group({
    search: '',
    genre: '',
    isOngoing: '',
    studioId: '',
    minRating: '',
    maxRating: '',
  });

  constructor(
    private readonly animeService: AnimeService,
    private readonly studioService: StudioService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadStudios();
    this.route.data.subscribe((data) => {
      this.mode = (data['mode'] as 'catalog' | 'library' | 'favorites') || 'catalog';
      this.pageTitle = this.mode === 'library' ? 'Mi Biblioteca' : this.mode === 'favorites' ? 'Mis Favoritos' : 'Animes';
      this.page = 1;
      this.loadAnimes();
    });
  }

  loadStudios(): void {
    this.studioService.getAll().subscribe({
      next: (studios) => (this.studios = studios),
      error: () => (this.errorMessage = 'No se pudieron cargar los estudios.'),
    });
  }

  loadAnimes(): void {
    this.loading = true;
    this.errorMessage = '';

    const value = this.filtersForm.getRawValue();
    this.animeService
      .getAll({
        page: this.page,
        limit: this.limit,
        search: value.search,
        genre: value.genre,
        isOngoing: value.isOngoing,
        inLibrary: this.mode === 'library' ? 'true' : '',
        isFavorite: this.mode === 'favorites' ? 'true' : '',
        studioId: value.studioId,
        minRating: value.minRating,
        maxRating: value.maxRating,
      })
      .subscribe({
        next: (response) => {
          this.animes = response.data;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los animes.';
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadAnimes();
  }

  changePage(page: number): void {
    this.page = page;
    this.loadAnimes();
  }

  getStudioName(anime: Anime): string {
    if (!anime.studio) return 'N/D';
    return typeof anime.studio === 'string' ? 'Asignado' : anime.studio.name;
  }

  openDelete(anime: Anime): void {
    this.selectedAnime = anime;
    this.deleteModalOpen = true;
  }

  closeDelete(): void {
    this.deleteModalOpen = false;
    this.selectedAnime = null;
  }

  deleteAnime(): void {
    if (!this.selectedAnime?._id) return;

    this.animeService.remove(this.selectedAnime._id).subscribe({
      next: () => {
        this.successMessage = 'Anime eliminado correctamente.';
        this.closeDelete();
        this.loadAnimes();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el anime.';
        this.closeDelete();
      },
    });
  }

  toggleLibrary(anime: Anime): void {
    if (!anime._id) return;
    this.animeService.update(anime._id, { inLibrary: !anime.inLibrary }).subscribe({
      next: () => {
        this.successMessage = anime.inLibrary ? 'Eliminado de la biblioteca.' : 'Añadido a la biblioteca.';
        this.loadAnimes();
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar la biblioteca.';
      },
    });
  }

  toggleFavorite(anime: Anime): void {
    if (!anime._id) return;
    this.animeService.update(anime._id, { isFavorite: !anime.isFavorite }).subscribe({
      next: () => {
        this.successMessage = anime.isFavorite ? 'Eliminado de favoritos.' : 'Añadido a favoritos.';
        this.loadAnimes();
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar favoritos.';
      },
    });
  }

  getPreferredImage(anime: Anime, variant: 'poster' | 'banner' = 'poster'): string {
    return getPreferredAnimeImage(anime, variant);
  }

  onImageError(event: Event, title: string, variant: 'poster' | 'banner' = 'poster'): void {
    const target = event.target as HTMLImageElement | null;
    if (!target) return;

    const fallback = getAnimeImageByTitle(title, variant);
    if (target.src !== fallback) {
      target.src = fallback;
    }
  }
}
