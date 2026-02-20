import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Studio } from '../../models/studio.model';
import { StudioService } from '../../services/studio.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';

@Component({
  selector: 'app-studio-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, AlertComponent, ConfirmModalComponent],
  template: `
    <div class="d-flex justify-content-between mb-3">
      <h2 class="mb-0">Studio Detail</h2>
      <a class="btn btn-outline-secondary" routerLink="/studios">Back</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>
    <app-loader [visible]="loading"></app-loader>

    <div class="card" *ngIf="studio && !loading">
      <div class="card-body">
        <h4>{{ studio.name }}</h4>
        <p><strong>Country:</strong> {{ studio.country || 'N/A' }}</p>
        <p><strong>Founded:</strong> {{ studio.foundedDate ? (studio.foundedDate | date) : 'N/A' }}</p>
        <p><strong>Active:</strong> {{ studio.isActive ? 'Yes' : 'No' }}</p>
        <div class="d-flex gap-2">
          <a class="btn btn-primary" [routerLink]="['/studios', studio._id, 'edit']">Edit</a>
          <button class="btn btn-danger" (click)="deleteModalOpen = true">Delete</button>
        </div>
      </div>
    </div>

    <app-confirm-modal
      [open]="deleteModalOpen"
      [message]="'Delete studio ' + (studio?.name || '') + '?'"
      (cancel)="deleteModalOpen = false"
      (confirm)="deleteStudio()"
    ></app-confirm-modal>
  `,
})
export class StudioDetailComponent implements OnInit {
  studio: Studio | null = null;
  loading = false;
  errorMessage = '';
  deleteModalOpen = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly studioService: StudioService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Studio id is required.';
      return;
    }

    this.loading = true;
    this.studioService.getById(id).subscribe({
      next: (studio) => {
        this.studio = studio;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load studio.';
        this.loading = false;
      },
    });
  }

  deleteStudio(): void {
    if (!this.studio?._id) {
      return;
    }

    this.studioService.remove(this.studio._id).subscribe({
      next: () => this.router.navigate(['/studios']),
      error: () => {
        this.errorMessage = 'Failed to delete studio.';
        this.deleteModalOpen = false;
      },
    });
  }
}
