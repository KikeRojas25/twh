
import { Component } from '@angular/core';

import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DespachosService } from '../../despachos.service';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';


@Component({
  selector: 'app-modal-update-guia',
  templateUrl: './modal-update-guia.component.html',
  styleUrls: ['./modal-update-guia.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    InputTextModule,
    ButtonModule,
    InputNumberModule
  ]
})
export class ModalUpdateGuiaComponent  {

  public loading = false;
  model: any = {};
  estados: SelectItem[] = [];
  visible_motivo = false;
  visible_tipo = false;
  visible_area = false;


  tipo: SelectItem[] = [
    {value: 204, label: 'Origen'},
    {value: 205, label: 'Operación'},
  ];


  area: SelectItem[] = [
    {value: 206, label: 'Recepción'},
    {value: 207, label: 'Almacenamiento'},
    {value: 208, label: 'Despacho'},
  ];


  motivo: SelectItem[] = [
    {value: 198, label: 'Transporte'},
    {value: 199, label: 'Contaminación'},
    {value: 200, label: 'Daño por uña de montacarga'},
    {value: 201, label: 'Mal apilamiento'},
    {value: 202, label: 'Repaletizado'},
    {value: 203, label: 'Caída del producto'},
  ];

  constructor(
    private ordenSalidaService: DespachosService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private confirmationService: ConfirmationService,
    private messageService: MessageService

  ) {

      this.model.ids =  this.config.data.codigo;
    }
    onNoClick(): void {
    this.ref.close();
  }



  guardar() {



    this.confirmationService.confirm({
      acceptLabel: 'Guardar',                   // Texto del botón "Aceptar"
      rejectLabel: 'Cancelar',                  // Texto del botón "Rechazar"
      acceptIcon: 'pi pi-check',                // Icono del botón "Aceptar"
      rejectIcon: 'pi pi-times',                // Icono del botón "Rechazar"
      message: '¿Está seguro que desea asignar este vehículo?',
      header: 'Confirmar Guardado',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {

    if( this.model.guiaremision === undefined || this.model.guiaremision.trim() === '' ) {
      //warning('Debe ingresar un número de guía de remisión');
      return;
    }


    this.ordenSalidaService.UpdateGuiasxShipmentIs(this.model).subscribe(resp => {


      this.messageService.add({severity:'success', summary:'Guía Actualizada', detail:'La guía se ha registrado correctamente'});
      this.ref?.close();
    });

    } ,
  reject: () => {
  }
  }); 

  }
  cancelar() {
    this.ref.close();
  }

}

