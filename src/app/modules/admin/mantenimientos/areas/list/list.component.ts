import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { UbicacionService } from '../../../_services/ubicacion.service';
import { AreaDialogComponent } from '../area-dialog/area-dialog.component';

@Component({
  selector: 'app-list-areas',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule,
    TableModule, DialogModule, DynamicDialogModule, ToastModule,
    ConfirmDialogModule, CheckboxModule, MatIcon, TooltipModule,
  ],
  providers: [DialogService, MessageService, ConfirmationService]
})
export class ListAreasComponent implements OnInit {

  areas: any[] = [];
  almacenes: any[] = [];
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

  buscar() {
    this.cargando = true;
    this.ubicacionService.getAreas(this.model.almacenId).subscribe({
      next: (data) => { this.areas = data || []; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las áreas' });
      },
      complete: () => { this.cargando = false; }
    });
  }

  nuevo() {
    this.ref = this.dialogService.open(AreaDialogComponent, {
      header: 'Nueva Área',
      width: '500px',
      data: { almacenes: this.almacenes }
    });
    this.ref.onClose.subscribe((guardado) => { if (guardado) this.buscar(); });
  }

  editar(area: any) {
    this.ref = this.dialogService.open(AreaDialogComponent, {
      header: 'Editar Área',
      width: '500px',
      data: { area, almacenes: this.almacenes }
    });
    this.ref.onClose.subscribe((guardado) => { if (guardado) this.buscar(); });
  }

  eliminar(id: number) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar esta área?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      accept: () => {
        this.ubicacionService.eliminarArea(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Área eliminada correctamente' });
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
