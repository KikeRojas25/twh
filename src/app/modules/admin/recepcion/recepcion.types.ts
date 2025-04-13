
export interface OrdenRecibo {
    ordenReciboId	:  any ;
    numOrden	:  string ;
    propietarioId	:  number ;
    propietario	:  string ;
    almacenId	:  number ;
    Almacen	:  string ;
    guiaRemision	:  string ;
    fechaEsperada	:  Date ;
    horaEsperada: string;
    fechaRegistro	:  Date ;
    estadoID:  number ;
    equipotransporte: string;
    nombreEstado: string ;
    ubicacion: string;
    detalles: OrdenReciboDetalle[];
}

export interface OrdenReciboDetalle {
    id?: number;
    OrdenReciboId: number;
    linea: string;
    productoId: any;
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
export interface EquipoTransporte {
    id: any;
    equipoTransporte: string;
    placa	:  any ;
    ruc	:  string ;
    dni	:  number ;
    estado: string;
    tipoVehiculo: string;
    chofer: string;    
    equipoTransporteId: number;
    nombreCompleto: string;
    tipoVehiculoId:number;
    marcaId: number;
    razonSocial: string;
    brevete: string;
}

