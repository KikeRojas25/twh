import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogModule, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SeguridadService } from '../../seguridad.service';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DynamicDialogModule,
  ]
})
export class EditUserComponent implements OnInit {

  form!: FormGroup;
  guardando = false;
  cargando = false;
  userId!: number;

  constructor(
    private fb: FormBuilder,
    private seguridadService: SeguridadService,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombreCompleto: ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      dni:            ['', Validators.required],
    });

    this.userId = this.config.data?.id;
    if (this.userId) {
      this.cargarUsuario();
    }
  }

  cargarUsuario() {
    this.cargando = true;
    this.seguridadService.getById(this.userId).subscribe({
      next: (usuario) => {
        this.form.patchValue({
          nombreCompleto: usuario.nombreCompleto || usuario.NombreCompleto || '',
          email:          usuario.email || usuario.Email || '',
          dni:            usuario.dni || usuario.Dni || '',
        });
      },
      error: () => {
        this.ref.close({ ok: false, error: 'No se pudo cargar el usuario.' });
      },
      complete: () => { this.cargando = false; }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const payload = {
      Id: this.userId,
      NombreCompleto: this.form.value.nombreCompleto.trim(),
      Email: this.form.value.email.trim(),
      Dni: this.form.value.dni.trim(),
    };

    this.seguridadService.update(payload).subscribe({
      next: () => {
        this.ref.close({ ok: true });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'Error al actualizar el usuario.';
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
}
