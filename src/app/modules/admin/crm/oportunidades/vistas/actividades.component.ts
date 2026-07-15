import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';
import { ActividadAgenda, Vendedor } from '../../crm.types';

interface GrupoVendedor {
  vendedorId: number | null;
  nombre: string;
  vencidas: ActividadAgenda[];
  hoy: ActividadAgenda[];
  proximas: ActividadAgenda[];
  completadas: ActividadAgenda[];
}

/**
 * Vista "Actividades por vendedor": la agenda del equipo agrupada por responsable,
 * separando Vencidas / Vencen hoy / Próximas / Completadas. Los datos vienen del
 * endpoint de agenda (el filtro por vendedor se aplica en el backend).
 */
@Component({
  selector: 'app-crm-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, TooltipModule],
  templateUrl: './actividades.component.html',
})
export class ActividadesComponent implements OnInit, OnChanges {
  private crmService = inject(CrmService);

  @Input() vendedores: Vendedor[] = [];
  /** Se emite al completar una actividad, para que el board refresque sus contadores. */
  @Output() cambio = new EventEmitter<void>();

  cargando = false;
  filtroVendedorId: number | null = null;
  grupos: GrupoVendedor[] = [];

  // KPIs de equipo
  totalVencidas = 0;
  totalHoy = 0;
  totalProximas = 0;
  totalCompletadas = 0;

  private expandidos = new Set<number | string>();

  ngOnInit(): void { this.cargar(); }
  ngOnChanges(): void { /* los vendedores llegan del board; no requiere recarga */ }

  private clave(g: GrupoVendedor): number | string { return g.vendedorId ?? 'sin'; }
  estaExpandido(g: GrupoVendedor): boolean { return this.expandidos.has(this.clave(g)); }
  toggleExpandir(g: GrupoVendedor): void {
    const k = this.clave(g);
    this.expandidos.has(k) ? this.expandidos.delete(k) : this.expandidos.add(k);
  }

  cargar(): void {
    this.cargando = true;
    this.crmService.getAgendaActividades(this.filtroVendedorId ?? undefined).subscribe({
      next: (data) => { this.agrupar(data ?? []); this.cargando = false; },
      error: () => { this.grupos = []; this.cargando = false; },
    });
  }

  onCambiarVendedor(): void { this.cargar(); }

  private esHoy(fecha: string): boolean {
    const d = new Date(fecha);
    const hoy = new Date();
    return d.getFullYear() === hoy.getFullYear()
        && d.getMonth() === hoy.getMonth()
        && d.getDate() === hoy.getDate();
  }

  private agrupar(items: ActividadAgenda[]): void {
    const mapa = new Map<number | null, GrupoVendedor>();

    for (const a of items) {
      const k = a.responsableUsuarioId ?? null;
      if (!mapa.has(k)) {
        mapa.set(k, {
          vendedorId: k,
          nombre: a.responsableNombre ?? 'Sin asignar',
          vencidas: [], hoy: [], proximas: [], completadas: [],
        });
      }
      const g = mapa.get(k)!;

      if (a.estado === 'COMPLETADA') g.completadas.push(a);
      else if (a.estado === 'VENCIDA') g.vencidas.push(a);
      else if (this.esHoy(a.fechaVencimiento)) g.hoy.push(a);
      else g.proximas.push(a);
    }

    const grupos = [...mapa.values()];
    // Los que tienen vencidas primero (y se auto-expanden: es lo que exige atención).
    grupos.sort((a, b) => b.vencidas.length - a.vencidas.length || a.nombre.localeCompare(b.nombre));
    for (const g of grupos) {
      if (g.vencidas.length > 0) this.expandidos.add(this.clave(g));
    }

    this.grupos = grupos;
    this.totalVencidas = grupos.reduce((s, g) => s + g.vencidas.length, 0);
    this.totalHoy = grupos.reduce((s, g) => s + g.hoy.length, 0);
    this.totalProximas = grupos.reduce((s, g) => s + g.proximas.length, 0);
    this.totalCompletadas = grupos.reduce((s, g) => s + g.completadas.length, 0);
  }

  pendientes(g: GrupoVendedor): number {
    return g.vencidas.length + g.hoy.length + g.proximas.length;
  }

  /** Completa la actividad sin salir de la vista. */
  completar(a: ActividadAgenda, ev: Event): void {
    ev.stopPropagation();
    this.crmService.completarActividad(a.actividadId).subscribe({
      next: () => { this.cargar(); this.cambio.emit(); },
      error: () => {},
    });
  }

  diasRetraso(a: ActividadAgenda): number {
    const d = new Date(a.fechaVencimiento).getTime();
    if (isNaN(d)) return 0;
    return Math.max(0, Math.floor((Date.now() - d) / 86400000));
  }

  iniciales(nombre?: string | null): string {
    if (!nombre) return '?';
    const p = nombre.trim().split(/\s+/);
    return (((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()) || '?';
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
}
