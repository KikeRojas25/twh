import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import moment from 'moment';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PropietarioService } from '../../_services/propietario.service';
import { AnaliticaService } from '../analitica.service';
import {
    AbcProductoResumen,
    InventarioClienteResumen,
    InventarioProducto,
    ParetoCliente,
    ParetoClientesResumen,
    ProyeccionAlmacenMes,
    ProyeccionAlmacenResumen,
    ProyeccionMes,
    ProyeccionResumen,
} from '../analitica.types';

@Component({
    selector: 'app-dashboard-analitica',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, ChartModule, DropdownModule, ButtonModule,
              TagModule, MatIcon, RouterLink],
})
export class DashboardAnaliticaComponent implements OnInit, OnDestroy {
    private analiticaService = inject(AnaliticaService);
    private propietarioService = inject(PropietarioService);
    private el = inject(ElementRef);

    // ---------- Filtros (una sola fila, arriba de todo lo que afectan) ----------
    clientes: SelectItem[] = [];
    propietarioId: number | null = null;
    meses = 6;

    horizontes: SelectItem[] = [
        { value: 3, label: '3 meses' },
        { value: 6, label: '6 meses' },
        { value: 9, label: '9 meses' },
        { value: 12, label: '1 año' },
    ];

    // ---------- Almacén ----------
    almacenSerie: ProyeccionAlmacenMes[] = [];
    almacenResumen: ProyeccionAlmacenResumen | null = null;
    pareto: ParetoCliente[] = [];
    paretoResumen: ParetoClientesResumen | null = null;
    cargandoAlmacen = false;

    // ---------- Cliente ----------
    clienteSerie: ProyeccionMes[] = [];
    clienteResumen: ProyeccionResumen | null = null;
    inventario: InventarioProducto[] = [];
    inventarioResumen: InventarioClienteResumen | null = null;
    abcResumen: AbcProductoResumen | null = null;
    cargandoCliente = false;

    // ---------- Gráficos ----------
    chartAlmacen: any;
    chartCliente: any;
    chartAbc: any;
    opcionesLinea: any;
    opcionesDona: any;

    private observadorTema?: MutationObserver;

