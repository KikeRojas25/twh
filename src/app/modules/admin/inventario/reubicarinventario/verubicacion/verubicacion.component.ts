import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { JwtHelperService } from '@auth0/angular-jwt';

import { GeneralService } from 'app/modules/admin/_services/general.service';
import { InventarioService } from 'app/modules/admin/_services/inventario.service';
import { Ubicacion } from 'app/modules/admin/inventario/inventario.type';

interface Origen {
  id: number;
  lpn?: string;
  ubicacion?: string;
  ubicacionId?: number;
  almacen?: string;
  almacenId?: number;
  producto?: string;
  qty?: number;
}

@Component({
  selector: 'app-verubicacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    DropdownModule,
    AutoCompleteModule,
    TooltipModule,
    TableModule
  ],
  providers: [ConfirmationService],
  templateUrl: './verubicacion.component.html',
  styleUrl: './verubicacion.component.scss'
})
export class VerubicacionComponent implements OnInit {

  origenes: Origen[] = [];
  origenAlmacenId: number | null = null;
  origenAlmacenNombre = '';

  almacenes: SelectItem[] = [];
  almacenDestinoId: number | null = null;

  query = '';
  sugerencias: Ubicacion[] = [];
  destino: Ubicacion | null = null;

  loadingSugerencias = false;
  loadingContenido = false;
  contenidoDestino: any[] = [];
  saving = false;

  jwtHelper = new JwtHelperService();
  private decodedToken: any = {};

  constructor(
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private confirmationService: ConfirmationService,
    private generalService: GeneralService,
    private inventarioService: InventarioService,
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('token');
    this.decodedToken = user ? this.jwtHelper.decodeToken(user) : {};

    const data = this.config.data || {};
    this.origenes = (data.origenes as Origen[]) ?? [];

    const fallbackAlmacenId = data.almacenId ?? null;
    const fallbackAlmacen = data.almacen ?? '';

    if (this.origenes.length) {
      this.origenAlmacenId = this.origenes[0].almacenId ?? fallbackAlmacenId;
      this.origenAlmacenNombre = this.origenes[0].almacen ?? fallbackAlmacen;
    } else {
      this.origenAlmacenId = fallbackAlmacenId;
      this.origenAlmacenNombre = fallbackAlmacen;
    }

    this.almacenDestinoId = this.origenAlmacenId;

    const almacenesData = (data.almacenes as SelectItem[]) ?? [];
    if (almacenesData.length) {
      this.almacenes = almacenesData;
    } else {
      this.generalService.getAllAlmacenes().subscribe(resp => {
        this.almacenes = (resp ?? []).map((a: any) => ({
          value: a.id,
          label: a.descripcion,
        }));
      });
    }
  }

  onAlmacenDestinoChange() {
    this.destino = null;
    this.sugerencias = [];
    this.contenidoDestino = [];
  }

  get isMulti(): boolean {
    return this.origenes.length > 1;
  }

  get origenIds(): number[] {
    return Array.from(new Set(this.origenes.map(o => o.ubicacionId).filter(v => v != null) as number[]));
  }

  buscarUbicaciones(event: { query: string }) {
    const q = (event?.query ?? '').trim();

    if (!this.almacenDestinoId) {
      this.sugerencias = [];
      return;
    }

    this.loadingSugerencias = true;
    this.generalService.buscarUbicacionesCatalogo(this.almacenDestinoId, q).subscribe({
      next: (rows) => {
        const mapped: Ubicacion[] = (rows ?? []).map((r: any) => ({
          id: r.id,
          ubicacion: r.nombre ?? r.ubicacion ?? '',
          area: r.areaNombre ?? r.area ?? '',
          estado: r.tipoUbicacionNombre ?? r.estado ?? '',
        }));
        this.sugerencias = mapped.filter(u => !this.origenIds.includes(u.id));
        this.loadingSugerencias = false;
      },
      error: () => {
        this.sugerencias = [];
        this.loadingSugerencias = false;
      }
    });
  }

