# Guía de Estilos - Aplicar Look & Feel de B2B/List

Este documento describe cómo aplicar el mismo estilo, look and feel del componente `b2b/list` a otros componentes del sistema.

## Fecha de Creación
Diciembre 2024

---

## 1. Estructura General del Layout

### 1.1 Contenedor Principal

```html
<div class="flex flex-col flex-auto min-w-0 bg-gray-50">
  <!-- Contenido aquí -->
</div>
```

**Características:**
- `flex flex-col`: Layout en columna
- `flex-auto`: Ocupa el espacio disponible
- `min-w-0`: Previene overflow horizontal
- `bg-gray-50`: Fondo gris claro

---

## 2. Header (Encabezado)

### 2.1 Estructura del Header

```html
<div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-4 sm:px-10 border-b border-gray-200 bg-white shadow-sm">
  <div class="flex-1 min-w-0">
    <!-- Breadcrumb -->
    <div class="flex flex-wrap items-center font-medium text-sm text-gray-600">
      <div>
        <a class="whitespace-nowrap text-gray-700 hover:text-gray-900">TWH</a>
      </div>
      <div class="flex items-center ml-1 whitespace-nowrap">
        <mat-icon class="fuse-horizontal-navigation-item-icon text-gray-400" [svgIcon]="'heroicons_solid:chevron-right'"></mat-icon>
        <a class="ml-1 text-gray-700 hover:text-gray-900">Módulo</a>
      </div>
      <div class="flex items-center ml-1 whitespace-nowrap">
        <mat-icon class="fuse-horizontal-navigation-item-icon text-gray-400" [svgIcon]="'heroicons_solid:chevron-right'"></mat-icon>
        <a class="ml-1 text-gray-700 hover:text-gray-900">Submódulo</a>
      </div>
    </div>
    
    <!-- Título -->
    <div class="mt-1">
      <h2 class="text-3xl md:text-4xl font-semibold tracking-tight leading-7 sm:leading-10 truncate text-gray-900">
        Título de la Página
      </h2>
    </div>
  </div>
</div>
```

**Características del Header:**
- Fondo blanco (`bg-white`)
- Sombra sutil (`shadow-sm`)
- Borde inferior (`border-b border-gray-200`)
- Responsive: columna en móvil, fila en desktop (`sm:flex-row`)
- Padding: `p-6` en móvil, `sm:py-4 sm:px-10` en desktop

**Breadcrumb:**
- Texto pequeño (`text-sm`)
- Iconos de chevron entre elementos
- Color gris (`text-gray-600`, `text-gray-700`)
- Hover más oscuro (`hover:text-gray-900`)

**Título:**
- Tamaño grande: `text-3xl md:text-4xl`
- Font semibold: `font-semibold`
- Tracking tight: `tracking-tight`
- Color gris oscuro: `text-gray-900`

---

## 3. Sección de Filtros

### 3.1 Contenedor de Filtros

```html
<div class="bg-white rounded-lg shadow-sm border border-gray-200 m-4 overflow-hidden">
  <!-- Header del contenedor -->
  <div class="bg-gray-800 text-white px-4 py-2.5 border-b border-gray-700">
    <h3 class="text-base font-semibold text-gray-100">Filtros de Búsqueda</h3>
  </div>
  
  <!-- Contenido de filtros -->
  <div class="p-4">
    <!-- Grid de filtros -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Campos de filtro aquí -->
    </div>
    
    <!-- Botones de acción -->
    <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
      <!-- Botones aquí -->
    </div>
  </div>
</div>
```

**Características:**
- Fondo blanco con bordes redondeados
- Sombra sutil (`shadow-sm`)
- Header oscuro (`bg-gray-800`) con texto blanco
- Grid responsive: 1 columna móvil, 2 tablet, 4 desktop
- Separador antes de botones (`border-t border-gray-200`)

### 3.2 Campos de Filtro

#### Dropdown (Select)

```html
<div class="flex flex-col">
  <label for="campo" class="text-xs font-medium text-gray-700 mb-1">Etiqueta:</label>
  <p-dropdown
    name="campo"
    [options]="opciones"
    [(ngModel)]="model.campoId"
    [filter]="true"
    filterBy="label"
    [showClear]="true"
    [style]="{ width: '100%' }"
    [resetFilterOnHide]="false"
    [hideTransitionOptions]="'0ms'"
    [showTransitionOptions]="'0ms'"
    placeholder="Seleccione una opción"
    styleClass="text-sm border-gray-300">
    <ng-template let-item pTemplate="selectedItem">
      <span style="vertical-align: left">{{ item.label }}</span>
    </ng-template>
  </p-dropdown>
</div>
```

#### Calendar (Fecha)

