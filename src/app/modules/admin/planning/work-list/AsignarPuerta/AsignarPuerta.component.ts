import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { Component, inject, isStandalone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogComponent, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Ubicacion } from '../../planning.types';
import { GeneralService } from 'app/modules/admin/_services/general.service';
import { AuthService } from 'app/core/auth/auth.service';
import { PlanningService } from '../../planning.service';


@Component({
  selector: 'app-AsignarPuerta',
  templateUrl: './AsignarPuerta.component.html',
  styleUrls: ['./AsignarPuerta.component.css'],
  standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      RouterModule,
      MatDialogModule,
      TableModule,
      DropdownModule,
      ButtonModule,
      ToastModule,
      CalendarModule,
      ConfirmDialogModule
    ],
    providers: [
        DialogService,
        MessageService,
        ConfirmationService
      ]
})
export class AsignarPuertaComponent implements OnInit {

  listData: Ubicacion[] = [];
  loading = false;
  searchKey: string = '';
  model: any;
  visible: boolean = true;
  private messageService= inject(MessageService);
  
  instance: DynamicDialogComponent | undefined;

    constructor(public ref: DynamicDialogRef, 
             public config: DynamicDialogConfig, // ✅ Aquí accedes a los datos
                private planningService: PlanningService,
                private   generalService : GeneralService ,  
                private dialogService: DialogService) {

          this.model = config.data.codigo; // ✅ ESTA ES LA FORMA CORRECTA


  }


  ngOnInit(): void {
    this.getUbicaciones();
  }

  getUbicaciones(): void {
    const almacenId = this.model[0].almacenId;

    this.generalService.getPuertas(almacenId, 1).subscribe(list => {
      this.listData = list;

      console.log('' ,  this.listData);

    });
  }

  asignarPuerta(id: number): void {
    const ids =  this.model.map(e => e.id).join(',');



    this.planningService.assignmentOfDoor(ids, id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Asignación exitosa',
            detail: 'La puerta fue asignada correctamente.'
          });

          // 🔑 Cerramos el diálogo y devolvemos "true"
          this.ref.close(true);
        },
        error: (err) => {
          console.error('Error en asignación:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo asignar la puerta.'
          });
        }
      });


  }



}
