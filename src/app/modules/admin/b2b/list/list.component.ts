import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
    ConfirmationService,
    MenuItem,
    MessageService,
    SelectItem,
} from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import {
    DialogService,
    DynamicDialogModule,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PropietarioService } from '../../_services/propietario.service';
import { DespachosService } from '../../despachos/despachos.service';
import { OrdenSalida } from '../../despachos/despachos.types';
import { B2bService } from '../b2b.service';
import { PedidoDetalle } from '../b2b.types';
import { PlanningService } from '../../planning/planning.service';
import { WebSocketService } from 'app/core/services/websocket.service';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
    standalone: true,
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
        ConfirmDialogModule,
        SplitButtonModule,
    ],
    providers: [DialogService, MessageService, ConfirmationService],
})
export class ListComponent implements OnInit, OnDestroy {
  private readonly b2bDefaultAlmacenId = 100;
    ref: DynamicDialogRef | undefined;
    ocResults: any[];
    searchCriteria = { oc: '', sku: '' };
    clientes: SelectItem[] = [];
    familias: any[] = [];
    subfamilias: any[] = [];
    cols: any[];
    cols2: any[];
    detalleOCModal = false;
    CicloVidaOCModal = false;
    Items: any[];
    selectedOC: any = {};

    items: MenuItem[];

    jwtHelper = new JwtHelperService();
    decodedToken: any = {};

    selectedRubro: any;
    selectedFamilia: any;
    selectedSubfamilia: any;
    selectedRow: OrdenSalida[] = [];

    model: any = { guiaremision: '' };
    ordenes: OrdenSalida[] = [];
    ordenesFiltradas: OrdenSalida[] = [];
    textoBusqueda: string = '';

    dateInicio: Date = new Date(new Date().setMonth(new Date().getMonth() - 1));
    dateFin: Date = new Date();

    detalleOrdenModal = false;
    detalleProductos: PedidoDetalle[] = [];
    loadingDetalle = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    private normalizeDetalleProducto(item: any): PedidoDetalle {
      return {
        codigo: item?.codigo ?? item?.Codigo ?? '-',
        descripcion: item?.descripcion ?? item?.Descripcion ?? item?.producto ?? item?.Producto ?? '-',
        producto: item?.producto ?? item?.Producto ?? item?.descripcion ?? item?.Descripcion ?? '-',
        cantidad: Number(item?.cantidad ?? item?.Cantidad ?? 0),
        unidadMedida: item?.unidadMedida ?? item?.UnidadMedida ?? item?.unidad ?? item?.Unidad ?? '-',
        lote: item?.lote ?? item?.Lote ?? item?.numeroLote ?? item?.NumeroLote ?? null,
        estado: item?.estado ?? item?.Estado ?? item?.nombreEstado ?? item?.NombreEstado ?? null,
      };
    }

    constructor(
        public dialogService: DialogService,
        private despachosService: DespachosService,
        private propietarioService: PropietarioService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private b2bService: B2bService,
        private planningService: PlanningService,
        private router: Router,
        private webSocketService: WebSocketService
    ) {}

  ngOnInit(): void {
  const token = localStorage.getItem('token');
  this.decodedToken = this.jwtHelper.decodeToken(token);

  // Guardar el id de usuario
  const usuarioId = this.decodedToken.nameid;

  this.cols = [
    { header: 'ACCIONES', field: 'numOrden', width: '180px' },
    { header: 'ORS', field: 'numOrden', width: '120px' },
    { header: 'ESTADO', field: 'nombreEstado', width: '100px' },
    { header: 'GR SALIDA', field: 'guiaRemision', width: '160px' },
    { header: 'ORDEN COMPRA', field: 'ordenCompraCliente', width: '140px' },
    { header: 'REGISTRADO POR', field: 'TipoRegistro', width: '220px' },
    { header: 'F. REQUERIDA', field: 'fechaEsperada', width: '120px' },
    { header: 'F. REGISTRO', field: 'fechaRegistro', width: '120px' },
  ];

  this.propietarioService.getPropietariosByUsuario(usuarioId).subscribe({
    next: (resp) => {
      this.clientes = resp.map((x) => ({
        value: x.id,
        label: x.razonSocial
      }));

      // ✅ Si solo hay un propietario, seleccionarlo automáticamente
      if (this.clientes.length === 1) {
        this.model.PropietarioId = this.clientes[0].value;
      }
    },
    error: (err) => console.error('Error al cargar propietarios:', err),
    complete: () => {
      this.buscar(); // ✅ Buscar una vez que se cargaron los propietarios
      this._initializeWebSocketListeners(); // ✅ Inicializar listeners de WebSocket
    }
  });
  
  // Inicializar ordenesFiltradas como array vacío
  this.ordenesFiltradas = [];
}

