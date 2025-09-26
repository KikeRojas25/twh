import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { DespachosService } from '../despachos.service';
import { ClienteService } from '../../_services/cliente.service';
import { Router } from '@angular/router';
import { carga } from '../despachos.types';
import { AsignarPlacaComponent } from './asignar-placa/asignar-placa.component';
import { ModalUpdateGuiaComponent } from './modal-update-guia/modal-update-guia.component';
import { GenerarbultosComponent } from './generarbultos/generarbultos.component';

@Component({
  selector: 'app-despachocarga',
  templateUrl: './despachocarga.component.html',
  styleUrls: ['./despachocarga.component.css'],
  standalone: true,
imports: [MatIcon, 
    InputTextModule, 
    DropdownModule,
    FormsModule,
    ButtonModule,
    TableModule,
    CommonModule,
    DialogModule   ,
    TimelineModule ,
    CardModule ,
    DynamicDialogModule ,
    ToastModule,
    CalendarModule,
    ConfirmDialogModule,
    SplitButtonModule,
    ],
    providers: [
      DialogService,
      MessageService,
      ConfirmationService
    ]
})
export class DespachocargaComponent implements OnInit {

  public loading = false;
  lines: carga[] = [];

  ordenesaux: carga[] = [];
  model: any  = {};

  selectedRow: carga[] = [];
  clientes: SelectItem[] = [];
  ref: DynamicDialogRef | undefined;
  EstadoId: number;

  pendientes: any[] = [];
  bultosCompletos: boolean = false;


  cols: any[];

  constructor(private despachoService: DespachosService,
              private clienteService: ClienteService,
              public dialog: DialogService,
              public dialogService: DialogService,
              private messageService: MessageService,
              private confirmationService: ConfirmationService,
              private router: Router) { }

  ngOnInit() {

    this.selectedRow = [];
    this.cols =
    [
        // {header: 'ACC', field: 'workNum'  ,  width: '30px' },
        {header: 'N° Trabajo', field: 'workNum'  ,  width: '40px' },
        {header: 'Propietario', field: 'propietario'  , width: 'auto'   },
        {header: ' Placa', field: 'placa'  , width: 'auto'  },
        {header: 'Equipo Transporte', field: 'equipoTransporte'  , width: 'auto'  },
        {header: 'Fecha', field: 'equipoTransporte'  , width: 'auto'  },
        {header: 'Estado', field: 'estado', width: 'auto'    },

    ];


    this.clienteService.getAllPropietarios('').subscribe(resp => {
      this.clientes.push({ value: 0 , label: 'Todos los propietarios'});
      resp.forEach(element => {
        this.clientes.push({ value: element.id , label: element.razonSocial});
      });

      this.model.EstadoId = 25;
      this.model.PropietarioId = 0;
      this.despachoService.getAllCargas_pendientes(this.model).subscribe(list => {

        this.lines = list;
        });
    });
  }


  checkSelects() {
    return  this.selectedRow.length > 0 ?  false : true;
  }

  asignar() {

    if (this.selectedRow.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Seleccione al menos una carga'
      });
      return;
    }

    let ids = '';
    this.selectedRow.forEach(el => {
          ids = ids + ',' + el.id;
    });
    this.model.ids = ids.substring(1, ids.length + 1);

 

  
 
    
        this.ref = this.dialogService.open(AsignarPlacaComponent, {
                header: `Asignar Placas`,
                width: '70%',
                data: {
                  id: this.model.ids ,
                },
              });
      
              this.ref.onClose.subscribe((selectedDriver) => {
    
    
            if (selectedDriver) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Éxito',
                  detail: 'Programación guardada correctamente'
                });
        
        
        
                
      
                
                 }
              });
     
      
    

 }
 ver (id) {
  let url = 'http://104.36.166.65/reptwh/RepRotuloDAP2.aspx?idorden=' + String(id) ;
  window.open(url);
}

