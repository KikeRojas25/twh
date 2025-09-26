import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button'; 
import { HuellaDetalle } from 'app/modules/admin/_models/huella';
import { ProductoService } from '../../../_services/producto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { NewhuelladetalleComponent } from '../newhuelladetalle/newhuelladetalle.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-huelladetalle',
  standalone: true,
  imports: [
    MatIcon,
        TableModule,
        CommonModule,
        ButtonModule,
        ConfirmDialogModule,
        ToastModule
  ],
  providers: [
    DialogService,
    ConfirmationService,
    MessageService
  ],
  templateUrl: './huelladetalle.component.html',
  styleUrl: './huelladetalle.component.scss'
})
export class HuelladetalleComponent implements OnInit{

  huellas: HuellaDetalle[];
  model: any  = {};
  cols: any[];
  public loading = false;
  id: any;
  productoId: any;
  uid: any;
  ref: DynamicDialogRef | undefined;

  constructor(
    private productoService: ProductoService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService,
    public messageService: MessageService,
  ) { }

  ngOnInit(){
    this.cols =
    [
      {header: 'ACCIONES', field: 'numOrden' , width: '40px' },
      {header: 'UNIDAD DE MEDIDA', field: 'unidadMedida' , width: '80px'  },
      {header: 'ALTURA', field: 'height' , width: '80px'  },
      {header: 'LARGO', field: 'length' , width: '160px'  },
      {header: 'ANCHO', field: 'width' , width: '50px'  },
      {header: 'PESO BRUTO', field: 'grswgt' , width: '50px'  },
      {header: 'PESO NETO', field: 'netwgt' , width: '50px'  },
      {header: 'CANTIDAD', field: 'untQty' , width: '50px'  },  
    ];

    this.id  = this.activatedRoute.snapshot.params["id"];
    this.uid  = this.activatedRoute.snapshot.params["uid"];
    this.loading = true;
    this.productoService.getHuellasDetalle(this.id).subscribe(list => {
      console.log(list);
      this.huellas = list ;
      this.loading = false;
    });

  }

  regresar(){
    this.router.navigate(['mantenimiento/verproducto', this.uid]);
  }

  nuevoOrden(){
    this.ref = this.dialogService.open(NewhuelladetalleComponent, {
      header: 'Datos de Detalle de Huella',
      width: '750px',
      height: '670px',
      data: {id: this.id}
    });
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Detalle de Huella guardada', 
          detail: 'Se ha guardado el Detalle de Huella.' 
        });
        // this.loading = true;
        this.productoService.getHuellasDetalle(this.id).subscribe(list => {
          console.log(list);
          this.huellas = list ;
          this.loading = false;
        }); 
      }
    });
  }

  delete(id:number){

    this.confirmationService.confirm({
      acceptLabel: 'Eliminar',                   // Texto del botón "Aceptar"
      rejectLabel: 'Cancelar',                  // Texto del botón "Rechazar"
      acceptIcon: 'pi pi-check',                // Icono del botón "Aceptar"
      rejectIcon: 'pi pi-times',                // Icono del botón "Rechazar"
      message: '¿Está seguro que desea eliminar el Detalle de Huella?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.productoService.deleteHuellaDetalle(id).subscribe(x=> {
          this.productoService.getHuellasDetalle(this.id).subscribe(resp => {
                this.huellas = resp ;
                this.loading = false;
          });
          }, error => {
              this.messageService.add({ 
                severity: 'error', 
                summary: 'Ocurrió un error', 
                detail: 'Ocurrió un error.' 
              });   
            }, () => {
              this.messageService.add({ 
                severity: 'success', 
                summary: 'Detalle de Huella eliminada', 
                detail: 'Se ha eliminado el Detalle de Huella.' 
              });
        });
      } ,
      reject: () => {
      }
    });
  }
}
