import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProductoService } from '../../../_services/producto.service';
import { B2bService } from '../../../b2b/b2b.service';
import { GeneralService } from '../../../_services/general.service';
import { DespachosService } from '../../despachos.service';
import { buildOrdenSalidaDetalleRegisterRequest, OrdenSalidaDetalleInput } from '../neworder.mapper';

type DialogInput = {
  ordenSalidaId: number;
  cabeceraPayload: any;
};

@Component({
  selector: 'app-orden-salida-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    TableModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './orden-salida-detalle-dialog.component.html',
  styleUrls: ['./orden-salida-detalle-dialog.component.css']
})
export class OrdenSalidaDetalleDialogComponent implements OnInit {
  ordenSalidaId!: number;
  cabeceraPayload: any;

  detalle: any[] = [];
  productosFiltrados: any[] = [];
  estados: SelectItem[] = [];

  model: any = {};
  loading = false;

  dialogStockVisible = false;
  stockInfo: any = null;
  dialogLotesVisible = false;
  lotesInfo: any[] = [];
  stockValidando = false;
  stockDisponible: number | null = null;
  stockTieneDisponible: boolean | null = null;
  stockMensaje: string | null = null;

  jwtHelper = new JwtHelperService();
  decodedToken: any = {};

  constructor(
    private productoService: ProductoService,
    private b2bService: B2bService,
    private generalService: GeneralService,
    private despachosService: DespachosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    this.decodedToken = token ? this.jwtHelper.decodeToken(token) : {};

    const data = (this.config?.data ?? {}) as DialogInput;
    this.ordenSalidaId = Number(data.ordenSalidaId);
    this.cabeceraPayload = data.cabeceraPayload;

    // Cargar detalle existente (si ya tiene)
    this.cargarDetalleExistente();

    this.generalService.getAll(3).subscribe({
      next: (resp) => {
        this.estados = (resp ?? []).map((x: any) => ({ value: x.id, label: x.nombreEstado }));
        if (this.estados.length > 0) {
          this.model.estadoId = this.estados[0].value;
        }
      },
      error: (err) => console.error('Error al cargar estados:', err)
    });
  }

  private cargarDetalleExistente(): void {
    if (!this.ordenSalidaId) return;

    this.despachosService.obtenerDetalleOrdenSalida(this.ordenSalidaId).subscribe({
      next: (items: any[]) => {
        const existentes = (items ?? []).map((item: any) => {
          const ordenSalidaDetalleId = Number(item.ordenSalidaDetalleId ?? item.OrdenSalidaDetalleId ?? item.id ?? item.Id ?? 0) || null;
          const productoId = item.productoId ?? item.ProductoId ?? item.codigo ?? item.Codigo ?? null;
          const codigo = item.codigo ?? item.Codigo ?? item.productoId ?? item.ProductoId ?? '';
          const descripcion = item.descripcion ?? item.Descripcion ?? item.producto ?? item.Producto ?? 'Sin descripción';
          const lote = item.lote ?? item.Lote ?? null;
          const cantidad = item.cantidad ?? item.Cantidad ?? 0;
          const estadoId = item.estadoId ?? item.EstadoId ?? null;

          return {
            ordenSalidaDetalleId,
            productoId,
            codigo: String(codigo),
            descripcion,
            unidadMedida: item.unidadMedida ?? item.UnidadMedida ?? 'UND',
            lote,
            referencia: item.referencia ?? item.Referencia ?? null,
            cantidad: Number(cantidad) || 0,
            estadoId,
            huellaId: item.huellaId ?? item.HuellaId ?? null,
            // flags
            isNew: false,
            // stock ui
            stockDisponible: null,
            tieneStockDisponible: null,
            stockMensaje: 'Registrado previamente'
          };
        });

        // Insertar al inicio para diferenciar de los nuevos
        this.detalle = [...existentes, ...this.detalle];
      },
      error: (err) => {
        console.error('Error al cargar detalle existente:', err);
        // No bloquear el flujo: simplemente no precargar
      }
    });
  }

  cancelar(): void {
    this.ref.close(null);
  }

  getEstadoLabel(estadoId: any): string {
    const e = this.estados.find((x) => x.value === estadoId);
    return e?.label || '-';
  }

  buscarProductos(event: any): void {
    const texto = event.query?.trim();
    if (!texto || texto.length < 3) return;

    const propietarioId = Number(this.cabeceraPayload?.PropietarioId);
    if (!propietarioId) return;

    this.productoService.buscarProductosPorPropietario(propietarioId, texto).subscribe((res: any) => {
      this.productosFiltrados = (res ?? []).map((p: any) => ({
        ...p,
        nombreCompleto: `${p.nombreCompleto}`
      }));
    });
  }

