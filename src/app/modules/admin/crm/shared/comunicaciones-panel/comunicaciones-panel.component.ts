import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';
import { Comunicacion, Contacto } from '../../crm.types';

/**
 * Panel reutilizable de comunicaciones (timeline + registro rápido).
 * - En contexto de ENTIDAD (oportunidadId = null): muestra el timeline unificado
 *   de la cuenta y permite etiquetar cada registro a una oportunidad (opcional).
 * - En contexto de OPORTUNIDAD (oportunidadId != null): filtra por ese deal y
 *   los registros nuevos quedan atados a esa oportunidad.
 */
@Component({
  selector: 'app-crm-comunicaciones-panel',
  standalone: true,
  templateUrl: './comunicaciones-panel.component.html',
  imports: [
    CommonModule, FormsModule, ButtonModule, CalendarModule, DropdownModule,
    InputTextModule, InputTextareaModule, TimelineModule, ToastModule,
    ConfirmDialogModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  styles: [`
    /* Timeline alineado a la izquierda: se colapsa el hueco "opposite" y se
       afina el conector para un look más limpio y espaciado. */
    :host ::ng-deep .crm-timeline .p-timeline-event-opposite { flex: 0; padding: 0; }
    :host ::ng-deep .crm-timeline .p-timeline-event-content { padding: 0 0 0 0.75rem; }
    :host ::ng-deep .crm-timeline .p-timeline-event-connector { background-color: #e5e7eb; width: 2px; }
    :host ::ng-deep .crm-timeline .p-timeline-event-marker { border: 0; background: transparent; }
  `],
})
export class ComunicacionesPanelComponent implements OnChanges {
  private crmService = inject(CrmService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  @Input() entidadId!: number;
  @Input() oportunidadId: number | null = null;
  @Input() contactos: Contacto[] = [];
  @Input() oportunidades: { label: string; value: number }[] = [];
  @Output() cambio = new EventEmitter<void>();

  comunicaciones: Comunicacion[] = [];
  cargando = false;
  guardando = false;
  form: any = this.formVacio();

  readonly tipoOpciones = [
    { label: 'Llamada',  value: 'LLAMADA' },
    { label: 'Correo',   value: 'CORREO' },
    { label: 'Visita',   value: 'VISITA' },
    { label: 'Reunión',  value: 'REUNION' },
    { label: 'WhatsApp', value: 'WHATSAPP' },
    { label: 'Nota',     value: 'NOTA' },
  ];

  readonly direccionOpciones = [
    { label: 'Entrante', value: 'ENTRANTE' },
    { label: 'Saliente', value: 'SALIENTE' },
  ];

  get modoOportunidad(): boolean { return this.oportunidadId != null; }

  get contactoOpciones() {
    return this.contactos.map(c => ({
      label: `${c.nombres} ${c.apellidos ?? ''}`.trim(),
      value: c.contactoId,
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recargar SOLO cuando cambia la entidad/oportunidad objetivo. Si reaccionara
    // a cualquier @Input (p. ej. una lista de opciones recalculada por getter en
    // el padre, que llega con nueva referencia en cada ciclo) entraría en un bucle
    // de recargas HTTP que cuelga el navegador.
    if (changes['entidadId'] || changes['oportunidadId']) {
      this.form = this.formVacio();
      if (this.entidadId || this.oportunidadId) this.recargar();
    }
  }

  private formVacio() {
    return {
      tipo: 'LLAMADA', direccion: 'SALIENTE', contactoId: null as number | null,
      oportunidadId: null as number | null, asunto: '', detalle: '', fecha: new Date(),
    };
  }

  iconoTipo(tipo: string): string {
    switch (tipo) {
      case 'LLAMADA':  return 'pi pi-phone';
      case 'CORREO':   return 'pi pi-envelope';
      case 'VISITA':   return 'pi pi-map-marker';
      case 'REUNION':  return 'pi pi-users';
      case 'WHATSAPP': return 'pi pi-whatsapp';
      default:         return 'pi pi-file-edit';
    }
  }

  /** Clases del chip de tipo cuando está seleccionado (coloreado por su tipo). */
  chipSelectedClass(tipo: string): string {
    switch (tipo) {
      case 'LLAMADA':  return 'bg-blue-500 text-white border-blue-500';
      case 'CORREO':   return 'bg-indigo-500 text-white border-indigo-500';
      case 'VISITA':   return 'bg-purple-500 text-white border-purple-500';
      case 'REUNION':  return 'bg-amber-500 text-white border-amber-500';
      case 'WHATSAPP': return 'bg-green-500 text-white border-green-500';
      default:         return 'bg-gray-600 text-white border-gray-600';
    }
  }

  recargar(): void {
    this.cargando = true;
    this.crmService.getComunicaciones(this.entidadId, this.oportunidadId ?? undefined).subscribe({
      next: (data) => { this.comunicaciones = data ?? []; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }

  registrar(): void {
    if (!this.entidadId) { this.warn('Falta la entidad.'); return; }
    if (!this.form.asunto?.trim() && !this.form.detalle?.trim()) {
      this.warn('Indique un asunto o un detalle.');
      return;
    }

    this.guardando = true;
    const f: Date | null = this.form.fecha;
    const payload = {
      entidadId: this.entidadId,
      contactoId: this.form.contactoId ?? null,
      oportunidadId: this.oportunidadId ?? this.form.oportunidadId ?? null,
      tipo: this.form.tipo,
      direccion: this.form.tipo === 'NOTA' ? null : (this.form.direccion || null),
      asunto: this.form.asunto?.trim() || null,
      detalle: this.form.detalle?.trim() || null,
      fecha: f ? f.toISOString() : null,
    };

    this.crmService.crearComunicacion(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res && res.success === false) { this.warn(res.message || 'No se pudo registrar.'); return; }
        this.form = this.formVacio();
        this.messageService.add({ severity: 'success', summary: 'Registrada', detail: 'Comunicación registrada.' });
        this.recargar();
        this.cambio.emit();
      },
      error: (err) => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo registrar la comunicación.' });
      },
    });
  }

  eliminar(c: Comunicacion): void {
    this.confirmationService.confirm({
      message: '¿Eliminar esta comunicación del timeline?',
      header: 'Eliminar comunicación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.crmService.eliminarComunicacion(c.comunicacionId).subscribe({
          next: () => { this.recargar(); this.cambio.emit(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar.' }),
        });
      },
    });
  }

  private warn(detail: string): void {
    this.messageService.add({ severity: 'warn', summary: 'Validación', detail });
  }
}
