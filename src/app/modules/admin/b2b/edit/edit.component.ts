import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { B2bService } from '../b2b.service';
import { ClienteService } from '../../_services/cliente.service';
import { ProductoService } from '../../_services/producto.service';
import { PropietarioService } from '../../_services/propietario.service';
import { DespachosService } from '../../despachos/despachos.service';
import { JwtHelperService } from '@auth0/angular-jwt';

import { DialogService } from 'primeng/dynamicdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    CalendarModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    PanelModule,
    TableModule,
    ToastModule,
    AutoCompleteModule
  ],
  providers: [DialogService, MessageService, ConfirmationService]
})
export class EditComponent implements OnInit {
  form: FormGroup;
  model: any = {};
  detalle: any[] = [];
  productosFiltrados: any[] = [];
  propietarios: SelectItem[] = [];
  ubigeo: SelectItem[] = [];

  pedidoId!: number;
  idPropietario?: number;
  estadoCliente: 'pendiente' | 'encontrado' | 'no_encontrado' = 'pendiente';
  dialogStockVisible = false;
  stockInfo: any = null;
  dialogLotesVisible = false;
  lotesInfo: any[] = [];
  jwtHelper = new JwtHelperService();
  decodedToken: any = {};

  constructor(
    private fb: FormBuilder,
    private b2bService: B2bService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private propietarioService: PropietarioService,
    private despachoService: DespachosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      idPedidoExterno: [''],
      ordenCompraCliente: ['', Validators.required],
      fechaRequerida: ['', Validators.required],
      horaRequerida: ['', Validators.required],
      observaciones: [''],

      nombre: ['', Validators.required],
      contacto: ['', Validators.required],
      documento: ['', Validators.required],
      telefono: ['', [Validators.maxLength(15)]],
      correo: ['', [Validators.email]],
      direccionEntrega: ['', Validators.required],
      iddestino: ['', Validators.required],
      latitud: [null],
      longitud: [null]
    });
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) this.decodedToken = this.jwtHelper.decodeToken(token);

    const usuarioId = this.decodedToken.nameid;

    this.propietarioService.getPropietariosByUsuario(usuarioId).subscribe({
      next: (resp) => {
        this.propietarios = resp.map((x) => ({
          value: x.id,
          label: x.razonSocial
        }));
        if (this.propietarios.length === 1) {
          this.idPropietario = this.propietarios[0].value;
        }
      },
      error: (err) => console.error('Error al cargar propietarios:', err)
    });

    // ✅ Obtener ID del pedido desde la ruta
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') || params.get('pedidoId');
      if (id) {
        this.pedidoId = +id;
        this.cargarPedido(this.pedidoId);
      }
    });

    // Cargar ubigeo
    this.b2bService.getUbigeo('').subscribe((resp) => {
      this.ubigeo = resp.map((x: any) => ({
        value: x.idDistrito,
        label: x.ubigeo
      }));
    });
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
}


  // ✅ Cargar datos del pedido desde el backend
  cargarPedido(id: number) {
    this.b2bService.getPedidoById(id).subscribe({
      next: (resp) => {
        if (resp?.data) {
          const pedido = resp.data;

          console.log('pedido', pedido);

          // Llenar form
          this.form.patchValue({
            ordenCompraCliente: pedido.ordenCompraCliente,
            fechaRequerida: new Date(pedido.fechaRequerida),
            horaRequerida: this.convertirHora(pedido.horaRequerida),
            observaciones: pedido.observaciones,
            nombre: pedido.comprador?.nombre,
            contacto: pedido.contacto,
            documento: pedido.comprador?.documento,
            telefono: pedido.telefono,
            correo: pedido.correo,
            direccionEntrega: pedido.comprador?.direccionEntrega,
            iddestino: pedido.comprador?.iddestino
          });

          // Cargar detalle
          this.b2bService.obtenerDetallePedido(id).subscribe({
            next: (detalleResp) => {
              this.detalle = detalleResp.data || [];
            },
            error: () => {
              this.messageService.add({
                severity: 'warn',
                summary: 'Aviso',
                detail: 'No se pudo cargar el detalle del pedido.'
              });
            }
          });
        }
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el pedido.'
        });
      }
    });
  }

  // 🔹 Formatea la hora en formato Date
  private convertirHora(horaString: string): Date | null {
    if (!horaString) return null;
    const [hours, minutes] = horaString.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  // ✅ Guardar los cambios del pedido
  guardarCambios() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Complete los campos requeridos.'
      });
      return;
    }

    const horaRequerida: Date = this.form.value.horaRequerida;
    const horaFormateada = horaRequerida
      ? new Date(horaRequerida).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : null;

    const pedidoActualizado = {
      id: this.pedidoId,
      ordenCompraCliente: this.form.value.ordenCompraCliente,
      fechaRequerida: this.form.value.fechaRequerida,
      horaRequerida: horaFormateada,
      observaciones: this.form.value.observaciones,
      comprador: {
        nombre: this.form.value.nombre,
        contacto: this.form.value.contacto,
        documento: this.form.value.documento,
        telefono: this.form.value.telefono,
        correo: this.form.value.correo,
        direccionEntrega: this.form.value.direccionEntrega,
        iddestino: this.form.value.iddestino
      },
      detalle: this.detalle.map((x) => ({
        codigo: x.codigo,
        cantidad: x.cantidad,
        unidadMedidaId: x.unidadMedidaId,
        lote: x.lote,
        referencia: x.referencia
      }))
    };





  this.confirmationService.confirm({
    header: 'Confirmar actualización',
    message: '¿Está seguro de guardar los cambios en este pedido?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, guardar',
    rejectLabel: 'Cancelar',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',
    acceptButtonStyleClass: 'p-button-success',
    rejectButtonStyleClass: 'p-button-secondary',

    accept: () => {




    this.b2bService.actualizarPedido(pedidoActualizado).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Pedido actualizado correctamente.'
        });
        this.router.navigate(['/b2b/ordenessalida']);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el pedido.'
        });
      }
    });

  },
    reject: () => {
      // 🔹 Si el usuario cancela
      this.messageService.add({
        severity: 'info',
        summary: 'Cancelado',
        detail: 'Los cambios no fueron guardados.'
      });
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
  this.stockInfo = null;

  const codigo = this.model.productoSeleccionado.codigo;

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
        this.lotesInfo = resp.map(lote => ({
          numeroLote: lote.lotNum,
          cantidadDisponible: lote.untQty,
          unidad: lote.codigo ? 'UND' : 'UND',
          codigo: lote.codigo,
          descripcionLarga: lote.descripcionLarga,
          fechaExpire: lote.fechaExpire,
          ubicacion: null,
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

seleccionarLote(lote: any) {
  console.log('✅ Lote seleccionado:', lote);

  this.model.lote = lote.numeroLote;

  if (this.model.cantidad > lote.cantidadDisponible) {
    this.model.cantidad = lote.cantidadDisponible;
  } else if (!this.model.cantidad) {
    this.model.cantidad = Math.min(1, lote.cantidadDisponible);
  }

  this.dialogLotesVisible = false;

  this.messageService.add({
    severity: 'success',
    summary: 'Lote seleccionado',
    detail: `Lote ${lote.numeroLote} - Disponible: ${lote.cantidadDisponible} ${lote.unidad}`
  });
}

calcularStockTotal(): number {
  if (!this.lotesInfo || this.lotesInfo.length === 0) {
    return 0;
  }
  return this.lotesInfo.reduce((total, lote) => total + (lote.cantidadDisponible || 0), 0);
}

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

