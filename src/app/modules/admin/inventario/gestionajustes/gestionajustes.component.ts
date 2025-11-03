import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button'; 
import { DropdownModule } from 'primeng/dropdown';
import { DialogService } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';

import { InventarioGeneral } from '../../_models/inventariogeneral';
import { ProductoService } from '../../_services/producto.service';
import { InventarioService } from '../../_services/inventario.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { InputTextModule } from 'primeng/inputtext';
import { GeneralService } from '../../_services/general.service';
import { ClienteService } from '../../_services/cliente.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Ubicacion } from '../inventario.type';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-gestionajustes',
  standalone: true,
  imports: [
    MatIcon,
    TableModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    DropdownModule,
    ToastModule,
    InputTextModule,
    ConfirmDialogModule
  ],
  providers: [
    DialogService,
    ConfirmationService, 
    MessageService
  ],
  templateUrl: './gestionajustes.component.html',
  styleUrl: './gestionajustes.component.scss'
})
export class GestionajustesComponent implements OnInit{

  clientes: SelectItem[] = [];
  productos: SelectItem[] = [];
  estadoInventario: SelectItem[] = [];
  areas: SelectItem[] = [];
  ubicaciones: Ubicacion[];
  seleccion: InventarioGeneral[] = [];
  listData: InventarioGeneral[];
  cols: any[];
  model: any  = {};
  public loading = false;
  jwtHelper = new JwtHelperService();
  decodedToken: any = {};

  constructor(
      public dialogService: DialogService,
      private router: Router,
      private productoService: ProductoService,
      private inventarioService: InventarioService,
      private generalService: GeneralService,
      private clienteService: ClienteService,
      private propietarioService: PropietarioService,
      private confirmationService: ConfirmationService,
      public messageService: MessageService,
    ) { }

  ngOnInit() : void{

    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);

    this.cols =
    [
       {header: 'ACCIONES', field: 'estado' , width: '60px'  },
      {header: 'ID', field: 'id'  ,  width: '60px'  },
      {header: 'FECHA Y HORA', field: 'nombreEstado'  ,  width: '60px'  },
      {header: 'LODNUM', field: 'producto'  ,  width: '90px' },
      {header: 'PRODUCTO', field: 'producto'  ,  width: '160px' },
      {header: 'OBSERVACION', field: 'numOrden'  ,  width: '70px' },
      {header: 'MOTIVO', field: 'numOrden'  ,  width: '70px' },


        {header: 'F. EXPIRE OLD', field: 'fechaExpireOld'  ,  width: '70px' },
        {header: 'F. EXPIRE', field: 'fechaExpire'  ,  width: '70px' },

        {header: 'F. MANUFACTURA OLD', field: 'fechaExpireOld'  ,  width: '70px' },
        {header: 'F. MANUFACTURA', field: 'fechaExpire'  ,  width: '70px' },

        {header: 'LOTE OLD', field: 'lotNumOld'  ,  width: '70px' },
        {header: 'LOTE', field: 'LotNum'  ,  width: '70px' },




      {header: 'QTY', field: 'untqty' , width: '40px'  },
      {header: 'QTY OLD', field: 'untqty' , width: '40px'  },
      {header: 'SOLICITADO POR', field: 'estado' , width: '60px'  },
      {header: 'EJECUTADO', field: 'estado' , width: '60px'  },
      {header: 'APROBADO POR', field: 'estado' , width: '60px'  },
     
    ];

    this.generalService.getAreas().subscribe(resp =>{
      resp.forEach(element => {
        this.areas.push({
          value: element.id ,
          label: element.nombre
        });
      });
    });

    this.generalService.getAll(3).subscribe(resp =>{
      resp.forEach(element => {
        this.estadoInventario.push({
          value: element.id ,
          label: element.nombreEstado
        });
      });
    });

    this.propietarioService.getAllPropietarios().subscribe(resp => {
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
    this.inventarioService.getAllInventarioAjuste(this.model.PropietarioId
      , this.model.ProductoId
      , this.model.lpn
    ).subscribe(list => {
      this.listData = list;
    });

  }

 aprobar(id: number) {

   const ajuste = this.listData.find(x => x.id === id);

   
  this.model.idajuste = id;
  this.model.idusuarioajuste = this.decodedToken.nameid;



   this.model.observacion = ajuste.observacion; // <- Aquí obtienes la observación

  this.confirmationService.confirm({
    acceptLabel: 'Aceptar',
    rejectLabel: 'Cancelar',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',
    message: '¿Está seguro que desea aprobar el inventario?',
    header: 'Confirmar Aprobación',
    icon: 'pi pi-exclamation-triangle',

    accept: () => {
      console.log('Stock:', this.model);

      // Decide qué método llamar según la observación
      const esCambioLoteYFechas = this.model.observacion?.trim().toLowerCase() === 'cambio lote y fechas';
      const llamada = esCambioLoteYFechas
        ? this.inventarioService.actualizarFechaLote(this.model)
        : this.inventarioService.actualizar_stock(this.model);

      llamada.subscribe({
        next: (resp) => {
          if (resp === false) {
            this.messageService.add({
              severity: 'error',
              summary: 'No se actualizó',
              detail: 'No se pudo ejecutar el cambio. Verifique que tenga stock disponible o los datos sean correctos.'
            });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Inventario aprobado',
              detail: 'Se ha aprobado el Inventario correctamente.'
            });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Ocurrió un error',
            detail: 'No se pudo completar la operación.'
          });
        }
      });
    },

    reject: () => {
      // Cancelado por el usuario
    }
  });
}

  rechazar(id: number) {
  const ajuste = this.listData.find(x => x.id === id);
  if (!ajuste) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No se encontró el ajuste con ese ID.'
    });
    return;
  }

  this.model.idajuste = id;
  this.model.idusuarioajuste = this.decodedToken.nameid;
  this.model.observacion = ajuste.observacion;
  this.model.rechazar = true;

  this.confirmationService.confirm({
    header: 'Confirmar Rechazo',
    message: '¿Está seguro que desea rechazar el ajuste del inventario?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Aceptar',
    rejectLabel: 'Cancelar',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',

    accept: () => {
      const esCambioLoteYFechas = this.model.observacion?.trim().toLowerCase() === 'cambio lote y fechas';
      const llamada = esCambioLoteYFechas
        ? this.inventarioService.actualizarFechaLote(this.model)
        : this.inventarioService.actualizar_stock(this.model);

      llamada.subscribe({
        next: (resp) => {
          if (resp === false) {
            this.messageService.add({
              severity: 'error',
              summary: 'No se actualizó',
              detail: 'No se pudo ejecutar el rechazo. Verifique los datos.'
            });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Inventario rechazado',
              detail: 'El ajuste fue rechazado correctamente.'
            });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ocurrió un error al intentar rechazar el ajuste.'
          });
        }
      });
    }
  });
}


}
