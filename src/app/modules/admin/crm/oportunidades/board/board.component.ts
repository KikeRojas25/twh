import {
  CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SidebarModule } from 'primeng/sidebar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';
import { EtapaOportunidad, OportunidadCard, PropietarioWmsRef, Vendedor } from '../../crm.types';
import { OportunidadDialogComponent } from '../oportunidad-dialog/oportunidad-dialog.component';

interface Columna {
  etapa: EtapaOportunidad;
  titulo: string;
  cards: OportunidadCard[];
}

const PROBABILIDAD: Record<EtapaOportunidad, number> = {
  PROSPECCION: 10, VISITA: 25, PROPUESTA: 50, NEGOCIACION: 75, GANADA: 100, PERDIDA: 0,
};

@Component({
  selector: 'app-crm-board',
  standalone: true,
  templateUrl: './board.component.html',
  imports: [
    CommonModule, FormsModule, DragDropModule, MatIcon, AutoCompleteModule, ButtonModule,
    DialogModule, DropdownModule, DynamicDialogModule, InputTextareaModule, SidebarModule,
    ToastModule, ConfirmDialogModule, TooltipModule, OportunidadDialogComponent,
  ],
  providers: [DialogService, MessageService, ConfirmationService],
  styles: [`
    .cdk-drag-preview { box-shadow: 0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12); }
    .cdk-drag-placeholder { opacity: 0.35; }
    .cdk-drag-animating { transition: transform 200ms cubic-bezier(0,0,.2,1); }
    .lista.cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) { transition: transform 200ms cubic-bezier(0,0,.2,1); }
  `],
})
export class CrmBoardComponent implements OnInit {

  cargando = false;
  ref: DynamicDialogRef | undefined;

  columnas: Columna[] = [
    { etapa: 'PROSPECCION', titulo: 'Prospección', cards: [] },
    { etapa: 'VISITA',      titulo: 'Visita',      cards: [] },
    { etapa: 'PROPUESTA',   titulo: 'Propuesta',   cards: [] },
    { etapa: 'NEGOCIACION', titulo: 'Negociación', cards: [] },
    { etapa: 'GANADA',      titulo: 'Ganada',      cards: [] },
    { etapa: 'PERDIDA',     titulo: 'Perdida',     cards: [] },
  ];

  get listaIds(): string[] { return this.columnas.map(c => 'lista-' + c.etapa); }

  // Filtros del tablero
  vendedores: Vendedor[] = [];
  filtroVendedorId: number | null = null;
  filtroEntidad: any = null;              // {entidadId, razonSocial} | string | null
  entidadesSugeridas: any[] = [];

  get hayFiltros(): boolean {
    return this.filtroVendedorId != null || (this.filtroEntidad && typeof this.filtroEntidad === 'object');
  }

  // Diálogo de motivo de pérdida
  mostrarMotivo = false;
  motivoTexto = '';
  private pendiente: { event: CdkDragDrop<OportunidadCard[]>; etapaDestino: EtapaOportunidad } | null = null;

  // Diálogo de conversión (al ganar → enlazar Propietario WMS)
  mostrarConversion = false;
  convirtiendo = false;
  propietariosSugeridos: PropietarioWmsRef[] = [];
  propietarioSeleccionadoConv: PropietarioWmsRef | string | null = null;
  private conversionCard: OportunidadCard | null = null;

  constructor(
    private crmService: CrmService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.crmService.getVendedores().subscribe({ next: (d) => this.vendedores = d ?? [], error: () => {} });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    const entidadId = this.filtroEntidad && typeof this.filtroEntidad === 'object' ? this.filtroEntidad.entidadId : undefined;
    this.crmService.getOportunidades(entidadId, this.filtroVendedorId ?? undefined).subscribe({
      next: (cards) => this.distribuir(cards ?? []),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el pipeline.' }),
      complete: () => { this.cargando = false; },
    });
  }

  buscarEntidadesFiltro(event: { query: string }): void {
    this.crmService.getEntidades(event?.query, undefined, 1, 20).subscribe({
      next: (res) => { this.entidadesSugeridas = (res?.items ?? []).map((e) => ({ entidadId: e.entidadId, razonSocial: e.razonSocial })); },
      error: () => { this.entidadesSugeridas = []; },
    });
  }

  limpiarFiltros(): void {
    this.filtroVendedorId = null;
    this.filtroEntidad = null;
    this.cargar();
  }

  private distribuir(cards: OportunidadCard[]): void {
    this.columnas.forEach(c => c.cards = []);
    for (const card of cards) {
      const col = this.columnas.find(c => c.etapa === card.etapa) ?? this.columnas[0];
      col.cards.push(card);
    }
  }

