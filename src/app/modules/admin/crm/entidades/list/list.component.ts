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
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';
import { EntidadListItem, EstadoEntidad } from '../../crm.types';
import { EntidadDialogComponent } from '../entidad-dialog/entidad-dialog.component';

@Component({
  selector: 'app-crm-entidades-list',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule,
    TableModule, DialogModule, DynamicDialogModule, ToastModule, TagModule,
    ConfirmDialogModule, MatIcon, TooltipModule,
  ],
  providers: [DialogService, MessageService, ConfirmationService],
})
export class CrmEntidadesListComponent implements OnInit {

  @ViewChild('dt') dt!: Table;

  entidades: EntidadListItem[] = [];
  total = 0;
  first = 0;
  pageSize = 20;
  cargando = false;

  criterio = '';
  estado: string | null = null;
  ref: DynamicDialogRef | undefined;

  readonly estadoOpciones = [
    { label: 'Todos', value: null },
    { label: 'Prospecto', value: 'PROSPECTO' },
    { label: 'Cliente', value: 'CLIENTE' },
    { label: 'Inactivo', value: 'INACTIVO' },
    { label: 'Descartado', value: 'DESCARTADO' },
  ];

  constructor(
    private crmService: CrmService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void { /* la carga inicial la dispara p-table (lazy) */ }

  /** Handler de p-table lazy: se dispara al iniciar y al cambiar de página. */
  cargar(event?: TableLazyLoadEvent): void {
    if (event) {
      this.first = event.first ?? 0;
      this.pageSize = event.rows ?? this.pageSize;
    }
    const page = Math.floor(this.first / this.pageSize) + 1;

    this.cargando = true;
    this.crmService.getEntidades(this.criterio, this.estado ?? undefined, page, this.pageSize).subscribe({
      next: (res) => {
        this.entidades = res?.items ?? [];
        this.total = res?.total ?? 0;
      },
      error: () => {
        this.entidades = [];
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las entidades.' });
      },
      complete: () => { this.cargando = false; },
    });
  }

  /** Nueva búsqueda: vuelve a la primera página y recarga. */
  buscar(): void {
    this.first = 0;
    if (this.dt) this.dt.first = 0;
    this.cargar();
  }

  nueva(): void {
    this.ref = this.dialogService.open(EntidadDialogComponent, {
      header: 'Nueva Entidad',
      width: '960px',
      contentStyle: { 'max-height': '80vh', overflow: 'auto' },
      breakpoints: { '1200px': '95vw' },
      data: {},
    });
    this.ref.onClose.subscribe((guardado) => { if (guardado) this.cargar(); });
  }

  editar(entidad: EntidadListItem): void {
    this.ref = this.dialogService.open(EntidadDialogComponent, {
      header: `Entidad — ${entidad.razonSocial}`,
      width: '960px',
      contentStyle: { 'max-height': '80vh', overflow: 'auto' },
      breakpoints: { '1200px': '95vw' },
      data: { entidadId: entidad.entidadId },
    });
    this.ref.onClose.subscribe((guardado) => { if (guardado) this.cargar(); });
  }

  descartar(entidad: EntidadListItem): void {
    this.confirmationService.confirm({
      message: `¿Descartar la entidad <b>${entidad.razonSocial}</b>? Pasará al estado DESCARTADO (baja lógica).`,
      header: 'Descartar entidad',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, descartar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.crmService.eliminarEntidad(entidad.entidadId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Descartada', detail: 'Entidad descartada correctamente.' });
            this.cargar();
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo descartar la entidad.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
      },
    });
  }

  estadoSeverity(estado: EstadoEntidad): string {
    switch (estado) {
      case 'CLIENTE':    return 'success';
      case 'PROSPECTO':  return 'info';
      case 'INACTIVO':   return 'warning';
      case 'DESCARTADO': return 'danger';
      default:           return 'secondary';
    }
  }
}
