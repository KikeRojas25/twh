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
import { DespachosService } from '../../despachos/despachos.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CardModule } from 'primeng/card';
import { ProductoService } from '../../_services/producto.service';
import { DialogModule } from 'primeng/dialog';
import { B2bService } from '../b2b.service';
import { PropietarioService } from '../../_services/propietario.service';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
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
    DialogModule
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ]
})
export class NewComponent implements OnInit {
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
  clientes: SelectItem[] = [];
  direcciones: SelectItem[] = [];
  direccionesData: any[] = []; // Para guardar los datos completos de direcciones
  estados: SelectItem[] = [];


  orden : any;

  

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

  private inferEstadoIdFromTexto(estadoTexto: any): number | null {
    const t = String(estadoTexto ?? '').trim().toLowerCase();
    if (!t || !this.estados || this.estados.length === 0) return null;

    const match = this.estados.find(e => String(e.label ?? '').toLowerCase().includes(t));
    if (match?.value !== null && match?.value !== undefined) return Number(match.value) || null;

    if (t.includes('dispon')) {
      const disp = this.estados.find(e => String(e.label ?? '').toLowerCase().includes('dispon'));
      if (disp?.value !== null && disp?.value !== undefined) return Number(disp.value) || null;
    }

    return null;
  }

  

  constructor(
    private fb: FormBuilder,
    private despachoService: DespachosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private clienteService: ClienteService,
    private b2bService: B2bService,
    private productoService: ProductoService,
    private generalService: GeneralService,
    private router: Router,
    private propietarioService: PropietarioService,
    private route: ActivatedRoute,
  ) {
      this.form = this.fb.group({
    // 🟢 Panel: Datos Generales
    idPedidoExterno: [''],
    ordenCompraCliente: ['', Validators.required],
    guiaRemision: [''],
    ordenEntrega: [''],
    fechaRequerida: [new Date(), Validators.required],
    horaRequerida: [new Date(), Validators.required],
    observaciones: [''], 

    // 🟣 Panel: Cliente y Dirección
    clienteId: [null, Validators.required],
    direccionId: [null, Validators.required],
    
    // Campos ocultos pero necesarios para el backend (se pueden poblar desde cliente/dirección)
    nombre: [''],
    contacto: [''],
    documento: [''],
    telefono: [''],
    correo: [''],
    direccionEntrega: [''],
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

    // Guardar el id de usuario
    const usuarioId = this.decodedToken.nameid;

    // ✅ Leer propietarioId desde query parameter (usar snapshot para leer una vez)
    const propietarioIdParam = this.route.snapshot.queryParams['propietarioId'] 
      ? Number(this.route.snapshot.queryParams['propietarioId']) 
      : null;
    
    this.propietarioService.getPropietariosByUsuario(usuarioId).subscribe({
      next: (resp) => {
        this.propietarios = resp.map((x) => ({
          value: x.id,
          label: x.razonSocial
        }));

        // ✅ Si viene propietarioId en query params, usarlo
        let propietarioSeleccionado: number | null = null;
        if (propietarioIdParam) {
          const existe = this.propietarios.find(p => p.value === propietarioIdParam);
          if (existe) {
            propietarioSeleccionado = propietarioIdParam;
          } else {
            // Si no existe, usar la lógica por defecto
            if (this.propietarios.length === 1) {
              propietarioSeleccionado = this.propietarios[0].value;
            } else if (this.propietarios.length > 0) {
              propietarioSeleccionado = this.propietarios[0].value;
            }
          }
        } else {
          // ✅ Si no viene en query params, usar lógica por defecto
          if (this.propietarios.length === 1) {
            propietarioSeleccionado = this.propietarios[0].value;
          } else if (this.propietarios.length > 0) {
            propietarioSeleccionado = this.propietarios[0].value;
          }
        }

        // Sincronizar idPropietario y cargar clientes si hay propietario seleccionado
        if (propietarioSeleccionado) {
          this.idPropietario = propietarioSeleccionado;
          this.onChangePropietario(propietarioSeleccionado);
        }

        // Suscribirse a cambios en cliente para cargar direcciones
        this.form.get('clienteId')?.valueChanges.subscribe(clienteId => {
          if (clienteId) {
            this.onChangeCliente(clienteId);
          } else {
            this.direcciones = [];
            this.form.patchValue({ direccionId: null });
          }
        });
      },
      error: (err) => console.error('Error al cargar propietarios:', err),
    });

    // Catálogo de estados (tabla 3). Fallback si el API de lotes no retorna estadoId.
    this.generalService.getAll(3).subscribe({
      next: (resp: any[]) => {
        this.estados = (resp ?? []).map((x: any) => ({ value: x.id, label: x.nombreEstado }));
      },
      error: (err) => console.error('Error al cargar estados (tabla 3):', err),
    });
  

  
  this.b2bService.getUbigeo('').subscribe(resp => {

    console.log('ubigeo', resp);  

    resp.forEach(element => {
        this.ubigeo.push({ value: element.idDistrito ,  label : element.ubigeo});
      });




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

  registrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos requeridos.' });
      return;
    }

    // Validar que tenemos al menos un producto en el detalle
    if (this.detalle.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Debe agregar al menos un producto al detalle.' 
      });
      return;
    }

    // Validar que tenemos propietario
    if (!this.idPropietario) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Debe seleccionar un propietario.' 
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
    const propietarioLabel = this.propietarios.find(x => x.value === this.idPropietario)?.label || null;

    // Obtener datos de la dirección seleccionada
    const direccionIdSeleccionada = this.form.value.direccionId;
    const direccionSeleccionada = this.direccionesData.find(d => d.iddireccion === direccionIdSeleccionada);

    // Construir el objeto OrdenSalidaForRegister
    const ordenSalida = {
      Id: 0,
      PropietarioId: this.idPropietario,
      Propietario: propietarioLabel,
      NumOrden: null,
      AlmacenId: 0, // TODO: Agregar campo almacenId al formulario si es necesario
      GuiaRemision: this.form.value.guiaRemision || '',
      FechaRequerida: fechaFormateada,
      HoraRequerida: horaFormateada,
      OrdenCompraCliente: this.form.value.ordenCompraCliente || '',
      ClienteId: this.form.value.clienteId || 0,
      DireccionId: direccionIdSeleccionada || 0,
      EquipoTransporteId: null,
      EstadoId: 0,
      UsuarioRegistro: Number(this.decodedToken.nameid),
      UbicacionId: null,
      TipoRegistroId: 170, // Tipo de registro para B2B
      codigodespacho: null,
      distrito: direccionSeleccionada?.distrito || null,
      departamento: direccionSeleccionada?.departamento || null,
      contacto: this.form.value.contacto || null,
      telefono: this.form.value.telefono || null,
      usuarioid: Number(this.decodedToken.nameid),
      sucursal: null,
      CargaMasivaId: 0,
      GuiaRemisionIngreso: null,
      tipodescargaid: null,
      Items: this.detalle.length,
      ordeninfor: null,
      ordenentrega: this.form.value.ordenEntrega || null,
      Tamano: null,
      ocingreso: null,
      peso: null,
      cantidad: null,
      destino: null,
      referencia: null,
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




  this.confirmationService.confirm({
    header: 'Confirmar registro',
    message: '¿Está seguro de registrar esta orden de salida?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, registrar',
    rejectLabel: 'Cancelar',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',
    acceptButtonStyleClass: 'p-button-success',
    rejectButtonStyleClass: 'p-button-secondary',

    accept: () => {





    this.b2bService.registerOrdenSalida(ordenSalida).subscribe({
      next: (resp) => {
        this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Orden de salida registrada correctamente.' });
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
          const mensajeError = err?.error?.message || 'No se pudo registrar la orden de salida.';
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: mensajeError 
          });
        }
      }
    });

 },

    reject: () => {
      // 🔹 Si el usuario cancela
      this.messageService.add({
        severity: 'info',
        summary: 'Cancelado',
        detail: 'El registro de la orden de salida fue cancelado.'
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
      console.log('✅ Respuesta de lotesasasasassaa:', resp);

      if (resp && Array.isArray(resp) && resp.length > 0) {
        this.lotesInfo = resp.map(lote => {
          const estadoTexto = (lote.estado ?? lote.Estado ?? (lote.untQty > 0 ? 'Disponible' : 'Sin stock'));
          const rawEstadoId =
            (lote.estadoId ?? lote.EstadoId ?? lote.estadoID ?? lote.EstadoID ?? lote.idEstado ?? lote.IdEstado ?? null);
          const estadoIdNum = rawEstadoId !== null && rawEstadoId !== undefined ? Number(rawEstadoId) : null;
          const inferred = this.inferEstadoIdFromTexto(estadoTexto);

          return {
            numeroLote: lote.lotNum,
            cantidadDisponible: lote.untQty,
            unidad: lote.codigo ? 'UND' : 'UND',
            codigo: lote.codigo,
            descripcionLarga: lote.descripcionLarga,
            fechaExpire: lote.fechaExpire,
            ubicacion: null,
            estado: estadoTexto,
            // Importante: preservar el estadoId real del inventario para enviarlo al API (o inferirlo si no viene)
            estadoId: (estadoIdNum && estadoIdNum > 0) ? estadoIdNum : inferred
          };
        });


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
  // Guardar texto de estado para inferencia
  this.model.estadoTexto = lote.estado ?? lote.Estado ?? null;
  // Asignar el estadoId del lote (si viene del backend) o inferirlo desde catálogo
  const rawEstadoId = (lote.estadoId ?? lote.EstadoId ?? lote.estadoID ?? lote.EstadoID ?? lote.idEstado ?? lote.IdEstado ?? null);
  const estadoIdNum = rawEstadoId !== null && rawEstadoId !== undefined ? Number(rawEstadoId) : null;
  this.model.estadoId = (estadoIdNum && estadoIdNum > 0) ? estadoIdNum : this.inferEstadoIdFromTexto(this.model.estadoTexto ?? (lote.untQty > 0 ? 'Disponible' : 'Sin stock'));

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

  // 🔹 Forzar selección desde el modal de lotes para garantizar estadoId
  if (!this.model.lote) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención',
      detail: 'Debe seleccionar un lote desde "Ver lotes disponibles" antes de agregar el ítem.'
    });
    return;
  }
  const estadoIdNum = Number(this.model.estadoId);
  if (!estadoIdNum || estadoIdNum <= 0) {
    // Reintentar inferencia si ya tenemos texto de estado y el catálogo cargado
    const retry = this.inferEstadoIdFromTexto(this.model.estadoTexto);
    if (retry && retry > 0) {
      this.model.estadoId = retry;
    } else {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención',
      detail: 'No se pudo determinar el estado del lote seleccionado. Seleccione el lote desde el modal.'
    });
    return;
    }
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
    // Si ya existe el producto con el mismo lote, sumamos la cantidad
    existente.cantidad += this.model.cantidad;
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
      estadoId: estadoIdNum,
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
  this.model.estadoId = null;
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
  this.direccionesData = [];
  this.form.patchValue({ direccionId: null });

  this.clienteService.getAllDirecciones(clienteId).subscribe(resp => {
    this.direccionesData = resp; // Guardar datos completos
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
