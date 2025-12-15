import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Table } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { RecepcionService } from '../../recepcion/recepcion.service';
import { InventarioService } from '../../_services/inventario.service';
import { ProductoService } from '../../_services/producto.service';
import { GeneralService } from '../../_services/general.service';
import { AlmacenajeService } from '../almacenaje.service';
import { OrdenRecibo, OrdenReciboDetalle } from '../../recepcion/recepcion.types';
import { InventarioGeneral, InventarioDetalle } from '../../_models/inventariogeneral';

@Component({
  selector: 'app-identificar-recibo-multiple',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIcon,
    ButtonModule,
    TableModule,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    InputSwitchModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  templateUrl: './identificar-recibo-multiple.component.html',
  styleUrls: ['./identificar-recibo-multiple.component.css']
})
export class IdentificarReciboMultipleComponent implements OnInit {
  @ViewChild('productserie') searchElement!: ElementRef;
  @ViewChild('dis') input!: ElementRef;
  @ViewChild('tablaOrdenDetalles') tablaOrdenDetalles!: Table;

  id: any = 0;
  equipoTransporteId: number = 0;
  orden: OrdenRecibo | null = null;
  ordenDetalles: OrdenReciboDetalle[] = [];
  selectedOrdenDetalle: OrdenReciboDetalle | null = null;
  loading = false;

  modeldetail: any = {};
  model: any = {};

  // Formulario
  modelDetail: any = {};
  addInventario: InventarioGeneral[] = [];
  inventario: InventarioGeneral[] = [];
  inventarioDetalles: InventarioDetalle[] = [];
  inventarioDetalle: InventarioDetalle = {};
  huellas: SelectItem[] = [];
  huellaDetalle: SelectItem[] = [];
  estados: SelectItem[] = [];
  nivel: SelectItem[] = [];
  sobredimensionado: boolean = false;

