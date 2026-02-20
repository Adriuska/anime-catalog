import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Anime } from '../../models/anime.model';
import { AnimeService } from '../../services/anime.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';

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

    <div class="card" *ngIf="anime && !loading">
      <div class="row g-0">
        <div class="col-md-3">
          <img [src]="anime.posterUrl" class="img-fluid rounded-start" [alt]="anime.title" />
        </div>
        <div class="col-md-9">
          <div class="card-body">
            <h4>{{ anime.title }}</h4>
            <p>{{ anime.description }}</p>
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
}
