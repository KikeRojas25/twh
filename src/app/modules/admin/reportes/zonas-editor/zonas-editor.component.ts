import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { UbicacionService } from '../../_services/ubicacion.service';
import { ZonaService } from '../../_services/zona.service';
import { Zonas3dViewerComponent } from '../zonas3d/zonas3d-viewer/zonas3d-viewer.component';
import { ZonaDialogComponent } from './zona-dialog/zona-dialog.component';

interface AlmacenOption { label: string; value: number; nombre: string; }

interface ZonaItem {
  id: number;
  codigo: string | null;
  nombre: string;
  colorHex: string | null;
  // Campos preservados para edición (ZonaForCreate)
  areaId: number | null;
  tipoZonaId: number | null;
  esDedicada: boolean;
  activo: boolean;
}

interface ResumenZona {
  zonaId: number | null;
  nombre: string;
  color: string;
  total: number;
  ocupadas: number;
  libres: number;
}

@Component({
  selector: 'app-zonas-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIcon, DropdownModule, ProgressSpinnerModule,
    ButtonModule, ToastModule, ConfirmDialogModule, DynamicDialogModule, TooltipModule,
    Zonas3dViewerComponent,
  ],
  providers: [DialogService, MessageService, ConfirmationService],
  templateUrl: './zonas-editor.component.html',
  styles: [`
    :host ::ng-deep .z3d-dropdown.p-dropdown{ border:none;background:transparent;box-shadow:none; }
    :host ::ng-deep .z3d-dropdown.p-dropdown:not(.p-disabled):hover{border:none;}
    :host ::ng-deep .z3d-dropdown.p-dropdown:not(.p-disabled).p-focus{box-shadow:none;border:none;}
    :host ::ng-deep .z3d-dropdown .p-dropdown-label{
      padding:.3rem .35rem;font-size:.8rem;line-height:1rem;color:#374151;font-weight:600;
    }
    :host ::ng-deep .z3d-dropdown .p-dropdown-label.p-placeholder{color:#9ca3af;font-weight:400;}
    :host ::ng-deep .z3d-dropdown .p-dropdown-trigger{width:1.5rem;color:#9ca3af;}
  `],
})
export class ZonasEditorComponent implements OnInit {
  @ViewChild('viewer') viewer?: Zonas3dViewerComponent;

  almacenes: AlmacenOption[] = [];
  almacenSeleccionado: number | null = null;
  almacenNombre = '';
  cargandoAlmacenes = true;

  zonas: ZonaItem[] = [];
  zonaOpciones: { label: string; value: number }[] = [];
  cargandoZonas = false;
  zonaTarget: number | null = null;        // zona destino para asignar
  private resumen = new Map<number | null, ResumenZona>();

  seleccion: { id: number; nombre: string; zonaId: number | null }[] = [];
  guardando = false;
  private dialogRef?: DynamicDialogRef;

  constructor(
    private ubicacionService: UbicacionService,
    private zonaService: ZonaService,
    private dialogService: DialogService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const almacenIdParam = Number(this.route.snapshot.queryParamMap.get('almacenId')) || null;
    this.ubicacionService.getAlmacenes().subscribe({
      next: (data) => {
        this.almacenes = (data || []).map((a: any) => {
          const nombre = a.descripcion ?? a.Descripcion ?? a.codigoAlm ?? a.nombre ?? `Almacén ${a.id ?? a.Id}`;
          const id = a.id ?? a.Id;
          return { label: nombre, value: id, nombre };
        });
        if (this.almacenes.length > 0) {
          const pre = almacenIdParam && this.almacenes.some(a => a.value === almacenIdParam)
            ? almacenIdParam : this.almacenes[0].value;
          this.almacenSeleccionado = pre;
          this.almacenNombre = this.almacenes.find(a => a.value === pre)?.nombre ?? '';
          this.cargarZonas();
        }
        this.cargandoAlmacenes = false;
      },
      error: () => { this.cargandoAlmacenes = false; },
    });
  }

  onAlmacenChange(): void {
    this.almacenNombre = this.almacenes.find(a => a.value === this.almacenSeleccionado)?.nombre ?? '';
    this.zonaTarget = null;
    this.seleccion = [];
    this.cargarZonas();
  }

  cargarZonas(): void {
    if (!this.almacenSeleccionado) return;
    this.cargandoZonas = true;
    this.zonaService.getZonas(this.almacenSeleccionado).subscribe({
      next: (data) => {
        this.zonas = (data || []).map((z: any) => ({
          id: z.id ?? z.Id,
          codigo: z.codigo ?? z.Codigo ?? null,
          nombre: z.nombre ?? z.Nombre ?? `Zona ${z.id ?? z.Id}`,
          colorHex: z.colorHex ?? z.ColorHex ?? null,
          areaId: z.areaId ?? z.AreaId ?? null,
          tipoZonaId: z.tipoZonaId ?? z.TipoZonaId ?? null,
          esDedicada: z.esDedicada ?? z.EsDedicada ?? true,
          activo: z.activo ?? z.Activo ?? true,
        }));
        this.zonaOpciones = this.zonas.map(z => ({
          label: z.codigo ? `${z.codigo} · ${z.nombre}` : z.nombre,
          value: z.id,
        }));
        this.cargandoZonas = false;
      },
      error: () => {
        this.zonas = [];
        this.cargandoZonas = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las zonas' });
      },
    });
  }

  // ── Eventos del visor ──
  onSeleccionChange(ubic: any[]): void {
    this.seleccion = (ubic || []).map(u => ({ id: u.id, nombre: u.nombre, zonaId: u.zonaId ?? null }));
  }

