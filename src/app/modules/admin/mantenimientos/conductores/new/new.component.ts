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
import { DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MantenimientoService } from '../../mantenimiento.service';

@Component({
  selector: 'app-new-conductor',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
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
export class NewConductorComponent implements OnInit {

  model: any = {};

  constructor(
    private mantenimientoService: MantenimientoService,
    private ref: DynamicDialogRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    // Inicializar el modelo
    this.model = {
      nombreCompleto: '',
      dni: '',
      brevete: '',
      telefono: '',
      activo: true
    };
  }

  guardarConductor() {
    // Validar campos requeridos
    if (!this.model.nombreCompleto || !this.model.dni || !this.model.brevete) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor complete todos los campos requeridos (Nombre Completo, DNI, Brevete)'
      });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea guardar el conductor?',
      header: 'Guardar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Preparar el objeto según el modelo del backend
        const conductorGuardar = {
          NombreCompleto: this.model.nombreCompleto?.trim() || '',
          Dni: this.model.dni?.toString().trim().toUpperCase() || '',
          Brevete: this.model.brevete?.toString().trim().toUpperCase() || '',
          Telefono: this.model.telefono?.toString().trim() || null,
          Activo: this.model.activo !== undefined ? this.model.activo : true
        };

        console.log('Guardando conductor:', conductorGuardar);

        this.mantenimientoService.guardarConductor(conductorGuardar).subscribe({
          next: (data) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Conductor registrado',
              detail: data.message || 'El conductor se ha registrado correctamente'
            });
            this.ref?.close(true); // Cierra modal y notifica que se guardó
          },
          error: (err) => {
            console.error('Error al guardar conductor:', err);
            const mensaje = err.error?.message || err.error?.error || 'Error al guardar conductor';
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

