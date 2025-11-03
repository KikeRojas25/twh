import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';
import { OrdenSalida } from '../../despachos/despachos.types';
import { PlanningService } from '../planning.service';
import { Vehiculo } from '../planning.types';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-planificar-despachos',
  templateUrl: './planificar-despachos.component.html',
  styleUrls: ['./planificar-despachos.component.css'],
   standalone: true,
     imports: [
        InputTextModule, 
        DropdownModule,
        FormsModule,
        ButtonModule,
        TableModule,
        CommonModule,
        DialogModule   ,
        TimelineModule ,
        CardModule ,
        DynamicDialogModule ,
        ToastModule,
        CalendarModule,
        ConfirmDialogModule,
        MatIcon,
        IconFieldModule,
        InputIconModule
      ],
      providers: [
        DialogService ,
        MessageService ,
        ConfirmationService 
    
      ]
})
export class PlanificarDespachosComponent implements OnInit {

// Dropdowns
  almacenes: SelectItem[] = [];
  propietarios: SelectItem[] = [];
  selectedRows: any[] = []; // Fila(s) seleccionada(s)
  ids = '';
  model_pendientes: any = {};

  // Tablas
  listData: OrdenSalida[] = [];
  listData1: OrdenSalida[] = [];
  selectedRow: OrdenSalida[] = [];
  ordeneseleccionadas: OrdenSalida[] = [];

  groupedTotals: { [key: string]: { pesoTotal: number; productosTotal: number; unidadesTotal: number } } = {};


  vehicleTypes: SelectItem[] = []; // Lista de tipos de vehículo

  totalPesoSeleccionado: number = 0;
  rows: number = 100;

  // Resumen
  totalOrdenes = 0;
  totalProductos = 0;
  totalUnidades = 0;
  asignadas = 0;
  totalPeso = 0;

  // Modelos
  model: any = {};
  loading = false;

  displayPlanificarDialog: boolean = false;
  planificarForm: any = {
    tipoVehiculo: null,
    placa: '',
    fechaProgramada: null
  };

  constructor(
    private planningService: PlanningService,
    private clienteService: ClienteService,
    private propietarioService: PropietarioService,
    private generalService: GeneralService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService ,
  ) {}

  ngOnInit(): void {


    this.cargarFiltrosGuardados();


    this.cargarPropietarios();
    this.cargarAlmacenes();

    this.buscar();



  }
  cargarFiltrosGuardados() {
    const savedFilter = localStorage.getItem('filtroPicking');
    if (savedFilter) {
      this.model = JSON.parse(savedFilter);
    }
  }
  cargarPropietarios() {
    this.propietarioService.getAllPropietarios().subscribe((resp) => {
      this.propietarios = resp.map((propietario) => ({
        label: propietario.razonSocial,
        value: propietario.id
      }));
    //  this.model.PropietarioId = this.propietarios[0]?.value || null;
    });
  }

  cargarAlmacenes() {
    this.generalService.getAllAlmacenes().subscribe((resp) => {
      this.almacenes = resp.map((almacen) => ({
        label: almacen.descripcion,
        value: almacen.id
      }));
     // this.model.AlmacenId = this.almacenes[0]?.value || null;
    });
  }

  guardarFiltros() {
    localStorage.setItem('filtroPicking', JSON.stringify(this.model));
  }
  calculateGroupTotals() {
    this.groupedTotals = {};
  
    this.listData.forEach(row => {
      let estado = row.estado;

      console.log('estado:', estado);
  
      if (!this.groupedTotals[estado]) {
        this.groupedTotals[estado] = { pesoTotal: 0, productosTotal: 0, unidadesTotal: 0 };
      }
  
      this.groupedTotals[estado].pesoTotal += row.peso || 0;
      // this.groupedTotals[estado].productosTotal += row. || 0;
      // this.groupedTotals[estado].unidadesTotal += row.unidades || 0;
    });
  }
  

