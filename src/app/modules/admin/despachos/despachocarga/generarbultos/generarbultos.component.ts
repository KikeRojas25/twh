import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { BultoProducto, BultoSalida, OrdenSalidaDetalle } from '../../despachos.types';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DespachosService } from '../../despachos.service';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-generarbultos',
  templateUrl: './generarbultos.component.html',
  styleUrls: ['./generarbultos.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule
  ]
})
export class GenerarbultosComponent implements OnInit {
  detalles: OrdenSalidaDetalle[] = [];
  bultos: BultoSalida[] = [];

  selectedItems!: OrdenSalidaDetalle;
  bultoSeleccionadoId: number | null = null;
  cantidadAsignar: number = 0;
  contadorBultos = 1;

  productos?: BultoProducto[]; // lo usamos para el frontend

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private cd: ChangeDetectorRef,
    private ordenSalidaService: DespachosService
  ) { }

  ngOnInit(): void {
    const ordenSalidaId = this.config.data?.ordenSalidaId;
    if (ordenSalidaId) {
      this.ordenSalidaService.obtenerDetalleOrdenSalida(ordenSalidaId).subscribe({
        next: data => {
          this.detalles = data;
        },
        error: err => {
          console.error('Error al cargar detalles:', err);
        }
      });


      // 2. Obtener bultos previamente registrados
        this.ordenSalidaService.obtenerBultosPorOrden(ordenSalidaId).subscribe({
          next: bultosDesdeApi => {
            this.bultos = bultosDesdeApi.map(b => ({
              ...b,
              productos: b.detalles?.map(d => {
                const infoProducto = this.detalles.find(p => p.id === d.ordenSalidaDetalleId);
                return {
                  id: d.id,
                  productoId: d.ordenSalidaDetalleId,
                  productoNombre: infoProducto?.producto || '(?)',
                  lote: infoProducto?.Lote || '',
                  cantidadAsignada: d.cantidad
                };
              }) ?? []
            }));
          },
          error: err => console.error('Error cargando bultos previos', err)
        });











    }


  }

  cerrar(): void {
    this.ref.close();
  }
cargarBultos(): void {

  this.bultos = []; // Limpiar bultos antes de recargar

  this.ordenSalidaService.obtenerBultosPorOrden(this.config.data?.ordenSalidaId).subscribe({
    next: (bultosDesdeApi) => {

      console.log('Bultos recargados:', bultosDesdeApi);


      this.bultos = [...bultosDesdeApi.map(b => ({
        ...b,
        productos: b.detalles?.map(d => {
          const info = this.detalles.find(p => p.id === d.ordenSalidaDetalleId);
          return {
            id: d.id,
            productoId: d.ordenSalidaDetalleId,
            productoNombre: info?.producto || '(?)',
            lote: info?.Lote || '',
            cantidadAsignada: d.cantidad
          };
        }) ?? []
      }))];

      this.cd.detectChanges(); // Forzar refresh visual
    },
    error: err => {
      console.error('❌ Error al recargar bultos', err);
    }
  });
}

  get bultosDropdownOptions() {
    return this.bultos.map(b => ({
      label: 'Bulto #' + b.numeroBulto,
      value: b.id
    }));
  }

  crearBulto(): void {
    const ordenSalidaId = this.config.data?.ordenSalidaId;
    const idUsuarioRegistro = 2; // ⚠️ Puedes obtenerlo desde token/session

    this.ordenSalidaService.agregarBulto(ordenSalidaId, {
      numeroBulto: this.contadorBultos,
      peso: 0,
      idUsuarioRegistro,
      ordenSalidaId
    }).subscribe({
      next: bultoCreado => {
        const bulto: BultoSalida = {
          ...bultoCreado,
          productos: []
        };
        this.bultos.push(bulto);
        this.bultos = [...this.bultos];
        this.bultoSeleccionadoId = bulto.id!;
        this.contadorBultos++;
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Error al crear bulto:', err);
      }
    });
  }

  asignarProductoABulto(): void {
    if (!this.bultoSeleccionadoId || !this.selectedItems) return;

    const productoId = this.selectedItems.id;
    const cantidadEnBultos = this.obtenerCantidadEnBultos(productoId);
    const cantidadPendiente = this.selectedItems.cantidad - cantidadEnBultos;

    if (this.cantidadAsignar > cantidadPendiente || this.cantidadAsignar <= 0) {
      alert('Cantidad inválida');
      return;
    }

    this.ordenSalidaService.agregarDetalleBulto(this.bultoSeleccionadoId, {
      ordenSalidaDetalleId: productoId,
      cantidad: this.cantidadAsignar
    }).subscribe({
      next: (detalle) => {
        const bulto = this.bultos.find(b => b.id === this.bultoSeleccionadoId);
        if (!bulto) return;

        if (!bulto.productos) bulto.productos = [];

        const existente = bulto.productos.find(p => p.productoId === productoId);
        if (existente) {
          existente.cantidadAsignada += this.cantidadAsignar;
        } else {
          bulto.productos.push({
            id: detalle.id, // 👈 guardar el ID de la BD
            productoId,
            productoNombre: this.selectedItems.producto,
            lote: this.selectedItems.Lote,
            cantidadAsignada: this.cantidadAsignar
          });
        }

        this.selectedItems = {} as any;
        this.cantidadAsignar = 0;
        this.bultos = [...this.bultos];

      this.ordenSalidaService.obtenerDetalleOrdenSalida(this.config.data?.ordenSalidaId).subscribe({
        next: data => {
          this.detalles = data;
        },
        error: err => {
          console.error('Error al cargar detalles:', err);
        }
      });



      },
      error: err => {
        console.error('Error al asignar detalle:', err);
      }
    });
  }

  obtenerCantidadEnBultos(productoId: number): number {
    return this.bultos
      .flatMap(b => b.productos || [])
      .filter(p => p.productoId === productoId)
      .reduce((sum, p) => sum + p.cantidadAsignada, 0);
  }

