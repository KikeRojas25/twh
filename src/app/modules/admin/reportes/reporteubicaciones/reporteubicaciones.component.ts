import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { UbicacionService } from '../../_services/ubicacion.service';
import { InventarioUbicacionDialogComponent } from '../../mantenimientos/ubicaciones/inventario-ubicacion-dialog/inventario-ubicacion-dialog.component';

@Component({
  selector: 'app-reporteubicaciones',
  templateUrl: './reporteubicaciones.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule,
    TableModule, DynamicDialogModule, ToastModule, TagModule,
    MatIcon, TooltipModule,
  ],
  providers: [DialogService, MessageService]
})
export class ReporteubicacionesComponent implements OnInit {

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
}
