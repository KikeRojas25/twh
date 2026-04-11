import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ClienteService } from '../../../_services/cliente.service';

@Component({
  selector: 'app-vincular-clientes-dialog',
  templateUrl: './vincular-clientes-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    AutoCompleteModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService]
})
export class VincularClientesDialogComponent implements OnInit {

  propietarioId!: number;
  propietarioNombre!: string;

  clienteSeleccionado: any = null;
  sugerencias: any[] = [];
  clientesVinculados: any[] = [];
  cargandoVinculados = false;
  vinculando = false;

  constructor(
    private clienteService: ClienteService,
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.propietarioId = this.config.data?.propietarioId;
    this.propietarioNombre = this.config.data?.propietarioNombre;
    this.cargarVinculados();
  }

  buscarClientes(event: any) {
    const criterio = event.query ?? '';
    this.clienteService.getAllClientes(criterio).subscribe({
      next: (data) => {
        this.sugerencias = (data || []).map((c: any) => ({
          ...c,
          label: `${c.razonSocial || c.nombre || ''} - ${c.documento || ''}`
        }));
      },
      error: () => {
        this.sugerencias = [];
      }
    });
  }

  cargarVinculados() {
    this.cargandoVinculados = true;
    this.clienteService.getAllClientesxPropietarios(this.propietarioId).subscribe({
      next: (data) => {
        this.clientesVinculados = data || [];
        this.cargandoVinculados = false;
      },
      error: () => {
        this.cargandoVinculados = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los clientes vinculados'
        });
      }
    });
  }

  vincular() {
    if (!this.clienteSeleccionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Seleccione un cliente para vincular'
      });
      return;
    }

    this.vinculando = true;
    const payload = {
      clienteId: this.clienteSeleccionado.id,
      propietarioId: this.propietarioId
    };

    this.clienteService.vincularClientePropietario(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Vinculado',
          detail: 'Cliente vinculado correctamente'
        });
        this.clienteSeleccionado = null;
        this.cargarVinculados();
        this.vinculando = false;
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al vincular cliente';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        this.vinculando = false;
      }
    });
  }

  confirmarDesvincular(clienteId: number) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea desvincular este cliente?',
      header: 'Desvincular',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desvincular',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.clienteService.desvincularClientePropietario(this.propietarioId, clienteId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'info',
              summary: 'Desvinculado',
              detail: 'Cliente desvinculado correctamente'
            });
            this.cargarVinculados();
          },
          error: (err) => {
            const msg = err.error?.message || 'Error al desvincular cliente';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          }
        });
      }
    });
  }

  cerrar() {
    this.ref.close();
  }
}
