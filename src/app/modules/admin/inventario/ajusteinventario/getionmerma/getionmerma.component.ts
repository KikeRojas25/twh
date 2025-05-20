import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectItem, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { GeneralService } from '../../../_services/general.service';

import { CalendarModule } from 'primeng/calendar';
import { InventarioService } from 'app/modules/admin/_services/inventario.service';

@Component({
  selector: 'app-getionmerma',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    DropdownModule,
    CalendarModule
  ],
  providers: [ConfirmationService],
  templateUrl: './getionmerma.component.html',
  styleUrl: './getionmerma.component.scss'
})
export class GetionmermaComponent implements OnInit{

  model: any = {};
  estados: SelectItem[] = [];
  visible_motivo = false;
  visible_tipo = false;
  visible_area = false;
  es: any = {};
  dateInicio: Date = new Date(Date.now()) ;
  tipos: SelectItem[] = [];
  areas: SelectItem[] = [];
  motivos: SelectItem[] = [];

  constructor(
      private ref: DynamicDialogRef,
      private config: DynamicDialogConfig,
      private confirmationService: ConfirmationService,
      private generalService: GeneralService,
      private inventarioService: InventarioService,
  ){}


  ngOnInit() : void{
    this.model.ids = this.config.data.codigo;
    this.dateInicio.setDate((new Date()).getDate());

    this.es = {
      firstDayOfWeek: 1,
      dayNames: [ 'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado' ],
      dayNamesShort: [ 'dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb' ],
      dayNamesMin: [ 'D', 'L', 'M', 'X', 'J', 'V', 'S' ],
      monthNames: [ 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre' ],
      monthNamesShort: [ 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic' ],
      today: 'Hoy',
      clear: 'Borrar'
    };

    this.generalService.getValorTabla(27).subscribe( resp =>
    {
      resp.forEach(element => {
          this.motivos.push({
          value: element.id ,
          label: element.valorPrincipal
        });
      })
    });


    this.generalService.getValorTabla(29).subscribe( resp =>
    {
      resp.forEach(element => {
          this.areas.push({
          value: element.id ,
          label: element.valorPrincipal
        });
      })
    });

    this.generalService.getValorTabla(28).subscribe( resp =>
    {
      resp.forEach(element => {
          this.tipos.push({
          value: element.id ,
          label: element.valorPrincipal
        });
      })
    });

    this.generalService.getAll(3).subscribe(resp =>
    {
      resp.forEach(element => {
        this.estados.push({
          value: element.id ,
          label: element.nombreEstado
        });
      });
    });

  }

  onChange(event){
    if(event === 18){
      this.visible_motivo = true;
      this.visible_tipo = true;
      this.visible_area = true;
    }
    else {
      this.visible_motivo = false;
      this.visible_tipo = false;
      this.visible_area = false;
    }
  }

  save(){
    
    if( this.model.estadoId === undefined) {
      //warning('Debe seleccionar un estado.');
      return;
    }

    if(this.model.estadoId === 18){

      if(this.model.motivoid === undefined ||  this.model.tipoid === undefined || this.model.areaid === undefined  ) {
        //warning('Debe seleccionar todos los campos.');
        return;
      }

      this.model.FechaRegistroMerma = this.dateInicio;
    }
    
    this.confirmationService.confirm({
      message: '¿Estás seguro que deseas actualizar el estado?',
      header: 'Confirmación de ajuste',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.inventarioService.UpdateStatus(this.model).subscribe(resp => {
          this.ref.close(true);
        });
      },
      reject: (type) => {
          switch (type) {

          }
      }
    });
    
  }

  close(){
    this.ref?.close();
  }

}