  onSelectDestino(event: any) {
    const ub: Ubicacion = (event?.value ?? event) as Ubicacion;
    if (!ub?.id) return;
    this.destino = ub;
    this.contenidoDestino = [];
    this.cargarContenido(ub);
  }

  onClearDestino() {
    this.destino = null;
    this.contenidoDestino = [];
  }

  private cargarContenido(ub: Ubicacion) {
    this.loadingContenido = true;
    this.inventarioService.GetReporteUbicacionesDetallado({ id: ub.id }).subscribe({
      next: (rows) => {
        this.contenidoDestino = rows ?? [];
        this.loadingContenido = false;
      },
      error: () => {
        this.contenidoDestino = [];
        this.loadingContenido = false;
      }
    });
  }

  get destinoOcupado(): boolean {
    return (this.contenidoDestino?.length ?? 0) > 0;
  }

  get puedeReubicar(): boolean {
    return !!this.destino && !!this.almacenDestinoId && !this.saving && this.origenes.length > 0;
  }

  get cambiaAlmacen(): boolean {
    return this.almacenDestinoId != null
      && this.origenAlmacenId != null
      && this.almacenDestinoId !== this.origenAlmacenId;
  }

  get almacenDestinoNombre(): string {
    return this.almacenes.find(a => a.value === this.almacenDestinoId)?.label ?? '';
  }

  reubicar() {
    if (!this.puedeReubicar) return;

    if (this.destinoOcupado) {
      this.confirmationService.confirm({
        header: 'Ubicación ocupada',
        message: this.mensajeOcupacion(),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, continuar',
        rejectLabel: 'Cancelar',
        accept: () => this.confirmarReubicacion(),
      });
    } else {
      this.confirmarReubicacion();
    }
  }

  private confirmarReubicacion() {
    const totalLpns = this.origenes.length;
    const destinoTxt = `${this.destino?.ubicacion} (${this.almacenDestinoNombre})`;
    const base = totalLpns === 1
      ? `¿Reubicar el pallet ${this.origenes[0].lpn ?? ''} a la ubicación ${destinoTxt}?`
      : `¿Reubicar ${totalLpns} pallets a la ubicación ${destinoTxt}?`;
    const aviso = this.cambiaAlmacen
      ? `\n\nSe transferirá entre almacenes: ${this.origenAlmacenNombre} → ${this.almacenDestinoNombre}.`
      : '';
    this.confirmationService.confirm({
      header: 'Confirmar reubicación',
      message: base + aviso,
      icon: 'pi pi-question-circle',
      acceptLabel: 'Reubicar',
      rejectLabel: 'Cancelar',
      accept: () => this.ejecutar(),
    });
  }

  private ejecutar() {
    if (!this.destino) return;

    const ubicacionId = Number(this.destino.id);
    if (!Number.isInteger(ubicacionId) || ubicacionId <= 0) {
      console.error('[Reubicar] destino.id inválido:', this.destino);
      return;
    }

    this.saving = true;
    const payload = {
      Paletas: this.origenes.map(o => String(o.id)),
      UbicacionId: ubicacionId,
      IdUsuario: Number(this.decodedToken?.nameid) || 1,
    };

    console.log('[Reubicar] payload', payload, 'destino:', this.destino);

    this.generalService.setUbicacionMasiva(payload).subscribe({
      next: () => {
        this.saving = false;
        this.ref.close(true);
      },
      error: (err) => {
        console.error('[Reubicar] error', err);
        this.saving = false;
      }
    });
  }

  private mensajeOcupacion(): string {
    const items = this.contenidoDestino.length;
    const muestra = this.contenidoDestino[0];
    const desc = muestra?.descripcionLarga || muestra?.lodNum || '';
    const detalle = items === 1
      ? `Contiene: ${desc}.`
      : `Contiene ${items} items (ej. ${desc}).`;
    return `${detalle} ¿Deseas reubicar igualmente?`;
  }

  cancelar() {
    this.ref.close(false);
  }
}
