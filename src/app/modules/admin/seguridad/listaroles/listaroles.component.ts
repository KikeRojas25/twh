import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Rol } from 'app/modules/admin/_models/rol';
import { RolService } from 'app/modules/admin/_services/rol.service';
import { VincularPantallasComponent } from './vincular-pantallas/vincular-pantallas.component';

@Component({
  selector: 'app-listaroles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    DynamicDialogModule,
    InputSwitchModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    MatIcon,
  ],
  providers: [MessageService, ConfirmationService, DialogService],
  templateUrl: './listaroles.component.html',
  styleUrls: ['./listaroles.component.css'],
})
export class ListaRolesComponent implements OnInit {
  private rolService     = inject(RolService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmationService);
  private dialogService  = inject(DialogService);
  private dialogRef: DynamicDialogRef | undefined;

  roles: Rol[] = [];
  filtro = '';
  incluirInactivos = true;
  cargando = false;

  // Dialog state
  mostrarDialog = false;
  modoEdicion   = false;
  rolForm: { id: number | null; descripcion: string; alias: string; activo: boolean; publico: boolean } = {
    id: null,
    descripcion: '',
    alias: '',
    activo: true,
    publico: false,
  };
  guardando = false;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.rolService.getAllRoles(this.incluirInactivos).subscribe({
      next: (data) => {
        this.roles = data ?? [];
      },
      error: (err) => {
        console.error('Error cargando roles', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los roles.',
        });
      },
      complete: () => (this.cargando = false),
    });
  }

  get rolesFiltrados(): Rol[] {
    const q = this.filtro?.trim().toLowerCase() ?? '';
    if (!q) return this.roles;
    return this.roles.filter((r) =>
      (r.descripcion ?? '').toLowerCase().includes(q) ||
      (r.alias ?? '').toLowerCase().includes(q)
    );
  }

  abrirNuevo(): void {
    this.modoEdicion = false;
    this.rolForm = { id: null, descripcion: '', alias: '', activo: true, publico: false };
    this.mostrarDialog = true;
  }

  abrirEditar(r: Rol): void {
    this.modoEdicion = true;
    this.rolForm = {
      id: r.id,
      descripcion: r.descripcion,
      alias: r.alias,
      activo: r.activo ?? true,
      publico: r.publico ?? false,
    };
    this.mostrarDialog = true;
  }

  cerrarDialog(): void {
    this.mostrarDialog = false;
  }

  guardar(): void {
    const desc = this.rolForm.descripcion?.trim();
    const alias = this.rolForm.alias?.trim();

    if (!desc) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La descripción es requerida.' });
      return;
    }
    if (!alias) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El alias es requerido.' });
      return;
    }
    if (alias.length < 5 || alias.length > 8) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El alias debe tener entre 5 y 8 caracteres.' });
      return;
    }

    this.guardando = true;
    const dto = {
      descripcion: desc,
      alias: alias,
      activo: this.rolForm.activo,
      publico: this.rolForm.publico,
    };

    const obs =
      this.modoEdicion && this.rolForm.id
        ? this.rolService.actualizarRol(this.rolForm.id, dto)
        : this.rolService.crearRol(dto);

    obs.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.modoEdicion ? 'Actualizado' : 'Creado',
          detail: `Rol "${desc}" guardado correctamente.`,
        });
        this.mostrarDialog = false;
        this.cargar();
      },
      error: (err) => {
        console.error('Error guardando rol', err);
        const msg = err?.error?.message ?? 'No se pudo guardar el rol.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
      complete: () => (this.guardando = false),
    });
  }

  toggleActivo(r: Rol, event: Event): void {
    event.stopPropagation();
    const nuevoEstado = !(r.activo ?? true);
    const accion = nuevoEstado ? 'reactivar' : 'inactivar';

    this.confirmService.confirm({
      message: `¿Confirma ${accion} el rol "${r.descripcion}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: nuevoEstado ? 'p-button-success' : 'p-button-danger',
      accept: () => {
        this.rolService.toggleActivo(r.id).subscribe({
          next: (resp) => {
            r.activo = resp.activo;
            this.messageService.add({
              severity: 'success',
              summary: 'TWH',
              detail: `Rol ${resp.activo ? 'activado' : 'inactivado'}.`,
            });
          },
          error: (err) => {
            console.error('Error toggle activo', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cambiar el estado.',
            });
          },
        });
      },
    });
  }

  vincularPantallas(r: Rol): void {
    this.dialogRef = this.dialogService.open(VincularPantallasComponent, {
      header: `Vincular pantallas — ${r.descripcion}`,
      width: '900px',
      contentStyle: { padding: '0' },
      data: { rolId: r.id, rolDescripcion: r.descripcion },
    });
    this.dialogRef.onClose.subscribe((result) => {
      if (result?.ok) {
        this.messageService.add({
          severity: 'success',
          summary: 'TWH',
          detail: 'Vínculos del rol actualizados.',
        });
      }
    });
  }

  getEstadoClass(activo: boolean): string {
    return activo
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
  }

  getPublicoClass(publico: boolean): string {
    return publico
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700';
  }
}
