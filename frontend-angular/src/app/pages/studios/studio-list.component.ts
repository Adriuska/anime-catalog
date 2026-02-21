import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Studio } from '../../models/studio.model';
import { StudioService } from '../../services/studio.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';

@Component({
  selector: 'app-studio-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, AlertComponent, ConfirmModalComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">Estudios</h2>
      <a class="btn btn-primary" routerLink="/studios/new">Nuevo estudio</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>
    <app-alert [message]="successMessage" type="success"></app-alert>

    <app-loader [visible]="loading"></app-loader>

    <div class="table-responsive" *ngIf="!loading">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>País</th>
            <th>Activo</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let studio of studios">
            <td>{{ studio.name }}</td>
            <td>{{ studio.country || 'N/D' }}</td>
            <td>{{ studio.isActive ? 'Sí' : 'No' }}</td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary me-2" [routerLink]="['/studios', studio._id]">Detalle</a>
              <a class="btn btn-sm btn-outline-secondary me-2" [routerLink]="['/studios', studio._id, 'edit']">Editar</a>
              <button class="btn btn-sm btn-outline-danger" (click)="openDelete(studio)">Eliminar</button>
            </td>
          </tr>
          <tr *ngIf="studios.length === 0">
            <td colspan="4" class="text-center">No se encontraron estudios.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <app-confirm-modal
      [open]="deleteModalOpen"
      [message]="'¿Eliminar estudio ' + (selectedStudio?.name || '') + '?'"
      (cancel)="closeDelete()"
      (confirm)="deleteStudio()"
    ></app-confirm-modal>
  `,
})
export class StudioListComponent implements OnInit {
  studios: Studio[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  deleteModalOpen = false;
  selectedStudio: Studio | null = null;

  constructor(private readonly studioService: StudioService) {}

  ngOnInit(): void {
    this.loadStudios();
  }

  loadStudios(): void {
    this.loading = true;
    this.studioService.getAll().subscribe({
      next: (studios) => {
        this.studios = studios;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los estudios.';
        this.loading = false;
      },
    });
  }

  openDelete(studio: Studio): void {
    this.selectedStudio = studio;
    this.deleteModalOpen = true;
  }

  closeDelete(): void {
    this.deleteModalOpen = false;
    this.selectedStudio = null;
  }

  deleteStudio(): void {
    if (!this.selectedStudio?._id) {
      return;
    }

    this.studioService.remove(this.selectedStudio._id).subscribe({
      next: () => {
        this.successMessage = 'Estudio eliminado correctamente.';
        this.closeDelete();
        this.loadStudios();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el estudio.';
        this.closeDelete();
      },
    });
  }
}
