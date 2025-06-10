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
import { ConfirmDialogModule } from 'primeng/confirmdialog';

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
        ConfirmDialogModule,
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
  selectedLPNs: any[] = [];
  almacenes: SelectItem[] = [];

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
      {header: 'PROPIETARIO', field: 'propiteario'  ,  width: '60px'  },
      {header: 'UBICACIÓN', field: 'nombreEstado'  ,  width: '60px'  },
      {header: 'LPN', field: 'numOrden'  ,  width: '70px' },
      {header: 'PRODUCTO', field: 'producto'  ,  width: '160px' },
      {header: 'QTY', field: 'untqty' , width: '40px'  },
     
    ];

    
    this.generalService.getAllAlmacenes().subscribe(resp => {
      this.almacenes = resp.map(element => ({
        value: element.id,
        label: element.descripcion
      }));
    });

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
  this.selectedLPNs = [];

    console.log(this.model, 'model');


     if (!this.model.AlmacenId) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Campo requerido',
      detail: 'Debe seleccionar un almacén.'
    });
    return;
  }

   const clienteId = this.model.PropietarioId || ''; // <- valor por defecto si no se selecciona
  const productoId = this.model.ProductoId || '';
  const lpn = this.model.lpn || '';
  const ubicacion = this.model.ubicacion || '';
  const almacenId = this.model.AlmacenId;

  this.seleccion = [];

  this.inventarioService.getAllInventarioReubicacionAgrupado(
    clienteId,
    productoId,
    lpn,
    ubicacion,
    almacenId
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

  cambiarMasivo() {

  const ids = this.selectedLPNs.map(x => x.id.toString()); // ✅ forzar string


  this.ref = this.dialogService.open(VerubicacionComponent, {
    header: 'Actualizar ubicación',
    width: '780px',
    height: '500px',
    data: { ids } // << enviar arreglo de LPNs
  });

this.ref.onClose.subscribe((result) => {
    if (result === true) {

       this.buscar(); // recargar la lista después de la reubicación
      this.messageService.add({
        severity: 'success',
        summary: 'Reubicación completada',
        detail: 'Los pallets fueron reubicados correctamente.'
      });
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'No se realizó ninguna reubicación.'
      });
    }
  });





}


}
