import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { UbicacionService } from '../../../_services/ubicacion.service';

@Component({
  selector: 'app-area-dialog',
  templateUrl: './area-dialog.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DropdownModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService]
})
export class AreaDialogComponent implements OnInit {

  model: any = {};
  almacenes: any[] = [];
  tiposArea: any[] = [];
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
    this.esEdicion = !!this.config.data?.area;

    if (this.esEdicion) {
      const a = this.config.data.area;
      this.model = { nombre: a.nombre, tipoAreaId: a.tipoAreaId, almacenId: a.almacenId, id: a.id };
    }

    this.ubicacionService.getTiposArea().subscribe({
      next: (data) => {
        this.tiposArea = (data || []).map((t: any) => ({ label: t.nombre, value: t.id }));
      }
    });
  }

  guardar() {
    if (!this.model.nombre?.trim() || !this.model.tipoAreaId || !this.model.almacenId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Complete todos los campos requeridos' });
      return;
    }

    this.guardando = true;
    const payload = { nombre: this.model.nombre.trim(), tipoAreaId: this.model.tipoAreaId, almacenId: this.model.almacenId };

    const op$ = this.esEdicion
      ? this.ubicacionService.actualizarArea(this.model.id, payload)
      : this.ubicacionService.crearArea(payload);

    op$.subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res?.message || 'Área guardada' });
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