```html
<div class="flex flex-col">
  <label for="dateCampo" class="text-xs font-medium text-gray-700 mb-1">Fec. Campo</label>
  <p-calendar
    id="dateCampo"
    [(ngModel)]="dateCampo"
    dateFormat="dd.mm.yy"
    styleClass="text-sm border-gray-300"
  />
</div>
```

#### Input Text

```html
<div class="flex flex-col">
  <label class="text-xs font-medium text-gray-700 mb-1">Campo:</label>
  <input
    pInputText
    minlength="5"
    maxlength="50"
    class="w-full text-sm border-gray-300"
    autocomplete="off"
    [(ngModel)]="model.campo"
    name="campo"
    type="text"
    placeholder="Texto de ejemplo"
  />
</div>
```

**Características de Labels:**
- Tamaño pequeño: `text-xs`
- Font medium: `font-medium`
- Color gris: `text-gray-700`
- Margen inferior: `mb-1`

### 3.3 Botones de Acción

```html
<!-- Botón Buscar (Gris) -->
<button
  class="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md shadow-sm transition-all duration-150"
  pButton
  icon="fa fa-search"
  label="Buscar"
  iconPos="left"
  (click)="buscar()">
</button>

<!-- Botón Nuevo (Ámbar) -->
<button
  class="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm transition-all duration-150"
  icon="fa fa-plus"
  pButton
  label="Nuevo"
  iconPos="left"
  (click)="nuevo()">
</button>
```

**Características de Botones:**
- Padding: `px-4 py-2`
- Texto pequeño: `text-sm`
- Font medium: `font-medium`
- Bordes redondeados: `rounded-md`
- Sombra: `shadow-sm`
- Transición: `transition-all duration-150`
- Colores:
  - Buscar: `bg-gray-700 hover:bg-gray-600`
  - Nuevo: `bg-amber-600 hover:bg-amber-700`

---

## 4. Tabla de Datos

### 4.1 Contenedor de Tabla

```html
<div class="bg-white rounded-lg shadow-sm border border-gray-200 mx-4 mb-4 overflow-hidden">
  <!-- Header de la tabla -->
  <div class="bg-gray-800 text-white px-4 py-2.5 border-b border-gray-700">
    <h3 class="text-base font-semibold text-gray-100">Título de la Tabla</h3>
    <p class="text-xs text-amber-300 mt-1">Total de registros: {{ items.length }}</p>
  </div>
  
  <!-- Tabla PrimeNG -->
  <div class="p-4">
    <p-table
      [style]="{ width: '100%' }"
      [scrollable]="true"
      scrollHeight="600px"
      [columns]="cols"
      [value]="items"
      [(selection)]="selectedRow"
      #dt
      [paginator]="true"
      [rows]="10"
      selectionMode="multiple"
      [responsive]="true"
      [tableStyle]="{ 'table-layout': 'fixed', width: '100%' }"
      styleClass="p-datatable-sm"
    >
      <!-- Templates aquí -->
    </p-table>
  </div>
</div>
```

**Características:**
- Mismo estilo que contenedor de filtros
- Header oscuro con contador en ámbar
- Tabla con scroll fijo de 600px
- Paginación de 10 registros por página
- Selección múltiple habilitada

### 4.2 Encabezados de Tabla

```html
<ng-template pTemplate="header" let-columns>
  <tr class="bg-gray-800 text-white">
    <th
      *ngFor="let col of columns"
      [ngStyle]="{ width: col.width }"
      pResizableColumn
      [pSortableColumn]="col.field"
      class="text-center px-4 py-2 text-sm font-semibold text-white border-b border-gray-700"
    >
      {{ col.header }}
      <p-sortIcon [field]="col.field"></p-sortIcon>
    </th>
  </tr>
</ng-template>
```

**Características:**
- Fondo oscuro: `bg-gray-800`
- Texto blanco: `text-white`
- Centrado: `text-center`
- Padding: `px-4 py-2`
- Font semibold: `font-semibold`
- Borde inferior: `border-b border-gray-700`

### 4.3 Filas de Datos

```html
<ng-template pTemplate="body" let-rowData let-columns="columns">
  <tr [pSelectableRow]="rowData" class="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
    <td class="text-center px-4 py-2 text-gray-700 text-sm">
      {{ rowData.campo }}
    </td>
    <!-- Más columnas -->
  </tr>
</ng-template>
```

**Características:**
- Borde inferior: `border-b border-gray-100`
- Hover: `hover:bg-gray-50`
- Transición: `transition-colors duration-150`
- Texto centrado: `text-center`
- Color gris: `text-gray-700`
- Tamaño pequeño: `text-sm`

### 4.4 Badges de Estado

