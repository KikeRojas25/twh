import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import moment from 'moment';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

import { PropietarioService } from '../../_services/propietario.service';
import { AnaliticaContextService } from '../analitica-context.service';
import { exportarCsv, exportarExcel } from '../analitica-export';
import { AnaliticaService } from '../analitica.service';
import { IngresoCliente, IngresoMes, IngresoResumen, MetricaIngreso } from '../analitica.types';

/** Antes de sep-2025 el kardex no se puede mapear a almacén (cobertura 7.7%). */
const PRIMER_MES_MAPEABLE = '2025-09-01';

@Component({
    selector: 'app-ingresos',
    templateUrl: './ingresos.component.html',
    styleUrls: ['./ingresos.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
              InputTextModule, ChartModule, CalendarModule, MatIcon],
})
export class IngresosComponent implements OnInit, OnDestroy {
    /** true dentro del drawer del dashboard: oculta el encabezado de página. */
    @Input() embedded = false;

    private analiticaService = inject(AnaliticaService);
    private propietarioService = inject(PropietarioService);
    private ctx = inject(AnaliticaContextService);
    private el = inject(ElementRef);

    // ---------- Filtros ----------
    propietarioId: number | null = null;
    desde: Date | null = null;
    hasta: Date | null = null;
    soloOperativos = false;
    metrica: MetricaIngreso = 'pallets';
    top = 20;

    clientes: SelectItem[] = [];

    opcionesMetrica: SelectItem[] = [
        { value: 'pallets', label: 'Pallets (ocupan espacio)' },
        { value: 'unidades', label: 'Unidades (volumen comercial)' },
        { value: 'ordenes', label: 'Órdenes de recibo' },
        { value: 'lineas', label: 'Líneas de kardex' },
    ];

    opcionesTop: SelectItem[] = [
        { value: 10, label: 'Top 10' },
        { value: 20, label: 'Top 20' },
        { value: 30, label: 'Top 30' },
        { value: 999, label: 'Todos' },
    ];

    // ---------- Datos ----------
    serie: IngresoMes[] = [];
    clientesData: IngresoCliente[] = [];
    resumen: IngresoResumen | null = null;
    cargando = false;
    error: string | null = null;

    chartFlujo: any;
    opcionesFlujo: any;
    chartRanking: any;
    opcionesRanking: any;

    private observadorTema?: MutationObserver;

