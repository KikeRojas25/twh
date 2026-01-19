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
import { PropietarioService } from '../../_services/propietario.service';
import { forkJoin } from 'rxjs';

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

  // Diálogo: fecha real de salida (previo a Dar Salida)
  mostrarDialogFechaSalidaReal = false;
  fechaSalidaReal: Date = new Date();
  es: any;

  cols: any[];

  constructor(private despachoService: DespachosService,
              private clienteService: ClienteService,
              public dialog: DialogService,
              public dialogService: DialogService,
              private messageService: MessageService,
              private propietarioService: PropietarioService,
              private router: Router) { }

  ngOnInit() {

    this.selectedRow = [];

    // Configurar calendario en español (PrimeNG)
    this.es = {
      firstDayOfWeek: 1,
      dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
      dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      monthNames: [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ],
      monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
      today: 'Hoy',
      clear: 'Borrar'
    };

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


    this.propietarioService.getAllPropietarios().subscribe(resp => {
      resp.forEach(element => {
        this.clientes.push({ value: element.id , label: element.razonSocial});
      });

      this.model.EstadoId = 25;
      this.model.PropietarioId = null; // Inicializar como null para que sea obligatorio
      // No se hace búsqueda automática, el usuario debe seleccionar un propietario primero
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
                // Refrescar listado al cerrar el modal con éxito
                this.selectedRow = [];
                this.buscar();
        
        
                
      
                
                 }
              });
     
      
    

 }
 ver (id, rowData?: any) {
  let url: string;
  
  // Obtener propietarioId directamente del objeto o buscar por nombre
  let propietarioId = rowData?.propietarioId || rowData?.PropietarioId || rowData?.propietarioID;
  
  // Si no está disponible directamente, buscar por nombre del propietario en la lista de clientes
  if (!propietarioId && rowData?.propietario && this.clientes.length > 0) {
    const propietarioEncontrado = this.clientes.find(cliente => 
      cliente.label?.toLowerCase().trim() === rowData.propietario?.toLowerCase().trim()
    );
    if (propietarioEncontrado && propietarioEncontrado.value) {
      propietarioId = propietarioEncontrado.value;
    }
  }
  
  console.log('=== DEBUG REPORTE ===');
  console.log('PropietarioId detectado:', propietarioId, 'Tipo:', typeof propietarioId);
  console.log('Propietario nombre:', rowData?.propietario);
  console.log('Comparación propietarioId === 100:', propietarioId === 100);
  console.log('RowData completo:', rowData);
  
  // Solo usar RepRotuloDesCona si el propietarioId es EXACTAMENTE 100 (número)
  // Si es undefined, null, 0, o cualquier otro valor, usar el reporte por defecto
  if (propietarioId !== undefined && propietarioId !== null && Number(propietarioId) === 100) {
    url = 'http://104.36.166.65/reptwh/RepRotuloDesCona.aspx?idorden=' + String(id);
    console.log('⚠️ Usando RepRotuloDesCona para propietarioId:', propietarioId);
  } else {
    url = 'http://104.36.166.65/reptwh/RepRotuloDAP2.aspx?idorden=' + String(id);
    console.log('✓ Usando RepRotuloDAP2 (por defecto) para propietarioId:', propietarioId);
  }
  
  console.log('URL final:', url);
  console.log('===================');
  
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
    if (!this.selectedRow || this.selectedRow.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Seleccione al menos una carga'
      });
      return;
    }

    // Abrir diálogo para capturar la fecha real (reemplaza confirmación)
    this.fechaSalidaReal = new Date();
    this.mostrarDialogFechaSalidaReal = true;
 }

 cancelarSalidaConFecha(): void {
  this.mostrarDialogFechaSalidaReal = false;
  this.fechaSalidaReal = new Date();
 }

 confirmarSalidaConFecha(): void {
  if (!this.selectedRow || this.selectedRow.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Seleccione al menos una carga'
    });
    return;
  }

  if (!this.fechaSalidaReal) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe seleccionar una fecha válida.'
    });
    return;
  }

  let ids = '';
  this.selectedRow.forEach(el => {
    ids = ids + ',' + el.id;
  });
  this.model.ids = ids.substring(1, ids.length + 1);

  if (this.model.ids === '') {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Seleccione al menos una carga'
    });
    return;
  }

  // Actualizar fecha real antes de registrar salida masiva
  const ordenSalidaIds = Array.from(
    new Set(
      this.selectedRow
        .map((x) => x.ordenSalidaId)
        .filter((id) => id !== undefined && id !== null)
    )
  );

  if (ordenSalidaIds.length === 0) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo obtener el/los ID(s) de orden de salida.'
    });
    return;
  }

  this.loading = true;

  forkJoin(
    ordenSalidaIds.map((ordenSalidaId) =>
      this.despachoService.actualizarFechaSalida(Number(ordenSalidaId), this.fechaSalidaReal)
    )
  ).subscribe({
    next: () => {
      this.despachoService.registrar_salidacarga(this.model).subscribe({
        next: () => {
          this.mostrarDialogFechaSalidaReal = false;
          this.buscar();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Salida registrada correctamente.'
          });
        },
        error: (err) => {
          console.error('Error al registrar salida:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || err?.message || 'Error al registrar la salida.'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    },
    error: (err) => {
      console.error('Error al actualizar fecha de salida:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.error?.message || err?.message || 'Error al actualizar la fecha de salida.'
      });
      this.loading = false;
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
    // Validar que se haya seleccionado un propietario
    if (!this.model.PropietarioId || this.model.PropietarioId === 0 || this.model.PropietarioId === null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar un propietario para realizar la búsqueda'
      });
      return;
    }

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
