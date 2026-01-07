import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DespachosService } from '../despachos.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CardModule } from 'primeng/card';
import { ProductoService } from '../../_services/producto.service';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { B2bService } from '../../b2b/b2b.service';
import { PropietarioService } from '../../_services/propietario.service';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';

@Component({
  selector: 'app-neworder',
  templateUrl: './neworder.component.html',
  styleUrls: ['./neworder.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    MatIcon,
    CalendarModule,
    InputTextModule,
    PanelModule,
    ToastModule,
    RouterModule,
    ButtonModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    TableModule,
    AutoCompleteModule,
    CardModule,
    DialogModule,
    TooltipModule
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ]
})
export class NeworderComponent implements OnInit {
  form: FormGroup;
  model: any = {};
  detalle: any[] = []; // 👈 Aquí lo simplificamos a un array plano
  productosFiltrados: any[] = [];
  idPropietario?: number ;

  estadoCliente: 'pendiente' | 'encontrado' | 'no_encontrado' = 'pendiente';

  dialogStockVisible = false;
  stockInfo: any = null;
  dialogLotesVisible = false;  // ← NUEVA
  lotesInfo: any[] = [];        // ← NUEVA
  propietarios: SelectItem[] = [];
  almacenes: SelectItem[] = [];
  clientes: SelectItem[] = [];
  direcciones: SelectItem[] = [];
  tiposDescarga: SelectItem[] = [];
  estados: SelectItem[] = [];
  clienteAnterior: number | null = null;

  orden : any;
  ordenId: number | null = null; // ID de la orden si está en modo edición
  esModoEdicion: boolean = false; // Flag para saber si estamos editando

  productos: any[] = [];
  productoSeleccionado: any = null;
  cantidadSeleccionada: number = 1;

  unidades = [
    { label: 'UND', value: 'UND' },
    { label: 'CJS', value: 'CJS' },
    { label: 'BLS', value: 'BLS' }
  ];

  jwtHelper = new JwtHelperService();
  decodedToken: any = {};

  ubigeo: SelectItem[] = [];

  

