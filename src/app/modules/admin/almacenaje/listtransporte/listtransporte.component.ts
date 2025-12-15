import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { EquipoTransporte } from '../../recepcion/recepcion.types';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RecepcionService } from '../../recepcion/recepcion.service';
import { forkJoin } from 'rxjs';
import { AlmacenService } from '../../_services/almacen.service';
import { AlmacenajeService } from '../almacenaje.service';
import { PropietarioService } from '../../_services/propietario.service';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { Ubicacion } from '../../planning/planning.types';
import { PlanningService } from '../../planning/planning.service';
import { OrdenRecibo, OrdenReciboDetalle } from '../../recepcion/recepcion.types';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InventarioService } from '../../_services/inventario.service';
import { ProductoService } from '../../_services/producto.service';
import { InventarioGeneral } from '../../_models/inventariogeneral';

@Component({
  selector: 'app-listtransporte',
  templateUrl: './listtransporte.component.html',
  styleUrls: ['./listtransporte.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    DropdownModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    CalendarModule,
    InputNumberModule,
    InputTextModule
    ],
    providers: [ ConfirmationService,
      MessageService 
    ]
})
export class ListtransporteComponent implements OnInit {

  cols = [
    { header: 'ACCIONES', field: 'id', width: '100px' },
    { header: 'PLACA', field: 'placa', width: '100px' },
    { header: 'MARCA', field: 'marca', width: '100px' },
    { header: 'TIPO VEHÍCULO', field: 'equipotransporte', width: '140px' },
    { header: 'EQ. TRANSPORTE', field: 'equipoTransporte', width: '180px' },
    { header: 'PUERTA', field: 'puerta', width: '140px' },
    { header: 'ESTADO', field: 'fechaEsperada', width: '130px' },
  ];

  es: any;
  loading = false;
  transportes: EquipoTransporte[] = [];
  clientes: SelectItem[] = [];
  almacenes: SelectItem[] = [];
  model: any = {};

  dateInicio: Date = new Date();
  dateFin: Date = new Date();

  // Modal Asignar Puerta
  displayAsignarPuertaDialog: boolean = false;
  puertas: Ubicacion[] = [];
  loadingPuertas: boolean = false;
  equipoTransporteIdSeleccionado: number = 0;
  almacenIdSeleccionado: number = 0;

  // Modal Órdenes de Recibo
  displayOrdenesReciboDialog: boolean = false;
  ordenesRecibo: any[] = [];
  loadingOrdenesRecibo: boolean = false;
  equipoTransporteSeleccionado: any = null;
  
  colsOrdenes = [
    { header: 'ACCIONES', field: 'ordenReciboId', width: '180px' },
    { header: 'N° ORDEN', field: 'numOrden', width: '100px' },
    { header: 'ALMACÉN', field: 'almacen', width: '120px' },
    { header: 'PROPIETARIO', field: 'propietario', width: '140px' },
    { header: 'ESTADO', field: 'nombreEstado', width: '120px' },
    { header: 'UBICACIÓN', field: 'ubicacion', width: '120px' },
    { header: 'F. REGISTRO', field: 'fechaRegistro', width: '120px' },
  ];

  // Modal Identificar Recibo Múltiple
  displayIdentificarReciboDialog: boolean = false;
  ordenReciboSeleccionada: OrdenRecibo | null = null;
  ordenDetalles: OrdenReciboDetalle[] = [];
  loadingIdentificar: boolean = false;
  ordenReciboIdSeleccionado: number = 0;
  
  // Formulario de identificación
  modelDetail: any = {};
  addInventario: Partial<InventarioGeneral>[] = [];
  inventario: InventarioGeneral[] = [];
  huellas: SelectItem[] = [];
  huellaDetalle: SelectItem[] = [];
  nivel: SelectItem[] = [];
  sobredimensionado: boolean = false;
  
  colsDetalles = [
    { header: 'L.', field: 'linea', width: '50px' },
    { header: 'SKU', field: 'codigo', width: '100px' },
    { header: 'PRODUCTO', field: 'producto', width: '190px' },
    { header: 'CANT', field: 'cantidad', width: '80px' },
    { header: 'PEND', field: 'pendiente', width: '80px' },
    { header: 'FALT', field: 'faltante', width: '80px' },
    { header: 'ESTADO', field: 'estado', width: '80px' },
  ];
  
  colsPallets = [
    { header: 'ACC', field: 'numOrden', width: '40px' },
    { header: 'SKU', field: 'codigo', width: '80px' },
    { header: 'PRODUCTO', field: 'descripcionLarga', width: '150px' },
    { header: 'CANT', field: 'cantidad', width: '60px' },
    { header: 'ESTADO', field: 'completo', width: '80px' },
  ];
  
