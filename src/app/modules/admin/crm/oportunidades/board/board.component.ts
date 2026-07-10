import {
  CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, HostBinding, OnInit } from '@angular/core';
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
import { EtapaOportunidad, MetaVendedor, OportunidadCard, PropietarioWmsRef, Vendedor } from '../../crm.types';
import { OportunidadDialogComponent } from '../oportunidad-dialog/oportunidad-dialog.component';
import { CorreosComponent } from '../vistas/correos.component';
import { EmbudoComponent } from '../vistas/embudo.component';
import { ListaOportunidadesComponent } from '../vistas/lista-oportunidades.component';
import { ResumenVendedorComponent } from '../vistas/resumen-vendedor.component';

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
    ResumenVendedorComponent, ListaOportunidadesComponent, EmbudoComponent, CorreosComponent,
  ],
  providers: [DialogService, MessageService, ConfirmationService],
  styles: [`
    :host {
      display: block;
      --pg-bg: #191919; --pg-surface: #252525; --pg-surface-2: #202020;
      --pg-hover: #2c2c2c; --pg-border: rgba(255,255,255,0.07);
      --pg-chip: rgba(255,255,255,0.05); --pg-active: rgba(255,255,255,0.10);
      --pg-title: #ffffff; --pg-strong: #f3f4f6; --pg-text: #d1d5db; --pg-muted: #8b8b8b;
    }
    :host(.tema-claro) {
      --pg-bg: #f9fafb; --pg-surface: #ffffff; --pg-surface-2: #ffffff;
      --pg-hover: #f3f4f6; --pg-border: #e5e7eb;
      --pg-chip: #f1f1ef; --pg-active: #e9e9e7;
      --pg-title: #111827; --pg-strong: #111827; --pg-text: #374151; --pg-muted: #6b7280;
    }
    .cdk-drag-preview { border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,.35); }
    .cdk-drag-placeholder { opacity: 0.25; }
    .cdk-drag-animating { transition: transform 200ms cubic-bezier(0,0,.2,1); }
    .lista.cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) { transition: transform 200ms cubic-bezier(0,0,.2,1); }
    .notion-scroll::-webkit-scrollbar { height: 10px; width: 10px; }
    .notion-scroll::-webkit-scrollbar-thumb { background: var(--pg-border); border-radius: 6px; }
    .notion-scroll::-webkit-scrollbar-track { background: transparent; }
    /* Controles PrimeNG acordes al tema, planos (estilo Notion, sin efecto 3D) */
    :host ::ng-deep .p-dropdown,
    :host ::ng-deep .p-autocomplete .p-inputtext {
      background: var(--pg-surface); border: 1px solid var(--pg-border); color: var(--pg-strong);
      border-radius: 6px; box-shadow: none !important;
    }
    :host ::ng-deep .p-dropdown .p-dropdown-label { color: var(--pg-strong); }
    :host ::ng-deep .p-dropdown .p-dropdown-trigger,
    :host ::ng-deep .p-autocomplete .p-autocomplete-dropdown { color: var(--pg-muted); }
    /* Sin glow/sombra en focus ni hover */
    :host ::ng-deep .p-dropdown:not(.p-disabled).p-focus,
    :host ::ng-deep .p-dropdown:not(.p-disabled):hover,
    :host ::ng-deep .p-autocomplete .p-inputtext:enabled:focus,
    :host ::ng-deep .p-autocomplete .p-inputtext:enabled:hover {
      box-shadow: none !important; border-color: var(--pg-active) !important; outline: none !important;
    }
    :host ::ng-deep .p-button { box-shadow: none !important; }
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

  // ─── Vistas del pipeline ───────────────────────────────────────────────────
  vista: 'kanban' | 'vendedor' | 'lista' | 'embudo' | 'correos' = 'kanban';
  readonly vistaOpciones = [
    { value: 'kanban', label: 'Kanban', icon: 'pi pi-th-large' },
    { value: 'vendedor', label: 'Por vendedor', icon: 'pi pi-users' },
    { value: 'lista', label: 'Lista', icon: 'pi pi-list' },
    { value: 'embudo', label: 'Embudo', icon: 'pi pi-filter' },
    { value: 'correos', label: 'Correos', icon: 'pi pi-envelope' },
  ] as const;

  // Periodo (vista Por vendedor)
  private readonly hoy = new Date();
  anio = this.hoy.getFullYear();
  mes = this.hoy.getMonth() + 1;
  readonly mesesOpciones = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Setiembre', value: 9 },
    { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];
  get aniosOpciones() {
    const y = this.hoy.getFullYear();
    return [y - 2, y - 1, y, y + 1].map(a => ({ label: '' + a, value: a }));
  }

  // Tema: oscuro por defecto (look Notion que el usuario prefiere)
  modo: 'oscuro' | 'claro' = 'oscuro';
  @HostBinding('class.tema-claro') get esTemaClaro(): boolean { return this.modo === 'claro'; }

  cambiarModo(): void {
    this.modo = this.modo === 'oscuro' ? 'claro' : 'oscuro';
    localStorage.setItem('crmTemaPipeline', this.modo);
  }

  // Datos compartidos con las vistas
  todasCards: OportunidadCard[] = [];
  metas: MetaVendedor[] = [];

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
    const v = localStorage.getItem('crmVistaPipeline');
    if (v === 'kanban' || v === 'vendedor' || v === 'lista' || v === 'embudo' || v === 'correos') this.vista = v;
    const t = localStorage.getItem('crmTemaPipeline');
    if (t === 'claro' || t === 'oscuro') this.modo = t;
    this.crmService.getVendedores().subscribe({ next: (d) => this.vendedores = d ?? [], error: () => {} });
    this.cargar();
    this.cargarMetas();
  }

  cambiarVista(v: 'kanban' | 'vendedor' | 'lista' | 'embudo' | 'correos'): void {
    this.vista = v;
    localStorage.setItem('crmVistaPipeline', v);
    if (v === 'vendedor') this.cargarMetas();
  }

  cambiarPeriodo(): void { this.cargarMetas(); }

  private cargarMetas(): void {
    this.crmService.getMetasVendedor(this.anio, this.mes).subscribe({
      next: (d) => { this.metas = d ?? []; },
      error: () => { this.metas = []; },
    });
  }

  onGuardarMeta(ev: { vendedorUsuarioId: number; monto: number }): void {
    this.crmService.guardarMetaVendedor({ vendedorUsuarioId: ev.vendedorUsuarioId, anio: this.anio, mes: this.mes, monto: ev.monto }).subscribe({
      next: (res) => {
        if (res && res.success === false) { this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'No se pudo guardar la meta.' }); return; }
        this.messageService.add({ severity: 'success', summary: 'Meta guardada', detail: 'Meta del vendedor actualizada.' });
        this.cargarMetas();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la meta.' }),
    });
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
    this.todasCards = cards;
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

  // ─── KPIs del pipeline y salud del deal ─────────────────────────────────────

  private get todas(): OportunidadCard[] { return this.columnas.reduce((acc, c) => acc.concat(c.cards), [] as OportunidadCard[]); }
  private esActiva(e: EtapaOportunidad): boolean { return e !== 'GANADA' && e !== 'PERDIDA'; }

  get totalPipeline(): number {
    return this.todas.filter(c => this.esActiva(c.etapa)).reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0);
  }
  get totalPonderado(): number {
    return this.todas.filter(c => this.esActiva(c.etapa))
      .reduce((s, c) => s + (c.valorEstimadoMensual || 0) * (c.probabilidad || 0) / 100, 0);
  }
  get countActivas(): number { return this.todas.filter(c => this.esActiva(c.etapa)).length; }
  get valorGanadas(): number {
    return this.todas.filter(c => c.etapa === 'GANADA').reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0);
  }
  get countGanadas(): number { return this.todas.filter(c => c.etapa === 'GANADA').length; }
  get tasaGanadas(): number {
    const cerradas = this.todas.filter(c => c.etapa === 'GANADA' || c.etapa === 'PERDIDA').length;
    return cerradas ? Math.round(this.countGanadas / cerradas * 100) : 0;
  }

  ponderadoColumna(col: Columna): number {
    return col.cards.reduce((s, c) => s + (c.valorEstimadoMensual || 0) * (c.probabilidad || 0) / 100, 0);
  }
  valorPonderado(card: OportunidadCard): number {
    return (card.valorEstimadoMensual || 0) * (card.probabilidad || 0) / 100;
  }

  /** Días desde el último cambio (proxy de "frescura" del deal). */
  diasSinCambios(card: OportunidadCard): number {
    if (!card.fechaUltimoCambio) return 0;
    const d = new Date(card.fechaUltimoCambio).getTime();
    return isNaN(d) ? 0 : Math.max(0, Math.floor((Date.now() - d) / 86400000));
  }
  /** Punto de salud: verde (fresco), ámbar (>7d), rojo (>21d). Gris en deals cerrados. */
  healthClass(card: OportunidadCard): string {
    if (!this.esActiva(card.etapa)) return 'bg-gray-300';
    const d = this.diasSinCambios(card);
    if (d <= 7)  return 'bg-green-500';
    if (d <= 21) return 'bg-amber-400';
    return 'bg-red-500';
  }
  healthTitle(card: OportunidadCard): string {
    const d = this.diasSinCambios(card);
    return d === 0 ? 'Actualizada hoy' : `${d} día(s) sin cambios`;
  }

  actividadVencida(card: OportunidadCard): boolean {
    if (!card.proximaActividadFecha) return false;
    const f = new Date(card.proximaActividadFecha).getTime();
    return !isNaN(f) && f < Date.now();
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

  /** Etiqueta de columna estilo Notion: pill con tinte de color por etapa (legible en ambos temas). */
  colPillClass(etapa: EtapaOportunidad): string {
    switch (etapa) {
      case 'PROSPECCION': return 'bg-blue-500/15 text-blue-600';
      case 'VISITA':      return 'bg-indigo-500/15 text-indigo-600';
      case 'PROPUESTA':   return 'bg-purple-500/15 text-purple-600';
      case 'NEGOCIACION': return 'bg-amber-500/15 text-amber-700';
      case 'GANADA':      return 'bg-green-500/15 text-green-600';
      case 'PERDIDA':     return 'bg-red-500/15 text-red-600';
      default:            return 'bg-gray-500/15 text-gray-500';
    }
  }

  /** Fondo tenue de la COLUMNA por etapa (tinte del color, sutil en ambos temas). */
  colBgClass(etapa: EtapaOportunidad): string {
    switch (etapa) {
      case 'PROSPECCION': return 'bg-blue-500/[0.06]';
      case 'VISITA':      return 'bg-indigo-500/[0.06]';
      case 'PROPUESTA':   return 'bg-purple-500/[0.06]';
      case 'NEGOCIACION': return 'bg-amber-500/[0.07]';
      case 'GANADA':      return 'bg-green-500/[0.06]';
      case 'PERDIDA':     return 'bg-red-500/[0.06]';
      default:            return 'bg-gray-500/[0.05]';
    }
  }

  /** Color del contador de la columna, por etapa. */
  colCountClass(etapa: EtapaOportunidad): string {
    switch (etapa) {
      case 'PROSPECCION': return 'text-blue-600';
      case 'VISITA':      return 'text-indigo-600';
      case 'PROPUESTA':   return 'text-purple-600';
      case 'NEGOCIACION': return 'text-amber-700';
      case 'GANADA':      return 'text-green-600';
      case 'PERDIDA':     return 'text-red-600';
      default:            return 'text-gray-500';
    }
  }

  /** Fondo suave de la tarjeta, por etapa, para diferenciarla de un vistazo. */
  cardBgClass(etapa: EtapaOportunidad): string {
    switch (etapa) {
      case 'PROSPECCION': return 'bg-blue-50';
      case 'VISITA':      return 'bg-indigo-50';
      case 'PROPUESTA':   return 'bg-purple-50';
      case 'NEGOCIACION': return 'bg-amber-50';
      case 'GANADA':      return 'bg-green-50';
      case 'PERDIDA':     return 'bg-red-50';
      default:            return 'bg-white';
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

  // Click en la tarjeta abre el panel lateral. Se ignora el click espurio que
  // dispara el navegador justo después de soltar un arrastre.
  private draggingCard = false;
  onCardDragStarted(): void { this.draggingCard = true; }
  onCardDragEnded(): void { setTimeout(() => (this.draggingCard = false), 0); }
  abrirDetalle(card: OportunidadCard): void {
    if (this.draggingCard) return;
    this.editar(card);
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
