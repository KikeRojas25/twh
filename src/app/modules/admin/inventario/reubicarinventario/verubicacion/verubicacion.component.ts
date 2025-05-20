import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { SelectItem, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { GeneralService } from 'app/modules/admin/_services/general.service';
import { TableModule } from 'primeng/table';
import { Ubicacion } from 'app/modules/admin/planning/planning.types';

@Component({
  selector: 'app-verubicacion',
  standalone: true,
  imports: [
    CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        ConfirmDialogModule,
        DropdownModule,
        TableModule
  ],
  providers: [ConfirmationService],
  templateUrl: './verubicacion.component.html',
  styleUrl: './verubicacion.component.scss'
})
export class VerubicacionComponent implements OnInit{

  model: any = {};
  almacenes: SelectItem[] = [];
  Ubicaciones: Ubicacion[] = [];
  cols: any[];
  lpn: string;

  constructor(
      private ref: DynamicDialogRef,
      private config: DynamicDialogConfig,
      private confirmationService: ConfirmationService,
      private generalService: GeneralService,
  ){}
  
  ngOnInit() : void{

    this.lpn = this.config.data?.id;

    this.generalService.getAllAlmacenes().subscribe(resp => {
      resp.forEach(element => {
        this.almacenes.push({ value: element.id ,  label : element.descripcion});
      });
    });

    this.cols =
    [
        { header: 'ACCIONES', field: 'numOrden' , width: '40px' },
        { header: 'UBICACIÓN', field: 'nombreEstado'  ,  width: '60px'  },
        { header: 'ALMACÉN', field: 'almacen'  ,  width: '60px'  },
        { header: 'ESTADO', field: 'estado' , width: '60px'  },
    ];

  }

  buscar(){
    this.generalService.getAllUbicacionesxNombre(this.model.AlmacenId, this.model.ubicacion).subscribe(list=> {
      this.Ubicaciones = list;
    });
  }

  reubicar(id){

    
    this.confirmationService.confirm({
      message: '¿Estás seguro que deseas reubicar?',
      header: 'Confirmación de ajuste',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.generalService.setUbicacion(this.lpn, id ).subscribe(list=> {
          this.Ubicaciones = list;
        });
      },
      reject: (type) => {
          switch (type) {
          }
      }
    });

  }

}
