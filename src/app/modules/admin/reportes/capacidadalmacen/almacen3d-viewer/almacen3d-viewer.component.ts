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
  DynamicTexture,
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
  mostrarEstructuraRack = true;

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
  private rackInstances: InstancedMesh[] = [];
  private numerosPiso: Mesh[] = [];
  private piso?: Mesh;
  private templates: { libre?: Mesh; ocupada?: Mesh; otro?: Mesh; resaltada?: Mesh; naranja?: Mesh } = {};
  private rackTemplates: { poste?: Mesh; viga?: Mesh; diagonal?: Mesh } = {};
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

  /** Alterna la visibilidad de postes/vigas/diagonales sin re-renderizar la escena. */
  toggleEstructuraRack(): void {
    this.mostrarEstructuraRack = !this.mostrarEstructuraRack;
    for (const r of this.rackInstances) r.setEnabled(this.mostrarEstructuraRack);
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
    // Fondo gris muy claro: deja que las estructuras del rack (azul/amarillo)
    // y los pallets verdes destaquen como en un layout de almacén real.
    this.scene.clearColor = new Color4(0.94, 0.95, 0.97, 1);

    // Vista inicial: perspectiva casi lateral con leve elevación y zoom
    // cercano — se ven los pallets de costado, los números de posición en el
    // piso quedan en primer plano y el pasillo se aprecia bien a lo largo.
    this.camera = new ArcRotateCamera(
      'cam',
      -Math.PI / 2.2,   // alpha: casi lateral, ligeramente girado para perspectiva
       Math.PI / 2.6,   // beta: ~70° → poca elevación, vista frontal del rack
       40,              // radius (lo sobreescribe _encajarCamara)
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

    // Bordes negros en los pallets visibles → marcan las 12 aristas del cubo
    // y la percepción 3D mejora bastante. enableEdgesRendering() solo dibuja
    // los bordes del template; necesitamos edgesShareWithInstances=true para
    // que las instancias hereden esos edges (sin esto el master muestra los
    // bordes pero las copias no, que es exactamente el bug que se veía).
    const enableEdges = (m: Mesh): void => {
      m.enableEdgesRendering();
      m.edgesWidth = 1.5;
      m.edgesColor = new Color4(0, 0, 0, 1);
      m.edgesShareWithInstances = true;
    };
    enableEdges(this.templates.ocupada);
    enableEdges(this.templates.otro);
    enableEdges(this.templates.resaltada);
    enableEdges(this.templates.naranja);

    // ===== Estructura del rack (postes + largueros + diagonales) =====
    // Pintar la estructura física del rack alrededor de cada pasillo da una
    // lectura mucho más cercana a la realidad: postes azules verticales,
    // largueros amarillos por nivel, diagonales X en los extremos.
    const matPoste = makeFlat('matPoste', 0.09, 0.22, 0.78);    // azul intenso
    const matViga = makeFlat('matViga', 0.98, 0.78, 0.10);      // amarillo
    const matDiag = makeFlat('matDiag', 0.05, 0.14, 0.55);      // azul más oscuro
    this.rackTemplates.poste = mkTemplate('tplPoste', matPoste);
    this.rackTemplates.viga = mkTemplate('tplViga', matViga);
    this.rackTemplates.diagonal = mkTemplate('tplDiag', matDiag);

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

  /**
   * Áreas que NO son racks (puertas, zonas de despacho, recepción, staging,
   * pre-despacho, rechazos, etc.). El 3D no las dibuja — sólo muestra racks
   * de almacenamiento.
   */
  private _esPuertaOZona(nombre: string | null | undefined): boolean {
    if (!nombre) return false;
    const n = nombre.toUpperCase().trim();
    return (
      n.includes('PUERTA') ||
      n.includes('DOOR') ||
      n.includes('DESPACHO') ||
      n.includes('RECEP') ||
      n.includes('STAGING') ||
      n.includes('PRE-') ||
      n.includes('PRE ') ||
      n.includes('RECHAZ') ||
      n.includes('ZONA') ||
      // "AREA A", "AREA B", "AREA DE PICKING"... son zonas, no pasillos.
      // Los pasillos reales se llaman con 1 letra (A, B, ...) o 2 iguales (AA, BB).
      n.startsWith('AREA ') ||
      n.startsWith('ÁREA ')
    );
  }

  /**
   * Detecta si un nombre de área es la "espalda" de otra (AA, BB, CC, DD...).
   * Convención del almacén: el rack físico tiene 2 caras; la cara frente se
   * llama X y la espalda XX. En el 3D dibujamos UN solo rack doble.
   */
  private _esEspaldaArea(nombre: string | null | undefined): boolean {
    if (!nombre) return false;
    const n = nombre.trim();
    if (n.length !== 2) return false;
    return n[0].toUpperCase() === n[1].toUpperCase();
  }

  /** Nombre del rack base ("BB" → "B"). Para áreas frente devuelve el nombre tal cual. */
  private _baseDeArea(nombre: string | null | undefined): string {
    const n = (nombre ?? '').trim();
    if (this._esEspaldaArea(n)) return n[0].toUpperCase();
    return n.toUpperCase();
  }

  private _construirAreas(): void {
    const map = new Map<number, string>();
    for (const u of this.todas) {
      if (u.areaId != null && !map.has(u.areaId)) {
        const nombre = u.areaNombre || `Área ${u.areaId}`;
        // No mostramos puertas/zonas en el dropdown — no son racks.
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

  private _render(): void {
    if (!this.scene) return;

    // limpiar boxes, estructura del rack, piso, números y labels anteriores
    for (const b of this.boxes) b.dispose();
    this.boxes = [];
    for (const r of this.rackInstances) r.dispose();
    this.rackInstances = [];
    for (const n of this.numerosPiso) {
      // Cada número tiene su propio material + DynamicTexture → liberarlos también.
      const mat = n.material as StandardMaterial | null;
      const tex = mat?.diffuseTexture as DynamicTexture | null;
      tex?.dispose();
      mat?.dispose();
      n.dispose();
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

    // Cada área = un rack independiente. Las áreas "doble letra" (BB, CC...)
    // se renderizan como racks aparte (alfabéticamente junto a su letra base
    // pero como pasillos separados). Las "puertas/zonas" se filtran.
    const porArea = new Map<number, Ubicacion3D[]>();
    for (const u of filtradas) {
      const nombre = (u.areaNombre ?? '').trim();
      if (!nombre || this._esPuertaOZona(nombre)) continue;
      const key = u.areaId ?? -1;
      if (!porArea.has(key)) porArea.set(key, []);
      porArea.get(key)!.push(u);
    }

    // Sort alfabético por areaNombre. Con esto el orden queda:
    //   A, B, BB, C, CC, D, DD, ..., O, OO, P
    const areasOrdenadas = [...porArea.entries()].sort(([, ua], [, ub]) => {
      const nA = ua[0]?.areaNombre ?? '';
      const nB = ub[0]?.areaNombre ?? '';
      return nA.localeCompare(nB, undefined, { numeric: true, sensitivity: 'base' });
    });

    if (areasOrdenadas.length === 0) {
      this._encajarCamara();
      return;
    }

    const ESCALA_CUBO = 0.55;
    // Layout pareado: idx par → spacing GRANDE al siguiente (calle de
    // circulación), idx impar → spacing CHICO al siguiente (par interno).
    // Con el orden A, B, BB, C, CC, ..., O, OO, P resulta:
    //   A | gap | B-BB | gap | C-CC | gap | D-DD | ... | O-OO | gap | P
    const SPACING_PARES = 2.0;
    const SPACING_GRUPOS = 10;
    const SPACING_POS = 1.7;
    const SPACING_NIVEL = 1.6;
    const MIN_RACK_WIDTH = 2.0;
    const PALLET_FILL_W = 0.874;
    const PALLET_FILL_D = 0.855;
    const PALLET_FILL_H = 0.76;

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

        const tpl = this._templateForUbicacion(u);
        const esLibre = tpl === this.templates.libre;
        const inst = tpl.createInstance(`u-${u.id}`);

        if (esLibre) {
          inst.scaling.set(anchoRack, SPACING_NIVEL * 0.9, SPACING_POS * 0.9);
          inst.position.set(centroX, iy * SPACING_NIVEL + SPACING_NIVEL / 2, ix * SPACING_POS);
          inst.isVisible = false;
        } else {
          const w = anchoRack * PALLET_FILL_W;
          const h = SPACING_NIVEL * PALLET_FILL_H;
          const d = SPACING_POS * PALLET_FILL_D;
          inst.scaling.set(w, h, d);
          inst.position.set(centroX, iy * SPACING_NIVEL + h / 2 + 0.05, ix * SPACING_POS);
        }

        inst.isPickable = true;
        inst.metadata = u;
        inst.freezeWorldMatrix();
        inst.doNotSyncBoundingInfo = true;
        this.boxes.push(inst);
        if (inst.position.z > maxZ) maxZ = inst.position.z;
      }

      this._construirEstructuraRack({
        offsetX,
        ancho: anchoRack,
        numPosiciones: posiciones.length,
        numNiveles: niveles.length,
        spacingPos: SPACING_POS,
        spacingNivel: SPACING_NIVEL,
        alturaRack,
      });

      // Números de posición: alternar lado izq/der según paridad del idx para
      // que los racks pareados (B-BB) tengan los números hacia afuera y no
      // queden atrapados entre los dos.
      const xNumero = (idxArea % 2 === 0)
        ? offsetX + anchoRack + 0.45
        : offsetX - 0.45;
      for (let i = 0; i < posiciones.length; i++) {
        const z = i * SPACING_POS;
        const numero = String(posiciones[i]).padStart(2, '0');
        this.numerosPiso.push(this._crearNumeroPiso(numero, xNumero, z, anchoRack));
      }

      const zFondo = (posiciones.length - 1) * SPACING_POS + 2.0;
      const yEncimaRack = maxHeightStack + 1.5;
      this._crearLabelArea(
        ubicaciones[0].areaNombre || `Área ${ubicaciones[0].areaId ?? '?'}`,
        offsetX + anchoRack / 2, yEncimaRack, zFondo,
        anchoRack + 2, 3,
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

    // Si el usuario tenía ocultos los racks, respeta ese estado tras re-render.
    if (!this.mostrarEstructuraRack) {
      for (const r of this.rackInstances) r.setEnabled(false);
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

  /**
   * Dibuja la estructura física del rack alrededor de un pasillo:
   *   - postes verticales azules en los costados, alineados con cada bay
   *   - largueros amarillos a lo largo del pasillo, uno por nivel (incluido el de tope)
   *   - diagonales X-bracing azules en los dos extremos del pasillo
   *
   * Todo va como InstancedMesh sobre 3 templates compartidos → el costo de
   * render se mantiene en 3 draw calls (uno por color) sin importar cuántos
   * pasillos haya. Postes/vigas/diagonales NO son pickable: el raycast atraviesa
   * limpio hasta el cubo de la ubicación detrás.
   */
  private _construirEstructuraRack(opts: {
    offsetX: number;
    ancho: number;
    numPosiciones: number;
    numNiveles: number;
    spacingPos: number;
    spacingNivel: number;
    alturaRack: number;
  }): void {
    if (!this.rackTemplates.poste || !this.rackTemplates.viga || !this.rackTemplates.diagonal) return;
    if (opts.numPosiciones <= 0 || opts.numNiveles <= 0) return;

    const POSTE_GROSOR = 0.10;
    const VIGA_GROSOR = 0.06;
    const VIGA_PROFUNDIDAD = 0.10;
    const DIAG_GROSOR = 0.05;

    // Postes terminan al ras del último nivel: sin la viga del tope, el rack
    // queda "abierto" arriba y los pallets del nivel superior se ven limpios.
    const alturaPostes = opts.alturaRack;
    const zCentro = (opts.numPosiciones - 1) * opts.spacingPos / 2;
    const longitudPasillo = opts.numPosiciones * opts.spacingPos;

    // ---- Postes verticales: 2 lados (x = offsetX, x = offsetX+ancho) × (N+1) bordes en Z ----
    for (let lado = 0; lado < 2; lado++) {
      const x = lado === 0 ? opts.offsetX : opts.offsetX + opts.ancho;
      for (let i = 0; i <= opts.numPosiciones; i++) {
        const z = (i - 0.5) * opts.spacingPos;
        const poste = this.rackTemplates.poste.createInstance(`poste-${opts.offsetX.toFixed(1)}-${lado}-${i}`);
        poste.scaling.set(POSTE_GROSOR, alturaPostes, POSTE_GROSOR);
        poste.position.set(x, alturaPostes / 2, z);
        poste.isPickable = false;
        poste.freezeWorldMatrix();
        poste.doNotSyncBoundingInfo = true;
        this.rackInstances.push(poste);
      }
    }

    // ---- Largueros (vigas) longitudinales: 2 lados × N niveles ----
    // Una viga por nivel donde apoya el pallet (desde el piso hasta el último
    // nivel, SIN cerrar arriba): así el rack se ve abierto en el tope y los
    // pallets superiores no quedan tapados por una viga horizontal.
    for (let lado = 0; lado < 2; lado++) {
      const x = lado === 0 ? opts.offsetX : opts.offsetX + opts.ancho;
      for (let iy = 0; iy < opts.numNiveles; iy++) {
        const y = iy * opts.spacingNivel;
        const viga = this.rackTemplates.viga.createInstance(`viga-${opts.offsetX.toFixed(1)}-${lado}-${iy}`);
        viga.scaling.set(VIGA_PROFUNDIDAD, VIGA_GROSOR, longitudPasillo);
        viga.position.set(x, y, zCentro);
        viga.isPickable = false;
        viga.freezeWorldMatrix();
        viga.doNotSyncBoundingInfo = true;
        this.rackInstances.push(viga);
      }
    }

    // ---- Diagonales X-bracing en los dos extremos del pasillo ----
    // Plano XY (perpendicular a Z): conectan los postes izquierdo y derecho
    // formando una X. Solo en los extremos para no saturar visualmente.
    const diagLen = Math.sqrt(opts.ancho * opts.ancho + opts.alturaRack * opts.alturaRack);
    const ang = Math.atan2(opts.ancho, opts.alturaRack); // ángulo respecto al eje Y
    const zExtremos = [-0.5 * opts.spacingPos, (opts.numPosiciones - 0.5) * opts.spacingPos];

    for (let e = 0; e < zExtremos.length; e++) {
      const z = zExtremos[e];
      // Diagonal 1: rotada +ang en eje Z
      const d1 = this.rackTemplates.diagonal.createInstance(`diag-${opts.offsetX.toFixed(1)}-${e}-a`);
      d1.scaling.set(DIAG_GROSOR, diagLen, DIAG_GROSOR);
      d1.position.set(opts.offsetX + opts.ancho / 2, opts.alturaRack / 2, z);
      d1.rotation.z = ang;
      d1.isPickable = false;
      d1.freezeWorldMatrix();
      d1.doNotSyncBoundingInfo = true;
      this.rackInstances.push(d1);

      // Diagonal 2: rotada -ang en eje Z (cruzada → forma X)
      const d2 = this.rackTemplates.diagonal.createInstance(`diag-${opts.offsetX.toFixed(1)}-${e}-b`);
      d2.scaling.set(DIAG_GROSOR, diagLen, DIAG_GROSOR);
      d2.position.set(opts.offsetX + opts.ancho / 2, opts.alturaRack / 2, z);
      d2.rotation.z = -ang;
      d2.isPickable = false;
      d2.freezeWorldMatrix();
      d2.doNotSyncBoundingInfo = true;
      this.rackInstances.push(d2);
    }
  }

  /**
   * Pinta el número de posición sobre el piso, al costado del rack, alineado
   * con cada bay. Es un Plane horizontal con DynamicTexture (canvas) — se ve
   * como una etiqueta pegada al piso, no como un cartel flotante.
   */
  private _crearNumeroPiso(texto: string, x: number, z: number, _anchoRack: number): Mesh {
    const ANCHO = 1.0;
    const ALTO = 0.7;
    const TEX_W = 256;
    const TEX_H = 180;
    const idSuffix = `${x.toFixed(2)}-${z.toFixed(2)}`;

    const plane = MeshBuilder.CreatePlane(`numPiso-${idSuffix}`, { width: ANCHO, height: ALTO }, this.scene!);
    plane.position.set(x, 0.02, z);
    plane.rotation.x = Math.PI / 2;          // horizontal, cara visible hacia +Y
    plane.isPickable = false;
    plane.doNotSyncBoundingInfo = true;
    plane.alwaysSelectAsActiveMesh = true;

    const dt = new DynamicTexture(`dtNumPiso-${idSuffix}`, { width: TEX_W, height: TEX_H }, this.scene!, true);
    dt.hasAlpha = true;
    const ctx = dt.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, TEX_W, TEX_H);

    // Fondo redondeado oscuro (estilo etiqueta de almacén)
    const r = 28;
    const x0 = 12, y0 = 12, x1 = TEX_W - 12, y1 = TEX_H - 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0);
    ctx.lineTo(x1 - r, y0);
    ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
    ctx.lineTo(x1, y1 - r);
    ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
    ctx.lineTo(x0 + r, y1);
    ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
    ctx.lineTo(x0, y0 + r);
    ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
    ctx.closePath();
    ctx.fill();

    // Borde sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Número
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, TEX_W / 2, TEX_H / 2 + 6);
    dt.update();

    const mat = new StandardMaterial(`matNumPiso-${idSuffix}`, this.scene!);
    mat.diffuseTexture = dt;
    mat.opacityTexture = dt;
    mat.useAlphaFromDiffuseTexture = true;
    mat.emissiveColor = new Color3(1, 1, 1);     // texto a color completo sin sombras
    mat.specularColor = new Color3(0, 0, 0);
    mat.disableLighting = true;
    mat.backFaceCulling = false;                 // visible si la cámara cae del otro lado
    plane.material = mat;

    return plane;
  }

  private _construirPiso(anchoX: number, profZ: number): Mesh {
    const piso = MeshBuilder.CreateGround('piso', {
      width: anchoX + 4,
      height: profZ + 4,
    }, this.scene);
    piso.position = new Vector3(anchoX / 2 - 2, -0.05, profZ / 2 - 2);
    const mat = new StandardMaterial('matPiso', this.scene);
    // Gris claro mate para combinar con el fondo nuevo y dejar destacar el rack.
    mat.diffuseColor = new Color3(0.82, 0.84, 0.88);
    mat.emissiveColor = new Color3(0.82, 0.84, 0.88);
    mat.specularColor = new Color3(0, 0, 0);
    mat.disableLighting = true;
    mat.alpha = 0.95;
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
    // Zoom inicial cercano: el pasillo llena el viewport y los pallets se
    // distinguen con claridad. Si el almacén es muy chico se respeta un mínimo.
    this.camera.radius = Math.max(size * 0.55, 10);
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
