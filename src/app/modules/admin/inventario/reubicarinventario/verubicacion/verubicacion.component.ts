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
  lpnList: string[] = [];
  selectedUbicacion: any = null

  constructor(
      private ref: DynamicDialogRef,
      private config: DynamicDialogConfig,
      private confirmationService: ConfirmationService,
      private generalService: GeneralService,
  ){}
  
  ngOnInit() : void{

    this.lpnList = this.config.data?.ids || []; // ahora es arreglo de múltiples LPNs

  this.generalService.getAllAlmacenes().subscribe(resp => {
    this.almacenes = resp.map(element => ({
      value: element.id,
      label: element.descripcion
    }));
  });

  this.cols = [
   
    { header: 'UBICACIÓN', field: 'nombreEstado', width: '60px' },
    { header: 'ALMACÉN', field: 'almacen', width: '60px' },
    { header: 'ESTADO', field: 'estado', width: '60px' },
  ];

  }

  buscar(){
    this.generalService.getAllUbicacionesxNombre(this.model.AlmacenId, this.model.ubicacion).subscribe(list=> {
      this.Ubicaciones = list;
    });
  }

 reubicarMasivo(id: number) {
  this.confirmationService.confirm({
    message: `¿Estás seguro que deseas reubicar los ${this.lpnList.length} LPN seleccionados?`,
    header: 'Confirmación de reubicación masiva',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      const payload = {
        Paletas: this.lpnList, // ✅ Correcto
        UbicacionId: id,
        IdUsuario: 1 // o traerlo de un servicio de auth si lo tienes
      };

      this.generalService.setUbicacionMasiva(payload).subscribe(() => {
        this.ref.close(true); // cerrar popup
      });
    }
  });
}


}
