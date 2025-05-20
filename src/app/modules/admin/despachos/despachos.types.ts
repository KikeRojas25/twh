export interface OrdenSalida {
    id: any;
    ordenSalidaId: any ;
    numOrden: string ;
    propietarioId: number ;
    propietario: string ;
    almacenId: number ;
    Almacen: string ;
    guiaRemision: string ;
    fechaRequerida: Date ;
    horaRequerida: string;
    fechaRegistro: Date ;
    EstadoID: number ;
    equipotransporte: string;
    NombreEstado: string ;
    ubicacion: string;
    clienteId: number;
    direccionId: number;
    tipoServicio: string;
    peso: number;
    estado:string;
    detalles: OrdenSalidaDetalle[];
}

export interface OrdenSalidaDetalle {
    id?: number;
    OrdenReciboId: number;
    linea: string;
    ProductoId: any;
    producto: string;
    Lote: string;
    HuellaId?: number;
    FechaRegistro?: Date;
    EstadoId: number;
    cantidad: number;
    cantidadRecibida?: number;
    cantidadFaltante?: number;
    cantidadSobrante?: number;
    fechaExpire?: Date;
    propietarioId: number;

}

export interface carga {
    id	:  number ;
    numCarga	:  string ;
    propietario	:  string ;
    fechaRegistro	:  Date ;
    estadoId	:  number ;
    equipotransporte: string;
    NombreEstado:  string ;
    ubicacion: string;
    destino: string ;
    usuarioId: number;
    fechaInicio: string;
    destinoId: number;
    
}