  constructor(
    private fb: FormBuilder,
    private despachoService: DespachosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private clienteService: ClienteService,
    private b2bService: B2bService,
    private productoService: ProductoService,
    private router: Router,
    private propietarioService: PropietarioService,
    private generalService: GeneralService,
    private route: ActivatedRoute,
  ) {
      this.form = this.fb.group({
    // 🟢 Campos de Ingreso
    almacenId: [null, Validators.required],
    propietarioId: [null, Validators.required],
    
    // 🟢 Panel: Datos Generales
    idPedidoExterno: [''],
    ordenCompraCliente: ['', Validators.required],
    fechaRequerida: [new Date(), Validators.required],
    horaRequerida: [new Date(), Validators.required],
    observaciones: [''], 
    guiaRemision: [''],
    ordenEntrega: [''],
    ordenInfor: [''],
    tipoDescargaId: [null],

    // 🟣 Panel: Datos del Comprador (campos ocultos pero necesarios para el backend)
    clienteId: [null, Validators.required],
    nombre: [''],
    contacto: [''],
    documento: [''],
    telefono: ['',[Validators.maxLength(15)]],
    correo: ['',[Validators.email]],
    direccionEntrega: [''],
    direccionId: [null, Validators.required],
    iddestino: [''],
    latitud: [null],
    longitud: [null],

    // Detalle del pedido (se puede manejar con FormArray si deseas)
    detalle: this.fb.array([]),
  });
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(token);

    // Verificar si hay un ID en los queryParams (modo edición)
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.ordenId = Number(params['id']);
        this.esModoEdicion = true;
        // La orden se cargará después de que se carguen los propietarios
      }
    });

  // Cargar todos los propietarios (sin filtrar por usuario)






    
  this.propietarioService.getAllPropietarios().subscribe({
    next: (resp) => {
      this.propietarios = resp.map((x) => ({
        value: x.id,
        label: x.razonSocial
      }));

      // Si estamos en modo edición y ya tenemos el ID, cargar la orden después de cargar propietarios
      if (this.esModoEdicion && this.ordenId) {
        this.cargarOrdenExistente(this.ordenId);
      }
    },
    error: (err) => console.error('Error al cargar propietarios:', err),
  });
  
  // Cargar almacenes
  this.generalService.getAllAlmacenes().subscribe((resp) => {
    this.almacenes = resp.map((almacen) => ({
      label: almacen.descripcion,
      value: almacen.id
    }));
  });

  this.b2bService.getUbigeo('').subscribe(resp => {

    console.log('ubigeo', resp);  

    resp.forEach(element => {
        this.ubigeo.push({ value: element.idDistrito ,  label : element.ubigeo});
      });




    });

  // Cargar tipos de descarga
  this.generalService.getValorTabla(43).subscribe(resp => {
    resp.forEach(element => {
      this.tiposDescarga.push({ value: element.id, label: element.valorPrincipal });
    });
  });

  // Cargar estados de productos
  this.generalService.getAll(3).subscribe(resp => {
    resp.forEach(element => {
      this.estados.push({
        value: element.id,
        label: element.nombreEstado
      });
    });
    // Establecer el primer estado como valor por defecto
    if (this.estados.length > 0) {
      this.model.estadoId = this.estados[0].value;
    }
  });

  // Suscribirse a cambios en propietario para cargar clientes
  this.form.get('propietarioId')?.valueChanges.subscribe(propietarioId => {
    if (propietarioId) {
      this.onChangePropietario(propietarioId);
    } else {
      this.clientes = [];
      this.direcciones = [];
      this.form.patchValue({ clienteId: null, direccionId: null });
    }
  });

  // Suscribirse a cambios en cliente para cargar direcciones
  this.clienteAnterior = this.form.get('clienteId')?.value || null;
  this.form.get('clienteId')?.valueChanges.subscribe(clienteId => {
    // Verificar si hay productos agregados y el cliente cambió
    if (this.detalle.length > 0 && this.clienteAnterior !== null && this.clienteAnterior !== clienteId && clienteId !== null) {
      this.confirmationService.confirm({
        header: 'Advertencia',
        message: `Ya tiene ${this.detalle.length} producto(s) agregado(s) al detalle. ¿Desea cambiar el cliente? Esto eliminará todos los productos agregados.`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cambiar cliente',
        rejectLabel: 'Cancelar',
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        acceptButtonStyleClass: 'p-button-warning',
        rejectButtonStyleClass: 'p-button-secondary',
        accept: () => {
          // Limpiar el detalle
          this.detalle = [];
          this.messageService.add({
            severity: 'info',
            summary: 'Detalle limpiado',
            detail: 'Los productos agregados han sido eliminados.'
          });
          // Continuar con el cambio de cliente
          if (clienteId) {
            this.onChangeCliente(clienteId);
          } else {
            this.direcciones = [];
            this.form.patchValue({ direccionId: null });
          }
          this.clienteAnterior = clienteId;
        },
        reject: () => {
          // Revertir el cambio de cliente
          this.form.patchValue({ clienteId: this.clienteAnterior }, { emitEvent: false });
        }
      });
    } else {
      // Si no hay productos o es la primera vez, proceder normalmente
      if (clienteId) {
        this.onChangeCliente(clienteId);
      } else {
        this.direcciones = [];
        this.form.patchValue({ direccionId: null });
      }
      this.clienteAnterior = clienteId;
    }
  });
  
  }




  
