import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import {
  NotificacionCorreoDto,
  NotificacionEventoDto,
  NotificacionService,
  PropietarioNotificacionDto,
} from '../../../_services/notificacion.service';

@Component({
  selector: 'app-notificaciones-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputSwitchModule,
    InputTextModule,
    TabViewModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './notificaciones-dialog.component.html',
  styleUrl: './notificaciones-dialog.component.scss',
})
export class NotificacionesDialogComponent implements OnInit {
  propietarioId!: number;
  propietarioNombre = '';

  cargando = false;
  guardandoEvento = new Set<number>();
  agregandoCorreo = false;

  data?: PropietarioNotificacionDto;
  nuevoCorreo: { Propietario: string; Ejecutivo: string } = { Propietario: '', Ejecutivo: '' };

  constructor(
    private notificacionService: NotificacionService,
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.propietarioId = this.config.data?.propietarioId;
    this.propietarioNombre = this.config.data?.propietarioNombre ?? '';
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.notificacionService.getConfigPropietario(this.propietarioId).subscribe({
      next: (data) => {
        this.data = data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la configuración de notificaciones.',
        });
      },
    });
  }

  correosPorTipo(tipo: 'Propietario' | 'Ejecutivo'): NotificacionCorreoDto[] {
    return (this.data?.correos ?? []).filter((c) => c.tipo === tipo);
  }

  onToggleEvento(evento: NotificacionEventoDto) {
    if (!this.data) return;
    const nuevoEstado = evento.suscrito;
    this.guardandoEvento.add(evento.id);
    this.notificacionService.toggleEvento(this.propietarioId, evento.id, nuevoEstado).subscribe({
      next: () => {
        this.guardandoEvento.delete(evento.id);
      },
      error: (err) => {
        evento.suscrito = !nuevoEstado; // revertir
        this.guardandoEvento.delete(evento.id);
        const msg = err?.error?.message || 'No se pudo guardar el cambio.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  agregarCorreo(tipo: 'Propietario' | 'Ejecutivo') {
    const correo = (this.nuevoCorreo[tipo] || '').trim();
    if (!correo) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Correo inválido',
        detail: 'Verifica el formato del correo.',
      });
      return;
    }

    this.agregandoCorreo = true;
    this.notificacionService.agregarCorreo(this.propietarioId, tipo, correo).subscribe({
      next: ({ id }) => {
        this.data?.correos.push({ id, tipo, correo });
        this.nuevoCorreo[tipo] = '';
        this.agregandoCorreo = false;
      },
      error: (err) => {
        this.agregandoCorreo = false;
        const msg = err?.error?.message || 'No se pudo agregar el correo.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  eliminarCorreo(correo: NotificacionCorreoDto) {
    this.confirmationService.confirm({
      header: 'Eliminar correo',
      message: `¿Eliminar "${correo.correo}" de las notificaciones?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.notificacionService.eliminarCorreo(correo.id).subscribe({
          next: () => {
            if (this.data) {
              this.data.correos = this.data.correos.filter((c) => c.id !== correo.id);
            }
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo eliminar el correo.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
      },
    });
  }

  cerrar() {
    this.ref.close();
  }
}
