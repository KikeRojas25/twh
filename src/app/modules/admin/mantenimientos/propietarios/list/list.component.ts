import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { PropietarioService } from '../../../_services/propietario.service';
import { NewPropietarioComponent } from '../new/new.component';
import { EditPropietarioComponent } from '../edit/edit.component';

@Component({
  selector: 'app-list-propietarios',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [
    InputTextModule,
    DropdownModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    TableModule,
    CommonModule,
    DialogModule,
    DynamicDialogModule,
    ToastModule,
    ConfirmDialogModule,
    MatIcon,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ]
})
export class ListPropietariosComponent implements OnInit {

  propietarios: any[] = [];
  model: any = {};
  mostrarInactivos = false;
  cargando = false;
  ref: DynamicDialogRef | undefined;

  constructor(
    private propietarioService: PropietarioService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.buscar();
  }

  onToggleInactivos() {
    this.buscar();
  }

  buscar() {
    this.cargando = true;

    const fuente$ = this.mostrarInactivos
      ? this.propietarioService.getInactivosPropietarios()
      : this.propietarioService.getAllPropietarios();

    fuente$.subscribe({
      next: (data) => {
        let filtrados = data || [];

        if (this.model.busqueda && this.model.busqueda.trim()) {
          const busqueda = this.model.busqueda.trim().toLowerCase();
          filtrados = filtrados.filter((p: any) => {
            const razonSocial = (p.razonSocial || '').toLowerCase();
            const nombreCorto = (p.nombreCorto || '').toLowerCase();
            const documento = (p.documento || '').toString().toLowerCase();

            return razonSocial.includes(busqueda) ||
                   nombreCorto.includes(busqueda) ||
                   documento.includes(busqueda);
          });
        }

        this.propietarios = filtrados;
      },
      error: (err) => {
        console.error('Error al cargar propietarios', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los propietarios'
        });
      },
      complete: () => {
        this.cargando = false;
      }
    });
  }

  nuevo() {
    this.ref = this.dialogService.open(NewPropietarioComponent, {
      header: 'Nuevo Propietario',
      width: '600px',
      data: {}
    });

    this.ref.onClose.subscribe((guardado) => {
      if (guardado) {
        this.buscar();
      }
    });
  }

  editar(id: number) {
    this.ref = this.dialogService.open(EditPropietarioComponent, {
      header: 'Editar Propietario',
      width: '600px',
      data: { propietarioId: id }
    });

    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscar();
      }
    });
  }

  eliminar(id: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea inactivar el propietario?',
      header: 'Inactivar',
      icon: 'pi pi-ban',
      acceptLabel: 'Sí, inactivar',
      accept: () => {
        this.propietarioService.eliminarPropietario(id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'info',
              summary: 'Propietario inactivado',
              detail: res?.message || 'El propietario ha sido inactivado correctamente'
            });
            this.buscar();
          },
          error: (err) => {
            console.error('Error al inactivar propietario:', err);
            const mensaje = err.error?.message || err.error?.error || 'Error al inactivar propietario';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: mensaje
            });
          }
        });
      }
    });
  }

  reactivar(id: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea reactivar el propietario?',
      header: 'Reactivar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, reactivar',
      accept: () => {
        this.propietarioService.reactivarPropietario(id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Reactivación exitosa',
              detail: res?.message || 'El propietario se ha reactivado correctamente'
            });
            this.buscar();
          },
          error: (err) => {
            console.error('Error al reactivar propietario:', err);
            const mensaje = err.error?.message || err.error?.error || 'Error al reactivar propietario';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: mensaje
            });
          }
        });
      }
    });
  }
}
