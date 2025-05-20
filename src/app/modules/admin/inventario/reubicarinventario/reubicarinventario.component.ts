import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button'; 
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { InventarioGeneral } from '../../_models/inventariogeneral';
import { ClienteService } from '../../_services/cliente.service';

import { GeneralService } from '../../_services/general.service';
import { VerubicacionComponent } from './verubicacion/verubicacion.component';
import { ProductoService } from '../../_services/producto.service';
import { InventarioService } from '../../_services/inventario.service';

@Component({
  selector: 'app-reubicarinventario',
  standalone: true,
  imports: [
    MatIcon,
        TableModule,
        FormsModule,
        CommonModule,
        ButtonModule,
        DropdownModule,
        InputTextModule,
        ToastModule,
  ],
  providers: [
      ConfirmationService, 
      MessageService,
      DialogService
    ],
  templateUrl: './reubicarinventario.component.html',
  styleUrl: './reubicarinventario.component.scss'
})
export class ReubicarinventarioComponent implements OnInit{

  clientes: SelectItem[] = [];
  productos: SelectItem[] = [];
  estadoInventario: SelectItem[] = [];
  listData: InventarioGeneral[];
  areas: SelectItem[] = [];
  cols: any[];
  model: any = {};
  seleccion: InventarioGeneral[] = [];
  ref: DynamicDialogRef | undefined;
  public loading = false;

  constructor(
    private clienteService: ClienteService,
    private inventarioService: InventarioService,
    private productoService: ProductoService,
    private generalService: GeneralService,
    private dialogService: DialogService,
    private messageService: MessageService,
  ) { }

  ngOnInit() : void{

    this.cols =
    [
      {header: 'ACCIONES', field: 'numOrden' , width: '40px' },
      {header: 'UBICACIÓN', field: 'nombreEstado'  ,  width: '60px'  },
      {header: 'LPN', field: 'numOrden'  ,  width: '70px' },
      {header: 'PRODUCTO', field: 'producto'  ,  width: '160px' },
      {header: 'QTY', field: 'untqty' , width: '40px'  },
      {header: 'ESTADO', field: 'estado' , width: '60px'  },
    ];

    this.generalService.getAreas().subscribe(resp =>
    {
      resp.forEach(element => {
        this.areas.push({
          value: element.id ,
          label: element.nombre
        });
      });
    });

    this.generalService.getAll(3).subscribe(resp =>
    {
      resp.forEach(element => {
        this.estadoInventario.push({
          value: element.id ,
          label: element.nombreEstado
        });
      });
    });

    this.clienteService.getAllPropietarios('').subscribe(resp => {
        resp.forEach(element => {
          this.clientes.push({ label: element.razonSocial.toUpperCase() , value: element.id });
      });
    });

  }

  CambioCliente(id) {
    this.productoService.getAllProductos('', id.value).subscribe(resp => {
      this.productos = resp.map(element => ({
        label: element.descripcionLarga,
        value: element.id
      }));
    });
  }

  buscar(){




    if(this.model.PropietarioId === undefined) {
      return;
    }

    this.seleccion = [];
    this.inventarioService.getAllInventarioReubicacion(this.model.PropietarioId
      , this.model.ProductoId
      , this.model.lpn
      , this.model.ubicacion
      ).subscribe(list => {
        this.listData = list;
      });
  }

  ver(id){

    this.ref = this.dialogService.open(VerubicacionComponent, {
          header: 'Actualizar ubicación',
          width: '780px',
          height: '500px',
          data: {id:  id}
        });
      
  }

}
