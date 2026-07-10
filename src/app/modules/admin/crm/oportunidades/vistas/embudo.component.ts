import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { OportunidadCard } from '../../crm.types';

interface EtapaEmbudo {
  key: string;
  label: string;
  count: number;
  valor: number;
  ponderado: number;
  barra: string;
  ancho: number;
}

/** Vista "Embudo / forecast": funnel de las etapas activas + valor ponderado proyectado. */
@Component({
  selector: 'app-crm-embudo',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  templateUrl: './embudo.component.html',
})
export class EmbudoComponent implements OnChanges {
  @Input() cards: OportunidadCard[] = [];

  private readonly def = [
    { key: 'PROSPECCION', label: 'Prospección', barra: 'bg-blue-500' },
    { key: 'VISITA',      label: 'Visita',       barra: 'bg-indigo-500' },
    { key: 'PROPUESTA',   label: 'Propuesta',    barra: 'bg-purple-500' },
    { key: 'NEGOCIACION', label: 'Negociación',  barra: 'bg-amber-500' },
  ];

  etapas: EtapaEmbudo[] = [];
  forecast = 0;
  totalActivo = 0;
  ganadasCount = 0;
  ganadasValor = 0;
  perdidasCount = 0;

  ngOnChanges(): void { this.recalcular(); }

  private ponderado(c: OportunidadCard): number {
    return (c.valorEstimadoMensual || 0) * (c.probabilidad || 0) / 100;
  }

  private recalcular(): void {
    const cards = this.cards ?? [];
    const filas = this.def.map(d => {
      const grupo = cards.filter(c => c.etapa === d.key);
      return {
        key: d.key, label: d.label, barra: d.barra,
        count: grupo.length,
        valor: grupo.reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0),
        ponderado: grupo.reduce((s, c) => s + this.ponderado(c), 0),
        ancho: 0,
      } as EtapaEmbudo;
    });
    const maxValor = Math.max(1, ...filas.map(f => f.valor));
    filas.forEach(f => f.ancho = f.valor > 0 ? Math.max(10, Math.round(f.valor / maxValor * 100)) : 4);
    this.etapas = filas;

    this.totalActivo = filas.reduce((s, f) => s + f.valor, 0);
    this.forecast = filas.reduce((s, f) => s + f.ponderado, 0);

    const ganadas = cards.filter(c => c.etapa === 'GANADA');
    this.ganadasCount = ganadas.length;
    this.ganadasValor = ganadas.reduce((s, c) => s + (c.valorEstimadoMensual || 0), 0);
    this.perdidasCount = cards.filter(c => c.etapa === 'PERDIDA').length;
  }
}
