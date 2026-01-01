

export interface tarifario {
    id: number;
    iddistrito_origen: number;
    iddistrito_destino: number;
    idprovincia_origen: number ;
    idprovincia_destino: number;
    idtipounidad: number;
    razon_social: string;
    ruc: string;
    provincia_destino: string;
    distrito_destino: string;
    provincia_origen: string;
    distrito_origen: string;
    tipounidad: string;
    tarifa: number;
}

export interface Distrito {
    idDistrito: number;
    distrito: string;
}
export interface Provincia {
    idprovincia: number;
    provincia: string;
}

export interface Distrito {
    iddistrito: number;
    distrito: string;
}
export interface TarifaProveedorTransporte {
  id?: number;
  idProveedor: number;
  idOrigenDistrito?: number;
  idOrigenProvincia?: number;
  idOrigenDepartamento?: number;
  idDestinoDistrito?: number;
  idDestinoProvincia?: number;
  idDestinoDepartamento?: number;
  idTipoUnidad?: number;
  precio?: number;
  adicional?: number;
  desde?: number;
  hasta?: number;
  minimo?: number;  
  primerKilo?: number;
}

export interface OrdenTransporteResult {
  id: number;
  numero_ot: string;
  shipment: string;
  delivery: string;
  destinatario: string;
  remitente: string;
  por_asignar: boolean;
  remitente_id?: number;
  destinatario_id?: number;
  factura: string;
  oc: string;
  guias: string;
  cantidad?: number;
  volumen?: number;
  peso?: number;
  distrito_servicio: string;
  direccion_destino_servicio: string;
  fecha_salida?: Date;
  hora_salida: string;
  direccion_entrega: string;
  provincia_entrega: string;
  hora_entrega: string;
  fecha_entrega?: Date;
  numero_manifiesto: string;
  Estado: string;
  TipoEntrega: string;
  Placa: string;
  Chofer: string;
  fecha_registro?: Date;
  usuario_registro: string;
  cantidadFiles?: number;
  lat_waypoint?: number;
  lng_waypoint?: number;
  manifiesto_id?: number;
  orden_entrega?: number;
  fecha_eta?: Date;
  valorizado?: number;
  retorno_tarifa?: number;
  sobreestadia_tarifa?: number;
  adicionales_tarifa?: number;
  direccion_entrega_final: string;
}

export interface ManifiestoResult {
  id: number;
  numero_manifiesto: string;
  valorizado: number;
  sobreestadia_tarifa: number;
  adicionales_tarifa: number;
  fecha_salida?: Date;
  fecha_registro?: Date;
  estado_id?: number;
  shipment: string;
  estado: string;
  Placa: string;
  Chofer: string;
  idvehiculo: number;
  capacidadMaxima?: number;
  capacidadUtilizada?: number;
}