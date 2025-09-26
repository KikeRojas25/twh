import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ProductoService } from '../../../_services/producto.service';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-newedithuella',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './newedithuella.component.html',
  styleUrl: './newedithuella.component.scss'
})
export class NewedithuellaComponent implements OnInit{

  model: any = {};
  form: FormGroup;
  productoId: number;
  id: number;

  constructor(
      private ref: DynamicDialogRef,
      private config: DynamicDialogConfig,
      private productoService: ProductoService,
      private router: Router,
      private confirmationService: ConfirmationService,
    ){}

  ngOnInit(){

    this.productoId = this.config.data?.productoId;
    const esNuevo = this.config.data?.esNuevo;

    if (this.productoId && !esNuevo){
      this.productoService.getHuella(this.productoId).subscribe(resp => {
        this.model = resp;
        this.id = this.model.id;
        console.log(this.model)
      });
    }
  }

  save(){
    const esEdicion = this.model.id !== undefined && this.model.id !== 0;

    this.model.caslvl = Number(this.model.caslvl);

    if (!esEdicion) {
      this.model.id = 1;
      this.model.productoId = this.productoId;
    }
    else{
      this.model.id = this.id;
    }
    
    this.confirmationService.confirm({
      acceptLabel: 'Guardar',                   // Texto del botón "Aceptar"
      rejectLabel: 'Cancelar',                  // Texto del botón "Rechazar"
      acceptIcon: 'pi pi-check',                // Icono del botón "Aceptar"
      rejectIcon: 'pi pi-times',                // Icono del botón "Rechazar"
      message: '¿Está seguro que desea guardar la huella?',
      header: 'Confirmar Guardado',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const request = esEdicion
        ? this.productoService.editarHuella(this.model)
        : this.productoService.registrarHuella(this.model);
  
        request.subscribe({
          next: (resp) => {
            this.ref.close(true);
            //this.router.navigate(['mantenimiento/verproducto/',this.model.productoId]);
          },
          error: (err) => {
            console.error('Error al guardar cliente', err);
          }
        });
      } ,
      reject: () => {
      }
    });
  }

  close(){
    this.ref?.close();
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

}
