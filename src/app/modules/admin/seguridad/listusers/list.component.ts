import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { SeguridadService } from '../seguridad.service';
import { NewUserComponent } from './new/new-user.component';
import { EditUserComponent } from './edit/edit-user.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { RolesModalComponent } from './roles/roles-modal.component';

@Component({
  selector: 'app-list-users',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    DialogModule,
    DynamicDialogModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    CheckboxModule,
    MatIcon,
  ],
  providers: [DialogService, MessageService, ConfirmationService]
})
export class ListUsersComponent implements OnInit {

  usuarios: any[] = [];
  cargando = false;
  busqueda = '';
  mostrarBloqueados = false;
  ref: DynamicDialogRef | undefined;

  constructor(
    private seguridadService: SeguridadService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.cargando = true;
    this.seguridadService.getAll().subscribe({
      next: (data) => {
        let lista = data || [];
        if (!this.mostrarBloqueados) {
          lista = lista.filter((u: any) => (u.estadoId || u.EstadoId) === 1);
        }
        if (this.busqueda.trim()) {
          const q = this.busqueda.trim().toLowerCase();
          lista = lista.filter((u: any) =>
            (u.nombreCompleto || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.dni || '').toLowerCase().includes(q)
          );
        }
        this.usuarios = lista;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios.' });
      },
      complete: () => { this.cargando = false; }
    });
  }

  nuevo() {
    this.ref = this.dialogService.open(NewUserComponent, {
      header: 'Nuevo usuario',
      width: '550px',
      data: {}
    });
    this.ref.onClose.subscribe((result) => {
      if (!result) return;
      if (result.ok) {
        this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Usuario creado correctamente.' });
        this.buscar();
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: result.error || 'No se pudo crear el usuario.' });
      }
    });
  }

  editar(id: number) {
    this.ref = this.dialogService.open(EditUserComponent, {
      header: 'Editar usuario',
      width: '550px',
      data: { id }
    });
    this.ref.onClose.subscribe((result) => {
      if (!result) return;
      if (result.ok) {
        this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Usuario actualizado correctamente.' });
        this.buscar();
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: result.error || 'No se pudo actualizar el usuario.' });
      }
    });
  }

  gestionarRoles(usuario: any) {
    this.ref = this.dialogService.open(RolesModalComponent, {
      header: 'Gestión de roles',
      width: '750px',
      data: {
        id: usuario.id || usuario.Id,
        nombreCompleto: usuario.nombreCompleto || usuario.NombreCompleto
      }
    });
    this.ref.onClose.subscribe((result) => {
      if (!result) return;
      if (result.ok) {
        this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Roles actualizados correctamente.' });
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: result.error || 'No se pudieron guardar los roles.' });
      }
    });
  }

  cambiarPassword(usuario: any) {
    this.ref = this.dialogService.open(ChangePasswordComponent, {
      header: 'Cambiar contraseña',
      width: '480px',
      data: {
        id: usuario.id || usuario.Id,
        nombreCompleto: usuario.nombreCompleto || usuario.NombreCompleto
      }
    });
    this.ref.onClose.subscribe((result) => {
      if (!result) return;
      if (result.ok) {
        this.messageService.add({ severity: 'success', summary: 'TWH', detail: result.message || 'Contraseña actualizada correctamente.' });
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: result.error || 'No se pudo cambiar la contraseña.' });
      }
    });
  }

  toggleEstado(usuario: any) {
    const id = usuario.id || usuario.Id;
    const nombre = usuario.nombreCompleto || usuario.NombreCompleto;
    const esActivo = (usuario.estadoId || usuario.EstadoId) === 1;
    const accion = esActivo ? 'bloquear' : 'activar';

    this.confirmationService.confirm({
      message: `¿Está seguro que desea ${accion} al usuario <strong>${nombre}</strong>?`,
      header: esActivo ? 'Bloquear usuario' : 'Activar usuario',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: `Sí, ${accion}`,
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: esActivo ? 'p-button-danger' : 'p-button-success',
      accept: () => {
        this.seguridadService.toggleEstado(id).subscribe({
          next: (res) => {
            this.messageService.add({ severity: 'success', summary: 'TWH', detail: res?.message || `Usuario ${accion === 'bloquear' ? 'bloqueado' : 'activado'} correctamente.` });
            this.buscar();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al cambiar el estado.' });
          }
        });
      }
    });
  }

  getEstadoClass(estadoId: number): string {
    return estadoId === 1
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
  }

  getEstadoLabel(estadoId: number): string {
    return estadoId === 1 ? 'Activo' : 'Bloqueado';
  }
}