  onResumenChange(resumen: any[]): void {
    this.resumen.clear();
    for (const r of resumen || []) {
      this.resumen.set(r.zonaId ?? null, {
        zonaId: r.zonaId ?? null,
        nombre: r.nombre,
        color: r.color,
        total: r.total,
        ocupadas: r.ocupadas,
        libres: r.libres,
      });
    }
  }

  conteo(zonaId: number | null): ResumenZona | undefined {
    return this.resumen.get(zonaId);
  }

  colorZona(z: ZonaItem): string {
    return z.colorHex || this.resumen.get(z.id)?.color || '#9ca3af';
  }

  get sinZona(): ResumenZona | undefined {
    return this.resumen.get(null);
  }

  get nombreTarget(): string {
    return this.zonas.find(z => z.id === this.zonaTarget)?.nombre ?? 'zona';
  }

  // ── Selección de zona destino ──
  elegirTarget(zonaId: number | null): void {
    this.zonaTarget = zonaId;
  }

  seleccionarUbicacionesDeZona(zonaId: number | null, ev: Event): void {
    ev.stopPropagation();
    this.zonaTarget = zonaId;
    this.viewer?.seleccionarPorZona(zonaId);
  }

  // ── CRUD de zona ──
  nuevaZona(): void {
    this.abrirDialogo(null);
  }

  editarZona(z: ZonaItem, ev: Event): void {
    ev.stopPropagation();
    this.abrirDialogo(z);
  }

  private abrirDialogo(zona: ZonaItem | null): void {
    this.dialogRef = this.dialogService.open(ZonaDialogComponent, {
      header: zona ? 'Editar zona' : 'Nueva zona',
      width: '460px',
      modal: true,
      dismissableMask: true,
      data: { zona, almacenId: this.almacenSeleccionado },
      baseZIndex: 10000,
    });
    this.dialogRef.onClose.subscribe((guardado) => { if (guardado) this.cargarZonas(); });
  }

  eliminarZona(z: ZonaItem, ev: Event): void {
    ev.stopPropagation();
    const c = this.conteo(z.id);
    const aviso = c && c.total > 0
      ? ` Sus ${c.total} ubicación(es) quedarán sin zona.`
      : '';
    this.confirmationService.confirm({
      message: `¿Eliminar la zona "${z.nombre}"?${aviso}`,
      header: 'Eliminar zona',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.zonaService.eliminarZona(z.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Zona eliminada' });
            if (this.zonaTarget === z.id) this.zonaTarget = null;
            this.cargarZonas();
            this.viewer?.recargarDatos();
            this.viewer?.limpiarSeleccion();
          },
          error: (err) => {
            const msg = err.error?.message || 'No se pudo eliminar la zona';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
      },
    });
  }

  // ── Asignar / quitar ubicaciones ──
  asignar(): void {
    if (this.zonaTarget == null) {
      this.messageService.add({ severity: 'warn', summary: 'Elegí una zona', detail: 'Seleccioná la zona destino en el panel' });
      return;
    }
    if (this.seleccion.length === 0) return;
    const ids = this.seleccion.map(s => s.id);
    this.guardando = true;
    this.zonaService.asignarUbicaciones(this.zonaTarget, ids).subscribe({
      next: () => {
        const nombreZona = this.zonas.find(z => z.id === this.zonaTarget)?.nombre ?? 'la zona';
        this.messageService.add({ severity: 'success', summary: 'Asignadas', detail: `${ids.length} ubicación(es) → ${nombreZona}` });
        this.trasGuardar();
      },
      error: (err) => {
        this.guardando = false;
        const msg = err.error?.message || 'No se pudieron asignar las ubicaciones';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  quitar(): void {
    if (this.seleccion.length === 0) return;
    // Agrupar por zona actual (ignorando las que ya están sin zona)
    const porZona = new Map<number, number[]>();
    for (const s of this.seleccion) {
      if (s.zonaId == null) continue;
      if (!porZona.has(s.zonaId)) porZona.set(s.zonaId, []);
      porZona.get(s.zonaId)!.push(s.id);
    }
    if (porZona.size === 0) {
      this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'Las ubicaciones seleccionadas ya no tienen zona' });
      return;
    }
    this.guardando = true;
    const total = [...porZona.values()].reduce((n, a) => n + a.length, 0);
    const peticiones = [...porZona.entries()];
    let completadas = 0;
    let huboError = false;
    for (const [zonaId, ids] of peticiones) {
      this.zonaService.quitarUbicaciones(zonaId, ids).subscribe({
        next: () => { if (++completadas === peticiones.length) this.finQuitar(total, huboError); },
        error: () => { huboError = true; if (++completadas === peticiones.length) this.finQuitar(total, huboError); },
      });
    }
  }

  private finQuitar(total: number, huboError: boolean): void {
    if (huboError) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Algunas ubicaciones no se pudieron quitar' });
    } else {
      this.messageService.add({ severity: 'success', summary: 'Quitadas', detail: `${total} ubicación(es) quedaron sin zona` });
    }
    this.trasGuardar();
  }

  private trasGuardar(): void {
    this.guardando = false;
    this.viewer?.recargarDatos();
    this.viewer?.limpiarSeleccion();
    this.cargarZonas();
  }

  limpiarSeleccion(): void {
    this.viewer?.limpiarSeleccion();
  }

  volverAlReporte(): void {
    this.router.navigate(['/reporte/zonas3d']);
  }
}
