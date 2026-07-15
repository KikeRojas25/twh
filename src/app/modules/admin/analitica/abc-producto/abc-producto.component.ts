import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import moment from 'moment';
import { MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { PropietarioService } from '../../_services/propietario.service';
import { exportarCsv, exportarExcel } from '../analitica-export';
import { AnaliticaService } from '../analitica.service';
import { AbcProducto, AbcProductoResumen, CriterioAbc } from '../analitica.types';

@Component({
    selector: 'app-abc-producto',
    templateUrl: './abc-producto.component.html',
    styleUrls: ['./abc-producto.component.css'],
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
              InputTextModule, ChartModule, TagModule, ToastModule, MatIcon],
})
export class AbcProductoComponent implements OnInit {
    clientes: SelectItem[] = [];
    propietarioId: number | null = null;
    criterio: CriterioAbc = 'MOVIMIENTOS';
    dias = 90;
    top = 20;

    criterios: SelectItem[] = [
        { value: 'MOVIMIENTOS', label: 'Movimientos (frecuencia de picking)' },
        { value: 'CANTIDAD', label: 'Cantidad (cantidad retirada)' },
        { value: 'INVENTARIO', label: 'Inventario (stock actual)' },
    ];
    periodos: SelectItem[] = [
        { value: 30, label: 'Último mes' },
        { value: 90, label: 'Últimos 3 meses' },
        { value: 180, label: 'Últimos 6 meses' },
        { value: 365, label: 'Último año' },
    ];
    opcionesTop: SelectItem[] = [
        { value: 10, label: 'Top 10' },
        { value: 20, label: 'Top 20' },
        { value: 30, label: 'Top 30' },
    ];

    productos: AbcProducto[] = [];
    resumen: AbcProductoResumen | null = null;
    cargando = false;
    recalculando = false;

    chartPareto: any;
    opcionesPareto: any;
    chartClases: any;
    opcionesClases: any;

    constructor(
        private analiticaService: AnaliticaService,
        private propietarioService: PropietarioService,
        private messageService: MessageService,
    ) {}

    ngOnInit(): void {
        // datalabels: avancepicking lo registra global; sin apagarlo pinta un número
        // sobre cada barra/punto y el gráfico se vuelve ilegible.
        this.opcionesPareto = {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, datalabels: { display: false } },
            scales: {
                y: { type: 'linear', position: 'left', beginAtZero: true,
                     title: { display: true, text: 'Valor' } },
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

        this.propietarioService.getAllPropietarios().subscribe((resp) => {
            this.clientes = resp.map((c: any) => ({ value: c.id, label: c.razonSocial }));
        });
    }

    buscar(): void {
        if (!this.propietarioId) { return; }

        this.cargando = true;
        this.analiticaService.getAbcProducto(this.propietarioId, this.criterio, this.dias).subscribe({
            next: (resp) => {
                this.productos = resp.productos ?? [];
                this.resumen = resp.resumen;
                this.construirGraficos();
                this.cargando = false;
            },
            error: () => {
                this.productos = [];
                this.resumen = null;
                this.cargando = false;
            },
        });
    }

    /** Regenera el ABC para el período elegido y recarga. Puede tardar: recorre todo el catálogo. */
    recalcular(): void {
        if (!this.propietarioId) { return; }

        this.recalculando = true;
        this.analiticaService.recalcularAbcProducto(this.propietarioId, this.dias).subscribe({
            next: () => {
                this.recalculando = false;
                this.messageService.add({
                    severity: 'success', summary: 'ABC actualizado',
                    detail: 'Se recalculó la clasificación con los datos más recientes.',
                });
                this.buscar();
            },
            error: () => {
                this.recalculando = false;
                this.messageService.add({
                    severity: 'error', summary: 'No se pudo recalcular',
                    detail: 'Intenta de nuevo o revisa el log del servidor.',
                });
            },
        });
    }

    severidadClase(clase: string): string {
        return clase === 'A' ? 'success' : clase === 'B' ? 'warning' : clase === 'C' ? 'danger' : 'secondary';
    }

    /** La columna que importa cambia según el criterio elegido. */
    get columnaValor(): string {
        return this.criterio === 'MOVIMIENTOS' ? 'Movimientos'
             : this.criterio === 'CANTIDAD' ? 'Cantidad retirada'
             : 'Stock actual';
    }

    private construirGraficos(): void {
        const top = this.productos.slice(0, this.top);

        this.chartPareto = {
            labels: top.map(p => p.codigo ?? '—'),
            datasets: [
                {
                    type: 'line',
                    label: '% Acumulado',
                    data: top.map(p => p.pctAcumulado),
                    borderColor: '#d32f2f',
                    backgroundColor: '#d32f2f',
                    borderWidth: 2,
                    pointRadius: 3,
                    yAxisID: 'y1',
                    fill: false,
                },
                {
                    type: 'bar',
                    label: 'Valor',
                    data: top.map(p => p.valor),
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
        return this.productos.map(p => ({
            'Código': p.codigo,
            'Descripción': p.descripcionLarga,
            'Movimientos': p.numMovimientos,
            'Cantidad retirada': p.cantRetirada,
            'Stock actual': p.stockActual,
            'Valor': p.valor,
            '% Acumulado': p.pctAcumulado,
            'Clase': p.clase,
        }));
    }

    private get nombreArchivo(): string {
        const cliente = this.resumen?.cliente?.replace(/[^\w]+/g, '_') ?? 'cliente';
        return `ABC_${cliente}_${this.criterio}_${this.dias}d_${moment().format('YYYYMMDD')}`;
    }

    exportarAExcel(): void { exportarExcel(this.filasParaExportar(), this.nombreArchivo, 'ABC'); }
    exportarACsv(): void { exportarCsv(this.filasParaExportar(), this.nombreArchivo); }
}
