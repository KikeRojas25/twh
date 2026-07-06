import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';

@Component({
  selector: 'app-crm-propuesta-dialog',
  standalone: true,
  templateUrl: './propuesta-dialog.component.html',
  imports: [
    CommonModule, FormsModule, ButtonModule, DropdownModule, InputNumberModule,
    InputTextModule, InputTextareaModule, ToastModule, TooltipModule,
  ],
  providers: [MessageService],
})
export class PropuestaDialogComponent implements OnInit {
  private crmService = inject(CrmService);
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private messageService = inject(MessageService);

  oportunidadId!: number;
  propuestaId: number | null = null;
  esEdicion = false;
  guardando = false;
  version: number | null = null;

  model: any = { estado: 'BORRADOR', notas: '' };
  lineas: any[] = [];

  readonly estadoOpciones = [
    { label: 'Borrador',  value: 'BORRADOR' },
    { label: 'Enviada',   value: 'ENVIADA' },
    { label: 'Aceptada',  value: 'ACEPTADA' },
    { label: 'Rechazada', value: 'RECHAZADA' },
  ];

  readonly tipoServicioOpciones = [
    { label: 'Almacenaje (posición)', value: 'ALMACENAJE_POSICION' },
    { label: 'Almacenaje (m³)',       value: 'ALMACENAJE_M3' },
    { label: 'Picking (línea)',       value: 'PICKING_LINEA' },
    { label: 'Recepción',             value: 'RECEPCION' },
    { label: 'Despacho',              value: 'DESPACHO' },
    { label: 'Crossdocking',          value: 'CROSSDOCKING' },
    { label: 'Valor agregado',        value: 'VALOR_AGREGADO' },
    { label: 'Transporte',            value: 'TRANSPORTE' },
    { label: 'Otro',                  value: 'OTRO' },
  ];

  readonly monedaOpciones = [
    { label: 'PEN', value: 'PEN' },
    { label: 'USD', value: 'USD' },
  ];

  private readonly unidadPorTipo: Record<string, string> = {
    ALMACENAJE_POSICION: 'posición',
    ALMACENAJE_M3: 'm³',
    PICKING_LINEA: 'línea',
    RECEPCION: 'recepción',
    DESPACHO: 'despacho',
    CROSSDOCKING: 'pallet',
    VALOR_AGREGADO: 'servicio',
    TRANSPORTE: 'viaje',
    OTRO: '',
  };

  ngOnInit(): void {
    this.oportunidadId = this.config.data?.oportunidadId;
    this.propuestaId = this.config.data?.propuestaId ?? null;
    this.esEdicion = !!this.propuestaId;
    if (this.esEdicion) this.cargar();
    else this.agregarLinea();
  }

  private cargar(): void {
    this.crmService.getPropuesta(this.propuestaId!).subscribe({
      next: (res) => {
        const d = res?.data;
        if (!res?.success || !d) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res?.message || 'Propuesta no encontrada.' });
          return;
        }
        this.version = d.version;
        this.model = { estado: d.estado, notas: d.notas ?? '' };
        this.lineas = (d.tarifas ?? []).map((t) => ({ ...t }));
        if (this.lineas.length === 0) this.agregarLinea();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la propuesta.' }),
    });
  }

  agregarLinea(): void {
    this.lineas.push({
      tipoServicio: 'ALMACENAJE_POSICION',
      descripcion: '',
      unidad: this.unidadPorTipo['ALMACENAJE_POSICION'],
      precioUnitario: 0,
      cantidadProyectada: null,
      moneda: 'PEN',
    });
  }

  quitarLinea(i: number): void { this.lineas.splice(i, 1); }

  onTipoChange(l: any): void {
    // Sugiere la unidad por tipo si está vacía.
    if (!l.unidad?.trim()) l.unidad = this.unidadPorTipo[l.tipoServicio] ?? '';
  }

  subtotal(l: any): number { return (l.precioUnitario || 0) * (l.cantidadProyectada || 0); }

  get totalPEN(): number {
    return this.lineas.filter(l => l.moneda === 'PEN').reduce((s, l) => s + this.subtotal(l), 0);
  }
  get totalUSD(): number {
    return this.lineas.filter(l => l.moneda === 'USD').reduce((s, l) => s + this.subtotal(l), 0);
  }

  guardar(): void {
    if (this.lineas.length === 0) { this.warn('Agregue al menos una línea de tarifario.'); return; }

    this.guardando = true;
    const payload = {
      oportunidadId: this.oportunidadId,
      estado: this.model.estado || 'BORRADOR',
      notas: this.model.notas?.trim() || null,
      tarifas: this.lineas.map((l) => ({
        tipoServicio: l.tipoServicio,
        descripcion: l.descripcion?.trim() || null,
        unidad: l.unidad?.trim() || null,
        precioUnitario: l.precioUnitario || 0,
        cantidadProyectada: l.cantidadProyectada ?? null,
        moneda: l.moneda || 'PEN',
      })),
    };

    const obs = this.esEdicion && this.propuestaId
      ? this.crmService.actualizarPropuesta(this.propuestaId, payload)
      : this.crmService.crearPropuesta(payload);

    obs.subscribe({
      next: (res) => {
        this.guardando = false;
        if (res && res.success === false) { this.warn(res.message || 'No se pudo guardar.'); return; }
        this.ref.close(true);
      },
      error: (err) => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al guardar la propuesta.' });
      },
    });
  }

  cerrar(): void { this.ref.close(); }

  private warn(detail: string): void {
    this.messageService.add({ severity: 'warn', summary: 'Validación', detail });
  }
}
