import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
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
  Engine,
  HemisphericLight,
  DirectionalLight,
  InstancedMesh,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from '@babylonjs/gui';
import { UbicacionService } from '../../../_services/ubicacion.service';
import { InventarioService } from '../../../_services/inventario.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
}

interface AreaOption {
  label: string;
  value: number | null;
}

@Component({
  selector: 'app-almacen3d-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ProgressSpinnerModule, TagModule, DynamicDialogModule],
  providers: [DialogService],
  templateUrl: './almacen3d-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Almacen3dViewerComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() almacenId!: number;
  @Input() almacenNombre = '';
  /** Si se setea: muestra los pasillos donde el propietario tiene mercancía y resalta sus ubicaciones. */
  @Input() propietarioId?: number | null;
  /** Si se setea: el dropdown de área arranca con esa área seleccionada. */
  @Input() areaIdInicial?: number | null;

  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  cargando = true;
  total = 0;
  ocupadas = 0;
  libres = 0;

  areas: AreaOption[] = [{ label: 'Todas las áreas', value: null }];
  areaSeleccionada: number | null = null;

  hoverInfo: { nombre: string; estado: string; area: string; lods: number; unidades: number } | null = null;
  selectedInfo: Ubicacion3D | null = null;
  detalleCargando = false;
  detalleLods: any[] = [];

  // Dashboard cuando se ve un solo pasillo (área filtrada)
  dashboardArea: {
    nombre: string;
    total: number;
    ocupadas: number;
    libres: number;
    pct: number;
    clientes: { nombre: string; ocupadas: number; pct: number }[];
  } | null = null;

  private engine?: Engine;
  private scene?: Scene;
  private camera?: ArcRotateCamera;
  private boxes: (Mesh | InstancedMesh)[] = [];
  private piso?: Mesh;
  private templates: { libre?: Mesh; ocupada?: Mesh; otro?: Mesh; resaltada?: Mesh; naranja?: Mesh } = {};
  hayFiltroPropietario = false;
  clienteSeleccionado: string | null = null;
  private resaltadasSet = new Set<number>();
  private labelAnchors: TransformNode[] = [];
  private labelControls: Rectangle[] = [];
  private gui?: AdvancedDynamicTexture;
  private materials: { libre?: StandardMaterial; ocupada?: StandardMaterial; otro?: StandardMaterial } = {};
  private todas: Ubicacion3D[] = [];
  private resizeObs?: ResizeObserver;
  private dialogRef?: DynamicDialogRef;
  private detalleSub?: Subscription;

  // Para distinguir click de drag (rotar/pan)
  private pointerDownX = 0;
  private pointerDownY = 0;
  private pointerMoved = false;
  private pointerIsDown = false;
  private readonly DRAG_THRESHOLD = 5;

  constructor(
    private ubicacionService: UbicacionService,
    private inventarioService: InventarioService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    // Esperar a que el dialog termine su animación de apertura
    // (sin esto el canvas arranca con tamaño cercano a 0 → render borroso al hacer resize tardío).
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
    this.gui?.dispose();
    this.scene?.dispose();
    this.engine?.dispose();
  }

  onAreaChange(): void {
    // Cambiar de pasillo limpia el resaltado de cliente (los clientes son por pasillo)
    this.clienteSeleccionado = null;
    this._render();
  }

  toggleCliente(nombre: string): void {
    this.clienteSeleccionado = this.clienteSeleccionado === nombre ? null : nombre;
    this._render();
    this.cdr.markForCheck();
  }

  resetCamera(): void {
    if (!this.camera) return;
    this._encajarCamara();
  }

  vistaIsometrica(): void {
    if (!this.camera) return;
    this.camera.alpha = -Math.PI / 2.5;
    this.camera.beta = Math.PI / 3.2;
    this._encajarCamara();
  }

  vistaSuperior(): void {
    if (!this.camera) return;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = 0.05;                       // casi vertical (top-down)
    this._encajarCamara();
  }

  vistaLateral(): void {
    if (!this.camera) return;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = Math.PI / 2 - 0.05;         // casi horizontal (elevación)
    this._encajarCamara();
  }

  private _initEngine(): void {
    const canvas = this.canvasRef.nativeElement;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      adaptToDeviceRatio: true,
    });
    // Render nítido en pantallas HiDPI/Retina.
    this.engine.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1));
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.04, 0.06, 0.15, 1);

    this.camera = new ArcRotateCamera(
      'cam',
      -Math.PI / 2.5,
      Math.PI / 3.2,
      40,
      Vector3.Zero(),
      this.scene
    );
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 500;
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.panningSensibility = 50;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene).intensity = 0.7;
    const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, -0.5), this.scene);
    dir.intensity = 0.6;

    // Materiales reutilizables — flat shaded (sin sombras ni reflejos) para mejor lectura.
    const makeFlat = (name: string, r: number, g: number, b: number): StandardMaterial => {
      const m = new StandardMaterial(name, this.scene);
      m.diffuseColor = new Color3(r, g, b);
      m.emissiveColor = new Color3(r, g, b);       // mismo color emitido → toda cara igual
      m.specularColor = new Color3(0, 0, 0);       // sin reflejos
      m.disableLighting = true;                    // ignora luces de la escena
      return m;
    };

    // Libre = blanco (ligero tinte frío para evitar saturación pura sobre fondo oscuro)
    this.materials.libre = makeFlat('matLibre', 0.96, 0.97, 0.98);
    // Ocupada = verde oscuro mate (estilo emerald-700)
    this.materials.ocupada = makeFlat('matOcup', 0.04, 0.42, 0.18);
    // Otro estado = ámbar mate
    this.materials.otro = makeFlat('matOtro', 0.70, 0.40, 0.02);
    // Resaltada (propietario seleccionado en el modo "Ver 3D por propietario") = verde brillante
    const resaltada = makeFlat('matResalt', 0.14, 0.86, 0.40);
    // Naranja (cliente seleccionado en el dashboard del pasillo)
    const naranja = makeFlat('matNaranja', 0.98, 0.55, 0.10);

    // Templates unitarios para instancing — UN solo mesh + UNA geometría por material.
    // Cada cubo será un InstancedMesh con scaling y posición propios.
    const mkTemplate = (name: string, mat: StandardMaterial): Mesh => {
      const t = MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
      t.material = mat;
      t.isVisible = false;            // el template no se dibuja, solo las instancias.
      t.doNotSyncBoundingInfo = true;
      return t;
    };
    this.templates.libre = mkTemplate('tplLibre', this.materials.libre!);
    this.templates.ocupada = mkTemplate('tplOcup', this.materials.ocupada!);
    this.templates.otro = mkTemplate('tplOtro', this.materials.otro!);
    this.templates.resaltada = mkTemplate('tplResalt', resaltada);
    this.templates.naranja = mkTemplate('tplNaranja', naranja);

    // Hover + click sobre cubos
    this.scene.onPointerObservable.add(pi => {
      const ev = pi.event as PointerEvent;

      if (pi.type === PointerEventTypes.POINTERDOWN) {
        this.pointerDownX = ev.clientX;
        this.pointerDownY = ev.clientY;
        this.pointerMoved = false;
        this.pointerIsDown = true;
        // Ocultar hover mientras se arrastra (evita parpadeo durante la rotación)
        if (this.hoverInfo) { this.hoverInfo = null; this.cdr.markForCheck(); }
        return;
      }

      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (this.pointerIsDown) {
          if (Math.abs(ev.clientX - this.pointerDownX) > this.DRAG_THRESHOLD ||
              Math.abs(ev.clientY - this.pointerDownY) > this.DRAG_THRESHOLD) {
            this.pointerMoved = true;
          }
          // Saltarse el pick mientras se está arrastrando → elimina el delay al rotar
          return;
        }

        const pick = this.scene!.pick(this.scene!.pointerX, this.scene!.pointerY);
        const data = pick?.hit ? (pick.pickedMesh?.metadata as Ubicacion3D | undefined) : undefined;
        if (data) {
          this.hoverInfo = {
            nombre: data.nombre,
            estado: data.estadoOcupacion,
            area: data.areaNombre || '-',
            lods: data.totalLods,
            unidades: data.totalUnidades,
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
        // Solo procesar el click si fue tap (no drag) y con botón izquierdo
        if (this.pointerMoved || ev.button !== 0) return;
        const pick = this.scene!.pick(this.scene!.pointerX, this.scene!.pointerY);
        const data = pick?.hit ? (pick.pickedMesh?.metadata as Ubicacion3D | undefined) : undefined;
        // Click en cubo → fija la selección (panel con detalle inline)
        // Click en vacío → limpia la selección
        this.selectedInfo = data ?? null;
        this._cargarDetalleInline(data);
        this.cdr.markForCheck();
      }
    });

    // Capa 2D que se proyecta encima de la escena 3D (para los carteles de área)
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('areaLabelsUI', true, this.scene);

    this.engine.runRenderLoop(() => this.scene?.render());
    window.addEventListener('resize', this._onResize);

    // Observar el contenedor: al abrir el modal, hacer resize cuando crezca.
    this.resizeObs = new ResizeObserver(() => this.engine?.resize());
    this.resizeObs.observe(canvas);
    if (canvas.parentElement) this.resizeObs.observe(canvas.parentElement);

    // Forzar resize inicial por si el canvas arrancó con tamaño 0.
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
    // Cancelar fetch previo
    this.detalleSub?.unsubscribe();
    this.detalleLods = [];

    if (!u) {
      this.detalleCargando = false;
      return;
    }
    // Si está libre (no hay lods reportados) no llamamos al backend.
    if ((u.totalLods ?? 0) === 0) {
      this.detalleCargando = false;
      return;
    }

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
    // Cerrar uno previo si seguía abierto
    this.dialogRef?.close();
    this.dialogRef = this.dialogService.open(InventarioUbicacionDialogComponent, {
      header: `Contenido — ${u.nombre}`,
      width: '900px',
      modal: true,
      dismissableMask: true,
      data: {
        ubicacionId: u.id,
        ubicacionNombre: u.nombre,
      },
      // Asegurar que aparezca por encima del p-dialog del visor 3D
      baseZIndex: 10000,
    });
  }

  private _cargar(): void {
    this.cargando = true;
    this.hayFiltroPropietario = !!this.propietarioId && this.propietarioId > 0;
    this.clienteSeleccionado = null;     // limpiar resaltado por cliente al recargar

    // Fetch en paralelo: todas las ubicaciones + (opcional) IDs ocupados por el propietario.
    const ubic$ = this.ubicacionService.getUbicaciones(this.almacenId);
    const ocup$ = this.hayFiltroPropietario
      ? this.inventarioService
          .getUbicacionesOcupadasByPropietarioAlmacen(this.propietarioId!, this.almacenId)
          .pipe(catchError(() => of([])))
      : of([] as any[]);

    forkJoin([ubic$, ocup$]).subscribe({
      next: ([rows, ocupadas]) => {
        // Set de IDs ocupados por el propietario (vacío si no hay filtro)
        this.resaltadasSet = new Set<number>(
          (ocupadas || []).map((o: any) => Number(o.ubicacionId ?? o.UbicacionId)).filter((n: number) => !!n)
        );

        const todas: Ubicacion3D[] = (rows || [])
          .filter((u: any) => u.activo !== false)
          .map((u: any) => ({
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
          }));

        if (this.hayFiltroPropietario && this.resaltadasSet.size > 0) {
          // Determinar las áreas (pasillos) donde el propietario tiene mercancía
          const areasConMercaderia = new Set<number>();
          for (const u of todas) {
            if (this.resaltadasSet.has(u.id) && u.areaId != null) {
              areasConMercaderia.add(u.areaId);
            }
          }
          // Conservar SOLO esos pasillos completos
          this.todas = todas.filter(u => u.areaId != null && areasConMercaderia.has(u.areaId));
        } else {
          this.todas = todas;
        }

        this._construirAreas();
        // Preselección de área si llegó como input
        if (this.areaIdInicial != null && this.areas.some(a => a.value === this.areaIdInicial)) {
          this.areaSeleccionada = this.areaIdInicial;
        }
        this._render();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  private _construirAreas(): void {
    const map = new Map<number, string>();
    for (const u of this.todas) {
      if (u.areaId != null && !map.has(u.areaId)) {
        map.set(u.areaId, u.areaNombre || `Área ${u.areaId}`);
      }
    }
    this.areas = [
      { label: 'Todas las áreas', value: null },
      ...[...map.entries()]
        .sort(([, a], [, b]) => a.localeCompare(b))
        .map(([value, label]) => ({ label, value })),
    ];
  }

  private _render(): void {
    if (!this.scene) return;

    // limpiar boxes, piso y labels anteriores
    for (const b of this.boxes) b.dispose();
    this.boxes = [];
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
    if (this.hayFiltroPropietario) {
      // Cuando hay propietario: "ocupadas" = ubicaciones del propietario, "otras" = libres + de otros
      this.ocupadas = filtradas.filter(u => this.resaltadasSet.has(u.id)).length;
      this.libres = this.total - this.ocupadas;
    } else {
      this.ocupadas = filtradas.filter(u => u.estadoOcupacion === 'Ocupada').length;
      this.libres = this.total - this.ocupadas;
    }

    if (filtradas.length === 0) {
      this._encajarCamara();
      return;
    }

    // Layout: agrupar por área en bloques separados sobre el eje X.
    // Dentro de cada área: nivel = Y, posición = Z.
    const porArea = new Map<number, Ubicacion3D[]>();
    for (const u of filtradas) {
      const key = u.areaId ?? -1;
      if (!porArea.has(key)) porArea.set(key, []);
      porArea.get(key)!.push(u);
    }

    const areasOrdenadas = [...porArea.entries()].sort(([a], [b]) => a - b);
    const ESCALA_CUBO = 0.55;
    const SPACING_AREA = 10;       // separación entre pasillos paralelos
    const SPACING_POS = 1.7;
    const SPACING_NIVEL = 1.6;

    let offsetX = 0;
    let maxZ = 0;
    let maxYGlobal = 0;

    for (const [, ubicaciones] of areasOrdenadas) {
      const posiciones = [...new Set(ubicaciones.map(u => u.posicionId ?? 0))].sort((a, b) => a - b);
      const niveles = [...new Set(ubicaciones.map(u => this._nivelANumero(u.nivelId)))].sort((a, b) => a - b);
      const posIndex = new Map(posiciones.map((p, i) => [p, i]));
      const nivIndex = new Map(niveles.map((n, i) => [n, i]));

      const maxWidth = Math.max(...ubicaciones.map(u => u.width)) * ESCALA_CUBO;
      const maxHeightStack = niveles.length * SPACING_NIVEL + Math.max(...ubicaciones.map(u => u.height)) * ESCALA_CUBO;

      for (const u of ubicaciones) {
        const ix = posIndex.get(u.posicionId ?? 0) ?? 0;
        const iy = nivIndex.get(this._nivelANumero(u.nivelId)) ?? 0;

        const w = u.width * ESCALA_CUBO;
        const h = u.height * ESCALA_CUBO;
        const d = u.length * ESCALA_CUBO;

        // INSTANCING: una sola geometría compartida → carga y render mucho más rápidos.
        const tpl = this._templateForUbicacion(u);
        const inst = tpl.createInstance(`u-${u.id}`);
        inst.scaling.set(w, h, d);
        inst.position.set(
          offsetX + w / 2,
          iy * SPACING_NIVEL + h / 2,
          ix * SPACING_POS,
        );
        inst.metadata = u;
        inst.freezeWorldMatrix();
        inst.doNotSyncBoundingInfo = true;
        this.boxes.push(inst);

        if (inst.position.z > maxZ) maxZ = inst.position.z;
      }

      // Cartel del área al fondo del pasillo
      const zFondo = (posiciones.length - 1) * SPACING_POS + 2.0;
      const yEncimaRack = maxHeightStack + 1.5;
      this._crearLabelArea(
        ubicaciones[0].areaNombre || `Área ${ubicaciones[0].areaId ?? '?'}`,
        offsetX + maxWidth / 2, yEncimaRack, zFondo,
        maxWidth + 2, 3,
      );

      if (yEncimaRack > maxYGlobal) maxYGlobal = yEncimaRack;
      offsetX += maxWidth + SPACING_AREA;
    }

    // Piso cubriendo todos los pasillos
    this.piso = this._construirPiso(offsetX, maxZ + 4);

    // Dashboard cuando se filtra a UN solo pasillo
    this._calcularDashboardArea(filtradas);

    this._encajarCamara();
  }

  private _calcularDashboardArea(filtradas: Ubicacion3D[]): void {
    if (this.areaSeleccionada == null || filtradas.length === 0) {
      this.dashboardArea = null;
      return;
    }
    const total = filtradas.length;
    const ocupadas = filtradas.filter(u => u.estadoOcupacion === 'Ocupada').length;
    const libres = total - ocupadas;
    const pct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

    // Agrupar por propietario (solo las ocupadas con propietarioNombre)
    const mapa = new Map<string, number>();
    for (const u of filtradas) {
      if (u.estadoOcupacion === 'Ocupada' && u.propietarioNombre) {
        const k = u.propietarioNombre.trim();
        mapa.set(k, (mapa.get(k) ?? 0) + 1);
      }
    }
    const clientes = [...mapa.entries()]
      .map(([nombre, ocupadas]) => ({
        nombre,
        ocupadas,
        pct: total > 0 ? Math.round((ocupadas / total) * 100) : 0,
      }))
      .sort((a, b) => b.ocupadas - a.ocupadas);

    const nombreArea = filtradas[0].areaNombre || `Área ${this.areaSeleccionada}`;
    this.dashboardArea = { nombre: nombreArea, total, ocupadas, libres, pct, clientes };
  }

  private _templateFor(estado: string): Mesh {
    if (estado === 'Ocupada') return this.templates.ocupada!;
    if (estado === 'Libre') return this.templates.libre!;
    return this.templates.otro!;
  }

  private _templateForUbicacion(u: Ubicacion3D): Mesh {
    // Si hay filtro de propietario activo, resaltar solo las ubicaciones del propietario.
    if (this.hayFiltroPropietario && this.resaltadasSet.has(u.id)) {
      return this.templates.resaltada!;
    }
    // Si hay filtro pero la ubicación NO es del propietario, mostrarla atenuada (gris/libre)
    // sin importar su estado real → enfatiza visualmente lo que es del propietario.
    if (this.hayFiltroPropietario) return this.templates.libre!;

    // Cliente seleccionado desde el dashboard → naranja en las suyas
    if (this.clienteSeleccionado
        && u.propietarioNombre
        && u.propietarioNombre.trim() === this.clienteSeleccionado) {
      return this.templates.naranja!;
    }

    return this._templateFor(u.estadoOcupacion);
  }

  private _crearLabelArea(texto: string, x: number, y: number, z: number, _ancho: number, _alto: number): void {
    if (!this.scene || !this.gui) return;

    // Ancla 3D invisible donde se "fija" el cartel 2D
    const anchor = new TransformNode(`labelAnchor-${texto}-${x}`, this.scene);
    anchor.position = new Vector3(x, y, z);

    // Cartel HTML-like en GUI 2D
    const rect = new Rectangle(`labelRect-${texto}-${x}`);
    rect.adaptWidthToChildren = true;
    rect.adaptHeightToChildren = true;
    rect.cornerRadius = 12;
    rect.background = 'rgba(15, 23, 42, 0.82)';
    rect.color = 'rgba(99, 102, 241, 0.95)';
    rect.thickness = 2;
    rect.paddingLeft = '14px';
    rect.paddingRight = '14px';
    rect.paddingTop = '6px';
    rect.paddingBottom = '6px';
    rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    const tb = new TextBlock();
    tb.text = texto;
    tb.color = 'white';
    tb.fontFamily = 'Segoe UI, Arial, sans-serif';
    tb.fontSize = 22;
    tb.fontWeight = 'bold';
    tb.resizeToFit = true;
    rect.addControl(tb);

    this.gui.addControl(rect);
    rect.linkWithMesh(anchor as unknown as AbstractMesh);
    rect.linkOffsetY = -8;

    this.labelAnchors.push(anchor);
    this.labelControls.push(rect);
  }

  private _construirPiso(anchoX: number, profZ: number): Mesh {
    const piso = MeshBuilder.CreateGround('piso', {
      width: anchoX + 4,
      height: profZ + 4,
    }, this.scene);
    piso.position = new Vector3(anchoX / 2 - 2, -0.05, profZ / 2 - 2);
    const mat = new StandardMaterial('matPiso', this.scene);
    mat.diffuseColor = new Color3(0.12, 0.16, 0.24);
    mat.emissiveColor = new Color3(0.12, 0.16, 0.24);
    mat.specularColor = new Color3(0, 0, 0);
    mat.disableLighting = true;
    mat.alpha = 0.6;
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
    // 40% más cerca que el encuadre completo (1.3 → 0.78).
    this.camera.radius = Math.max(size * 0.78, 12);
  }

  private _materialFor(estado: string): StandardMaterial {
    if (estado === 'Ocupada') return this.materials.ocupada!;
    if (estado === 'Libre') return this.materials.libre!;
    return this.materials.otro!;
  }

  private _nivelANumero(nivel: string | null): number {
    if (nivel == null) return 0;
    const n = Number(nivel);
    if (!Number.isNaN(n)) return n;
    // si es A, B, C... convertir a 1, 2, 3
    return nivel.charCodeAt(0) - 64;
  }

  private _safeDim(v: any, fallback: number): number {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return n;
  }
}
