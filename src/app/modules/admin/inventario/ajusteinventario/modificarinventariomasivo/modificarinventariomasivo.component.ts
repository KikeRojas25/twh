import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { CalendarModule } from 'primeng/calendar';
import { InventarioService } from 'app/modules/admin/_services/inventario.service';

@Component({
  selector: 'app-modificarinventariomasivo',
  standalone: true,
  imports: [
    CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        ConfirmDialogModule,
        CalendarModule
  ],
  providers: [ConfirmationService],
  templateUrl: './modificarinventariomasivo.component.html',
  styleUrl: './modificarinventariomasivo.component.scss'
})
export class ModificarinventariomasivoComponent implements OnInit{

  model: any = {};
  es: any;
  id: number;

  constructor(
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private confirmationService: ConfirmationService,
    private inventarioService: InventarioService,
  ){}

  ngOnInit() : void{

    this.id = this.config.data.codigo;
    this.model.ids = this.id;

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

  }

  save(){

    console.log(this.model)

    this.confirmationService.confirm({
      message: '¿Estás seguro que deseas actualizar el inventario?',
      header: 'Confirmación de actualización',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.inventarioService.actualizar_inventarios_masivo(this.model).subscribe(resp => {
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
