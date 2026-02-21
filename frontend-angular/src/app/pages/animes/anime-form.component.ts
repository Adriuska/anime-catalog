import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Studio } from '../../models/studio.model';
import { AnimeService } from '../../services/anime.service';
import { StudioService } from '../../services/studio.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';
import { getAnimeImageByTitle } from '../../core/anime-images';

@Component({
  selector: 'app-anime-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent, AlertComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ isEdit ? 'Editar anime' : 'Nuevo anime' }}</h2>
      <a class="btn btn-outline-secondary" routerLink="/animes">Volver</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>

    <form class="card card-body" [formGroup]="form" (ngSubmit)="submit()">
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Título</label><input class="form-control" formControlName="title" /></div>
        <div class="col-md-6"><label class="form-label">URL del póster</label><input class="form-control" formControlName="posterUrl" /></div>
        <div class="col-md-6"><label class="form-label">URL del banner (opcional)</label><input class="form-control" formControlName="bannerUrl" /></div>
        <div class="col-md-6"></div>
        <div class="col-md-6">
          <div class="card h-100 border-0 shadow-sm">
            <img
              [src]="form.controls.posterUrl.value || suggestedPosterUrl"
              alt="Vista previa del póster"
              class="card-img-top"
              style="height: 320px; object-fit: cover;"
              (error)="onPreviewError($event, suggestedPosterUrl)"
            />
            <div class="card-body py-2 px-3">
              <div class="small text-secondary mb-2">Póster sugerido según el título</div>
              <button type="button" class="btn btn-sm btn-outline-primary" (click)="applySuggestedUrl('poster')">Usar póster sugerido</button>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100 border-0 shadow-sm">
            <img
              [src]="form.controls.bannerUrl.value || suggestedBannerUrl"
              alt="Vista previa del banner"
              class="card-img-top"
              style="height: 170px; object-fit: cover;"
              (error)="onPreviewError($event, suggestedBannerUrl)"
            />
            <div class="card-body py-2 px-3">
              <div class="small text-secondary mb-2">Banner sugerido según el título</div>
              <button type="button" class="btn btn-sm btn-outline-primary" (click)="applySuggestedUrl('banner')">Usar banner sugerido</button>
            </div>
          </div>
        </div>
        <div class="col-12"><label class="form-label">Descripción</label><textarea class="form-control" rows="3" formControlName="description"></textarea></div>
        <div class="col-md-2"><label class="form-label">Episodios</label><input type="number" class="form-control" formControlName="episodes" /></div>
        <div class="col-md-2"><label class="form-label">Puntuación</label><input type="number" step="0.1" class="form-control" formControlName="rating" /></div>
        <div class="col-md-3"><label class="form-label">Fecha de estreno</label><input type="date" class="form-control" formControlName="releaseDate" /></div>
        <div class="col-md-3">
          <label class="form-label">Estudio</label>
          <select class="form-select" formControlName="studio">
            <option value="">Sin estudio</option>
            <option *ngFor="let studio of studios" [value]="studio._id">{{ studio.name }}</option>
          </select>
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <div class="form-check"><input id="ongoing" type="checkbox" class="form-check-input" formControlName="isOngoing" /><label class="form-check-label" for="ongoing">En emisión</label></div>
        </div>
        <div class="col-12"><label class="form-label">Géneros (separados por coma)</label><input class="form-control" formControlName="genres" /></div>
      </div>

      <div class="mt-3"><button class="btn btn-primary" [disabled]="form.invalid || loading" type="submit">{{ isEdit ? 'Actualizar' : 'Crear' }}</button></div>
    </form>

    <app-loader [visible]="loading"></app-loader>
  `,
})
export class AnimeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  isEdit = false;
  animeId = '';
  loading = false;
  errorMessage = '';
  studios: Studio[] = [];
  manualImageUrls = { poster: false, banner: false };
  suggestedPosterUrl = getAnimeImageByTitle('', 'poster');
  suggestedBannerUrl = getAnimeImageByTitle('', 'banner');

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    posterUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    bannerUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    episodes: [1, [Validators.required, Validators.min(1)]],
    releaseDate: ['', [Validators.required]],
    isOngoing: false,
    rating: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
    genres: ['', [Validators.required]],
    studio: '',
  });

  constructor(
    private readonly animeService: AnimeService,
    private readonly studioService: StudioService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.setupImageSuggestionSync();
    this.loadStudios();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.animeId = id;
      this.loadAnime();
    }
  }

  loadStudios(): void {
    this.studioService.getAll().subscribe({
      next: (studios) => (this.studios = studios),
      error: () => (this.errorMessage = 'No se pudieron cargar los estudios.'),
    });
  }

  loadAnime(): void {
    this.loading = true;
    this.animeService.getById(this.animeId).subscribe({
      next: (anime) => {
        this.form.patchValue({
          title: anime.title,
          description: anime.description,
          posterUrl: anime.posterUrl,
          bannerUrl: anime.bannerUrl || '',
          episodes: anime.episodes,
          releaseDate: anime.releaseDate?.slice(0, 10) || '',
          isOngoing: anime.isOngoing,
          rating: anime.rating,
          genres: anime.genres.join(', '),
          studio: typeof anime.studio === 'string' ? anime.studio : anime.studio?._id || '',
        });
        this.manualImageUrls = { poster: true, banner: true };
        this.suggestedPosterUrl = getAnimeImageByTitle(anime.title, 'poster');
        this.suggestedBannerUrl = getAnimeImageByTitle(anime.title, 'banner');
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el anime.';
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const value = this.form.getRawValue();
    const payload = {
      title: value.title,
      description: value.description,
      posterUrl: value.posterUrl,
      bannerUrl: value.bannerUrl || undefined,
      episodes: value.episodes,
      releaseDate: value.releaseDate,
      isOngoing: value.isOngoing,
      rating: value.rating,
      genres: value.genres.split(',').map((genre) => genre.trim()).filter(Boolean),
      studio: value.studio || undefined,
    };

    const request$ = this.isEdit
      ? this.animeService.update(this.animeId, payload)
      : this.animeService.create(payload as any);

    request$.subscribe({
      next: () => this.router.navigate(['/animes']),
      error: () => {
        this.errorMessage = 'No se pudo guardar el anime.';
        this.loading = false;
      },
    });
  }

  setupImageSuggestionSync(): void {
    const titleControl = this.form.controls.title;
    const posterControl = this.form.controls.posterUrl;
    const bannerControl = this.form.controls.bannerUrl;

    titleControl.valueChanges.subscribe((title) => {
      const safeTitle = title || '';
      const posterSuggestion = getAnimeImageByTitle(safeTitle, 'poster');
      const bannerSuggestion = getAnimeImageByTitle(safeTitle, 'banner');

      this.suggestedPosterUrl = posterSuggestion;
      this.suggestedBannerUrl = bannerSuggestion;

      if (!this.manualImageUrls.poster || !posterControl.value) {
        posterControl.setValue(posterSuggestion, { emitEvent: false });
      }

      if (!this.manualImageUrls.banner || !bannerControl.value) {
        bannerControl.setValue(bannerSuggestion, { emitEvent: false });
      }
    });

    posterControl.valueChanges.subscribe((value) => {
      this.manualImageUrls.poster = Boolean(value && value !== this.suggestedPosterUrl);
    });

    bannerControl.valueChanges.subscribe((value) => {
      this.manualImageUrls.banner = Boolean(value && value !== this.suggestedBannerUrl);
    });
  }

  applySuggestedUrl(field: 'poster' | 'banner'): void {
    if (field === 'poster') {
      this.form.controls.posterUrl.setValue(this.suggestedPosterUrl);
      this.manualImageUrls.poster = false;
      return;
    }

    this.form.controls.bannerUrl.setValue(this.suggestedBannerUrl);
    this.manualImageUrls.banner = false;
  }

  onPreviewError(event: Event, fallbackUrl: string): void {
    const target = event.target as HTMLImageElement | null;
    if (!target) return;

    if (target.src !== fallbackUrl) {
      target.src = fallbackUrl;
    }
  }
}
