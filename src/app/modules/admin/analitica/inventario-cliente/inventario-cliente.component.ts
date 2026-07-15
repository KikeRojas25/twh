import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
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
import { AnaliticaContextService } from '../analitica-context.service';
import { exportarCsv, exportarExcel } from '../analitica-export';
import { AnaliticaService } from '../analitica.service';
import { InventarioClienteResumen, InventarioProducto } from '../analitica.types';

@Component({
    selector: 'app-inventario-cliente',
    templateUrl: './inventario-cliente.component.html',
    styleUrls: ['./inventario-cliente.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
              InputTextModule, ChartModule, TagModule, MatIcon],
})
export class InventarioClienteComponent implements OnInit {
    /** true dentro del drawer del dashboard: oculta el encabezado de página. */
    @Input() embedded = false;

    clientes: SelectItem[] = [];
    propietarioId: number | null = null;
    clasificacion: string | null = null;
    top = 15;

    clasificaciones: SelectItem[] = [
        { value: null, label: 'Todos' },
        { value: 'A', label: 'Clase A' },
        { value: 'B', label: 'Clase B' },
        { value: 'C', label: 'Clase C' },
    ];
    opcionesTop: SelectItem[] = [
        { value: 10, label: 'Top 10' },
        { value: 15, label: 'Top 15' },
        { value: 20, label: 'Top 20' },
        { value: 30, label: 'Top 30' },
    ];

    productos: InventarioProducto[] = [];
    resumen: InventarioClienteResumen | null = null;
    cargando = false;

    chartBarras: any;
    opcionesBarras: any;
    chartDona: any;
    opcionesDona: any;

    constructor(
        private analiticaService: AnaliticaService,
        private propietarioService: PropietarioService,
        private ctx: AnaliticaContextService,
    ) {}

    ngOnInit(): void {
        // datalabels: avancepicking lo registra global; sin apagarlo pinta un número
        // sobre cada barra/segmento y el gráfico se vuelve ilegible.
        this.opcionesBarras = {
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: false } },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Ubicaciones' } },
                x: { ticks: { maxRotation: 90, minRotation: 45 } },
            },
        };
        this.opcionesDona = {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } },
                datalabels: { display: false },
            },
        };

        this.propietarioService.getAllPropietarios().subscribe((resp) => {
            this.clientes = resp.map((c: any) => ({ value: c.id, label: c.razonSocial }));
        });

        // Retomar el cliente que venía del dashboard u otro reporte.
        this.propietarioId = this.ctx.propietarioId();
        if (this.propietarioId != null) { this.buscar(); }
    }

    buscar(): void {
        if (!this.propietarioId) { return; }

        this.ctx.setCliente(this.propietarioId);   // que la elección siga a los demás reportes
        this.cargando = true;
        this.analiticaService.getInventarioCliente(this.propietarioId, this.clasificacion ?? undefined).subscribe({
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

    severidadClase(clase: string): string {
        return clase === 'A' ? 'success' : clase === 'B' ? 'warning' : 'danger';
    }

    private construirGraficos(): void {
        const top = this.productos.slice(0, this.top);

        this.chartBarras = {
            labels: top.map(p => p.codigo ?? '—'),
            datasets: [{
                data: top.map(p => p.ubicaciones),
                backgroundColor: '#d32f2f',
            }],
        };

        // Dona: el top vs "otros", para que se vea la concentración
        const restoUbic = this.productos.slice(this.top).reduce((s, p) => s + p.ubicaciones, 0);
        const paleta = ['#d32f2f', '#212121', '#f9a825', '#2e7d32', '#1565c0', '#6a1b9a', '#00838f',
                        '#ef6c00', '#4e342e', '#546e7a', '#c2185b', '#558b2f', '#0277bd', '#8e24aa', '#00695c'];

        this.chartDona = {
            labels: [...top.map(p => p.codigo ?? '—'), 'Otros'],
            datasets: [{
                data: [...top.map(p => p.ubicaciones), restoUbic],
                backgroundColor: [...top.map((_, i) => paleta[i % paleta.length]), '#cfd8dc'],
            }],
        };
    }

    // ---------- Exportación ----------
    private filasParaExportar(): Record<string, unknown>[] {
        return this.productos.map(p => ({
            'Código': p.codigo,
            'Descripción': p.descripcionLarga,
            'Cantidad': p.cantidad,
            'Ubicaciones': p.ubicaciones,
            '% del total': p.pct,
            '% acumulado': p.pctAcum,
            'Clasificación': p.clase,
        }));
    }

    private get nombreArchivo(): string {
        const cliente = this.resumen?.cliente?.replace(/[^\w]+/g, '_') ?? 'cliente';
        return `Inventario_${cliente}_${moment().format('YYYYMMDD')}`;
    }

    exportarAExcel(): void { exportarExcel(this.filasParaExportar(), this.nombreArchivo, 'Inventario'); }
    exportarACsv(): void { exportarCsv(this.filasParaExportar(), this.nombreArchivo); }
}