  onProductoSeleccionado(): void {
    this.model.lote = null;
    this.model.cantidad = this.model.cantidad || 1;
    this.validarStockActual();
  }

  private getAlmacenId(): number | null {
    const almacenId = Number(this.cabeceraPayload?.AlmacenId);
    return Number.isFinite(almacenId) && almacenId > 0 ? almacenId : null;
  }

  private getProductoId(): string | null {
    const pid = this.model.productoSeleccionado?.id;
    return pid ? String(pid) : null;
  }

  validarStockActual(): void {
    const productoId = this.getProductoId();
    const almacenId = this.getAlmacenId();
    if (!productoId || !almacenId) {
      this.stockDisponible = null;
      this.stockTieneDisponible = null;
      this.stockMensaje = null;
      return;
    }

    this.stockValidando = true;
    this.despachosService.validarStock(productoId, almacenId, this.model.lote || null).subscribe({
      next: (resp: any) => {
        this.stockValidando = false;
        const ok = !!resp?.success;
        const data = resp?.data ?? null;
        this.stockDisponible = ok && data ? Number(data.stockDisponible ?? 0) : 0;
        this.stockTieneDisponible = ok && data ? !!data.tieneStockDisponible : false;
        this.stockMensaje = resp?.message || (ok ? 'Stock disponible' : 'Sin stock');
      },
      error: (err) => {
        console.error('Error ValidarStock:', err);
        this.stockValidando = false;
        this.stockDisponible = null;
        this.stockTieneDisponible = null;
        this.stockMensaje = 'No se pudo validar stock';
      }
    });
  }

  verStock(): void {
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

  verLotes(): void {
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
        if (resp && Array.isArray(resp) && resp.length > 0) {
          this.lotesInfo = resp.map((lote: any) => {
            let estadoTexto = lote.estado || null;
            const estadoId = lote.estadoId || null;
            if (!estadoTexto && estadoId && this.estados.length > 0) {
              const e = this.estados.find((x) => x.value === estadoId);
              estadoTexto = e ? e.label : 'Sin estado';
            }
            if (!estadoTexto) estadoTexto = lote.untQty > 0 ? 'Disponible' : 'Sin stock';
            return {
              numeroLote: lote.lotNum || null,
              cantidadDisponible: lote.untQty || 0,
              unidad: lote.unidadAlmacenamiento || lote.unidad || 'UND',
              codigo: lote.codigo,
              descripcionLarga: lote.descripcionLarga || lote.descripcion || '',
              // El modal B2B usa 'fechaVencimiento'
              fechaVencimiento: lote.fechaExpire || lote.fechaVencimiento || null,
              ubicacion: lote.ubicacion || null,
              estado: estadoTexto,
              estadoId
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
        console.error('Error al consultar lotes:', err);
        this.lotesInfo = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo consultar los lotes disponibles.'
        });
      }
    });
  }

  seleccionarLote(lote: any): void {
    this.model.lote = lote?.numeroLote || null;

    // Preseleccionar estado en la pantalla base (prioridad: estadoId, fallback: texto)
    const estadoIdResolved = this.resolveEstadoIdFromLote(lote);
    if (estadoIdResolved !== null && estadoIdResolved !== undefined) {
      this.model.estadoId = estadoIdResolved;
    }

    if (this.model.cantidad > lote.cantidadDisponible) {
      this.model.cantidad = lote.cantidadDisponible;
    } else if (!this.model.cantidad) {
      this.model.cantidad = Math.min(1, lote.cantidadDisponible);
    }

    this.dialogLotesVisible = false;
    this.validarStockActual();
    this.messageService.add({
      severity: 'success',
      summary: 'Lote seleccionado',
      detail: `Lote ${lote.numeroLote} - Disponible: ${lote.cantidadDisponible} ${lote.unidad}`
    });
  }

  private resolveEstadoIdFromLote(lote: any): any {
    // 1) Si viene estadoId numérico, mapearlo a la lista de estados
    const rawEstadoId = lote?.estadoId;
    if (rawEstadoId !== null && rawEstadoId !== undefined) {
      const estadoIdNum = Number(rawEstadoId);
      const estadoEncontrado = this.estados.find((e) => Number(e.value) === estadoIdNum || e.value === rawEstadoId);
      if (estadoEncontrado) return estadoEncontrado.value;
    }

    // 2) Fallback por texto del estado
    const estadoTexto = (lote?.estado ?? '').toString().trim().toLowerCase();
    if (!estadoTexto) return null;

    // match exacto o por inclusión
    const match = this.estados.find((e) => {
      const label = (e.label ?? '').toString().trim().toLowerCase();
      if (!label) return false;
      return label === estadoTexto || label.includes(estadoTexto) || estadoTexto.includes(label);
    });

    return match ? match.value : null;
  }

