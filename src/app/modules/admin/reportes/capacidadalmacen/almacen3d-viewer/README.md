# Visor 3D del Almacén — Almacen3dViewerComponent

Componente Angular standalone que renderiza un almacén en 3D usando **Babylon.js**.
Vive en el reporte `reportes/capacidadalmacen` y se abre dentro de un `p-dialog`
modal. Soporta tres modos de filtrado:

1. **Almacén completo** — todos los pasillos.
2. **Por propietario** — solo los pasillos donde el propietario tiene mercancía,
   con sus ubicaciones resaltadas en verde brillante.
3. **Por área** — solo un pasillo específico, con dashboard de KPIs y desglose
   por cliente arriba a la izquierda.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Inputs y estado público](#2-inputs-y-estado-público)
3. [Endpoints y datos](#3-endpoints-y-datos)
4. [Inicialización del motor (`_initEngine`)](#4-inicialización-del-motor-_initengine)
5. [Carga de datos (`_cargar`)](#5-carga-de-datos-_cargar)
6. [Construcción de la escena (`_render`)](#6-construcción-de-la-escena-_render)
7. [Carteles de área (`_crearLabelArea`)](#7-carteles-de-área-_crearlabelarea)
8. [Interacción: hover, click, drag](#8-interacción-hover-click-drag)
9. [Vistas preestablecidas y encuadre](#9-vistas-preestablecidas-y-encuadre)
10. [Detalle inline del cubo seleccionado](#10-detalle-inline-del-cubo-seleccionado)
11. [Dashboard del pasillo](#11-dashboard-del-pasillo)
12. [Rendimiento](#12-rendimiento)
13. [Ciclo de vida y limpieza](#13-ciclo-de-vida-y-limpieza)
14. [Puntos comunes para tunear](#14-puntos-comunes-para-tunear)

---

## 1. Arquitectura general

```
┌───────────────────────────────────────────────────────────────────┐
│                  CapacidadalmacenComponent (padre)                │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  p-dialog (95vw × 90vh)                                      │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  <app-almacen3d-viewer                                 │  │ │
│  │  │     [almacenId]      [almacenNombre]                   │  │ │
│  │  │     [propietarioId]  [areaIdInicial] />                │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

Dentro del componente:

```
HTML
├── Toolbar (vista presets, dropdown área, contadores)
├── Canvas (Babylon.js render target)
│   ├── Loading overlay
│   ├── Dashboard top-left (cuando hay área seleccionada)
│   ├── Hover info top-right (transitorio)
│   ├── Selected info top-right (fijo, con detalle inline + botón Ampliar)
│   └── Hint bottom-left
└── (GUI fullscreen layer dibuja los carteles de área)

TS
├── Estado público (cargando, hoverInfo, selectedInfo, dashboardArea, etc.)
├── Estado privado Babylon (engine, scene, camera, boxes, templates, gui)
├── Inputs (almacenId, propietarioId, areaIdInicial)
└── Lifecycle: ngAfterViewInit → setTimeout 250 → _initEngine → _cargar
```

---

## 2. Inputs y estado público

```ts
@Input() almacenId!: number;                // requerido
@Input() almacenNombre = '';                // solo para el header
@Input() propietarioId?: number | null;     // modo "por propietario"
@Input() areaIdInicial?: number | null;     // modo "por área"
```

| Estado público            | Tipo                | Cuándo se usa                                                 |
| ------------------------- | ------------------- | ------------------------------------------------------------- |
| `cargando`                | `boolean`           | Mostrar overlay de spinner.                                   |
| `areas`                   | `SelectItem[]`      | Opciones del dropdown de área.                                |
| `areaSeleccionada`        | `number \| null`    | Área filtrada actualmente (null = todas).                     |
| `total / ocupadas / libres` | `number`         | Contadores del toolbar.                                       |
| `hoverInfo`               | objeto              | Cuadro top-right cuando el mouse pasa por un cubo.            |
| `selectedInfo`            | `Ubicacion3D`       | Cuadro top-right fijo tras click — con detalle inline.        |
| `detalleCargando` / `detalleLods` | bool / array | Estado del fetch de contenido de la ubicación seleccionada.   |
| `dashboardArea`           | objeto              | KPIs y clientes del pasillo cuando hay un área seleccionada.  |
| `hayFiltroPropietario`    | `boolean`           | Si está activo el modo "por propietario".                     |

---

## 3. Endpoints y datos

### `GET /api/Ubicacion/ubicaciones?almacenId={n}` (Stored Procedure)

Fuente principal. Devuelve **todas las ubicaciones del almacén** ya con metadata
de ocupabilidad:

```ts
{
  id, nombre,
  areaId, areaNombre,
  almacenId,
  height, length, width,        // dimensiones reales (para escalar el cubo)
  nivelId, posicionId,          // posición lógica dentro del pasillo
  estadoOcupacion,              // 'Libre' | 'Ocupada'
  tipoUbicacionNombre,
  totalLods, totalUnidades,
  activo,
  propietarioNombre             // si está ocupada, dueño actual
}
```

Llamado vía `UbicacionService.getUbicaciones(almacenId)`.

### `GET /api/inventario/GetUbicacionesOcupadasByPropietarioAlmacen`

Solo cuando hay `propietarioId`. Devuelve los IDs de ubicaciones del almacén
que tienen mercancía de ese propietario. Llamado vía
`InventarioService.getUbicacionesOcupadasByPropietarioAlmacen(propietarioId, almacenId)`.

Reusamos el mismo endpoint que usa StockApp WPF para mantener consistencia y
filtrar por **ID exacto** (el SP de ubicaciones no devuelve PropietarioId).

### `GET /api/Ubicacion/ubicaciones/{id}/inventario`

Llamado al click sobre un cubo, para mostrar el detalle inline (LPNs +
productos + cantidades). Vía `UbicacionService.getInventarioByUbicacion(id)`.

---

## 4. Inicialización del motor (`_initEngine`)

Se llama dentro de `ngAfterViewInit` con un `setTimeout(250)` para esperar a
que el `p-dialog` termine la animación de apertura — sin esa demora el canvas
arrancaría con tamaño 0 y el primer render quedaría borroso.

```ts
this.engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  antialias: true,
  adaptToDeviceRatio: true,
});
this.engine.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1));
```

- `adaptToDeviceRatio + setHardwareScalingLevel` → render nítido en pantallas
  HiDPI / Retina sin que el canvas se vea pixelado.

```ts
this.scene = new Scene(this.engine);
this.scene.clearColor = new Color4(0.04, 0.06, 0.15, 1);

this.camera = new ArcRotateCamera(
  'cam',
  -Math.PI / 2.5,   // alpha (rotación horizontal)
   Math.PI / 3.2,   // beta  (elevación)
   40,              // radius (distancia)
   Vector3.Zero(),
   this.scene
);
this.camera.attachControl(canvas, true);
this.camera.lowerRadiusLimit = 5;
this.camera.upperRadiusLimit = 500;
this.camera.wheelDeltaPercentage = 0.02;
this.camera.panningSensibility = 50;
```

- `ArcRotateCamera` orbita un punto target con los controles que el usuario
  espera (drag rotar, rueda zoom, click derecho pan).
- `lower/upperRadiusLimit` limitan el zoom para que no se atraviese la escena
  ni se aleje al infinito.

### Luces

```ts
new HemisphericLight('hemi', new Vector3(0,1,0), scene).intensity = 0.7;
new DirectionalLight('dir',  new Vector3(-0.5,-1,-0.5), scene).intensity = 0.6;
```

En la práctica los materiales ignoran las luces (ver siguiente sección), pero
las dejamos por si en el futuro algún elemento sí quiere reaccionar a ellas
(ej. modelos GLTF importados).

### Materiales flat

```ts
const makeFlat = (name, r, g, b) => {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor  = new Color3(r, g, b);
  m.emissiveColor = new Color3(r, g, b);  // mismo color emitido → caras planas idénticas
  m.specularColor = new Color3(0, 0, 0);  // sin reflejos
  m.disableLighting = true;               // ignora luces de la escena
  return m;
};

materials.libre     = makeFlat('matLibre',  0.96, 0.97, 0.98);  // blanco
materials.ocupada   = makeFlat('matOcup',   0.04, 0.42, 0.18);  // verde oscuro
materials.otro      = makeFlat('matOtro',   0.70, 0.40, 0.02);  // ámbar
const resaltada     = makeFlat('matResalt', 0.14, 0.86, 0.40);  // verde brillante
```

- Los cubos se ven **sólidos sin sombreado** para que no se confunda la
  geometría — pedido explícito del cliente porque las sombras hacían que
  pareciera que había patrones que no existían.

### Templates para instancing

```ts
const mkTemplate = (name, mat) => {
  const t = MeshBuilder.CreateBox(name, { size: 1 }, scene);
  t.material = mat;
  t.isVisible = false;                  // el template no se dibuja
  t.doNotSyncBoundingInfo = true;
  return t;
};
templates.libre     = mkTemplate('tplLibre', materials.libre);
templates.ocupada   = mkTemplate('tplOcup',  materials.ocupada);
templates.otro      = mkTemplate('tplOtro',  materials.otro);
templates.resaltada = mkTemplate('tplResalt', resaltada);
```

**Clave de rendimiento**: en lugar de crear N meshes (uno por ubicación),
creamos **4 templates** invisibles. Cada ubicación es una `InstancedMesh`
del template apropiado — todas comparten geometría y material → Babylon
las dibuja con 4 draw calls en total (uno por material), incluso si hay
miles de cubos.

### GUI fullscreen para los carteles

```ts
this.gui = AdvancedDynamicTexture.CreateFullscreenUI('areaLabelsUI', true, scene);
```

Las etiquetas de área son controles 2D anclados a posiciones 3D
(ver sección 7). Esta capa se inicializa una sola vez.

### Render loop + observers

```ts
this.engine.runRenderLoop(() => this.scene?.render());
window.addEventListener('resize', this._onResize);

this.resizeObs = new ResizeObserver(() => this.engine?.resize());
this.resizeObs.observe(canvas);
if (canvas.parentElement) this.resizeObs.observe(canvas.parentElement);

requestAnimationFrame(() => this.engine?.resize());
```

- `ResizeObserver` captura cambios de tamaño del modal (no solo de la ventana
  completa) — necesario cuando el usuario maximiza/restaura el dialog.
- El `requestAnimationFrame` final fuerza un resize tras el primer frame por
  si el canvas arrancó con dimensiones todavía no estables.

---

## 5. Carga de datos (`_cargar`)

Se llama desde `ngAfterViewInit` (primera carga) y desde `ngOnChanges` (si el
componente padre cambia `almacenId` o `propietarioId` sin destruirlo).

```ts
const ubic$ = ubicacionService.getUbicaciones(almacenId);
const ocup$ = hayFiltroPropietario
  ? inventarioService.getUbicacionesOcupadasByPropietarioAlmacen(propietarioId, almacenId)
      .pipe(catchError(() => of([])))
  : of([]);

forkJoin([ubic$, ocup$]).subscribe(([rows, ocupadas]) => {
  // 1) Set de IDs resaltados (vacío si no hay filtro de propietario)
  resaltadasSet = new Set(ocupadas.map(o => Number(o.ubicacionId)));

  // 2) Normalizar rows → Ubicacion3D[]
  const todas = rows
    .filter(u => u.activo !== false)
    .map(u => ({ id, nombre, areaId, areaNombre, height, length, width, ... }));

  // 3) Si hay filtro de propietario: conservar solo pasillos donde tiene mercancía
  if (hayFiltroPropietario && resaltadasSet.size > 0) {
    const areasConMercaderia = new Set(
      todas.filter(u => resaltadasSet.has(u.id)).map(u => u.areaId)
    );
    this.todas = todas.filter(u => areasConMercaderia.has(u.areaId));
  } else {
    this.todas = todas;
  }

  // 4) Construir lista del dropdown de áreas
  this._construirAreas();

  // 5) Preseleccionar área si llegó como input
  if (areaIdInicial != null) this.areaSeleccionada = areaIdInicial;

  // 6) Renderizar
  this._render();
  this.cargando = false;
  this.cdr.markForCheck();   // ← OnPush exige markForCheck explícito
});
```

**Por qué `markForCheck()`**: el componente usa `ChangeDetectionStrategy.OnPush`
para evitar que Angular corra change detection en cada frame de Babylon (sería
muy caro). Pero entonces hay que despertar la CD manualmente cuando cambia el
estado desde callbacks async. Sin esto, el overlay de "Cargando…" quedaba
visible hasta que el usuario presionara cualquier tecla (que sí dispara CD).

---

## 6. Construcción de la escena (`_render`)

Llamado al final de `_cargar` y cada vez que cambia el dropdown de área.

### 6.1 Limpieza del estado anterior

```ts
for (const b of this.boxes) b.dispose();          this.boxes = [];
this.piso?.dispose();                              this.piso = undefined;
for (const c of this.labelControls) c.dispose();   this.labelControls = [];
for (const n of this.labelAnchors)  n.dispose();   this.labelAnchors  = [];
```

### 6.2 Filtrado por área

```ts
const filtradas = areaSeleccionada == null
  ? this.todas
  : this.todas.filter(u => u.areaId === areaSeleccionada);
```

### 6.3 Layout paralelo de pasillos

Los pasillos se acomodan **uno al lado del otro a lo largo del eje X**.
Cada pasillo extiende sus posiciones a lo largo de Z, y los niveles del rack
suben en Y.

```ts
const ESCALA_CUBO    = 0.55;   // factor para encoger las dimensiones de BD
const SPACING_AREA   = 10;     // separación entre pasillos (X)
const SPACING_POS    = 1.7;    // separación entre posiciones del mismo pasillo (Z)
const SPACING_NIVEL  = 1.6;    // separación entre niveles del mismo rack (Y)

let offsetX = 0;
for (const [, ubicaciones] of areasOrdenadas) {
  const posiciones = uniqSort(ubicaciones.map(u => u.posicionId));
  const niveles    = uniqSort(ubicaciones.map(u => nivelANumero(u.nivelId)));

  const posIndex = mapValueToIndex(posiciones);
  const nivIndex = mapValueToIndex(niveles);

  const maxWidth = max(ubicaciones.width) * ESCALA_CUBO;
  const maxHeightStack = niveles.length * SPACING_NIVEL + max(height)*ESCALA_CUBO;

  for (const u of ubicaciones) {
    const ix = posIndex.get(u.posicionId) ?? 0;
    const iy = nivIndex.get(nivelANumero(u.nivelId)) ?? 0;

    const w = u.width  * ESCALA_CUBO;
    const h = u.height * ESCALA_CUBO;
    const d = u.length * ESCALA_CUBO;

    const tpl = this._templateForUbicacion(u);     // libre/ocupada/otro/resaltada
    const inst = tpl.createInstance(`u-${u.id}`);
    inst.scaling.set(w, h, d);                     // escala el cubo unitario
    inst.position.set(
      offsetX + w / 2,
      iy * SPACING_NIVEL + h / 2,
      ix * SPACING_POS,
    );
    inst.metadata = u;                             // ← para hover/click
    inst.freezeWorldMatrix();
    inst.doNotSyncBoundingInfo = true;
    this.boxes.push(inst);
  }

  // Cartel del área (ver sección 7)
  this._crearLabelArea(...);

  offsetX += maxWidth + SPACING_AREA;
}

this.piso = this._construirPiso(offsetX, maxZ + 4);
this._calcularDashboardArea(filtradas);
this._encajarCamara();
```

### 6.4 ¿Cuál template recibe cada cubo?

```ts
private _templateForUbicacion(u: Ubicacion3D): Mesh {
  if (hayFiltroPropietario && resaltadasSet.has(u.id))
    return templates.resaltada;       // verde brillante (del propietario)

  if (hayFiltroPropietario)
    return templates.libre;            // blanco atenuado (contexto del pasillo)

  // Sin filtro de propietario
  if (u.estadoOcupacion === 'Ocupada') return templates.ocupada;
  if (u.estadoOcupacion === 'Libre')   return templates.libre;
  return templates.otro;
}
```

### 6.5 Niveles alfabéticos

```ts
private _nivelANumero(nivel: string | null): number {
  if (nivel == null) return 0;
  const n = Number(nivel);
  if (!Number.isNaN(n)) return n;
  return nivel.charCodeAt(0) - 64;     // 'A' → 1, 'B' → 2, ...
}
```

### 6.6 Piso

```ts
private _construirPiso(anchoX, profZ): Mesh {
  const piso = MeshBuilder.CreateGround('piso',
    { width: anchoX + 4, height: profZ + 4 }, scene);
  piso.position = new Vector3(anchoX/2 - 2, -0.05, profZ/2 - 2);
  // ... material flat azul oscuro con alpha 0.6
  piso.isPickable = false;             // no responde al pick (no debe robar click)
  return piso;
}
```

---

## 7. Carteles de área (`_crearLabelArea`)

**Decisión clave**: en lugar de hacer un plano 3D con textura del texto
(que dependiendo del ángulo aparecía invertido o ilegible), usamos
**GUI 2D anclada a un punto 3D**.

```ts
const anchor = new TransformNode(`labelAnchor-${texto}`, scene);
anchor.position = new Vector3(x, y, z);   // (centro del pasillo, encima del rack, fondo Z)

const rect = new Rectangle();
rect.adaptWidthToChildren  = true;
rect.adaptHeightToChildren = true;
rect.cornerRadius = 12;
rect.background = 'rgba(15, 23, 42, 0.82)';
rect.color = 'rgba(99, 102, 241, 0.95)';
rect.thickness = 2;
rect.paddingLeft = '14px'; rect.paddingRight = '14px';

const tb = new TextBlock();
tb.text = texto; tb.color = 'white'; tb.fontSize = 22;
tb.fontWeight = 'bold'; tb.resizeToFit = true;
rect.addControl(tb);

this.gui.addControl(rect);
rect.linkWithMesh(anchor);                // proyecta posición 3D → coords 2D
rect.linkOffsetY = -8;
```

- El cartel **siempre es legible**: es texto 2D vectorial, nunca se invierte
  ni pixela.
- Sigue al mundo 3D: si rotas/zoom, el cartel se mueve y escala
  proporcionalmente a su anchor.
- No interfiere con el pick de los cubos (no es un mesh).

---

## 8. Interacción: hover, click, drag

Toda la interacción pasa por **un solo handler** suscrito a
`scene.onPointerObservable`. La complejidad principal es **distinguir click
de drag** (rotar/pan) — si haces drag para girar, no queremos que dispare
"seleccionar cubo".

```ts
let pointerDownX, pointerDownY;
let pointerMoved   = false;
let pointerIsDown  = false;
const DRAG_THRESHOLD = 5;   // píxeles

scene.onPointerObservable.add(pi => {
  const ev = pi.event as PointerEvent;

  if (pi.type === POINTERDOWN) {
    pointerDownX = ev.clientX; pointerDownY = ev.clientY;
    pointerMoved = false; pointerIsDown = true;
    if (hoverInfo) { hoverInfo = null; cdr.markForCheck(); }   // ocultar hover al drag
    return;
  }

  if (pi.type === POINTERMOVE) {
    if (pointerIsDown) {
      // Solo actualizamos el flag, NO hacemos pick (clave de performance).
      if (abs(dx) > DRAG_THRESHOLD || abs(dy) > DRAG_THRESHOLD)
        pointerMoved = true;
      return;
    }
    // Sin botón presionado → hover normal
    const pick = scene.pick(...);
    if (pick.hit) hoverInfo = { ...pick.pickedMesh.metadata };
    else hoverInfo = null;
    cdr.markForCheck();
    return;
  }

  if (pi.type === POINTERUP) {
    pointerIsDown = false;
    if (pointerMoved || ev.button !== 0) return;   // fue drag → ignorar
    const pick = scene.pick(...);
    selectedInfo = pick.hit ? pick.pickedMesh.metadata : null;
    _cargarDetalleInline(selectedInfo);            // fetch del contenido
    cdr.markForCheck();
  }
});
```

**Por qué no hacemos pick durante el drag**: `scene.pick` testea el rayo del
cursor contra todos los meshes; con muchos cubos esto puede tomar varios ms.
Hacerlo en cada `POINTERMOVE` mientras el usuario rota la cámara colapsaba
el frame rate. Saltarlo durante drag → rotación fluida a 60fps.

---

## 9. Vistas preestablecidas y encuadre

```ts
vistaIsometrica() { camera.alpha = -π/2.5; camera.beta = π/3.2;   _encajarCamara(); }
vistaSuperior()   { camera.alpha = -π/2;   camera.beta = 0.05;    _encajarCamara(); }
vistaLateral()    { camera.alpha = -π/2;   camera.beta = π/2-0.05; _encajarCamara(); }
resetCamera()     { _encajarCamara(); }
```

### Encuadre automático

```ts
private _encajarCamara(): void {
  const cubos = this.boxes.filter(m => m.isPickable && m.metadata);
  // (los anchors de los labels también cuentan)

  let min = Vector3(∞,∞,∞), max = Vector3(-∞,-∞,-∞);
  for (const m of [...cubos, ...labelAnchors]) {
    incluir(m.position);   // min/max por componente
  }
  const center = Vector3.Center(min, max);
  const size = max.subtract(min).length();
  this.camera.target = center;
  this.camera.radius = Math.max(size * 0.78, 12);   // 40% más cerca que el encuadre completo
}
```

- `size * 0.78` → arranca **40% más cerca** que un encuadre estricto. El
  usuario puede alejarse con la rueda si quiere.

---

## 10. Detalle inline del cubo seleccionado

Cuando hacés click en un cubo:

1. `selectedInfo = data` (el `Ubicacion3D` del metadata).
2. `_cargarDetalleInline(data)` se dispara:

```ts
private _cargarDetalleInline(u): void {
  this.detalleSub?.unsubscribe();           // cancelar fetch anterior
  this.detalleLods = [];

  if (!u || u.totalLods === 0) {            // ubicación libre → sin fetch
    this.detalleCargando = false;
    return;
  }

  this.detalleCargando = true;
  this.detalleSub = ubicacionService
    .getInventarioByUbicacion(u.id)
    .subscribe({
      next: resp => {
        this.detalleLods = resp?.lods ?? [];
        this.detalleCargando = false;
        this.cdr.markForCheck();
      },
      error: () => { /* limpiar y markForCheck */ },
    });
}
```

El panel HTML renderiza los LODs en formato compacto: por cada LPN una
mini tabla `código | descripción | cantidad`, con scroll vertical si hay
muchos productos. El botón **Ampliar** abre el dialog completo
(`InventarioUbicacionDialogComponent`) con todos los campos.

---

## 11. Dashboard del pasillo

Se calcula al final de `_render` **solo cuando hay un área seleccionada**.
Se muestra en un panel top-left.

```ts
private _calcularDashboardArea(filtradas): void {
  if (areaSeleccionada == null) { dashboardArea = null; return; }

  const total    = filtradas.length;
  const ocupadas = filtradas.filter(u => u.estadoOcupacion === 'Ocupada').length;
  const libres   = total - ocupadas;
  const pct      = round(ocupadas / total * 100);

  // Agrupar por propietario (solo las ocupadas)
  const mapa = new Map<string, number>();
  for (const u of filtradas) {
    if (u.estadoOcupacion === 'Ocupada' && u.propietarioNombre) {
      const k = u.propietarioNombre.trim();
      mapa.set(k, (mapa.get(k) ?? 0) + 1);
    }
  }
  const clientes = [...mapa.entries()]
    .map(([nombre, ocupadas]) => ({ nombre, ocupadas, pct: round(ocupadas/total*100) }))
    .sort((a,b) => b.ocupadas - a.ocupadas);

  dashboardArea = { nombre, total, ocupadas, libres, pct, clientes };
}
```

El HTML muestra:

- Header índigo con el nombre del pasillo.
- 3 KPIs: Total / Ocupadas / Libres.
- Barra global de ocupación coloreada por umbral.
- Lista de clientes con barras violeta proporcionales (max-height 220 px
  con scroll si hay más).

---

## 12. Rendimiento

Optimizaciones aplicadas:

| Técnica                                       | Efecto                                             |
| --------------------------------------------- | -------------------------------------------------- |
| **Instancing** (`createInstance`)             | 1 draw call por material en vez de N — 10×-50× menos costo de render. |
| **`freezeWorldMatrix()`** por cubo            | Babylon deja de recalcular la matriz mundo cada frame. |
| **`doNotSyncBoundingInfo = true`**            | No recalcula bounding boxes (los cubos no se mueven). |
| **Skip de pick durante drag**                 | `scene.pick` solo corre en POINTERMOVE sin botón. Rotación fluida. |
| **`adaptToDeviceRatio + setHardwareScalingLevel`** | Render nítido en HiDPI sin tomar 4× el costo. |
| **`OnPush + markForCheck()`** explícito       | CD solo cuando es necesario; no en cada frame de Babylon. |
| **GUI 2D para etiquetas**                     | Texto vectorial sin textura/material por etiqueta. |

Con esto el visor maneja **2-3k ubicaciones** a 60 fps. Para volúmenes mayores
(>5k) el siguiente paso sería migrar a `thinInstances` (matrices en GPU,
1 draw call total) — pierde algo de flexibilidad de pick pero da room para
50k+ cubos.

---

## 13. Ciclo de vida y limpieza

```ts
ngAfterViewInit() {
  setTimeout(() => {              // esperar animación del dialog
    _initEngine();
    if (almacenId) _cargar();
  }, 250);
}

ngOnChanges() {                   // si el padre cambia inputs sin destruir
  if (engine && almacenId) _cargar();
}

ngOnDestroy() {
  resizeObs?.disconnect();
  window.removeEventListener('resize', _onResize);
  detalleSub?.unsubscribe();      // cancelar fetch en vuelo
  dialogRef?.close();             // cerrar dialog hijo si quedó abierto
  gui?.dispose();                 // GUI 2D
  scene?.dispose();               // libera meshes/materiales/texturas
  engine?.dispose();              // libera contexto WebGL
}
```

Cada `_render` también hace dispose explícito de boxes, piso, label controls
y label anchors anteriores antes de construir el nuevo set.

---

## 14. Puntos comunes para tunear

| Quiero…                              | Dónde tocar                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Cubos más grandes / chicos           | `ESCALA_CUBO` en `_render()`                                                       |
| Más / menos espacio entre pasillos   | `SPACING_AREA`                                                                     |
| Más / menos espacio entre cubos      | `SPACING_POS`, `SPACING_NIVEL`                                                     |
| Cambiar colores                      | `_initEngine()` → bloque de `makeFlat(...)`                                        |
| Vista inicial más cerca / lejos      | `_encajarCamara()` → `size * 0.78`                                                 |
| Empezar en otra vista                | Llamar `vistaSuperior()` / `vistaLateral()` después de `_cargar` en vez de iso     |
| Cambiar estilo de los carteles       | `_crearLabelArea()` → propiedades del `Rectangle` y `TextBlock`                    |
| Mostrar más / menos detalle inline   | Altura `max-h-[180px]` en el bloque "Detalle inline (LODs + productos)" del HTML   |
| Hacer click-pick más permisivo       | `DRAG_THRESHOLD` (default 5px)                                                     |
| Quitar el dashboard del pasillo      | Cambiar `_calcularDashboardArea` para que siempre setee `null`, o el `*ngIf`       |

---

## Archivos relacionados

- `almacen3d-viewer.component.ts` / `.html` — este componente.
- `capacidadalmacen.component.ts` / `.html` — padre que abre el dialog y pasa
  los inputs según el botón (almacén / propietario / área).
- `inventario-ubicacion-dialog.component.ts` — dialog detallado que abre el
  botón "Ampliar".
- `UbicacionService` — `getUbicaciones`, `getInventarioByUbicacion`.
- `InventarioService` — `getUbicacionesOcupadasByPropietarioAlmacen`.
