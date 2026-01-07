import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MantenimientoService } from '../../mantenimiento.service';

@Component({
  selector: 'app-edit-conductor',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  standalone: true,
  imports: [
    InputTextModule,
    DropdownModule,
    FormsModule,
    ButtonModule,
    TableModule,
    CommonModule,
    DialogModule,
    DynamicDialogModule,
    ToastModule,
    CalendarModule,
    ConfirmDialogModule,
    MatIcon,
    IconFieldModule,
    InputIconModule,
    InputMaskModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class EditConductorComponent implements OnInit {

  model: any = {};

  constructor(
    private mantenimientoService: MantenimientoService,
    private ref: DynamicDialogRef,
    private confirmationService: ConfirmationService,
    public config: DynamicDialogConfig,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const conductorId = this.config.data?.conductorId;
    if (conductorId) {
      this.obtenerConductor(conductorId);
    }
  }

  obtenerConductor(id: number) {
    this.mantenimientoService.getConductorById(id).subscribe({
      next: (data) => {
        console.log('Conductor:', data);

        this.model = {
          id: data.id || data.Id,
          nombreCompleto: data.nombreCompleto || data.NombreCompleto || '',
          dni: data.dni || data.Dni || '',
          brevete: data.brevete || data.Brevete || '',
          telefono: data.telefono || data.Telefono || '',
          activo: data.activo !== undefined ? data.activo : (data.Activo !== undefined ? data.Activo : true)
        };
      },
      error: (err) => {
        console.error('Error al obtener el conductor', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener la información del conductor'
        });
      }
    });
  }

  actualizarConductor(): void {
    // Validar que los campos requeridos estén presentes
    if (!this.model.nombreCompleto || !this.model.dni || !this.model.brevete) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor complete todos los campos requeridos (Nombre Completo, DNI, Brevete)'
      });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea actualizar el conductor?',
      header: 'Actualizar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Preparar el objeto según el modelo del backend
        // El API actualiza: Brevete, Telefono, NombreCompleto
        const conductorActualizar = {
          Id: this.model.id,
          NombreCompleto: this.model.nombreCompleto?.trim() || '',
          Dni: this.model.dni?.toString().trim().toUpperCase() || '',
          Brevete: this.model.brevete?.toString().trim().toUpperCase() || '',
          Telefono: this.model.telefono?.toString().trim() || null,
          Activo: this.model.activo !== undefined ? this.model.activo : true
        };

        console.log('Actualizando conductor:', conductorActualizar);

        this.mantenimientoService.actualizarConductor(this.model.id, conductorActualizar).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Actualización exitosa',
              detail: res.message || 'El conductor se ha actualizado correctamente'
            });
            this.ref?.close(true); // Cierra modal y notifica que se actualizó
          },
          error: (err) => {
            console.error('Error al actualizar conductor:', err);
            const mensaje = err.error?.message || err.error?.error || 'Error al actualizar conductor';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: mensaje
            });
          }
        });
      },
      reject: () => {
        // Usuario canceló la operación
      }
    });
  }

  cerrarModal() {
    this.ref?.close();
  }
}

