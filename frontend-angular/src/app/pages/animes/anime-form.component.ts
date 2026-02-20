import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Studio } from '../../models/studio.model';
import { AnimeService } from '../../services/anime.service';
import { StudioService } from '../../services/studio.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';

@Component({
  selector: 'app-anime-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent, AlertComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ isEdit ? 'Edit Anime' : 'New Anime' }}</h2>
      <a class="btn btn-outline-secondary" routerLink="/animes">Back</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>

    <form class="card card-body" [formGroup]="form" (ngSubmit)="submit()">
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Title</label><input class="form-control" formControlName="title" /></div>
        <div class="col-md-6"><label class="form-label">Poster URL</label><input class="form-control" formControlName="posterUrl" /></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" rows="3" formControlName="description"></textarea></div>
        <div class="col-md-2"><label class="form-label">Episodes</label><input type="number" class="form-control" formControlName="episodes" /></div>
        <div class="col-md-2"><label class="form-label">Rating</label><input type="number" step="0.1" class="form-control" formControlName="rating" /></div>
        <div class="col-md-3"><label class="form-label">Release Date</label><input type="date" class="form-control" formControlName="releaseDate" /></div>
        <div class="col-md-3">
          <label class="form-label">Studio</label>
          <select class="form-select" formControlName="studio">
            <option value="">No studio</option>
            <option *ngFor="let studio of studios" [value]="studio._id">{{ studio.name }}</option>
          </select>
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <div class="form-check"><input id="ongoing" type="checkbox" class="form-check-input" formControlName="isOngoing" /><label class="form-check-label" for="ongoing">Ongoing</label></div>
        </div>
        <div class="col-12"><label class="form-label">Genres (comma separated)</label><input class="form-control" formControlName="genres" /></div>
      </div>

      <div class="mt-3"><button class="btn btn-primary" [disabled]="form.invalid || loading" type="submit">{{ isEdit ? 'Update' : 'Create' }}</button></div>
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

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    posterUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
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
      error: () => (this.errorMessage = 'Failed to load studios.'),
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
          episodes: anime.episodes,
          releaseDate: anime.releaseDate?.slice(0, 10) || '',
          isOngoing: anime.isOngoing,
          rating: anime.rating,
          genres: anime.genres.join(', '),
          studio: typeof anime.studio === 'string' ? anime.studio : anime.studio?._id || '',
        });
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load anime.';
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
        this.errorMessage = 'Failed to save anime.';
        this.loading = false;
      },
    });
  }
}
