import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { GeneralService } from 'app/modules/admin/_services/general.service';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MantenimientoService } from '../../mantenimiento.service';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
  standalone:true,
    imports: [
          InputTextModule, 
          DropdownModule,
          FormsModule,
          ButtonModule,
          TableModule,
          CommonModule,
          DialogModule   ,
          DynamicDialogModule ,
          ToastModule,
          CalendarModule,
          ConfirmDialogModule,
          MatIcon,
          IconFieldModule,
          InputIconModule,
          InputMaskModule ,
          InputNumberModule
        ],
        providers: [
          MessageService ,
          ConfirmationService     
        ]
})
export class NewComponent implements OnInit {

  proveedores: SelectItem[] = [];
  model: any = {};
  cargandoProveedores = false;  
    marcas: SelectItem[] = [];
    tiposVehiculo:SelectItem[] = [];


  constructor(private mantenimientoService: MantenimientoService,
          private generalService: GeneralService,
          private ref: DynamicDialogRef,
          private confirmationService: ConfirmationService ,
          private messageService: MessageService) { }

  ngOnInit() {
    this.cargarDropdownProveedores();
    this.cargarDropdown();
  }
  cargarDropdown() {
   
    this.generalService.getValorTabla(5).subscribe(resp =>    {

      console.log(resp);
        resp.forEach(element => {
          this.marcas.push({ value: element.id , label: element.valorPrincipal});
        });

      });

      this.generalService.getValorTabla(4).subscribe(resp =>
        {
          resp.forEach(element => {
            this.tiposVehiculo.push({ value: element.id , label: element.valorPrincipal});
          });
  
        });
  }
  cargarDropdownProveedores() {
    this.mantenimientoService.GetAllProveedor().subscribe({
      next: (data) => {

     
        this.proveedores = data.map(p => ({
          label: p.razonSocial, // o lo que corresponda
          value: p.id
      }));



    },
    error: (err) => {
        console.error('Error al cargar proveedores', err);
    },
    complete: () => {
        this.cargandoProveedores = false;
    } 
  
  
  });
  }
  guardarVehiculo() {



    this.confirmationService.confirm({
      message: '¿Está seguro que desea guardar el vehículo?',
      header: 'Guardar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
    
                this.mantenimientoService.guardarVehiculo(this.model).subscribe({
                  next: (data) => {
                    this.messageService.add({severity:'success', summary:'Vehículo registrado', detail:'El vehículo se ha registrado correctamente'});
                    this.ref?.close();
                },
                error: err => {
                  // Captura el mensaje del backend



                  const mensaje = err.error?.message || 'Error inesperado';
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: mensaje
                  });
                }
              
              
              });
      },
      reject: () => {

      }
    });



  }
  cerrarModal() { 
         this.ref?.close();
     }


}