eliminarProductoDeBulto(bultoId: number, productoId: number): void {
  const bulto = this.bultos.find(b => b.id === bultoId);
  if (!bulto || !bulto.productos) return;

  const detalle = bulto.productos.find(p => p.productoId === productoId);

  if (!detalle?.id) {
    console.warn('No hay id del detalle en BD para eliminar');
    return;
  }

  this.ordenSalidaService.eliminarDetalleBulto(detalle.id).subscribe({
    next: () => {
      // Eliminar del array visual
      bulto.productos = bulto.productos.filter(p => p.productoId !== productoId);
      this.bultos = [...this.bultos];


   this.ordenSalidaService.obtenerDetalleOrdenSalida(this.config.data?.ordenSalidaId).subscribe({
        next: data => {
          this.detalles = data;
        },
        error: err => {
          console.error('Error al cargar detalles:', err);
        }
      });



    },
    error: err => {
      console.error('Error al eliminar detalle en backend', err);
    }
  });
}

  trackByBultoId(index: number, item: BultoSalida): number {
    return item.id!;
  }

  eliminarBulto(bultoId: number) {
  this.ordenSalidaService.eliminarBulto(bultoId).subscribe({
    next: () => {


      console.log('Bulto eliminado:', bultoId);
     
      
  
      this.cargarBultos();
      this.cd.detectChanges();

    },
    error: () => {
    //  this.messageService.add({ severity: 'error', summary: 'Error al eliminar' });
    }
  });
}

actualizarPeso(bultoId: number, peso: number) {
  this.ordenSalidaService.actualizarPesoBulto(bultoId, peso).subscribe({
    next: () => {
     // this.messageService.add({ severity: 'info', summary: 'Peso actualizado' });
    },
    error: () => {
      // this.messageService.add({ severity: 'error', summary: 'Error al actualizar peso' });
    }
  });
}


guardarPesosBultos(): void {
  for (const bulto of this.bultos) {
    if (bulto.id && bulto.peso != null) {
      this.ordenSalidaService.actualizarPesoBulto(bulto.id, bulto.peso).subscribe({
        next: () => {
          // Opcional: mostrar mensaje por cada bulto actualizado
          console.log(`Peso actualizado para bulto ID ${bulto.id}`);
        },
        error: (err) => {
          console.error(`Error al actualizar peso del bulto ID ${bulto.id}:`, err);
        }
      });
    }
  }
}



}
