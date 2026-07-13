import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MetaVendedor, OportunidadCard, Vendedor } from '../../crm.types';

interface EtapaResumen { etapa: string; label: string; count: number; valor: number; }
interface DealResumen { nombre: string; etapa: string; valor: number; probabilidad: number; }

interface FilaVendedor {
  vendedorId: number | null;
  nombre: string;
  meta: number;
  cerrado: number;
  pipeline: number;
  ganadas: number;
  perdidas: number;
  enCurso: number;
  actividades: number;
  tasaCierre: number;
  estancadaDias: number;
  avance: number;
  // Detalle (acordeón)
  ponderado: number;
  ticketProm: number;
  porEtapa: EtapaResumen[];
  topDeals: DealResumen[];
}

/**
 * Vista "Resumen por vendedor": KPIs de equipo + una tarjeta por vendedor con
 * meta (editable), avance, cerrado del mes y métricas (ganadas, en curso, % cierre,
 * estancada). Se calcula de las tarjetas del board; el "cerrado" filtra por el mes.
 */
@Component({
  selector: 'app-crm-resumen-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputNumberModule, TooltipModule],
  templateUrl: './resumen-vendedor.component.html',
})
export class ResumenVendedorComponent implements OnChanges {
  @Input() cards: OportunidadCard[] = [];
  @Input() vendedores: Vendedor[] = [];
  @Input() metas: MetaVendedor[] = [];
  @Input() anio = 0;
  @Input() mes = 0;
  @Output() guardarMeta = new EventEmitter<{ vendedorUsuarioId: number; monto: number }>();

  filas: FilaVendedor[] = [];
  metaEquipo = 0;
  cerradoEquipo = 0;
  pipelineEquipo = 0;
  actividadesEquipo = 0;

  // Dialog para editar la meta
  editando = false;
  metaEditVendedor: FilaVendedor | null = null;
  metaEditMonto: number | null = null;

  // Acordeón: qué vendedores están expandidos (persiste al recalcular)
  private expandidos = new Set<number | string>();

  ngOnChanges(): void { this.recalcular(); }

  private clave(f: FilaVendedor): number | string { return f.vendedorId ?? 'sin'; }
  estaExpandido(f: FilaVendedor): boolean { return this.expandidos.has(this.clave(f)); }
  toggleExpandir(f: FilaVendedor): void {
    const k = this.clave(f);
    this.expandidos.has(k) ? this.expandidos.delete(k) : this.expandidos.add(k);
  }

  private readonly etapasActivas = [
    { etapa: 'PROSPECCION', label: 'Prospección' },
    { etapa: 'VISITA',      label: 'Visita' },
    { etapa: 'PROPUESTA',   label: 'Propuesta' },
    { etapa: 'NEGOCIACION', label: 'Negociación' },
  ];

  /** Pill con tinte por etapa (legible en claro/oscuro). */
  etapaPillClass(e: string): string {
    switch (e) {
      case 'PROSPECCION': return 'bg-blue-500/15 text-blue-600';
      case 'VISITA':      return 'bg-indigo-500/15 text-indigo-600';
      case 'PROPUESTA':   return 'bg-purple-500/15 text-purple-600';
      case 'NEGOCIACION': return 'bg-amber-500/15 text-amber-700';
      default:            return 'bg-gray-500/15 text-gray-500';
    }
  }
  /** Color sólido para el segmento de la barra de distribución. */
  etapaBarClass(e: string): string {
    switch (e) {
      case 'PROSPECCION': return 'bg-blue-500';
      case 'VISITA':      return 'bg-indigo-500';
      case 'PROPUESTA':   return 'bg-purple-500';
      case 'NEGOCIACION': return 'bg-amber-500';
      default:            return 'bg-gray-400';
    }
  }
  etapaLabel(e: string): string {
    return this.etapasActivas.find(x => x.etapa === e)?.label ?? e;
  }

  private enMes(fecha?: string | null): boolean {
    if (!fecha) return false;
    const d = new Date(fecha);
    return !isNaN(d.getTime()) && d.getFullYear() === this.anio && (d.getMonth() + 1) === this.mes;
  }
  private esActiva(e: string): boolean { return e !== 'GANADA' && e !== 'PERDIDA'; }
  private diasSinCambios(c: OportunidadCard): number {
    if (!c.fechaUltimoCambio) return 0;
    const d = new Date(c.fechaUltimoCambio).getTime();
    return isNaN(d) ? 0 : Math.max(0, Math.floor((Date.now() - d) / 86400000));
  }

