import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Almacen } from 'app/modules/admin/_models/almacen';
import { AlmacenService } from 'app/modules/admin/_services/almacen.service';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    InputSwitchModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    MatIcon,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './almacenes.component.html',
  styleUrls: ['./almacenes.component.css'],
})
export class AlmacenesComponent implements OnInit {
  private almacenService  = inject(AlmacenService);
  private messageService  = inject(MessageService);
  private confirmService  = inject(ConfirmationService);

  almacenes: Almacen[] = [];
  filtro: string = '';
  incluirInactivos: boolean = true;
  cargando = false;

  // Dialog state
  mostrarDialog = false;
  modoEdicion   = false;
  almacenForm: { id: number | null; descripcion: string; activo: boolean } = {
    id: null,
    descripcion: '',
    activo: true,
  };
  guardando = false;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.almacenService.getAllAlmacenes(this.incluirInactivos).subscribe({
      next: (data) => {
        this.almacenes = data ?? [];
      },
      error: (err) => {
        console.error('Error cargando almacenes', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los almacenes.',
        });
      },
      complete: () => (this.cargando = false),
    });
  }

  get almacenesFiltrados(): Almacen[] {
    const q = this.filtro?.trim().toLowerCase() ?? '';
    if (!q) return this.almacenes;
    return this.almacenes.filter((a) =>
      (a.descripcion ?? '').toLowerCase().includes(q)
    );
  }

  abrirNuevo(): void {
    this.modoEdicion = false;
    this.almacenForm = { id: null, descripcion: '', activo: true };
    this.mostrarDialog = true;
  }

  abrirEditar(a: Almacen): void {
    this.modoEdicion = true;
    this.almacenForm = {
      id: a.id,
      descripcion: a.descripcion,
      activo: a.activo ?? true,
    };
    this.mostrarDialog = true;
  }

  cerrarDialog(): void {
    this.mostrarDialog = false;
  }

  guardar(): void {
    const desc = this.almacenForm.descripcion?.trim();
    if (!desc) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'La descripción es requerida.',
      });
      return;
    }

    this.guardando = true;
    const dto = { descripcion: desc, activo: this.almacenForm.activo };

    const obs =
      this.modoEdicion && this.almacenForm.id
        ? this.almacenService.actualizarAlmacen(this.almacenForm.id, dto)
        : this.almacenService.crearAlmacen(dto);

    obs.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.modoEdicion ? 'Actualizado' : 'Creado',
          detail: `Almacén "${desc}" guardado correctamente.`,
        });
        this.mostrarDialog = false;
        this.cargar();
      },
      error: (err) => {
        console.error('Error guardando almacén', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo guardar el almacén.',
        });
      },
      complete: () => (this.guardando = false),
    });
  }

  toggleActivo(a: Almacen, event: Event): void {
    event.stopPropagation();
    const nuevoEstado = !(a.activo ?? true);
    const accion = nuevoEstado ? 'reactivar' : 'inactivar';

    this.confirmService.confirm({
      message: `¿Confirma ${accion} el almacén "${a.descripcion}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: nuevoEstado ? 'p-button-success' : 'p-button-danger',
      accept: () => {
        this.almacenService.toggleActivo(a.id).subscribe({
          next: (resp) => {
            a.activo = resp.activo;
            this.messageService.add({
              severity: 'success',
              summary: 'TWH',
              detail: `Almacén ${resp.activo ? 'activado' : 'inactivado'}.`,
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

  getEstadoClass(activo: boolean | undefined): string {
    return (activo ?? true)
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
  }
}
