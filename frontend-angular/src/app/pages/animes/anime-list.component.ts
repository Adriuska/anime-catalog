import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Anime } from '../../models/anime.model';
import { Studio } from '../../models/studio.model';
import { AnimeService } from '../../services/anime.service';
import { StudioService } from '../../services/studio.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';

@Component({
  selector: 'app-anime-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent, AlertComponent, ConfirmModalComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">Animes</h2>
      <a class="btn btn-primary" routerLink="/animes/new">New Anime</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>
    <app-alert [message]="successMessage" type="success"></app-alert>

    <form [formGroup]="filtersForm" class="card card-body mb-3" (ngSubmit)="applyFilters()">
      <div class="row g-2">
        <div class="col-md-3"><input class="form-control" formControlName="search" placeholder="Search title" /></div>
        <div class="col-md-2"><input class="form-control" formControlName="genre" placeholder="Genre" /></div>
        <div class="col-md-2">
          <select class="form-select" formControlName="isOngoing">
            <option value="">All status</option>
            <option value="true">Ongoing</option>
            <option value="false">Finished</option>
          </select>
        </div>
        <div class="col-md-2">
          <select class="form-select" formControlName="studioId">
            <option value="">All studios</option>
            <option *ngFor="let studio of studios" [value]="studio._id">{{ studio.name }}</option>
          </select>
        </div>
        <div class="col-md-1"><input class="form-control" formControlName="minRating" placeholder="Min" /></div>
        <div class="col-md-1"><input class="form-control" formControlName="maxRating" placeholder="Max" /></div>
        <div class="col-md-1"><button class="btn btn-dark w-100" type="submit">Go</button></div>
      </div>
    </form>

    <app-loader [visible]="loading"></app-loader>

    <div class="table-responsive" *ngIf="!loading">
      <table class="table table-striped align-middle">
        <thead>
          <tr><th>Title</th><th>Episodes</th><th>Rating</th><th>Status</th><th>Studio</th><th class="text-end">Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let anime of animes">
            <td>{{ anime.title }}</td>
            <td>{{ anime.episodes }}</td>
            <td>{{ anime.rating }}</td>
            <td>{{ anime.isOngoing ? 'Ongoing' : 'Finished' }}</td>
            <td>{{ getStudioName(anime) }}</td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary me-2" [routerLink]="['/animes', anime._id]">Detail</a>
              <a class="btn btn-sm btn-outline-secondary me-2" [routerLink]="['/animes', anime._id, 'edit']">Edit</a>
              <button class="btn btn-sm btn-outline-danger" (click)="openDelete(anime)">Delete</button>
            </td>
          </tr>
          <tr *ngIf="animes.length === 0"><td colspan="6" class="text-center">No animes found.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-between align-items-center" *ngIf="!loading">
      <span>Page {{ page }} / {{ totalPages }}</span>
      <div class="btn-group">
        <button class="btn btn-outline-dark" [disabled]="page <= 1" (click)="changePage(page - 1)">Prev</button>
        <button class="btn btn-outline-dark" [disabled]="page >= totalPages" (click)="changePage(page + 1)">Next</button>
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
    private readonly studioService: StudioService
  ) {}

  ngOnInit(): void {
    this.loadStudios();
    this.loadAnimes();
  }

  loadStudios(): void {
    this.studioService.getAll().subscribe({
      next: (studios) => (this.studios = studios),
      error: () => (this.errorMessage = 'Failed to load studios.'),
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
          this.errorMessage = 'Failed to load animes.';
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
    if (!anime.studio) return 'N/A';
    return typeof anime.studio === 'string' ? 'Assigned' : anime.studio.name;
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
        this.successMessage = 'Anime deleted successfully.';
        this.closeDelete();
        this.loadAnimes();
      },
      error: () => {
        this.errorMessage = 'Failed to delete anime.';
        this.closeDelete();
      },
    });
  }
}
