import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ReportesService } from '../reportes.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { Chart } from 'chart.js/auto';
import { TableModule } from 'primeng/table';

  import { ChartModule } from 'primeng/chart';
  import { ProgressBarModule } from 'primeng/progressbar';
  import { BadgeModule } from 'primeng/badge';

  import ChartDataLabels from 'chartjs-plugin-datalabels'; // Importa el plugin
  import { LOCALE_ID } from '@angular/core';
  import { registerLocaleData } from '@angular/common';
  import localeEs from '@angular/common/locales/es';
import { SelectItem } from 'primeng/api';
import { ClienteService } from '../../_services/cliente.service';
import { CardModule } from 'primeng/card'; // Importa el módulo de Card
import { OrderSummary } from '../reportes.types';
import { PanelModule } from 'primeng/panel';
import moment from 'moment';
import { PropietarioService } from '../../_services/propietario.service';
   registerLocaleData(localeEs, 'es');
   Chart.register(ChartDataLabels);



@Component({
  selector: 'app-avancepicking',
  templateUrl: './avancepicking.component.html',
  styleUrls: ['./avancepicking.component.css'],
  standalone: true,
  imports: [
    MatIcon,
    FormsModule,
    CommonModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    CalendarModule,
    ChartModule ,
    ProgressBarModule     ,
    BadgeModule ,
    CardModule,
    PanelModule,
    ChartModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }],
})
export class AvancepickingComponent implements OnInit {

  summary: OrderSummary | null = null;


  // Datos para los gráficos
  pieChartData: any;
  barChartData: any;
  chartOptions: any;





  porcentajeAvance: any;
  porcentajePendiente: any;

  cantidadAvance: any;
  totalPendiente: any;

  gridDataResult: any;
  propietarios: SelectItem[] = [];
  clientes: SelectItem[] = [];
  tiendas: SelectItem[] = [];
  
  model: any = {};

  data: any = [];
  options: any;


  // summary: OrderSummary | null = null;

  // // Datos para los gráficos
  // pieChartData: any;
  // barChartData: any;

  // Parámetros de filtrado
  idPropietario: number = 145; // Reemplaza con el ID dinámico según corresponda
  fecini?: string;
  fecfin?: string;

  dateInicio: Date = new Date(Date.now() ) ;
  dateFin: Date = new Date(Date.now()) ;
  kpiList: any[] = [];
  flujoDespachoList: any[] = [];
  resumenGeneralList: any[] = [];

  constructor(public reporteService: ReportesService,
     private clienteService: ClienteService,
     private propietarioService: PropietarioService,
  ) { }

  ngOnInit() {


 

    this.dateInicio.setDate((new Date()).getDate() - 30);
    this.dateFin.setDate((new Date()).getDate() );

    this.model.fec_ini =  this.dateInicio;
    this.model.fec_fin =  this.dateFin ;


    this.cargarCombos();



    


  }

  exportarPicking() {

    this.model.fec_ini =  this.dateInicio;
    this.model.fec_fin =  this.dateFin ;



    this.model.fec_ini = moment(this.dateInicio).format('DD/MM/YYYY');
    this.model.fec_fin = moment(this.dateFin).format('DD/MM/YYYY');

    let url = 'http://104.36.166.65/reptwh/RepPickingDAP.aspx?' +
    '&fecinicio=' + this.model.fec_ini  +  '&fecfin=' + this.model.fec_fin ;
    window.open(url);
  }
  exportar() {

    
    this.model.fec_ini =  this.dateInicio;
    this.model.fec_fin =  this.dateFin ;



    this.model.fec_ini = moment(this.dateInicio).format('DD/MM/YYYY');
    this.model.fec_fin = moment(this.dateFin).format('DD/MM/YYYY');

    let url = 'http://104.36.166.65/reptwh/RepPickingTransporte.aspx?propietarioid=' + String( this.model.IdPropietario) +
    '&fecini=' + this.model.fec_ini  +  '&fecfin=' + this.model.fec_fin ;
    window.open(url);

  }