  /**
   * Inicializar listeners de SignalR para refrescar automáticamente
   */
  private _initializeWebSocketListeners(): void {
    // Escuchar evento de órdenes actualizadas desde SignalR
    // Usar debounceTime para evitar actualizaciones excesivas (máximo una vez cada 1 segundo)
    this.webSocketService
      .on<any>('OrdenesActualizadas')
      .pipe(
        debounceTime(1000), // Esperar 1 segundo después del último evento antes de procesar
        distinctUntilChanged((prev, curr) => {
          // Solo procesar si el timestamp cambió (evitar duplicados exactos)
          // Retorna true si son iguales (no emitir), false si son diferentes (emitir)
          return prev?.timestamp === curr?.timestamp;
        }),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe((data) => {
        console.log('🔄 Órdenes actualizadas recibidas:', data);
        
        // Actualizar la lista directamente con los datos recibidos
        // El backend envía 'ordenes' (minúscula) no 'Ordenes'
        if (data && data.ordenes && Array.isArray(data.ordenes)) {
          this.ordenes = data.ordenes;
          this.aplicarFiltroBusqueda();
        } else if (data && data.Ordenes && Array.isArray(data.Ordenes)) {
          // Compatibilidad con formato anterior (mayúscula)
          this.ordenes = data.Ordenes;
          this.aplicarFiltroBusqueda();
        } else {
          // Si no vienen las órdenes en el formato esperado, refrescar manualmente
          this.buscar();
        }
      });

    // Escuchar evento NuevaOrden del servidor SignalR
    this.webSocketService
      .on<any>('NuevaOrden')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        console.log('📦 Nueva orden recibida desde SignalR:', data);
        
        // Mostrar mensaje informativo
        const ordenId = data?.OrdenId || data?.ordenId || data?.ordenSalidaId || 'N/A';
        this.messageService.add({
          severity: 'success',
          summary: 'Nueva Orden Creada',
          detail: `Se ha creado una nueva orden: ${ordenId}`,
          life: 5000
        });

        // Refrescar la búsqueda de órdenes
        this.buscar();
      });

