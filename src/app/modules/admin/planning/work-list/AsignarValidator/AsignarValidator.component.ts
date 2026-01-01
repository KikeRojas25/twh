import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { PlanningService } from '../../planning.service';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-AsignarValidator',
  templateUrl: './AsignarValidator.component.html',
  styleUrls: ['./AsignarValidator.component.css'],
  standalone : true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DropdownModule , ButtonModule],
  providers: [UserService, PlanningService]
})
export class AsignarValidatorComponent implements OnInit {
  usuarios: User[] = [];
  usuarioSeleccionado: User | null = null;

  constructor(
     private userService: UserService,
     private planningService: PlanningService,
     public ref: DynamicDialogRef,
     public config: DynamicDialogConfig
  ) { }

  ngOnInit() {

 this.userService.getUsersForRol([6,29]).subscribe({
      next: (res) => (this.usuarios = res),
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }


  asignar(): void {
    if (!this.usuarioSeleccionado) return;

    const ids = this.config.data.codigo.map(e => e.id).join(',');

    this.planningService.assignmentOfUserValidator(ids, this.usuarioSeleccionado.id).subscribe({
      next: () => {
        // puedes retornar datos al cerrar
        this.ref.close(true);
      },
      error: (err) => {
        console.error('Error al asignar', err);
      }
    });
  }
   cancelar(): void {
    this.ref.close(false);
  }


}