  cargarCombos() {



    this.propietarioService.getAllPropietarios().subscribe(resp1 => {
 
      const propietarioFiltrado = resp1.find(element => element.id === 145); 

      

  if (propietarioFiltrado) {
    this.propietarios.push({ 
      label: propietarioFiltrado.razonSocial.toUpperCase(), 
      value: propietarioFiltrado.id 
    });
  }

      this.cargarFiltrosGuardados() ;
  
      });
      

      this.clienteService.getAllClientesDreamland().subscribe(resp1 => {
 
        resp1.forEach(element => {
          this.clientes.push({ label: element.cliente.toUpperCase() , value: element.idCliente });
        });
    
        });


  }

  cargarSucursal(obj: any) {

    console.log('select' , obj.value);

    this.clienteService.getAllSucursal( obj.value ).subscribe(resp1 => {
 
      resp1.forEach(element => {
        this.clientes.push({ label: element.descripTienda.toUpperCase() , value: element.idTienda });
      });
  
      });
  }
  cargarFiltrosGuardados() {
    const savedFilter = localStorage.getItem('filtroPicking');
    if (savedFilter) {
      this.model = JSON.parse(savedFilter);
    }
  }
  buscar() {



    this.guardarFiltros();
 


    const formatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    


    this.model.fec_ini =  formatter.format(this.dateInicio);
    this.model.fec_fin = formatter.format(this.dateFin);



    
    this.reporteService.getAvanceTotalxCliente( this.model.IdPropietario , this.model.fec_ini ,  this.model.fec_fin
    ).subscribe(response => {


      this.data = response;
      this.summary = response;
      this.prepareCharts();
       console.log( 'xD' , this.summary );

       


       const totalOrdenes = this.summary?.totalOrdenes || 0;
      const ordenesEntregadas = this.summary?.despachado || 0;

      // Evita división por cero
      const tasaEntrega = totalOrdenes > 0 ? ((ordenesEntregadas / totalOrdenes) * 100).toFixed(2) + '%' : '0%';




       this.kpiList = [



        { title: 'Total de Órdenes', value: this.summary?.totalOrdenes, icon: 'pi pi-shopping-cart', color: '#42A5F5' },
        { title: 'Pendiente', value: this.summary?.planificado, icon: 'pi pi-clock', color: '#4CAF50' },
        { title: 'Planificado', value: this.summary?.planificado, icon: 'pi pi-bookmark', color: '#4CAF50' },
        { title: 'Picking Iniciado', value: this.summary?.pickingIniciado, icon: 'pi pi-play-circle', color: '#FFC107' },
        { title: 'Picking Finalizado', value: this.summary?.pickingFinalizado, icon: 'pi pi-stop-circle', color: '#2196F3' },
        { title: 'Picking Validado', value: this.summary?.pickingValidado, icon: 'pi pi-check-circle', color: '#4CAF50' },
        { title: 'Despachado', value: this.summary.despachado, icon: 'pi pi-truck', color: '#9C27B0' },
        { title: 'Órdenes Retrasadas', value: this.summary?.ordenesRetrasadas, icon: 'pi pi-exclamation-triangle', color: '#F44336' },
        { title: 'Tasa de Confirmación', value: + '%', icon: 'pi pi-chart-line', color: '#FF9800' }


        

      ];

      this.flujoDespachoList = [
        { title: 'Pendiente', value: this.summary?.pendiente, icon: 'pi pi-clock', color: '#4CAF50' },
        { title: 'Planificado', value: this.summary?.planificado, icon: 'pi pi-calendar', color: '#4CAF50' },
        { title: 'Picking Iniciado', value: this.summary?.pickingIniciado, icon: 'pi pi-play-circle', color: '#FFC107' },
        { title: 'Picking Finalizado', value: this.summary?.pickingFinalizado, icon: 'pi pi-stop-circle', color: '#2196F3' },
        { title: 'Picking Validado', value: this.summary?.pickingValidado, icon: 'pi pi-check-circle', color: '#4CAF50' },
        { title: 'Despachado', value: this.summary?.despachado, icon: 'pi pi-truck', color: '#9C27B0',
          subEstados: [
            { title: 'Planificado', value: this.summary?.programado },
            { title: 'En Ruta', value: this.summary?.enRuta  },
            { title: 'Entregado', value: this.summary?.entregado }
          ] 


         }
      ];
      
      this.resumenGeneralList = [
        { title: 'Total de Órdenes', value: this.summary?.totalOrdenes, icon: 'pi pi-shopping-cart', color: '#42A5F5' },
        { title: 'Órdenes Retrasadas', value: this.summary?.ordenesRetrasadas, icon: 'pi pi-exclamation-triangle', color: '#F44336' },
        { title: 'Órdenes Entregadas', value: this.summary?.despachado, icon: 'pi pi-check', color: '#4CAF50' },
        { title: 'Tasa de Entrega', value: (tasaEntrega || 0) + '%', icon: 'pi pi-chart-line', color: '#FF9800' }
      ];
  
      this.fetchOrderSummary();

   
     });


    
    this.reporteService.getAvanceTotal(
        this.model.IdPropietario , this.model.fec_ini ,  this.model.fec_fin
    ).subscribe(response => {

      console.log( 'respuesta:' , response);

      this.gridDataResult = response;


  

    });




  }
  descargarDetalle() {
    // // Aquí puedes hacer una petición al backend para obtener el detalle
    // this.reporteService.obtenerDetalleFlujoDespacho().subscribe((data) => {
    //   const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    //   const url = window.URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = 'Detalle_Despacho.xlsx';
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    // });


  }
  guardarFiltros() {
    localStorage.setItem('filtroPicking', JSON.stringify(this.model));
  }

