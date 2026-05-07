import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { ProductoService } from '../../../_services/producto.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { NewedithuellaComponent } from '../newedithuella/newedithuella.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-verproducto',
  standalone: true,
  imports: [
    MatIcon,
    CommonModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    RouterLink,
  ],
  providers: [DialogService, MessageService],
  templateUrl: './verproducto.component.html',
  styleUrl: './verproducto.component.scss',
})
export class VerproductoComponent implements OnInit {
  id: any;
  model: any = {};
  huellas: any[] = [];
  total = 0;
  totalCantidadHuellas = 0;
  cargandoProducto = true;
  cargandoHuellas = true;
  ref: DynamicDialogRef | undefined;
  form: FormGroup;

  constructor(
    private productoService: ProductoService,
    private activatedRoute: ActivatedRoute,
    public dialogService: DialogService,
    private router: Router,
    public messageService: MessageService,
  ) {}

  ngOnInit() {
    this.id = this.activatedRoute.snapshot.params.id;
    this.cargandoProducto = true;
    this.productoService.get(this.id).subscribe({
      next: (result) => {
        this.model = result;
        this.cargandoProducto = false;
      },
      error: () => (this.cargandoProducto = false),
    });

    this.buscarHuella(this.id);
  }

  buscarHuella(id: number) {
    this.cargandoHuellas = true;
    this.productoService.getHuellas(id).subscribe({
      next: (result) => {
        const list = result ?? [];
        const total = list.reduce((sum, x: any) => sum + Number(x.cantidad ?? 0), 0);
        this.total = total;
        this.totalCantidadHuellas = total;

        // Recalcula el % de uso por huella sin mutar lecturas anteriores.
        this.huellas = list.map((x: any) => ({
          ...x,
          pctUso: total > 0 ? Math.round(((Number(x.cantidad ?? 0) * 100) / total) * 10) / 10 : 0,
        }));

        this.cargandoHuellas = false;
      },
      error: () => {
        this.huellas = [];
        this.cargandoHuellas = false;
      },
    });
  }

  nuevaHuella(id: number) {
    this.ref = this.dialogService.open(NewedithuellaComponent, {
      header: 'Datos de Huella',
      width: '420px',
      height: '350px',
      data: { productoId: id, esNuevo: true },
    });

    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscarHuella(this.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Huella guardada',
          detail: 'Se ha guardado la huella.',
        });
      }
    });
  }

  editarHuella(id: number) {
    this.ref = this.dialogService.open(NewedithuellaComponent, {
      header: 'Datos de Huella',
      width: '420px',
      height: '350px',
      data: { productoId: id, esNuevo: false },
    });
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscarHuella(this.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Huella guardada',
          detail: 'Se ha guardado la huella.',
        });
      }
    });
  }

  verHuella(id: number) {
    this.router.navigate(['/mantenimiento/huelladetalle', id, this.id]);
  }

  regresar() {
    this.router.navigate(['mantenimiento/listadoproducto']);
  }

  inicialesProducto(): string {
    const desc: string = this.model?.descripcionLarga ?? '';
    const partes = desc.trim().split(/\s+/).slice(0, 2);
    return partes.map((p) => p.charAt(0)).join('').toUpperCase() || 'P';
  }

  colorPct(pct: number): string {
    if (pct >= 60) return 'bg-emerald-500';
    if (pct >= 30) return 'bg-indigo-500';
    if (pct > 0)   return 'bg-amber-500';
    return 'bg-gray-300';
  }

  colorPctText(pct: number): string {
    if (pct >= 60) return 'text-emerald-600';
    if (pct >= 30) return 'text-indigo-600';
    if (pct > 0)   return 'text-amber-600';
    return 'text-gray-400';
  }
}
