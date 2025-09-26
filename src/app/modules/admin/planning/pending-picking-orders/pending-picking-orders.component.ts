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
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';
import { OrdenSalida } from '../../despachos/despachos.types';
import { PlanningService } from '../planning.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
  selector: 'app-pending-picking-orders',
  templateUrl: './pending-picking-orders.component.html',
  styleUrls: ['./pending-picking-orders.component.css'],
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
export class PendingPickingOrdersComponent implements OnInit {

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

  rows: number = 10;

  // Resumen
  totalOrdenes = 0;
  totalProductos = 0;
  totalUnidades = 0;
  asignadas = 0;
  totalPeso = 0;

  // Modelos
  model: any = {};
  loading = false;

  jwtHelper = new JwtHelperService();
  decodedToken: any = {};
  

  constructor(
    private planningService: PlanningService,
    private clienteService: ClienteService,
    private generalService: GeneralService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService ,
  ) {}

  ngOnInit(): void {


    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);



    
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
    this.clienteService.getAllPropietarios('').subscribe((resp) => {
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

  buscar() {
    if (!this.model.PropietarioId || !this.model.AlmacenId) {
      alert('Debe seleccionar un propietario y un almacén.');
      return;
    }


    this.loading = true;
    this.planningService.getAllOrdenSalidaPendientes(this.model).subscribe((list) => {
      this.listData = list;
      this.actualizarResumen();

      this.guardarFiltros(); // Guarda el filtro en localStorage


    });
  }

  actualizarResumen() {
    this.planningService.getAllOrdenSalidaPendientesResumen(this.model).subscribe((resumen) => {
      this.totalOrdenes = resumen.ordenes;
      this.totalProductos = resumen.productos;
      this.totalUnidades = resumen.unidades;
      this.totalPeso = resumen.asignadas;
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

    this.model_pendientes.ids = '';
    this.ids  = '';

    if (this.ordeneseleccionadas.length === 0) {
      // Mostrar mensaje de advertencia
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar al menos una orden de salida para planificar.'
      });
      return; // Detener la ejecución si no hay órdenes seleccionadas
    }


    
    this.confirmationService.confirm({
      message: `
        <p>
          ¿Está seguro que desea planificar estos despachos? <br>
          Esta opción generará una Hoja de picking con todos los despachos.
        </p>
      `,
      header: 'Planificar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
    
      
    
    this.model_pendientes.ids = this.ordeneseleccionadas
                          .map(element => String(element.id))
                          .join(',');


    
    this.model_pendientes.usuarioid =  this.decodedToken.nameid ;
    this.model_pendientes.PropietarioId =  this.model.PropietarioId


        this.planningService.PlanificarPicking(this.model_pendientes).subscribe(
          (resp: any) => {
            console.log('Planificación de picking:', resp);

            if (resp.resultado) {
              // ✅ Caso éxito
              this.model = resp;
              this.messageService.add({
                severity: 'success',
                summary: 'TWH',
                detail: 'Se ha planificado correctamente.'
              });
              this.router.navigate(['/picking/listadotrabajopendiente']);
            } else {
              // ⚠️ Caso error de negocio (ej. no hay stock)
              this.messageService.add({
                severity: 'warn',
                summary: 'Planificación fallida',
                detail: resp.observacion || 'No se pudo planificar el picking'
              });
            }
          },
          (error) => {
            // ❌ Caso error HTTP (400, 500, etc.)
            this.messageService.add({
              severity: 'error',
              summary: 'Error en el servidor',
              detail: error.message || 'Error inesperado'
            });
          }
        );

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