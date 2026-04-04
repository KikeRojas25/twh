import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SeguridadService } from '../../seguridad.service';

@Component({
  selector: 'app-new-user',
  templateUrl: './new-user.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DynamicDialogModule,
  ]
})
export class NewUserComponent implements OnInit {

  form!: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private seguridadService: SeguridadService,
    private ref: DynamicDialogRef,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      username:      ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]],
      password:      ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
      nombreCompleto:['', Validators.required],
      email:         ['', [Validators.required, Validators.email]],
      dni:           ['', Validators.required],
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const payload = {
      Username: this.form.value.username.trim().toLowerCase(),
      Password: this.form.value.password,
      NombreCompleto: this.form.value.nombreCompleto.trim(),
      Email: this.form.value.email.trim(),
      Dni: this.form.value.dni.trim(),
      EstadoId: 1
    };

    this.seguridadService.register(payload).subscribe({
      next: () => {
        this.ref.close({ ok: true });
      },
      error: (err) => {
        const msg = err?.error || err?.message || 'Error al crear el usuario.';
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