  private recalcular(): void {
    const grupos = new Map<number | null, OportunidadCard[]>();
    for (const c of this.cards ?? []) {
      const k = c.propietarioUsuarioId ?? null;
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k)!.push(c);
    }

    const filas: FilaVendedor[] = [];
    grupos.forEach((cards, vendedorId) => {
      const activas = cards.filter(c => this.esActiva(c.etapa));
      const ganadasMes = cards.filter(c => c.etapa === 'GANADA' && this.enMes(c.fechaCierreReal));
      const perdidasMes = cards.filter(c => c.etapa === 'PERDIDA' && this.enMes(c.fechaCierreReal));
      const cerrado = ganadasMes.reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0);
      const pipeline = activas.reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0);
      const actividades = cards.reduce((s, c) => s + (c.numComunicaciones || 0), 0);
      const estancadaDias = activas.reduce((m, c) => Math.max(m, this.diasSinCambios(c)), 0);
      const meta = this.metas.find(m => m.vendedorUsuarioId === vendedorId)?.monto ?? 0;
      const totCerradas = ganadasMes.length + perdidasMes.length;
      const ponderado = activas.reduce((s, c) => s + (c.valorEstimadoMensual || 0) * (c.probabilidad || 0) / 100, 0);
      const porEtapa: EtapaResumen[] = this.etapasActivas.map(x => {
        const cs = activas.filter(c => c.etapa === x.etapa);
        return { etapa: x.etapa, label: x.label, count: cs.length, valor: cs.reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0) };
      }).filter(x => x.count > 0);
      const topDeals: DealResumen[] = [...activas]
        .sort((a, b) => (b.valorEstimadoMensual || 0) - (a.valorEstimadoMensual || 0))
        .slice(0, 5)
        .map(c => ({ nombre: c.nombre, etapa: c.etapa, valor: c.valorEstimadoMensual || 0, probabilidad: c.probabilidad || 0 }));
      filas.push({
        vendedorId,
        nombre: cards[0]?.propietarioNombre ?? (vendedorId ? `#${vendedorId}` : 'Sin asignar'),
        meta,
        cerrado,
        pipeline,
        ganadas: ganadasMes.length,
        perdidas: perdidasMes.length,
        enCurso: activas.length,
        actividades,
        tasaCierre: totCerradas ? Math.round(ganadasMes.length / totCerradas * 100) : 0,
        estancadaDias,
        avance: meta > 0 ? Math.round(cerrado / meta * 100) : 0,
        ponderado,
        ticketProm: activas.length ? Math.round(pipeline / activas.length) : 0,
        porEtapa,
        topDeals,
      });
    });

    filas.sort((a, b) => b.cerrado - a.cerrado || b.pipeline - a.pipeline);
    this.filas = filas;
    this.metaEquipo = filas.reduce((s, f) => s + f.meta, 0);
    this.cerradoEquipo = filas.reduce((s, f) => s + f.cerrado, 0);
    this.pipelineEquipo = filas.reduce((s, f) => s + f.pipeline, 0);
    this.actividadesEquipo = filas.reduce((s, f) => s + f.actividades, 0);
  }

  iniciales(nombre?: string | null): string {
    if (!nombre) return '?';
    const p = nombre.trim().split(/\s+/);
    return (((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()) || '?';
  }

  private readonly nombresMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  nombreMes(m: number): string { return this.nombresMes[m - 1] ?? ''; }
  avanceEquipo(): number { return this.metaEquipo > 0 ? Math.round(this.cerradoEquipo / this.metaEquipo * 100) : 0; }
  barraClass(avance: number): string {
    if (avance >= 100) return 'bg-green-500';
    if (avance >= 60) return 'bg-green-400';
    if (avance >= 30) return 'bg-amber-400';
    return 'bg-amber-500';
  }

  abrirEditarMeta(f: FilaVendedor): void {
    if (f.vendedorId == null) return;  // "Sin asignar" no lleva meta
    this.metaEditVendedor = f;
    this.metaEditMonto = f.meta || null;
    this.editando = true;
  }
  guardarMetaEdit(): void {
    if (!this.metaEditVendedor?.vendedorId) { this.editando = false; return; }
    this.guardarMeta.emit({ vendedorUsuarioId: this.metaEditVendedor.vendedorId, monto: this.metaEditMonto ?? 0 });
    this.editando = false;
  }
}
