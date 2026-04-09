import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexLegend,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { ReportesService } from '../reportes/reportes.service';
import { OcupabilidadItem } from '../reportes/reportes.types';

export type GaugeOptions = {
  series: number[];
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  fill: ApexFill;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
};

export type BarOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  colors: string[];
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
  selector: 'inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  imports: [CommonModule, NgApexchartsModule],
})
export class InicioComponent implements OnInit {
  @ViewChild('barChart') barChart!: ChartComponent;

  datos: OcupabilidadItem[] = [];
  almacenes: AlmacenResumen[] = [];
  cargando = true;
  mostrarDashboard = true;

  private readonly ROLES_SIN_DASHBOARD = [5, 25, 26];

  // KPIs globales
  totalUbicaciones = 0;
  totalOcupadas = 0;
  totalLibres = 0;
  pctGlobal = 0;

  // Gauge por almacén
  gaugeOptions: GaugeOptions[] = [];

  // Stacked Bar
  barOptions!: BarOptions;

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.mostrarDashboard = !this._usuarioTieneRolRestringido();

    if (!this.mostrarDashboard) {
      this.cargando = false;
      return;
    }

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

  private _usuarioTieneRolRestringido(): boolean {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return false;
      const user = JSON.parse(userString);
      const roles: any[] = Array.isArray(user.roles)
        ? user.roles
        : typeof user.roles === 'string'
        ? user.roles.split(',').map((r: string) => Number(r.trim()))
        : [];
      return roles.some(r => this.ROLES_SIN_DASHBOARD.includes(Number(r)));
    } catch {
      return false;
    }
  }

  private _procesarDatos(): void {
    // ── KPIs globales ──────────────────────────────────────────────────────────
    this.totalUbicaciones = this.datos.reduce((s, d) => s + d.totalUbicaciones, 0);
    this.totalOcupadas    = this.datos.reduce((s, d) => s + d.ubicacionesOcupadas, 0);
    this.totalLibres      = this.datos.reduce((s, d) => s + d.ubicacionesLibres, 0);
    this.pctGlobal        = this.totalUbicaciones > 0
      ? Math.round((this.totalOcupadas / this.totalUbicaciones) * 100)
      : 0;

    // ── Resumen por almacén (para gauges) ─────────────────────────────────────
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

    // ── Gauges ────────────────────────────────────────────────────────────────
    this.gaugeOptions = this.almacenes.map(a => this._buildGauge(a));

    // ── Stacked Bar ───────────────────────────────────────────────────────────
    this._buildBar();
  }

  private _colorGauge(pct: number): string[] {
    if (pct >= 80) return ['#ef4444'];       // rojo
    if (pct >= 50) return ['#f59e0b'];       // naranja
    return ['#22c55e'];                       // verde
  }

  private _buildGauge(a: AlmacenResumen): GaugeOptions {
    return {
      series: [a.pct],
      chart: { type: 'radialBar', height: 220, sparkline: { enabled: true } },
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
              fontSize: '22px',
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

  private _buildBar(): void {
    // Categorías: "Almacen · TipoUbicacion"
    const categorias = this.datos.map(d => `${d.almacen.trim()} · ${d.tipoUbicacion}`);

    this.barOptions = {
      series: [
        {
          name: 'Ocupadas',
          data: this.datos.map(d => d.ubicacionesOcupadas),
        },
        {
          name: 'Libres',
          data: this.datos.map(d => d.ubicacionesLibres),
        },
      ],
      chart: {
        type: 'bar',
        height: 320,
        stacked: true,
        stackType: '100%',
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '60%',
          borderRadius: 4,
        },
      },
      xaxis: {
        categories: categorias,
        labels: { style: { fontSize: '11px' } },
      },
      yaxis: { labels: { style: { fontSize: '11px' } } },
      fill: { opacity: 1 },
      colors: ['#6366f1', '#e2e8f0'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${Math.round(val)}%`,
        style: { fontSize: '11px', fontWeight: 600 },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toLocaleString()} ubic.`,
        },
      },
    };
  }
}
