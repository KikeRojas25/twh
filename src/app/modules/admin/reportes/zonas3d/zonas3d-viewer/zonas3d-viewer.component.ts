import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InventarioUbicacionDialogComponent } from '../../../mantenimientos/ubicaciones/inventario-ubicacion-dialog/inventario-ubicacion-dialog.component';
import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  Color4,
  DynamicTexture,
  Engine,
  HemisphericLight,
  DirectionalLight,
  InstancedMesh,
  Matrix,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from '@babylonjs/gui';
import { ZonaService } from '../../../_services/zona.service';
import { UbicacionService } from '../../../_services/ubicacion.service';
import { Subscription } from 'rxjs';

interface Ubicacion3D {
  id: number;
  nombre: string;
  areaId: number | null;
  areaNombre: string | null;
  almacenId: number;
  height: number;
  length: number;
  width: number;
  nivelId: string | null;
  posicionId: number | null;
  estadoOcupacion: string;
  tipoUbicacionNombre: string | null;
  totalLods: number;
  totalUnidades: number;
  activo: boolean | null;
  propietarioNombre: string | null;
  // ── zona ──
  zonaId: number | null;
  zonaNombre: string | null;
  colorHex: string | null;
  propietarioNombreCorto: string | null;
  // color resuelto en cliente (hex usado para pintar)
  _color: string;
}

interface Option {
  label: string;
  value: number | string | null;
}

interface ZonaResumen {
  zonaId: number | null;
  nombre: string;
  color: string;
  cliente: string | null;
  total: number;
  ocupadas: number;
  libres: number;
  pct: number;
}

