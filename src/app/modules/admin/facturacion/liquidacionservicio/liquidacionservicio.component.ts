import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ClienteService } from '../../_services/cliente.service';
import { CalendarModule } from 'primeng/calendar';
import { FacturacionService } from '../facturacion.service';
import moment from 'moment';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';


import { ConfirmDialogModule } from 'primeng/confirmdialog';
interface Column {
  field: string;
  header: string;
}




@Component({
  selector: 'app-liquidacionservicio',
  templateUrl: './liquidacionservicio.component.html',
  styleUrls: ['./liquidacionservicio.component.css'],
  standalone:true,
  imports: [
    MatIcon,
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
  ],
  providers: [
        DialogService,
        MessageService,
        ConfirmationService
      ]
})
export class LiquidacionservicioComponent implements OnInit {

  liquidacion: any;
  clientes: SelectItem[] = [];

  dateInicio: Date = new Date(Date.now()) ;
  dateFin: Date = new Date(Date.now()) ;

  korean : any = {};
  cols!: Column[];


products: any[] = [];
selectedProducts: any[] = [];
  model: any = {};

  constructor(private clienteService: ClienteService,
    private facturacionService: FacturacionService,
     private confirmationService: ConfirmationService ,
     private messageService: MessageService,
  ) { }

  ngOnInit() {


    this.clienteService.getAllPropietarios('').subscribe(resp => {

      resp.forEach(resp => {
        this.clientes.push({value: resp.id , label: resp.razonSocial });
      });
    

    });


  }
  exportar() {

    let url = 'http://104.36.166.65/reptwh/Rep_Liquidacion.aspx?clienteid=' + String( this.model.PropietarioId) +
    '&fecinicio=' + this.model.InicioCorte +  '&fecfin=' + this.model.FinCorte;
    window.open(url);

  }
consultar () {
this.model.InicioCorte = moment(this.dateInicio).format('DD/MM/YYYY');
this.model.FinCorte = moment(this.dateFin).format('DD/MM/YYYY');
this.model.PropietarioId = this.model.PropietarioId ;


this.facturacionService.consultar_preliquidacion(this.model).subscribe(resp => {
  console.log('RESPUESTA', resp); // Para depurar

  this.liquidacion = resp.map(item => ({
    ...item,
    out: item.out ?? 0,
    picking: item.picking ?? 0,
    ingreso: item.ingreso ?? 0,
    pos: item.pos ?? item.posTotal ?? 0,
    total: 
      (item.ingreso ?? 0) +
      (item.out ?? 0) +
      (item.picking ?? 0) +
      (item.pos ?? item.posTotal ?? 0)
      
  }));

  this.products = this.liquidacion;

  this.cols = [
    { field: 'lpn', header: 'LPN' },
    { field: 'fechaIngreso', header: 'Fecha Ingreso' },
    { field: 'fechaSalida', header: 'Fecha Salida' },
    { field: 'clienteId', header: 'Cliente' },
    { field: 'ingreso', header: 'In' },
    { field: 'out', header: 'Out' },
    { field: 'picking', header: 'Picking' },
    { field: 'pos', header: 'Pos' },
    { field: 'total', header: 'Total' }
  ];
});
}


