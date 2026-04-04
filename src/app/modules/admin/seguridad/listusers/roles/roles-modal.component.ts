import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PickListModule } from 'primeng/picklist';
import { SeguridadService } from '../../seguridad.service';

@Component({
  selector: 'app-roles-modal',
  templateUrl: './roles-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DynamicDialogModule,
    PickListModule,
  ]
})
export class RolesModalComponent implements OnInit {

  disponibles: any[] = [];
  asignados: any[] = [];
  guardando = false;
  cargando = true;
  userId!: number;
  nombreUsuario = '';

  constructor(
    private seguridadService: SeguridadService,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
  ) {}

  ngOnInit() {
    this.userId = this.config.data?.id;
    this.nombreUsuario = this.config.data?.nombreCompleto || '';
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    // Cargar todos los roles y los asignados en paralelo
    Promise.all([
      this.seguridadService.getAllRoles().toPromise(),
      this.seguridadService.getUserRoles(this.userId).toPromise()
    ]).then(([todos, asignados]) => {
      const idsAsignados = new Set((asignados || []).map((r: any) => r.rolID || r.RolID));
      this.asignados = (todos || []).filter((r: any) => idsAsignados.has(r.id));
      this.disponibles = (todos || []).filter((r: any) => !idsAsignados.has(r.id));
      this.cargando = false;
    }).catch(() => {
      this.ref.close({ ok: false, error: 'No se pudieron cargar los roles.' });
    });
  }

  guardar() {
    this.guardando = true;
    this.seguridadService.saveUserRoles(this.userId, this.asignados).subscribe({
      next: () => {
        this.ref.close({ ok: true });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'Error al guardar los roles.';
        this.ref.close({ ok: false, error: msg });
      }
    });
  }

  cancelar() {
    this.ref.close(null);
  }
}
