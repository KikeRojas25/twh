import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { UbicacionService } from '../../../_services/ubicacion.service';
import { UbicacionDialogComponent } from '../ubicacion-dialog/ubicacion-dialog.component';
import { InventarioUbicacionDialogComponent } from '../inventario-ubicacion-dialog/inventario-ubicacion-dialog.component';

@Component({
  selector: 'app-list-ubicaciones',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule,
    TableModule, DialogModule, DynamicDialogModule, ToastModule, TagModule,
    ConfirmDialogModule, CheckboxModule, MatIcon, TooltipModule,
  ],
  providers: [DialogService, MessageService, ConfirmationService]
})
export class ListUbicacionesComponent implements OnInit {

  @ViewChild('dt') dt!: Table;

  ubicaciones: any[] = [];
  almacenes: any[] = [];
  areas: any[] = [];
  model: any = {};
  cargando = false;
  ref: DynamicDialogRef | undefined;

  constructor(
    private ubicacionService: UbicacionService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.cargarAlmacenes();
  }

  cargarAlmacenes() {
    this.ubicacionService.getAlmacenes().subscribe({
      next: (data) => {
        this.almacenes = (data || []).map((a: any) => ({
          label: a.descripcion || a.nombre,
          value: a.id
        }));
      }
    });
  }

  onAlmacenChange() {
    this.model.areaId = null;
    this.areas = [];
    if (this.model.almacenId) {
      this.ubicacionService.getAreas(this.model.almacenId).subscribe({
        next: (data) => {
          this.areas = (data || []).map((a: any) => ({ label: a.nombre, value: a.id }));
        }
      });
    }
  }

  buscar() {
    this.cargando = true;
    this.ubicacionService.getUbicaciones(this.model.almacenId, this.model.areaId, this.model.nombre).subscribe({
      next: (data) => {
        this.ubicaciones = data || [];
        // Limpiar filtro de columna al recargar
        if (this.dt) this.dt.clear();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las ubicaciones' });
      },
      complete: () => { this.cargando = false; }
    });
  }

  filtrarTabla(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.dt.filterGlobal(val, 'contains');
  }

  getVal(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  nuevo() {
    this.ref = this.dialogService.open(UbicacionDialogComponent, {
      header: 'Nueva Ubicación',
      width: '650px',
      data: { almacenes: this.almacenes, almacenIdDefecto: this.model.almacenId }
    });
    this.ref.onClose.subscribe((guardado) => { if (guardado) this.buscar(); });
  }

  editar(ubicacion: any) {
    this.ref = this.dialogService.open(UbicacionDialogComponent, {
      header: 'Editar Ubicación',
      width: '650px',
      data: { ubicacion, almacenes: this.almacenes }
    });
    this.ref.onClose.subscribe((guardado) => { if (guardado) this.buscar(); });
  }

  verInventario(ubicacion: any) {
    this.ref = this.dialogService.open(InventarioUbicacionDialogComponent, {
      header: `Contenido — ${ubicacion.nombre}`,
      width: '900px',
      data: {
        ubicacionId: ubicacion.id,
        ubicacionNombre: ubicacion.nombre
      }
    });
  }

  eliminar(id: number) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar esta ubicación?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      accept: () => {
        this.ubicacionService.eliminarUbicacion(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Ubicación eliminada correctamente' });
            this.buscar();
          },
          error: (err) => {
            const msg = err.error?.message || 'Error al eliminar';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          }
        });
      }
    });
  }
}