@Component({
  selector: 'app-zonas3d-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ProgressSpinnerModule, TagModule, DynamicDialogModule],
  providers: [DialogService],
  templateUrl: './zonas3d-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host ::ng-deep .z3d-dropdown.p-dropdown{
      border:none;background:transparent;box-shadow:none;min-width:7.25rem;
    }
    :host ::ng-deep .z3d-dropdown.p-dropdown:not(.p-disabled):hover{border:none;}
    :host ::ng-deep .z3d-dropdown.p-dropdown:not(.p-disabled).p-focus{box-shadow:none;border:none;}
    :host ::ng-deep .z3d-dropdown .p-dropdown-label{
      padding:.3rem .35rem;font-size:.78rem;line-height:1rem;color:#374151;font-weight:500;
    }
    :host ::ng-deep .z3d-dropdown .p-dropdown-label.p-placeholder{color:#9ca3af;font-weight:400;}
    :host ::ng-deep .z3d-dropdown .p-dropdown-trigger{width:1.4rem;color:#9ca3af;}
    :host ::ng-deep .z3d-dropdown .p-dropdown-clear-icon{right:1.5rem;color:#9ca3af;}
  `],
})
export class Zonas3dViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() almacenId!: number;
  @Input() almacenNombre = '';
  @Input() areaIdInicial?: number | null;
  /** Modo edición: el click selecciona ubicaciones (multiselección) en vez de abrir el detalle. */
  @Input() modoEdicion = false;
  /** Emite el nombre del área seleccionada (null = todas) para el header del contenedor. */
  @Output() areaNombreChange = new EventEmitter<string | null>();
  /** Emite la lista de ubicaciones seleccionadas (solo en modo edición). */
  @Output() seleccionChange = new EventEmitter<Ubicacion3D[]>();
  /** Emite el resumen por zona del conjunto visible (para el panel del editor). */
  @Output() resumenChange = new EventEmitter<ZonaResumen[]>();

  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  cargando = true;
  total = 0;
  ocupadas = 0;
  libres = 0;
  mostrarEstructuraRack = true;

  // Filtros
  areas: Option[] = [{ label: 'Todas las áreas', value: null }];
  areaSeleccionada: number | null = null;
  zonasOpciones: Option[] = [{ label: 'Todas las zonas', value: null }];
  zonaSeleccionada: number | null = null;
  clientesOpciones: Option[] = [{ label: 'Todos los propietarios', value: null }];
  clienteSeleccionado: string | null = null;

  // Panel
  zonasResumen: ZonaResumen[] = [];
  zonaDetalle: {
    nombre: string;
    color: string;
    cliente: string | null;
    total: number;
    ocupadas: number;
    libres: number;
    pct: number;
    clientes: { nombre: string; ocupadas: number; pct: number }[];
  } | null = null;

  hoverInfo: { nombre: string; zona: string; estado: string; cliente: string } | null = null;
  selectedInfo: Ubicacion3D | null = null;
  detalleCargando = false;
  detalleLods: any[] = [];

  // ── Modo edición: selección múltiple ──
  rectSelectActivo = false;
  rectBox: { x: number; y: number; w: number; h: number } | null = null;
  private seleccionIds = new Set<number>();
  private selectionOverlays = new Map<number, InstancedMesh>();
  private highlightTemplate?: Mesh;
  private rectStartX = 0;
  private rectStartY = 0;
  private canvasRect?: DOMRect;

  // Babylon
  private engine?: Engine;
  private scene?: Scene;
  private camera?: ArcRotateCamera;
  private boxes: (Mesh | InstancedMesh)[] = [];
  private rackInstances: InstancedMesh[] = [];
  private numerosPiso: Mesh[] = [];
  private piso?: Mesh;
  private colorTemplates = new Map<string, Mesh>();
  private dimTemplate?: Mesh;
  private rackTemplates: { poste?: Mesh; viga?: Mesh; diagonal?: Mesh } = {};
  private labelAnchors: TransformNode[] = [];
  private labelControls: Rectangle[] = [];
  private gui?: AdvancedDynamicTexture;
  private todas: Ubicacion3D[] = [];
  private resizeObs?: ResizeObserver;
  private dialogRef?: DynamicDialogRef;
  private detalleSub?: Subscription;

  private readonly SIN_ZONA = '#9ca3af';   // gris neutro: ubicaciones sin zona
  private readonly DIM = '#d8dde4';         // gris atenuado para filtro

  // distinguir click de drag
  private pointerDownX = 0;
  private pointerDownY = 0;
  private pointerMoved = false;
  private pointerIsDown = false;
  private readonly DRAG_THRESHOLD = 5;

  constructor(
    private zonaService: ZonaService,
    private ubicacionService: UbicacionService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this._initEngine();
      if (this.almacenId) this._cargar();
    }, 250);
  }

  ngOnChanges(): void {
    if (this.engine && this.almacenId) this._cargar();
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    window.removeEventListener('resize', this._onResize);
    this.detalleSub?.unsubscribe();
    this.dialogRef?.close();
    for (const ov of this.selectionOverlays.values()) ov.dispose();
    this.selectionOverlays.clear();
    this.highlightTemplate?.dispose();
    this.gui?.dispose();
    this.scene?.dispose();
    this.engine?.dispose();
  }

  onAreaChange(): void {
    // Cambiar de área reinicia los filtros dependientes
    this.zonaSeleccionada = null;
    this.clienteSeleccionado = null;
    this._render();
    this._emitArea();
  }

  private _emitArea(): void {
    const opt = this.areas.find(a => a.value === this.areaSeleccionada);
    this.areaNombreChange.emit(this.areaSeleccionada == null ? null : (opt?.label ?? null));
  }

  onZonaChange(): void {
    this._render();
    this.cdr.markForCheck();
  }

  onClienteChange(): void {
    this._render();
    this.cdr.markForCheck();
  }

  seleccionarZona(zonaId: number | null): void {
    this.zonaSeleccionada = this.zonaSeleccionada === zonaId ? null : zonaId;
    this._render();
    this.cdr.markForCheck();
  }

  resetCamera(): void { if (this.camera) this._encajarCamara(); }

  vistaIsometrica(): void {
    if (!this.camera) return;
    this.camera.alpha = -Math.PI / 2.5;
    this.camera.beta = Math.PI / 3.2;
    this._encajarCamara();
  }

  vistaSuperior(): void {
    if (!this.camera) return;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = 0.05;
    this._encajarCamara();
  }

  vistaLateral(): void {
    if (!this.camera) return;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = Math.PI / 2 - 0.05;
    this._encajarCamara();
  }

  toggleEstructuraRack(): void {
    this.mostrarEstructuraRack = !this.mostrarEstructuraRack;
    for (const r of this.rackInstances) r.setEnabled(this.mostrarEstructuraRack);
  }

  // ─── Modo edición: API pública ───────────────────────────────────────────────

  /** Activa/desactiva el dibujo de rectángulo de selección (desacopla la cámara). */
  toggleRectSelect(): void {
    this.rectSelectActivo = !this.rectSelectActivo;
    if (!this.camera) return;
    const canvas = this.canvasRef.nativeElement;
    if (this.rectSelectActivo) this.camera.detachControl();
    else { this.camera.attachControl(canvas, true); this.rectBox = null; }
    this.cdr.markForCheck();
  }

  /** Recarga las ubicaciones desde el backend (tras asignar/quitar). */
  recargarDatos(): void {
    if (this.engine && this.almacenId) this._cargar();
  }

  /** Limpia la selección actual. */
  limpiarSeleccion(): void {
    this.seleccionIds.clear();
    this._pintarSeleccion();
    this._emitirSeleccion();
    this.cdr.markForCheck();
  }

  /** Selecciona todas las ubicaciones visibles de una zona (null = sin zona). */
  seleccionarPorZona(zonaId: number | null): void {
    const visibles = this._ubicacionesVisibles();
    this.seleccionIds.clear();
    for (const u of visibles) if (u.zonaId === zonaId) this.seleccionIds.add(u.id);
    this._pintarSeleccion();
    this._emitirSeleccion();
    this.cdr.markForCheck();
  }

  private _clickSeleccion(u: Ubicacion3D | undefined, aditivo: boolean): void {
    if (!u) {
      if (!aditivo && this.seleccionIds.size > 0) {
        this.seleccionIds.clear();
        this._pintarSeleccion();
        this._emitirSeleccion();
        this.cdr.markForCheck();
      }
      return;
    }
    if (aditivo) {
      if (this.seleccionIds.has(u.id)) this.seleccionIds.delete(u.id);
      else this.seleccionIds.add(u.id);
    } else {
      this.seleccionIds.clear();
      this.seleccionIds.add(u.id);
    }
    this._pintarSeleccion();
    this._emitirSeleccion();
    this.cdr.markForCheck();
  }

  private _seleccionarEnRectangulo(box: { x: number; y: number; w: number; h: number }, aditivo: boolean): void {
    if (!aditivo) this.seleccionIds.clear();
    for (const m of this.boxes) {
      const u = m.metadata as Ubicacion3D | undefined;
      if (!u) continue;
      const p = this._proyectarACanvasCss(m.position);
      if (!p) continue;
      if (p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h) {
        this.seleccionIds.add(u.id);
      }
    }
    this._pintarSeleccion();
    this._emitirSeleccion();
    this.cdr.markForCheck();
  }

  /** Proyecta una posición 3D a coordenadas CSS relativas al canvas. */
  private _proyectarACanvasCss(pos: Vector3): { x: number; y: number } | null {
    if (!this.scene || !this.camera || !this.engine) return null;
    const w = this.engine.getRenderWidth();
    const h = this.engine.getRenderHeight();
    const proj = Vector3.Project(pos, Matrix.Identity(), this.scene.getTransformMatrix(), this.camera.viewport.toGlobal(w, h));
    const canvas = this.canvasRef.nativeElement;
    return { x: proj.x * (canvas.clientWidth / w), y: proj.y * (canvas.clientHeight / h) };
  }

  private _ubicacionesVisibles(): Ubicacion3D[] {
    const ids = new Set<number>();
    for (const m of this.boxes) {
      const u = m.metadata as Ubicacion3D | undefined;
      if (u) ids.add(u.id);
    }
    return this.todas.filter(u => ids.has(u.id));
  }

  /** Reaplica los overlays de resaltado sobre las cajas visibles seleccionadas. */
  private _pintarSeleccion(): void {
    if (!this.highlightTemplate) return;
    const boxById = new Map<number, Mesh | InstancedMesh>();
    for (const b of this.boxes) {
      const u = b.metadata as Ubicacion3D | undefined;
      if (u) boxById.set(u.id, b);
    }
    // Remover overlays de ids deseleccionados o no visibles
    for (const [id, ov] of this.selectionOverlays) {
      if (!this.seleccionIds.has(id) || !boxById.has(id)) {
        ov.dispose();
        this.selectionOverlays.delete(id);
      }
    }
    // Crear / posicionar overlays de ids seleccionados visibles
    for (const id of this.seleccionIds) {
      const box = boxById.get(id);
      if (!box) continue;
      let ov = this.selectionOverlays.get(id);
      if (!ov) {
        ov = this.highlightTemplate.createInstance(`sel-${id}`);
        ov.isPickable = false;
        ov.doNotSyncBoundingInfo = true;
        this.selectionOverlays.set(id, ov);
      }
      ov.scaling.copyFrom(box.scaling).scaleInPlace(1.08);
      ov.position.copyFrom(box.position);
    }
  }

  private _emitirSeleccion(): void {
    const byId = new Map(this.todas.map(u => [u.id, u]));
    const sel = [...this.seleccionIds].map(id => byId.get(id)).filter((u): u is Ubicacion3D => !!u);
    this.seleccionChange.emit(sel);
  }

  private _initEngine(): void {
    const canvas = this.canvasRef.nativeElement;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      adaptToDeviceRatio: true,
    });
    this.engine.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1));
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.94, 0.95, 0.97, 1);

    this.camera = new ArcRotateCamera('cam', -Math.PI / 2.2, Math.PI / 2.6, 40, Vector3.Zero(), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 500;
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.panningSensibility = 50;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene).intensity = 0.85;
    const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, -0.5), this.scene);
    dir.intensity = 0.5;

    // Template atenuado (filtro): gris translúcido compartido.
    this.dimTemplate = this._mkTemplate('tplDim', this.DIM, false);
    const dimMat = this.dimTemplate.material as StandardMaterial;
    dimMat.alpha = 0.22;

    // Template de resaltado de selección (modo edición): caja índigo translúcida con bordes.
    this.highlightTemplate = this._mkTemplate('tplSel', '#4f46e5', true);
    const selMat = this.highlightTemplate.material as StandardMaterial;
    selMat.alpha = 0.32;
    this.highlightTemplate.edgesColor = new Color4(0.31, 0.27, 0.9, 1);
    this.highlightTemplate.edgesWidth = 4;

    // Estructura del rack (postes/vigas/diagonales)
    this.rackTemplates.poste = this._mkTemplate('tplPoste', '#1738c7', false);
    this.rackTemplates.viga = this._mkTemplate('tplViga', '#fac61a', false);
    this.rackTemplates.diagonal = this._mkTemplate('tplDiag', '#0d248c', false);

    // Hover + click
    this.scene.onPointerObservable.add(pi => {
      const ev = pi.event as PointerEvent;

      if (pi.type === PointerEventTypes.POINTERDOWN) {
        this.pointerDownX = ev.clientX;
        this.pointerDownY = ev.clientY;
        this.pointerMoved = false;
        this.pointerIsDown = true;
        if (this.hoverInfo) { this.hoverInfo = null; this.cdr.markForCheck(); }
        // Inicio de selección por rectángulo (modo edición)
        if (this.modoEdicion && this.rectSelectActivo && ev.button === 0) {
          this.canvasRect = canvas.getBoundingClientRect();
          this.rectStartX = ev.clientX - this.canvasRect.left;
          this.rectStartY = ev.clientY - this.canvasRect.top;
          this.rectBox = { x: this.rectStartX, y: this.rectStartY, w: 0, h: 0 };
          this.cdr.markForCheck();
        }
        return;
      }

      if (pi.type === PointerEventTypes.POINTERMOVE) {
        // Dibujo del rectángulo de selección
        if (this.modoEdicion && this.rectSelectActivo && this.pointerIsDown && this.canvasRect) {
          const cx = ev.clientX - this.canvasRect.left;
          const cy = ev.clientY - this.canvasRect.top;
          this.rectBox = {
            x: Math.min(cx, this.rectStartX),
            y: Math.min(cy, this.rectStartY),
            w: Math.abs(cx - this.rectStartX),
            h: Math.abs(cy - this.rectStartY),
          };
          this.pointerMoved = true;
          this.cdr.markForCheck();
          return;
        }
        if (this.pointerIsDown) {
          if (Math.abs(ev.clientX - this.pointerDownX) > this.DRAG_THRESHOLD ||
              Math.abs(ev.clientY - this.pointerDownY) > this.DRAG_THRESHOLD) {
            this.pointerMoved = true;
          }
          return;
        }
        const pick = this.scene!.pick(this.scene!.pointerX, this.scene!.pointerY);
        const data = pick?.hit ? (pick.pickedMesh?.metadata as Ubicacion3D | undefined) : undefined;
        if (data) {
          this.hoverInfo = {
            nombre: data.nombre,
            zona: data.zonaNombre || 'Sin zona',
            estado: data.estadoOcupacion,
            cliente: data.propietarioNombreCorto || data.propietarioNombre || '-',
          };
          this.cdr.markForCheck();
        } else if (this.hoverInfo) {
          this.hoverInfo = null;
          this.cdr.markForCheck();
        }
        return;
      }

      if (pi.type === PointerEventTypes.POINTERUP) {
        this.pointerIsDown = false;

        // Fin de selección por rectángulo
        if (this.modoEdicion && this.rectSelectActivo && this.rectBox) {
          const box = this.rectBox;
          this.rectBox = null;
          if (box.w > 3 && box.h > 3) {
            this._seleccionarEnRectangulo(box, ev.ctrlKey || ev.metaKey || ev.shiftKey);
          }
          this.cdr.markForCheck();
          return;
        }

        if (this.pointerMoved || ev.button !== 0) return;
        const pick = this.scene!.pick(this.scene!.pointerX, this.scene!.pointerY);
        const data = pick?.hit ? (pick.pickedMesh?.metadata as Ubicacion3D | undefined) : undefined;

        // Modo edición: click = seleccionar (ctrl/meta = alternar; simple = reemplazar)
        if (this.modoEdicion) {
          this._clickSeleccion(data, ev.ctrlKey || ev.metaKey || ev.shiftKey);
          return;
        }

        this.selectedInfo = data ?? null;
        this._cargarDetalleInline(data);
        this.cdr.markForCheck();
      }
    });

    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('zonaLabelsUI', true, this.scene);

    this.engine.runRenderLoop(() => this.scene?.render());
    window.addEventListener('resize', this._onResize);
    this.resizeObs = new ResizeObserver(() => this.engine?.resize());
    this.resizeObs.observe(canvas);
    if (canvas.parentElement) this.resizeObs.observe(canvas.parentElement);
    requestAnimationFrame(() => this.engine?.resize());
  }

  private _onResize = () => this.engine?.resize();

  ampliarSeleccion(): void {
    if (this.selectedInfo) this._abrirDetalle(this.selectedInfo);
  }

  cerrarSeleccion(): void {
    this.selectedInfo = null;
    this.detalleLods = [];
    this.detalleCargando = false;
    this.detalleSub?.unsubscribe();
  }

  private _cargarDetalleInline(u: Ubicacion3D | undefined): void {
    this.detalleSub?.unsubscribe();
    this.detalleLods = [];
    if (!u || (u.totalLods ?? 0) === 0) { this.detalleCargando = false; return; }

    this.detalleCargando = true;
    this.detalleSub = this.ubicacionService.getInventarioByUbicacion(u.id).subscribe({
      next: (resp: any) => {
        this.detalleLods = resp?.lods ?? [];
        this.detalleCargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.detalleLods = [];
        this.detalleCargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  private _abrirDetalle(u: Ubicacion3D): void {
    this.dialogRef?.close();
    this.dialogRef = this.dialogService.open(InventarioUbicacionDialogComponent, {
      header: `Contenido — ${u.nombre}`,
      width: '900px',
      modal: true,
      dismissableMask: true,
      data: { ubicacionId: u.id, ubicacionNombre: u.nombre },
      baseZIndex: 10000,
    });
  }

  private _cargar(): void {
    this.cargando = true;
    this.zonaSeleccionada = null;
    this.clienteSeleccionado = null;

    this.zonaService.getZonas3d(this.almacenId).subscribe({
      next: (rows) => {
        this.todas = (rows || [])
          .filter((u: any) => u.activo !== false)
          .map((u: any) => {
            const ubic: Ubicacion3D = {
              id: u.id,
              nombre: u.nombre,
              areaId: u.areaId ?? null,
              areaNombre: u.areaNombre ?? null,
              almacenId: u.almacenId,
              height: this._safeDim(u.height, 1.0),
              length: this._safeDim(u.length, 1.0),
              width: this._safeDim(u.width, 1.0),
              nivelId: u.nivelId ?? null,
              posicionId: u.posicionId ?? null,
              estadoOcupacion: u.estadoOcupacion ?? 'Libre',
              tipoUbicacionNombre: u.tipoUbicacionNombre ?? null,
              totalLods: u.totalLods ?? 0,
              totalUnidades: u.totalUnidades ?? 0,
              activo: u.activo ?? true,
              propietarioNombre: u.propietarioNombre ?? null,
              zonaId: u.zonaId ?? null,
              zonaNombre: u.zonaNombre ?? null,
              colorHex: u.colorHex ?? null,
              propietarioNombreCorto: u.propietarioNombreCorto ?? null,
              _color: '',
            };
            ubic._color = this._colorParaUbicacion(ubic);
            return ubic;
          });

        this._construirAreas();
        if (this.areaIdInicial != null && this.areas.some(a => a.value === this.areaIdInicial)) {
          this.areaSeleccionada = this.areaIdInicial;
        }
        this._render();
        this._emitArea();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  private _esPuertaOZona(nombre: string | null | undefined): boolean {
    if (!nombre) return false;
    const n = nombre.toUpperCase().trim();
    return (
      n.includes('PUERTA') || n.includes('DOOR') || n.includes('DESPACHO') ||
      n.includes('RECEP') || n.includes('STAGING') || n.includes('PRE-') ||
      n.includes('PRE ') || n.includes('RECHAZ') || n.includes('ZONA') ||
      n.startsWith('AREA ') || n.startsWith('ÁREA ')
    );
  }

  private _construirAreas(): void {
    const map = new Map<number, string>();
    for (const u of this.todas) {
      if (u.areaId != null && !map.has(u.areaId)) {
        const nombre = u.areaNombre || `Área ${u.areaId}`;
        if (this._esPuertaOZona(nombre)) continue;
        map.set(u.areaId, nombre);
      }
    }
    this.areas = [
      { label: 'Todas las áreas', value: null },
      ...[...map.entries()]
        .sort(([, a], [, b]) => a.localeCompare(b))
        .map(([value, label]) => ({ label, value })),
    ];
  }

  // ─── Color ───────────────────────────────────────────────────────────────

  private _normHex(hex: string | null): string | null {
    if (!hex) return null;
    const h = hex.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(h)) return h.startsWith('#') ? h : '#' + h;
    return null;
  }

  /** Color de pintura de una ubicación: ColorHex de la zona, o color estable por hash. */
  private _colorParaUbicacion(u: Ubicacion3D): string {
    const explicito = this._normHex(u.colorHex);
    if (explicito) return explicito;
    if (u.zonaId == null) return this.SIN_ZONA;
    // Tono por cliente (zonas del mismo cliente => tonos similares); luminosidad por zona.
    const hueSeed = u.propietarioNombreCorto || `z${u.zonaId}`;
    const hue = this._hash(hueSeed) % 360;
    const light = 44 + (this._hash(`L${u.zonaId}`) % 20); // 44..63
    return this._hslToHex(hue, 68, light);
  }

  private _hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  private _hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  private _makeFlat(name: string, hex: string): StandardMaterial {
    const c = Color3.FromHexString(hex);
    const m = new StandardMaterial(name, this.scene!);
    m.diffuseColor = c;
    m.emissiveColor = c;
    m.specularColor = new Color3(0, 0, 0);
    m.disableLighting = true;
    return m;
  }

  private _mkTemplate(name: string, hex: string, edges: boolean): Mesh {
    const t = MeshBuilder.CreateBox(name, { size: 1 }, this.scene!);
    t.material = this._makeFlat(name + '-mat', hex);
    t.isVisible = false;
    t.doNotSyncBoundingInfo = true;
    if (edges) {
      t.enableEdgesRendering();
      t.edgesWidth = 1.5;
      t.edgesColor = new Color4(0, 0, 0, 1);
      t.edgesShareWithInstances = true;
    }
    return t;
  }

  private _templateParaColor(hex: string): Mesh {
    let t = this.colorTemplates.get(hex);
    if (!t) {
      t = this._mkTemplate('tplZona-' + hex, hex, true);
      this.colorTemplates.set(hex, t);
    }
    return t;
  }

  private _filtroActivo(): boolean {
    return this.zonaSeleccionada != null || this.clienteSeleccionado != null;
  }

  private _perteneceAFiltro(u: Ubicacion3D): boolean {
    if (this.zonaSeleccionada != null && u.zonaId !== this.zonaSeleccionada) return false;
    if (this.clienteSeleccionado != null && (u.propietarioNombreCorto || '') !== this.clienteSeleccionado) return false;
    return true;
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  private _render(): void {
    if (!this.scene) return;

    for (const b of this.boxes) b.dispose();
    this.boxes = [];
    for (const r of this.rackInstances) r.dispose();
    this.rackInstances = [];
    for (const n of this.numerosPiso) {
      const mat = n.material as StandardMaterial | null;
      const tex = mat?.diffuseTexture as DynamicTexture | null;
      tex?.dispose(); mat?.dispose(); n.dispose();
    }
    this.numerosPiso = [];
    this.piso?.dispose();
    this.piso = undefined;
    for (const c of this.labelControls) c.dispose();
    this.labelControls = [];
    for (const n of this.labelAnchors) n.dispose();
    this.labelAnchors = [];

    const filtradas = this.areaSeleccionada == null
      ? this.todas
      : this.todas.filter(u => u.areaId === this.areaSeleccionada);

    this.total = filtradas.length;
    this.ocupadas = filtradas.filter(u => u.estadoOcupacion === 'Ocupada').length;
    this.libres = this.total - this.ocupadas;

    // Opciones de dropdown y resumen del panel (sobre el conjunto filtrado por área)
    this._construirOpcionesYResumen(filtradas);

    if (filtradas.length === 0) { this._encajarCamara(); return; }

    const porArea = new Map<number, Ubicacion3D[]>();
    for (const u of filtradas) {
      const nombre = (u.areaNombre ?? '').trim();
      if (!nombre || this._esPuertaOZona(nombre)) continue;
      const key = u.areaId ?? -1;
      if (!porArea.has(key)) porArea.set(key, []);
      porArea.get(key)!.push(u);
    }

    const areasOrdenadas = [...porArea.entries()].sort(([, ua], [, ub]) => {
      const nA = ua[0]?.areaNombre ?? '';
      const nB = ub[0]?.areaNombre ?? '';
      return nA.localeCompare(nB, undefined, { numeric: true, sensitivity: 'base' });
    });

    if (areasOrdenadas.length === 0) { this._encajarCamara(); return; }

    const ESCALA_CUBO = 0.55;
    const SPACING_PARES = 2.0;
    const SPACING_GRUPOS = 10;
    const SPACING_POS = 1.7;
    const SPACING_NIVEL = 1.6;
    const MIN_RACK_WIDTH = 2.0;
    const PALLET_FILL_W = 0.874;
    const PALLET_FILL_D = 0.855;
    const PALLET_FILL_H = 0.76;

    const filtro = this._filtroActivo();
    let offsetX = 0;
    let maxZ = 0;
    let maxYGlobal = 0;

    for (let idxArea = 0; idxArea < areasOrdenadas.length; idxArea++) {
      const [, ubicaciones] = areasOrdenadas[idxArea];
      if (ubicaciones.length === 0) continue;

      const posiciones = [...new Set(ubicaciones.map(u => u.posicionId ?? 0))].sort((a, b) => a - b);
      const niveles = [...new Set(ubicaciones.map(u => this._nivelANumero(u.nivelId)))].sort((a, b) => a - b);
      const posIndex = new Map(posiciones.map((p, i) => [p, i]));
      const nivIndex = new Map(niveles.map((n, i) => [n, i]));

      const anchoRack = Math.max(
        Math.max(...ubicaciones.map(u => u.width)) * ESCALA_CUBO,
        MIN_RACK_WIDTH,
      );
      const alturaRack = niveles.length * SPACING_NIVEL;
      const maxHeightStack = alturaRack + Math.max(...ubicaciones.map(u => u.height)) * ESCALA_CUBO;

      for (const u of ubicaciones) {
        const ix = posIndex.get(u.posicionId ?? 0) ?? 0;
        const iy = nivIndex.get(this._nivelANumero(u.nivelId)) ?? 0;
        const centroX = offsetX + anchoRack / 2;

        const resaltar = !filtro || this._perteneceAFiltro(u);
        const tpl = resaltar ? this._templateParaColor(u._color) : this.dimTemplate!;
        const inst = tpl.createInstance(`u-${u.id}`);

        const ocupada = u.estadoOcupacion === 'Ocupada';
        const w = anchoRack * PALLET_FILL_W;
        const d = SPACING_POS * PALLET_FILL_D;
        if (ocupada) {
          const h = SPACING_NIVEL * PALLET_FILL_H;
          inst.scaling.set(w, h, d);
          inst.position.set(centroX, iy * SPACING_NIVEL + h / 2 + 0.05, ix * SPACING_POS);
        } else {
          // Libre: pad bajo pintado con el color de la zona (se ve la asignación aunque esté vacía).
          const h = SPACING_NIVEL * 0.16;
          inst.scaling.set(w, h, d);
          inst.position.set(centroX, iy * SPACING_NIVEL + h / 2 + 0.02, ix * SPACING_POS);
        }

        inst.isPickable = true;
        inst.metadata = u;
        inst.freezeWorldMatrix();
        inst.doNotSyncBoundingInfo = true;
        this.boxes.push(inst);
        if (inst.position.z > maxZ) maxZ = inst.position.z;
      }

      this._construirEstructuraRack({
        offsetX, ancho: anchoRack,
        numPosiciones: posiciones.length, numNiveles: niveles.length,
        spacingPos: SPACING_POS, spacingNivel: SPACING_NIVEL, alturaRack,
      });

      const xNumero = (idxArea % 2 === 0) ? offsetX + anchoRack + 0.45 : offsetX - 0.45;
      for (let i = 0; i < posiciones.length; i++) {
        const z = i * SPACING_POS;
        const numero = String(posiciones[i]).padStart(2, '0');
        this.numerosPiso.push(this._crearNumeroPiso(numero, xNumero, z));
      }

      const zFondo = (posiciones.length - 1) * SPACING_POS + 2.0;
      const yEncimaRack = maxHeightStack + 1.5;
      this._crearLabelArea(
        ubicaciones[0].areaNombre || `Área ${ubicaciones[0].areaId ?? '?'}`,
        offsetX + anchoRack / 2, yEncimaRack, zFondo,
      );
      if (yEncimaRack > maxYGlobal) maxYGlobal = yEncimaRack;

      const esUltimo = idxArea === areasOrdenadas.length - 1;
      if (!esUltimo) {
        const spacingAlSiguiente = (idxArea % 2 === 0) ? SPACING_GRUPOS : SPACING_PARES;
        offsetX += anchoRack + spacingAlSiguiente;
      } else {
        offsetX += anchoRack;
      }
    }

    if (!this.mostrarEstructuraRack) {
      for (const r of this.rackInstances) r.setEnabled(false);
    }

    this.piso = this._construirPiso(offsetX, maxZ + 4);
    if (this.modoEdicion) this._pintarSeleccion();
    this._encajarCamara();
  }

  /** Opciones de los dropdowns (zona/cliente) y resumen para el panel + leyenda. */
  private _construirOpcionesYResumen(filtradas: Ubicacion3D[]): void {
    // Agregado por zona
    const mapZona = new Map<number | null, ZonaResumen>();
    for (const u of filtradas) {
      const key = u.zonaId;
      let r = mapZona.get(key);
      if (!r) {
        r = {
          zonaId: u.zonaId,
          nombre: u.zonaNombre || (u.zonaId == null ? 'Sin zona' : `Zona ${u.zonaId}`),
          color: u._color,
          cliente: u.propietarioNombreCorto || null,
          total: 0, ocupadas: 0, libres: 0, pct: 0,
        };
        mapZona.set(key, r);
      }
      r.total++;
      if (u.estadoOcupacion === 'Ocupada') r.ocupadas++;
    }
    const resumen = [...mapZona.values()].map(r => ({
      ...r,
      libres: r.total - r.ocupadas,
      pct: r.total > 0 ? Math.round((r.ocupadas / r.total) * 100) : 0,
    }));
    // Zonas reales primero (orden alfabético), "Sin zona" al final.
    resumen.sort((a, b) => {
      if (a.zonaId == null) return 1;
      if (b.zonaId == null) return -1;
      return a.nombre.localeCompare(b.nombre, undefined, { numeric: true });
    });
    this.zonasResumen = resumen;
    this.resumenChange.emit(resumen);

    this.zonasOpciones = [
      { label: 'Todas las zonas', value: null },
      ...resumen.filter(r => r.zonaId != null).map(r => ({ label: r.nombre, value: r.zonaId })),
    ];

    // Clientes presentes (por NombreCorto dominante de zona)
    const clientes = new Set<string>();
    for (const u of filtradas) {
      if (u.propietarioNombreCorto) clientes.add(u.propietarioNombreCorto);
    }
    this.clientesOpciones = [
      { label: 'Todos los propietarios', value: null },
      ...[...clientes].sort((a, b) => a.localeCompare(b)).map(c => ({ label: c, value: c })),
    ];

    // Detalle de la zona seleccionada
    if (this.zonaSeleccionada != null) {
      const ubicZona = filtradas.filter(u => u.zonaId === this.zonaSeleccionada);
      const rz = resumen.find(r => r.zonaId === this.zonaSeleccionada);
      if (rz && ubicZona.length > 0) {
        const mapaCli = new Map<string, number>();
        for (const u of ubicZona) {
          if (u.estadoOcupacion === 'Ocupada' && u.propietarioNombre) {
            const k = u.propietarioNombre.trim();
            mapaCli.set(k, (mapaCli.get(k) ?? 0) + 1);
          }
        }
        const clientesLista = [...mapaCli.entries()]
          .map(([nombre, ocupadas]) => ({
            nombre, ocupadas,
            pct: rz.total > 0 ? Math.round((ocupadas / rz.total) * 100) : 0,
          }))
          .sort((a, b) => b.ocupadas - a.ocupadas);

        this.zonaDetalle = {
          nombre: rz.nombre, color: rz.color, cliente: rz.cliente,
          total: rz.total, ocupadas: rz.ocupadas, libres: rz.libres, pct: rz.pct,
          clientes: clientesLista,
        };
      } else {
        this.zonaDetalle = null;
      }
    } else {
      this.zonaDetalle = null;
    }
  }

  // ─── Estructura del rack (idéntico al reporte de capacidad) ─────────────────

  private _construirEstructuraRack(opts: {
    offsetX: number; ancho: number; numPosiciones: number; numNiveles: number;
    spacingPos: number; spacingNivel: number; alturaRack: number;
  }): void {
    if (!this.rackTemplates.poste || !this.rackTemplates.viga || !this.rackTemplates.diagonal) return;
    if (opts.numPosiciones <= 0 || opts.numNiveles <= 0) return;

    const POSTE_GROSOR = 0.10;
    const VIGA_GROSOR = 0.06;
    const VIGA_PROFUNDIDAD = 0.10;
    const DIAG_GROSOR = 0.05;

    const alturaPostes = opts.alturaRack;
    const zCentro = (opts.numPosiciones - 1) * opts.spacingPos / 2;
    const longitudPasillo = opts.numPosiciones * opts.spacingPos;

    for (let lado = 0; lado < 2; lado++) {
      const x = lado === 0 ? opts.offsetX : opts.offsetX + opts.ancho;
      for (let i = 0; i <= opts.numPosiciones; i++) {
        const z = (i - 0.5) * opts.spacingPos;
        const poste = this.rackTemplates.poste.createInstance(`poste-${opts.offsetX.toFixed(1)}-${lado}-${i}`);
        poste.scaling.set(POSTE_GROSOR, alturaPostes, POSTE_GROSOR);
        poste.position.set(x, alturaPostes / 2, z);
        poste.isPickable = false; poste.freezeWorldMatrix(); poste.doNotSyncBoundingInfo = true;
        this.rackInstances.push(poste);
      }
    }

    for (let lado = 0; lado < 2; lado++) {
      const x = lado === 0 ? opts.offsetX : opts.offsetX + opts.ancho;
      for (let iy = 0; iy < opts.numNiveles; iy++) {
        const y = iy * opts.spacingNivel;
        const viga = this.rackTemplates.viga.createInstance(`viga-${opts.offsetX.toFixed(1)}-${lado}-${iy}`);
        viga.scaling.set(VIGA_PROFUNDIDAD, VIGA_GROSOR, longitudPasillo);
        viga.position.set(x, y, zCentro);
        viga.isPickable = false; viga.freezeWorldMatrix(); viga.doNotSyncBoundingInfo = true;
        this.rackInstances.push(viga);
      }
    }

    const diagLen = Math.sqrt(opts.ancho * opts.ancho + opts.alturaRack * opts.alturaRack);
    const ang = Math.atan2(opts.ancho, opts.alturaRack);
    const zExtremos = [-0.5 * opts.spacingPos, (opts.numPosiciones - 0.5) * opts.spacingPos];

    for (let e = 0; e < zExtremos.length; e++) {
      const z = zExtremos[e];
      const d1 = this.rackTemplates.diagonal.createInstance(`diag-${opts.offsetX.toFixed(1)}-${e}-a`);
      d1.scaling.set(DIAG_GROSOR, diagLen, DIAG_GROSOR);
      d1.position.set(opts.offsetX + opts.ancho / 2, opts.alturaRack / 2, z);
      d1.rotation.z = ang;
      d1.isPickable = false; d1.freezeWorldMatrix(); d1.doNotSyncBoundingInfo = true;
      this.rackInstances.push(d1);

      const d2 = this.rackTemplates.diagonal.createInstance(`diag-${opts.offsetX.toFixed(1)}-${e}-b`);
      d2.scaling.set(DIAG_GROSOR, diagLen, DIAG_GROSOR);
      d2.position.set(opts.offsetX + opts.ancho / 2, opts.alturaRack / 2, z);
      d2.rotation.z = -ang;
      d2.isPickable = false; d2.freezeWorldMatrix(); d2.doNotSyncBoundingInfo = true;
      this.rackInstances.push(d2);
    }
  }

  private _crearNumeroPiso(texto: string, x: number, z: number): Mesh {
    const ANCHO = 1.0, ALTO = 0.7, TEX_W = 256, TEX_H = 180;
    const idSuffix = `${x.toFixed(2)}-${z.toFixed(2)}`;

    const plane = MeshBuilder.CreatePlane(`numPiso-${idSuffix}`, { width: ANCHO, height: ALTO }, this.scene!);
    plane.position.set(x, 0.02, z);
    plane.rotation.x = Math.PI / 2;
    plane.isPickable = false;
    plane.doNotSyncBoundingInfo = true;
    plane.alwaysSelectAsActiveMesh = true;

    const dt = new DynamicTexture(`dtNumPiso-${idSuffix}`, { width: TEX_W, height: TEX_H }, this.scene!, true);
    dt.hasAlpha = true;
    const ctx = dt.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, TEX_W, TEX_H);
    const r = 28, x0 = 12, y0 = 12, x1 = TEX_W - 12, y1 = TEX_H - 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0); ctx.lineTo(x1 - r, y0); ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
    ctx.lineTo(x1, y1 - r); ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
    ctx.lineTo(x0 + r, y1); ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
    ctx.lineTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(texto, TEX_W / 2, TEX_H / 2 + 6);
    dt.update();

    const mat = new StandardMaterial(`matNumPiso-${idSuffix}`, this.scene!);
    mat.diffuseTexture = dt;
    mat.opacityTexture = dt;
    mat.useAlphaFromDiffuseTexture = true;
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.specularColor = new Color3(0, 0, 0);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    plane.material = mat;
    return plane;
  }

  private _crearLabelArea(texto: string, x: number, y: number, z: number): void {
    if (!this.scene || !this.gui) return;
    const anchor = new TransformNode(`labelAnchor-${texto}-${x}`, this.scene);
    anchor.position = new Vector3(x, y, z);

    const rect = new Rectangle(`labelRect-${texto}-${x}`);
    rect.adaptWidthToChildren = true;
    rect.adaptHeightToChildren = true;
    rect.cornerRadius = 12;
    rect.background = 'rgba(15, 23, 42, 0.82)';
    rect.color = 'rgba(99, 102, 241, 0.95)';
    rect.thickness = 2;
    rect.paddingLeft = '14px'; rect.paddingRight = '14px';
    rect.paddingTop = '6px'; rect.paddingBottom = '6px';
    rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    const tb = new TextBlock();
    tb.text = texto; tb.color = 'white';
    tb.fontFamily = 'Segoe UI, Arial, sans-serif';
    tb.fontSize = 22; tb.fontWeight = 'bold'; tb.resizeToFit = true;
    rect.addControl(tb);

    this.gui.addControl(rect);
    rect.linkWithMesh(anchor as unknown as AbstractMesh);
    rect.linkOffsetY = -8;
    this.labelAnchors.push(anchor);
    this.labelControls.push(rect);
  }

  private _construirPiso(anchoX: number, profZ: number): Mesh {
    const piso = MeshBuilder.CreateGround('piso', { width: anchoX + 4, height: profZ + 4 }, this.scene);
    piso.position = new Vector3(anchoX / 2 - 2, -0.05, profZ / 2 - 2);
    const mat = new StandardMaterial('matPiso', this.scene);
    const g = new Color3(0.82, 0.84, 0.88);
    mat.diffuseColor = g; mat.emissiveColor = g;
    mat.specularColor = new Color3(0, 0, 0);
    mat.disableLighting = true; mat.alpha = 0.95;
    piso.material = mat;
    piso.isPickable = false;
    return piso;
  }

  private _encajarCamara(): void {
    if (!this.scene || !this.camera) return;
    const cubos = this.boxes.filter(m => m.isPickable && m.metadata);
    if (cubos.length === 0 && this.labelAnchors.length === 0) {
      this.camera.target = Vector3.Zero();
      this.camera.radius = 30;
      return;
    }
    let min = new Vector3(Infinity, Infinity, Infinity);
    let max = new Vector3(-Infinity, -Infinity, -Infinity);
    const incluir = (p: Vector3) => {
      if (p.x < min.x) min.x = p.x; if (p.x > max.x) max.x = p.x;
      if (p.y < min.y) min.y = p.y; if (p.y > max.y) max.y = p.y;
      if (p.z < min.z) min.z = p.z; if (p.z > max.z) max.z = p.z;
    };
    for (const m of cubos) incluir(m.position);
    for (const a of this.labelAnchors) incluir(a.position);
    const center = Vector3.Center(min, max);
    const size = max.subtract(min).length();
    this.camera.target = center;
    this.camera.radius = Math.max(size * 0.55, 10);
  }

  private _nivelANumero(nivel: string | null): number {
    if (nivel == null) return 0;
    const n = Number(nivel);
    if (!Number.isNaN(n)) return n;
    return nivel.charCodeAt(0) - 64;
  }

  private _safeDim(v: any, fallback: number): number {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return n;
  }
}
