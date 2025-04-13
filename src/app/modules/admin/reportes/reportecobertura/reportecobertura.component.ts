import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';
import { PlanningService } from '../../planning/planning.service';

@Component({
  selector: 'app-reportecobertura',
  templateUrl: './reportecobertura.component.html',
  styleUrls: ['./reportecobertura.component.css'],
   standalone: true,
   imports: [
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
          MatIcon,
          IconFieldModule,
          InputIconModule
        ],
        providers: [
          DialogService ,
          MessageService ,
          ConfirmationService 
      
        ]
})
export class ReportecoberturaComponent implements OnInit {

  almacenes: SelectItem[] = [];
  propietarios: SelectItem[] = [];

    // Modelos
    model: any = {};


  constructor( private planningService: PlanningService,
      private clienteService: ClienteService,
      private generalService: GeneralService,
      private router: Router,
      private messageService: MessageService,
      private confirmationService: ConfirmationService ,) { }

  ngOnInit() {

    this.cargarFiltrosGuardados();


    this.cargarPropietarios();
    this.cargarAlmacenes();



  }
  cargarFiltrosGuardados() {
    const savedFilter = localStorage.getItem('filtroPicking');
    if (savedFilter) {
      this.model = JSON.parse(savedFilter);
    }
  }
  buscar() {


    this.guardarFiltros(); // Guarda el filtro en localStorage


    var url = "http://104.36.166.65/webreports/RepCobertura.aspx?propietarioid=" + String(this.model.PropietarioId);
    window.open(url);



  }
  guardarFiltros() {
    localStorage.setItem('filtroPicking', JSON.stringify(this.model));
  }
  cargarPropietarios() {
    this.clienteService.getAllPropietarios('').subscribe((resp) => {
      this.propietarios = resp.map((propietario) => ({
        label: propietario.razonSocial,
        value: propietario.id
      }));
    //  this.model.PropietarioId = this.propietarios[0]?.value || null;
    });
  }

  cargarAlmacenes() {
    this.generalService.getAllAlmacenes().subscribe((resp) => {
      this.almacenes = resp.map((almacen) => ({
        label: almacen.descripcion,
        value: almacen.id
      }));
     // this.model.AlmacenId = this.almacenes[0]?.value || null;
    });
  }
}
