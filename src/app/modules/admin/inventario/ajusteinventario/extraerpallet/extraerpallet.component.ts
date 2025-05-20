import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InventarioService } from 'app/modules/admin/_services/inventario.service';


@Component({
  selector: 'app-extraerpallet',
  standalone: true,
  imports: [
    CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './extraerpallet.component.html',
  styleUrl: './extraerpallet.component.scss'
})
export class ExtraerpalletComponent implements OnInit{

  model: any = [];
  es: any;
  id: number;

  constructor(
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private confirmationService: ConfirmationService,
    private inventarioService: InventarioService,
  ){}

  ngOnInit() : void{

    this.id =  this.config.data?.codigo;

    this.inventarioService.GetInventario(this.id).subscribe(x=> {
      this.model = x;
      console.log(this.model);
    });

  }  

  save(){

    this.confirmationService.confirm({
      message: '¿Estás seguro que deseas extraer pallet?',
      header: 'Confirmación de ajuste',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log(this.model)
        this.inventarioService.extraer_inventario(this.model).subscribe(resp => {
              if(resp.result === 'No se puede extraer')
              {
                //error("No se puede generar una extracción de una paleta con ORS planificadas", "Extraer paleta", {timeOut: 10000 });
                this.ref.close();
              }
              else {
                //success("Se ha generado la nueva paleta: " + resp.result , "Extraer paleta", {timeOut: 10000 });
                this.ref.close();
              }
            }, error => {
          //error(error.error);
          }, () => {
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
