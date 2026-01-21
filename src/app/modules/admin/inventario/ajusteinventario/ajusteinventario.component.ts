import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button'; 
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MenuItem, MessageService, SelectItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { InventarioGeneral } from '../../_models/inventariogeneral';
import { GeneralService } from '../../_services/general.service';
import { ClienteService } from '../../_services/cliente.service';
import { ProductoService } from '../../_services/producto.service';
import { InventarioService } from '../../_services/inventario.service';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { EditinventarioComponent } from './editinventario/editinventario.component';
import { AjustestockComponent } from './ajustestock/ajustestock.component';
import { SplitButtonModule } from 'primeng/splitbutton';
import { GetionmermaComponent } from './getionmerma/getionmerma.component';
import { ExtraerpalletComponent } from './extraerpallet/extraerpallet.component';
import { ModificarinventariomasivoComponent } from './modificarinventariomasivo/modificarinventariomasivo.component';
import { Ubicacion } from '../inventario.type';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-ajusteinventario',
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
    SplitButtonModule
  ],
  providers: [
    ConfirmationService, 
    MessageService,
    DialogService
  ],
  templateUrl: './ajusteinventario.component.html',
  styleUrl: './ajusteinventario.component.scss'
})
export class AjusteinventarioComponent implements OnInit{

  clientes: SelectItem[] = [];
  productos: SelectItem[] = [];
  estadoInventario: SelectItem[] = [];
  areas: SelectItem[] = [];
  ubicaciones: Ubicacion[] = [];
  listData: InventarioGeneral[] = [];
  cols: any[];
  seleccion: InventarioGeneral[] = [];
  model: any = {};
  public loading = false;
  ref: DynamicDialogRef | undefined;
  items: MenuItem[];

  intervalo: SelectItem[] = [
    {value: 0, label: 'Desde Siempre'},
    {value: 1, label: 'Hoy'},
    {value: 3, label: 'Hace tres días'},
    {value: 7, label: 'Hace una semana'},
    {value: 31, label: 'Hace un mes'},
  ];

  constructor(
        private generalService: GeneralService,
        private clienteService: ClienteService,
        
        private propietarioService: PropietarioService,
        private confirmationService: ConfirmationService,
        public messageService: MessageService,
        private productoService: ProductoService,
        private inventarioService: InventarioService,
        public dialogService: DialogService,
      ) { }

  ngOnInit() : void{

    this.items = [
      {
          label: 'Gestión de estados',
          command: () => {
              this.merma();
          }
      },
      {
        label: 'Extraer',
        command: () => {
            this.extraer();
        }
    }
    ]

    this.cols =
    [
   
      {header: 'ACCIONES', field: 'numOrden' , width: '60px' },
      {header: 'ID', field: 'id'  ,  width: '60px'  },
      {header: 'UBICACIÓN', field: 'nombreEstado'  ,  width: '60px'  },
      {header: 'LPN', field: 'numOrden'  ,  width: '70px' },
      {header: 'PRODUCTO', field: 'producto'  ,  width: '140px' },
      {header: 'LOTE', field: 'lotnum' , width: '60px'  },
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

    this.propietarioService.getAllPropietarios().subscribe(resp => {
      console.log(resp);
      resp.forEach(element => {
        this.clientes.push({ label: element.razonSocial.toUpperCase() , value: element.id });
      });
    });

  }

  merma(){

    this.model.ids  = "";

    this.seleccion.forEach(item => {
      this.model.ids = this.model.ids +  ',' + item.id ;
    });

    if(this.model.ids == ''){
    //warning('Debe seleccionar uno o mas elementos');
    return;
    }

    this.ref = this.dialogService.open(GetionmermaComponent, {
          header: 'Modificar Estado',
          width: '980px',
          height: '410px',
          data: {codigo:  this.model.ids}
    });
     
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscar(); 
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Estados de merma guardado', 
          detail: 'Se han actualizado los estados de manera correcta.' 
        }); 
      }
    }); 
  }

  extraer(){

    this.model.ids  = "";

    this.seleccion.forEach(item => {
      this.model.ids =  item.id ;
    });

    if(this.seleccion.length === 0) {
      //warning('Para esta opción seleccione un elemento.');
      return;
    }

    if(this.seleccion.length > 1) {
      //warning('Para esta opción seleccione solo un elemento.');
      return;
    }

    if(this.seleccion[0].area === 'PUERTAS'){
      //warning('No puede extraer una paleta que no este almacenada');
      return;
    }

    this.ref = this.dialogService.open(ExtraerpalletComponent, {
      header: 'Extraer Inventario',
      width: '600px',
      height: '380px',
      data: {codigo:  this.model.ids}
    });
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscar(); 
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Estados de merma guardado', 
          detail: 'Se han actualizado los estados de manera correcta.' 
        }); 
      }
    }); 
  }

  actualizar_masivo(){

    this.model.ids  = "";
    this.seleccion.forEach(item => {
      this.model.ids = this.model.ids +  ',' + item.id ;
    });

    if(this.model.ids == ''){
      this.messageService.add({ 
        severity: 'danger', 
        summary: 'Error', 
        detail: 'Debe seleccionar uno o mas elementos.' 
      });
      return;
    }

    const selectedCount = this.seleccion.length;
    const lpns = Array.from(
      new Set(this.seleccion.map((x) => x?.lodNum).filter((x): x is string => !!x))
    );
    const lpnResumen =
      lpns.length === 0 ? '-' : lpns.length === 1 ? lpns[0] : `${lpns[0]} (+${lpns.length - 1} más)`;

    this.ref = this.dialogService.open(ModificarinventariomasivoComponent, {
      header: 'Modificar Inventario',
      width: '620px',
      height: '420px',
      data: {
        codigo: this.model.ids,
        lpnResumen,
        selectedCount,
      }
    });
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscar(); 
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Inventario guardado', 
          detail: 'Se han actualizado los datos inventario de manera correcta.' 
        }); 
      }
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
    this.loading = true;
    if(this.model.PropietarioId === undefined) {
      this.loading = false;
      return;
    }

    this.seleccion = [];
    this.inventarioService.getAllInventarioReubicacion(this.model.PropietarioId
      , this.model.ProductoId
      , this.model.lpn
      , null
      ).subscribe(list => {
        this.loading = false;
        this.listData = list;
      });
  }

  edit(id: number){
    this.ref = this.dialogService.open(EditinventarioComponent, {
      header: 'Modificar Inventario ABC',
      width: '550px',
      height: '420px',
      data: {id:  id}
    });
      
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscar(); 
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Inventario guardado', 
          detail: 'Se ha guardado el inventario.' 
        }); 
      }
    }); 
  }

  editstock(id: number){
    this.ref = this.dialogService.open(AjustestockComponent, {
      header: 'Solicitud de modificación de Stock',
      width: '580px',
      height: '500px',
      data: {id:  id}
    });
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscar(); 
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Ajuste de stock guardada', 
          detail: 'Se ha ajustado el stock.' 
        }); 
      }
    }); 
  }

}
