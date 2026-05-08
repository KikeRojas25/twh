import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ClienteService } from '../../../_services/cliente.service';

interface CargaResultado {
    productosNuevos: number;
    huellasReparadas: number;
    omitidos: number;
    errores: { fila: number; codigo: string; mensaje: string }[];
}

@Component({
    selector: 'app-carga-productos-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ProgressBarModule, TableModule, TagModule, ToastModule],
    templateUrl: './carga-productos-dialog.component.html',
    styleUrls: ['./carga-productos-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService],
})
export class CargaProductosDialogComponent implements OnInit {
    private _ref = inject(DynamicDialogRef);
    private _config = inject(DynamicDialogConfig);
    private _service = inject(ClienteService);
    private _toast = inject(MessageService);

    clienteId = 0;
    clienteNombre = '';

    archivo = signal<File | null>(null);
    progreso = signal(0);
    cargando = signal(false);
    resultado = signal<CargaResultado | null>(null);

    ngOnInit(): void {
        this.clienteId = this._config.data?.clienteId ?? 0;
        this.clienteNombre = this._config.data?.clienteNombre ?? '';
    }

    onArchivoSeleccionado(ev: Event): void {
        const input = ev.target as HTMLInputElement;
        const f = input.files?.[0] ?? null;
        if (f && !f.name.toLowerCase().endsWith('.xlsx')) {
            this._toast.add({ severity: 'warn', summary: 'Formato inválido', detail: 'Solo se aceptan archivos .xlsx.' });
            input.value = '';
            return;
        }
        if (f && f.size > 10 * 1024 * 1024) {
            this._toast.add({ severity: 'warn', summary: 'Archivo demasiado grande', detail: 'El máximo es 10 MB.' });
            input.value = '';
            return;
        }
        this.archivo.set(f);
        this.resultado.set(null);
    }

    subir(): void {
        const f = this.archivo();
        if (!f || this.clienteId <= 0) return;

        this.cargando.set(true);
        this.progreso.set(0);
        this.resultado.set(null);

        this._service.subirProductosExcel(this.clienteId, f).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.UploadProgress && event.total) {
                    this.progreso.set(Math.round((100 * event.loaded) / event.total));
                } else if (event.type === HttpEventType.Response) {
                    this.cargando.set(false);
                    this.progreso.set(100);
                    this.resultado.set(event.body as CargaResultado);
                    this._toast.add({
                        severity: 'success',
                        summary: 'Carga completada',
                        detail: this._resumenToast(event.body as CargaResultado),
                    });
                }
            },
            error: (err) => {
                this.cargando.set(false);
                this.progreso.set(0);
                const msg = err?.error?.error ?? err?.message ?? 'Error desconocido.';
                this._toast.add({ severity: 'error', summary: 'Error en la carga', detail: msg });
            },
        });
    }

    cerrar(): void {
        // Notifica a la grid si hubo cambios para que pueda refrescar si quiere.
        this._ref.close(this.resultado());
    }

    private _resumenToast(r: CargaResultado): string {
        return `${r.productosNuevos} nuevos · ${r.huellasReparadas} con huella creada · ${r.omitidos} omitidos · ${r.errores.length} errores`;
    }
}
