import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { TableModule } from 'primeng/table';
import { ComercioSearchParams, ComercioSearchResultDto } from '../comercio.types';
import { ComercioService } from '../comercio.service';
import { NonNullableFormBuilder } from '@angular/forms';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [MatIcon, CommonModule, KENDO_BUTTONS, TableModule]

})
export class ListComponent implements OnInit {
  comercios: ComercioSearchResultDto[] = [];

  constructor(private comercioService: ComercioService) { }

  ngOnInit() {

    const searchParams: ComercioSearchParams = {
      nombre: null, // Especifica el nombre o  déjalo vacío
      idTipoEntrega: null,
      idTipoComercio: null,
      idEstado: null,
    };

    this.comercioService.searchComercios(searchParams).subscribe((data) => {
      this.comercios = data; // Asigna los datos directamente a la tabla
    });
  }
  search(data){

  }


  
  

}