    // Escuchar evento específico de nuevo pedido registrado
    this.webSocketService
      .on<any>('nuevoPedidoB2B')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pedidoData) => {
        console.log('🆕 Nuevo pedido registrado, refrescando lista...', pedidoData);
        
        // Mostrar mensaje informativo
        const numOrden = pedidoData?.numOrden || pedidoData?.NumOrden || pedidoData?.ordenSalidaId || 'N/A';
        this.messageService.add({
          severity: 'success',
          summary: 'Nuevo Pedido Registrado',
          detail: `Se ha registrado un nuevo pedido: ${numOrden}`,
          life: 5000
        });

        // Refrescar la búsqueda de órdenes
        this.buscar();
      });

    // Escuchar evento genérico de actualización de pedidos
    this.webSocketService
      .on<any>('pedidoActualizado')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pedidoData) => {
        console.log('🔄 Pedido actualizado, refrescando lista...', pedidoData);
        // Refrescar la búsqueda de órdenes
        this.buscar();
      });

    // Escuchar evento genérico de actualización de pedidos
    this.webSocketService
      .on<any>('pedidoActualizado')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pedidoData) => {
        console.log('🔄 Pedido actualizado, refrescando lista...', pedidoData);
        this.buscar();
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }


    buscar() {
        this.model.fec_ini = this.dateInicio;
        this.model.fec_fin = this.dateFin;

   

        this.despachosService
            .getAllOrdenSalida(this.model)
            .subscribe((list) => {
                this.ordenes = list;
                this.aplicarFiltroBusqueda();
                console.log('ordenes', this.ordenes);
            });
    }

    aplicarFiltroBusqueda(): void {
        // Validar que ordenes exista y tenga datos
        if (!this.ordenes || this.ordenes.length === 0) {
            this.ordenesFiltradas = [];
            return;
        }
        
        if (!this.textoBusqueda || this.textoBusqueda.trim() === '') {
            this.ordenesFiltradas = [...this.ordenes];
        } else {
            const busqueda = this.textoBusqueda.toLowerCase().trim();
            this.ordenesFiltradas = this.ordenes.filter(orden => {
                const ors = (orden.numOrden || '').toLowerCase();
                const grSalida = (orden.guiaRemision || '').toLowerCase();
                const ordenCompra = (orden.ordenCompraCliente || '').toLowerCase();
                // Buscar en usuarioregistro que es el campo que se muestra en la tabla
                const registradoPor = (orden.usuarioregistro || '').toLowerCase();
                
                return ors.includes(busqueda) ||
                       grSalida.includes(busqueda) ||
                       ordenCompra.includes(busqueda) ||
                       registradoPor.includes(busqueda);
            });
        }
    }

    onBusquedaChange(): void {
        this.aplicarFiltroBusqueda();
    }

    
        edit(id: number, propietarioId?: number): void {
          const propietarioNavegacion = Number(propietarioId || this.model?.PropietarioId || 0);
          const navExtras = propietarioNavegacion > 0
           ? { queryParams: { propietarioId: propietarioNavegacion } }
           : undefined;

          this.router.navigate(['/b2b/edit', id], navExtras);
    }


  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Creado':
        return 'estado-creado';
      case 'Planificado':
        return 'estado-planificado';
      case 'Asignado':
        return 'estado-asignado';
      case 'Despachado':
        return 'estado-despachado';
      case 'Validado':
        return 'estado-validado';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  private esRespuestaPlanificacionExitosa(resp: any): boolean {
    const bandera = resp?.resultado ?? resp?.success ?? resp?.ok ?? resp?.estado ?? resp?.status;

    if (typeof bandera === 'boolean') {
      return bandera;
    }

    if (typeof bandera === 'number') {
      return bandera === 1 || bandera === 200;
    }

    if (typeof bandera === 'string') {
      const valor = bandera.trim().toLowerCase();
      return ['true', 'ok', 'success', 'exito', 'exitoso', 'planificado', 'planificada'].includes(valor);
    }

    return false;
  }

  private extraerMensajePlanificacion(resp: any, fallback: string): string {
    if (!resp) {
      return fallback;
    }

    const mensajeDirecto =
      resp?.Observacion ??
      resp?.observacion ??
      resp?.message ??
      resp?.Message ??
      resp?.mensaje ??
      resp?.error ??
      null;

    if (typeof mensajeDirecto === 'string' && mensajeDirecto.trim().length > 0) {
      return mensajeDirecto.trim();
    }

    const errores =
      (Array.isArray(resp?.errors) ? resp.errors : null) ??
      (Array.isArray(resp?.errores) ? resp.errores : null) ??
      null;

    if (errores && errores.length > 0) {
      return errores.map((x: any) => String(x)).join(' | ');
    }

    return fallback;
  }

  private extraerMensajeErrorPlanificacion(err: any, fallback: string): string {
    const data = err?.error;

    if (typeof data === 'string' && data.trim().length > 0) {
      return data.trim();
    }

    if (data && typeof data === 'object') {
      return this.extraerMensajePlanificacion(data, fallback);
    }

    if (typeof err?.message === 'string' && err.message.trim().length > 0) {
      return err.message.trim();
    }

    return fallback;
  }

  planificar(rowData: any): void {
  // ✅ Obtener usuario desde token
  const token = localStorage.getItem('token');
  const jwtHelper = new JwtHelperService();
  const decodedToken = token ? jwtHelper.decodeToken(token) : null;
  const usuarioId = decodedToken?.nameid ? Number(decodedToken.nameid) : 0;

  // ✅ Confirmar acción antes de enviar al backend
  this.confirmationService.confirm({
    header: 'Confirmar planificación',
    message: `¿Desea planificar la orden ${rowData.numOrden}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, planificar',
    rejectLabel: 'Cancelar',
    acceptButtonStyleClass: 'p-button-success',
    rejectButtonStyleClass: 'p-button-secondary',
    accept: () => {
      const ordenId = Number(rowData?.ordenSalidaId || rowData?.id || rowData?.Id || 0);
      const propietarioId = Number(
        rowData?.propietarioId ??
        rowData?.PropietarioId ??
        rowData?.propietarioID ??
        rowData?.PropietarioID ??
        this.model?.PropietarioId ??
        0
      );
      const almacenId = this.b2bDefaultAlmacenId;

      if (!ordenId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Datos incompletos',
          detail: 'No se pudo identificar la orden a planificar.'
        });
        return;
      }

      if (!propietarioId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Datos incompletos',
          detail: 'No se pudo determinar el propietario de la orden.'
        });
        return;
      }

      const payload = {
        // Mismo formato usado en pending-picking (flujo que ya funciona)
        ids: String(ordenId),
        usuarioid: usuarioId,
        PropietarioId: propietarioId,
        AlmacenId: almacenId,
        // Metadata para backend: enviar correo de confirmacion con hoja de picking PDF
        enviarCorreoConfirmacion: true,
        adjuntarHojaPickingPdf: true,
        correoDestino: rowData?.correo ?? rowData?.Correo ?? null,
        numeroOrden: rowData?.numOrden ?? rowData?.NumOrden ?? null,
        FechaDespacho: new Date(),
        IdTipoVehiculo: null,
        placa: null
      };

      console.log('📦 Enviando payload:', payload);

      this.planningService.PlanificarPicking(payload).subscribe({
        next: (resp: any) => {
          console.log('📋 Respuesta planificación:', JSON.stringify(resp));
          const ok = this.esRespuestaPlanificacionExitosa(resp);

          if (ok) {
            this.messageService.add({
              severity: 'success',
              summary: 'Planificación exitosa',
              detail: this.extraerMensajePlanificacion(resp, `Orden ${rowData.numOrden} planificada correctamente.`)
            });
            this.buscar(); // 🔄 Recargar lista
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'No se pudo planificar',
              detail: this.extraerMensajePlanificacion(resp, `La orden ${rowData.numOrden} no pudo ser planificada.`)
            });
          }
        },
        error: (err) => {
          console.error('❌ Error al planificar:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.extraerMensajeErrorPlanificacion(err, `Ocurrió un error al planificar la orden ${rowData.numOrden}.`)
          });
        }
      });
    }
  });
}


    ver(ordenSalidaId: number): void {
        this.detalleOrdenModal = true;
        this.loadingDetalle = true;
        this.detalleProductos = [];

        this.b2bService.obtenerDetallePedido(ordenSalidaId).subscribe({
          next: (res) => {
            this.detalleProductos = (res.data || []).map((item) => this.normalizeDetalleProducto(item));
            this.loadingDetalle = false;
            console.log('Detalle de la orden:', this.detalleProductos);


          },
          error: (err) => {
            console.error(err);
            this.loadingDetalle = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo obtener el detalle de la orden.'
      });
    }
  });
    }

    nuevaorden() {
        const propietarioId = this.model.PropietarioId;
        if (propietarioId) {
            this.router.navigate(['/b2b/new'], { queryParams: { propietarioId: propietarioId } });
        } else {
            this.router.navigate(['/b2b/new']);
        }
    }
    nuevaordenmasiva() {
        this.router.navigate(['/picking/nuevasalidamasiva']);
    }

    delete(id) {
        this.confirmationService.confirm({
            message: '¿Está seguro que desea eliminar el despacho?',
            header: 'Eliminar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.despachosService.deleteOrder(id).subscribe((x) => {
                    this.buscar();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'TWH',
                        detail: 'Se eliminó correctamente.',
                    }); //success('Se registró correctamente.');
                });
            },
            reject: () => {},
        });
    }
}