    ngOnInit(): void {
        this.propietarioService.getAllPropietarios().subscribe((resp) => {
            this.clientes = [
                { value: null, label: 'Todos los clientes' },
                ...resp.map((c: any) => ({ value: c.id, label: c.razonSocial })),
            ];
        });

        this.propietarioId = this.ctx.propietarioId();
        this.buscar();

        // El tema de Fuse cambia en caliente y Chart.js congela los colores al
        // construirse: hay que reconstruir los gráficos cuando cambia.
        this.observadorTema = new MutationObserver(() => this.construirGraficos());
        this.observadorTema.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    ngOnDestroy(): void {
        this.observadorTema?.disconnect();
    }

    /** El filtro por almacén no tiene sentido sobre historia anterior a sep-2025. */
    get operativosDisponible(): boolean {
        return !this.desde || moment(this.desde).isSameOrAfter(PRIMER_MES_MAPEABLE);
    }

    buscar(): void {
        if (!this.operativosDisponible) { this.soloOperativos = false; }

        this.cargando = true;
        this.error = null;
        this.ctx.propietarioId.set(this.propietarioId);

        const desde = this.desde ? moment(this.desde).format('YYYY-MM-DD') : undefined;
        const hasta = this.hasta ? moment(this.hasta).format('YYYY-MM-DD') : undefined;

        this.analiticaService
            .getIngresos(this.propietarioId ?? undefined, desde, hasta, this.soloOperativos)
            .subscribe({
                next: (resp) => {
                    this.serie = resp.serie ?? [];
                    this.clientesData = resp.clientes ?? [];
                    this.resumen = resp.resumen;
                    this.construirGraficos();
                    this.cargando = false;
                },
                error: (e) => {
                    this.serie = [];
                    this.clientesData = [];
                    this.resumen = null;
                    this.error = e?.error?.message ?? 'No se pudieron cargar los movimientos.';
                    this.cargando = false;
                },
            });
    }

    // ===================== Métricas =====================
    /** Etiqueta de la unidad activa, para títulos y ejes. */
    get unidad(): string {
        return { pallets: 'Pallets', unidades: 'Unidades',
                 ordenes: 'Órdenes', lineas: 'Líneas' }[this.metrica];
    }

    ingresoDe(m: IngresoMes): number {
        return { pallets: m.ingresoPallets, unidades: m.ingresoUnidades,
                 ordenes: m.ingresoOrdenes, lineas: m.ingresoLineas }[this.metrica];
    }

    /** Órdenes de salida no se exponen por mes: el SP no las devuelve desagregadas. */
    salidaDe(m: IngresoMes): number | null {
        return { pallets: m.salidaPallets, unidades: m.salidaUnidades,
                 ordenes: null, lineas: m.salidaLineas }[this.metrica];
    }

    ingresoClienteDe(c: IngresoCliente): number {
        return { pallets: c.ingresoPallets, unidades: c.ingresoUnidades,
                 ordenes: c.ingresoOrdenes, lineas: c.ingresoLineas }[this.metrica];
    }

    get totalMetrica(): number {
        const r = this.resumen;
        if (!r) { return 0; }
        return { pallets: r.totalPallets, unidades: r.totalUnidades,
                 ordenes: r.totalOrdenes, lineas: r.totalLineas }[this.metrica];
    }

    // ===================== Gráficos =====================
    /** Chart.js no resuelve var(): hay que leer el token del CSS ya calculado. */
    private token(nombre: string): string {
        return getComputedStyle(this.el.nativeElement).getPropertyValue(nombre).trim();
    }

    private construirGraficos(): void {
        const ingreso = this.token('--viz-ingreso');
        const salida = this.token('--viz-salida');
        const surface = this.token('--viz-surface');
        const grid = this.token('--viz-grid');
        const secondary = this.token('--viz-secondary');
        const muted = this.token('--viz-muted');

        const etiquetas = this.serie.map(m => moment(m.periodo).format('MMM YY'));
        const haySalida = this.salidaDe(this.serie[0] ?? ({} as IngresoMes)) !== null;

        // Ingresos y salidas comparten unidad, así que van en UN SOLO eje.
        // Nada de eje dual: dos escalas Y inventan correlaciones que no están en los datos.
        this.chartFlujo = {
            labels: etiquetas,
            datasets: [
                {
                    type: 'bar',
                    label: `Ingresos (${this.unidad.toLowerCase()})`,
                    data: this.serie.map(m => this.ingresoDe(m)),
                    backgroundColor: ingreso,
                    borderColor: surface,
                    borderWidth: 2,           // separador de 2px entre barras contiguas
                    borderRadius: 4,
                    borderSkipped: 'bottom',  // el extremo pegado a la base queda recto
                },
                ...(haySalida ? [{
                    type: 'bar',
                    label: `Salidas (${this.unidad.toLowerCase()})`,
                    data: this.serie.map(m => this.salidaDe(m)),
                    backgroundColor: salida,
                    borderColor: surface,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: 'bottom',
                }] : []),
            ],
        };

        this.opcionesFlujo = {
            maintainAspectRatio: false,
            // datalabels: avancepicking lo registra global; sin apagarlo pinta un número
            // sobre cada barra y el gráfico se vuelve ilegible.
            plugins: {
                legend: { position: 'top', labels: { color: secondary, usePointStyle: true } },
                datalabels: { display: false },
                tooltip: { mode: 'index', intersect: false },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: this.unidad, color: secondary },
                    grid: { color: grid },
                    ticks: { color: muted },
                },
                x: { grid: { display: false }, ticks: { color: muted } },
            },
        };

        // Ranking: una sola serie → sin leyenda, el título ya la nombra.
        const top = this.clientesData.slice(0, this.top);
        this.chartRanking = {
            labels: top.map(c => c.cliente ?? `#${c.propietarioId}`),
            datasets: [{
                label: this.unidad,
                data: top.map(c => this.ingresoClienteDe(c)),
                backgroundColor: ingreso,
                borderColor: surface,
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: 'left',
            }],
        };

        this.opcionesRanking = {
            indexAxis: 'y',
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: false } },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: this.unidad, color: secondary },
                    grid: { color: grid },
                    ticks: { color: muted },
                },
                y: { grid: { display: false }, ticks: { color: secondary, font: { size: 11 } } },
            },
        };
    }

    /** Concentración del Pareto, como texto: los N primeros acumulan X%. */
    get concentracion(): string | null {
        if (this.clientesData.length < 5) { return null; }
        const acum = this.clientesData[4]?.pctAcum;
        return acum == null ? null : `Los 5 primeros concentran el ${acum.toFixed(0)}% del total.`;
    }

    // ===================== Exportación =====================
    private filasParaExportar(): Record<string, unknown>[] {
        return this.clientesData.map(c => ({
            'Cliente': c.cliente,
            'Pallets ingresados': c.ingresoPallets,
            'Unidades ingresadas': c.ingresoUnidades,
            'Órdenes de recibo': c.ingresoOrdenes,
            'Líneas': c.ingresoLineas,
            'Pallets salidos': c.salidaPallets,
            'Unidades salidas': c.salidaUnidades,
            'Neto pallets': c.netoPallets,
            'Meses con ingreso': c.mesesConIngreso,
            '%': c.pct,
            '% Acumulado': c.pctAcum,
        }));
    }

    private get nombreArchivo(): string {
        const d = this.resumen?.fechaDesde ? moment(this.resumen.fechaDesde).format('YYYYMMDD') : '';
        const h = this.resumen?.fechaHasta ? moment(this.resumen.fechaHasta).format('YYYYMMDD') : '';
        return `Ingresos_${d}_${h}`;
    }

    exportarAExcel(): void { exportarExcel(this.filasParaExportar(), this.nombreArchivo, 'Ingresos'); }
    exportarACsv(): void { exportarCsv(this.filasParaExportar(), this.nombreArchivo); }
}
