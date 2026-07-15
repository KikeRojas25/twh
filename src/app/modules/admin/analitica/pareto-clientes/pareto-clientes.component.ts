import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { TagModule } from 'primeng/tag';

import { exportarCsv, exportarExcel } from '../analitica-export';
import { AnaliticaService } from '../analitica.service';
import { ParetoCliente, ParetoClientesResumen } from '../analitica.types';

@Component({
    selector: 'app-pareto-clientes',
    templateUrl: './pareto-clientes.component.html',
    styleUrls: ['./pareto-clientes.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
              InputTextModule, ChartModule, TagModule, CalendarModule, MatIcon],
})
export class ParetoClientesComponent implements OnInit {
    /** null = última foto disponible. InventarioDiario guarda foto diaria, así que
     *  cualquier fecha pasada se puede reconstruir. */
    fecha: Date | null = null;
    top = 20;

    opcionesTop: SelectItem[] = [
        { value: 10, label: 'Top 10' },
        { value: 20, label: 'Top 20' },
        { value: 30, label: 'Top 30' },
        { value: 999, label: 'Todos' },
    ];

    clientesData: ParetoCliente[] = [];
    resumen: ParetoClientesResumen | null = null;
    cargando = false;

    chartPareto: any;
    opcionesPareto: any;
    chartClases: any;
    opcionesClases: any;

    constructor(private analiticaService: AnaliticaService) {}

    ngOnInit(): void {
        // datalabels: avancepicking lo registra global; sin apagarlo pinta un número
        // sobre cada barra/punto y el gráfico se vuelve ilegible.
        this.opcionesPareto = {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, datalabels: { display: false } },
            scales: {
                y: { type: 'linear', position: 'left', beginAtZero: true,
                     title: { display: true, text: 'Ubicaciones' } },
                y1: { type: 'linear', position: 'right', beginAtZero: true, max: 100,
                      grid: { drawOnChartArea: false },
                      title: { display: true, text: '% Acumulado' },
                      ticks: { callback: (v: number) => v + '%' } },
                x: { ticks: { maxRotation: 90, minRotation: 45, font: { size: 10 } } },
            },
        };
        this.opcionesClases = {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { display: false } },
        };

        this.buscar();
    }

    buscar(): void {
        this.cargando = true;
        const fecha = this.fecha ? moment(this.fecha).format('YYYY-MM-DD') : undefined;

        this.analiticaService.getParetoClientes(fecha).subscribe({
            next: (resp) => {
                this.clientesData = resp.clientes ?? [];
                this.resumen = resp.resumen;
                this.construirGraficos();
                this.cargando = false;
            },
            error: () => {
                this.clientesData = [];
                this.resumen = null;
                this.cargando = false;
            },
        });
    }

    severidadClase(clase: string): string {
        return clase === 'A' ? 'success' : clase === 'B' ? 'warning' : clase === 'C' ? 'danger' : 'secondary';
    }

    private construirGraficos(): void {
        const top = this.clientesData.slice(0, this.top);

        this.chartPareto = {
            labels: top.map(c => c.cliente),
            datasets: [
                {
                    type: 'line',
                    label: '% Acumulado',
                    data: top.map(c => c.pctAcum),
                    borderColor: '#d32f2f',
                    backgroundColor: '#d32f2f',
                    borderWidth: 2,
                    pointRadius: 3,
                    yAxisID: 'y1',
                    fill: false,
                },
                {
                    type: 'bar',
                    label: 'Ubicaciones',
                    data: top.map(c => c.ubicaciones),
                    backgroundColor: '#2e7d32',
                    yAxisID: 'y',
                },
            ],
        };

        if (this.resumen) {
            const r = this.resumen;
            const total = r.claseA + r.claseB + r.claseC + r.claseD || 1;
            const pct = (n: number): string => ((n * 100) / total).toFixed(1);

            this.chartClases = {
                labels: [
                    `Clase A: ${r.claseA} (${pct(r.claseA)}%)`,
                    `Clase B: ${r.claseB} (${pct(r.claseB)}%)`,
                    `Clase C: ${r.claseC} (${pct(r.claseC)}%)`,
                    `Clase D: ${r.claseD} (${pct(r.claseD)}%)`,
                ],
                datasets: [{
                    data: [r.claseA, r.claseB, r.claseC, r.claseD],
                    backgroundColor: ['#2e7d32', '#f9a825', '#ef6c00', '#9e9e9e'],
                }],
            };
        }
    }

    // ---------- Exportación ----------
    private filasParaExportar(): Record<string, unknown>[] {
        return this.clientesData.map(c => ({
            'Cliente': c.cliente,
            'Ubicaciones': c.ubicaciones,
            'Simple (pallets)': c.simple,
            'Doble (pallets)': c.doble,
            'Stage (pallets)': c.stage,
            '%': c.pct,
            '% Acumulado': c.pctAcum,
            'Clase': c.clase,
        }));
    }

    private get nombreArchivo(): string {
        const f = this.resumen?.fecha ? moment(this.resumen.fecha).format('YYYYMMDD') : moment().format('YYYYMMDD');
        return `ParetoClientes_${f}`;
    }

    exportarAExcel(): void { exportarExcel(this.filasParaExportar(), this.nombreArchivo, 'Pareto'); }
    exportarACsv(): void { exportarCsv(this.filasParaExportar(), this.nombreArchivo); }
}
