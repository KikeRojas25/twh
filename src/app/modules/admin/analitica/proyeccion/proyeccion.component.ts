import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import moment from 'moment';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { PropietarioService } from '../../_services/propietario.service';
import { exportarCsv, exportarExcel } from '../analitica-export';
import { AnaliticaService } from '../analitica.service';
import { ProyeccionMes, ProyeccionResumen } from '../analitica.types';

@Component({
    selector: 'app-proyeccion',
    templateUrl: './proyeccion.component.html',
    styleUrls: ['./proyeccion.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
              InputTextModule, ChartModule, TagModule, MatIcon],
})
export class ProyeccionComponent implements OnInit {
    clientes: SelectItem[] = [];
    propietarioId: number | null = null;
    meses = 3;
    umbral: number | null = null;

    horizontes: SelectItem[] = [
        { value: 1, label: '1 mes' },
        { value: 3, label: '3 meses' },
        { value: 6, label: '6 meses' },
        { value: 9, label: '9 meses' },
        { value: 12, label: '1 año' },
    ];

    serie: ProyeccionMes[] = [];
    resumen: ProyeccionResumen | null = null;
    cargando = false;
    sinDatos = false;

    chartData: any;
    chartOptions: any;

    constructor(
        private analiticaService: AnaliticaService,
        private propietarioService: PropietarioService,
    ) {}

    ngOnInit(): void {
        this.chartOptions = this.construirOpciones();

        this.propietarioService.getAllPropietarios().subscribe((resp) => {
            this.clientes = resp.map((c: any) => ({ value: c.id, label: c.razonSocial }));
        });
    }

    buscar(): void {
        if (!this.propietarioId) { return; }

        this.cargando = true;
        this.analiticaService.getProyeccion(this.propietarioId, this.meses).subscribe({
            next: (resp) => {
                this.serie = resp.serie ?? [];
                this.resumen = resp.resumen;
                this.sinDatos = this.serie.length === 0;
                this.chartData = this.construirGrafico();
                this.cargando = false;
            },
            error: () => {
                this.serie = [];
                this.resumen = null;
                this.sinDatos = true;
                this.cargando = false;
            },
        });
    }

    /** El umbral es una línea de capacidad: marcamos los meses que la superan. */
    superaUmbral(fila: ProyeccionMes): boolean {
        return this.umbral != null && fila.prediccion > this.umbral;
    }

    get mesesSobreUmbral(): number {
        return this.umbral == null ? 0 : this.serie.filter(f => !f.esHistorico && f.prediccion > this.umbral!).length;
    }

    etiquetaMes(periodo: string): string {
        return moment(periodo).format('MMM YYYY');
    }

    // ---------- Gráfico ----------
    private construirGrafico(): any {
        const labels = this.serie.map(f => this.etiquetaMes(f.periodo));
        const ultimoHist = this.serie.map(f => f.esHistorico).lastIndexOf(true);

        // La proyección arranca en el último punto histórico para que la línea no quede cortada.
        const proyeccion = this.serie.map((f, i) =>
            !f.esHistorico ? f.prediccion : (i === ultimoHist ? (f.valorReal ?? f.prediccion) : null));

        const datasets: any[] = [
            {
                label: 'Banda de confianza',
                data: this.serie.map(f => f.bandaAlta),
                borderWidth: 0,
                pointRadius: 0,
                backgroundColor: 'rgba(211, 47, 47, 0.12)',
                fill: '+1',          // rellena hasta el siguiente dataset (la banda baja)
                order: 4,
            },
            {
                label: '_bandaBaja',  // el "_" lo oculta de la leyenda (ver filter abajo)
                data: this.serie.map(f => f.bandaBaja),
                borderWidth: 0,
                pointRadius: 0,
                fill: false,
                order: 5,
            },
            {
                label: 'Histórico',
                data: this.serie.map(f => f.valorReal),
                borderColor: '#212121',
                borderWidth: 2.5,
                pointRadius: 2,
                tension: 0.3,
                fill: false,
                order: 1,
            },
            {
                label: 'Proyección',
                data: proyeccion,
                borderColor: '#d32f2f',
                borderWidth: 2.5,
                borderDash: [6, 4],
                pointRadius: 2,
                tension: 0.3,
                fill: false,
                order: 2,
            },
            {
                label: 'Tendencia',
                data: this.serie.map(f => f.tendencia),
                borderColor: '#9e9e9e',
                borderWidth: 1.5,
                borderDash: [2, 3],
                pointRadius: 0,
                fill: false,
                order: 3,
            },
        ];

        if (this.umbral != null) {
            datasets.push({
                label: `Umbral (${this.umbral})`,
                data: this.serie.map(() => this.umbral),
                borderColor: '#f57c00',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false,
                order: 0,
            });
        }

        return { labels, datasets };
    }

    private construirOpciones(): any {
        return {
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                // avancepicking registra ChartDataLabels de forma global: si no se apaga,
                // pinta un número sobre cada punto y el gráfico se vuelve ilegible.
                datalabels: { display: false },
                legend: {
                    position: 'bottom',
                    labels: { filter: (item: any) => !item.text?.startsWith('_') },
                },
                tooltip: {
                    filter: (item: any) => !item.dataset.label?.startsWith('_'),
                    callbacks: {
                        label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'}`,
                    },
                },
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Posiciones' } },
            },
        };
    }

    // ---------- Exportación ----------
    private filasParaExportar(): Record<string, unknown>[] {
        return this.serie.map(f => ({
            'Mes': this.etiquetaMes(f.periodo),
            'Tipo': f.tipo,
            'Real': f.valorReal,
            'Predicción': f.prediccion,
            'Banda baja': f.bandaBaja,
            'Banda alta': f.bandaAlta,
            'Tendencia': f.tendencia,
            'Días con data': f.diasConData,
        }));
    }

    private get nombreArchivo(): string {
        const cliente = this.resumen?.cliente?.replace(/[^\w]+/g, '_') ?? 'cliente';
        return `Proyeccion_${cliente}_${moment().format('YYYYMMDD')}`;
    }

    exportarAExcel(): void { exportarExcel(this.filasParaExportar(), this.nombreArchivo, 'Proyeccion'); }
    exportarACsv(): void { exportarCsv(this.filasParaExportar(), this.nombreArchivo); }
}