editarGuiaMasiva(){

  console.log('editarGuiaMasiva');

  let ids = '';
  this.selectedRow.forEach(el => {
        ids = ids + ',' + el.id;

    });
  this.model.ids = ids.substring(1, ids.length + 1);


  const dialogRef = this.dialog.open(ModalUpdateGuiaComponent, {
    header: 'Editar Guía de remisión salida masiva',
    width: '700px',
    height: '350px',
    modal: true,
    contentStyle: {"max-height": "1000px", "overflow": "auto"},
    data: {codigo:   this.model.ids, descripcion: ''}
  });
  dialogRef.onClose.subscribe(result => {
      this.buscar();
  });


}



generarBulto(){

  console.log('editarGuiaMasiva');

  let ids = '';
  this.selectedRow.forEach(el => {
        ids = ids + ',' + el.id;

    });
  this.model.ids = ids.substring(1, ids.length + 1);


  const dialogRef = this.dialog.open(ModalUpdateGuiaComponent, {
    header: 'Editar Guía de remisión salida masiva',
    width: '700px',
    height: '450px',
    modal: true,
    contentStyle: {"max-height": "1000px", "overflow": "auto"},
    data: {codigo:   this.model.ids, descripcion: ''}
  });
  dialogRef.onClose.subscribe(result => {
      this.buscar();
  });


}



 darsalida() {

    this.confirmationService.confirm({
      acceptLabel: 'Guardar',                   // Texto del botón "Aceptar"
      rejectLabel: 'Cancelar',                  // Texto del botón "Rechazar"
      acceptIcon: 'pi pi-check',                // Icono del botón "Aceptar"
      rejectIcon: 'pi pi-times',                // Icono del botón "Rechazar"
      message: '¿Está seguro que desea dar salida de este vehículo?',
      header: 'Confirmar Salida',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
  



        let ids = '';
        this.selectedRow.forEach(el => {
              ids = ids + ',' + el.id;

          });
        this.model.ids = ids.substring(1, ids.length + 1);

        console.log('darsalida', this.model.ids);


        if (this.model.ids === '') {
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Seleccione al menos una carga'
          });
          return;
        }

        this.despachoService.registrar_salidacarga(this.model).subscribe(x =>
            {
                this.buscar();
                //success('Se ha registrado la salida con éxito');
          }, ()=> {

          }, () => {
              //error('Error, vuelva a intentarlo');
              this.loading = false;
            });

            

            } ,
            reject: () => {
            }
            });
 }
 bultos(ordenSalidaId: number) {

  this.despachoService.validarBultosCompletos(ordenSalidaId).subscribe({
      next: (respuesta) => {
        this.bultosCompletos = respuesta.completado;

        if (!this.bultosCompletos) {
          this.pendientes = respuesta.pendientes;
          console.warn('Hay productos aún no asignados:', this.pendientes);
       
           this.messageService.add({
            severity: 'warn',
            summary: 'Asignación incompleta',
            detail: 'Faltan productos por asignar a bultos.',
            life: 5000
          });
          
          
          ;
        } else {
          this.pendientes = [];

           this.messageService.add({
            severity: 'success',
            summary: 'Asignación completa',
            detail: 'Todos los productos han sido asignados correctamente. Puedes imprimir la documentación.',
            life: 5000
          });

           let url = 'http://104.36.166.65/reptwh/reporteBultosSalida.aspx?ordensalidaid=' + String(ordenSalidaId) ;
           window.open(url);


        }   
      },
      error: (err) => {
        console.error('Error al verificar bultos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al verificar asignación de bultos.',
          life: 5000
        });
      }
    });

 }
  buscar() {
    this.selectedRow = [];

    this.model.EstadoId = 25;
    this.despachoService.getAllCargas_pendientes(this.model).subscribe(list => {
    this.lines = list;
      });
    }

        
    abrirDetalleOrden() {

 
    const id =       this.selectedRow[0].ordenSalidaId;

    console.log('abrirDetalleOrden', id);
 
      this.dialogService.open(GenerarbultosComponent, {
        header: 'Detalle de Orden de Salida',
        width: '90%',
        height: '850px',
        data: { ordenSalidaId: id }
      });
    }

  

}
