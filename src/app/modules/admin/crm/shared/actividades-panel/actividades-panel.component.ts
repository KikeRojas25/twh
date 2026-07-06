import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';
import { Actividad, Vendedor } from '../../crm.types';

/**
 * Panel reutilizable de actividades (tareas/seguimientos con recordatorio).
 * Contexto entidad (oportunidadId = null) o de un deal (oportunidadId != null).
 */
@Component({
  selector: 'app-crm-actividades-panel',
  standalone: true,
  templateUrl: './actividades-panel.component.html',
  imports: [
    CommonModule, FormsModule, ButtonModule, CalendarModule, ConfirmDialogModule,
    DropdownModule, InputTextModule, TagModule, ToastModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class ActividadesPanelComponent implements OnChanges {
  private crmService = inject(CrmService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  @Input() entidadId!: number;
  @Input() oportunidadId: number | null = null;
  @Input() oportunidades: { label: string; value: number }[] = [];
  @Output() cambio = new EventEmitter<void>();

  actividades: Actividad[] = [];
  cargando = false;
  guardando = false;
  form: any = this.formVacio();
  vendedores: Vendedor[] = [];

  readonly tipoOpciones = [
    { label: 'Llamar',           value: 'LLAMAR' },
    { label: 'Enviar propuesta', value: 'ENVIAR_PROPUESTA' },
    { label: 'Visitar',          value: 'VISITAR' },
    { label: 'Seguimiento',      value: 'SEGUIMIENTO' },
    { label: 'Otro',             value: 'OTRO' },
  ];

  get modoOportunidad(): boolean { return this.oportunidadId != null; }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.vendedores.length === 0) this.cargarVendedores();
    // Recargar SOLO cuando cambia la entidad/oportunidad objetivo (ver nota en
    // ComunicacionesPanelComponent): evita un bucle de recargas HTTP que cuelga
    // el navegador cuando un @Input llega con nueva referencia en cada ciclo.
    if (changes['entidadId'] || changes['oportunidadId']) {
      this.form = this.formVacio();
      if (this.entidadId || this.oportunidadId) this.recargar();
    }
  }

  private formVacio() {
    return {
      titulo: '', tipo: 'SEGUIMIENTO', fechaVencimiento: new Date(),
      responsableUsuarioId: null as number | null, oportunidadId: null as number | null,
    };
  }

  private cargarVendedores(): void {
    this.crmService.getVendedores().subscribe({
      next: (data) => { this.vendedores = data ?? []; },
      error: () => { this.vendedores = []; },
    });
  }

  iconoTipo(tipo: string): string {
    switch (tipo) {
      case 'LLAMAR':           return 'pi pi-phone';
      case 'ENVIAR_PROPUESTA': return 'pi pi-file';
      case 'VISITAR':          return 'pi pi-map-marker';
      case 'SEGUIMIENTO':      return 'pi pi-refresh';
      default:                 return 'pi pi-flag';
    }
  }

  estadoSeverity(estado: string): string {
    switch (estado) {
      case 'COMPLETADA': return 'success';
      case 'VENCIDA':    return 'danger';
      default:           return 'info';   // PENDIENTE
    }
  }

  recargar(): void {
    this.cargando = true;
    this.crmService.getActividades(this.entidadId, this.oportunidadId ?? undefined).subscribe({
      next: (data) => { this.actividades = data ?? []; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }

  registrar(): void {
    if (!this.form.titulo?.trim()) { this.warn('El título es requerido.'); return; }
    if (!this.form.fechaVencimiento) { this.warn('La fecha de vencimiento es requerida.'); return; }

    this.guardando = true;
    const f: Date = this.form.fechaVencimiento;
    const payload = {
      entidadId: this.entidadId,
      oportunidadId: this.oportunidadId ?? this.form.oportunidadId ?? null,
      titulo: this.form.titulo.trim(),
      tipo: this.form.tipo,
      fechaVencimiento: f ? f.toISOString() : null,
      responsableUsuarioId: this.form.responsableUsuarioId ?? null,
    };

    this.crmService.crearActividad(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res && res.success === false) { this.warn(res.message || 'No se pudo crear.'); return; }
        this.form = this.formVacio();
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Actividad registrada.' });
        this.recargar();
        this.cambio.emit();
      },
      error: (err) => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo crear la actividad.' });
      },
    });
  }

  toggleCompletar(a: Actividad): void {
    const obs = a.estado === 'COMPLETADA'
      ? this.crmService.reabrirActividad(a.actividadId)
      : this.crmService.completarActividad(a.actividadId);
    obs.subscribe({
      next: () => { this.recargar(); this.cambio.emit(); },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo actualizar.' }),
    });
  }

  eliminar(a: Actividad): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la actividad <b>${a.titulo}</b>?`,
      header: 'Eliminar actividad',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.crmService.eliminarActividad(a.actividadId).subscribe({
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
