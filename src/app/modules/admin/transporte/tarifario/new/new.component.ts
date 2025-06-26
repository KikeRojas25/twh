import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';

import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router } from '@angular/router';
import { TransporteService } from '../../transporte.service';
import { ClienteService } from 'app/modules/admin/_services/cliente.service';
import { GeneralService } from 'app/modules/admin/_services/general.service';
import { TarifarioService } from '../tarifario.service';
import { MantenimientoService } from 'app/modules/admin/mantenimientos/mantenimiento.service';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
  standalone:true,
  imports:[
    DropdownModule,
    InputTextModule,
    FormsModule,
    MatIcon,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [
    MessageService ,
    ConfirmationService     
  ]
})
export class NewComponent implements OnInit {
  model: any = {};
  clientes:SelectItem[] = [];
  tiposVehiculo:SelectItem[] = [];
  provincias:SelectItem[] = [];
  distritos:SelectItem[] = [];
   
   proveedores: SelectItem[] = [];
  distritosFiltrados: SelectItem[] = [];
  constructor(
              private tarifarioService: TarifarioService,
              private clienteService: ClienteService,
              private mantenimientoService: MantenimientoService,
              private generalService: GeneralService,
              private ref: DynamicDialogRef,

              private confirmationService: ConfirmationService ,
              private messageService: MessageService,
              private router: Router,
  ) { }

  ngOnInit() {
    this.cargarDropdown();
  }

  cargarDropdown() {
   
    this.mantenimientoService.GetAllProveedor().subscribe(resp => {
      resp.forEach(element => {
        this.proveedores.push({ value: element.id , label: element.razonSocial});
      });
    });



    this.clienteService.getAllPropietarios('').subscribe(resp =>    {

      console.log(resp);
        resp.forEach(element => {
          this.clientes.push({ value: element.id , label: element.cliente});
        });

      });

      this.generalService.getValorTabla(4).subscribe(resp =>
        {
          resp.forEach(element => {
            this.tiposVehiculo.push({ value: element.id , label: element.valorPrincipal});
          });
  
        });

      this.generalService.GetAllProvincias('').subscribe(resp=>  {


        console.log('provincias',resp);
          resp.forEach(x=> {
            this.provincias.push({value: x.idprovincia , label: x.provincia});
          })
        });
  }

  onProvinciaChange() {



    const idProvincia = this.model.IdDestinoProvincia;


    console.log(idProvincia, 'idProvincia');




    if (idProvincia) {
      this.generalService.GetDistritos(idProvincia).subscribe(resp => {
        console.log(resp)
        this.distritosFiltrados = resp.map(x => ({
          value: x.iddistrito,
          label: x.distrito
        }));
      });
      
    } else {
      this.distritosFiltrados = [];
    }
  }

  cerrarModal() { 
    this.ref?.close();
  }

  guardarTarifa() {

    console.log(this.model, 'modelo a guardar');


    this.confirmationService.confirm({
      message: '¿Está seguro que desea guardar la tarifa?',
      header: 'Guardar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => { 
        console.log(this.model);
        this.tarifarioService.agregar(this.model).subscribe({
          next: (data) => {
            this.messageService.add({severity:'success', summary:'Tarifa registrada', detail:'La tarifa se ha registrado correctamente'});
            this.ref?.close(true);
          },
          error: err => {
            // Captura el mensaje del backend
            const mensaje = err.error?.message || 'Error inesperado';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: mensaje
            });
          },
          complete: () => {
           
          }
        });
      },
      reject: () => {

      }
    });
  }

}