  totalColumna(col: Columna): number {
    return col.cards.reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0);
  }

  iniciales(nombre?: string | null): string {
    if (!nombre) return '';
    const p = nombre.trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  /** Tinte suave para el encabezado de la columna, por etapa. */
  colHeaderClass(etapa: EtapaOportunidad): string {
    switch (etapa) {
      case 'PROSPECCION': return 'bg-blue-50 text-blue-700';
      case 'VISITA':      return 'bg-indigo-50 text-indigo-700';
      case 'PROPUESTA':   return 'bg-purple-50 text-purple-700';
      case 'NEGOCIACION': return 'bg-amber-50 text-amber-700';
      case 'GANADA':      return 'bg-green-50 text-green-700';
      case 'PERDIDA':     return 'bg-red-50 text-red-700';
      default:            return 'bg-gray-50 text-gray-700';
    }
  }

  /** Color del badge de probabilidad: verde que se intensifica conforme sube. */
  probClass(prob: number): string {
    if (prob >= 80) return 'bg-green-600 text-white';
    if (prob >= 60) return 'bg-green-500 text-white';
    if (prob >= 40) return 'bg-green-100 text-green-700';
    if (prob >= 20) return 'bg-green-50 text-green-600';
    return 'bg-gray-100 text-gray-500';
  }

  /** Acento lateral suave de la tarjeta, por etapa. */
  cardAccentClass(etapa: EtapaOportunidad): string {
    switch (etapa) {
      case 'PROSPECCION': return 'border-l-blue-400';
      case 'VISITA':      return 'border-l-indigo-400';
      case 'PROPUESTA':   return 'border-l-purple-400';
      case 'NEGOCIACION': return 'border-l-amber-400';
      case 'GANADA':      return 'border-l-green-500';
      case 'PERDIDA':     return 'border-l-red-400';
      default:            return 'border-l-gray-300';
    }
  }

  // ─── Drag & drop ──────────────────────────────────────────────────────────

  drop(event: CdkDragDrop<OportunidadCard[]>, etapaDestino: EtapaOportunidad): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      const card = event.container.data[event.currentIndex];
      this.persistir(card, etapaDestino, event.currentIndex, null);
      return;
    }

    // Mover a PERDIDA requiere motivo → se difiere hasta confirmar.
    if (etapaDestino === 'PERDIDA') {
      this.pendiente = { event, etapaDestino };
      this.motivoTexto = '';
      this.mostrarMotivo = true;
      return;
    }

    const moved = this.aplicarMovimiento(event, etapaDestino, null);
    // Al ganar → ofrecer enlazar la entidad a un Propietario del WMS (conversión).
    if (etapaDestino === 'GANADA' && moved) this.abrirConversion(moved);
  }

  confirmarMotivo(): void {
    if (!this.motivoTexto.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Indique el motivo de pérdida.' });
      return;
    }
    if (this.pendiente) {
      this.aplicarMovimiento(this.pendiente.event, this.pendiente.etapaDestino, this.motivoTexto.trim());
    }
    this.mostrarMotivo = false;
    this.pendiente = null;
  }

  cancelarMotivo(): void {
    // Sin cambios: la tarjeta permanece en su columna original.
    this.mostrarMotivo = false;
    this.pendiente = null;
  }

  private aplicarMovimiento(event: CdkDragDrop<OportunidadCard[]>, etapaDestino: EtapaOportunidad, motivo: string | null): OportunidadCard {
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    const card = event.container.data[event.currentIndex];
    card.etapa = etapaDestino;
    // Solo los cierres ajustan la probabilidad; las intermedias respetan el valor manual.
    if (etapaDestino === 'GANADA' || etapaDestino === 'PERDIDA') {
      card.probabilidad = PROBABILIDAD[etapaDestino];
    }
    card.motivoPerdida = etapaDestino === 'PERDIDA' ? motivo : null;
    this.persistir(card, etapaDestino, event.currentIndex, motivo);
    return card;
  }

  // ─── Conversión al ganar ──────────────────────────────────────────────────

  private abrirConversion(card: OportunidadCard): void {
    this.conversionCard = card;
    this.propietarioSeleccionadoConv = null;
    this.propietariosSugeridos = [];
    this.mostrarConversion = true;
  }

  buscarPropietarios(event: { query: string }): void {
    this.crmService.getPropietariosWms(event?.query).subscribe({
      next: (data) => { this.propietariosSugeridos = (data ?? []).map((p: any) => ({ id: p.id, nombre: p.nombre, documento: p.documento })); },
      error: () => { this.propietariosSugeridos = []; },
    });
  }

  get propietarioConvId(): number | null {
    return this.propietarioSeleccionadoConv && typeof this.propietarioSeleccionadoConv === 'object'
      ? this.propietarioSeleccionadoConv.id : null;
  }

  confirmarConversion(): void {
    const propId = this.propietarioConvId;
    if (!propId || !this.conversionCard) return;
    this.convirtiendo = true;
    this.crmService.convertirOportunidad(this.conversionCard.oportunidadId, propId).subscribe({
      next: (res) => {
        this.convirtiendo = false;
        if (res && res.success === false) { this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'No se pudo convertir.' }); return; }
        this.mostrarConversion = false;
        this.messageService.add({ severity: 'success', summary: 'Convertida', detail: 'Cuenta enlazada al propietario y marcada como CLIENTE.' });
      },
      error: (err) => {
        this.convirtiendo = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo convertir.' });
      },
    });
  }

  cerrarConversion(): void { this.mostrarConversion = false; this.conversionCard = null; }

  private persistir(card: OportunidadCard, etapa: EtapaOportunidad, orden: number, motivo: string | null): void {
    this.crmService.moverOportunidad(card.oportunidadId, { etapa, orden, motivoPerdida: motivo }).subscribe({
      next: (res) => {
        if (res && res.success === false) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'No se pudo mover.' });
          this.cargar();
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo mover la oportunidad.' });
        this.cargar();
      },
    });
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  // Panel lateral (sidebar) de la oportunidad
  oportVisible = false;
  oportSel: OportunidadCard | null = null;

  nueva(): void {
    this.oportSel = null;
    this.oportVisible = true;
  }

  editar(card: OportunidadCard): void {
    this.oportSel = card;
    this.oportVisible = true;
  }

  onOportCerrado(guardado: boolean): void {
    this.oportVisible = false;
    if (guardado) this.cargar();
  }

  eliminar(card: OportunidadCard): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la oportunidad <b>${card.nombre}</b>?`,
      header: 'Eliminar oportunidad',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.crmService.eliminarOportunidad(card.oportunidadId).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Oportunidad eliminada.' }); this.cargar(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar.' }),
        });
      },
    });
  }
}
