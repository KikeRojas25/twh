import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PickListModule } from 'primeng/picklist';
import { firstValueFrom } from 'rxjs';
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

  async cargar() {
    this.cargando = true;
    try {
      const [todos, asignados] = await Promise.all([
        firstValueFrom(this.seguridadService.getAllRoles()),
        firstValueFrom(this.seguridadService.getUserRoles(this.userId))
      ]);

      // 🐛 DEBUG: ver qué viene exactamente del backend
      console.log('[roles-modal] todos:', todos);
      console.log('[roles-modal] asignados:', asignados);

      // Aceptamos cualquier nombre de campo (camelCase, PascalCase, legacy "rolID",
      // o el nombre real "rolId" del entity RolUser).
      const extraerId = (r: any): number => {
        const raw = r?.id ?? r?.Id ?? r?.rolId ?? r?.RolId ?? r?.rolID ?? r?.RolID;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : 0;
      };

      const idsAsignados = new Set<number>(
        (asignados ?? [])
          .map((r: any) => extraerId(r))
          .filter((n: number) => n > 0)
      );

      console.log('[roles-modal] idsAsignados:', Array.from(idsAsignados));

      this.asignados   = (todos ?? []).filter((r: any) => idsAsignados.has(extraerId(r)));
      this.disponibles = (todos ?? []).filter((r: any) => !idsAsignados.has(extraerId(r)));

      console.log('[roles-modal] asignados FINAL:', this.asignados);
      console.log('[roles-modal] disponibles FINAL:', this.disponibles);
    } catch (err) {
      console.error('[roles-modal] error cargando:', err);
      this.ref.close({ ok: false, error: 'No se pudieron cargar los roles.' });
    } finally {
      this.cargando = false;
    }
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
