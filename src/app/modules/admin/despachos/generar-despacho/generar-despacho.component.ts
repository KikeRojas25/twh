import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
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
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';
import { OrdenSalida } from '../despachos.types';
import { PlanningService } from '../../planning/planning.service';
import { PropietarioService } from '../../_services/propietario.service';
import { DespachosService } from '../despachos.service';
import { MantenimientoService } from '../../mantenimientos/mantenimiento.service';

@Component({
  selector: 'app-generar-despacho',
  templateUrl: './generar-despacho.component.html',
  styleUrls: ['./generar-despacho.component.css'],
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
        InputIconModule,
        TooltipModule,
        AutoCompleteModule
      ],
      providers: [
        DialogService ,
        MessageService ,
        ConfirmationService 
    
      ]
})
export class GenerarDespachoComponent implements OnInit {

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
  expandedGroups: { [key: string]: boolean } = {}; // Control de grupos expandidos

  vehicleTypes: SelectItem[] = []; // Lista de tipos de vehículo
  placas: SelectItem[] = []; // Lista de placas
  conductores: any[] = []; // Lista de conductores
  filteredConductores: any[] = []; // Conductores filtrados para autocomplete
  selectedConductor: any; // Conductor seleccionado

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
    placa: null,
    fechaProgramada: null,
    conductorId: null,
    guiaRemision: ''
  };

  constructor(
    private planningService: PlanningService,
    private despachosService: DespachosService,
    private clienteService: ClienteService,
    private propietarioService: PropietarioService,
    private generalService: GeneralService,
    private mantenimientoService: MantenimientoService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService ,
  ) {}

  ngOnInit(): void {


    this.cargarFiltrosGuardados();


    this.cargarPropietarios();
    this.cargarAlmacenes();
    this.cargarTiposVehiculo();

    this.buscar();



  }
  cargarFiltrosGuardados() {
    const savedFilter = localStorage.getItem('filtroGenerarDespacho');
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
    });
  }

  cargarAlmacenes() {
    this.generalService.getAllAlmacenes().subscribe((resp) => {
      this.almacenes = resp.map((almacen) => ({
        label: almacen.descripcion,
        value: almacen.id
      }));
    });
  }

  cargarTiposVehiculo() {
    this.generalService.getValorTabla(4).subscribe(resp => {
      this.vehicleTypes = resp.map((x) => ({
        value: x.id,
        label: x.valorPrincipal
      }));
    });
  }

  guardarFiltros() {
    localStorage.setItem('filtroGenerarDespacho', JSON.stringify(this.model));
  }
  calculateGroupTotals() {
    this.groupedTotals = {};
  
    this.listData.forEach(row => {
      let estado = row.estado;

      console.log('estado:', estado);
  
      if (!this.groupedTotals[estado]) {
        this.groupedTotals[estado] = { pesoTotal: 0, productosTotal: 0, unidadesTotal: 0 };
        // Inicializar todos los grupos como colapsados por defecto
        if (this.expandedGroups[estado] === undefined) {
          this.expandedGroups[estado] = false;
        }
      }
  
      this.groupedTotals[estado].pesoTotal += row.peso || 0;
      this.groupedTotals[estado].productosTotal += row.productos || 0;
      this.groupedTotals[estado].unidadesTotal += row.unidades || 0;
    });
  }

  toggleGroup(estado: string) {
    this.expandedGroups[estado] = !this.expandedGroups[estado];
  }

  isGroupExpanded(estado: string): boolean {
    return this.expandedGroups[estado] === true; // Por defecto colapsado
  }

  expandirTodos() {
    // Obtener todos los estados únicos de listData
    const estadosUnicos = [...new Set(this.listData.map(row => row.estado))];
    estadosUnicos.forEach(estado => {
      this.expandedGroups[estado] = true;
    });
  }

  colapsarTodos() {
    // Obtener todos los estados únicos de listData
    const estadosUnicos = [...new Set(this.listData.map(row => row.estado))];
    estadosUnicos.forEach(estado => {
      this.expandedGroups[estado] = false;
    });
  }
  

  buscar() {

    this.ordeneseleccionadas = [];



    if (!this.model.PropietarioId || !this.model.AlmacenId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar un propietario y un almacén.'
      });
      return;
    }


    this.loading = true;
    this.planningService.getAllOrdenSalida(this.model).subscribe((list) => {
      this.listData = list;

      console.log(this.listData);

      this.actualizarResumen();
      
    this.calculateGroupTotals();

      this.guardarFiltros(); // Guarda el filtro en localStorage
      this.loading = false;

    });
  }


  onRowSelectOrUnselect() {
    this.totalPesoSeleccionado = this.selectedRows.reduce((acc, row) => acc + (row.peso || 0), 0);
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
    this.onRowSelectOrUnselect();
  }

  eliminar(orden: OrdenSalida) {
    this.ordeneseleccionadas = this.ordeneseleccionadas.filter((o) => o !== orden);
    this.listData.push(orden);
    this.onRowSelectOrUnselect();
  }

  generarDespacho(){

    if (this.ordeneseleccionadas.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar al menos una orden de salida para generar el despacho.'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `
        <p>
          ¿Está seguro que desea generar el despacho para ${this.ordeneseleccionadas.length} orden(es) seleccionada(s)?<br>
        </p>
      `,
      header: 'Generar Despacho',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
   
    
  
        
    this.ids = '';
    this.ordeneseleccionadas.forEach( element => {
      this.ids  = this.ids + ',' + String(element.id);
    });
    this.model_pendientes.ids = this.ids.substring(1);

    this.loading = true;

    this.despachosService.registrar_salidacarga(this.model_pendientes).subscribe({
      next: (resp) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Despacho generado correctamente'
        });
        this.ordeneseleccionadas = [];
        this.buscar();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al generar el despacho. Por favor, intente nuevamente.'
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
             
  
      },
      reject: () => {
  
      }
    });
  }

  planificar(){

    this.ids = '';

    // Limpiar solo placas (los tipos de vehículo ya están cargados)
    this.placas = [];
    this.selectedConductor = null;
    this.filteredConductores = [];

    // Cargar placas
    this.mantenimientoService.getAllVehiculos('').subscribe((vehiculos) => {
      this.placas = vehiculos.map((vehiculo) => ({
        label: vehiculo.placa,
        value: vehiculo.placa
      }));
    });

    // Cargar conductores
    this.mantenimientoService.getAllConductores().subscribe((conductores) => {
      this.conductores = conductores;
    });

    if (this.ordeneseleccionadas.length === 0) {
      // Mostrar mensaje de advertencia
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar al menos una orden de salida para planificar.'
      });
      return; // Detener la ejecución si no hay órdenes seleccionadas
    }
    this.planificarForm = {
      placa: null,
      fechaProgramada: null,
      conductorId: null,
      guiaRemision: ''
    };
    this.displayPlanificarDialog = true;
    
  

  }

  filterConductores(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredConductores = this.conductores.filter((conductor) => {
      const nombreCompleto = conductor.nombreCompleto?.toLowerCase() || '';
      const dni = conductor.dni?.toLowerCase() || '';
      return nombreCompleto.includes(query) || dni.includes(query);
    });
  }

  onConductorSelect(event: any): void {
    this.planificarForm.conductorId = event?.id;
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
    this.model_pendientes.ids = this.ids.substring(1);

    this.model_pendientes.placa = this.planificarForm.placa;
    this.model_pendientes.fechaDespacho = this.planificarForm.fechaProgramada;
    this.model_pendientes.conductorId = this.planificarForm.conductorId;
    this.model_pendientes.guiaRemision = this.planificarForm.guiaRemision;

    // Obtener ID del usuario desde el token
    const token = localStorage.getItem('token');
    const jwtHelper = new JwtHelperService();
    const decodedToken = token ? jwtHelper.decodeToken(token) : null;
    const usuarioId = decodedToken?.nameid ? Number(decodedToken.nameid) : 0;
    this.model_pendientes.UsuarioId = usuarioId;

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

  
}
