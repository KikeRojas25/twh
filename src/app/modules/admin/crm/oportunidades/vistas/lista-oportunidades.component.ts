import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { EtapaOportunidad, OportunidadCard } from '../../crm.types';

interface Grupo {
  titulo: string;
  cards: OportunidadCard[];
  total: number;
  ponderado: number;
}

/** Vista "Lista": oportunidades agrupables por vendedor / entidad / etapa, con export a Excel. */
@Component({
  selector: 'app-crm-lista-oportunidades',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, TooltipModule],
  templateUrl: './lista-oportunidades.component.html',
})
export class ListaOportunidadesComponent implements OnChanges {
  @Input() cards: OportunidadCard[] = [];

  agrupacion: 'vendedor' | 'entidad' | 'etapa' = 'vendedor';
  readonly agrupacionOpciones = [
    { label: 'Vendedor', value: 'vendedor' },
    { label: 'Entidad', value: 'entidad' },
    { label: 'Etapa', value: 'etapa' },
  ];

  readonly etapaLabels: Record<string, string> = {
    PROSPECCION: 'Prospección', VISITA: 'Visita', PROPUESTA: 'Propuesta',
    NEGOCIACION: 'Negociación', GANADA: 'Ganada', PERDIDA: 'Perdida',
  };

  grupos: Grupo[] = [];

  ngOnChanges(): void { this.recalcular(); }

  cambiarAgrupacion(): void { this.recalcular(); }

  private clave(c: OportunidadCard): string {
    if (this.agrupacion === 'vendedor') return c.propietarioNombre ?? 'Sin vendedor';
    if (this.agrupacion === 'entidad') return c.entidadRazonSocial ?? 'Sin entidad';
    return this.etapaLabels[c.etapa] ?? c.etapa;
  }

  ponderado(c: OportunidadCard): number {
    return (c.valorEstimadoMensual || 0) * (c.probabilidad || 0) / 100;
  }

  diasSinCambios(c: OportunidadCard): number {
    if (!c.fechaUltimoCambio) return 0;
    const d = new Date(c.fechaUltimoCambio).getTime();
    return isNaN(d) ? 0 : Math.max(0, Math.floor((Date.now() - d) / 86400000));
  }

  etapaClass(e: EtapaOportunidad): string {
    switch (e) {
      case 'GANADA':      return 'bg-green-100 text-green-700';
      case 'PERDIDA':     return 'bg-red-100 text-red-600';
      case 'NEGOCIACION': return 'bg-amber-100 text-amber-700';
      case 'PROPUESTA':   return 'bg-purple-100 text-purple-700';
      case 'VISITA':      return 'bg-indigo-100 text-indigo-700';
      default:            return 'bg-blue-100 text-blue-700';
    }
  }

  private recalcular(): void {
    const mapa = new Map<string, OportunidadCard[]>();
    for (const c of this.cards ?? []) {
      const k = this.clave(c);
      if (!mapa.has(k)) mapa.set(k, []);
      mapa.get(k)!.push(c);
    }
    const grupos: Grupo[] = [];
    mapa.forEach((cards, titulo) => {
      cards.sort((a, b) => (b.valorEstimadoMensual || 0) - (a.valorEstimadoMensual || 0));
      grupos.push({
        titulo,
        cards,
        total: cards.reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0),
        ponderado: cards.reduce((s, c) => s + this.ponderado(c), 0),
      });
    });
    grupos.sort((a, b) => b.total - a.total);
    this.grupos = grupos;
  }

  get totalCards(): number { return (this.cards ?? []).length; }

  exportarExcel(): void {
    const rows = (this.cards ?? []).map(c => ({
      'OPORTUNIDAD': c.nombre ?? '',
      'ENTIDAD': c.entidadRazonSocial ?? '',
      'ETAPA': this.etapaLabels[c.etapa] ?? c.etapa,
      'VENDEDOR': c.propietarioNombre ?? '',
      'VALOR/MES': c.valorEstimadoMensual ?? 0,
      'PROBABILIDAD %': c.probabilidad ?? 0,
      'PONDERADO': Math.round(this.ponderado(c)),
      'PROX. ACTIVIDAD': c.proximaActividadTitulo ?? '',
      'VENCE': c.proximaActividadFecha ?? '',
      'CIERRE ESTIMADO': c.fechaCierreEstimada ?? '',
      'DIAS SIN CAMBIOS': this.diasSinCambios(c),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const d = new Date();
    const stamp = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
    saveAs(blob, `Oportunidades_${stamp}.xlsx`);
  }
}
