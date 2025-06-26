import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';

import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageModule } from 'primeng/message';
import { NewComponent } from '../new/new.component';
import { EditComponent } from '../edit/edit.component';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TransporteService } from '../../transporte.service';
import { GeneralService } from 'app/modules/admin/_services/general.service';
import { ClienteService } from 'app/modules/admin/_services/cliente.service';
import { TarifarioService } from '../tarifario.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [
    MatIcon,
    TableModule,
    ToastModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule
  ],
  providers: [
      MessageService,
      DialogService,
      MessageService,
      ConfirmationService
    ]
})
export class ListComponent implements OnInit {
  ref: DynamicDialogRef | undefined;
  tarifas: any[];
  cols: any[];

  constructor(
    private tarifarioService: TarifarioService,
    private messageService: MessageService,
    private generalService: GeneralService,
    public dialogService: DialogService,
    private clienteService: ClienteService,
    private confirmationService: ConfirmationService) { }

  ngOnInit() {

    this.cols = [
      { field: 'tipo', header: 'Acciones',  width: '20%' },
      { field: 'id', header: 'ID',  width: '10%'},
      { field: 'razon_social', header: 'Razón Social' ,  width: '40%'},
      { field: 'ruc', header: 'RUC' ,  width: '40%'},
      { field: 'idprovincia_destino', header: 'Provincia Destino' ,  width: '40%'},
      { field: 'iddistrito_destino', header: 'Distrito Destino' ,  width: '40%'},
      { field: 'idtipounidad', header: 'Tipo Unidad' ,  width: '40%'},
      { field: 'tarifa', header: 'Tarifa' ,  width: '40%'},
   
    ];

    this.load();
  }

  load() {
    this.tarifarioService.listarPorProveedor(0 ).subscribe(resp => {
      this.tarifas = resp;
      console.log(this.tarifas)
    });
  }

  buscar() {

    this.load();
  }


  nuevo() {
      this.ref = this.dialogService.open(NewComponent, {
        header: 'Nueva Tarifa',
        width: '50%', // Tamaño opcional del diálogo
        closable: true, // Habilitar cierre
        modal: true, // Modalidad
        dismissableMask: true, // Permitir cierre al hacer clic fuera
        data: {}, // Puedes pasar datos iniciales si los necesitas
      });
    
      // Manejar el evento de cierre del diálogo
      this.ref.onClose.subscribe((result) => {
        if (result) {
          console.log('Datos del formulario recibidos:', result);
          this.messageService.add({ severity: 'success', summary: 'Mantenimiento de clientes', detail: 'Se ha registrado al cliente de manera correcta.' });
          this.load();
        }
      });
  }

  editar(id: number){
    this.ref = this.dialogService.open(EditComponent, {
      header: 'Actualizar Tarifa',
      width: '50%', // Tamaño opcional del diálogo
      closable: true, // Habilitar cierre
      modal: true, // Modalidad
      dismissableMask: true, // Permitir cierre al hacer clic fuera
      data: {tarifaid:id}, // Puedes pasar datos iniciales si los necesitas
    });
  
    // Manejar el evento de cierre del diálogo
    this.ref.onClose.subscribe((result) => {
      if (result) {
        console.log('Datos del formulario recibidos:', result);
        this.messageService.add({ severity: 'success', summary: 'Mantenimiento de tarifario', detail: 'Se ha registrado el tarifario de manera correcta.' });
        this.load();
      }
    });
  }

  eliminar(id: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar la tarifa?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
      console.log(id)
      this.tarifarioService.eliminar(id).subscribe({
        next: (res) => {      

          this.messageService.add({ severity: 'success', summary: 'Mantenimiento de Tarifario', detail: 'Se ha el tarifario de manera correcta.' });
          this.load(); // refresca la lista
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          alert('Error al eliminar el tarifa');
        }
      });
     },
      reject: () => {
    
      }
    });
  }

}