verStock() {


  console.log('Producto seleccionado:', this.model.productoSeleccionado);
  
  if (!this.model.productoSeleccionado?.codigo) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Seleccione un producto antes de consultar el stock.'
    });
    return;
  }

  this.dialogStockVisible = true;
  this.stockInfo = null; // Limpia mientras carga

  const codigo = this.model.productoSeleccionado.codigo;

  // ✅ Llamada al servicio existente de inventario
  this.b2bService.getInventarioPorCodigo(codigo).subscribe({
    next: (resp: any) => {
      if (resp?.success && resp.data?.length > 0) {
        this.stockInfo = resp.data[0];
      } else {
        this.stockInfo = {
          codigo,
          descripcionLarga: this.model.productoSeleccionado.nombreCompleto,
          stockDisponibleTotal: 0,
          unidadAlmacenamiento: '-',
          estado: 'Sin registro'
        };
      }
    },
    error: () => {
      this.stockInfo = {
        codigo,
        descripcionLarga: this.model.productoSeleccionado.nombreCompleto,
        stockDisponibleTotal: 0,
        unidadAlmacenamiento: '-',
        estado: 'Error de conexión'
      };
    }
  });
}

// 🟩 Agregar producto desde el bloque
agregarProducto() {
  if (!this.productoSeleccionado) {
    this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un producto.' });
    return;
  }

  if (!this.cantidadSeleccionada || this.cantidadSeleccionada <= 0) {
    this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese una cantidad válida.' });
    return;
  }

  // Verificar duplicados
  const existe = this.detalle.find(p => p.codigo === this.productoSeleccionado.codigo);
  if (existe) {
    this.messageService.add({ severity: 'info', summary: 'Aviso', detail: 'El producto ya fue agregado.' });
    return;
  }

  // Agregar al detalle
  this.detalle.push({
    codigo: this.productoSeleccionado.codigo,
    descripcion: this.productoSeleccionado.descripcion,
    cantidad: this.cantidadSeleccionada,
    unidadMedida: this.productoSeleccionado.unidad
  });

  // Reset
  this.productoSeleccionado = null;
  this.cantidadSeleccionada = 1;
}

      
    buscarProductos(event: any): void {
        const texto = event.query?.trim();
        if (!texto || texto.length < 3) return;   // min chars
        if (!this.idPropietario) return;

        this.productoService.buscarProductosPorPropietario(this.idPropietario, texto)
        .subscribe(res => {

                console.log('productos', res);


          this.productosFiltrados = (res ?? []).map(p => ({
            ...p,
            nombreCompleto: `${p.nombreCompleto}`
          }));
        });
      }



  eliminarFila(index: number) {
    this.confirmationService.confirm({
      message: '¿Desea eliminar este producto?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.detalle.splice(index, 1);
        this.messageService.add({ severity: 'info', summary: 'Eliminado', detail: 'Producto eliminado.' });
      }
    });
  }

  // Método para cargar una orden existente en modo edición
  cargarOrdenExistente(id: number) {
    // Cargar la orden principal
    this.despachoService.obtenerOrdenSalidaPorId(id).subscribe({
      next: (orden) => {
        this.orden = orden;
        console.log('Orden cargada:', orden);

        // Convertir hora requerida si existe (formato: "HH:mm" o "HH:mm:ss")
        let horaRequeridaDate: Date | null = null;
        if (orden.horaRequerida) {
          const partes = orden.horaRequerida.split(':');
          if (partes.length >= 2) {
            const fecha = new Date();
            fecha.setHours(parseInt(partes[0]), parseInt(partes[1]), 0);
            horaRequeridaDate = fecha;
          }
        }

        // Llenar el formulario con los datos de la orden usando las propiedades del backend
        const ordenData: any = orden;
        
        // Helper para obtener valor con ambos casos (camelCase y PascalCase)
        const getValue = (camelKey: string, pascalKey: string, defaultValue: any = null) => {
          return ordenData[camelKey] !== undefined ? ordenData[camelKey] : 
                 (ordenData[pascalKey] !== undefined ? ordenData[pascalKey] : defaultValue);
        };

        // Obtener valores con ambos formatos
        const propietarioId = getValue('propietarioId', 'PropietarioId');
        const almacenId = getValue('almacenId', 'AlmacenId');
        const clienteId = getValue('clienteId', 'ClienteId');
        const direccionId = getValue('direccionId', 'DireccionId');
        const ordenCompraCliente = getValue('ordenCompraCliente', 'OrdenCompraCliente', '');
        const guiaRemision = getValue('guiaRemision', 'GuiaRemision', '');
        const ordenEntrega = getValue('ordenentrega', 'Ordenentrega', '');
        const ordenInfor = getValue('ordeninfor', 'Ordeninfor', '');
        const tipoDescargaId = getValue('tipodescargaid', 'Tipodescargaid');
        const contacto = getValue('contacto', 'Contacto', '');
        const telefono = getValue('telefono', 'Telefono', '');
        
        const fechaRequeridaValue = getValue('fechaRequerida', 'FechaRequerida');
        const horaRequeridaValue = getValue('horaRequerida', 'HoraRequerida');
        
        console.log('Datos mapeados:', {
          propietarioId,
          almacenId,
          clienteId,
          direccionId,
          ordenCompraCliente,
          guiaRemision,
          ordenEntrega,
          ordenInfor,
          tipoDescargaId
        });

        this.form.patchValue({
          almacenId: almacenId || null,
          propietarioId: propietarioId || null,
          ordenCompraCliente: ordenCompraCliente || '',
          fechaRequerida: fechaRequeridaValue ? new Date(fechaRequeridaValue) : new Date(),
          horaRequerida: horaRequeridaDate || new Date(),
          guiaRemision: guiaRemision || '',
          ordenEntrega: ordenEntrega || '',
          ordenInfor: ordenInfor || '',
          tipoDescargaId: tipoDescargaId || null,
          clienteId: clienteId || null,
          direccionId: direccionId || null,
          contacto: contacto || '',
          telefono: telefono || ''
        });

        // Establecer el propietario para cargar clientes y direcciones
        if (propietarioId) {
          this.idPropietario = propietarioId;
          // Esperar un momento para que se carguen los propietarios antes de llamar onChangePropietario
          setTimeout(() => {
            this.onChangePropietario(propietarioId);
          }, 500);
        }
        
        // Después de cargar clientes, establecer el cliente y dirección
        if (propietarioId && clienteId) {
          setTimeout(() => {
            this.form.patchValue({ clienteId: clienteId });
            if (direccionId) {
              setTimeout(() => {
                this.form.patchValue({ direccionId: direccionId });
              }, 500);
            }
          }, 600);
        }

        // Cargar el detalle de la orden usando el endpoint específico
        this.despachoService.obtenerDetalleOrdenSalida(id).subscribe({
          next: (detalleResp) => {
            // Mapear el detalle al formato esperado
            this.detalle = (detalleResp || []).map((item: any) => ({
              productoId: item.productoId || item.ProductoId,
              codigo: item.codigo || item.productoId || item.ProductoId,
              descripcion: item.descripcion || item.producto || item.Producto || '',
              unidadMedida: item.unidadMedida || item.unidad || 'UND',
              lote: item.lote || item.Lote || null,
              referencia: item.referencia || null,
              cantidad: item.cantidad || item.Cantidad || 0,
              estadoId: item.estadoId || item.EstadoId || (this.estados.length > 0 ? this.estados[0].value : 0),
              huellaId: item.huellaId || item.HuellaId || null
            }));
            console.log('Detalle cargado desde endpoint:', this.detalle);
          },
          error: (err) => {
            console.error('Error al cargar detalle:', err);
            this.messageService.add({
              severity: 'warn',
              summary: 'Aviso',
              detail: 'No se pudo cargar el detalle de la orden.'
            });
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar orden:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la orden de salida.'
        });
      }
    });
  }

  registrar() {
    // Marcar todos los campos como touched para mostrar errores
    this.form.markAllAsTouched();
    
    if (this.form.invalid) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Complete los campos requeridos.' 
      });
      return;
    }

    // Formatear fecha requerida como string (formato: yyyy-MM-dd)
    const fechaRequerida: Date = this.form.value.fechaRequerida;
    const fechaFormateada = fechaRequerida 
      ? new Date(fechaRequerida).toISOString().split('T')[0] 
      : '';

    // Formatear hora requerida como string (formato: HH:mm)
    const horaRequerida: Date = this.form.value.horaRequerida;
    const horaFormateada = horaRequerida
      ? new Date(horaRequerida).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '';

    // Obtener el nombre del propietario
    const propietarioLabel = this.propietarios.find(x => x.value === this.form.value.propietarioId)?.label || null;

    // Validar que tenemos al menos un producto en el detalle
    if (this.detalle.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Debe agregar al menos un producto al detalle.' 
      });
      return;
    }

    // Construir el objeto OrdenSalidaForRegister (mismo formato para registro y actualización)
    const pedido = {
      Id: this.esModoEdicion && this.ordenId ? this.ordenId : 0,
      PropietarioId: this.form.value.propietarioId,
      Propietario: propietarioLabel,
      NumOrden: null,
      AlmacenId: this.form.value.almacenId,
      GuiaRemision: this.form.value.guiaRemision || '',
      FechaRequerida: fechaFormateada,
      HoraRequerida: horaFormateada,
      OrdenCompraCliente: this.form.value.ordenCompraCliente || '',
      ClienteId: this.form.value.clienteId || 0,
      DireccionId: this.form.value.direccionId || 0,
      EquipoTransporteId: null,
      EstadoId: 0,
      UsuarioRegistro: Number(this.decodedToken.nameid),
      UbicacionId: null,
      TipoRegistroId: 170, // Tipo de registro fijo según el ejemplo
      codigodespacho: null,
      distrito: null,
      departamento: null,
      contacto: this.form.value.contacto || null,
      telefono: this.form.value.telefono || null,
      usuarioid: Number(this.decodedToken.nameid),
      sucursal: null,
      CargaMasivaId: 0,
      GuiaRemisionIngreso: null,
      tipodescargaid: this.form.value.tipoDescargaId ? Number(this.form.value.tipoDescargaId) : null,
      Items: this.detalle.length,
      ordeninfor: this.form.value.ordenInfor || null,
      ordenentrega: this.form.value.ordenEntrega || null,
      Tamano: null,
      ocingreso: null,
      peso: null,
      cantidad: null,
      destino: null,
      referencia: null,
      // Detalles de la orden - mismo formato para registro y actualización
      Detalles: this.detalle.map((x) => {
        const detalle: any = {
          productoId: x.productoId,
          cantidad: Number(x.cantidad),
          estadoId: x.estadoId || 0,
          huellaId: x.huellaId ? Number(x.huellaId) : 0
        };
        
        // Solo agregar campos opcionales si tienen valor
        if (x.lote) {
          detalle.lote = x.lote;
        }
        if (x.referencia) {
          detalle.referencia = x.referencia;
        }
        // huellaId debe ser un número o no enviarse - nunca null
        if (x.huellaId !== null && x.huellaId !== undefined && typeof x.huellaId === 'number') {
          detalle.huellaId = Number(x.huellaId);
        }
        
        return detalle;
      })
    };

    console.log('Objeto a enviar:', pedido);
    console.log('Modo edición:', this.esModoEdicion);
    console.log('ID de orden:', this.ordenId);




  this.confirmationService.confirm({
    header: this.esModoEdicion ? 'Confirmar actualización' : 'Confirmar registro',
    message: this.esModoEdicion ? '¿Está seguro de actualizar este pedido?' : '¿Está seguro de registrar este pedido?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: this.esModoEdicion ? 'Sí, actualizar' : 'Sí, registrar',
    rejectLabel: 'Cancelar',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',
    acceptButtonStyleClass: 'p-button-success',
    rejectButtonStyleClass: 'p-button-secondary',

    accept: () => {
      if (this.esModoEdicion && this.ordenId) {
        // Modo actualización - usar el endpoint UpdateOrdenSalida
        // Recibe OrdenSalidaForRegister con los mismos parámetros que el registro
        console.log('Actualizando orden con ID:', this.ordenId);
        this.despachoService.actualizarOrdenSalida(pedido).subscribe({
          next: (resp) => {
            this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Orden de salida actualizada correctamente.' });
            this.router.navigate(['/picking/listaordensalida']); // Redirigir a la lista de órdenes
          },
          error: (err) => {
            console.error('Error al actualizar orden:', err);
            
            // Manejar error estructurado del backend (validación de stock u otros)
            if (err?.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
              const mensajePrincipal = err.error.message || 'Error de validación';
              this.messageService.add({ 
                severity: 'error', 
                summary: 'Error de validación', 
                detail: mensajePrincipal 
              });
              
              err.error.errors.forEach((errorMsg: string) => {
                if (errorMsg && errorMsg.trim()) {
                  this.messageService.add({ 
                    severity: 'warn', 
                    summary: 'Validación', 
                    detail: errorMsg.trim(),
                    life: 8000
                  });
                }
              });
            } else {
              const mensajeError = err?.error?.message || 'No se pudo actualizar la orden de salida.';
              this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: mensajeError 
              });
            }
          }
        });
      } else {
        // Modo creación
        this.despachoService.RegistarOrdenSalida(pedido).subscribe({
          next: (resp) => {
            this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Pedido registrado correctamente.' });
            this.router.navigate(['/b2b/ordenessalida', resp]);
          },
      error: (err) => {
        console.error(err);
        
        // Manejar error estructurado del backend (validación de stock)
        if (err?.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
          // Mostrar el mensaje principal si existe
          const mensajePrincipal = err.error.message || 'Error de validación de stock';
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error de validación', 
            detail: mensajePrincipal 
          });
          
          // Mostrar cada error específico de stock
          err.error.errors.forEach((errorMsg: string) => {
            if (errorMsg && errorMsg.trim()) {
              this.messageService.add({ 
                severity: 'warn', 
                summary: 'Stock insuficiente', 
                detail: errorMsg.trim(),
                life: 8000 // Mostrar por más tiempo para que el usuario pueda leerlo
              });
            }
          });
        } else {
          // Error genérico o sin estructura específica
          const mensajeError = err?.error?.message || 'No se pudo registrar el pedido.';
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: mensajeError 
          });
        }
      }
    });
      }
    },

    reject: () => {
      // 🔹 Si el usuario cancela
      this.messageService.add({
        severity: 'info',
        summary: 'Cancelado',
        detail: 'El registro del pedido fue cancelado.'
      });
    }
  });
}

