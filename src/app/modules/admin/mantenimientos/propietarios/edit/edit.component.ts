import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { PropietarioService } from '../../../_services/propietario.service';
import { GeneralService } from '../../../_services/general.service';

@Component({
  selector: 'app-edit-propietario',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  standalone: true,
  imports: [
    InputTextModule,
    DropdownModule,
    FormsModule,
    ButtonModule,
    CommonModule,
    DialogModule,
    DynamicDialogModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class EditPropietarioComponent implements OnInit {

  model: any = {};

  // Tipos de documento — se cargan desde Mantenimiento.ValorTabla (TablaId = 15).
  tiposDocumento: { id: number; nombre: string }[] = [];

  constructor(
    private propietarioService: PropietarioService,
    private generalService: GeneralService,
    private ref: DynamicDialogRef,
    private confirmationService: ConfirmationService,
    public config: DynamicDialogConfig,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.cargarTiposDocumento();
    const propietarioId = this.config.data?.propietarioId;
    if (propietarioId) {
      this.obtenerPropietario(propietarioId);
    }
  }

  cargarTiposDocumento() {
    this.generalService.getValorTabla(15).subscribe({
      next: (data) => {
        this.tiposDocumento = (data || []).map((v: any) => ({
          id: v.id,
          nombre: v.valorPrincipal
        }));
      },
      error: () => {
        this.tiposDocumento = [
          { id: 142, nombre: 'DNI' },
          { id: 145, nombre: 'RUC' }
        ];
      }
    });
  }

  obtenerPropietario(id: number) {
    this.propietarioService.getPropietarioById(id).subscribe({
      next: (data: any) => {
        this.model = {
          id: data.id,
          nombre: data.razonSocial || data.nombre || '',
          nombreCorto: data.nombreCorto || '',
          tipoDocumentoId: data.tipoDocumentoId || null,
          documento: data.documento || '',
          direccion: data.direccion || ''
        };
      },
      error: (err) => {
        console.error('Error al obtener propietario:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener la información del propietario'
        });
      }
    });
  }

  actualizar(): void {
    if (!this.model.nombre || !this.model.documento) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor complete los campos requeridos (Nombre/Razón Social, Documento)'
      });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea actualizar el propietario?',
      header: 'Actualizar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const payload = {
          nombre: this.model.nombre?.trim(),
          nombreCorto: this.model.nombreCorto?.trim() || null,
          tipoDocumentoId: this.model.tipoDocumentoId,
          documento: this.model.documento?.trim(),
          direccion: this.model.direccion?.trim() || null
        };

        this.propietarioService.actualizarPropietario(this.model.id, payload).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Actualización exitosa',
              detail: res?.message || 'El propietario se ha actualizado correctamente'
            });
            this.ref?.close(true);
          },
          error: (err) => {
            console.error('Error al actualizar propietario:', err);
            const mensaje = err.error?.message || err.error?.error || 'Error al actualizar propietario';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: mensaje
            });
          }
        });
      }
    });
  }

  cerrarModal() {
    this.ref?.close();
  }
}
