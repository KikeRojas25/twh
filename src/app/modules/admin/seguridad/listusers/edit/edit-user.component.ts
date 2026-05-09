import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogModule, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PropietarioService } from '../../../_services/propietario.service';
import { SeguridadService } from '../../seguridad.service';

interface PropietarioOption {
  id: number;
  nombre: string;
}

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
    MultiSelectModule,
  ]
})
export class EditUserComponent implements OnInit {

  private propietarioService = inject(PropietarioService);

  form!: FormGroup;
  guardando = false;
  cargando = false;
  userId!: number;

  propietarios: PropietarioOption[] = [];

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
      clientesids:    [[] as number[]],
    });

    this.userId = this.config.data?.id;
    // Cargar propietarios primero, luego el usuario, para que el patchValue
    // de clientesids tenga las opciones disponibles al renderizar el multiSelect.
    this.cargarPropietarios(() => {
      if (this.userId) {
        this.cargarUsuario();
      }
    });
  }

  private cargarPropietarios(done: () => void): void {
    this.propietarioService.getAllPropietarios().subscribe({
      next: (lista) => {
        this.propietarios = (lista ?? []).map((p: any) => ({
          id: Number(p.id ?? p.Id),
          nombre: (p.razonSocial ?? p.nombre ?? p.RazonSocial ?? p.Nombre ?? `#${p.id}`).toString().toUpperCase(),
        })).filter(p => p.id > 0);
      },
      error: () => { this.propietarios = []; },
      complete: () => { done(); }
    });
  }

  cargarUsuario() {
    this.cargando = true;
    this.seguridadService.getById(this.userId).subscribe({
      next: (usuario) => {
        const ids = this.parsearClienteids(usuario.clientesids ?? usuario.Clienteids);
        this.form.patchValue({
          nombreCompleto: usuario.nombreCompleto || usuario.NombreCompleto || '',
          email:          usuario.email || usuario.Email || '',
          dni:            usuario.dni || usuario.Dni || '',
          clientesids:    ids,
        });
      },
      error: () => {
        this.ref.close({ ok: false, error: 'No se pudo cargar el usuario.' });
      },
      complete: () => { this.cargando = false; }
    });
  }

  private parsearClienteids(raw: string | string[] | null | undefined): number[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map(s => parseInt(String(s), 10))
        .filter(n => Number.isFinite(n) && n > 0);
    }
    return raw
      .split(/[,;]/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n) && n > 0);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const seleccion = (this.form.value.clientesids ?? []) as number[];

    const payload = {
      Id: this.userId,
      NombreCompleto: this.form.value.nombreCompleto.trim(),
      Email:          this.form.value.email.trim(),
      Dni:            this.form.value.dni.trim(),
      clientesids:    seleccion.map(id => String(id)),
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
