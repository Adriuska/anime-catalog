import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Anime } from '../../models/anime.model';
import { AnimeService } from '../../services/anime.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { getAnimeImageByTitle, getPreferredAnimeImage } from '../../core/anime-images';

@Component({
  selector: 'app-anime-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, AlertComponent, ConfirmModalComponent],
  template: `
    <div class="d-flex justify-content-between mb-3">
      <h2 class="mb-0">Anime Detail</h2>
      <a class="btn btn-outline-secondary" routerLink="/animes">Back</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>
    <app-loader [visible]="loading"></app-loader>

    <div class="card border-0 shadow-sm overflow-hidden" *ngIf="anime && !loading">
      <div
        class="p-4 d-flex flex-column justify-content-end"
        style="min-height: 250px; color: #fff; background-size: cover; background-position: center;"
        [style.background-image]="'linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.2)), url(' + getPreferredImage(anime, 'banner') + ')'"
      >
        <div class="d-flex gap-2 mb-2">
          <span class="badge text-bg-warning">★ {{ anime.rating | number: '1.1-1' }}</span>
          <span class="badge text-bg-dark">{{ anime.isOngoing ? 'Ongoing' : 'Finished' }}</span>
        </div>
        <h3 class="mb-1">{{ anime.title }}</h3>
        <p class="mb-0 text-light">{{ anime.description }}</p>
      </div>

      <div class="row g-0">
        <div class="col-md-3 p-3 pb-0">
          <img
            [src]="getPreferredImage(anime, 'poster')"
            class="img-fluid rounded"
            [alt]="anime.title"
            style="width: 100%; max-height: 420px; object-fit: cover;"
            (error)="onImageError($event, anime.title, 'poster')"
          />
        </div>
        <div class="col-md-9">
          <div class="card-body">
            <p><strong>Episodes:</strong> {{ anime.episodes }}</p>
            <p><strong>Rating:</strong> {{ anime.rating }}</p>
            <p><strong>Genres:</strong> {{ anime.genres.join(', ') }}</p>
            <p><strong>Status:</strong> {{ anime.isOngoing ? 'Ongoing' : 'Finished' }}</p>
            <div class="d-flex gap-2">
              <a class="btn btn-primary" [routerLink]="['/animes', anime._id, 'edit']">Edit</a>
              <button class="btn btn-danger" (click)="deleteModalOpen = true">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-confirm-modal
      [open]="deleteModalOpen"
      [message]="'Delete anime ' + (anime?.title || '') + '?'"
      (cancel)="deleteModalOpen = false"
      (confirm)="deleteAnime()"
    ></app-confirm-modal>
  `,
})
export class AnimeDetailComponent implements OnInit {
  anime: Anime | null = null;
  loading = false;
  errorMessage = '';
  deleteModalOpen = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly animeService: AnimeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Anime id is required.';
      return;
    }

    this.loading = true;
    this.animeService.getById(id).subscribe({
      next: (anime) => {
        this.anime = anime;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load anime.';
        this.loading = false;
      },
    });
  }

  deleteAnime(): void {
    if (!this.anime?._id) {
      return;
    }

    this.animeService.remove(this.anime._id).subscribe({
      next: () => this.router.navigate(['/animes']),
      error: () => {
        this.errorMessage = 'Failed to delete anime.';
        this.deleteModalOpen = false;
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