  generar() {

    
    this.confirmationService.confirm({
      message: '¿Está seguro que desea generar liquidación?',
      header: 'Generar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
 

    this.model.mes = moment(this.dateInicio).format('MM');
    this.model.anio = moment(this.dateInicio).format('YYYY');


    this.model.InicioCorte = moment(this.dateInicio).format('DD/MM/YYYY');
    this.model.FinCorte = moment(this.dateFin).format('DD/MM/YYYY');
    this.model.PropietarioId = this.model.PropietarioId ;


    this.facturacionService.generar_preliquidacion(this.model).subscribe(resp => {

    
      this.liquidacion = resp;

      this.liquidacion = this.liquidacion.map(item => ({
        ...item,
        out: item.out ?? 0, // Si es null o undefined, lo convierte en 0
        picking: item.picking ?? 0 // Lo mismo para picking
   
      }));
      
      // ✅ Mostrar mensaje luego de terminar de procesar la data
      this.messageService.add({
        severity: 'success',
        summary: 'Confirmación',
        detail: 'Se ha generado correctamente',
        life: 3000
      });
    
if (this.model.PropietarioId ===1 ){

     let url = 'http://104.36.166.65/reptwh/Rep_LiquidacionNestle.aspx?propietarioid=' + String(this.model.PropietarioId) +
      '&mes=' +   this.model.mes+  '&anio='    +  this.model.anio  ;  
      window.open(url);
   
  }
  else if (this.model.PropietarioId ===106){
    // this.facturacionService.getPendientesLiquidacion(this.model.PropietarioFiltroId , this.model).subscribe(list => {
      let url = 'http://104.36.166.65/reptwh/Rep_LiquidacionGamma.aspx?propietarioid=' + String(this.model.PropietarioId) +
      '&mes=' +   this.model.mes+  '&anio='    +  this.model.anio  ;  
      window.open(url);
  }

  else if (this.model.PropietarioId ===83){
    // this.facturacionService.getPendientesLiquidacion(this.model.PropietarioFiltroId , this.model).subscribe(list => {
      let url = 'http://104.36.166.65/reptwh/Rep_LiquidacionIgasaPl.aspx?propietarioid=' + String(this.model.PropietarioId) +
      '&mes=' +   this.model.mes+  '&anio='    +  this.model.anio  ;  
      window.open(url);
  }
  else if (this.model.PropietarioId ===82){
    // this.facturacionService.getPendientesLiquidacion(this.model.PropietarioFiltroId , this.model).subscribe(list => {
      let url = 'http://104.36.166.65/reptwh/Rep_LiquidacionIgasaPT.aspx?propietarioid=' + String(this.model.PropietarioId) +
      '&mes=' +   this.model.mes+  '&anio='    +  this.model.anio  ;  
      window.open(url);
  }
  else if (this.model.PropietarioId ===45){
    // this.facturacionService.getPendientesLiquidacion(this.model.PropietarioFiltroId , this.model).subscribe(list => {
      let url = 'http://104.36.166.65/reptwh/Rep_LiquidacionTerra.aspx?propietarioid=' + String(this.model.PropietarioId) +
      '&mes=' +   this.model.mes+  '&anio='    +  this.model.anio  ;  
      window.open(url);
  }
  else if (this.model.PropietarioId ===125){
    // this.facturacionService.getPendientesLiquidacion(this.model.PropietarioFiltroId , this.model).subscribe(list => {
      let url = 'http://104.36.166.65/reptwh/Rep_Liquidacionmultex.aspx?propietarioid=' + String(this.model.PropietarioId) +
      '&mes=' +   this.model.mes+  '&anio='    +  this.model.anio  ;  
      window.open(url);
  }
  else if (this.model.PropietarioId ===129){
    // this.facturacionService.getPendientesLiquidacion(this.model.PropietarioFiltroId , this.model).subscribe(list => {
      let url = 'http://104.36.166.65/reptwh/Rep_Liquidacionexim.aspx?propietarioid=' + String(this.model.PropietarioId) +
      '&mes=' +   this.model.mes+  '&anio='    +  this.model.anio  ;  
      window.open(url);
  }
  });
    },
    reject: () => {

    }
  });


  }

  exportToExcel(): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.products);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Liquidación': worksheet },
      SheetNames: ['Liquidación']
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'liquidacion_servicio.xlsx');
  }
  
getTotalIn(): number {
    return this.liquidacion?.reduce((total, item) => total + (item.ingreso ?? 0), 0) || 0;
}

getTotalOut(): number {
    return this.liquidacion?.reduce((total, item) => total + Math.abs(item.salida ?? 0), 0) || 0;
}

getTotalPicking(): number {
    return this.liquidacion?.reduce((total, item) => total + Math.abs(item.picking ?? 0), 0) || 0;
}

getTotalPos(): number {
    return this.liquidacion?.reduce((total, item) => total + (item.posTotal ?? 0), 0) || 0;
}

getTotalGeneral(): number {
    return this.getTotalIn() + this.getTotalOut() + this.getTotalPicking() + this.getTotalPos();
}



}
