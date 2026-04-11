import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { UbicacionService } from '../../../_services/ubicacion.service';

@Component({
  selector: 'app-ubicacion-dialog',
  templateUrl: './ubicacion-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, DropdownModule,
    InputNumberModule, CheckboxModule, ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class UbicacionDialogComponent implements OnInit {

  model: any = { activo: true, height: 0, length: 0, width: 0 };
  almacenes: any[] = [];
  areas: any[] = [];
  guardando = false;
  esEdicion = false;

  constructor(
    private ubicacionService: UbicacionService,
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.almacenes = this.config.data?.almacenes || [];
    this.esEdicion = !!this.config.data?.ubicacion;

    if (this.esEdicion) {
      const u = this.config.data.ubicacion;
      this.model = {
        id: u.id,
        nombre: u.nombre,
        areaId: u.areaId,
        almacenId: u.almacenId,
        height: u.height ?? 0,
        length: u.length ?? 0,
        width: u.width ?? 0,
        nivelId: u.nivelId,
        posicionId: u.posicionId,
        grupoUbicacionId: u.grupoUbicacionId,
        subAreaId: u.subAreaId,
        activo: u.activo ?? true
      };
      if (this.model.almacenId) this.cargarAreas(this.model.almacenId);
    } else if (this.config.data?.almacenIdDefecto) {
      this.model.almacenId = this.config.data.almacenIdDefecto;
      this.cargarAreas(this.model.almacenId);
    }
  }

  onAlmacenChange() {
    this.model.areaId = null;
    this.areas = [];
    if (this.model.almacenId) this.cargarAreas(this.model.almacenId);
  }

  cargarAreas(almacenId: number) {
    this.ubicacionService.getAreas(almacenId).subscribe({
      next: (data) => {
        this.areas = (data || []).map((a: any) => ({ label: a.nombre, value: a.id }));
      }
    });
  }

  guardar() {
    if (!this.model.nombre?.trim() || !this.model.almacenId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Nombre y Almacén son requeridos' });
      return;
    }

    this.guardando = true;
    const payload = {
      nombre: this.model.nombre.trim(),
      areaId: this.model.areaId || null,
      almacenId: this.model.almacenId,
      height: this.model.height || 0,
      length: this.model.length || 0,
      width: this.model.width || 0,
      nivelId: this.model.nivelId || null,
      posicionId: this.model.posicionId || null,
      grupoUbicacionId: this.model.grupoUbicacionId || null,
      subAreaId: this.model.subAreaId || null,
      activo: this.model.activo ?? true
    };

    const op$ = this.esEdicion
      ? this.ubicacionService.actualizarUbicacion(this.model.id, payload)
      : this.ubicacionService.crearUbicacion(payload);

    op$.subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res?.message || 'Ubicación guardada' });
        setTimeout(() => this.ref.close(true), 800);
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al guardar';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        this.guardando = false;
      }
    });
  }

  cerrar() { this.ref.close(); }
}
