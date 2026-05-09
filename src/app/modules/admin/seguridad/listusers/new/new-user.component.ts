import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PropietarioService } from '../../../_services/propietario.service';
import { SeguridadService } from '../../seguridad.service';

interface PropietarioOption {
  id: number;
  nombre: string;
}

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
    MultiSelectModule,
  ]
})
export class NewUserComponent implements OnInit {

  private propietarioService = inject(PropietarioService);

  form!: FormGroup;
  guardando = false;

  propietarios: PropietarioOption[] = [];
  cargandoPropietarios = false;

  constructor(
    private fb: FormBuilder,
    private seguridadService: SeguridadService,
    private ref: DynamicDialogRef,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      username:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]],
      password:       ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
      nombreCompleto: ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      dni:            ['', Validators.required],
      clientesids:    [[] as number[]],
    });

    this.cargarPropietarios();
  }

  private cargarPropietarios(): void {
    this.cargandoPropietarios = true;
    this.propietarioService.getAllPropietarios().subscribe({
      next: (lista) => {
        this.propietarios = (lista ?? []).map((p: any) => ({
          id: Number(p.id ?? p.Id),
          nombre: (p.razonSocial ?? p.nombre ?? p.RazonSocial ?? p.Nombre ?? `#${p.id}`).toString().toUpperCase(),
        })).filter(p => p.id > 0);
      },
      error: () => { this.propietarios = []; },
      complete: () => { this.cargandoPropietarios = false; }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const seleccion = (this.form.value.clientesids ?? []) as number[];

    const payload = {
      Username:       this.form.value.username.trim().toLowerCase(),
      Password:       this.form.value.password,
      NombreCompleto: this.form.value.nombreCompleto.trim(),
      Email:          this.form.value.email.trim(),
      Dni:            this.form.value.dni.trim(),
      EstadoId:       1,
      // Backend espera string[] (DTO.clientesids)
      clientesids:    seleccion.map(id => String(id)),
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
