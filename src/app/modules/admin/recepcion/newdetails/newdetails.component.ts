import { Component, inject, OnInit } from '@angular/core';
import { RecepcionService } from '../recepcion.service';
import { ProductoService } from '../../_services/producto.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrdenReciboDetalleForRegisterDto } from '../recepcion.types';


@Component({
  selector: 'app-newdetails',
  templateUrl: './newdetails.component.html',
  styleUrls: ['./newdetails.component.css'],
    standalone: true,
    imports: [
        AutoCompleteModule
        ,CommonModule
        ,FormsModule
        ,TagModule
        ,TableModule
        ,ButtonModule
        ,CardModule
        , InputTextModule

    ],
      providers: [
          DialogService ,
          MessageService ,
          ConfirmationService

        ]
})
export class NewdetailsComponent implements OnInit {
    productoSeleccionado: any;
    productosFiltrados: any[] = [];
    idOrdenRecepcion!: string;
    idPropietario?: number;
    orden : any;
    model: any = {};

    private config = inject(DynamicDialogConfig);
    private ref = inject(DynamicDialogRef);

    constructor(private productoService: ProductoService,
        private ordenreciboService: RecepcionService,
        private messageService: MessageService,
    ) {}
    ngOnInit(): void {

        this.idOrdenRecepcion = this.config.data?.idOrdenRecepcion;


        this.ordenreciboService.obtenerOrden(this.idOrdenRecepcion).subscribe(resp => {
            console.log('detalles', resp);



            this.orden = resp;


            console.log('idPropietario', resp.propietarioID);

            this.idPropietario   =  resp.propietarioID;
            //console.log(this.listData);
          });

          console.log('idOrdenRecepcion', this.idOrdenRecepcion);


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

      // opcional
      cerrar() { this.ref.close(); }


      agregarItem(): void {
        if (this.orden?.nombreEstado !== 'Planificado') {
          this.messageService.add({ severity: 'warn', summary: 'No permitido', detail: 'La orden no está en estado Planificado.' });
          return;
        }

        if (!this.model.productoSeleccionado || !this.model.cantidad || this.model.cantidad <= 0) {
          this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione producto y cantidad válida.' });
          return;
        }

        const dto: OrdenReciboDetalleForRegisterDto = {
          ordenReciboId: this.idOrdenRecepcion,
          productoId: this.model.productoSeleccionado.id,     // viene de tu autocomplete
          lote: this.model.lote || null,
          huellaId: null,                                      // si aplica
          estadoID: 0,                                         // pon el que corresponda
          cantidad: this.model.cantidad,
          referencia: null
        };

        this.ordenreciboService.registrarDetalle(dto).subscribe({
          next: (detalleInsertado) => {
            // Opcional: mapear para que encaje con columnas de tu p-table
            const linea = (this.orden.detalles?.length || 0) + 1;
            this.orden.detalles = [
              ...this.orden.detalles,
              {
                ...detalleInsertado,
                linea,                                   // si el backend ya devuelve Linea, puedes usar detalleInsertado.linea
                codigo: this.model.productoSeleccionado.codigo,
                producto: this.model.productoSeleccionado.descripcionLarga
              }
            ];

            // limpiar formulario
            this.model.productoSeleccionado = null;
            this.model.cantidad = null;
            this.model.lote = null;

            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Ítem agregado.' });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo agregar el ítem.' });
          }
        });
      }

      eliminarFila(row: any) {
        this.orden.detalles = this.orden.detalles.filter((d: any) => d !== row);
      }

}
