import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import * as FileSaver from 'file-saver';
import { Subject, takeUntil } from 'rxjs';
import { ClienteService } from '../../_services/cliente.service';
import { OrdenSalida, carga } from '../../despachos/despachos.types';
import { PlanningService } from '../planning.service';
import { AsignarPickerComponent } from './AsignarPicker/AsignarPicker.component';
import { AsignarPuertaComponent } from './AsignarPuerta/AsignarPuerta.component';
import { PropietarioService } from '../../_services/propietario.service';
import { ReportesService } from '../../reportes/reportes.service';
import { WrkProgressService } from 'app/core/wrk-progress/wrk-progress.service';

@Component({
    selector: 'app-work-list',
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
    templateUrl: './work-list.component.html',
    styleUrl: './work-list.component.scss',
    providers: [DialogService, MessageService, ConfirmationService],
})
export class WorkListComponent {
    private ordensalidaService = inject(PlanningService);
    private reportesService = inject(ReportesService);
    private propietarioService = inject(PropietarioService);
    private router = inject(Router);
    private dialogService = inject(DialogService);
    public authService = inject(AuthService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private wrkProgress = inject(WrkProgressService);
    private _destroy$ = new Subject<void>();

    cargas: carga[] = [];
    ordenesaux: OrdenSalida[] = [];
    model: any = {};
    el: any[] = [];
    loading = false;

    cols: any[] = [];
    clientes: SelectItem[] = [];
    EstadoId: number;
    selectedRow: carga | null = null;
    selection = new SelectionModel<carga>(true, []);

    /** Avance por wrkId — se actualiza en VIVO via SignalR (wrk-progress hub).
     *  Polling cada 60s como fallback por si se cae la conexión. */
    avancePorWrk: Map<number, { porcentaje: number; picado: number; total: number; lineasCerradas: number; lineasTotal: number }> = new Map();
    private _pollHandle: any = null;
    private readonly _pollIntervalMs = 60_000; // fallback cuando SignalR está down

    ref: DynamicDialogRef | undefined;

    ngOnInit(): void {
        this.inicializarColumnas();
        this.cargarPropietarios();
        this._suscribirSignalR();
        this._iniciarPolling();
    }

    ngOnDestroy(): void {
        this._detenerPolling();
        this._destroy$.next();
        this._destroy$.complete();
    }

    private async _suscribirSignalR(): Promise<void> {
        await this.wrkProgress.ensureConnected();
        this.wrkProgress.avance$
            .pipe(takeUntil(this._destroy$))
            .subscribe((ev) => {
                // Actualizar in-place. Si la wrk no está en la lista visible, lo ignoramos
                // (se rehidratará al próximo buscar()).
                const exists = (this.cargas ?? []).some(c => c.id === ev.wrkId);
                if (!exists) return;
                const nuevo = new Map(this.avancePorWrk);
                nuevo.set(ev.wrkId, {
                    porcentaje: ev.porcentaje,
                    picado: ev.picadoUnidades,
                    total: ev.totalUnidades,
                    lineasCerradas: ev.lineasCerradas,
                    lineasTotal: ev.lineasTotal,
                });
                this.avancePorWrk = nuevo;
            });
    }

    private _iniciarPolling(): void {
        this._detenerPolling();
        this._pollHandle = setInterval(() => this._refrescarAvances(), this._pollIntervalMs);
    }

    private _detenerPolling(): void {
        if (this._pollHandle) {
            clearInterval(this._pollHandle);
            this._pollHandle = null;
        }
    }

    private _refrescarAvances(): void {
        const ids = (this.cargas ?? []).map(c => c.id).filter(id => !!id);
        if (ids.length === 0) return;
        this.ordensalidaService.getWorksAvance(ids).subscribe({
            next: (list) => {
                const nuevo = new Map<number, any>();
                for (const a of list ?? []) {
                    nuevo.set(a.wrkId ?? a.WrkId, {
                        porcentaje: a.porcentaje ?? a.Porcentaje ?? 0,
                        picado: a.picadoUnidades ?? a.PicadoUnidades ?? 0,
                        total: a.totalUnidades ?? a.TotalUnidades ?? 0,
                        lineasCerradas: a.lineasCerradas ?? a.LineasCerradas ?? 0,
                        lineasTotal: a.lineasTotal ?? a.LineasTotal ?? 0,
                    });
                }
                this.avancePorWrk = nuevo;
            },
            error: (err) => {
                console.warn('No se pudo refrescar avances:', err);
            },
        });
    }

    /** Lo usa el template para leer el avance de cada fila. */
    avanceDe(id: number) {
        return this.avancePorWrk.get(id) ?? null;
    }
    private inicializarColumnas(): void {
        this.cols = [
            { header: 'ACCIONES', field: 'workNum', width: '160px' },
            { header: 'Almacén', field: 'almacen', width: '150px' },
            { header: 'Propietario', field: 'propietario', width: '160px' },
            { header: 'N° Trabajo', field: 'workNum', width: '120px' },
            { header: 'Orden Salida', field: 'numOrden', width: '160px' },
            { header: 'F. Registro', field: 'fechaRegistro', width: '160px' },
            { header: 'Cliente', field: 'cliente', width: '160px' },
            { header: 'Guía Remisión', field: 'guiaRemision', width: '160px' },
            { header: '# Pallets', field: 'cantidadLPN', width: '100px' },
            { header: '# Bultos', field: 'cantidadTotal', width: '100px' },
            { header: 'Avance', field: 'avance', width: '200px' },
            { header: 'Estado', field: 'estado', width: '120px' },
            { header: 'Operador', field: 'operador', width: '120px' },
        ];
    }

    private cargarPropietarios(): void {
        this.propietarioService.getAllPropietarios().subscribe({
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
        // Selección simple — `selectedRow` es 1 carga o null.
        return !this.selectedRow;
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

        // Para propietarios 125 y 129, el PDF se descarga por API (evita mixed-content).
        if (tipo === 'pdf' && [125, 129,130, 106, 130, 1].includes(Number(pid))) {
            this.reportesService.hojaPickingPdf(id).subscribe({
                next: (res) => {
                    const contentDisposition =
                        res.headers?.get('content-disposition') || res.headers?.get('Content-Disposition');
                    const fileName =
                        this.getFilenameFromContentDisposition(contentDisposition) ?? `HojaPicking_${id}.pdf`;
                    const blob = res.body ?? new Blob([], { type: 'application/pdf' });
                    FileSaver.saveAs(blob, fileName);
                },
                error: (err) => {
                    const fallbackMsg = 'No se pudo descargar la Hoja de Picking (PDF).';

                    if (err?.error instanceof Blob) {
                        err.error
                            .text()
                            .then((t: string) => {
                                try {
                                    const j = JSON.parse(t);
                                    this.messageService.add({
                                        severity: 'error',
                                        summary: 'Error',
                                        detail: j?.message ?? fallbackMsg,
                                    });
                                } catch {
                                    this.messageService.add({
                                        severity: 'error',
                                        summary: 'Error',
                                        detail: fallbackMsg,
                                    });
                                }
                            })
                            .catch(() =>
                                this.messageService.add({ severity: 'error', summary: 'Error', detail: fallbackMsg })
                            );
                        return;
                    }

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err?.error?.message ?? fallbackMsg,
                    });
                },
            });
            return;
        }

        let endpoint = 'reportepicking.aspx';

        if (pid === 47) {
            endpoint = 'reportePickingEulen.aspx';
        } else if ([64, 67, 68, 69, 70, 71, 72, 74].includes(pid)) {
            endpoint = 'reportepickingPalmas.aspx';
        } else if ([59, 82].includes(pid)) {
            endpoint = 'reportePickingPalmasPT.aspx';
       } else if ([145, 100].includes(pid) ) {
            endpoint = 'repPickingDAP.aspx'
        } else if (pid === 134) {
            endpoint = 'repPickingDAP.aspx';
        } else if (pid === 45) {
            endpoint = 'repPickingDAP.aspx';
        }  else if ([44, 103, 106, 130, 1, 125].includes(pid)) {
            endpoint = 'reportePickingPanificadora.aspx';
        }  else if ([148 ,126 ].includes(pid)) {
            endpoint = 'reportePickingLdc.aspx';
        }
     
        
        

        const url = `${baseUrl}/${endpoint}?id=${id}&pdf=${isPdf}`;
        window.open(url, '_blank');
    }

    private getFilenameFromContentDisposition(contentDisposition: string | null): string | null {
        if (!contentDisposition) return null;
        const match = /filename\*?=(?:UTF-8''|")?([^\";]+)"?/i.exec(contentDisposition);
        if (!match?.[1]) return null;
        try {
            return decodeURIComponent(match[1]);
        } catch {
            return match[1];
        }
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
        if (!this.selectedRow) return;

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
        if (!this.selectedRow) return;

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
        if (!this.selectedRow) return;

        const row = this.selectedRow;

        if (!row.usuarioId || !row.destinoId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Asignación incompleta',
                detail: 'Debe asignar un trabajador y una puerta antes de iniciar.',
            });
            return;
        }

        this.confirmationService.confirm({
            acceptLabel: 'Iniciar',
            rejectLabel: 'Cancelar',
            acceptIcon: 'pi pi-check',
            rejectIcon: 'pi pi-times',
            message: '¿Está seguro que desea iniciar este Trabajo?',
            header: 'Confirmar Guardado',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (!this.selectedRow) return;

                this.ordensalidaService
                    .InicioPicking(this.selectedRow.id.toString())
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
        if (!this.selectedRow) return;

        const row = this.selectedRow;

        if (row.estadoId !== 32) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Estado inválido',
                detail: 'No se puede finalizar un trabajo que no ha sido iniciado.',
            });
            return;
        }

        this.confirmationService.confirm({
            acceptLabel: 'Finalizar',
            rejectLabel: 'Cancelar',
            acceptIcon: 'pi pi-check',
            rejectIcon: 'pi pi-times',
            message: '¿Está seguro que desea finalizar este trabajo?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (!this.selectedRow) return;

                this.ordensalidaService
                    .FinPicking(this.selectedRow.id.toString())
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

        this.ordensalidaService.getAllWork(this.model).subscribe({
            next: (list) => {
                this.cargas = list;
                console.log('model', this.cargas);
                // Avance inicial inmediato — el polling se encargará de refrescos posteriores.
                this._refrescarAvances();
            },
            error: (err) => {
                console.error('Error al obtener órdenes de salida:', err);
            },
        });
    }
}