    ngOnInit(): void {
        // Las opciones no dependen de los datos: se arman una vez, acá. Si se armaran
        // dentro del callback de carga, un error de red dejaría los gráficos con las
        // opciones por defecto de Chart.js (leyenda sin filtrar, datalabels encima).
        this.opcionesLinea = this.construirOpcionesLinea();
        this.opcionesDona = this.construirOpcionesDona();

        this.propietarioService.getAllPropietarios().subscribe((resp) => {
            this.clientes = resp.map((c: any) => ({ value: c.id, label: c.razonSocial }));
        });

        this.cargarAlmacen(true);

        // El tema de Fuse se cambia en caliente. Chart.js congela los colores al
        // construirse, así que hay que reconstruir los gráficos cuando cambia.
        this.observadorTema = new MutationObserver(() => this.reconstruirGraficos());
        this.observadorTema.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    ngOnDestroy(): void {
        this.observadorTema?.disconnect();
    }

    // ===================== Carga =====================
    cargarAlmacen(autoseleccionar = false): void {
        this.cargandoAlmacen = true;

        // Cada rama se blinda por separado: un forkJoin sin catchError muere entero si
        // falla UNA sola llamada, y se llevaría puesta la mitad del panel que sí responde.
        forkJoin({
            proy: this.analiticaService.getProyeccionAlmacen(this.meses).pipe(catchError(() => of(null))),
            pareto: this.analiticaService.getParetoClientes().pipe(catchError(() => of(null))),
        }).subscribe(({ proy, pareto }) => {
            this.almacenSerie = proy?.serie ?? [];
            this.almacenResumen = proy?.resumen ?? null;
            this.pareto = pareto?.clientes ?? [];
            this.paretoResumen = pareto?.resumen ?? null;

            this.chartAlmacen = this.construirGraficoAlmacen();
            this.cargandoAlmacen = false;

            // El dashboard nunca arranca vacío: entra con el cliente más grande.
            if (autoseleccionar && !this.propietarioId && this.pareto.length) {
                this.propietarioId = this.pareto[0].propietarioId;
                this.cargarCliente();
            }
        });
    }

    cargarCliente(): void {
        if (!this.propietarioId) {
            this.clienteResumen = null;
            this.inventarioResumen = null;
            this.abcResumen = null;
            return;
        }

        this.cargandoCliente = true;
        const id = this.propietarioId;

        forkJoin({
            // Si un cliente no tiene ABC calculado el endpoint responde igual, pero
            // blindamos cada rama para que un fallo no tumbe el resto del panel.
            proy: this.analiticaService.getProyeccion(id, this.meses).pipe(catchError(() => of(null))),
            inv: this.analiticaService.getInventarioCliente(id).pipe(catchError(() => of(null))),
            abc: this.analiticaService.getAbcProducto(id, 'MOVIMIENTOS', 90).pipe(catchError(() => of(null))),
        }).subscribe(({ proy, inv, abc }) => {
            this.clienteSerie = proy?.serie ?? [];
            this.clienteResumen = proy?.resumen ?? null;
            this.inventario = inv?.productos ?? [];
            this.inventarioResumen = inv?.resumen ?? null;
            this.abcResumen = abc?.resumen ?? null;

            this.chartCliente = this.construirGraficoCliente();
            this.chartAbc = this.construirGraficoAbc();
            this.cargandoCliente = false;
        });
    }

    onHorizonteChange(): void {
        this.cargarAlmacen();
        this.cargarCliente();
    }

    // ===================== Derivados para la vista =====================
    get nombreCliente(): string {
        return this.clientes.find(c => c.value === this.propietarioId)?.label ?? '';
    }

    /** El titular del Pareto: cuánto concentran los primeros clientes. */
    get concentracionTop5(): number | null {
        return this.pareto.length >= 5 ? (this.pareto[4].pctAcum ?? null) : null;
    }

    get topClientes(): ParetoCliente[] {
        return this.pareto.slice(0, 8);
    }

    get topProductos(): InventarioProducto[] {
        return this.inventario.slice(0, 8);
    }

    /** Ancho de la barra de un ranking, relativo al primero (no al total). */
    anchoBarra(valor: number, maximo: number): string {
        return maximo > 0 ? `${(valor * 100) / maximo}%` : '0%';
    }

    get maxUbicClientes(): number {
        return this.pareto.length ? this.pareto[0].ubicaciones : 0;
    }

    get maxUbicProductos(): number {
        return this.inventario.length ? this.inventario[0].ubicaciones : 0;
    }

    etiquetaMes(periodo: string | null): string {
        return periodo ? moment(periodo).format('MMM YYYY') : '—';
    }

    // ===================== Gráficos =====================
    /** Chart.js no resuelve var(): hay que leer el token del CSS ya calculado. */
    private token(nombre: string): string {
        return getComputedStyle(this.el.nativeElement).getPropertyValue(nombre).trim();
    }

    private reconstruirGraficos(): void {
        this.opcionesLinea = this.construirOpcionesLinea();
        this.opcionesDona = this.construirOpcionesDona();
        this.chartAlmacen = this.construirGraficoAlmacen();
        this.chartCliente = this.construirGraficoCliente();
        this.chartAbc = this.construirGraficoAbc();
    }

    /**
     * Serie temporal con banda. Un solo eje Y (nunca dos: dos escalas en un plot
     * inventan correlaciones que no están en los datos).
     *
     * `hist` y `pred` comparten el punto de unión para que la línea no quede cortada.
     */
    private serieTemporal(
        labels: string[],
        real: (number | null)[],
        pred: (number | null)[],
        baja: (number | null)[],
        alta: (number | null)[],
    ): any {
        const hist = this.token('--viz-hist');
        const predColor = this.token('--viz-pred');
        const band = this.token('--viz-band');

        // El último punto real también arranca la proyección: si no, hay un hueco.
        const ultimoReal = real.map(v => v != null).lastIndexOf(true);
        const predConUnion = pred.map((v, i) => (i === ultimoReal ? real[i] : v));
        const bajaConUnion = baja.map((v, i) => (i === ultimoReal ? real[i] : v));
        const altaConUnion = alta.map((v, i) => (i === ultimoReal ? real[i] : v));

        return {
            labels,
            datasets: [
                {
                    label: 'Banda de confianza',
                    data: altaConUnion,
                    borderWidth: 0,
                    pointRadius: 0,
                    backgroundColor: band,
                    fill: '+1',            // rellena hasta el siguiente dataset (la banda baja)
                    order: 3,
                },
                {
                    label: '_bandaBaja',   // el "_" lo esconde de leyenda y tooltip
                    data: bajaConUnion,
                    borderWidth: 0,
                    pointRadius: 0,
                    fill: false,
                    order: 4,
                },
                {
                    label: 'Ocupación real',
                    data: real,
                    borderColor: hist,
                    backgroundColor: hist,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false,
                    order: 1,
                },
                {
                    label: 'Proyección',
                    data: predConUnion,
                    borderColor: predColor,
                    backgroundColor: predColor,
                    borderWidth: 2,
                    borderDash: [6, 4],    // la línea punteada dice "esto todavía no pasó"
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false,
                    order: 2,
                },
            ],
        };
    }

    private construirGraficoAlmacen(): any {
        if (!this.almacenSerie.length) { return null; }
        const s = this.almacenSerie;

        return this.serieTemporal(
            s.map(f => this.etiquetaMes(f.periodo)),
            s.map(f => f.valorReal),
            s.map(f => f.prediccion),
            s.map(f => f.bandaBaja),
            s.map(f => f.bandaAlta),
        );
    }

    private construirGraficoCliente(): any {
        if (!this.clienteSerie.length) { return null; }
        const s = this.clienteSerie;

        // Por cliente el pasado guarda el ajuste del modelo, pero lo que interesa
        // mostrar es lo que realmente pasó.
        return this.serieTemporal(
            s.map(f => this.etiquetaMes(f.periodo)),
            s.map(f => (f.esHistorico ? f.valorReal : null)),
            s.map(f => (f.esHistorico ? null : f.prediccion)),
            s.map(f => (f.esHistorico ? null : f.bandaBaja)),
            s.map(f => (f.esHistorico ? null : f.bandaAlta)),
        );
    }

    private construirGraficoAbc(): any {
        if (!this.abcResumen?.calculado) { return null; }
        const r = this.abcResumen;

        return {
            labels: ['Clase A', 'Clase B', 'Clase C', 'Clase D'],
            datasets: [{
                data: [r.claseA, r.claseB, r.claseC, r.claseD],
                backgroundColor: [
                    this.token('--viz-abc-a'),
                    this.token('--viz-abc-b'),
                    this.token('--viz-abc-c'),
                    this.token('--viz-abc-d'),
                ],
                borderColor: this.token('--viz-surface'),
                borderWidth: 2,     // 2px del color de la superficie: separa sin dibujar un borde
            }],
        };
    }

    private construirOpcionesLinea(): any {
        const muted = this.token('--viz-muted');
        const grid = this.token('--viz-grid');
        const secondary = this.token('--viz-secondary');

        return {
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },   // el hit area no exige puntería
            plugins: {
                // avancepicking.component.ts hace Chart.register(ChartDataLabels) a nivel de
                // módulo, o sea GLOBAL: se cuela en cualquier gráfico que no lo apague. Un número
                // sobre cada punto es ilegible y no se lee. El valor va en el tooltip y en la tabla.
                datalabels: { display: false },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: secondary,
                        usePointStyle: true,
                        boxWidth: 8,
                        filter: (item: any) => !item.text?.startsWith('_'),
                    },
                },
                tooltip: {
                    filter: (item: any) => !item.dataset.label?.startsWith('_'),
                    callbacks: {
                        label: (ctx: any) => ctx.parsed.y == null
                            ? null
                            : `${ctx.dataset.label}: ${Math.round(ctx.parsed.y).toLocaleString('es-PE')}`,
                    },
                },
            },
            scales: {
                // Un solo eje. Nunca dos escalas Y en el mismo plot.
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: grid, drawTicks: false },     // hairline sólido, recesivo
                    ticks: { color: muted, precision: 0 },
                },
                x: {
                    grid: { display: false },
                    ticks: { color: muted },
                },
            },
        };
    }

    private construirOpcionesDona(): any {
        const secondary = this.token('--viz-secondary');

        return {
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                datalabels: { display: false },   // ver nota en construirOpcionesLinea()
                legend: {
                    position: 'bottom',
                    labels: { color: secondary, usePointStyle: true, boxWidth: 8, padding: 12 },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => {
                            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0) || 1;
                            return ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed * 100) / total).toFixed(1)}%)`;
                        },
                    },
                },
            },
        };
    }
}
