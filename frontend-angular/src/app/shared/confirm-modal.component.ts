import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmar eliminación</h5>
            <button type="button" class="btn-close" (click)="cancel.emit()"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancelar</button>
            <button class="btn btn-danger" type="button" (click)="confirm.emit()">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="open" class="modal-backdrop fade show"></div>
  `,
})
export class ConfirmModalComponent {
  @Input() open = false;
  @Input() message = '¿Estás seguro?';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
