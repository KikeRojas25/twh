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
    destinatario?: string;
    direccion?: string;
    productos?: number;
    unidades?: number;
    ordenCompraCliente?: string;
    TipoRegistro?: string;
    tipoRegistro?: string;
    usuarioregistro?: string;
    nombreEstado?: string;
    fechaEsperada?: Date;
}

export interface OrdenSalidaDetalle {
    id?: number;
    OrdenReciboId?: number;
    linea?: string;
    ProductoId?: any;
    producto?: string;
    Lote?: string;
    HuellaId?: number;
    FechaRegistro?: Date;
    EstadoId?: number;
    cantidad?: number;
    cantidadEnBulto?: number;
    fechaExpire?: Date;
    propietarioId?: number;


    cantidadEnBultos?: number;
    cantidadPendiente?: number;

}

export interface carga {
    id	:  number ;
    numCarga	:  string ;
    propietario	:  string ;
    propietarioId?: number;
    fechaRegistro	:  Date ;
    estadoId	:  number ;
    equipotransporte: string;
    equipoTransporte?: string;
    NombreEstado:  string ;
    ubicacion: string;
    destino: string ;
    usuarioId: number;
    fechaInicio: string;
    destinoId: number;
    ordenSalidaId: number;
    shipmentNumber?: string;
    placa?: string;
    estado?: string;
    workNum?: string;
    
}


export  interface BultoProducto {
  id?: number; // 👈 este es el id real en BD del BultoSalidaDetalle
  productoId: number;
  productoNombre: string;
  lote: string;
  cantidadAsignada: number;
}




// export interface BultoSalida {
//   id?: number;
//   numeroBulto: number;
//   peso: number;
//   fechaRegistro?: Date;
//   idUsuarioRegistro: number;
//   ordenSalidaId: number;

//   productos?: BultoProducto[];

// }

export interface BultoSalidaDetalle {
  id?: number;
  ordenSalidaDetalleId: number;
  cantidad: number;
  bultoSalidaId?: number;
}

export interface BultoSalida {
  id?: number;
  numeroBulto: number;
  peso: number;
  fechaRegistro?: Date;
  idUsuarioRegistro: number;
  ordenSalidaId: number;

  // 👇 Agrega esto para que funcione la carga de bultos con detalles
  detalles?: BultoSalidaDetalle[];

  // 👇 Esto es solo para uso interno del frontend
  productos?: BultoProducto[];
}
