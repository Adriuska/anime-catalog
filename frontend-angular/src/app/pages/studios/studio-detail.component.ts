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
      <h2 class="mb-0">Detalle del estudio</h2>
      <a class="btn btn-outline-secondary" routerLink="/studios">Volver</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>
    <app-loader [visible]="loading"></app-loader>

    <div class="card" *ngIf="studio && !loading">
      <div class="card-body">
        <h4>{{ studio.name }}</h4>
        <p><strong>País:</strong> {{ studio.country || 'N/D' }}</p>
        <p><strong>Fundado:</strong> {{ studio.foundedDate ? (studio.foundedDate | date) : 'N/D' }}</p>
        <p><strong>Activo:</strong> {{ studio.isActive ? 'Sí' : 'No' }}</p>
        <div class="d-flex gap-2">
          <a class="btn btn-primary" [routerLink]="['/studios', studio._id, 'edit']">Editar</a>
          <button class="btn btn-danger" (click)="deleteModalOpen = true">Eliminar</button>
        </div>
      </div>
    </div>

    <app-confirm-modal
      [open]="deleteModalOpen"
      [message]="'¿Eliminar estudio ' + (studio?.name || '') + '?'"
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
      this.errorMessage = 'El id del estudio es obligatorio.';
      return;
    }

    this.loading = true;
    this.studioService.getById(id).subscribe({
      next: (studio) => {
        this.studio = studio;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el estudio.';
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
        this.errorMessage = 'No se pudo eliminar el estudio.';
        this.deleteModalOpen = false;
      },
    });
  }
}
