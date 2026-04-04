import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogModule, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SeguridadService } from '../../seguridad.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DynamicDialogModule,
  ]
})
export class ChangePasswordComponent implements OnInit {

  form!: FormGroup;
  guardando = false;
  userId!: number;
  nombreUsuario = '';

  constructor(
    private fb: FormBuilder,
    private seguridadService: SeguridadService,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
  ) {}

  ngOnInit() {
    this.userId = this.config.data?.id;
    this.nombreUsuario = this.config.data?.nombreCompleto || '';

    this.form = this.fb.group({
      password:        ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordsMatch });
  }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.seguridadService.changePassword(this.userId, this.form.value.password).subscribe({
      next: (res) => {
        this.ref.close({ ok: true, message: res?.message });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'Error al cambiar la contraseña.';
        this.ref.close({ ok: false, error: msg });
      }
    });
  }

  cancelar() {
    this.ref.close(null);
  }

  hasError(campo: string, error: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }

  get mismatch(): boolean {
    return !!(this.form.hasError('mismatch') && this.form.get('confirmPassword')?.touched);
  }
}
