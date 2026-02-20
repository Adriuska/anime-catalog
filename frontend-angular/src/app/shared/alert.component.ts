import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="alert" [ngClass]="'alert-' + type" role="alert">
      {{ message }}
    </div>
  `,
})
export class AlertComponent {
  @Input() message = '';
  @Input() type: 'success' | 'danger' | 'warning' | 'info' = 'info';
}
