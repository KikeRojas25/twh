import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DespachosService } from '../../../despachos/despachos.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

type DialogInput = {
  ordenSalidaId: number;
  almacenId: number;
  propietarioId?: number | null;
};

type DetalleRow = {
  productoId: string | null;
  codigo: string;
  descripcion: string;
  lote: string | null;
  cantidad: number;
  stockDisponible: number | null;
  abastecido: boolean | null;
  stockMensaje: string | null;
};

@Component({
  selector: 'app-orden-salida-detalle-stock-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule],
  templateUrl: './orden-salida-detalle-stock-dialog.component.html',
  styleUrls: ['./orden-salida-detalle-stock-dialog.component.css']
})
export class OrdenSalidaDetalleStockDialogComponent implements OnInit {
  ordenSalidaId = 0;
  almacenId = 0;
  propietarioId: number | null = null;

  loading = false;
  detalle: DetalleRow[] = [];

  constructor(
    private despachosService: DespachosService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    const data = (this.config?.data ?? {}) as DialogInput;
    this.ordenSalidaId = Number(data.ordenSalidaId ?? 0);
    this.almacenId = Number(data.almacenId ?? 0);
    this.propietarioId = data.propietarioId ?? null;

    if (!this.ordenSalidaId || !this.almacenId) {
      this.detalle = [];
      return;
    }

    this.cargarDetalleYStock();
  }

  cerrar(): void {
    this.ref.close(null);
  }

  private cargarDetalleYStock(): void {
    this.loading = true;
    this.detalle = [];

    this.despachosService.obtenerDetalleOrdenSalida(this.ordenSalidaId).subscribe({
      next: (items: any[]) => {
        const rows = (items ?? []).map((item: any): DetalleRow => {
          const productoIdRaw =
            item.productoId ??
            item.ProductoId ??
            item.productoID ??
            item.ProductoID ??
            item.idProducto ??
            item.IdProducto ??
            item.codigo ??
            item.Codigo ??
            null;

          const codigoRaw =
            item.codigo ??
            item.Codigo ??
            item.productoCodigo ??
            item.ProductoCodigo ??
            item.productoId ??
            item.ProductoId ??
            '';

          const descripcion =
            item.descripcion ??
            item.Descripcion ??
            item.producto ??
            item.Producto ??
            'Sin descripción';

          const lote = item.lote ?? item.Lote ?? null;
          const cantidad = Number(item.cantidad ?? item.Cantidad ?? 0) || 0;

          return {
            productoId: productoIdRaw ? String(productoIdRaw) : null,
            codigo: String(codigoRaw ?? ''),
            descripcion: String(descripcion ?? ''),
            lote: lote ? String(lote) : null,
            cantidad,
            stockDisponible: null,
            abastecido: null,
            stockMensaje: null
          };
        });

        this.detalle = rows;

        if (rows.length === 0) {
          this.loading = false;
          return;
        }

        const requests = rows.map((row) => {
          if (!row.productoId) {
            return of({
              ok: false,
              stockDisponible: 0,
              stockMensaje: 'Sin productoId'
            });
          }

          return this.despachosService.validarStock(row.productoId, this.almacenId, row.lote).pipe(
            map((resp: any) => {
              const ok = !!resp?.success;
              const data = resp?.data ?? null;
              const stockDisponible = ok && data ? Number(data.stockDisponible ?? 0) : 0;
              const stockMensaje = resp?.message || (ok ? 'Stock disponible' : 'Sin stock');
              return { ok, stockDisponible, stockMensaje };
            }),
            catchError(() =>
              of({
                ok: false,
                stockDisponible: 0,
                stockMensaje: 'No se pudo validar stock'
              })
            )
          );
        });

        forkJoin(requests).subscribe({
          next: (results) => {
            this.detalle = this.detalle.map((row, idx) => {
              const r = results?.[idx];
              const stockDisponible = Number(r?.stockDisponible ?? 0);
              const abastecido = stockDisponible >= (Number(row.cantidad ?? 0) || 0);
              return {
                ...row,
                stockDisponible,
                abastecido,
                stockMensaje: r?.stockMensaje ?? null
              };
            });
            this.loading = false;
          },
          error: () => {
            // Si falla el forkJoin (raro, porque atrapamos errores), igual cerramos loading
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
        this.detalle = [];
      }
    });
  }

  getAbastecidoLabel(value: boolean | null): string {
    if (value === true) return 'Sí';
    if (value === false) return 'No';
    return '-';
  }

  getAbastecidoClass(value: boolean | null): string {
    if (value === true) return 'abastecido-ok';
    if (value === false) return 'abastecido-no';
    return 'abastecido-na';
  }
}

