import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DespachosService } from '../despachos.service';
import { ClienteService } from '../../_services/cliente.service';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdenSalida } from '../despachos.types';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone:true,
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
    TooltipModule,
    ],
    providers: [
      DialogService,
      MessageService,
      ConfirmationService
    ]
})
export class ListComponent implements OnInit {

  ref: DynamicDialogRef | undefined;
  ocResults: any[];
  searchCriteria = { oc: '', sku: '' };
  clientes: SelectItem[] = [];
  familias: any[] = [];
  subfamilias: any[] = [];
  cols: any[];
  cols2: any[];
  detalleOCModal = false;
  CicloVidaOCModal = false;
  Items: any[];
  selectedOC : any = {};

  selectedRubro: any;
  selectedFamilia: any;
  selectedSubfamilia: any;
  selectedRow: OrdenSalida[] = [];

  model: any = { guiaremision : ''};
  ordenes: OrdenSalida[] = [];
  
  // Variables para el diálogo de fecha de salida
  mostrarDialogFechaSalida = false;
  ordenSalidaSeleccionada: OrdenSalida | null = null;
  fechaSalidaEditada: Date = new Date();

  dateInicio: Date = new Date(Date.now()) ;
  dateFin: Date = new Date(Date.now()) ;
  
  es: any;


  constructor(
    public dialogService: DialogService,
    private despachosService: DespachosService,
    private clienteService: ClienteService,
    private propietarioService: PropietarioService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService ,
    private router: Router,
  ) { }

  
  ngOnInit(): void {
    // Configurar calendario en español
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

    this.cols2 = [
      { header: 'NUM OC', backgroundcolor: '#125ea3', field: 'tiOrdeComp', width: '120px' },
      { header: 'COD ITEM', backgroundcolor: '#125ea3', field: 'tiOrdeComp', width: '120px' },
      { header: 'DES ITEM', backgroundcolor: '#125ea3', field: 'nuOrdeComp', width: '120px' },
      { header: 'CANTIDAD ORDENADA', backgroundcolor: '#125ea3', field: 'stOrde', width: '120px' },
      { header: 'CANTIDAD INGRESADA', backgroundcolor: '#125ea3', field: 'deRubr', width: '120px' },
      { header: 'IMPORTE', backgroundcolor: '#125ea3', field: 'deRubr', width: '120px' },
      { header: 'TOTAL', backgroundcolor: '#125ea3', field: 'deRubr', width: '120px' },

    ]

    this.cols =
    [
        {header: 'ACCIONES', field: 'numOrden' , width: '260px' },
        {header: 'ORS', field: 'numOrden'  ,  width: '120px' },
        {header: 'PROPIETARIO', field: 'propietario'  , width: '200px'   },
        {header: 'ESTADO', field: 'nombreEstado'  ,  width: '100px'  },
        {header: 'GR SALIDA', field: 'guiaRemision' , width: '160px'  },
        {header: 'REF INGRESO', field: 'equipotransporte'  , width: '140px'  },
        {header: 'REGISTRADO POR', field: 'TipoRegistro'  , width: '220px'  },
        {header: 'F. REQUERIDA', field: 'fechaEsperada'  , width: '120px'  },
        {header: 'F. REGISTRO', field: 'fechaRegistro', width: '120px'    },
      ];

  
  this.propietarioService.getAllPropietarios().subscribe(resp => {

    resp.forEach(resp => {
      this.clientes.push({value: resp.id , label: resp.razonSocial });
    });
  

  });


    this.buscar();
  }

  


  buscar(){
  
    this.model.fec_ini =  this.dateInicio;
    this.model.fec_fin =  this.dateFin ;
  
    localStorage.setItem('AlmacenId', this.model.AlmacenId);
    localStorage.setItem('PropietarioId', this.model.PropietarioId);
    localStorage.setItem('Intervalo', this.model.intervalo);
    localStorage.setItem('Estado', this.model.EstadoId);
  
    this.despachosService.getAllOrdenSalida(this.model).subscribe(list => {
        this.ordenes = list;

        console.log('ordenes', this.ordenes);

        });
     }





  verDetalle(rowData: any) {
    console.log(rowData.nU_ORDE_COMP);
    this.detalleOCModal = true;

    // this.importacionesOcService.getDetalleOC(rowData.nU_ORDE_COMP).subscribe({
    //   next: data => {
    //      this.Items = data;
    //      console.log('items', this.Items);
    //   }
    // })
  }

  edit(rowData: any) {
    // Navegar a editar o abrir diálogo de edición
    this.router.navigate(['/picking/nuevaordensalida'], {
      queryParams: { id: rowData.ordenSalidaId }
    });
  }

  nuevaorden() {
    this.router.navigate(['/picking/nuevaordensalida']);
  }

  nuevaordenmasiva() {
    this.router.navigate(['/picking/nuevasalidamasiva']);
  }

  delete(id: number) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar el despacho?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.despachosService.deleteOrder(id).subscribe(x => {
          this.buscar();
          this.messageService.add({
            severity: 'success',
            summary: 'TWH',
            detail: 'Se eliminó correctamente.'
          });
        });
      },
      reject: () => {
        // Usuario canceló
      }
    });
  }

  editarFechaSalida(rowData: OrdenSalida): void {
    this.ordenSalidaSeleccionada = rowData;
    // Si tiene fecha de salida, usarla; si no, usar la fecha requerida como referencia
    this.fechaSalidaEditada = (rowData as any).fechaSalida 
      ? new Date((rowData as any).fechaSalida) 
      : (rowData.fechaRequerida ? new Date(rowData.fechaRequerida) : new Date());
    this.mostrarDialogFechaSalida = true;
  }

  guardarFechaSalida(): void {
    if (!this.ordenSalidaSeleccionada) {
      return;
    }

    if (!this.fechaSalidaEditada) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar una fecha válida.'
      });
      return;
    }

    const ordenSalidaId = this.ordenSalidaSeleccionada.ordenSalidaId || this.ordenSalidaSeleccionada.id;

    this.despachosService.actualizarFechaSalida(ordenSalidaId, this.fechaSalidaEditada).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: response.message || 'Fecha de salida actualizada correctamente.'
        });
        this.mostrarDialogFechaSalida = false;
        this.ordenSalidaSeleccionada = null;
        this.buscar(); // Recargar la lista
      },
      error: (error) => {
        console.error('Error al actualizar fecha de salida:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || error?.message || 'Error al actualizar la fecha de salida.'
        });
        
      },
      complete: () => {
      
      }
    });
  }

  cancelarEditarFechaSalida(): void {
    this.mostrarDialogFechaSalida = false;
    this.ordenSalidaSeleccionada = null;
    this.fechaSalidaEditada = new Date();
  }




}
