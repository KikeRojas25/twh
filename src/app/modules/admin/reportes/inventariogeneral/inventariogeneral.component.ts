import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ClienteService } from '../../_services/cliente.service';
import { SelectItem } from 'primeng/api';
import { GeneralService } from '../../_services/general.service';
import { TableModule } from 'primeng/table';
import { InventarioGeneral } from '../../_models/inventariogeneral';
import { ReportesService } from '../reportes.service';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-inventariogeneral',
  templateUrl: './inventariogeneral.component.html',
  styleUrls: ['./inventariogeneral.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatIcon,
    ButtonModule,
    DropdownModule,
    TableModule,
    InputTextModule
  ]
})
export class InventariogeneralComponent implements OnInit {
  
  propietarios: SelectItem[] = [];
  almacenes:  SelectItem[] = [];
  model: any =  {};
  cols: any[];
  inventarios: InventarioGeneral[] = [] ;
  grupos: SelectItem[] = [];


  constructor(  private clienteService: ClienteService,
    private generealService: GeneralService,
    private reporteService: ReportesService
  ) { }

  ngOnInit() {


    this.cols =
    [
      { header: 'ALMACÉN', field: 'almacen', width: '140px' },
      { header: 'CÓDIGO', field: 'estado', width: '220px' },
      { header: 'DESCRIPCIÓN', field: 'descripcionLarga', width: '450px' },

      { header: 'LOTE', field: 'lotNum', width: '220px' },
      { header: 'CANTIDAD', field: 'untQty', width: '140px' },
      { header: 'CANTIDAD SEPARADA', field: 'cantidadSeparada', width: '140px' },
      { header: 'STOCK DISPONIBLE', field: 'stockDisponible', width: '140px' },

      { header: 'PESO', field: 'peso', width: '100px' },
      { header: 'ESTADO', field: 'estado', width: '150px' },
      { header: 'REFERENCIA', field: 'referencia', width: '150px' },


      { header: 'LPN', field: 'lotNum', width: '120px' },
      
     
      { header: 'F. REGISTRO', field: 'fechaRegistro', width: '120px' },
      { header: 'UBICACIÓN', field: 'ubicacion', width: '120px' },

   
      { header: 'F. EXPIRACIÓN', field: 'fechaExpire', width: '120px' },
      { header: 'F. PRODUCCIÓN', field: 'fechaProduccion', width: '120px' },
   
     
   

      ];


    
  this.clienteService.getAllPropietarios('').subscribe(resp => {

    resp.forEach(resp => {
      this.propietarios.push({value: resp.id , label: resp.razonSocial });
    });
  

  });

  this.clienteService.getAllGrupos().subscribe(resp => {

    resp.forEach(resp => {
      this.grupos.push({value: resp.id , label: resp.nombre });
    });
  

  });


  this.generealService.getAllAlmacenes().subscribe(resp2 => {


    resp2.forEach(element => {
      this.almacenes.push({ value: element.id ,  label : element.descripcion});
    });




  });



  }

  ver() {

    if (!this.model.IdGrupo && !this.model.IdPropietario) {
      alert('Debe seleccionar al menos un Grupo o un Propietario');
      return;
  }


    this.reporteService.getInventarioGeneral(this.model.IdGrupo, this.model.IdPropietario).subscribe(resp=> {
         this.inventarios = resp;

         console.log( 'inventarios:',this.inventarios)
    })

  }
 exportar(){

  if (!this.model.IdGrupo && !this.model.IdPropietario) {
    alert('Debe seleccionar al menos un Grupo o un Propietario');
    return;
}


  let url = 'http://104.36.166.65/reptwh/Rep_Inventario.aspx?';
  let params = [];

  if (this.model.IdPropietario) {
      params.push('clienteid=' + encodeURIComponent(String(this.model.IdPropietario)));
  }
  if (this.model.IdGrupo) {
      params.push('grupoid=' + encodeURIComponent(String(this.model.IdGrupo)));
  }

  url += params.join('&'); // Une solo los parámetros definidos con '&'
  
  window.open(url, '_blank');

  // let url = 'http://104.36.166.65/reptwh/Rep_Inventario.aspx?clienteid=' + String( this.model.IdPropietario) +
  // '&grupoid=' + String(this.model.IdGrupo);
  // window.open(url);




 }
 
 cargarClientes(){
  
  this.propietarios = [];

  this.clienteService.getAllPropietarios(this.model.IdGrupo).subscribe({
    next: response => {
    
      response.forEach((x) => {
          this.propietarios.push ({ label: x.razonSocial , value: x.id });
      });
    }
  });
}


}
