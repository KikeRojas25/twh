import { Component } from '@angular/core';

import { environment } from 'environments/environment';

import { ConfirmationService, MessageService } from 'primeng/api';

import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { DespachosService } from '../../despachos.service';

import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';

import { ButtonModule } from 'primeng/button';

import { InputNumberModule } from 'primeng/inputnumber';

import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { CommonModule } from '@angular/common';

interface UpdateGuiaModel {

  ids?: string;

  guiaremision?: string;

  cantidadBultos?: number;

  Items?: number;

  telefono?: string;

  contacto?: string;

}

interface UpdateGuiaDataToSend {

  ids: string;

  guiaremision?: string;

  cantidadBultos?: number;

  Items?: number;

  telefono?: string;

  contacto?: string;

}

@Component({

  selector: 'app-modal-update-guia',

  templateUrl: './modal-update-guia.component.html',

  styleUrls: ['./modal-update-guia.component.scss'],

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    InputTextModule,

    ButtonModule,

    InputNumberModule,

    ProgressSpinnerModule

  ]

})

export class ModalUpdateGuiaComponent  {

  public loading = false;

  model: UpdateGuiaModel = {};

  constructor(

    private ordenSalidaService: DespachosService,

    public ref: DynamicDialogRef,

    public config: DynamicDialogConfig,

    private confirmationService: ConfirmationService,

    private messageService: MessageService

  ) {

    this.model.ids = this.config.data.codigo;

  }

  guardar(): void {

    this.confirmationService.confirm({

      acceptLabel: 'Guardar',

      rejectLabel: 'Cancelar',

      acceptIcon: 'pi pi-check',

      rejectIcon: 'pi pi-times',

      message: '¿Está seguro que desea guardar esta información?',

      header: 'Confirmar Guardado',

      icon: 'pi pi-exclamation-triangle',

      accept: () => {

        // Validar que al menos haya un campo para actualizar

        const hasGuia = this.model.guiaremision && this.model.guiaremision.trim() !== '';

        const hasBultos = this.model.cantidadBultos !== undefined && this.model.cantidadBultos !== null;

        const hasItems = this.model.Items !== undefined && this.model.Items !== null;

        const hasTelefono = this.model.telefono && this.model.telefono.trim() !== '';

        const hasContacto = this.model.contacto && this.model.contacto.trim() !== '';

        if (!hasGuia && !hasBultos && !hasItems && !hasTelefono && !hasContacto) {

          this.messageService.add({

            severity: 'warn',

            summary: 'Validación',

            detail: 'Debe ingresar al menos un campo para actualizar'

          });

          return;

        }

        this.loading = true;

        // Preparar el objeto a enviar - solo incluir campos que tengan valor

        const dataToSend: UpdateGuiaDataToSend = {

          ids: this.model.ids || ''

        };

        if (hasGuia) {

          dataToSend.guiaremision = this.model.guiaremision;

        }

        if (hasBultos) {

          dataToSend.cantidadBultos = this.model.cantidadBultos;

        }

        if (hasItems) {

          dataToSend.Items = this.model.Items;

        }

        if (hasTelefono) {

          dataToSend.telefono = this.model.telefono;

        }

        if (hasContacto) {

          dataToSend.contacto = this.model.contacto;

        }

        // Solo mostrar logs en desarrollo

        if (!environment.production) {

          console.log('Datos a enviar:', dataToSend);

        }

        this.ordenSalidaService.UpdateGuiasForOrdenesSalida(dataToSend).subscribe({

          next: (resp) => {

            this.loading = false;

            if (!environment.production) {

              console.log('Respuesta del servidor:', resp);

            }

            this.messageService.add({

              severity: 'success',

              summary: 'Guía Actualizada',

              detail: 'La información se ha actualizado correctamente'

            });

            this.ref?.close(true);

          },

          error: (error) => {

            this.loading = false;

            console.error('Error al actualizar guía:', error);

            const errorMessage = error.error?.message || error.message || 'Error al actualizar la información. Por favor, intente nuevamente.';

            this.messageService.add({

              severity: 'error',

              summary: 'Error',

              detail: errorMessage

            });

          }

        });

      },

      reject: () => {

        // Usuario canceló la acción

      }

    });

  }

  cancelar(): void {

    this.ref.close();

  }

}
