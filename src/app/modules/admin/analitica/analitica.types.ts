/** Contratos de los 4 reportes analíticos (api/analitica). */

// ---------- 1. Proyección de ocupación ----------
export interface ProyeccionMes {
    periodo: string;              // ISO date, primer día del mes
    valorReal: number | null;     // null en los meses proyectados
    prediccion: number;
    bandaBaja: number;
    bandaAlta: number;
    tendencia: number | null;
    esHistorico: boolean;
    tipo: 'Histórico' | 'Proyección';
    diasConData: number;
}

export interface ProyeccionResumen {
    propietarioId: number;
    cliente: string;
    periodoActual: string | null;
    periodoProyectado: string | null;
    actual: number | null;
    proyectado: number | null;
    variacionPct: number | null;
    modelo: string;
    version: string;
    fechaEjecucion: string;
    diasHistoria: number;
    mesesHistoria: number;
    mae: number | null;
    mape: number | null;
    intervaloConfianza: number;
    coberturaCalibrada: number | null;
    estado: string;               // OK | SIN_CALIBRAR | FALLBACK
    mensaje: string | null;
}

export interface ProyeccionResponse {
    serie: ProyeccionMes[];
    resumen: ProyeccionResumen | null;
}

// ---------- Dashboard: proyección del almacén completo ----------
/** El pasado trae valorReal; el futuro trae prediccion + banda. Nunca los dos a la vez. */
export interface ProyeccionAlmacenMes {
    periodo: string;
    valorReal: number | null;
    prediccion: number | null;
    bandaBaja: number | null;
    bandaAlta: number | null;
    tendencia: number | null;
    esHistorico: boolean;
    tipo: 'Histórico' | 'Proyección';
    clientes: number;
}

export interface ProyeccionAlmacenResumen {
    periodoActual: string | null;
    periodoProyectado: string | null;
    actual: number | null;
    proyectado: number | null;
    variacionPct: number | null;
    /** Clientes que siguen operando: los únicos que proyectan hacia adelante. */
    clientesVigentes: number;
    clientesModelados: number;
    fechaEjecucion: string | null;
    mesesHistoria: number;
}

export interface ProyeccionAlmacenResponse {
    serie: ProyeccionAlmacenMes[];
    resumen: ProyeccionAlmacenResumen | null;
}

// ---------- 2. Inventario por cliente ----------
export interface InventarioProducto {
    productoId: string;
    codigo: string | null;
    descripcionLarga: string | null;
    cantidad: number | null;
    ubicaciones: number;
    pct: number | null;
    pctAcum: number | null;
    clase: 'A' | 'B' | 'C';
}

export interface InventarioClienteResumen {
    propietarioId: number;
    cliente: string | null;
    fecha: string | null;
    /** Ubicaciones distintas que ocupa el cliente (su huella real). */
    totalUbicaciones: number;
    /** Denominador del Pareto: una ubicación compartida cuenta para cada producto. */
    ubicacionesProducto: number;
    productosAlmacenados: number;
    topCodigo: string | null;
    topDescripcion: string | null;
    topUbicaciones: number | null;
    topPct: number | null;
    claseA: number;
    claseB: number;
    claseC: number;
}

export interface InventarioClienteResponse {
    productos: InventarioProducto[];
    resumen: InventarioClienteResumen | null;
}

// ---------- 3. Pareto de clientes ----------
export interface ParetoCliente {
    propietarioId: number;
    cliente: string;
    ubicaciones: number;
    simple: number;   // pallets en rack simple
    doble: number;    // pallets en rack doble
    stage: number;    // pallets en stage
    pct: number | null;
    pctAcum: number | null;
    clase: 'A' | 'B' | 'C' | 'D';
}

export interface ParetoClientesResumen {
    fecha: string | null;
    clientesActivos: number;
    topCliente: string | null;
    topUbicaciones: number | null;
    /** Ubicaciones físicas distintas ocupadas (cuadra con el reporte de Ocupabilidad). */
    totalUbicacionesDistintas: number;
    /** Suma de huellas por cliente (denominador del Pareto, no el conteo físico). */
    totalUbicaciones: number;
    simple: number;
    doble: number;
    stage: number;
    simplePct: number | null;
    doblePct: number | null;
    claseA: number;
    claseB: number;
    claseC: number;
    claseD: number;
}

export interface ParetoClientesResponse {
    clientes: ParetoCliente[];
    resumen: ParetoClientesResumen | null;
}

// ---------- 4. ABC por producto ----------
export type CriterioAbc = 'MOVIMIENTOS' | 'CANTIDAD' | 'INVENTARIO';

export interface AbcProducto {
    productoId: string;
    codigo: string | null;
    descripcionLarga: string | null;
    valor: number;
    numMovimientos: number;
    cantRetirada: number;
    stockActual: number;
    pctAcumulado: number | null;
    clase: 'A' | 'B' | 'C' | 'D';
}

export interface AbcProductoResumen {
    propietarioId: number;
    cliente: string | null;
    criterio: CriterioAbc;
    dias: number;
    calculado: boolean;           // false = nunca se generó para ese período
    fechaCalculo: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    totalProductos: number;
    claseA: number;
    claseB: number;
    claseC: number;
    claseD: number;
}

export interface AbcProductoResponse {
    productos: AbcProducto[];
    resumen: AbcProductoResumen | null;
}

// ---------- 5. Ingresos de mercadería (kardex) ----------

/** Las 4 métricas responden preguntas distintas; la pantalla deja elegir cuál se grafica. */
export type MetricaIngreso = 'pallets' | 'unidades' | 'ordenes' | 'lineas';

export interface IngresoMes {
    periodo: string;              // ISO date, primer día del mes
    ingresoPallets: number;
    ingresoUnidades: number;
    ingresoOrdenes: number;
    ingresoLineas: number;
    /** Pallets VACIADOS en el mes. Un pallet con picks parciales tiene salidas en
     *  muchos días distintos, pero solo desocupa su ubicación cuando se vacía. */
    salidaPallets: number;
    salidaUnidades: number;
    salidaLineas: number;
    netoPallets: number;
    netoUnidades: number;
}

export interface IngresoCliente {
    propietarioId: number;
    cliente: string | null;
    ingresoPallets: number;
    ingresoUnidades: number;
    ingresoOrdenes: number;
    ingresoLineas: number;
    salidaPallets: number;
    salidaUnidades: number;
    netoPallets: number;
    mesesConIngreso: number;
    pct: number | null;
    pctAcum: number | null;
}

export interface IngresoResumen {
    fechaDesde: string;
    fechaHasta: string;
    propietarioId: number | null;
    cliente: string | null;
    /** Acotado a almacenes 8 y 12. Solo válido desde sep-2025: antes el kardex no
     *  se puede mapear a almacén (cobertura 7.7%) y el filtro mutila la serie. */
    soloOperativos: boolean;
    clientesConIngreso: number;
    totalPallets: number;
    totalUnidades: number;
    totalOrdenes: number;
    totalLineas: number;
    salidaPallets: number;
    salidaUnidades: number;
    mesesEnRango: number;
    palletsPromedioMes: number | null;
}

export interface IngresosResponse {
    serie: IngresoMes[];
    clientes: IngresoCliente[];
    resumen: IngresoResumen | null;
}
