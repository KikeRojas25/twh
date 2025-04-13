import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ClienteService } from '../../_services/cliente.service';
import { CalendarModule } from 'primeng/calendar';
import { FacturacionService } from '../facturacion.service';
import moment from 'moment';

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
    CalendarModule
  ]
})
export class LiquidacionservicioComponent implements OnInit {

  liquidacion: any;
  clientes: SelectItem[] = [];

  dateInicio: Date = new Date(Date.now()) ;
  dateFin: Date = new Date(Date.now()) ;


  model: any = {};

  constructor(private clienteService: ClienteService,
    private facturacionService: FacturacionService,
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
  procesar() {

    this.model.InicioCorte = moment(this.dateInicio).format('DD/MM/YYYY');
    this.model.FinCorte = moment(this.dateFin).format('DD/MM/YYYY');
    this.model.PropietarioId = this.model.PropietarioId ;

    this.facturacionService.generar_preliquidacion(this.model).subscribe(resp => {

      console.log('terminé', resp);
      this.liquidacion = resp;

      this.liquidacion = this.liquidacion.map(item => ({
        ...item,
        out: item.out ?? 0, // Si es null o undefined, lo convierte en 0
        picking: item.picking ?? 0 // Lo mismo para picking
    }));
    

    //  let url = 'http://104.36.166.65/reptwh/Rep_Liquidacion.aspx?clienteid=' + String(resp) +
    //   '&fecinicio=' + this.model.InicioCorte +  '&fecfin=' + this.model.FinCorte;
    //  window.open(url);
    // });
    
    // this.facturacionService.getPendientesLiquidacion(this.model.PropietarioFiltroId , this.model).subscribe(list => {

    //   console.log('respuesta',list);
     });

  }
getTotalIn(): number {
    return this.liquidacion?.reduce((total, item) => total + (item.in ?? 0), 0) || 0;
}

getTotalOut(): number {
    return this.liquidacion?.reduce((total, item) => total + Math.abs(item.out ?? 0), 0) || 0;
}

getTotalPicking(): number {
    return this.liquidacion?.reduce((total, item) => total + Math.abs(item.picking ?? 0), 0) || 0;
}

getTotalPos(): number {
    return this.liquidacion?.reduce((total, item) => total + (item.pos ?? 0), 0) || 0;
}

getTotalGeneral(): number {
    return this.getTotalIn() + this.getTotalOut() + this.getTotalPicking() + this.getTotalPos();
}



}
