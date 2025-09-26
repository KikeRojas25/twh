import { Component, OnInit } from '@angular/core'; 
import { MatIcon } from '@angular/material/icon';
import { TableModule } from 'primeng/table';
import { ClienteService } from '../../../_services/cliente.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button'; 
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { SelectItem } from 'primeng/api';
import { ProductoService } from '../../../_services/producto.service';
import { Producto } from '../../../_models/producto';
import { NeweditComponent } from '../newedit/newedit.component';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';


@Component({
  selector: 'app-listadoproducto',
  standalone: true,
  imports: [
    MatIcon,
    TableModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    DropdownModule,
    ToastModule
  ],
  providers: [
    DialogService,MessageService ,
  ],
  templateUrl: './listadoproducto.component.html',
  styleUrl: './listadoproducto.component.scss'
})
export class ListadoproductoComponent implements OnInit{

  clientes: SelectItem[] = [];
  productos: Producto[];
  model: any  = {};
  cols: any[];
  public loading = false;
  ref: DynamicDialogRef | undefined;

  constructor(
    public dialogService: DialogService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
     private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit() : void{

    this.cargarPropietarios();

    this.cols = [
  {header: 'ACCIONES', field: 'numOrden' , width: '40px' },
  {header: 'FAMILIA', field: 'familia' , width: '80px'  },
  {header: 'CODIGO', field: 'codigo' , width: '80px'  },
  {header: 'DESCRIPCION', field: 'descripcionLarga' , width: '160px'  },
  {header: 'CANAL', field: 'canal', width: '80px'},
  {header: 'VOLUMEN', field: 'volumen', width: '80px'},
  {header: 'ANCHO', field: 'ancho', width: '80px'},
  {header: 'ALTO', field: 'alto', width: '80px'},
  {header: 'LARGO', field: 'largo', width: '80px'},
  {header: 'SOBREDIMENSIONADO', field: 'sobredimensionado', width: '100px'}
];
  }

  cargarPropietarios(){
    this.clienteService.getAllPropietarios('').subscribe(resp => {
      resp.forEach(x => {
        this.clientes.push({ label: x.razonSocial.toUpperCase() , value: x.id.toString() });
      });
  
      if (localStorage.getItem('searchPro1') !== undefined){
            this.model.PropietarioId = localStorage.getItem('searchPro1');
      } else {
            this.model.PropietarioId = 1;
            console.log('entre');
      }
    });
  }

  buscar() {
    window.localStorage.setItem(
      'searchPro1',
      this.model.PropietarioId
   );

    this.loading = true;

    this.model.criterio = '';
    this.model.clienteId = this.model.PropietarioId;

    this.productoService.getAllProductos(this.model.criterio, this.model.clienteId).subscribe(list => {
      this.productos = list ;

console.log(list);

      this.loading = false;
    });
  }

  nuevoProducto(){
      this.ref = this.dialogService.open(NeweditComponent, {
        header: 'Datos de Producto',
        width: '750px',
        height: '780px',
        data: {}
      });
        
this.ref.onClose.subscribe((resultado) => {
  if (resultado && resultado !== 'error') {
    this.buscar();
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: resultado   // ✅ aquí llega el texto desde el hijo
    });
  } else if (resultado === 'error') {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Ocurrió un problema al guardar el producto.'
    });
  }
})};

  
  editarProducto(id : number){
    this.ref = this.dialogService.open(NeweditComponent, {
      header: 'Datos de Producto',
      width: '750px',
      height: '780px',
      data: {productoId: id}
    });
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscar(); 
      }
    });
  }

  verHuellas(id) {
    this.router.navigate(['mantenimiento/verproducto', id]);
  }
  filtroGeneral: string = '';

filtrarTabla(dt: any) {
  dt.filterGlobal(this.filtroGeneral, 'contains');
}

limpiarFiltro(dt: any) {
  this.filtroGeneral = '';
  dt.clear();
  this.buscar(); // recarga todos los productos
}


}