```html
<td class="text-center px-4 py-2">
  <span
    class="estado-badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    [ngClass]="getEstadoClass(rowData.estado)"
  >
    {{ rowData.estado }}
  </span>
</td>
```

**Clases CSS para Estados:**

```css
.estado-badge {
  @apply inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.estado-creado { 
  @apply bg-blue-500 text-white; 
}

.estado-planificado { 
  @apply bg-yellow-500 text-black; 
}

.estado-asignado { 
  @apply bg-orange-500 text-white; 
}

.estado-despachado { 
  @apply bg-green-600 text-white; 
}

.estado-validado { 
  @apply bg-purple-600 text-white; 
}
```

### 4.5 Botones de Acción en Tabla

```html
<td class="text-center px-4 py-2">
  <div class="flex flex-wrap justify-center gap-1">
    <p-button
      severity="primary"
      icon="fa fa-edit"
      (click)="edit(rowData.id)"
      [size]="small"
      [raised]="true"
    ></p-button>

    <p-button
      severity="danger"
      icon="fa fa-trash"
      (click)="delete(rowData.id)"
      [size]="small"
      [raised]="true"
    ></p-button>

    <p-button
      severity="secondary"
      icon="fa fa-search"
      (click)="ver(rowData.id)"
      [size]="small"
      [raised]="true"
    ></p-button>
  </div>
</td>
```

**Características:**
- Tamaño pequeño: `[size]="small"`
- Elevado: `[raised]="true"`
- Gap entre botones: `gap-1`
- Centrado: `justify-center`

### 4.6 Mensaje Vacío

```html
<ng-template pTemplate="emptymessage">
  <tr>
    <td [attr.colspan]="cols.length" class="text-center p-8">
      <div class="flex flex-col items-center">
        <i class="pi pi-inbox text-4xl mb-3 text-gray-300"></i>
        <span class="text-gray-500 text-sm">No hay registros disponibles</span>
        <span class="text-gray-400 text-xs mt-1">Use los filtros para buscar o cree un nuevo registro</span>
      </div>
    </td>
  </tr>
</ng-template>
```

---

## 5. Estilos CSS Globales (PrimeNG)

### 5.1 Archivo CSS del Componente

Crear/actualizar el archivo `component.component.css`:

```css
/* Estilos específicos del componente */

/* Headers de tabla */
::ng-deep .p-datatable .p-datatable-thead > tr > th {
  background-color: #1f2937 !important;
  color: #ffffff !important;
  border-bottom: 1px solid #374151 !important;
}

/* Dropdowns compactos */
::ng-deep .p-dropdown {
  font-size: 0.875rem !important; /* text-sm */
  height: 2.25rem !important;
}

::ng-deep .p-dropdown .p-dropdown-label {
  padding: 0.5rem 0.75rem !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}

::ng-deep .p-dropdown .p-dropdown-trigger {
  width: 2.25rem !important;
  height: 2.25rem !important;
}

/* Calendarios compactos */
::ng-deep .p-calendar {
  font-size: 0.875rem !important;
}

::ng-deep .p-calendar .p-inputtext {
  padding: 0.375rem 0.75rem !important;
  font-size: 0.875rem !important;
  height: 2rem !important;
}

::ng-deep .p-calendar .p-datepicker-trigger {
  width: 2rem !important;
  height: 2rem !important;
}

/* Inputs de texto */
::ng-deep .p-inputtext {
  font-size: 0.875rem !important;
  padding: 0.5rem 0.75rem !important;
}

/* Badges de estado */
.estado-badge {
  @apply inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.estado-creado { 
  @apply bg-blue-500 text-white; 
}

.estado-planificado { 
  @apply bg-yellow-500 text-black; 
}

.estado-asignado { 
  @apply bg-orange-500 text-white; 
}

.estado-despachado { 
  @apply bg-green-600 text-white; 
}

.estado-validado { 
  @apply bg-purple-600 text-white; 
}

/* Botones pequeños en tabla */
::ng-deep .p-datatable .p-button.p-button-sm {
  padding: 0.375rem 0.5rem !important;
  font-size: 0.75rem !important;
}

::ng-deep .p-datatable .p-button .p-button-icon {
  font-size: 0.875rem !important;
}

/* Hover effects para filas */
::ng-deep .p-datatable .p-datatable-tbody > tr {
  transition: background-color 0.15s ease-in-out;
}

::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
  background-color: #f9fafb !important;
}

/* Diálogos */
::ng-deep .p-dialog .p-dialog-header {
  background-color: #1f2937 !important;
  color: #ffffff !important;
  padding: 1rem 1.5rem !important;
  border-bottom: 1px solid #374151 !important;
}

::ng-deep .p-dialog .p-dialog-header .p-dialog-title {
  font-weight: 600 !important;
  font-size: 1rem !important;
  color: #ffffff !important;
}

::ng-deep .p-dialog .p-dialog-content {
  padding: 1.5rem !important;
}

/* Paginador */
::ng-deep .p-paginator {
  background-color: #ffffff !important;
  border-top: 1px solid #e5e7eb !important;
  padding: 0.75rem 1rem !important;
}

::ng-deep .p-paginator .p-paginator-pages .p-paginator-page {
  min-width: 2rem !important;
  height: 2rem !important;
  font-size: 0.875rem !important;
}
```