verLotes() {
  console.log('📦 Consultando lotes para producto:', this.model.productoSeleccionado);

  if (!this.model.productoSeleccionado?.id) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Seleccione un producto antes de consultar los lotes.'
    });
    return;
  }

  this.dialogLotesVisible = true;
  this.lotesInfo = [];

  const productoId = this.model.productoSeleccionado.id;

  this.b2bService.getStockProductoAgrupadoPorLote(productoId).subscribe({
    next: (resp: any) => {
      console.log('✅ Respuesta de lotes:', resp);

      if (resp && Array.isArray(resp) && resp.length > 0) {
        // Mapear la respuesta del backend al formato esperado por el modal
        this.lotesInfo = resp.map(lote => ({
          numeroLote: lote.lotNum,
          cantidadDisponible: lote.untQty,
          unidad: lote.codigo ? 'UND' : 'UND', // Ajustar según necesites
          codigo: lote.codigo,
          descripcionLarga: lote.descripcionLarga,
          fechaVencimiento: null, // No viene en el modelo
          ubicacion: null, // No viene en el modelo
          estado: lote.untQty > 0 ? 'Disponible' : 'Sin stock'
        }));

        this.messageService.add({
          severity: 'success',
          summary: 'Lotes encontrados',
          detail: `Se encontraron ${this.lotesInfo.length} lote(s) disponible(s)`
        });
      } else {
        this.lotesInfo = [];
        this.messageService.add({
          severity: 'info',
          summary: 'Sin lotes',
          detail: 'No se encontraron lotes disponibles para este producto.'
        });
      }
    },
    error: (err) => {
      console.error('❌ Error al consultar lotes:', err);
      this.lotesInfo = [];
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo consultar los lotes disponibles.'
      });
    }
  });
}