  colsInventario = [
    { header: 'ACC', field: 'numOrden', width: '40px' },
    { header: 'LOTNUM', field: 'lodNum', width: '60px' },
    { header: 'PRODUCTO', field: 'descripcionLarga', width: '130px' },
    { header: 'UBICACIÓN', field: 'ubicacion', width: '100px' },
    { header: 'CANT', field: 'untQty', width: '60px' },
    { header: 'SERIADO', field: 'seriado', width: '70px' },
    { header: '#Scaneados', field: 'scanQty', width: '70px' },
  ];

  estados: SelectItem[] = [
    { value: 131, label: 'Llegada y Asignado' },
    { value: 13, label: 'Llegada' },
    { value: 14, label: 'Asignado' },
    { value: 15, label: 'En Descarga' },
    { value: 16, label: 'Cerrado' },
  ];

  constructor(
    private almacenajeService:  AlmacenajeService,
    private generalService: GeneralService,
    private propietarioService: PropietarioService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private recepcionService: RecepcionService,
    private inventarioService: InventarioService,
    private productoService: ProductoService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.configurarCalendario();
    this.inicializarFechas();
    this.cargarCombosIniciales();
    
    // Verificar si hay un parámetro en la ruta para abrir el modal automáticamente
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['equipoTransporteId']) {
        const equipoTransporteId = Number(params['equipoTransporteId']);
        if (equipoTransporteId && !isNaN(equipoTransporteId)) {
          // Esperar a que se carguen los transportes antes de abrir el modal
          setTimeout(() => {
            this.openEquipoTransporte(equipoTransporteId);
          }, 500);
        }
      }
    });
  }

  private configurarCalendario(): void {
    this.es = {
      firstDayOfWeek: 1,
      dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
      dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      monthNames: [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ],
      monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
      today: 'Hoy',
      clear: 'Borrar'
    };
  }

  private inicializarFechas(): void {
    const hoy = new Date();
    this.dateInicio = new Date(hoy);
    this.dateInicio.setDate(hoy.getDate() - 5);
    this.dateFin = hoy;

    this.model = {
      fec_ini: this.dateInicio,
      fec_fin: this.dateFin,
      EstadoId: 131
    };
  }

  private cargarCombosIniciales(): void {
    this.loading = true;

    forkJoin([
      this.generalService.getAllAlmacenes(),
      this.propietarioService.getAllPropietarios()
    ]).subscribe({
      next: ([almacenes, propietarios]) => {
        this.almacenes = almacenes.map(a => ({ value: a.id, label: a.descripcion }));
        this.clientes = propietarios.map(c => ({ label: c.razonSocial.toUpperCase(), value: c.id }));

        this.model.PropietarioId = parseInt(localStorage.getItem('PropietarioId') || '1', 10);
        this.model.AlmacenId = parseInt(localStorage.getItem('AlmacenId') || '1', 10);

        this.cargarTransportes();
      },
      error: () => this.loading = false
    });
  }

  private cargarTransportes(): void {
    if (!this.model.EstadoId || !this.model.PropietarioId || !this.model.AlmacenId) {
      console.warn('Faltan parámetros requeridos para cargar transportes');
      this.loading = false;
      return;
    }

    this.almacenajeService.ListarEquiposTransporte(
      this.model.EstadoId,
      this.model.PropietarioId,
      this.model.AlmacenId
    ).subscribe({
      next: (list) => {
        this.transportes = list || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar transportes:', err);
        this.transportes = [];
        this.loading = false;
      }
    });
  }

  buscar(): void {
    this.loading = true;
    this.model.fec_ini = this.dateInicio;
    this.model.fec_fin = this.dateFin;

    localStorage.setItem('AlmacenId', this.model.AlmacenId);
    localStorage.setItem('PropietarioId', this.model.PropietarioId);
    localStorage.setItem('Intervalo', this.model.intervalo);
    localStorage.setItem('Estado', this.model.EstadoId);

    this.cargarTransportes();
  }

  openDoor(id: number, almacenId: number): void {
    this.equipoTransporteIdSeleccionado = id;
    this.almacenIdSeleccionado = almacenId;
    this.displayAsignarPuertaDialog = true;
    this.cargarPuertas(almacenId);
  }

  cargarPuertas(almacenId: number): void {
    this.loadingPuertas = true;
    this.generalService.getPuertas(almacenId, 1).subscribe({
      next: (list) => {
        this.puertas = list || [];
        this.loadingPuertas = false;
      },
      error: (err) => {
        console.error('Error al cargar puertas:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las puertas disponibles.'
        });
        this.loadingPuertas = false;
      }
    });
  }

  asignarPuerta(puertaId: number): void {
    this.loadingPuertas = true;
    // PlanningService.assignmentOfDoor espera un string con los IDs separados por comas
    const ids = String(this.equipoTransporteIdSeleccionado);
    this.recepcionService.assignmentOfDoor(ids, puertaId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'La puerta fue asignada correctamente.'
        });
        this.displayAsignarPuertaDialog = false;
        this.loadingPuertas = false;
        // Recargar la lista de transportes
        this.cargarTransportes();
      },
      error: (err) => {
        console.error('Error al asignar puerta:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo asignar la puerta.'
        });
        this.loadingPuertas = false;
      }
    });
  }

  openEquipoTransporte(id: number): void {
    this.equipoTransporteIdSeleccionado = id;
    this.displayOrdenesReciboDialog = true;
    this.cargarOrdenesRecibo(id);
  }

  cargarOrdenesRecibo(equipoTransporteId: number): void {
    this.loadingOrdenesRecibo = true;
    const model = { EquipoTransporteId: equipoTransporteId };
    
    this.recepcionService.getAllByEquipoTransporte(model).subscribe({
      next: (list) => {
        this.ordenesRecibo = list || [];
        if (this.ordenesRecibo.length > 0) {
          this.equipoTransporteSeleccionado = this.ordenesRecibo[0].equipotransporte || '';
        }
        this.loadingOrdenesRecibo = false;
      },
      error: (err) => {
        console.error('Error al cargar órdenes de recibo:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las órdenes de recibo.'
        });
        this.loadingOrdenesRecibo = false;
      }
    });
  }

  identificarMultiple(ordenReciboId: number): void {
    this.router.navigate(['/recibo/identificar-recibo-multiple', ordenReciboId, this.equipoTransporteIdSeleccionado]);
    this.displayOrdenesReciboDialog = false;
  }
  
  cargarOrdenRecibo(id: number): void {
    this.loadingIdentificar = true;
    this.recepcionService.obtenerOrden(id).subscribe({
      next: (resp) => {
        this.ordenReciboSeleccionada = resp;
        this.ordenDetalles = resp.detalles || [];
        this.loadingIdentificar = false;
        this.mostrarInventario();
      },
      error: (err) => {
        console.error('Error al cargar orden:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la orden de recibo.'
        });
        this.loadingIdentificar = false;
      }
    });
  }
  
  identificar(event: any): void {
    const detalleId = event.data?.id;
    if (!detalleId) return;
    
    this.loadingIdentificar = true;
    this.recepcionService.obtenerOrdenDetalle(detalleId).subscribe({
      next: (resp) => {
        this.modelDetail = resp;
        this.modelDetail.untQty = resp.cantidad;
        this.modelDetail.LotNum = resp.lote;
        
        // Cargar huellas
        this.productoService.getHuellas(resp.productoId).subscribe(huellas => {
          this.huellas = huellas.map(h => ({
            value: h.id,
            label: `${h.codigoHuella} - Cama de ${h.caslvl}`
          }));
          if (this.huellas.length > 0) {
            this.modelDetail.huellaId = this.huellas[0].value;
          }
        });
        
        if (this.estados.length > 0) {
          this.modelDetail.estadoId = this.estados[0].value;
        }
        
        this.loadingIdentificar = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.loadingIdentificar = false;
      }
    });
  }
  
  onChangeHuella(huella: any): void {
    this.huellaDetalle = [];
    if (!huella?.value) return;
    
    this.productoService.getHuellasDetalle(huella.value).subscribe(resp => {
      resp.forEach(element => {
        this.huellaDetalle.push({
          value: element.unidadMedidaId,
          label: `${element.unidadMedida} - ${element.untQty} Unidades`
        });
      });
    });
  }
  
  onBlurLotNum(lotnum: string): void {
    if (!lotnum || !this.modelDetail.productoId) return;
    
    this.inventarioService.GetInventarioByLotNum(this.modelDetail.productoId, lotnum).subscribe(resp => {
      if (resp.fechaManufactura) {
        this.modelDetail.fechaManufactura = new Date(resp.fechaManufactura);
      }
      if (resp.fechaExpire) {
        this.modelDetail.fechaExpire = new Date(resp.fechaExpire);
      }
    });
  }
  
  actualizar(): void {
    let total = 0;
    const productos = this.addInventario.filter(e => e.productoId === this.modelDetail.productoId);
    productos.forEach(x => {
      total += (x.untQty || 0);
    });
    
    this.addInventario.push({
      productoId: this.modelDetail.productoId,
      untQty: this.modelDetail.untQty,
      descripcionLarga: this.modelDetail.producto,
      lotNum: this.modelDetail.LotNum,
      huellaId: +this.modelDetail.huellaId,
      codigo: this.modelDetail.codigo,
      linea: this.modelDetail.linea,
      estadoId: this.modelDetail.estadoId,
      estado: this.estados.find(x => x.value === this.modelDetail.estadoId)?.label || '',
      OrdenReciboDetalleId: this.modelDetail.id,
      ordenReciboId: this.ordenReciboIdSeleccionado,
      id: this.addInventario.length,
      fechaManufactura: this.modelDetail.fechaManufactura,
      fechaExpire: this.modelDetail.fechaExpire,
      referencia: this.modelDetail.referencia,
      peso: this.modelDetail.peso
    });
    
    const detalle = this.ordenDetalles.find(x => x.productoId === this.modelDetail.productoId);
    if (detalle) {
      detalle.cantidadRecibida = (detalle.cantidadRecibida || 0) + total + (this.modelDetail.cantidadRecibida || 0);
    }
  }
  
  eliminarPallet(id: number): void {
    const index = this.addInventario.findIndex(x => x.id === id);
    if (index > -1) {
      this.addInventario.splice(index, 1);
    }
  }
  
  generarPallet(): void {
    this.loadingIdentificar = true;
    const sobredimensionadoId = this.sobredimensionado ? this.modelDetail.sobredimensionadoId : undefined;
    
    this.recepcionService.identificar_detallemultiple(this.addInventario as any, sobredimensionadoId?.toString()).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pallet generado correctamente.'
        });
        this.addInventario = [];
        this.modelDetail = {};
        this.cargarOrdenRecibo(this.ordenReciboIdSeleccionado);
      },
      error: (err) => {
        console.error('Error al generar pallet:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el pallet.'
        });
        this.loadingIdentificar = false;
      }
    });
  }
  
  generarPallets(): void {
    this.loadingIdentificar = true;
    this.recepcionService.identificar_detalle(this.modelDetail).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pallets generados correctamente.'
        });
        this.modelDetail = {};
        this.cargarOrdenRecibo(this.ordenReciboIdSeleccionado);
      },
      error: (err) => {
        console.error('Error:', err);
        this.loadingIdentificar = false;
      }
    });
  }
  
  agregarFaltantes(): void {
    this.loadingIdentificar = true;
    this.recepcionService.identificar_faltante([this.modelDetail]).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Faltante registrado correctamente.'
        });
        this.modelDetail = {};
        this.cargarOrdenRecibo(this.ordenReciboIdSeleccionado);
      },
      error: (err) => {
        console.error('Error:', err);
        this.loadingIdentificar = false;
      }
    });
  }
  
  terminarIdentificacion(): void {
    if (!this.ordenReciboSeleccionada || 
        (this.ordenReciboSeleccionada.nombreEstado !== 'Asignado' && 
         this.ordenReciboSeleccionada.nombreEstado !== 'Recibiendo')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'La orden ya fue identificada o no está en estado válido.'
      });
      return;
    }
    
    this.confirmationService.confirm({
      message: '¿Está seguro de terminar la identificación?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loadingIdentificar = true;
        this.recepcionService.cerrar_identificacion(this.ordenReciboIdSeleccionado).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Identificación terminada correctamente.'
            });
            const url = `http://104.36.166.65/reptwh/impresionEtiquetas_twh.aspx?orden=${this.ordenReciboIdSeleccionado}`;
            window.open(url);
            this.displayIdentificarReciboDialog = false;
            this.cargarOrdenesRecibo(this.equipoTransporteIdSeleccionado);
          },
          error: (err) => {
            console.error('Error:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Tiene líneas pendientes por identificar.'
            });
            this.loadingIdentificar = false;
          }
        });
      }
    });
  }
  
  mostrarInventario(): void {
    if (!this.ordenReciboIdSeleccionado) return;
    this.inventarioService.GetAllInventario(this.ordenReciboIdSeleccionado).subscribe(resp => {
      this.inventario = resp;
    });
  }
  
  changeSobredimensionado(event: any): void {
    this.sobredimensionado = event.checked;
    if (!event.checked) {
      this.modelDetail.sobredimensionadoId = null;
    }
  }

  acomodo(ordenReciboId: number): void {
    this.router.navigate(['recibo/acomodopallets', ordenReciboId, this.equipoTransporteIdSeleccionado]);
    this.displayOrdenesReciboDialog = false;
  }

  almacenar(ordenReciboId: number): void {
    this.router.navigate(['recibo/almacenamiento', ordenReciboId, this.equipoTransporteIdSeleccionado]);
    this.displayOrdenesReciboDialog = false;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Asignado':
      case 'Recibiendo':
        return 'bg-gray-600 text-white';
      case 'Pendiente Acomodo':
      case 'Pendiente Almacenamiento':
        return 'bg-red-600 text-white';
      case 'Almacenado':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  }
}