  es: any;
  
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
    { header: 'ACC', field: 'id', width: '40px' },
    { header: 'SKU', field: 'codigo', width: '80px' },
    { header: 'PRODUCTO', field: 'descripcionLarga', width: '150px' },
    { header: 'CANT', field: 'untQty', width: '60px' },
    { header: 'ESTADO', field: 'estado', width: '80px' },
  ];
  
  colsInventario = [
    { header: 'LOTNUM', field: 'lodNum', width: '60px' },
    { header: 'PRODUCTO', field: 'descripcionLarga', width: '130px' },
    { header: 'UBICACIÓN', field: 'ubicacion', width: '100px' },
    { header: 'CANT', field: 'untQty', width: '60px' },
    { header: 'SERIADO', field: 'seriado', width: '70px' },
    { header: '#Scaneados', field: 'scanQty', width: '70px' },
  ];

  cols4 = [
    { header: 'ACC', field: 'numOrden', width: '40px' },
    { header: 'PRODUCT ID', field: 'lodNum', width: '150px' },
    { header: 'MAC', field: 'descripcionLarga', width: '150px' },
    { header: 'SERIE', field: 'ubicacion', width: '180px' }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private recepcionService: RecepcionService,
    private inventarioService: InventarioService,
    private productoService: ProductoService,
    private generalService: GeneralService,
    private almacenajeService: AlmacenajeService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.params['id'];
    this.equipoTransporteId = Number(this.activatedRoute.snapshot.params['equipoTransporteId']);
    
    this.configurarCalendario();
    this.cargarEstados();
    this.cargarNiveles();
    this.cargarOrden();
    
  }

  configurarCalendario(): void {
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

  cargarEstados(): void {
    this.generalService.getAll(3).subscribe(resp => {
      resp.forEach(element => {
        this.estados.push({ value: element.id, label: element.nombreEstado });
      });
    });
  }

  cargarNiveles(): void {
    this.generalService.getValorTabla(39).subscribe(resp => {
      resp.forEach(element => {
        this.nivel.push({ value: element.id, label: element.valorPrincipal });
      });
    });
  }

  cargarOrden(): void {
    this.loading = true;
    this.recepcionService.obtenerOrden(this.id).subscribe({
      next: (resp) => {
        this.orden = resp;
        this.ordenDetalles = resp.detalles || [];
        this.loading = false;
        this.mostrarInventario();
      },
      error: (err) => {
        console.error('Error al cargar orden:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la orden de recibo.'
        });
        this.loading = false;
      }
    });
  }

  identificar(event: any): void {
    const detalleSeleccionado: OrdenReciboDetalle = event.data;
    
    if (!detalleSeleccionado) {
      console.warn('No se proporcionó un detalle válido');
      return;
    }

    // Verificar si la línea ya está completa (entregada)
    if (this.estaCompleto(detalleSeleccionado)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Información',
        detail: 'Esta línea ya ha sido completada. El formulario se ha limpiado.'
      });
      
      // Limpiar el Paso 2 y deseleccionar
      this.limpiarPaso2();
      this.deseleccionarPaso1();
      return;
    }

    const detalleId = detalleSeleccionado.id;
    if (!detalleId) {
      console.warn('No se proporcionó un ID de detalle válido');
      this.limpiarPaso2();
      return;
    }
    
    this.loading = true;
    this.recepcionService.obtenerOrdenDetalle(detalleId).subscribe({
      next: (resp) => {
        if (!resp) {
          this.loading = false;
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se recibió información del detalle.'
          });
          this.limpiarPaso2();
          return;
        }

        console.log('resp:', resp);

        this.modelDetail = { ...resp };
        this.modelDetail.untQty = resp.cantidad || 0;
        this.modelDetail.LotNum = resp.lote || '';
        this.modelDetail.codigo = (resp as any).codigo || '';
        this.modelDetail.producto = resp.producto || '';
        this.modelDetail.linea = resp.linea || '';

      
        
        // Asignar estadoId - usar setTimeout para asegurar que los estados estén cargados
        setTimeout(() => {
          const estadoIdValue = resp.estadoId || (resp as any).EstadoId;
          if (estadoIdValue !== undefined && estadoIdValue !== null && this.estados.length > 0) {
            const estadoIdNum = Number(estadoIdValue);
            // Verificar que el estado existe en la lista
            const estadoExiste = this.estados.some(e => Number(e.value) === estadoIdNum);
            if (estadoExiste) {
              this.modelDetail.estadoId = estadoIdNum;
            } else {
              // Si no existe, usar el primer estado disponible
              this.modelDetail.estadoId = Number(this.estados[0].value);
            }
          } else if (this.estados.length > 0) {
            // Si no hay estadoId en la respuesta, usar el primer estado
            this.modelDetail.estadoId = Number(this.estados[0].value);
          }
          console.log('EstadoId asignado:', this.modelDetail.estadoId, 'Estados disponibles:', this.estados);
        }, 100);
        
        // Cargar huellas solo si hay productoId
        if (resp.productoId) {
          this.productoService.getHuellas(resp.productoId).subscribe({
            next: (huellas) => {
              this.huellas = huellas?.map(h => ({
                value: h.id,
                label: `${h.codigoHuella} - Cama de ${h.caslvl}`
              })) || [];
              if (this.huellas.length > 0) {
                this.modelDetail.huellaId = this.huellas[0].value;
              }
              this.loading = false;
              console.log('Detalle cargado:', this.modelDetail);
            },
            error: (err) => {
              console.error('Error al cargar huellas:', err);
              this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No se pudieron cargar las huellas, pero puede continuar.'
              });
              this.huellas = [];
              this.loading = false;
            }
          });
        } else {
          console.warn('No hay productoId en la respuesta');
          this.huellas = [];
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle de la orden. Verifique la conexión o intente nuevamente.'
        });
        this.loading = false;
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
    console.log('=== BOTÓN AGREGAR MANUALMENTE PRESIONADO ===');
    console.log('modelDetail completo:', this.modelDetail);
    console.log('productoId:', this.modelDetail.productoId);
    console.log('untQty:', this.modelDetail.untQty);
    console.log('estadoId:', this.modelDetail.estadoId);
    console.log('huellaId:', this.modelDetail.huellaId);
    console.log('id (OrdenReciboDetalleId):', this.modelDetail.id);
    console.log('ordenReciboId (this.id):', this.id);
    
    // Validaciones
    if (!this.modelDetail.productoId) {
      console.error('ERROR: No hay productoId en modelDetail');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se ha seleccionado un producto. Por favor, seleccione una línea de orden primero.'
      });
      return;
    }
    
    if (!this.modelDetail.untQty || this.modelDetail.untQty <= 0) {
      console.error('ERROR: Cantidad recibida inválida:', this.modelDetail.untQty);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La cantidad recibida debe ser mayor a cero.'
      });
      return;
    }
    
    if (!this.modelDetail.estadoId) {
      console.error('ERROR: No hay estadoId seleccionado');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar un estado.'
      });
      return;
    }
    
    let total = 0;
    const productos = this.addInventario.filter(e => e.productoId === this.modelDetail.productoId);
    productos.forEach(x => {
      total += (x.untQty || 0);
    });
    
    console.log('Total de productos existentes:', total);
    console.log('addInventario antes de agregar:', this.addInventario.length);
    
    const nuevoItem: InventarioGeneral = {
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
      ordenReciboId: this.id,
      id: this.addInventario.length,
      fechaManufactura: this.modelDetail.fechaManufactura,
      fechaExpire: this.modelDetail.fechaExpire,
      referencia: this.modelDetail.referencia,
      peso: this.modelDetail.peso,
      // Propiedades obligatorias con valores por defecto
      cliente: this.orden?.propietario || '',
      codigoTWH: null,
      fechaProduccion: this.modelDetail.fechaManufactura ? (this.modelDetail.fechaManufactura instanceof Date ? this.modelDetail.fechaManufactura.toISOString() : String(this.modelDetail.fechaManufactura)) : '',
      cantidadSeparada: 0,
      stockDisponible: 0,
      unidadAlmacenamiento: null,
      fechaEsperada: this.orden?.fechaEsperada ? (this.orden.fechaEsperada instanceof Date ? this.orden.fechaEsperada.toISOString() : String(this.orden.fechaEsperada)) : '',
      transportista: this.orden?.equipotransporte || '',
      placa: '',
      pesoProducto: this.modelDetail.peso || 0,
      chofer: '',
      unidadMedida: '',
      guiaRemision: this.orden?.guiaRemision || '',
      tipoIngreso: '',
      tipoMerma: null,
      motivoMerma: null,
      areaMerma: null,
      oc: '',
      fechaRegistroMerma: '',
      razonSocial: this.orden?.propietario || '',
      destino: null,
      grupo: null,
      canal: null,
      proveedor: null,
      tipoUbicacion: '',
      volumen: 0,
      bultos: 0,
      pesoGuia: 0,
      contar: 0,
      bolsa: 0,
      observacion: ''
    };
    
    console.log('Nuevo item a agregar:', nuevoItem);
    
    this.addInventario.push(nuevoItem);
    
    console.log('addInventario después de agregar:', this.addInventario.length);
    console.log('addInventario completo:', this.addInventario);
    
    const detalle = this.ordenDetalles.find(x => x.productoId === this.modelDetail.productoId);
    if (detalle) {
      detalle.cantidadRecibida = (detalle.cantidadRecibida || 0) + total + (this.modelDetail.cantidadRecibida || 0);
      console.log('Detalle actualizado:', detalle);
    } else {
      console.warn('No se encontró el detalle para actualizar cantidadRecibida');
    }
    
    console.log('=== FIN AGREGAR MANUALMENTE ===');
    
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Item agregado al pallet correctamente.'
    });
  }

  eliminarPallet(id: number): void {
    console.log('=== ELIMINAR PALLET ===');
    console.log('ID a eliminar:', id);
    console.log('addInventario antes de eliminar:', this.addInventario.length);
    console.log('addInventario completo:', this.addInventario);
    
    const index = this.addInventario.findIndex(x => x.id === id);
    console.log('Índice encontrado:', index);
    
    if (index > -1) {
      const itemEliminado = this.addInventario[index];
      console.log('Item a eliminar:', itemEliminado);
      this.addInventario.splice(index, 1);
      console.log('addInventario después de eliminar:', this.addInventario.length);
      console.log('addInventario actualizado:', this.addInventario);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Item eliminado del pallet correctamente.'
      });
    } else {
      console.warn('No se encontró el item con ID:', id);
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se pudo encontrar el item a eliminar.'
      });
    }
    
    console.log('=== FIN ELIMINAR PALLET ===');
  }

  generarPallet(): void {
    console.log('=== GENERAR PALLET INICIADO ===');
    console.log('addInventario antes de generar:', this.addInventario);
    console.log('Cantidad de items en addInventario:', this.addInventario.length);
    
    if (!this.addInventario || this.addInventario.length === 0) {
      console.error('ERROR: addInventario está vacío o no existe');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay items para generar el pallet. Agregue items primero.'
      });
      return;
    }
    
    console.log('sobredimensionado:', this.sobredimensionado);
    console.log('modelDetail.sobredimensionadoId:', this.modelDetail.sobredimensionadoId);
    
    this.loading = true;
    const sobredimensionadoId = this.sobredimensionado ? this.modelDetail.sobredimensionadoId : undefined;
    
    console.log('sobredimensionadoId calculado:', sobredimensionadoId);
    console.log('sobredimensionadoId como string:', sobredimensionadoId?.toString());
    
    // Validar que todos los items tengan los campos requeridos
    const itemsInvalidos = this.addInventario.filter(item => {
      const valido = item.productoId && item.untQty && item.estadoId && item.OrdenReciboDetalleId;
      if (!valido) {
        console.warn('Item inválido encontrado:', item);
      }
      return !valido;
    });
    
    if (itemsInvalidos.length > 0) {
      console.error('ERROR: Hay items inválidos:', itemsInvalidos);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Hay ${itemsInvalidos.length} item(s) con datos incompletos. Verifique que todos tengan producto, cantidad, estado y detalle de orden.`
      });
      this.loading = false;
      return;
    }
    
    console.log('Llamando a almacenajeService.identificar_detallemultiple...');
    console.log('Parámetros:');
    console.log('  - addInventario ANTES de copiar:', JSON.stringify(this.addInventario, null, 2));
    console.log('  - addInventario.length:', this.addInventario.length);
    console.log('  - addInventario === null/undefined?:', this.addInventario === null || this.addInventario === undefined);
    console.log('  - sobredimensionadoId:', sobredimensionadoId?.toString());
    
    // Verificar que el array tenga elementos antes de continuar
    if (!this.addInventario || this.addInventario.length === 0) {
      console.error('ERROR CRÍTICO: addInventario está vacío o es null/undefined antes de crear copia');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay items para generar el pallet. Agregue items primero usando el botón "Agregar".'
      });
      this.loading = false;
      return;
    }
    
    // Crear una copia profunda del array para evitar problemas de referencia
    let addInventarioCopia: InventarioGeneral[];
    try {
      addInventarioCopia = JSON.parse(JSON.stringify(this.addInventario)) as InventarioGeneral[];
      console.log('  - addInventario DESPUÉS de copiar:', JSON.stringify(addInventarioCopia, null, 2));
      console.log('  - addInventarioCopia.length:', addInventarioCopia.length);
      console.log('  - addInventarioCopia es array?:', Array.isArray(addInventarioCopia));
    } catch (error) {
      console.error('ERROR al crear copia del array:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al preparar los datos para enviar. Intente nuevamente.'
      });
      this.loading = false;
      return;
    }
    
    if (!addInventarioCopia || addInventarioCopia.length === 0) {
      console.error('ERROR: addInventario está vacío al momento de enviar');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay items para generar el pallet. El array está vacío.'
      });
      this.loading = false;
      return;
    }
    
    this.almacenajeService.identificar_detallemultiple(addInventarioCopia as any, sobredimensionadoId?.toString()).subscribe({
      next: (response) => {
        console.log('=== GENERAR PALLET ÉXITO ===');
        console.log('Respuesta del servidor:', response);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pallet generado correctamente.'
        });
        console.log('Limpiando addInventario y modelDetail...');
        this.addInventario = [];
        this.modelDetail = {};
        console.log('Recargando orden...');
        this.cargarOrden();
        this.loading = false;
        console.log('=== FIN GENERAR PALLET ===');
      },
      error: (err) => {
        console.error('=== GENERAR PALLET ERROR ===');
        console.error('Error completo:', err);
        console.error('Error message:', err?.message);
        console.error('Error status:', err?.status);
        console.error('Error statusText:', err?.statusText);
        console.error('Error error:', err?.error);
        console.error('Error url:', err?.url);
        
        let mensajeError = 'No se pudo generar el pallet.';
        if (err?.error) {
          if (typeof err.error === 'string') {
            mensajeError = err.error;
          } else if (err.error?.message) {
            mensajeError = err.error.message;
          } else if (err.error?.error) {
            mensajeError = err.error.error;
          }
        } else if (err?.message) {
          mensajeError = err.message;
        }
        
        console.error('Mensaje de error para mostrar:', mensajeError);
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: mensajeError
        });
        this.loading = false;
        console.log('=== FIN GENERAR PALLET (ERROR) ===');
      }
    });
  }


  generarPalletsAutomatico(): void {
    // Validación inicial


    if (!this.modelDetail.productoId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar una línea de orden primero.'
      });
      return;
    }

    // Mostrar diálogo de confirmación y luego ejecutar directamente
    this.confirmationService.confirm({
      message: '¿Está seguro de generar los pallets automáticamente?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Ejecutar directamente la generación llamando a identificar_detallemultiple
        this.ejecutarGeneracionPalletsAutomatico();
      }
    });
  }

  private ejecutarGeneracionPalletsAutomatico(): void {
    // Validar que se haya seleccionado un detalle de orden
    if (!this.modelDetail || !this.modelDetail.productoId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar una línea de orden primero.'
      });
      return;
    }

    // Validar que el ID de la orden esté disponible
    if (!this.id) {
      this.id = this.activatedRoute.snapshot.params['id'] || this.activatedRoute.snapshot.params['uid'];
      if (!this.id) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener el ID de la orden. Recargue la página.'
        });
        return;
      }
    }

    this.loading = true;
    
    // Usar modelDetail en lugar de modeldetail para consistencia
    this.almacenajeService.identificar_detalle(this.modelDetail).subscribe({
      next: (response) => {
        console.log('Pallets generados automáticamente:', response);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Los pallets se generaron automáticamente correctamente.'
        });
        
        // Limpiar paso 2 y deseleccionar paso 1
        this.limpiarPaso2();
        this.deseleccionarPaso1();
        
        // Recargar la orden después del éxito
        this.recargarOrden();
      },
      error: (err) => {
        console.error('Error al generar pallets automáticamente:', err);
        
        // Extraer mensaje de error específico si está disponible
        let mensajeError = 'No se pudieron generar los pallets automáticamente.';
        if (err?.error) {
          if (typeof err.error === 'string') {
            mensajeError = err.error;
          } else if (err.error?.message) {
            mensajeError = err.error.message;
          } else if (err.error?.error) {
            mensajeError = err.error.error;
          }
        } else if (err?.message) {
          mensajeError = err.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: mensajeError
        });
        this.loading = false;
      }
    });
  }

  /**
   * Método auxiliar para recargar la orden después de operaciones exitosas
   */
  private recargarOrden(): void {
    if (!this.id) {
      this.id = this.activatedRoute.snapshot.params['id'] || this.activatedRoute.snapshot.params['uid'];
    }
    
    if (!this.id) {
      console.error('No se pudo obtener el ID de la orden para recargar');
      this.loading = false;
      return;
    }

    this.recepcionService.obtenerOrden(this.id).subscribe({
      next: (resp) => {
        this.orden = resp;
        this.ordenDetalles = resp.detalles || [];
        this.mostrarInventario();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al recargar la orden:', err);
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Los pallets se generaron, pero no se pudo recargar la orden. Recargue la página manualmente.'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Limpia el formulario del Paso 2 (modelDetail y campos relacionados)
   */
  private limpiarPaso2(): void {
    this.modelDetail = {};
    this.huellas = [];
    this.huellaDetalle = [];
    this.sobredimensionado = false;
  }

  /**
   * Deselecciona la fila seleccionada en el Paso 1 (tabla de líneas de orden)
   */
  private deseleccionarPaso1(): void {
    // Deseleccionar usando la propiedad de binding (esto actualiza la UI automáticamente)
    this.selectedOrdenDetalle = null;
    
    // Forzar detección de cambios para asegurar que la UI se actualice
    // La deselección se hará automáticamente por el binding bidireccional [(selection)]
  }

  agregarFaltantes(): void {
    this.loading = true;
    this.recepcionService.identificar_faltante([this.modelDetail]).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Faltante registrado correctamente.'
        });
        this.modelDetail = {};
        this.cargarOrden();
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  terminarIdentificacion(): void {
    if (!this.orden || 
        (this.orden.nombreEstado !== 'Asignado' && 
         this.orden.nombreEstado !== 'Recibiendo')) {
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
        this.loading = true;
        this.recepcionService.cerrar_identificacion(this.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Identificación terminada correctamente.'
            });
            const url = `http://104.36.166.65/reptwh/impresionEtiquetas_twh.aspx?orden=${this.id}`;
            window.open(url);
            this.router.navigate(['/recibo/equipotransporteentrante']);
          },
          error: (err) => {
            console.error('Error:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Tiene líneas pendientes por identificar.'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  mostrarInventario(): void {
    if (!this.id) return;
    this.inventarioService.GetAllInventarioByOrdenReciboId(this.id).subscribe(resp => {
      this.inventario = resp;
    });
  }

  changeSobredimensionado(event: any): void {
    this.sobredimensionado = event.checked;
    if (!event.checked) {
      this.modelDetail.sobredimensionadoId = null;
    }
  }

  calcularPendiente(detalle: OrdenReciboDetalle): number {
    const recibido = (detalle.cantidadRecibida || 0) + (detalle.cantidadFaltante || 0);
    return detalle.cantidad - recibido;
  }

  estaCompleto(detalle: OrdenReciboDetalle): boolean {
    const recibido = (detalle.cantidadRecibida || 0) + (detalle.cantidadFaltante || 0);
    return detalle.cantidad === recibido;
  }

  regresar(): void {
    this.router.navigate(['/recibo/equipotransporteentrante']);
  }

  getCodigo(row: any): string {
    return row.codigo || (row as any).codigo || '-';
  }

  // Método para generar pallets por pedido
  generarPalletsPorPedido(): void {
    this.loading = true;
    this.recepcionService.identificar_detallePorPedido(this.modelDetail).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pallets generados por pedido correctamente.'
        });
        this.modelDetail = {};
        this.addInventario = [];
        this.cargarOrden();
      },
      error: (err) => {
        console.error('Error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron generar los pallets por pedido.'
        });
        this.loading = false;
      }
    });
  }

  // Método para registrar detalles de inventario (escaneo de serie)
  registrarDetalle(id: number): void {
    this.inventarioDetalle = {} as InventarioDetalle;
    this.inventarioDetalle.inventarioId = id;

    if (this.searchElement) {
      this.searchElement.nativeElement.focus();
    }

    this.inventarioService.GetAllInventarioDetalle(id).subscribe(resp => {
      this.inventarioDetalles = resp;
    });
  }

  // Método para registrar código de producto escaneado
  registerProduct(): void {
    this.inventarioDetalle.codigoProducto = this.model.productserie;
  }

  // Método para registrar código MAC escaneado
  registerMac(): void {
    this.inventarioDetalle.codigoMac = this.model.macserie;
  }

  // Método para registrar código de serie escaneado
  registerSerie(): void {
    this.inventarioDetalle.codigoSerie = this.model.serie;

    if (!this.inventarioDetalle.codigoMac) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se escaneó correctamente el código MAC.'
      });
      return;
    }
    if (!this.inventarioDetalle.codigoProducto) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se escaneó correctamente el código de producto.'
      });
      return;
    }
    if (!this.inventarioDetalle.codigoSerie) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se escaneó correctamente el código de serie.'
      });
      return;
    }

    const inven = this.inventario.find(x => x.id === this.inventarioDetalle.inventarioId);
    if (inven) {
      this.inventarioDetalle.productoId = inven.productoId;
    }

    this.model = {};
    if (this.searchElement) {
      this.searchElement.nativeElement.focus();
    }

    this.inventarioService.registrar_inventariodetalle(this.inventarioDetalle).subscribe({
      next: (resp) => {
        if (resp === false) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'El código de producto ya existe.'
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Se escaneó con éxito.'
          });
        }

        if (this.inventarioDetalle.inventarioId) {
          this.inventarioService.GetAllInventarioDetalle(this.inventarioDetalle.inventarioId).subscribe(resp1 => {
            this.inventarioDetalles = resp1;
            this.mostrarInventario();
          });
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo registrar el detalle de inventario.'
        });
      }
    });
  }

  // Método para eliminar detalle de inventario
  eliminarDetalle(id: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar este detalle?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.inventarioService.delInventarioDetall(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Se eliminó con éxito.'
            });
            if (this.searchElement) {
              this.searchElement.nativeElement.focus();
            }
            if (this.inventarioDetalle.inventarioId) {
              this.inventarioService.GetAllInventarioDetalle(this.inventarioDetalle.inventarioId).subscribe(resp => {
                this.inventarioDetalles = resp;
                this.mostrarInventario();
              });
            }
          },
          error: (err) => {
            console.error('Error:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el detalle.'
            });
          }
        });
      }
    });
  }

  // Método para generar etiquetas
  generarEtiquetas(): void {
    const url = `http://104.36.166.65/reptwh/impresionEtiquetas_twh.aspx?orden=${this.id}`;
    window.open(url);
  }

  // Método de validación para solo permitir números
  numberOnly(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
}

