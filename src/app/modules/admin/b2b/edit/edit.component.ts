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
import { GeneralService } from '../../_services/general.service';

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
import { MatIcon } from '@angular/material/icon';

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
    AutoCompleteModule,
    MatIcon
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
  estados: SelectItem[] = [];

  pedidoId!: number;
  ordenCabeceraActual: any = null;
  idPropietario?: number;
  private propietarioIdFallback?: number;
  private compradorNombreFallback?: string;
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
    private generalService: GeneralService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      idPedidoExterno: [''],
      ordenCompraCliente: ['', Validators.required],
      fechaRequerida: ['', Validators.required],
      horaRequerida: ['', Validators.required],
      observaciones: [''],
      clienteId: [null],
      direccionId: [null],

      nombre: ['', Validators.required],
      contacto: [''],
      documento: ['', Validators.required],
      telefono: ['', [Validators.maxLength(15)]],
      correo: ['', [Validators.email]],
      direccionEntrega: ['', Validators.required],
      iddestino: [''],
      latitud: [null],
      longitud: [null]
    });
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) this.decodedToken = this.jwtHelper.decodeToken(token);

    const usuarioId = this.decodedToken.nameid;

    const propietarioIdQuery = Number(this.route.snapshot.queryParamMap.get('propietarioId') || 0);
    if (propietarioIdQuery > 0) {
      this.propietarioIdFallback = propietarioIdQuery;
    }

    this.propietarioService.getPropietariosByUsuario(usuarioId).subscribe({
      next: (resp) => {
        this.propietarios = resp.map((x) => ({
          value: x.id,
          label: x.razonSocial
        }));

        if (!this.idPropietario) {
          this.intentarResolverPropietarioPorNombre();
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

    // Catálogo de estados (tabla 3). Fallback si el API de lotes no retorna estadoId.
    this.generalService.getAll(3).subscribe({
      next: (resp: any[]) => {
        this.estados = (resp ?? []).map((x: any) => ({ value: x.id, label: x.nombreEstado }));
      },
      error: (err) => console.error('Error al cargar estados (tabla 3):', err),
    });
  }

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

  obtenerNombreEstadoPorId(estadoId: any): string | null {
    const id = Number(estadoId);
    if (!id || !this.estados?.length) {
      return null;
    }

    const estado = this.estados.find((item) => Number(item.value) === id);
    return estado?.label ? String(estado.label) : null;
  }

  obtenerTextoEstado(row: any): string {
    return row?.estado ?? this.obtenerNombreEstadoPorId(row?.estadoId) ?? '-';
  }

  private normalizarTexto(value: any): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private intentarResolverPropietarioPorNombre(): void {
    if (this.idPropietario || !this.compradorNombreFallback || !this.propietarios?.length) {
      return;
    }

    const comprador = this.normalizarTexto(this.compradorNombreFallback);
    const exacto = this.propietarios.find((p) => this.normalizarTexto(p.label) === comprador);
    const parcial = this.propietarios.find((p) => this.normalizarTexto(p.label).includes(comprador) || comprador.includes(this.normalizarTexto(p.label)));
    const match = exacto || parcial;

    if (match?.value) {
      this.idPropietario = Number(match.value);
    }
  }


  
      
    buscarProductos(event: any): void {
        const texto = event.query?.trim();
        if (!texto || texto.length < 2) return;

        const propietarioIdBusqueda = Number(this.idPropietario || 0);

        if (!propietarioIdBusqueda || propietarioIdBusqueda <= 0) {
          this.intentarResolverPropietarioPorNombre();
        }

        const propietarioResuelto = Number(this.idPropietario || 0);

        if (!propietarioResuelto || propietarioResuelto <= 0) {
          this.productosFiltrados = [];
          this.messageService.add({
            severity: 'warn',
            summary: 'Propietario no definido',
            detail: 'No se puede listar productos porque no se encontró el propietario de la orden.'
          });
          return;
        }

        this.productoService.buscarProductosPorPropietario(propietarioResuelto, texto)
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

  // 🔹 Consolidar solo si coinciden producto, lote y estado
  const loteActual = this.model.lote || null;
  const existente = this.detalle.find((d) => {
    const mismoProducto = d.productoId === this.model.productoSeleccionado.id;
    const mismoLote = (d.lote || null) === loteActual;
    const mismoEstado = Number(d.estadoId || 0) === estadoIdNum;
    return mismoProducto && mismoLote && mismoEstado;
  });

  if (existente) {
    // Si ya existe, sumamos la cantidad
    existente.cantidad += this.model.cantidad;
    existente.estado = existente.estado || this.model.estadoTexto || this.obtenerNombreEstadoPorId(this.model.estadoId);
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
      estado: this.model.estadoTexto || this.obtenerNombreEstadoPorId(this.model.estadoId),
      estadoId: Number(this.model.estadoId),
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
    this.despachoService.obtenerOrdenSalidaPorId(id).subscribe({
      next: (orden: any) => {
        this.aplicarCabeceraDesdeOrdenSalida(orden);
        this.cargarDetalleDesdeOrdenSalida(id);
        this.completarCabeceraDesdePedidoB2B(id);
      },
      error: (err) => {
        console.error('Error al cargar cabecera de orden de salida:', err);
        // Fallback para registros legacy
        this.cargarPedidoLegacyB2B(id);
      }
    });
  }

  private aplicarCabeceraDesdeOrdenSalida(orden: any): void {
    this.ordenCabeceraActual = orden || null;
    const valor = (...candidatos: any[]) => candidatos.find((x) => x !== undefined && x !== null && x !== '');

    const fechaRequeridaRaw = valor(orden?.fechaRequerida, orden?.FechaRequerida);
    const horaRequeridaRaw = valor(orden?.horaRequerida, orden?.HoraRequerida);
    const nombreRaw = valor(
      orden?.destinatario,
      orden?.Destinatario,
      orden?.nombre,
      orden?.Nombre
    );

    this.compradorNombreFallback = nombreRaw || null;

    this.form.patchValue({
      ordenCompraCliente: valor(orden?.ordenCompraCliente, orden?.OrdenCompraCliente, ''),
      fechaRequerida: fechaRequeridaRaw ? new Date(fechaRequeridaRaw) : null,
      horaRequerida: horaRequeridaRaw ? this.convertirHora(horaRequeridaRaw) : null,
      observaciones: valor(orden?.observaciones, orden?.Observaciones, ''),
      clienteId: valueOrNull(valor(orden?.clienteId, orden?.ClienteId)),
      direccionId: valueOrNull(valor(orden?.direccionId, orden?.DireccionId)),
      nombre: nombreRaw || '',
      contacto: valor(orden?.contacto, orden?.Contacto, ''),
      documento: valor(orden?.documento, orden?.Documento, ''),
      telefono: valor(orden?.telefono, orden?.Telefono, ''),
      correo: valor(orden?.correo, orden?.Correo, ''),
      direccionEntrega: valor(
        orden?.direccion,
        orden?.Direccion,
        orden?.direccionEntrega,
        orden?.DireccionEntrega,
        ''
      ),
      iddestino: valueOrNull(valor(
        orden?.iddestino,
        orden?.IdDestino,
        orden?.PedUbicacionId,
        orden?.UbicacionId
      )),
    });

    const propietarioIdOrden = Number(valor(
      orden?.propietarioId,
      orden?.PropietarioId,
      orden?.propietarioID,
      orden?.PropietarioID,
      orden?.propietario?.id,
      orden?.Propietario?.Id,
      0
    ));

    if (propietarioIdOrden > 0) {
      this.idPropietario = propietarioIdOrden;
    } else if (this.propietarioIdFallback && this.propietarioIdFallback > 0) {
      this.idPropietario = this.propietarioIdFallback;
    } else {
      this.idPropietario = undefined;
      this.productosFiltrados = [];
      this.intentarResolverPropietarioPorNombre();
    }

    this.cargarCompradorYDireccionDesdeCliente(
      valor(orden?.clienteId, orden?.ClienteId),
      valor(orden?.direccionId, orden?.DireccionId)
    );

    function valueOrNull(v: any): any {
      return v === undefined || v === '' ? null : v;
    }
  }

  private cargarCompradorYDireccionDesdeCliente(clienteIdRaw: any, direccionIdRaw: any): void {
    const clienteId = Number(clienteIdRaw || 0);
    const direccionId = Number(direccionIdRaw || 0);

    if (!clienteId || clienteId <= 0) {
      return;
    }

    this.form.patchValue({ clienteId, direccionId: direccionId > 0 ? direccionId : null });

    const propietarioId = Number(this.idPropietario || 0);
    if (propietarioId > 0) {
      this.clienteService.getAllClientesxPropietarios(propietarioId).subscribe({
        next: (clientes: any[]) => {
          const cliente = (clientes || []).find((x: any) => Number(x?.id) === clienteId);
          if (!cliente) {
            return;
          }

          this.form.patchValue({
            nombre: this.form.get('nombre')?.value || cliente?.razonSocial || cliente?.nombre || cliente?.cliente || '',
            documento: this.form.get('documento')?.value || cliente?.documento || cliente?.ruc || '',
            contacto: this.form.get('contacto')?.value || cliente?.contacto || '',
            telefono: this.form.get('telefono')?.value || cliente?.telefono || '',
            correo: this.form.get('correo')?.value || cliente?.correo || ''
          });
        },
        error: () => {
          // Complemento no bloqueante
        }
      });
    }

    this.clienteService.getAllDirecciones(clienteId).subscribe({
      next: (direcciones: any[]) => {
        const direccion = (direcciones || []).find((x: any) =>
          Number(x?.iddireccion ?? x?.idDireccion ?? x?.id ?? 0) === direccionId
        ) || (direcciones || [])[0];

        if (!direccion) {
          return;
        }

        this.form.patchValue({
          direccionId: Number(direccion?.iddireccion ?? direccion?.idDireccion ?? direccion?.id ?? direccionId ?? 0) || null,
          direccionEntrega: this.form.get('direccionEntrega')?.value || direccion?.direccion || '',
          iddestino: this.form.get('iddestino')?.value || direccion?.iddestino || direccion?.idDestino || direccion?.idDistrito || null,
          latitud: this.form.get('latitud')?.value || direccion?.latitud || null,
          longitud: this.form.get('longitud')?.value || direccion?.longitud || null,
        });
      },
      error: () => {
        // Complemento no bloqueante
      }
    });
  }

  private cargarDetalleDesdeOrdenSalida(id: number): void {
    this.despachoService.obtenerDetalleOrdenSalida(id).subscribe({
      next: (detalleResp: any[]) => {
        if (!detalleResp || detalleResp.length === 0) {
          this.cargarDetalleLegacyB2B(id);
          return;
        }

        this.detalle = (detalleResp || []).map((item: any) => ({
          productoId: item?.productoId ?? item?.ProductoId ?? null,
          codigo: item?.codigo ?? item?.Codigo ?? item?.productoId ?? item?.ProductoId ?? '-',
          descripcion: item?.descripcion ?? item?.Descripcion ?? item?.producto ?? item?.Producto ?? '-',
          unidadMedida: item?.unidadMedida ?? item?.UnidadMedida ?? item?.unidad ?? item?.Unidad ?? 'UND',
          lote: item?.lote ?? item?.Lote ?? null,
          referencia: item?.referencia ?? item?.Referencia ?? null,
          cantidad: Number(item?.cantidad ?? item?.Cantidad ?? 0),
          estado: item?.estado ?? item?.Estado ?? this.obtenerNombreEstadoPorId(item?.estadoId ?? item?.EstadoId ?? 0),
          estadoId: Number(item?.estadoId ?? item?.EstadoId ?? 0),
          huellaId: item?.huellaId ?? item?.HuellaId ?? null
        }));
      },
      error: () => {
        this.cargarDetalleLegacyB2B(id);
      }
    });
  }

  private completarCabeceraDesdePedidoB2B(id: number): void {
    this.b2bService.getPedidoById(id).subscribe({
      next: (resp) => {
        const pedido = resp?.data;
        if (!pedido) {
          return;
        }

        const clienteIdPedido = pedido?.clienteId ?? pedido?.ClienteId ?? pedido?.comprador?.id ?? null;
        const direccionIdPedido = pedido?.direccionId ?? pedido?.DireccionId ?? pedido?.comprador?.direccionId ?? null;

        // Completar solo campos que no llegaron desde OrdenSalida
        if (!this.form.get('documento')?.value || !this.form.get('nombre')?.value || !this.form.get('iddestino')?.value) {
          this.form.patchValue({
            clienteId: this.form.get('clienteId')?.value || clienteIdPedido || null,
            direccionId: this.form.get('direccionId')?.value || direccionIdPedido || null,
            documento: this.form.get('documento')?.value || pedido?.comprador?.documento || '',
            nombre: this.form.get('nombre')?.value || pedido?.comprador?.nombre || pedido?.comprador?.razonSocial || '',
            contacto: this.form.get('contacto')?.value || pedido?.contacto || '',
            telefono: this.form.get('telefono')?.value || pedido?.telefono || '',
            correo: this.form.get('correo')?.value || pedido?.correo || '',
            direccionEntrega: this.form.get('direccionEntrega')?.value || pedido?.comprador?.direccionEntrega || '',
            iddestino: this.form.get('iddestino')?.value || pedido?.comprador?.iddestino || null,
          });

          if (!this.idPropietario) {
            const propietarioIdPedido = Number(
              pedido?.propietarioId ??
              pedido?.PropietarioId ??
              pedido?.propietarioID ??
              pedido?.PropietarioID ??
              pedido?.propietario?.id ??
              pedido?.Propietario?.Id ??
              pedido?.ordenSalida?.propietarioId ??
              pedido?.ordenSalida?.PropietarioId ??
              pedido?.cabecera?.propietarioId ??
              pedido?.cabecera?.PropietarioId ??
              0
            );
            if (propietarioIdPedido > 0) {
              this.idPropietario = propietarioIdPedido;
            }
          }

          this.cargarCompradorYDireccionDesdeCliente(clienteIdPedido, direccionIdPedido);
        }
      },
      error: () => {
        // Sin ruido: es un complemento y no debe bloquear la edición
      }
    });
  }

  private cargarDetalleLegacyB2B(id: number): void {
    this.b2bService.obtenerDetallePedido(id).subscribe({
      next: (detalleResp) => {
        this.detalle = (detalleResp?.data || []).map((item: any) => ({
          productoId: item?.productoId ?? item?.ProductoId ?? null,
          codigo: item?.codigo ?? item?.Codigo ?? '-',
          descripcion: item?.descripcion ?? item?.Descripcion ?? item?.producto ?? item?.Producto ?? '-',
          unidadMedida: item?.unidadMedida ?? item?.UnidadMedida ?? item?.unidad ?? item?.Unidad ?? 'UND',
          lote: item?.lote ?? item?.Lote ?? null,
          referencia: item?.referencia ?? item?.Referencia ?? null,
          cantidad: Number(item?.cantidad ?? item?.Cantidad ?? 0),
          estado: item?.estado ?? item?.Estado ?? this.obtenerNombreEstadoPorId(item?.estadoId ?? item?.EstadoId ?? 0),
          estadoId: Number(item?.estadoId ?? item?.EstadoId ?? 0),
          huellaId: item?.huellaId ?? item?.HuellaId ?? null
        }));
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

  private cargarPedidoLegacyB2B(id: number): void {
    this.b2bService.getPedidoById(id).subscribe({
      next: (resp) => {
        const pedido = resp?.data;
        if (!pedido) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se encontró la cabecera de la orden para edición.'
          });
          return;
        }

        this.compradorNombreFallback = pedido.comprador?.nombre || pedido.comprador?.razonSocial || null;
        this.form.patchValue({
          ordenCompraCliente: pedido.ordenCompraCliente,
          fechaRequerida: pedido.fechaRequerida ? new Date(pedido.fechaRequerida) : null,
          horaRequerida: pedido.horaRequerida ? this.convertirHora(pedido.horaRequerida) : null,
          observaciones: pedido.observaciones,
          clienteId: pedido?.clienteId ?? pedido?.ClienteId ?? pedido?.comprador?.id ?? null,
          direccionId: pedido?.direccionId ?? pedido?.DireccionId ?? pedido?.comprador?.direccionId ?? null,
          nombre: pedido.comprador?.nombre,
          contacto: pedido.contacto,
          documento: pedido.comprador?.documento,
          telefono: pedido.telefono,
          correo: pedido.correo,
          direccionEntrega: pedido.comprador?.direccionEntrega,
          iddestino: pedido.comprador?.iddestino
        });

        const propietarioIdPedido = Number(
          pedido?.propietarioId ??
          pedido?.PropietarioId ??
          pedido?.propietarioID ??
          pedido?.PropietarioID ??
          pedido?.propietario?.id ??
          pedido?.Propietario?.Id ??
          pedido?.ordenSalida?.propietarioId ??
          pedido?.ordenSalida?.PropietarioId ??
          pedido?.cabecera?.propietarioId ??
          pedido?.cabecera?.PropietarioId ??
          resp?.propietarioId ??
          resp?.PropietarioId ??
          0
        );

        if (propietarioIdPedido > 0) {
          this.idPropietario = propietarioIdPedido;
        } else if (this.propietarioIdFallback && this.propietarioIdFallback > 0) {
          this.idPropietario = this.propietarioIdFallback;
        } else {
          this.idPropietario = undefined;
          this.productosFiltrados = [];
          this.intentarResolverPropietarioPorNombre();
        }

        this.cargarCompradorYDireccionDesdeCliente(
          pedido?.clienteId ?? pedido?.ClienteId ?? pedido?.comprador?.id ?? null,
          pedido?.direccionId ?? pedido?.DireccionId ?? pedido?.comprador?.direccionId ?? null
        );

        this.cargarDetalleLegacyB2B(id);
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

    const fechaRequerida: Date = this.form.value.fechaRequerida;
    const fechaFormateada = fechaRequerida
      ? new Date(fechaRequerida).toISOString().split('T')[0]
      : null;

    const pedidoActualizado = {
      id: this.pedidoId,
      ordenCompraCliente: this.form.value.ordenCompraCliente,
      fechaRequerida: fechaFormateada,
      horaRequerida: horaFormateada,
      observaciones: this.form.value.observaciones,
      comprador: {
        nombre: this.form.value.nombre,
        contacto: this.form.value.contacto,
        documento: this.form.value.documento,
        telefono: this.form.value.telefono,
        correo: this.form.value.correo,
        direccionEntrega: this.form.value.direccionEntrega,
        iddestino: Number(this.form.value.iddestino || 0)
      },
      detalle: this.detalle.map((x) => {
        const item: any = {
          codigo: x.codigo,
          cantidad: x.cantidad,
          unidadMedidaId: Number(x.unidadMedidaId || 0),
          estadoId: Number(x.estadoId || 0)
        };
        if (x.lote) item.lote = x.lote;
        if (x.referencia) item.referencia = x.referencia;
        return item;
      })
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
          const detalle = err?.error?.message || 'No se pudo actualizar el pedido.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: detalle
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

seleccionarLote(lote: any) {
  console.log('✅ Lote seleccionado:', lote);

  this.model.lote = lote.numeroLote;
  this.model.estadoTexto = lote.estado ?? lote.Estado ?? null;
  const rawEstadoId = (lote.estadoId ?? lote.EstadoId ?? lote.estadoID ?? lote.EstadoID ?? lote.idEstado ?? lote.IdEstado ?? null);
  const estadoIdNum = rawEstadoId !== null && rawEstadoId !== undefined ? Number(rawEstadoId) : null;
  this.model.estadoId = (estadoIdNum && estadoIdNum > 0) ? estadoIdNum : this.inferEstadoIdFromTexto(this.model.estadoTexto ?? (lote.cantidadDisponible > 0 ? 'Disponible' : 'Sin stock'));

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
    .filter(lote => lote.fechaExpire)
    .sort((a, b) => new Date(a.fechaExpire).getTime() - new Date(b.fechaExpire).getTime());

  if (lotesConFecha.length === 0) {
    return 'Sin vencimiento';
  }

  const fechaProxima = new Date(lotesConFecha[0].fechaExpire);
  return fechaProxima.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

get totalCantidadDetalle(): number {
  return this.detalle.reduce((total, item) => total + Number(item.cantidad || 0), 0);
}

get formularioListoParaGuardado(): boolean {
  return this.form.valid && this.detalle.length > 0;
}

get destinoSeleccionadoLabel(): string {
  const direccionEntrega = String(this.form.get('direccionEntrega')?.value || '').trim();
  if (direccionEntrega) {
    return direccionEntrega;
  }

  const idDestino = this.form.get('iddestino')?.value;
  return this.ubigeo.find((item) => item.value === idDestino)?.label ?? 'Pendiente de seleccionar';
}

get compradorDisplay(): string {
  return this.form.get('nombre')?.value || 'Comprador no definido';
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