---

## 6. Paleta de Colores

### 6.1 Colores Principales

- **Fondo general**: `bg-gray-50`
- **Fondo blanco**: `bg-white`
- **Header oscuro**: `bg-gray-800` (#1f2937)
- **Texto header**: `text-white` o `text-gray-100`
- **Texto principal**: `text-gray-700` o `text-gray-900`
- **Texto secundario**: `text-gray-500` o `text-gray-400`
- **Bordes**: `border-gray-200`, `border-gray-700`

### 6.2 Colores de Botones

- **Buscar/Acción primaria**: `bg-gray-700 hover:bg-gray-600`
- **Nuevo/Crear**: `bg-amber-600 hover:bg-amber-700`
- **Editar**: `severity="primary"` (azul)
- **Eliminar**: `severity="danger"` (rojo)
- **Ver/Detalle**: `severity="secondary"` (gris)

### 6.3 Colores de Estados

- **Creado**: `bg-blue-500 text-white`
- **Planificado**: `bg-yellow-500 text-black`
- **Asignado**: `bg-orange-500 text-white`
- **Despachado**: `bg-green-600 text-white`
- **Validado**: `bg-purple-600 text-white`

---

## 7. Diálogos (Modales)

### 7.1 Estructura de Diálogo

```html
<p-dialog
  header="Título del Diálogo"
  [(visible)]="modalVisible"
  [modal]="true"
  [style]="{ width: '80vw' }"
  [baseZIndex]="10000"
  styleClass="p-fluid"
>
  <ng-template pTemplate="content">
    <!-- Contenido aquí -->
  </ng-template>

  <ng-template pTemplate="footer">
    <button
      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md shadow-sm transition-all duration-150"
      pButton
      label="Cerrar"
      icon="pi pi-times"
      iconPos="left"
      (click)="modalVisible = false">
    </button>
  </ng-template>
</p-dialog>
```

---

## 8. Checklist de Aplicación

### 8.1 Estructura HTML

- [ ] Contenedor principal con `bg-gray-50`
- [ ] Header con breadcrumb y título
- [ ] Sección de filtros con header oscuro
- [ ] Tabla con header oscuro y contador
- [ ] Diálogos con header oscuro

### 8.2 Estilos CSS

- [ ] Archivo CSS creado/actualizado
- [ ] Estilos de PrimeNG aplicados (`::ng-deep`)
- [ ] Badges de estado definidos
- [ ] Hover effects en filas
- [ ] Componentes compactos (dropdowns, calendars)

### 8.3 Componentes PrimeNG

- [ ] Dropdowns con `styleClass="text-sm border-gray-300"`
- [ ] Calendars con `styleClass="text-sm border-gray-300"`
- [ ] Inputs con `class="w-full text-sm border-gray-300"`
- [ ] Botones con clases de estilo consistentes
- [ ] Tabla con `styleClass="p-datatable-sm"`

### 8.4 Responsive

- [ ] Grid de filtros responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- [ ] Header responsive (`flex-col sm:flex-row`)
- [ ] Tabla responsive (`[responsive]="true"`)

---

## 9. Ejemplo Completo de Implementación

Ver el componente de referencia:
- `src/app/modules/admin/b2b/list/list.component.html`
- `src/app/modules/admin/b2b/list/list.component.css`
- `src/app/modules/admin/b2b/list/list.component.ts`

---

## 10. Notas Importantes

### 10.1 Uso de `::ng-deep`

- ⚠️ `::ng-deep` es necesario para sobrescribir estilos de PrimeNG
- ⚠️ Se recomienda usar `!important` para asegurar que los estilos se apliquen
- ⚠️ Considerar encapsulación de estilos si es necesario

### 10.2 Responsive Design

- Los breakpoints de Tailwind son:
  - `sm:` 640px
  - `md:` 768px
  - `lg:` 1024px
  - `xl:` 1280px

### 10.3 Iconos

- Usar FontAwesome para botones: `icon="fa fa-*"`
- Usar PrimeIcons para iconos de UI: `icon="pi pi-*"`
- Usar Heroicons para iconos de Material: `[svgIcon]="'heroicons_outline:*'"`

---

**Fin del Documento**