  fetchOrderSummary(): void {


    // this.reporteService.getOrderSummary(this.idPropietario, this.fecini, this.fecfin)
    //   .subscribe({
    //     next: (data) => {
    //       this.summary = data;
    //       this.prepareCharts();
    //     },
    //     error: (error) => {
    //     //  this.messageService.add({severity:'error', summary: 'Error', detail: 'No se pudo obtener el resumen de órdenes.'});
    //       console.error(error);
    //     }
    //   });
  }

  prepareCharts(): void {
    if (!this.summary) return;

    // Pie Chart - Distribución de Estados
    this.pieChartData = {
      labels: ['Pendiente','Picking Iniciado','Picking Finalizado','Picking Validado'],
      datasets: [
        {
          data: [
            this.summary.pendiente,
            this.summary.pickingIniciado,
            this.summary.pickingFinalizado,
            this.summary.pickingValidado,
          // this.summary.despachado,
       
          ],
          backgroundColor: [
            '#43A047', // Verde oscuro para Picking Validado
            '#FFB300', // Naranja para Picking Iniciado
            '#1E88E5', // Azul intenso para Picking Finalizado
            '#00ACC1', // Turquesa para Despachado
           // '#E53935'  // Rojo para Pendiente
          ],
          hoverBackgroundColor: [
            '#66BB6A', // Verde claro
            '#FFCA28', // Naranja más brillante
            '#42A5F5', // Azul claro
            '#BA68C8', // Púrpura claro
         //   '#EF5350'  // Rojo claro
          ]
        }
      ]
    };

    // Bar Chart - Cantidad de Órdenes por Estado
    this.barChartData = {
      labels: ['Picking Validado', 'Picking Iniciado', 'Picking Finalizado', 'Despachado'],
      datasets: [
        {
          label: 'Cantidad de Órdenes',
          backgroundColor: '#42A5F5',
          data: [
            this.summary.pickingValidado,
            this.summary.pickingIniciado,
            this.summary.pickingFinalizado,
            this.summary.despachado
          ]
        }
      ]
    };

      // Opciones de configuración para los gráficos
  this.chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            let dataset = tooltipItem.dataset;
            let total = dataset.data.reduce((previous, current) => previous + current);
            let currentValue = dataset.data[tooltipItem.dataIndex];
            let percentage = ((currentValue / total) * 100).toFixed(2) + "%";
            return `${tooltipItem.label}: ${currentValue} (${percentage})`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        anchor: 'end',
        align: 'start',
        formatter: (value, context) => {
          let total = context.dataset.data.reduce((a, b) => a + b, 0);
          let percentage = ((value / total) * 100).toFixed(2);
          return `${percentage}%`;
        }
      }
    }
  };
  }

  // Método para aplicar filtros (si se implementa)
  applyFilters(): void {
    this.fetchOrderSummary();
  }
  

}