/**
 * Seleccionar un lote desde el modal
 */
seleccionarLote(lote: any) {
  console.log('✅ Lote seleccionado:', lote);

  // Asignar el número de lote
  this.model.lote = lote.numeroLote;

  // Ajustar cantidad si es mayor al disponible
  if (this.model.cantidad > lote.cantidadDisponible) {
    this.model.cantidad = lote.cantidadDisponible;
  } else if (!this.model.cantidad) {
    this.model.cantidad = Math.min(1, lote.cantidadDisponible);
  }

  // Cerrar el modal
  this.dialogLotesVisible = false;

  // Mostrar mensaje de éxito
  this.messageService.add({
    severity: 'success',
    summary: 'Lote seleccionado',
    detail: `Lote ${lote.numeroLote} - Disponible: ${lote.cantidadDisponible} ${lote.unidad}`
  });
}


agregarItem(): void {
  // 🔹 Validaciones básicas
  if (!this.model.productoSeleccionado) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención',
      detail: 'Seleccione un producto antes de agregar.'
    });
    return;
  }

  if (!this.model.cantidad || this.model.cantidad <= 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención',
      detail: 'Ingrese una cantidad válida.'
    });
    return;
  }

  // 🔹 Verificar si el producto con el mismo lote ya está en el detalle
  const loteActual = this.model.lote || null;
  const existente = this.detalle.find(
    (d) => {
      const mismoProducto = d.productoId === this.model.productoSeleccionado.id;
      const mismoLote = (d.lote || null) === loteActual;
      return mismoProducto && mismoLote;
    }
  );

  if (existente) {
    // Si ya existe el producto con el mismo lote, sumamos la cantidad y actualizamos el estado si se cambió
    existente.cantidad += this.model.cantidad;
    if (this.model.estadoId) {
      existente.estadoId = this.model.estadoId;
    }
    this.messageService.add({
      severity: 'info',
      summary: 'Actualizado',
      detail: `La cantidad del producto ${this.model.productoSeleccionado.nombreCompleto}${loteActual ? ' (Lote: ' + loteActual + ')' : ''} fue actualizada.`
    });
  } else {
    // 🔹 Crear el objeto de detalle
    const nuevoDetalle = {
      productoId: this.model.productoSeleccionado.id,
      codigo: this.model.productoSeleccionado.codigo,
      descripcion: this.model.productoSeleccionado.nombreCompleto,
      unidadMedida: this.model.productoSeleccionado.unidad,
      lote: this.model.lote || null,
      referencia: this.model.referencia || null,
      cantidad: this.model.cantidad,
      estadoId: this.model.estadoId || (this.estados.length > 0 ? this.estados[0].value : 0),
      huellaId: null
    };

    // 🔹 Agregar al arreglo principal
    this.detalle.push(nuevoDetalle);

    this.messageService.add({
      severity: 'success',
      summary: 'Agregado',
      detail: 'Producto agregado al detalle.'
    });
  }

  // 🔹 Limpiar campos del formulario de ítem
  this.model.productoSeleccionado = null;
  this.model.cantidad = null;
  this.model.lote = null;
  this.model.referencia = null;
  // Restaurar el estado por defecto (primer estado de la lista)
  if (this.estados.length > 0) {
    this.model.estadoId = this.estados[0].value;
  }
}