  /**
   * Calcula el stock total sumando todos los lotes disponibles
   */
  calcularStockTotal(): number {
    if (!this.lotesInfo || this.lotesInfo.length === 0) {
      return 0;
    }
    return this.lotesInfo.reduce((total: number, l: any) => total + (l.cantidadDisponible || 0), 0);
  }

  /**
   * Obtiene la fecha de vencimiento más próxima de los lotes
   */
  obtenerProximoVencimiento(): string {
    if (!this.lotesInfo || this.lotesInfo.length === 0) {
      return 'N/A';
    }

    const lotesConFecha = this.lotesInfo
      .filter((l: any) => l.fechaVencimiento)
      .sort((a: any, b: any) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

    if (lotesConFecha.length === 0) {
      return 'Sin vencimiento';
    }

    const fechaProxima = new Date(lotesConFecha[0].fechaVencimiento);
    return fechaProxima.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  agregarItem(): void {
    if (!this.model.productoSeleccionado) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un producto antes de agregar.' });
      return;
    }
    if (!this.model.cantidad || this.model.cantidad <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese una cantidad válida.' });
      return;
    }

    const productoId = this.getProductoId();
    const almacenId = this.getAlmacenId();
    if (productoId && almacenId) {
      this.stockValidando = true;
      this.despachosService.validarStock(productoId, almacenId, this.model.lote || null).subscribe({
        next: (resp: any) => {
          this.stockValidando = false;
          const ok = !!resp?.success;
          const data = resp?.data ?? null;
          const disponible = ok && data ? Number(data.stockDisponible ?? 0) : 0;
          this.stockDisponible = disponible;
          this.stockTieneDisponible = ok && data ? !!data.tieneStockDisponible : false;
          this.stockMensaje = resp?.message || (ok ? 'Stock disponible' : 'Sin stock');

          // Sin alertas: guardamos el stock disponible en la fila y resaltamos en la tabla si no alcanza
          this.addItemToDetalle({
            stockDisponible: disponible,
            tieneStockDisponible: this.stockTieneDisponible,
            stockMensaje: this.stockMensaje
          });
        },
        error: () => {
          this.stockValidando = false;
          // Sin alertas: agregar igual, pero sin stock validado
          this.addItemToDetalle({
            stockDisponible: null,
            tieneStockDisponible: null,
            stockMensaje: 'No se pudo validar stock'
          });
        }
      });
      return;
    }

    // Sin datos para validar stock (falta almacén), igual permitir
    this.addItemToDetalle({
      stockDisponible: null,
      tieneStockDisponible: null,
      stockMensaje: null
    });
  }

  private addItemToDetalle(stockInfo: { stockDisponible: number | null; tieneStockDisponible: boolean | null; stockMensaje: string | null }): void {
    const loteActual = this.model.lote || null;
    const existente = this.detalle.find((d) => d.productoId === this.model.productoSeleccionado.id && (d.lote || null) === loteActual);

    if (existente) {
      // Si el ítem ya existe previamente en backend, no lo modificamos aquí para evitar inconsistencias
      if (existente.isNew === false) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'Este producto (y lote) ya existe en el detalle. Use otro lote o agregue un producto diferente.'
        });
        return;
      }
      existente.cantidad += this.model.cantidad;
      if (this.model.estadoId) existente.estadoId = this.model.estadoId;
      // Mantener el stock validado más reciente (si vino)
      if (stockInfo && (stockInfo.stockDisponible !== null || stockInfo.tieneStockDisponible !== null)) {
        existente.stockDisponible = stockInfo.stockDisponible;
        existente.tieneStockDisponible = stockInfo.tieneStockDisponible;
        existente.stockMensaje = stockInfo.stockMensaje;
      }
      this.messageService.add({
        severity: 'info',
        summary: 'Actualizado',
        detail: `La cantidad del producto ${this.model.productoSeleccionado.nombreCompleto}${loteActual ? ' (Lote: ' + loteActual + ')' : ''} fue actualizada.`
      });
    } else {
      const descripcion =
        this.model.productoSeleccionado.nombreCompleto ||
        this.model.productoSeleccionado.descripcion ||
        this.model.productoSeleccionado.descripcionLarga ||
        this.model.productoSeleccionado.codigo ||
        'Sin descripción';

      this.detalle.push({
        productoId: this.model.productoSeleccionado.id,
        codigo: this.model.productoSeleccionado.codigo || '',
        descripcion,
        unidadMedida: this.model.productoSeleccionado.unidad || 'UND',
        lote: this.model.lote || null,
        referencia: this.model.referencia || null,
        cantidad: this.model.cantidad,
        estadoId: this.model.estadoId || (this.estados.length > 0 ? this.estados[0].value : 0),
        huellaId: null,
        stockDisponible: stockInfo?.stockDisponible ?? null,
        tieneStockDisponible: stockInfo?.tieneStockDisponible ?? null,
        stockMensaje: stockInfo?.stockMensaje ?? null,
        isNew: true
      });

      this.messageService.add({ severity: 'success', summary: 'Agregado', detail: 'Producto agregado al detalle.' });
    }

    this.model.productoSeleccionado = null;
    this.model.cantidad = null;
    this.model.lote = null;
    this.model.referencia = null;
    if (this.estados.length > 0) this.model.estadoId = this.estados[0].value;
  }

  getStockCellClass(rowData: any): any {
    if (rowData?.isNew === false) {
      return { 'bg-gray-50 text-gray-500 border-gray-200': true };
    }
    const tieneDisponible = rowData?.tieneStockDisponible;
    const disponibleRaw = rowData?.stockDisponible;
    const disponible = disponibleRaw === null || disponibleRaw === undefined ? null : Number(disponibleRaw);
    const cantidad = Number(rowData?.cantidad);

    const insuficiente =
      tieneDisponible === false ||
      (disponible !== null && Number.isFinite(disponible) && Number.isFinite(cantidad) && disponible < cantidad);

    return {
      'bg-red-50 text-red-700 border-red-200': insuficiente,
      'bg-gray-50 text-gray-700 border-gray-200': !insuficiente
    };
  }

  eliminarFila(index: number): void {
    const row = this.detalle[index];
    if (!row) return;

    // Si es nuevo (aún no registrado), eliminar solo local
    if (row.isNew === true) {
      this.detalle.splice(index, 1);
      this.messageService.add({ severity: 'info', summary: 'Eliminado', detail: 'Ítem eliminado (aún no registrado).' });
      return;
    }

    // Si ya está registrado, eliminar en servidor
    const detalleId = Number(row.ordenSalidaDetalleId ?? 0);
    if (!Number.isFinite(detalleId) || detalleId <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID del detalle para eliminar.'
      });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Desea eliminar este detalle registrado?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.despachosService.deleteOrdenSalidaDetalle(detalleId).subscribe({
          next: (resp: any) => {
            if (resp?.success === false) {
              this.messageService.add({
                severity: 'warn',
                summary: 'No se pudo eliminar',
                detail: resp?.message || 'El servidor rechazó la eliminación.'
              });
              return;
            }
            this.detalle.splice(index, 1);
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: resp?.message || 'Detalle eliminado correctamente'
            });
          },
          error: (err) => {
            console.error('Error al eliminar detalle:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'No se pudo eliminar el detalle.'
            });
          }
        });
      }
    });
  }

  finalizar(): void {
    const nuevos = (this.detalle ?? []).filter((x) => x?.isNew === true);
    if (!nuevos || nuevos.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe agregar al menos un producto al detalle.' });
      return;
    }

    const detalleInput: OrdenSalidaDetalleInput[] = nuevos.map((x) => ({
      productoId: x.productoId,
      cantidad: x.cantidad,
      estadoId: x.estadoId,
      lote: x.lote,
      referencia: x.referencia,
      huellaId: x.huellaId
    }));

    const usuarioId = Number(this.decodedToken?.nameid);
    const payload = buildOrdenSalidaDetalleRegisterRequest({
      ordenSalidaId: this.ordenSalidaId,
      usuarioId,
      detalle: detalleInput
    });

    this.confirmationService.confirm({
      header: 'Confirmar',
      message: '¿Desea finalizar y guardar el detalle?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, guardar',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.loading = true;
        this.despachosService.registerOrdenSalidaDetalle(payload).subscribe({
          next: () => {
            this.loading = false;
            this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Detalle registrado correctamente.' });
            this.ref.close({ success: true });
          },
          error: (err) => {
            this.loading = false;
            console.error(err);
            if (err?.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
              const mensajePrincipal = err.error.message || 'Error de validación';
              this.messageService.add({ severity: 'error', summary: 'Error de validación', detail: mensajePrincipal });
              err.error.errors.forEach((errorMsg: string) => {
                if (errorMsg && errorMsg.trim()) {
                  this.messageService.add({ severity: 'warn', summary: 'Validación', detail: errorMsg.trim(), life: 8000 });
                }
              });
            } else {
              const mensajeError = err?.error?.message || 'No se pudo actualizar la orden de salida.';
              this.messageService.add({ severity: 'error', summary: 'Error', detail: mensajeError });
            }
          }
        });
      }
    });
  }
}

