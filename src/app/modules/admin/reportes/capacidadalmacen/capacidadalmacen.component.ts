import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexPlotOptions,
  ApexStroke,
  ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { ReportesService } from '../reportes.service';
import { OcupabilidadItem } from '../reportes.types';
import { UbicacionService } from '../../_services/ubicacion.service';

export type GaugeOptions = {
  series: number[];
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  fill: ApexFill;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
};

interface AlmacenResumen {
  almacenId: number;
  almacen: string;
  total: number;
  ocupadas: number;
  libres: number;
  pct: number;
}

@Component({
  selector: 'app-capacidadalmacen',
  standalone: true,
  templateUrl: './capacidadalmacen.component.html',
  imports: [CommonModule, NgApexchartsModule],
})
export class CapacidadalmacenComponent implements OnInit {
  @ViewChild('barChart') barChart!: ChartComponent;

  datos: OcupabilidadItem[] = [];
  almacenes: AlmacenResumen[] = [];
  cargando = true;

  // KPIs globales
  totalUbicaciones = 0;
  totalOcupadas = 0;
  totalLibres = 0;
  pctGlobal = 0;

  // Gauge por almacén
  gaugeOptions: GaugeOptions[] = [];

  // Detalle por propietario
  propietarios: any[] = [];
  cargandoPropietarios = false;

  // Detalle por tipo de ubicación
  tiposUbicacion: any[] = [];
  cargandoTipos = false;

  // Detalle por área
  almacenSeleccionado: AlmacenResumen | null = null;
  pasillos: any[] = [];
  cargandoPasillos = false;

  constructor(
    private reportesService: ReportesService,
    private ubicacionService: UbicacionService
  ) {}

  ngOnInit(): void {
    this.reportesService.getOcupabilidadDashboard().subscribe({
      next: (data) => {
        this.datos = data;
        this._procesarDatos();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  seleccionarAlmacen(a: AlmacenResumen): void {
    if (this.almacenSeleccionado?.almacenId === a.almacenId) {
      this.almacenSeleccionado = null;
      this.pasillos = [];
      this.propietarios = [];
      this.tiposUbicacion = [];
      return;
    }

    this.almacenSeleccionado = a;
    this.pasillos = [];
    this.propietarios = [];
    this.tiposUbicacion = [];
    this.cargandoPasillos = true;
    this.cargandoPropietarios = true;
    this.cargandoTipos = true;

    this.ubicacionService.getOcupabilidadPorPropietario(a.almacenId).subscribe({
      next: (data) => { this.propietarios = data; this.cargandoPropietarios = false; },
      error: () => { this.cargandoPropietarios = false; }
    });

    this.ubicacionService.getOcupabilidadPorTipoUbicacion(a.almacenId).subscribe({
      next: (data) => { this.tiposUbicacion = data; this.cargandoTipos = false; },
      error: () => { this.cargandoTipos = false; }
    });

    this.ubicacionService.getOcupabilidadPorArea(a.almacenId).subscribe({
      next: (data) => { this.pasillos = data; this.cargandoPasillos = false; },
      error: () => { this.cargandoPasillos = false; }
    });
  }

  colorBarra(pct: number): string {
    if (pct >= 80) return 'bg-red-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  colorTexto(pct: number): string {
    if (pct >= 80) return 'text-red-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-emerald-600';
  }

  private _procesarDatos(): void {
    this.totalUbicaciones = this.datos.reduce((s, d) => s + d.totalUbicaciones, 0);
    this.totalOcupadas    = this.datos.reduce((s, d) => s + d.ubicacionesOcupadas, 0);
    this.totalLibres      = this.datos.reduce((s, d) => s + d.ubicacionesLibres, 0);
    this.pctGlobal        = this.totalUbicaciones > 0
      ? Math.round((this.totalOcupadas / this.totalUbicaciones) * 100)
      : 0;

    const mapaAlmacen = new Map<number, AlmacenResumen>();
    for (const d of this.datos) {
      const prev = mapaAlmacen.get(d.almacenId) ?? {
        almacenId: d.almacenId,
        almacen: d.almacen,
        total: 0, ocupadas: 0, libres: 0, pct: 0,
      };
      prev.total    += d.totalUbicaciones;
      prev.ocupadas += d.ubicacionesOcupadas;
      prev.libres   += d.ubicacionesLibres;
      mapaAlmacen.set(d.almacenId, prev);
    }
    this.almacenes = [...mapaAlmacen.values()].map(a => ({
      ...a,
      pct: a.total > 0 ? Math.round((a.ocupadas / a.total) * 100) : 0,
    }));

    this.gaugeOptions = this.almacenes.map(a => this._buildGauge(a));
  }

  private _colorGauge(pct: number): string[] {
    if (pct >= 80) return ['#ef4444'];
    if (pct >= 50) return ['#f59e0b'];
    return ['#22c55e'];
  }

  private _buildGauge(a: AlmacenResumen): GaugeOptions {
    return {
      series: [a.pct],
      chart: { type: 'radialBar', height: 200, sparkline: { enabled: true } },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: { size: '60%' },
          track: { background: '#e2e8f0', strokeWidth: '100%' },
          dataLabels: {
            name: { show: true, fontSize: '11px', offsetY: -10 },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              offsetY: 5,
              formatter: (val: number) => `${val}%`,
            },
          },
        },
      },
      fill: { colors: this._colorGauge(a.pct) },
      stroke: { lineCap: 'round' },
      labels: [a.almacen],
      dataLabels: { enabled: true },
    };
  }
}
