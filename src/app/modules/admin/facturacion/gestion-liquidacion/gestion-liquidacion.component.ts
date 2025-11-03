import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ClienteService } from '../../_services/cliente.service';
import { FacturacionService } from '../facturacion.service';
import { ResumenFacturacionPorMes } from '../facturacion.types';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
    selector: 'app-gestion-liquidacion',
    standalone: true,
    templateUrl: './gestion-liquidacion.component.html',
    styleUrls: ['./gestion-liquidacion.component.scss'],
    imports: [
        MatIcon,
        InputTextModule,
        DropdownModule,
        FormsModule,
        ButtonModule,
        TableModule,
        CommonModule,
        DialogModule,
        TimelineModule,
        CardModule,
        DynamicDialogModule,
        ToastModule,
        CalendarModule,
        NgApexchartsModule,
    ],
})
export class GestionLiquidacionComponent {
    liquidacion: any;
    clientesDropdown: SelectItem[] = [];
    datosMatriz: ResumenFacturacionPorMes[] = [];
    datosGraficos: ResumenFacturacionPorMes[] = [];
    chartOptions: any;
    chartTotales: any;
    cargando = true;
    mesesVisibles = [];


    matriz: {
        [cliente: string]: {
            clienteId: number;
            montos: { [mes: number]: number };
        };
    } = {};
    matrizFilas: any[] = [];
    clientes: string[] = [];

    meses = [
        { name: 'Enero', value: 1 },
        { name: 'Febrero', value: 2 },
        { name: 'Marzo', value: 3 },
        { name: 'Abril', value: 4 },
        { name: 'Mayo', value: 5 },
        { name: 'Junio', value: 6 },
        { name: 'Julio', value: 7 },
        { name: 'Agosto', value: 8 },
        { name: 'Septiembre', value: 9 },
        { name: 'Octubre', value: 10 },
        { name: 'Noviembre', value: 11 },
        { name: 'Diciembre', value: 12 },
    ];

    anios = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

    model: any = {
        PropietarioId: null,
        mes: null,
        anio: new Date().getFullYear(),
    };

    constructor(
        private clienteService: ClienteService,
        private propietarioService: PropietarioService, 
        private facturacionService: FacturacionService
    ) {}

    ngOnInit() {
        this.propietarioService.getAllPropietarios().subscribe((resp) => {
            this.clientesDropdown = resp.map((c) => ({ value: c.id, label: c.razonSocial }));
        });

        this.obtenerDatos();
        const mesLimite = this.model.mes || new Date().getMonth() + 1;
        this.mesesVisibles = this.meses.filter((m) => m.value <= mesLimite);

    }

    armarMatriz(): void {
        const filas = [];

        for (const cliente of Object.keys(this.matriz)) {
            const fila: any = {
                cliente,
                clienteId: this.matriz[cliente].clienteId,
            };

            for (const mes of this.meses) {
                const mesActual = this.matriz[cliente].montos[mes.value] ?? null;
                const mesAnterior = this.matriz[cliente].montos[mes.value - 1] ?? null;

                fila['mes_' + mes.value] = mesActual;

                if (mesActual !== null && mesAnterior !== null) {
                    const variacion = ((mesActual - mesAnterior) / mesAnterior) * 100;
                    fila['var_' + mes.value] = variacion;
                } else {
                    fila['var_' + mes.value] = null;
                }
            }

            filas.push(fila);
        }

        this.matrizFilas = filas;
    }

    obtenerUrl(clienteId: number, mes: number): string {
        return `http://104.36.166.65/reptwh/Rep_LiquidacionDetalle.aspx?clienteId=${clienteId}&mes=${mes}&anio=${this.model.anio}`;
    }

    obtenerDatos() {
        const anio = this.model.anio;
        const mes = this.model.mes;
        const clienteId = this.model.PropietarioId;

        this.facturacionService
            .obtenerResumenFacturacionMatriz(anio, mes, clienteId)
            .subscribe((data) => {
                this.datosMatriz = data;
                this.matriz = {};

                for (const item of this.datosMatriz) {
                    const cliente = item.cliente;
                    const clienteId = item.clienteId;
                    const mes = item.mes;
                    const total = item.totalFacturado ?? 0;

                    if (!this.matriz[cliente]) {
                        this.matriz[cliente] = {
                            clienteId: clienteId,
                            montos: {},
                        };
                    }

                    this.matriz[cliente].montos[mes] = total;
                }

                this.armarMatriz();
            });

        this.facturacionService
            .obtenerResumenFacturacionPorMes(anio, mes, clienteId)
            .subscribe((data) => {
                this.datosGraficos = data;
                this.generarGrafico();
                this.generarGraficoTotales();
                this.cargando = false;
            });
    }

    generarGrafico(): void {
        if (!this.datosGraficos || this.datosGraficos.length === 0) return;

        this.chartOptions = {
            chart: { type: 'bar', height: 400, toolbar: { show: true } },
            colors: ['#1E88E5', '#43A047', '#FB8C00', '#E53935', '#8E24AA'],
            title: {
                text: 'Facturación mensual por servicio',
                align: 'center',
                style: { fontSize: '16px', fontWeight: 'bold' },
            },
            plotOptions: { bar: { columnWidth: '40%', distributed: false } },
            dataLabels: { enabled: false },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: (val) => val.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }),
                },
            },
            xaxis: {
                categories: this.datosGraficos.map((d) => this.meses[d.mes - 1].name),
                title: { text: 'Mes', style: { fontWeight: 600 } },
                labels: { rotate: -45 },
            },
            yaxis: {
                title: { text: 'Monto', style: { fontWeight: 600 } },
                labels: {
                    formatter: (val) => val.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }),
                },
            },
            legend: { position: 'top' },
            responsive: [{
                breakpoint: 768,
                options: { chart: { height: 300 }, legend: { position: 'bottom' } },
            }],
            series: [
                { name: 'Ingreso', data: this.datosGraficos.map((d) => d.totalIngreso) },
                { name: 'Salida', data: this.datosGraficos.map((d) => d.totalSalida) },
                { name: 'PosTotal', data: this.datosGraficos.map((d) => d.totalPosTotal) },
                { name: 'Picking', data: this.datosGraficos.map((d) => d.totalPickingUnidad) },
            ],
        };
    }

    generarGraficoTotales(): void {
        const totalesPorMes = this.datosGraficos.map((d) => {
            return {
                mes: this.meses[d.mes - 1].name,
                total:
                    (d.totalIngreso ?? 0) +
                    (d.totalSalida ?? 0) +
                    (d.totalSeguro ?? 0) +
                    (d.totalPosTotal ?? 0) +
                    (d.totalPickingUnidad ?? 0) +
                    (d.totalPickingCaja ?? 0) +
                    (d.totalEtiquetado ?? 0),
            };
        });

        this.chartTotales = {
            chart: { type: 'line', height: 250, toolbar: { show: false } },
            title: {
                text: 'Total mensual facturado',
                align: 'center',
                style: { fontSize: '14px', fontWeight: 'bold' },
            },
            xaxis: { categories: totalesPorMes.map((d) => d.mes) },
            yaxis: {
                title: { text: 'Total' },
                labels: {
                    formatter: (val) => val.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }),
                },
            },
            tooltip: {
                y: {
                    formatter: (val) => val.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }),
                },
            },
            series: [{
                name: 'Total mensual',
                data: totalesPorMes.map((d) => d.total),
            }],
        };
    }

    procesar() {
        this.obtenerDatos();
    }
}
