import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ClienteService } from '../../../_services/cliente.service';
import { ClienteDialogComponent } from '../cliente-dialog/cliente-dialog.component';

@Component({
  selector: 'app-list-clientes',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule,
    TableModule, DialogModule, DynamicDialogModule, ToastModule, TagModule,
    ConfirmDialogModule, MatIcon, TooltipModule,
  ],
  providers: [DialogService, MessageService, ConfirmationService],
})
export class ListClientesComponent implements OnInit {

  @ViewChild('dt') dt!: Table;

  clientes: any[] = [];
  criterio = '';
  cargando = false;
  ref: DynamicDialogRef | undefined;

  readonly tipoDocLabel: Record<number, string> = {
    1: 'DNI', 2: 'RUC', 3: 'Pasaporte', 4: 'C.E.',
  };

  constructor(
    private clienteService: ClienteService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() { this.buscar(); }

  buscar() {
    this.cargando = true;
    this.clienteService.getClientes(this.criterio).subscribe({
      next: (data) => {
        this.clientes = data || [];
        if (this.dt) this.dt.clear();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes.' });
      },
      complete: () => { this.cargando = false; },
    });
  }

  filtrarTabla(event: Event) {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  nuevo() {
    this.ref = this.dialogService.open(ClienteDialogComponent, {
      header: 'Nuevo Cliente',
      width: '600px',
      data: {},
    });
    this.ref.onClose.subscribe((guardado) => { if (guardado) this.buscar(); });
  }

  editar(cliente: any) {
    this.ref = this.dialogService.open(ClienteDialogComponent, {
      header: 'Editar Cliente',
      width: '600px',
      data: { cliente },
    });
    this.ref.onClose.subscribe((guardado) => { if (guardado) this.buscar(); });
  }

  eliminar(id: number, nombre: string) {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar al cliente <b>${nombre}</b>?`,
      header: 'Eliminar cliente',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.clienteService.eliminarCliente(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Cliente eliminado correctamente.' });
            this.buscar();
          },
          error: (err) => {
            const msg = err.error?.message || 'Error al eliminar el cliente.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
      },
    });
  }
}
