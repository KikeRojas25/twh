import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { SidebarModule } from 'primeng/sidebar';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';
import { Contacto, OportunidadCard, PropietarioWmsRef, Vendedor } from '../../crm.types';
import { ActividadesPanelComponent } from '../../shared/actividades-panel/actividades-panel.component';
import { ComunicacionesPanelComponent } from '../../shared/comunicaciones-panel/comunicaciones-panel.component';
import { OportunidadDialogComponent } from '../../oportunidades/oportunidad-dialog/oportunidad-dialog.component';

@Component({
  selector: 'app-crm-entidad-dialog',
  standalone: true,
  templateUrl: './entidad-dialog.component.html',
  imports: [
    CommonModule, FormsModule, AutoCompleteModule, ButtonModule, InputTextModule,
    DropdownModule, InputSwitchModule, TableModule, TabViewModule, TagModule,
    ToastModule, ConfirmDialogModule, TooltipModule, DynamicDialogModule, SidebarModule,
    ComunicacionesPanelComponent, ActividadesPanelComponent, OportunidadDialogComponent,
  ],
  providers: [MessageService, ConfirmationService, DialogService],
})
export class EntidadDialogComponent implements OnInit {
  private crmService = inject(CrmService);
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private dialogService = inject(DialogService);
  private oportRef: DynamicDialogRef | undefined;

  entidadId: number | null = null;
  esEdicion = false;
  guardando = false;
  cargandoContactos = false;
  huboCambios = false;

  model: any = this.modelVacio();

  readonly estadoOpciones = [
    { label: 'Prospecto', value: 'PROSPECTO' },
    { label: 'Cliente', value: 'CLIENTE' },
    { label: 'Inactivo', value: 'INACTIVO' },
    { label: 'Descartado', value: 'DESCARTADO' },
  ];

  readonly rolOpciones = [
    { label: 'Comercial', value: 'COMERCIAL' },
    { label: 'Operativo', value: 'OPERATIVO' },
    { label: 'Facturación', value: 'FACTURACION' },
    { label: 'Decisor', value: 'DECISOR' },
    { label: 'Otro', value: 'OTRO' },
  ];

  // Selector de vendedor (usuarios) y enlace a Propietario WMS (bisagra)
  vendedores: Vendedor[] = [];
  propietariosSugeridos: PropietarioWmsRef[] = [];
  propietarioSeleccionado: PropietarioWmsRef | string | null = null;

  // ─── Contactos ─────────────────────────────────────────────────────────
  contactos: Contacto[] = [];
  mostrarFormContacto = false;
  esEdicionContacto = false;
  guardandoContacto = false;
  formContacto: any = this.contactoVacio();

  // ─── Oportunidades ───────────────────────────────────────────────────────
  oportunidades: OportunidadCard[] = [];
  cargandoOportunidades = false;

  readonly etapaLabels: Record<string, string> = {
    PROSPECCION: 'Prospección', VISITA: 'Visita', PROPUESTA: 'Propuesta',
    NEGOCIACION: 'Negociación', GANADA: 'Ganada', PERDIDA: 'Perdida',
  };

  // Cache de opciones para dropdowns de los paneles hijos. NO usar un getter:
  // devolvería un array nuevo en cada ciclo de detección de cambios, disparando
  // el ngOnChanges de los paneles (que recargan por HTTP) en bucle y colgando el
  // navegador. Se recalcula solo cuando cambian realmente las oportunidades.
  oportunidadOpciones: { label: string; value: number }[] = [];

  private recalcularOportunidadOpciones(): void {
    this.oportunidadOpciones = this.oportunidades.map(o => ({ label: o.nombre, value: o.oportunidadId }));
  }

  ngOnInit(): void {
    this.entidadId = this.config.data?.entidadId ?? null;
    this.esEdicion = !!this.entidadId;
    this.cargarVendedores();
    if (this.esEdicion) this.cargarDetalle();
  }

  private modelVacio() {
    return {
      razonSocial: '', ruc: '', nombreComercial: '', giro: '',
      estado: 'PROSPECTO', origen: '', propietarioUsuarioId: null as number | null,
    };
  }

  private cargarVendedores(): void {
    this.crmService.getVendedores().subscribe({
      next: (data) => { this.vendedores = data ?? []; },
      error: () => { this.vendedores = []; },
    });
  }

  /** El enlace a Propietario WMS solo aplica cuando la entidad ya es CLIENTE. */
  onEstadoChange(): void {
    if (this.model.estado !== 'CLIENTE') this.propietarioSeleccionado = null;
  }

  buscarPropietarios(event: { query: string }): void {
    this.crmService.getPropietariosWms(event?.query).subscribe({
      next: (data) => {
        this.propietariosSugeridos = (data ?? []).map((p: any) => ({ id: p.id, nombre: p.nombre, documento: p.documento }));
      },
      error: () => { this.propietariosSugeridos = []; },
    });
  }