buscarClientePorDocumento() {
  const doc = this.form.get('documento')?.value;
  if (!doc) return;

  this.estadoCliente = 'pendiente';

  this.clienteService.getClientePorDocumento(doc).subscribe({
    next: (cliente) => {
      if (cliente) {

        console.log('Cliente encontrado:', cliente);


        this.form.patchValue({
          nombre: cliente.data.razonSocial,
          telefono: cliente.data.telefono,
          correo: cliente.data.correo,
          direccionEntrega: cliente.data.direccionEntrega

        });
        this.estadoCliente = 'encontrado';
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente encontrado',
          detail: `Se cargaron los datos de ${cliente.nombre}`
        });
      } else {
        this.estadoCliente = 'no_encontrado';
        this.messageService.add({
          severity: 'warn',
          summary: 'No encontrado',
          detail: 'El cliente no está registrado.'
        });
      }
    },
    error: () => {
      this.estadoCliente = 'no_encontrado';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo consultar el cliente.'
      });
    }
  });
}

/**
 * Calcula el stock total sumando todos los lotes disponibles
 */
calcularStockTotal(): number {
  if (!this.lotesInfo || this.lotesInfo.length === 0) {
    return 0;
  }
  return this.lotesInfo.reduce((total, lote) => total + (lote.cantidadDisponible || 0), 0);
}

