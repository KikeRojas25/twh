import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { PropietarioService } from '../../_services/propietario.service';

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
  ids = '';
  model_pendientes: any = {};

  // Tablas
  listData: OrdenSalida[] = [];
  listData1: OrdenSalida[] = [];
  selectedRow: OrdenSalida[] = [];
  ordeneseleccionadas: OrdenSalida[] = [];
  selectedRows: OrdenSalida[] = []; // Filas seleccionadas en la tabla principal

  rows: number = 10;

  // Resumen
  totalOrdenes = 0;
  totalProductos = 0;
  totalUnidades = 0;
  asignadas = 0;
  totalPeso = 0;

  // Contador de selección
  cantidadOTsSeleccionadas = 0;
  unidadesSeleccionadas = 0;
  pesoSeleccionado = 0;

  // Modelos
  model: any = {};
  loading = false;
  propietariosCargados = false;
  almacenesCargados = false;

  jwtHelper = new JwtHelperService();
  decodedToken: any = {};
  

  constructor(
    private planningService: PlanningService,
    private propietarioService: PropietarioService,
    private generalService: GeneralService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {


    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);



    
    // Cargar filtros guardados antes de cargar los dropdowns
    this.cargarFiltrosGuardados();


    this.cargarPropietarios();
    this.cargarAlmacenes();

    // No llamar buscar aquí, se llamará después de cargar los propietarios


  }
  
  cargarFiltrosGuardados() {
    // Recuperar PropietarioId desde localStorage (usando el mismo prefijo que el componente de lista)
    const propietarioId = localStorage.getItem('despachos_PropietarioId');
    if (propietarioId) {
      this.model.PropietarioId = parseInt(propietarioId, 10);
    }

    // Recuperar AlmacenId si está guardado
    const almacenId = localStorage.getItem('despachos_AlmacenId');
    if (almacenId) {
      this.model.AlmacenId = almacenId;
    }

    // También intentar cargar desde el filtro antiguo por compatibilidad
    const savedFilter = localStorage.getItem('filtroPicking');
    if (savedFilter) {
      try {
        const parsedFilter = JSON.parse(savedFilter);
        // Solo usar si no hay valores desde despachos_
        if (!this.model.PropietarioId && parsedFilter.PropietarioId) {
          this.model.PropietarioId = parsedFilter.PropietarioId;
        }
        if (!this.model.AlmacenId && parsedFilter.AlmacenId) {
          this.model.AlmacenId = parsedFilter.AlmacenId;
        }
      } catch (e) {
        console.error('Error al parsear filtro guardado:', e);
      }
    }
  }
  
  cargarPropietarios() {
    this.propietarioService.getAllPropietarios().subscribe((resp) => {
      this.propietarios = resp.map((propietario) => ({
        label: propietario.razonSocial,
        value: propietario.id
      }));
      
      // Después de cargar los propietarios, restaurar el propietario guardado
      this.restaurarPropietarioSeleccionado();
      
      this.propietariosCargados = true;
      this.intentarBuscar();
    });
  }

  cargarAlmacenes() {
    this.generalService.getAllAlmacenes().subscribe((resp) => {
      this.almacenes = resp.map((almacen) => ({
        label: almacen.descripcion,
        value: almacen.id
      }));
      
      // Después de cargar los almacenes, restaurar el almacén guardado
      this.restaurarAlmacenSeleccionado();
      
      this.almacenesCargados = true;
      this.intentarBuscar();
    });
  }

  restaurarAlmacenSeleccionado() {
    const almacenIdGuardado = localStorage.getItem('despachos_AlmacenId');
    if (almacenIdGuardado && this.almacenes.length > 0) {
      // Intentar encontrar por valor numérico o string
      const almacenIdNum = parseInt(almacenIdGuardado, 10);
      const existe = this.almacenes.find(a => 
        a.value === almacenIdNum || 
        a.value === almacenIdGuardado ||
        (a.value !== undefined && a.value.toString() === almacenIdGuardado)
      );
      if (existe) {
        this.model.AlmacenId = existe.value;
        console.log('Almacén restaurado en planificarpicking:', existe.label);
      }
    }
  }

  restaurarPropietarioSeleccionado() {
    const propietarioIdGuardado = localStorage.getItem('despachos_PropietarioId');
    if (propietarioIdGuardado && this.propietarios.length > 0) {
      const id = parseInt(propietarioIdGuardado, 10);
      const existe = this.propietarios.find(p => p.value === id);
      if (existe) {
        this.model.PropietarioId = id;
        console.log('Propietario restaurado en planificarpicking:', existe.label);
      }
    }
  }

  intentarBuscar() {
    // Solo buscar cuando ambos dropdowns estén cargados y haya filtros válidos
    if (this.propietariosCargados && this.almacenesCargados && 
        this.model.PropietarioId && this.model.AlmacenId) {
      this.buscar();
    }
  }

  guardarFiltros() {
    // Guardar usando el mismo sistema que el componente de lista (con prefijo despachos_)
    if (this.model.PropietarioId !== null && this.model.PropietarioId !== undefined) {
      localStorage.setItem('despachos_PropietarioId', this.model.PropietarioId.toString());
      localStorage.setItem('PropietarioId', this.model.PropietarioId.toString());
    } else {
      localStorage.removeItem('despachos_PropietarioId');
      localStorage.removeItem('PropietarioId');
    }

    if (this.model.AlmacenId) {
      localStorage.setItem('despachos_AlmacenId', this.model.AlmacenId);
      localStorage.setItem('AlmacenId', this.model.AlmacenId);
    } else {
      localStorage.removeItem('despachos_AlmacenId');
      localStorage.removeItem('AlmacenId');
    }

    // También guardar en el formato antiguo por compatibilidad
    localStorage.setItem('filtroPicking', JSON.stringify(this.model));
  }

  buscar() {
    if (!this.model.PropietarioId || !this.model.AlmacenId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar un propietario y un almacén.'
      });
      return;
    }

    // Guardar filtros antes de buscar
    this.guardarFiltros();

    this.loading = true;
    this.planningService.getAllOrdenSalidaPendientes(this.model).subscribe((list) => {
      this.listData = list;
      // Calcular peso total sumando los pesos de las órdenes pendientes
      // Asegurar que el peso se convierta a número antes de sumar
      this.totalPeso = list.reduce((sum, orden) => {
        const peso = orden.peso ? parseFloat(orden.peso.toString()) : 0;
        return sum + (isNaN(peso) ? 0 : peso);
      }, 0);
      this.actualizarResumen();
      this.loading = false;
    }, (error) => {
      this.loading = false;
      console.error('Error al buscar órdenes pendientes:', error);
    });
  }

  actualizarResumen() {
    this.planningService.getAllOrdenSalidaPendientesResumen(this.model).subscribe((resumen) => {
      this.totalOrdenes = resumen.ordenes;
      this.totalProductos = resumen.productos;
      this.totalUnidades = resumen.unidades;
      // El peso total se calcula desde listData en buscar() para asegurar que sea la suma correcta
      // No sobrescribir con resumen.asignadas o resumen.peso ya que puede no ser correcto
    });
  }

  agregarorden() {
    this.ordeneseleccionadas.push(...this.selectedRows);
    this.listData = this.listData.filter((orden) => !this.selectedRows.includes(orden));
    this.selectedRows = [];
    this.actualizarContadorSeleccion();
  }

  actualizarContadorSeleccion() {
    // Calcular totales de las órdenes seleccionadas
    this.cantidadOTsSeleccionadas = this.selectedRows ? this.selectedRows.length : 0;
    this.unidadesSeleccionadas = (this.selectedRows || []).reduce((sum, orden) => {
      const unidades = orden.unidades ? parseFloat(orden.unidades.toString()) : 0;
      return sum + (isNaN(unidades) ? 0 : unidades);
    }, 0);
    this.pesoSeleccionado = (this.selectedRows || []).reduce((sum, orden) => {
      const peso = orden.peso ? parseFloat(orden.peso.toString()) : 0;
      return sum + (isNaN(peso) ? 0 : peso);
    }, 0);
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  eliminar(orden: OrdenSalida) {
    this.ordeneseleccionadas = this.ordeneseleccionadas.filter((o) => o !== orden);
    this.listData.push(orden);
  }

  comprobar() {
    if (this.ordeneseleccionadas.length === 0) {
      
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar al menos una orden de salida.'
      });
      return;
    }
    console.log('Planificando masivamente las órdenes seleccionadas:', this.ordeneseleccionadas);
  }

  
}