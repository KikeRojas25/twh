import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { PropietarioService } from '../../../_services/propietario.service';
import { GeneralService } from '../../../_services/general.service';

@Component({
  selector: 'app-new-propietario',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
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
export class NewPropietarioComponent implements OnInit {

  model: any = {};

  // Tipos de documento — se cargan desde Mantenimiento.ValorTabla (TablaId = 15).
  tiposDocumento: { id: number; nombre: string }[] = [];

  constructor(
    private propietarioService: PropietarioService,
    private generalService: GeneralService,
    private ref: DynamicDialogRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.model = {
      nombre: '',
      nombreCorto: '',
      tipoDocumentoId: null,
      documento: '',
      direccion: ''
    };

    this.cargarTiposDocumento();
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
        // Fallback mínimo si el endpoint falla — IDs reales de la BD.
        this.tiposDocumento = [
          { id: 142, nombre: 'DNI' },
          { id: 145, nombre: 'RUC' }
        ];
      }
    });
  }

  guardar() {
    if (!this.model.nombre || !this.model.documento) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor complete los campos requeridos (Nombre/Razón Social, Documento)'
      });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea guardar el propietario?',
      header: 'Guardar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const payload = {
          nombre: this.model.nombre?.trim(),
          nombreCorto: this.model.nombreCorto?.trim() || null,
          tipoDocumentoId: this.model.tipoDocumentoId,
          documento: this.model.documento?.trim(),
          direccion: this.model.direccion?.trim() || null
        };

        this.propietarioService.registrarPropietario(payload).subscribe({
          next: (data) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Propietario registrado',
              detail: data?.message || 'El propietario se ha registrado correctamente'
            });
            this.ref?.close(true);
          },
          error: (err) => {
            console.error('Error al guardar propietario:', err);
            const mensaje = err.error?.message || err.error?.error || 'Error al guardar propietario';
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
