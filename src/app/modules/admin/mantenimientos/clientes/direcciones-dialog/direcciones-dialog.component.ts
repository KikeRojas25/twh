import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ClienteService } from '../../../_services/cliente.service';

@Component({
  selector: 'app-direcciones-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    InputSwitchModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './direcciones-dialog.component.html',
})
export class DireccionesDialogComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  clienteId!: number;
  clienteNombre = '';
  direcciones: any[] = [];
  cargando = false;

  // Sub-dialog crear/editar
  mostrarForm = false;
  esEdicion = false;
  guardando = false;
  form: {
    id: number | null;
    codigo: string;
    direccion: string;
    departamentoId: number | null;
    provinciaId: number | null;
    idDistrito: number | null;
    principal: boolean;
    activo: boolean;
  } = this.formVacio();

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  ngOnInit(): void {
    this.clienteId = this.config.data?.clienteId;
    this.clienteNombre = this.config.data?.clienteNombre ?? '';
    this.cargar();
    this.cargarDepartamentos();
  }

  private formVacio() {
    return {
      id: null,
      codigo: '',
      direccion: '',
      departamentoId: null,
      provinciaId: null,
      idDistrito: null,
      principal: false,
      activo: true,
    };
  }

  cargar(): void {
    this.cargando = true;
    this.clienteService.getDireccionesCliente(this.clienteId).subscribe({
      next: (data) => {
        this.direcciones = data ?? [];
        this.cargando = false;
      },
      error: () => {
        this.direcciones = [];
        this.cargando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las direcciones.' });
      },
    });
  }

  cargarDepartamentos(): void {
    this.clienteService.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = (data ?? []).map((d: any) => ({
          label: d.departamento || d.Departamento,
          value: d.iddepartamento ?? d.IdDepartamento,
        }));
      },
    });
  }

  onDepartamentoChange(): void {
    this.form.provinciaId = null;
    this.form.idDistrito = null;
    this.provincias = [];
    this.distritos = [];
    if (!this.form.departamentoId) return;
    this.clienteService.getProvincias(this.form.departamentoId).subscribe({
      next: (data) => {
        this.provincias = (data ?? []).map((p: any) => ({
          label: p.provincia || p.Provincia,
          value: p.idprovincia ?? p.IdProvincia,
        }));
      },
    });
  }

  onProvinciaChange(): void {
    this.form.idDistrito = null;
    this.distritos = [];
    if (!this.form.provinciaId) return;
    this.clienteService.getDistritos(this.form.provinciaId).subscribe({
      next: (data) => {
        this.distritos = (data ?? []).map((d: any) => ({
          label: d.distrito || d.Distrito,
          value: d.iddistrito ?? d.IdDistrito,
        }));
      },
    });
  }

  abrirNueva(): void {
    this.esEdicion = false;
    this.form = this.formVacio();
    this.provincias = [];
    this.distritos = [];
    this.mostrarForm = true;
  }

  abrirEditar(d: any): void {
    this.esEdicion = true;
    this.form = {
      id: d.id,
      codigo: d.codigo ?? '',
      direccion: d.direccion ?? '',
      departamentoId: null,
      provinciaId: null,
      idDistrito: d.idDistrito ?? null,
      principal: !!d.principal,
      activo: d.activo !== false,
    };
    this.provincias = [];
    this.distritos = [];
    this.mostrarForm = true;

    // Si conocemos el distrito, intentamos resolver depto+provincia para precargar.
    // Como el listado solo trae idDistrito + idProvincia (no idDepartamento), requerimos al
    // usuario re-seleccionar el departamento. Dejamos visible la dirección actual mientras tanto.
  }

  cerrarForm(): void {
    this.mostrarForm = false;
  }

  guardar(): void {
    const codigo = this.form.codigo.trim();
    const direccion = this.form.direccion.trim();
    if (!codigo)    { this.warn('Código es requerido.'); return; }
    if (!direccion) { this.warn('Dirección es requerida.'); return; }
    if (!this.form.idDistrito) { this.warn('Distrito es requerido.'); return; }

    this.guardando = true;
    const payload = {
      codigo,
      direccion,
      idDistrito: this.form.idDistrito,
      principal: this.form.principal,
      activo: this.form.activo,
    };

    const obs = this.esEdicion && this.form.id
      ? this.clienteService.actualizarDireccion(this.form.id, payload)
      : this.clienteService.crearDireccion(this.clienteId, payload);

    obs.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion ? 'Actualizada' : 'Creada',
          detail: 'Dirección guardada correctamente.',
        });
        this.mostrarForm = false;
        this.guardando = false;
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        const msg = err?.error?.message || 'No se pudo guardar la dirección.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  eliminar(d: any): void {
    this.confirmationService.confirm({
      message: `¿Confirma eliminar la dirección "${d.codigo}"?`,
      header: 'Eliminar dirección',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.clienteService.eliminarDireccion(d.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Dirección marcada como inactiva.' });
            this.cargar();
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo eliminar.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
      },
    });
  }

  cerrar(): void {
    this.ref.close();
  }

  private warn(detail: string) {
    this.messageService.add({ severity: 'warn', summary: 'Validación', detail });
  }
}
