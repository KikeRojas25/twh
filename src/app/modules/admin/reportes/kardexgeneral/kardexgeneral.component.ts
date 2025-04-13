import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { InventarioGeneral } from '../../_models/inventariogeneral';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';
import { ReportesService } from '../reportes.service';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-kardexgeneral',
  templateUrl: './kardexgeneral.component.html',
  styleUrls: ['./kardexgeneral.component.css'],
   standalone: true,
    imports: [
      FormsModule,
      CommonModule,
      MatIcon,
      ButtonModule,
      DropdownModule,
      TableModule,
      InputTextModule,
      CalendarModule
    ]
})
export class KardexgeneralComponent implements OnInit {

  propietarios: SelectItem[] = [];
  grupos: SelectItem[] = [];
  almacenes:  SelectItem[] = [];
  model: any =  {};
  cols: any[];
  inventarios: InventarioGeneral[] = [] ;

  dateInicio: Date = new Date(Date.now()) ;
  dateFin: Date = new Date(Date.now()) ;


  constructor(  private clienteService: ClienteService,
    private generealService: GeneralService,
    private reporteService: ReportesService
  ) { }

  ngOnInit() {


    this.cols =
    [
      { header: 'ALMACÉN', field: 'almacen', width: '140px' },
      { header: 'MOVIMIENTO', field: 'movimiento', width: '120px' },
      { header: 'F. MOVIMIENTO', field: 'fechaRegistro', width: '120px' },
      { header: 'LPN', field: 'lotNum', width: '120px' },
      { header: 'CÓDIGO', field: 'estado', width: '220px' },
      { header: 'DESCRIPCIÓN', field: 'descripcionLarga', width: '450px' },

      { header: 'LOTE', field: 'lotNum', width: '220px' },
      { header: 'CANTIDAD', field: 'untQty', width: '140px' },
      { header: 'PESO', field: 'peso', width: '100px' },
      { header: 'REFERENCIA', field: 'referencia', width: '150px' },

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

    this.almacenes.push({ value: undefined,  label : "Todos"});
    resp2.forEach(element => {
      this.almacenes.push({ value: element.id ,  label : element.descripcion});
    });




  });



  }
  ver() {
    // Validar que un almacén haya sido seleccionado
    if (!this.model.IdAlmacen) {
        alert('Debe seleccionar un almacén.');
        return;
    }

    // Validar que al menos un grupo o propietario haya sido seleccionado
    if (!this.model.IdGrupo && !this.model.IdPropietario) {
        alert('Debe seleccionar al menos un Grupo o un Propietario.');
        return;
    }

    // Validar que se haya seleccionado un rango de fechas
    if (!this.dateInicio || !this.dateFin) {
        alert('Debe seleccionar un rango de fechas.');
        return;
    }

    // Convertir las fechas en objetos Date
    const fechaInicio = new Date(this.dateInicio);
    const fechaFin = new Date(this.dateFin);

    // Calcular la diferencia en días
    const diferenciaEnMilisegundos = fechaFin.getTime() - fechaInicio.getTime();
    const diferenciaEnDias = diferenciaEnMilisegundos / (1000 * 60 * 60 * 24);

    // Validar que el rango de fechas no supere 7 días
    if (diferenciaEnDias > 31) {
        alert('El rango de fechas no puede ser mayor a una semana.');
        return;
    }

    // Si todas las validaciones pasan, ejecutar la consulta
    this.reporteService.getKardexGeneral(
        this.model.IdAlmacen,
        this.model.IdPropietario,
        this.model.IdGrupo,
        this.dateInicio,
        this.dateFin
    ).subscribe(resp => {
        this.inventarios = resp;
        console.log('Inventarios:', this.inventarios);
    });
}

 exportar(){


  if (!this.model.IdAlmacen) {
    alert('Debe seleccionar un almacén.');
    return;
}

if (!this.model.IdGrupo && !this.model.IdPropietario) {
    alert('Debe seleccionar al menos un Grupo o un Propietario.');
    return;
}

if (!this.dateInicio || !this.dateFin) {
    alert('Debe seleccionar un rango de fechas.');
    return;
}

const fechaInicio = new Date(this.dateInicio);
const fechaFin = new Date(this.dateFin);

const fecInicioStr = `${fechaInicio.getDate()}/${fechaInicio.getMonth() + 1}/${fechaInicio.getFullYear()}`;
const fecFinStr = `${fechaFin.getDate()}/${fechaFin.getMonth() + 1}/${fechaFin.getFullYear()}`;

let url = `http://104.36.166.65/reptwh/reportegeneralKARDEX.aspx?Grupoid=${this.model.IdGrupo || ''}&PropietarioId=${this.model.IdPropietario || ''}&fecinicio=${fecInicioStr}&fecfin=${fecFinStr}`;

window.open(url, '_blank');


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
