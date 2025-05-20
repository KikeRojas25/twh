import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { SelectItem, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { JwtHelperService } from '@auth0/angular-jwt';
import { GeneralService } from '../../../_services/general.service';

import { InputTextareaModule } from 'primeng/inputtextarea';
import moment from 'moment';
import { InventarioService } from 'app/modules/admin/_services/inventario.service';

@Component({
  selector: 'app-ajustestock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    DropdownModule,
    InputTextareaModule
  ],
  providers: [ConfirmationService],
  templateUrl: './ajustestock.component.html',
  styleUrl: './ajustestock.component.scss'
})
export class AjustestockComponent implements OnInit{

  model: any = [];
  id: number;
  motivos: SelectItem[] = [];
  tipo: SelectItem[] = [];
  jwtHelper = new JwtHelperService();
  decodedToken: any = {};
  form: FormGroup;

  constructor(
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private confirmationService: ConfirmationService,
    private generalService: GeneralService,
    private inventarioService: InventarioService,
  ){}

  ngOnInit() : void{

    this.id =  this.config.data?.id;
    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);

    this.generalService.getValorTabla(40).subscribe( resp =>
    {
      resp.forEach(element => {
          this.motivos.push({
          value: element.id ,
          label: element.valorPrincipal
        });
      })
    });

    this.inventarioService.GetInventario(this.id).subscribe(x=> {
      this.model = x;
      if(x.fechaExpire !== null)
      this.model.fechaExpire   = moment(new Date(x.fechaExpire).toLocaleString(), 'DD/MM/YYYY').toDate()  ;
      else  this.model.fechaExpire = null;

      if(x.fechaManufactura !== null)
      this.model.fechaManufactura   = moment(new Date(x.fechaManufactura).toLocaleString(), 'DD/MM/YYYY').toDate()  ;
      else this.model.fechaManufactura = null;
    });
  }

  close(){
    this.ref?.close();
  }

  save(){

    this.model.idusuarioajuste =   this.decodedToken.nameid;
    console.log(this.model.observacion);

    if(this.model.motivoid === undefined || this.model.observacion === undefined
      || this.model.cantidad === undefined)
    {
      return;
    }

    this.confirmationService.confirm({
        message: '¿Estás seguro que deseas ajustar el stock?',
        header: 'Confirmación de ajuste',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.inventarioService.SolicitarActualizarStock(this.model).subscribe(resp => {
            if(resp === false)
            {
                //error( 'No se actualizó de manera correcta, verique que tenga stock para ejecutar este cambio.'
              //   ,'Ajuste de Inventario'
              // , {
              //   closeButton: true
              // });
            }
            else {
                    //success( 'Se ha enviado la solicitud de manera correcta'
                //   ,'Ajuste de Inventario'
                // , {
                //   closeButton: true
                // });
                  return;
            }
          }, error => {

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

}
