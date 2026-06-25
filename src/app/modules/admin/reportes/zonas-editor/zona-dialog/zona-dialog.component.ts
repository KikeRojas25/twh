import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ZonaService } from '../../../_services/zona.service';

@Component({
  selector: 'app-zona-dialog',
  templateUrl: './zona-dialog.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ColorPickerModule, ToastModule],
  providers: [MessageService],
})
export class ZonaDialogComponent implements OnInit {
  // Campos preservados del backend (ZonaForCreate): esDedicada/areaId/tipoZonaId/activo.
  model: any = { codigo: '', nombre: '', esDedicada: true, areaId: null, tipoZonaId: null, activo: true };
  /** Color en hex SIN '#': lo que maneja p-colorPicker. */
  colorRaw = '3b82f6';
  almacenId!: number;
  guardando = false;
  esEdicion = false;

  // Paleta sugerida (hex sin '#')
  readonly paleta = [
    '3b82f6', '6366f1', '8b5cf6', 'ec4899', 'ef4444', 'f97316',
    'f59e0b', '10b981', '14b8a6', '06b6d4', '64748b', '0ea5e9',
  ];

  constructor(
    private zonaService: ZonaService,
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.almacenId = this.config.data?.almacenId;
    const z = this.config.data?.zona;
    this.esEdicion = !!z;
    if (z) {
      this.model = {
        id: z.id ?? z.Id,
        codigo: z.codigo ?? z.Codigo ?? '',
        nombre: z.nombre ?? z.Nombre ?? '',
        esDedicada: z.esDedicada ?? z.EsDedicada ?? true,
        areaId: z.areaId ?? z.AreaId ?? null,
        tipoZonaId: z.tipoZonaId ?? z.TipoZonaId ?? null,
        activo: z.activo ?? z.Activo ?? true,
      };
      const hex = (z.colorHex ?? z.ColorHex ?? '').toString().replace('#', '').trim();
      if (hex) this.colorRaw = hex;
    }
  }

  elegirPaleta(hex: string): void {
    this.colorRaw = hex;
  }

  guardar(): void {
    if (!this.model.codigo?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El código es requerido' });
      return;
    }
    if (!this.model.nombre?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }
    if (!this.almacenId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Falta el almacén' });
      return;
    }

    this.guardando = true;
    const payload = {
      codigo: this.model.codigo.trim().toUpperCase(),
      nombre: this.model.nombre.trim(),
      almacenId: this.almacenId,
      areaId: this.model.areaId ?? null,
      tipoZonaId: this.model.tipoZonaId ?? null,
      esDedicada: this.model.esDedicada ?? true,
      colorHex: '#' + (this.colorRaw || '3b82f6').replace('#', ''),
      activo: this.model.activo ?? true,
    };

    const op$ = this.esEdicion
      ? this.zonaService.actualizarZona(this.model.id, payload)
      : this.zonaService.crearZona(payload);

    op$.subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res?.message || 'Zona guardada' });
        setTimeout(() => this.ref.close(true), 600);
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al guardar la zona';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        this.guardando = false;
      },
    });
  }

  cerrar(): void {
    this.ref.close();
  }
}
