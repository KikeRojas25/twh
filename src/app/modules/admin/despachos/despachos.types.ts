export interface OrdenSalida {
    id?: any;
    Id?: number;
    ordenSalidaId?: any ;
    numOrden?: string ;
    NumOrden?: string;
    propietarioId?: number ;
    PropietarioId?: number;
    propietario?: string ;
    Propietario?: string;
    almacenId?: number ;
    AlmacenId?: number;
    Almacen?: string ;
    guiaRemision?: string ;
    GuiaRemision?: string;
    fechaRequerida?: Date ;
    FechaRequerida?: Date;
    horaRequerida?: string;
    HoraRequerida?: string;
    fechaRegistro?: Date ;
    FechaRegistro?: Date;
    EstadoID?: number ;
    EstadoId?: number;
    equipotransporte?: string;
    EquipoTransporteId?: number;
    NombreEstado?: string ;
    nombreEstado?: string;
    ubicacion?: string;
    UbicacionId?: number;
    clienteId?: number;
    ClienteId?: number;
    direccionId?: number;
    DireccionId?: number;
    tipoServicio?: string;
    peso?: number;
    estado?: string;
    detalles?: OrdenSalidaDetalle[];
    ordenDetalle?: OrdenSalidaDetalle[];
    OrdenDetalle?: OrdenSalidaDetalle[];
    destinatario?: string;
    direccion?: string;
    productos?: number;
    Items?: number;
    unidades?: number;
    ordenCompraCliente?: string;
    OrdenCompraCliente?: string;
    TipoRegistro?: string;
    tipoRegistro?: string;
    TipoRegistroId?: number;
    usuarioregistro?: string;
    UsuarioRegistro?: number;
    fechaEsperada?: Date;
    // Propiedades adicionales del backend
    contacto?: string;
    telefono?: string;
    correo?: string;
    tipodescargaid?: number;
    ordenentrega?: string;
    ordeninfor?: string;
    codigodespacho?: string;
    distrito?: string;
    departamento?: string;
    sucursal?: string;
    Tamano?: string;
    GuiaRemisionIngreso?: string;
    OCIngreso?: string;
    cantidad?: number;
    IdCarga?: number;
    CargaId?: number;
    ShipmentId?: number;
    Bultos?: number;
    LatitudDestino?: number;
    LongitudDestino?: number;
    IdTipoDespacho?: number;
    PedUbicacionId?: number;
    Activo?: boolean;
    ProveedorRequestJson?: string;
    ProveedorResponseJson?: string;
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
