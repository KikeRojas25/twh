import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MenuItem, MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { DespachosService } from '../despachos.service';
import { ClienteService } from '../../_services/cliente.service';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdenSalida } from '../despachos.types';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SplitButtonModule } from 'primeng/splitbutton';
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
    SplitButtonModule,
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

  items: MenuItem[];

  selectedRubro: any;
  selectedFamilia: any;
  selectedSubfamilia: any;
  selectedRow: OrdenSalida[] = [];

  model: any = { guiaremision : ''};
  ordenes: OrdenSalida[] = [];
  

  dateInicio: Date = new Date(Date.now()) ;
  dateFin: Date = new Date(Date.now()) ;


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

     this.items = [
            {
              label: 'Nueva ORS Masiva',
              command: () => {
                  this.nuevaordenmasiva();
              }
          },
            { separator: true },
           ,
          {
            label: 'Nueva ORS Grupo Palmas',
            command: () => {
                this.nuevaorden();
            }
        },
        ];


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
        {header: 'ACCIONES', field: 'numOrden' , width: '120px' },
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





verDetalle(rowData){
  console.log(rowData.nU_ORDE_COMP);
  this.detalleOCModal = true;



  // this.importacionesOcService.getDetalleOC(rowData.nU_ORDE_COMP).subscribe({
  //   next: data => {
  //      this.Items = data;
  //      console.log('items', this.Items);
  //   }
  // })




}

nuevaorden() {
     this.router.navigate(['/picking/nuevaordensalida']);
}
nuevaordenmasiva() {
  this.router.navigate(['/picking/nuevasalidamasiva']);
}

delete(id) {

    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar el despacho?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
 
  

          this.despachosService.deleteOrder(id).subscribe(x=> {

            this.buscar();
            this.messageService.add({severity: 'success', summary: 'TWH', detail: 'Se eliminó correctamente.'})  //success('Se registró correctamente.');
          })

    },
    reject: () => {

    }
  });

}




}
