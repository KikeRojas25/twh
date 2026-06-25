import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UbicacionService } from '../../_services/ubicacion.service';
import { Zonas3dViewerComponent } from './zonas3d-viewer/zonas3d-viewer.component';

interface AlmacenOption {
  label: string;
  value: number;
  nombre: string;
}

@Component({
  selector: 'app-zonas3d',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, ButtonModule, DropdownModule, ProgressSpinnerModule, Zonas3dViewerComponent],
  templateUrl: './zonas3d.component.html',
  styles: [`
    :host ::ng-deep .z3d-dropdown.p-dropdown{
      border:none;background:transparent;box-shadow:none;
    }
    :host ::ng-deep .z3d-dropdown.p-dropdown:not(.p-disabled):hover{border:none;}
    :host ::ng-deep .z3d-dropdown.p-dropdown:not(.p-disabled).p-focus{box-shadow:none;border:none;}
    :host ::ng-deep .z3d-dropdown .p-dropdown-label{
      padding:.3rem .35rem;font-size:.8rem;line-height:1rem;color:#374151;font-weight:600;
    }
    :host ::ng-deep .z3d-dropdown .p-dropdown-label.p-placeholder{color:#9ca3af;font-weight:400;}
    :host ::ng-deep .z3d-dropdown .p-dropdown-trigger{width:1.5rem;color:#9ca3af;}
  `],
})
export class Zonas3dComponent implements OnInit {
  almacenes: AlmacenOption[] = [];
  almacenSeleccionado: number | null = null;
  almacenNombre = '';
  areaNombre: string | null = null;
  cargandoAlmacenes = true;

  constructor(private ubicacionService: UbicacionService, private router: Router) {}

  editarZonas(): void {
    this.router.navigate(['/reporte/zonas-editor'], {
      queryParams: this.almacenSeleccionado ? { almacenId: this.almacenSeleccionado } : {},
    });
  }

  ngOnInit(): void {
    this.ubicacionService.getAlmacenes().subscribe({
      next: (data) => {
        this.almacenes = (data || []).map((a: any) => {
          const nombre = a.descripcion ?? a.Descripcion ?? a.codigoAlm ?? a.nombre ?? `Almacén ${a.id ?? a.Id}`;
          const id = a.id ?? a.Id;
          return { label: nombre, value: id, nombre };
        });
        // Preseleccionar el primero
        if (this.almacenes.length > 0) {
          this.almacenSeleccionado = this.almacenes[0].value;
          this.almacenNombre = this.almacenes[0].nombre;
        }
        this.cargandoAlmacenes = false;
      },
      error: () => {
        this.cargandoAlmacenes = false;
      },
    });
  }

  onAlmacenChange(): void {
    const a = this.almacenes.find(x => x.value === this.almacenSeleccionado);
    this.almacenNombre = a?.nombre ?? '';
    this.areaNombre = null;
  }

  get header(): string {
    const alm = this.almacenNombre || '—';
    return this.areaNombre ? `Vista 3D — ${alm} · ${this.areaNombre}` : `Vista 3D — ${alm}`;
  }
}