/**
 * Obtiene la fecha de vencimiento más próxima de los lotes
 */
obtenerProximoVencimiento(): string {
  if (!this.lotesInfo || this.lotesInfo.length === 0) {
    return 'N/A';
  }

  const lotesConFecha = this.lotesInfo
    .filter(lote => lote.fechaVencimiento)
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

  if (lotesConFecha.length === 0) {
    return 'Sin vencimiento';
  }

  const fechaProxima = new Date(lotesConFecha[0].fechaVencimiento);
  return fechaProxima.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

getEstadoLabel(estadoId: number): string {
  const estado = this.estados.find(e => e.value === estadoId);
  return estado ? estado.label : '-';
}

onChangePropietario(propietarioId: number) {
  this.idPropietario = propietarioId;
  this.clientes = [];
  this.direcciones = [];
  this.form.patchValue({ clienteId: null, direccionId: null });

  this.clienteService.getAllClientesxPropietarios(propietarioId).subscribe(resp => {
    this.clientes = resp.map(element => ({
      value: element.id,
      label: element.razonSocial
    }));

    // Si hay solo un cliente, seleccionarlo automáticamente
    if (this.clientes.length === 1) {
      const clienteUnico = this.clientes[0];
      this.form.get('clienteId')?.setValue(clienteUnico.value);
    }
  });
}

onChangeCliente(clienteId: number) {
  this.direcciones = [];
  this.form.patchValue({ direccionId: null });

  this.clienteService.getAllDirecciones(clienteId).subscribe(resp => {
    this.direcciones = resp.map(element => ({
      value: element.iddireccion,
      label: `${element.direccion} [ ${element.departamento} - ${element.provincia} - ${element.distrito} ]`
    }));

    // Si hay solo una dirección, seleccionarla automáticamente
    if (this.direcciones.length === 1) {
      this.form.get('direccionId')?.setValue(this.direcciones[0].value);
    }
  });
}

 cancelar() {
  this.confirmationService.confirm({
    header: 'Cancelar edición',
    message: '¿Desea salir sin guardar los cambios?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, salir',
    rejectLabel: 'Permanecer',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',
    acceptButtonStyleClass: 'p-button-danger',
    rejectButtonStyleClass: 'p-button-secondary',
    accept: () => {
      this.router.navigate(['/b2b/ordenessalida']);
    },
    reject: () => {
      this.messageService.add({
        severity: 'info',
        summary: 'Edición',
        detail: 'Puede continuar editando el pedido.'
      });
    }
  });
        }

}

