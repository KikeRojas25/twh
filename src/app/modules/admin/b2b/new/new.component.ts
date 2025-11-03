import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
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


  orden : any;
  dialogStockVisible = false;
  stockInfo: any = null;
  propietarios: SelectItem[] = [];
  

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
  ) {
      this.form = this.fb.group({
    // 🟢 Panel: Datos Generales
    idPedidoExterno: [''],
    ordenCompraCliente: ['', Validators.required],
    fechaRequerida: [new Date(), Validators.required],
    horaRequerida: [new Date(), Validators.required],
    observaciones: [''], 

    // 🟣 Panel: Datos del Comprador
    nombre: ['', Validators.required],
    contacto: ['', Validators.required],
    documento: ['', Validators.required],
    telefono: ['',[Validators.maxLength(15)]],
    correo: ['',[Validators.email]],
    direccionEntrega: ['', Validators.required],
    iddestino: ['', Validators.required],
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



    
  this.propietarioService.getPropietariosByUsuario(usuarioId).subscribe({
    next: (resp) => {
      this.propietarios = resp.map((x) => ({
        value: x.id,
        label: x.razonSocial
      }));

      // ✅ Si solo hay un propietario, seleccionarlo automáticamente
      if (this.propietarios.length === 1) {
        this.idPropietario = this.propietarios[0].value;
      }
    },
    error: (err) => console.error('Error al cargar propietarios:', err),



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

    const horaRequerida: Date = this.form.value.horaRequerida;

    const horaFormateada = horaRequerida
  ? new Date(horaRequerida).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  : null;

      const pedido = {
        idPedidoExterno: 12345,
        fechaRequerida: this.form.value.fechaRequerida,
        horaRequerida: horaFormateada,
        proveedor: this.form.value.proveedor,
        ordenCompraCliente: this.form.value.ordenCompraCliente,
        observaciones: this.form.value.observaciones,
        latitud: this.form.value.latitud,
        longitud: this.form.value.longitud,
        comprador: {
          nombre: this.form.value.nombre,
          documento: this.form.value.documento,
          telefono: this.form.value.telefono,
          correo: this.form.value.correo,
          contacto: this.form.value.contacto,
          direccionEntrega: this.form.value.direccionEntrega,
          iddestino: this.form.value.iddestino,
          latitud: this.form.value.latitud,
          longitud: this.form.value.longitud,
          codigoDepartamento: this.form.value.codigoDepartamento || '',
          codigoProvincia: this.form.value.codigoProvincia || '',
          codigoDistrito: this.form.value.codigoDistrito || ''
        },
        detalle: this.detalle.map((x) => ({
          codigo: x.codigo,
          cantidad: x.cantidad,
          unidadMedidaId: x.unidadMedidaId,
          referencia: x.referencia
        }))
      };




  this.confirmationService.confirm({
    header: 'Confirmar registro',
    message: '¿Está seguro de registrar este pedido?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, registrar',
    rejectLabel: 'Cancelar',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',
    acceptButtonStyleClass: 'p-button-success',
    rejectButtonStyleClass: 'p-button-secondary',

    accept: () => {





    this.b2bService.registrarPedido(pedido).subscribe({
      next: (resp) => {
        this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Pedido registrado correctamente.' });
        this.router.navigate(['/b2b/ordenessalida', resp]);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el pedido.' });
      }
    });

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

  // 🔹 Verificar si el producto ya está en el detalle
  const existente = this.detalle.find(
    (d) => d.productoId === this.model.productoSeleccionado.id
  );

  if (existente) {
    // Si ya existe, sumamos la cantidad
    existente.cantidad += this.model.cantidad;
    this.messageService.add({
      severity: 'info',
      summary: 'Actualizado',
      detail: `La cantidad del producto ${this.model.productoSeleccionado.nombreCompleto} fue actualizada.`
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
      estadoId: 0,
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