  buscar() {

    this.ordeneseleccionadas = [];



    if (!this.model.PropietarioId || !this.model.AlmacenId) {
      alert('Debe seleccionar un propietario y un almacén.');
      return;
    }


    this.loading = true;
    this.planningService.getAllOrdenSalida(this.model).subscribe((list) => {
      this.listData = list;

      console.log(this.listData);

      this.actualizarResumen();
      
    this.calculateGroupTotals();

      this.guardarFiltros(); // Guarda el filtro en localStorage


    });
  }


  onRowSelectOrUnselect() {
    this.totalPesoSeleccionado = this.selectedRows.reduce((acc, row) => acc + row.peso, 0);
  }
  actualizarResumen() {
    this.planningService.getAllOrdenSalidaPendientesResumen(this.model).subscribe((resumen) => {
      this.totalOrdenes = resumen.ordenes;
      this.totalProductos = resumen.productos;
      this.totalUnidades = resumen.unidades;
      this.totalPeso = resumen.peso;
    });
  }

  agregarorden() {
    this.ordeneseleccionadas.push(...this.selectedRows);
    this.listData = this.listData.filter((orden) => !this.selectedRows.includes(orden));
    this.selectedRows = [];
  }

  eliminar(orden: OrdenSalida) {
    this.ordeneseleccionadas = this.ordeneseleccionadas.filter((o) => o !== orden);
    this.listData.push(orden);
  }

  comprobar() {
    if (this.ordeneseleccionadas.length === 0) {
      alert('Debe seleccionar al menos una orden de salida.');
      return;
    }
    console.log('Comprobando stock para las órdenes seleccionadas:', this.ordeneseleccionadas);
  }

  planificar(){





    this.ids = '';

    this.generalService.getValorTabla(4).subscribe( resp =>  {

      resp.forEach(x=> {
        this.vehicleTypes.push({value: x.id , label: x.valorPrincipal   });
      })

    })

    if (this.ordeneseleccionadas.length === 0) {
      // Mostrar mensaje de advertencia
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar al menos una orden de salida para planificar.'
      });
      return; // Detener la ejecución si no hay órdenes seleccionadas
    }
    this.planificarForm = [];
    this.displayPlanificarDialog = true;
    
  






  }

  generarPlanning() {

    
    this.confirmationService.confirm({
      message: `
        <p>
          ¿Está seguro que desea planificar estos despachos? Esta instrucción agrupará y liberará los pedidos para planificación <br>
                </p>
      `,
      header: 'Planificar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
   
    
  
        

    this.ordeneseleccionadas.forEach( element => {
      this.ids  = this.ids + ',' + String(element.id);
    });
    this.model_pendientes.ids = this.ids;

    this.model_pendientes.IdTipoVehiculo = this.planificarForm.tipoVehiculo;
    this.model_pendientes.placa = this.planificarForm.placa;
    this.model_pendientes.fechaDespacho = this.planificarForm.fechaProgramada;



    this.planningService.PlanificarDespacho(this.model_pendientes).subscribe(resp => {


       // this.model = resp;
        this.messageService.add({severity: 'success', summary: 'TWH', detail: 'Se planificó correctamente correctamente.'})  //success('Se registró correctamente.');
            
        this.displayPlanificarDialog = false;
        this.ordeneseleccionadas = [];
        this.buscar();


      }, error => {
         //error(error);
      }, () => {
        //success('Se planificó correctamente.');
        this.router.navigate(['/picking/listadotrabajopendiente' ]);
      });
             
  
      },
      reject: () => {
  
      }
    });
  }

  planificarMasivo() {
    if (this.ordeneseleccionadas.length === 0) {
      alert('Debe seleccionar al menos una orden de salida.');
      return;
    }
    console.log('Planificando masivamente las órdenes seleccionadas:', this.ordeneseleccionadas);
  }

  
}