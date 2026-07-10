import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';
import { Adjunto, Contacto, OportunidadCard, PropuestaSummary, Vendedor } from '../../crm.types';
import { ActividadesPanelComponent } from '../../shared/actividades-panel/actividades-panel.component';
import { ComunicacionesPanelComponent } from '../../shared/comunicaciones-panel/comunicaciones-panel.component';
import { PropuestaDialogComponent } from '../../propuestas/propuesta-dialog/propuesta-dialog.component';

@Component({
  selector: 'app-crm-oportunidad-dialog',
  standalone: true,
  templateUrl: './oportunidad-dialog.component.html',
  imports: [
    CommonModule, FormsModule, AutoCompleteModule, ButtonModule, CalendarModule,
    ConfirmDialogModule, DropdownModule, DynamicDialogModule, InputNumberModule,
    InputTextModule, TableModule, TabViewModule, TagModule, ToastModule, TooltipModule,
    ComunicacionesPanelComponent, ActividadesPanelComponent,
  ],
  providers: [MessageService, ConfirmationService, DialogService],
})
export class OportunidadDialogComponent implements OnInit {
  private crmService = inject(CrmService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private dialogService = inject(DialogService);
  private propRef: DynamicDialogRef | undefined;

  /** Oportunidad a editar (card). Si es null, se abre en modo "nueva". */
  @Input() oportunidad: OportunidadCard | null = null;
  /** Contexto de entidad (al crear desde la ficha de una entidad). */
  @Input() entidadCtx: { entidadId: number; razonSocial: string } | null = null;
  /** Emite al cerrar: true si hubo cambios (para refrescar el padre). */
  @Output() cerrado = new EventEmitter<boolean>();

  esEdicion = false;
  guardando = false;
  huboCambios = false;
  oportunidadId: number | null = null;

  // Contactos de la entidad (para el panel de comunicaciones)
  contactos: Contacto[] = [];

  // Propuestas de la oportunidad
  propuestas: PropuestaSummary[] = [];
  cargandoPropuestas = false;

  // Adjuntos / archivos (Fase 2 workspace)
  adjuntos: Adjunto[] = [];
  cargandoAdjuntos = false;
  subiendoAdjunto = false;
  arrastrando = false;

  readonly estadoPropLabels: Record<string, string> = {
    BORRADOR: 'Borrador', ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', RECHAZADA: 'Rechazada',
  };

  // Cabecera (banner) — datos de la oportunidad actual
  etapaActual = '';
  propietarioNombreActual: string | null = null;

  readonly etapaLabels: Record<string, string> = {
    PROSPECCION: 'Prospección', VISITA: 'Visita', PROPUESTA: 'Propuesta',
    NEGOCIACION: 'Negociación', GANADA: 'Ganada', PERDIDA: 'Perdida',
  };

  etapaSeverity(e: string): string {
    switch (e) {
      case 'GANADA':      return 'success';
      case 'PERDIDA':     return 'danger';
      case 'NEGOCIACION': return 'warning';
      default:            return 'info';
    }
  }

  model: any = {
    nombre: '',
    valorEstimadoMensual: 0,
    probabilidad: null as number | null,
    fechaCierreEstimada: null as Date | null,
    propietarioUsuarioId: null as number | null,
  };

  // Entidad (autocomplete solo al crear; texto fijo al editar)
  entidadSeleccionada: any = null;
  entidadesSugeridas: any[] = [];
  entidadFija = '';

  vendedores: Vendedor[] = [];

  ngOnInit(): void {
    this.cargarVendedores();

    const card = this.oportunidad ?? undefined;
    const entidadCtx = this.entidadCtx ?? undefined;
    this.esEdicion = !!card;

    if (card) {
      this.oportunidadId = card.oportunidadId;
      this.model = {
        nombre: card.nombre ?? '',
        valorEstimadoMensual: card.valorEstimadoMensual ?? 0,
        probabilidad: card.probabilidad ?? null,
        fechaCierreEstimada: card.fechaCierreEstimada ? new Date(card.fechaCierreEstimada) : null,
        propietarioUsuarioId: card.propietarioUsuarioId ?? null,
      };
      this.entidadSeleccionada = { entidadId: card.entidadId, razonSocial: card.entidadRazonSocial };
      this.entidadFija = card.entidadRazonSocial;
      this.etapaActual = card.etapa;
      this.propietarioNombreActual = card.propietarioNombre ?? null;
      // Carga contactos de la entidad para el selector del panel de comunicaciones.
      this.crmService.getContactos(card.entidadId).subscribe({
        next: (data) => { this.contactos = data ?? []; },
        error: () => { this.contactos = []; },
      });
      this.cargarPropuestas();
      this.cargarAdjuntos();
    } else if (entidadCtx) {
      this.entidadSeleccionada = entidadCtx;
      this.entidadFija = entidadCtx.razonSocial;
    }
  }

  private cargarVendedores(): void {
    this.crmService.getVendedores().subscribe({
      next: (data) => { this.vendedores = data ?? []; },
      error: () => { this.vendedores = []; },
    });
  }

  buscarEntidades(event: { query: string }): void {
    this.crmService.getEntidades(event?.query, undefined, 1, 20).subscribe({
      next: (res) => {
        this.entidadesSugeridas = (res?.items ?? []).map((e) => ({
          entidadId: e.entidadId, razonSocial: e.razonSocial,
        }));
      },
      error: () => { this.entidadesSugeridas = []; },
    });
  }

  get entidadId(): number | null {
    return this.entidadSeleccionada && typeof this.entidadSeleccionada === 'object'
      ? this.entidadSeleccionada.entidadId
      : null;
  }

  guardar(): void {
    if (!this.entidadId) { this.warn('Seleccione la entidad.'); return; }
    if (!this.model.nombre?.trim()) { this.warn('El nombre de la oportunidad es obligatorio.'); return; }

    this.guardando = true;
    const payload = {
      entidadId: this.entidadId,
      nombre: this.model.nombre.trim(),
      valorEstimadoMensual: this.model.valorEstimadoMensual ?? 0,
      probabilidad: this.model.probabilidad,               // null => backend deriva de la etapa
      fechaCierreEstimada: this.model.fechaCierreEstimada ? this.toDateStr(this.model.fechaCierreEstimada) : null,
      propietarioUsuarioId: this.model.propietarioUsuarioId ?? null,
    };

    const obs = this.esEdicion && this.oportunidadId
      ? this.crmService.actualizarOportunidad(this.oportunidadId, payload)
      : this.crmService.crearOportunidad(payload);

    obs.subscribe({
      next: (res) => {
        this.guardando = false;
        if (res && res.success === false) { this.warn(res.message || 'No se pudo guardar.'); return; }
        this.huboCambios = true;
        this.cerrado.emit(true);
      },
      error: (err) => {
        this.guardando = false;
        const msg = err?.error?.message || 'Error al guardar la oportunidad.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onCambioComunicaciones(): void { this.huboCambios = true; }

  eliminar(): void {
    if (!this.oportunidadId) return;
    this.confirmationService.confirm({
      message: `¿Eliminar la oportunidad <b>${this.model.nombre || ''}</b>? Esta acción no se puede deshacer.`,
      header: 'Eliminar oportunidad',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar', rejectLabel: 'Cancelar', acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.crmService.eliminarOportunidad(this.oportunidadId!).subscribe({
          next: (res) => {
            if (res && res.success === false) { this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'No se pudo eliminar.' }); return; }
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Oportunidad eliminada.' });
            this.huboCambios = true;
            this.cerrado.emit(true);
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar la oportunidad.' }),
        });
      },
    });
  }

  // ─── Propuestas ───────────────────────────────────────────────────────────

  private cargarPropuestas(): void {
    if (!this.oportunidadId) return;
    this.cargandoPropuestas = true;
    this.crmService.getPropuestas(this.oportunidadId).subscribe({
      next: (data) => { this.propuestas = data ?? []; this.cargandoPropuestas = false; },
      error: () => { this.cargandoPropuestas = false; },
    });
  }

  estadoPropSeverity(estado: string): string {
    switch (estado) {
      case 'ACEPTADA':  return 'success';
      case 'ENVIADA':   return 'info';
      case 'RECHAZADA': return 'danger';
      default:          return 'secondary';   // BORRADOR
    }
  }

  nuevaPropuesta(): void {
    if (!this.oportunidadId) return;
    this.propRef = this.dialogService.open(PropuestaDialogComponent, {
      header: 'Nueva Propuesta', width: '1050px',
      contentStyle: { 'max-height': '82vh', overflow: 'auto' }, breakpoints: { '1200px': '96vw' },
      data: { oportunidadId: this.oportunidadId },
    });
    this.propRef.onClose.subscribe((g) => { if (g) { this.huboCambios = true; this.cargarPropuestas(); } });
  }

  editarPropuesta(p: PropuestaSummary): void {
    this.propRef = this.dialogService.open(PropuestaDialogComponent, {
      header: `Propuesta v${p.version}`, width: '1050px',
      contentStyle: { 'max-height': '82vh', overflow: 'auto' }, breakpoints: { '1200px': '96vw' },
      data: { oportunidadId: this.oportunidadId, propuestaId: p.propuestaId },
    });
    this.propRef.onClose.subscribe((g) => { if (g) { this.huboCambios = true; this.cargarPropuestas(); } });
  }

  nuevaVersion(p: PropuestaSummary): void {
    this.crmService.nuevaVersionPropuesta(p.propuestaId).subscribe({
      next: (res) => {
        if (res && res.success === false) { this.warn(res.message || 'No se pudo crear la versión.'); return; }
        this.huboCambios = true;
        this.messageService.add({ severity: 'success', summary: 'Nueva versión', detail: 'Se clonó como nueva versión (borrador).' });
        this.cargarPropuestas();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo crear la versión.' }),
    });
  }

  descargarPdf(p: PropuestaSummary): void {
    this.crmService.descargarPropuestaPdf(p.propuestaId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Propuesta_v${p.version}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF.' }),
    });
  }

  eliminarPropuesta(p: PropuestaSummary): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la propuesta <b>v${p.version}</b>?`,
      header: 'Eliminar propuesta',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.crmService.eliminarPropuesta(p.propuestaId).subscribe({
          next: () => { this.huboCambios = true; this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Propuesta eliminada.' }); this.cargarPropuestas(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar.' }),
        });
      },
    });
  }

  // ─── Adjuntos / archivos ──────────────────────────────────────────────────

  private cargarAdjuntos(): void {
    if (!this.oportunidadId) return;
    this.cargandoAdjuntos = true;
    this.crmService.getAdjuntos(this.oportunidadId).subscribe({
      next: (d) => { this.adjuntos = d ?? []; this.cargandoAdjuntos = false; },
      error: () => { this.cargandoAdjuntos = false; },
    });
  }

  onArchivosInput(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (input.files?.length) this.subirArchivos(Array.from(input.files));
    input.value = '';
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.arrastrando = false;
    if (ev.dataTransfer?.files?.length) this.subirArchivos(Array.from(ev.dataTransfer.files));
  }
  onDragOver(ev: DragEvent): void { ev.preventDefault(); this.arrastrando = true; }
  onDragLeave(ev: DragEvent): void { ev.preventDefault(); this.arrastrando = false; }

  private subirArchivos(files: File[]): void {
    if (!this.oportunidadId || !files.length) return;
    this.subiendoAdjunto = true;
    const siguiente = (i: number): void => {
      if (i >= files.length) {
        this.subiendoAdjunto = false;
        this.huboCambios = true;
        this.cargarAdjuntos();
        return;
      }
      this.crmService.subirAdjunto(this.oportunidadId!, files[i]).subscribe({
        next: (res) => {
          if (res && res.success === false) {
            this.messageService.add({ severity: 'warn', summary: files[i].name, detail: res.message });
          }
          siguiente(i + 1);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || `No se pudo subir ${files[i].name}` });
          siguiente(i + 1);
        },
      });
    };
    siguiente(0);
  }

  descargarAdjunto(a: Adjunto): void {
    this.crmService.descargarAdjunto(a.adjuntoId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = a.nombreArchivo;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el archivo.' }),
    });
  }

  eliminarAdjunto(a: Adjunto): void {
    this.confirmationService.confirm({
      message: `¿Eliminar <b>${a.nombreArchivo}</b>?`,
      header: 'Eliminar archivo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar', rejectLabel: 'Cancelar', acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.crmService.eliminarAdjunto(a.adjuntoId).subscribe({
          next: () => { this.huboCambios = true; this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Archivo eliminado.' }); this.cargarAdjuntos(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar.' }),
        });
      },
    });
  }

  iconoArchivo(ext?: string | null): string {
    const e = (ext || '').toLowerCase();
    if (e === '.pdf') return 'pi pi-file-pdf text-red-500';
    if (['.doc', '.docx'].includes(e)) return 'pi pi-file-word text-blue-600';
    if (['.xls', '.xlsx', '.csv'].includes(e)) return 'pi pi-file-excel text-green-600';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(e)) return 'pi pi-image text-purple-500';
    if (['.eml', '.msg'].includes(e)) return 'pi pi-envelope text-amber-500';
    if (['.zip', '.rar'].includes(e)) return 'pi pi-box text-gray-500';
    return 'pi pi-file text-gray-400';
  }

  formatoTamano(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  cerrar(): void { this.cerrado.emit(this.huboCambios); }

  private warn(detail: string): void {
    this.messageService.add({ severity: 'warn', summary: 'Validación', detail });
  }
}
