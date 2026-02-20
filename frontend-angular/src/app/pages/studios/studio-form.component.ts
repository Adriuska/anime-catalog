import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudioService } from '../../services/studio.service';
import { LoaderComponent } from '../../shared/loader.component';
import { AlertComponent } from '../../shared/alert.component';

@Component({
  selector: 'app-studio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent, AlertComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ isEdit ? 'Edit Studio' : 'New Studio' }}</h2>
      <a class="btn btn-outline-secondary" routerLink="/studios">Back</a>
    </div>

    <app-alert [message]="errorMessage" type="danger"></app-alert>

    <form class="card card-body" [formGroup]="form" (ngSubmit)="submit()">
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Name</label><input class="form-control" formControlName="name" /></div>
        <div class="col-md-6"><label class="form-label">Country</label><input class="form-control" formControlName="country" /></div>
        <div class="col-md-4"><label class="form-label">Founded Date</label><input type="date" class="form-control" formControlName="foundedDate" /></div>
        <div class="col-md-4 d-flex align-items-end"><div class="form-check"><input id="isActive" type="checkbox" class="form-check-input" formControlName="isActive" /><label class="form-check-label" for="isActive">Active</label></div></div>
      </div>
      <div class="mt-3"><button class="btn btn-primary" [disabled]="form.invalid || loading" type="submit">{{ isEdit ? 'Update' : 'Create' }}</button></div>
    </form>

    <app-loader [visible]="loading"></app-loader>
  `,
})
export class StudioFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  isEdit = false;
  studioId = '';
  loading = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    country: '',
    foundedDate: '',
    isActive: true,
  });

  constructor(
    private readonly studioService: StudioService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.studioId = id;
      this.loadStudio();
    }
  }

  loadStudio(): void {
    this.loading = true;
    this.studioService.getById(this.studioId).subscribe({
      next: (studio) => {
        this.form.patchValue({
          name: studio.name,
          country: studio.country || '',
          foundedDate: studio.foundedDate?.slice(0, 10) || '',
          isActive: studio.isActive,
        });
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load studio.';
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
      name: value.name,
      country: value.country || undefined,
      foundedDate: value.foundedDate || undefined,
      isActive: value.isActive,
    };

    const request$ = this.isEdit
      ? this.studioService.update(this.studioId, payload)
      : this.studioService.create(payload as any);

    request$.subscribe({
      next: () => this.router.navigate(['/studios']),
      error: () => {
        this.errorMessage = 'Failed to save studio.';
        this.loading = false;
      },
    });
  }
}