  private get propietarioWmsId(): number | null {
    return this.propietarioSeleccionado && typeof this.propietarioSeleccionado === 'object'
      ? this.propietarioSeleccionado.id
      : null;
  }

  private contactoVacio() {
    return {
      contactoId: null as number | null,
      nombres: '', apellidos: '', cargo: '', rol: 'OTRO',
      email: '', telefono: '', celular: '', esPrincipal: false,
    };
  }

  // ─── Entidad ───────────────────────────────────────────────────────────

  private cargarDetalle(): void {
    if (!this.entidadId) return;
    this.crmService.getEntidad(this.entidadId).subscribe({
      next: (res) => {
        const d = res?.data;
        if (!res?.success || !d) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res?.message || 'Entidad no encontrada.' });
          return;
        }
        this.model = {
          razonSocial: d.razonSocial ?? '',
          ruc: d.ruc ?? '',
          nombreComercial: d.nombreComercial ?? '',
          giro: d.giro ?? '',
          estado: d.estado ?? 'PROSPECTO',
          origen: d.origen ?? '',
          propietarioUsuarioId: d.propietarioUsuarioId ?? null,
        };
        this.propietarioSeleccionado = d.propietarioWmsId
          ? { id: d.propietarioWmsId, nombre: d.propietarioWmsNombre ?? `Propietario #${d.propietarioWmsId}` }
          : null;
        this.contactos = d.contactos ?? [];
        this.cargarOportunidades();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la entidad.' });
      },
    });
  }

  consultandoRuc = false;

  /** Consulta SUNAT y autocompleta razón social / nombre comercial. */
  consultarRuc(): void {
    const ruc = (this.model.ruc || '').trim();
    if (!/^\d{11}$/.test(ruc)) { this.warn('Ingrese un RUC válido de 11 dígitos.'); return; }
    this.consultandoRuc = true;
    this.crmService.consultarRuc(ruc).subscribe({
      next: (info) => {
        this.consultandoRuc = false;
        if (!info?.encontrado) {
          this.warn(info?.mensaje || 'No se encontró información para ese RUC.');
          return;
        }
        if (info.razonSocial) {
          this.model.razonSocial = info.razonSocial;
          if (!this.model.nombreComercial?.trim()) this.model.nombreComercial = info.razonSocial;
        }
        const detalle = [info.estado, info.condicion].filter(Boolean).join(' · ');
        this.messageService.add({
          severity: 'success', summary: 'SUNAT',
          detail: `Datos cargados: ${info.razonSocial}${detalle ? ` (${detalle})` : ''}.`,
        });
      },
      error: (err) => {
        this.consultandoRuc = false;
        this.messageService.add({ severity: 'error', summary: 'SUNAT', detail: err?.error?.mensaje || 'No se pudo consultar el RUC.' });
      },
    });
  }

  guardarEntidad(): void {
    if (!this.model.razonSocial?.trim()) { this.warn('La razón social es obligatoria.'); return; }
    if (!this.model.ruc?.trim()) { this.warn('El RUC / documento es obligatorio.'); return; }

    this.guardando = true;
    const payload = {
      razonSocial: this.model.razonSocial.trim(),
      ruc: this.model.ruc.trim(),
      nombreComercial: this.model.nombreComercial?.trim() || null,
      giro: this.model.giro?.trim() || null,
      estado: this.model.estado || 'PROSPECTO',
      origen: this.model.origen?.trim() || null,
      propietarioUsuarioId: this.model.propietarioUsuarioId ?? null,
      // El enlace a Propietario WMS solo se envía cuando la entidad es CLIENTE.
      propietarioWmsId: this.model.estado === 'CLIENTE' ? this.propietarioWmsId : null,
    };

    const obs = this.esEdicion && this.entidadId
      ? this.crmService.actualizarEntidad(this.entidadId, payload)
      : this.crmService.crearEntidad(payload);

    obs.subscribe({
      next: (res) => {
        this.guardando = false;
        if (res && res.success === false) { this.warn(res.message || 'No se pudo guardar la entidad.'); return; }
        this.huboCambios = true;
        this.messageService.add({
          severity: 'success', summary: 'Éxito',
          detail: `Entidad ${this.esEdicion ? 'actualizada' : 'creada'} correctamente.`,
        });
        if (!this.esEdicion) {
          this.entidadId = res?.data?.entidadId ?? null;
          this.esEdicion = !!this.entidadId;
        }
      },
      error: (err) => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al guardar la entidad.' });
      },
    });
  }

  // ─── Contactos ─────────────────────────────────────────────────────────

  private recargarContactos(): void {
    if (!this.entidadId) return;
    this.cargandoContactos = true;
    this.crmService.getContactos(this.entidadId).subscribe({
      next: (data) => { this.contactos = data ?? []; this.cargandoContactos = false; },
      error: () => { this.cargandoContactos = false; },
    });
  }

  nuevoContacto(): void {
    this.esEdicionContacto = false;
    this.formContacto = this.contactoVacio();
    this.mostrarFormContacto = true;
  }

  editarContacto(c: Contacto): void {
    this.esEdicionContacto = true;
    this.formContacto = {
      contactoId: c.contactoId,
      nombres: c.nombres ?? '',
      apellidos: c.apellidos ?? '',
      cargo: c.cargo ?? '',
      rol: c.rol ?? 'OTRO',
      email: c.email ?? '',
      telefono: c.telefono ?? '',
      celular: c.celular ?? '',
      esPrincipal: !!c.esPrincipal,
    };
    this.mostrarFormContacto = true;
  }

  cerrarFormContacto(): void { this.mostrarFormContacto = false; }

  guardarContacto(): void {
    if (!this.entidadId) { this.warn('Guarde primero los datos de la entidad.'); return; }
    if (!this.formContacto.nombres?.trim()) { this.warn('Los nombres del contacto son obligatorios.'); return; }

    this.guardandoContacto = true;
    const payload = {
      nombres: this.formContacto.nombres.trim(),
      apellidos: this.formContacto.apellidos?.trim() || null,
      cargo: this.formContacto.cargo?.trim() || null,
      rol: this.formContacto.rol || 'OTRO',
      email: this.formContacto.email?.trim() || null,
      telefono: this.formContacto.telefono?.trim() || null,
      celular: this.formContacto.celular?.trim() || null,
      esPrincipal: !!this.formContacto.esPrincipal,
    };

    const obs = this.esEdicionContacto && this.formContacto.contactoId
      ? this.crmService.actualizarContacto(this.formContacto.contactoId, payload)
      : this.crmService.crearContacto(this.entidadId, payload);

    obs.subscribe({
      next: (res) => {
        this.guardandoContacto = false;
        if (res && res.success === false) { this.warn(res.message || 'No se pudo guardar el contacto.'); return; }
        this.huboCambios = true;
        this.mostrarFormContacto = false;
        this.messageService.add({ severity: 'success', summary: this.esEdicionContacto ? 'Actualizado' : 'Creado', detail: 'Contacto guardado correctamente.' });
        this.recargarContactos();
      },
      error: (err) => {
        this.guardandoContacto = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar el contacto.' });
      },
    });
  }

  eliminarContacto(c: Contacto): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el contacto <b>${c.nombres} ${c.apellidos ?? ''}</b>?`,
      header: 'Eliminar contacto',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.crmService.eliminarContacto(c.contactoId).subscribe({
          next: () => { this.huboCambios = true; this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Contacto eliminado.' }); this.recargarContactos(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar el contacto.' }),
        });
      },
    });
  }

  // ─── Oportunidades ─────────────────────────────────────────────────────

  private cargarOportunidades(): void {
    if (!this.entidadId) return;
    this.cargandoOportunidades = true;
    this.crmService.getOportunidades(this.entidadId).subscribe({
      next: (data) => {
        this.oportunidades = data ?? [];
        this.recalcularOportunidadOpciones();
        this.cargandoOportunidades = false;
      },
      error: () => { this.cargandoOportunidades = false; },
    });
  }

  etapaSeverity(etapa: string): string {
    switch (etapa) {
      case 'GANADA':      return 'success';
      case 'PERDIDA':     return 'danger';
      case 'NEGOCIACION': return 'warning';
      default:            return 'info';
    }
  }

  // Panel lateral (sidebar) de la oportunidad
  oportSidebarVisible = false;
  oportSel: OportunidadCard | null = null;
  oportEntidadCtx: { entidadId: number; razonSocial: string } | null = null;

  nuevaOportunidad(): void {
    if (!this.entidadId) { this.warn('Guarde primero los datos de la entidad.'); return; }
    this.oportSel = null;
    this.oportEntidadCtx = { entidadId: this.entidadId, razonSocial: this.model.razonSocial };
    this.oportSidebarVisible = true;
  }

  editarOportunidad(o: OportunidadCard): void {
    this.oportSel = o;
    this.oportEntidadCtx = null;
    this.oportSidebarVisible = true;
  }

  onOportSidebarCerrado(g: boolean): void {
    this.oportSidebarVisible = false;
    if (g) { this.huboCambios = true; this.cargarOportunidades(); }
  }

  // ─── Común ──────────────────────────────────────────────────────────────

  onCambioComunicaciones(): void {
    this.huboCambios = true;
    // Refresca contadores del listado de oportunidades (num. de comunicaciones).
    this.cargarOportunidades();
  }

  cerrar(): void { this.ref.close(this.huboCambios); }

  private warn(detail: string): void {
    this.messageService.add({ severity: 'warn', summary: 'Validación', detail });
  }
}
