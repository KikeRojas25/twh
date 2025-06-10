import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ClienteService } from '../../_services/cliente.service';

import { carga, OrdenSalida } from '../../despachos/despachos.types';
import { PlanningService } from '../planning.service';
import { AsignarPickerComponent } from '../work-list/AsignarPicker/AsignarPicker.component';
import { AsignarPuertaComponent } from '../work-list/AsignarPuerta/AsignarPuerta.component';

@Component({
  selector: 'app-trabajo-asignado',
  templateUrl: './trabajo-asignado.component.html',
  styleUrls: ['./trabajo-asignado.component.css'],
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
          ConfirmDialogModule,
          MatIcon,
          InputTextModule,
      ],
       providers: [DialogService, MessageService, ConfirmationService],
})
export class TrabajoAsignadoComponent implements OnInit {

 private ordensalidaService = inject(PlanningService);
    private clienteService = inject(ClienteService);
    private router = inject(Router);
    private dialogService = inject(DialogService);
    public authService = inject(AuthService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    cargas: carga[] = [];
    ordenesaux: OrdenSalida[] = [];
    model: any = {};
    el: any[] = [];
    loading = false;

    cols: any[] = [];
    clientes: SelectItem[] = [];
    EstadoId: number;
    selectedRow: carga[];
    selection = new SelectionModel<carga>(true, []);

    ref: DynamicDialogRef | undefined;

    ngOnInit(): void {
        this.inicializarColumnas();
        this.cargarPropietarios();
    }
    private inicializarColumnas(): void {
        this.cols = [
            { header: 'ACCIONES', field: 'workNum', width: '160px' },
            { header: 'Almacén', field: 'almacen', width: '150px' },
            { header: 'Propietario', field: 'propietario', width: '160px' },
            { header: 'N° Trabajo', field: 'workNum', width: '120px' },
            { header: 'Orden Salida', field: 'numOrden', width: '160px' },
            { header: 'Guía Remisión', field: 'guiaRemision', width: '160px' },
            { header: '# Pallets', field: 'cantidadLPN', width: '100px' },
            { header: '# Bultos', field: 'cantidadTotal', width: '100px' },
            { header: 'Estado', field: 'estado', width: '120px' },
            { header: 'Operador', field: 'operador', width: '120px' },
        ];
    }

    private cargarPropietarios(): void {
        this.clienteService.getAllPropietarios('').subscribe({
            next: (resp) => {
                this.clientes = resp.map((el) => ({
                    value: el.id,
                    label: el.razonSocial,
                }));
            },
            error: (err) => {
                console.error('Error al cargar propietarios:', err);
            },
            complete: () => {
                const storedId = localStorage.getItem('PropietarioId');

                if (storedId) {
                    this.model.PropietarioId = Number(storedId);
                } else {
                    this.model.PropietarioId = this.clientes[0].value;
                }

                this.buscar();
            },
        });
    }

    checkSelects(): boolean {
        return this.selection.selected.length === 0;
    }

    verPdf(id: any): void {
        this.abrirReporte(id, 'pdf');
    }

    verExcel(id: any): void {
        this.abrirReporte(id, 'excel');
    }

    abrirReporte(id: any, tipo: 'pdf' | 'excel'): void {
        const pid = this.model.PropietarioId;
        const isPdf = tipo === 'pdf' ? '1' : '0';
        let baseUrl = 'http://104.36.166.65/reptwh';

        let endpoint = 'reportepicking.aspx';

        if (pid === 47) {
            endpoint = 'reportePickingEulen.aspx';
        } else if ([64, 67, 68, 69, 70, 71, 72, 74].includes(pid)) {
            endpoint = 'reportepickingPalmas.aspx';
        } else if ([59, 82].includes(pid)) {
            endpoint = 'reportePickingPalmasPT.aspx';
        } else if (pid === 134) {
            endpoint = 'repPickingDAP.aspx';
        } else if (pid === 45) {
            endpoint = 'repPickingDAP.aspx';
        }
     
        

        const url = `${baseUrl}/${endpoint}?id=${id}&pdf=${isPdf}`;
        window.open(url, '_blank');
    }

    eliminar(id: number): void {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que deseas eliminar esta planificación?',
            header: 'Confirmación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.loading = true;
                this.ordensalidaService.deletePlanificacion(id).subscribe({
                    next: () => {
                        this.buscar();
                    },
                    error: (err) => {
                        console.error('Error al eliminar:', err);
                        this.loading = false;
                    },
                    complete: () => {
                        this.loading = false;
                    },
                });
            },
        });
    }

    asignarPuerta(): void {
        if (!this.selectedRow || this.selectedRow.length !== 1) {
            this.selectedRow = null;
            return;
        }

        const ref = this.dialogService.open(AsignarPuertaComponent, {
            header: 'Asignar Puerta',
            width: '700px',
            height: '450px',
            data: { codigo: this.selectedRow, descripcion: '' },
            closable: true,
        });

        ref.onClose.subscribe((resultado) => {
            if (resultado === true) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'La puerta fue asignada correctamente.',
                });
                this.buscar();
            } else if (resultado?.error) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo asignar la puerta.',
                });
            }
        });
    }

    asignarTrabajador(): void {
        if (!this.selectedRow || this.selectedRow.length !== 1) {
            this.selectedRow = null;
            return;
        }

        const ref = this.dialogService.open(AsignarPickerComponent, {
            width: '400px',
            height: '300px',
            header: 'Asignar Responsable de Picking',
            closable: true,
            data: { codigo: this.selectedRow, descripcion: '' },
        });

        ref.onClose.subscribe((resultado) => {
            if (resultado === true) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'El trabajador fue asignado correctamente.',
                });
                this.buscar();
            } else if (resultado?.error) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo asignar.',
                });
            }
        });
    }

    iniciar(): void {
        if (!this.selectedRow || this.selectedRow.length !== 1) {
            this.selectedRow = null;
            return;
        }

        const row = this.selectedRow[0];

        if (!row.usuarioId || !row.destinoId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Asignación incompleta',
                detail: 'Debe asignar un trabajador y una puerta antes de iniciar.',
            });
            return;
        }

        this.confirmationService.confirm({
            acceptLabel: 'Iniciar', // Texto del botón "Aceptar"
            rejectLabel: 'Cancelar', // Texto del botón "Rechazar"
            acceptIcon: 'pi pi-check', // Icono del botón "Aceptar"
            rejectIcon: 'pi pi-times', // Icono del botón "Rechazar"
            message: '¿Está seguro que desea iniciar este Trabajo?',
            header: 'Confirmar Guardado',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (!this.selectedRow || this.selectedRow.length !== 1) {
                    this.selectedRow = null;
                    return;
                }

                this.ordensalidaService
                    .InicioPicking(this.selectedRow[0].id.toString())
                    .subscribe(() => {
                        this.buscar();

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'El trabajo ha iniciado correctamente.',
                        });
                    });
            },
            reject: () => {},
        });
    }

    finalizar(): void {
        if (!this.selectedRow || this.selectedRow.length !== 1) {
            this.selectedRow = null;
            return;
        }

        console.log('selectedRow', this.selectedRow);

        const row = this.selectedRow[0];



        this.confirmationService.confirm({
            acceptLabel: 'Validar', // Texto del botón "Aceptar"
            rejectLabel: 'Cancelar', // Texto del botón "Rechazar"
            acceptIcon: 'pi pi-check', // Icono del botón "Aceptar"
            rejectIcon: 'pi pi-times', // Icono del botón "Rechazar"
            message: '¿Está seguro que desea validar este picking?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {



       //error("Vuelva a programar la ORS");

                this.ordensalidaService
                    .movimientoSalidaMasiva(this.selectedRow[0].id)
                    .subscribe(() => {
                        this.buscar();

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'El trabajo ha finalizado correctamente.',
                        });
                    });
            },
            reject: () => {},
        });
    }

    buscar(): void {
        this.cargas = [];
        this.selectedRow = null;

     
        this.ordensalidaService.getAllWork_Asignado(this.model).subscribe({
            next: (list) => {
                this.cargas = list;
                console.log('model', this.cargas);
            },
            error: (err) => {
                console.error('Error al obtener órdenes de salida:', err);
                // Opcional: mostrar mensaje con Toastr o PrimeNG toast
            },
        });
    }
}

