export interface PreLiquidacion {
    id: any;
    productoId	:  any ;
    descripcionLarga	:  string ;
    fechaIngreso	:  Date ;
    ultimaLiquidacion	:  string ;
    fechaInicio: Date;
    fechaFin: Date;
    cantidad	:  number ;
    paletas: number;
    propietario: string;
    fechaLiquidacion: Date;
    numLiquidacion: string;
    subTotal: number;
    total: number;
    igv: number;
    estado: string;
}

export interface ResumenFacturacionPorMes {
    mes: number;
    cliente: string;
    totalIngreso?: number;
    totalSalida?: number;
    totalSeguro?: number;
    totalPosTotal?: number;
    totalPickingUnidad?: number;
    totalPickingCaja?: number;
    totalEtiquetado?: number;
    clienteId: number; 
    totalFacturado?: number; // <== AÑADE ESTE
}
