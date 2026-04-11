import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ClienteService } from '../../../_services/cliente.service';

@Component({
  selector: 'app-cliente-dialog',
  templateUrl: './cliente-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule,
    DropdownModule, CheckboxModule, ToastModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class ClienteDialogComponent implements OnInit {

  model: any = {};
  guardando = false;
  esEdicion = false;

  tiposDocumento = [
    { label: 'DNI',                  value: 1 },
    { label: 'RUC',                  value: 2 },
    { label: 'Pasaporte',            value: 3 },
    { label: 'Carnet de Extranjería', value: 4 },
  ];

  constructor(
    private clienteService: ClienteService,
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    const cliente = this.config.data?.cliente;
    this.esEdicion = !!cliente;

    this.model = cliente
      ? {
          nombre:          cliente.nombre         ?? '',
          tipoDocumentoId: cliente.tipoDocumentoId ?? null,
          documento:       cliente.documento       ?? '',
          correo:          cliente.correo          ?? '',
          contacto:        cliente.contacto        ?? '',
          telefono:        cliente.telefono        ?? '',
          etiquetado:      cliente.etiquetado      ?? false,
        }
      : {
          nombre: '', tipoDocumentoId: null, documento: '',
          correo: '', contacto: '', telefono: '', etiquetado: false,
        };
  }

  guardar() {
    if (!this.model.nombre?.trim() || !this.model.documento?.trim() || !this.model.tipoDocumentoId) {
      this.messageService.add({
        severity: 'warn', summary: 'Validación',
        detail: 'Nombre, Tipo de documento y Documento son obligatorios.',
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Está seguro que desea ${this.esEdicion ? 'actualizar' : 'crear'} el cliente?`,
      header: this.esEdicion ? 'Actualizar' : 'Crear',
      icon: 'pi pi-question-circle',
      accept: () => this._enviar(),
    });
  }

  private _enviar() {
    this.guardando = true;
    const payload = {
      nombre:          this.model.nombre.trim(),
      tipoDocumentoId: this.model.tipoDocumentoId,
      documento:       this.model.documento.trim(),
      correo:          this.model.correo?.trim()    || null,
      contacto:        this.model.contacto?.trim()  || null,
      telefono:        this.model.telefono?.trim()  || null,
      etiquetado:      this.model.etiquetado ?? false,
    };

    const op$ = this.esEdicion
      ? this.clienteService.actualizarCliente(this.config.data.cliente.id, payload)
      : this.clienteService.crearCliente(payload);

    op$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Éxito',
          detail: `Cliente ${this.esEdicion ? 'actualizado' : 'creado'} correctamente.`,
        });
        setTimeout(() => this.ref.close(true), 800);
      },
      error: (err) => {
        this.guardando = false;
        const msg = err.error?.message || 'Error al guardar el cliente.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  cerrar() { this.ref.close(); }
}
