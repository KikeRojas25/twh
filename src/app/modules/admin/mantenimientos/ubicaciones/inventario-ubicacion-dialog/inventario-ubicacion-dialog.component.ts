import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { UbicacionService } from '../../../_services/ubicacion.service';

@Component({
  selector: 'app-inventario-ubicacion-dialog',
  templateUrl: './inventario-ubicacion-dialog.component.html',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule, TooltipModule, SkeletonModule],
})
export class InventarioUbicacionDialogComponent implements OnInit, OnDestroy {

  ubicacionId!: number;
  ubicacionNombre!: string;

  cargando = false;
  totalLods = 0;
  totalUnidades = 0;
  lods: any[] = [];

  private intervalo: any;

  constructor(
    private ubicacionService: UbicacionService,
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef
  ) { }

  ngOnInit() {
    this.ubicacionId = this.config.data.ubicacionId;
    this.ubicacionNombre = this.config.data.ubicacionNombre;
    this.cargar();
    // Refresco automático cada 15 segundos
    this.intervalo = setInterval(() => this.cargar(), 15000);
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  cargar() {
    this.cargando = true;
    this.ubicacionService.getInventarioByUbicacion(this.ubicacionId).subscribe({
      next: (data) => {
        this.totalLods = data.totalLods ?? 0;
        this.totalUnidades = data.totalUnidades ?? 0;
        this.lods = data.lods ?? [];
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  cerrar() { this.ref.close(); }
}
