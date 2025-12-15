import { Component, OnInit, ViewChild, ViewEncapsulation, Inject } from '@angular/core';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';


import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';


import { ConfirmationService, MenuItem, MessageService       } from 'primeng/api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DragDropModule } from 'primeng/dragdrop';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { SidebarModule } from 'primeng/sidebar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { InventarioGeneral } from '../../_models/inventariogeneral';
import { InventarioService } from '../../_services/inventario.service';
import { Ubicacion } from '../../planning/planning.types';
import { OrdenRecibo } from '../../recepcion/recepcion.types';
import { AlmacenService } from '../../_services/almacen.service';
import { RecepcionService } from '../../recepcion/recepcion.service';










@Component({
  selector: 'app-almacenamiento',
  templateUrl: './almacenamiento.component.html',
  styleUrls: ['./almacenamiento.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ButtonModule, TableModule,
    DropdownModule, CalendarModule,
    InputNumberModule, InputTextModule, ToastModule, ConfirmDialogModule, TooltipModule, InputSwitchModule, 
    ToolbarModule, SidebarModule, DragDropModule, ConfirmDialogModule, MatIcon],
  encapsulation: ViewEncapsulation.None,
  providers: [ConfirmationService, MessageService]  
})
export class AlmacenamientoComponent implements OnInit {
  loading = false;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  displayedColumns: string[] = [ 'lodNum', 'descripcionLarga', 'untQty' , 'ubicacion', 'proximaubicacion'];
  listData: MatTableDataSource<InventarioGeneral>;
  inventarios: InventarioGeneral[] = [];
  EquipoTransporteId: any;
  model: any = {} ;
  id: any;
  closeResult: string;

  visibleSidebar4 = false;
  activeIndex = 2;
  pasos: MenuItem[];
  orden: OrdenRecibo;
  visible: boolean = true;


  
  listUbicaciones: MatTableDataSource<Ubicacion>;
  ubicaciones: Ubicacion[];



  constructor(private inventarioServicio: InventarioService
    ,         private activatedRoute: ActivatedRoute
    ,         private almacenService: AlmacenService
    ,         private ordenServicio: RecepcionService
    ,         private router: Router
    ,         private messageService: MessageService
    ,         private confirmationService: ConfirmationService
    ) { }

  ngOnInit() {
    this.id  = this.activatedRoute.snapshot.params.uid;
    this.EquipoTransporteId  = this.activatedRoute.snapshot.params.uid2;
    this.ordenServicio.obtenerOrden(this.id).subscribe(resp => {
      this.orden = resp;
    });

    this.inventarioServicio.GetAllInventarioByOrdenReciboId(this.id).subscribe(resp => {
       this.inventarios = resp;
       console.log('inventarios:', this.inventarios);
       this.model = resp;



     }, error => {
       console.error('Error al cargar inventarios:', error);
     }, () => {

     });
  }

 Confirmar(id) {
      this.loading = true;
      this.inventarioServicio.almacenamiento(id).subscribe(resp => {

        this.loading = false;



      }, error => {
         //error(error);
      }, () => {
      
    });
}


  regresar(){

    this.router.navigate(['/recibo/listaordenrecibida',  this.activatedRoute.snapshot.params.uid2 ]);
  }
  masivo() {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea realizar el ingreso masivo?',
      header: 'Confirmar acción',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, continuar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.ejecutarMasivo();
      },
      reject: () => {
        // Usuario canceló, no hacer nada
      }
    });
  }

  ejecutarMasivo() {
    this.loading = true;
    this.inventarioServicio.almacenamientoMasivo(this.id).subscribe(resp => {
      
      
      this.loading = false;
      this.visible = false;


      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Ingreso masivo realizado correctamente'
      });
    }, error => {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al realizar el ingreso masivo'
      });
    }, () => {
      this.router.navigate(['/recibo/listaordenrecibo']);
    });
  }
}
