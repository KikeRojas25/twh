export interface PedidoDetalleRequest {
  codigo: string;
  cantidad: number;
  unidadMedidaId: number;
  referencia?: string;
}

export interface PedidoCompradorRequest {
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  correo?: string;
  direccionEntrega: string;
  codigoDepartamento?: string;
  departamento?: string;
  codigoProvincia?: string;
  provincia?: string;
  codigoDistrito?: string;
  distrito?: string;
  iddestino: number;
  referenciaDireccion?: string;
  contactoEntrega?: string;
  telefonoEntrega?: string;
  latitud?: number;
  longitud?: number;
}

export interface PedidoRequest {
  idPedidoExterno?: number;
  fechaRequerida: string; // formato ISO yyyy-MM-dd
  horaRequerida?: string;
  proveedor?: string;
  ordenCompraCliente?: string;
  observaciones?: string;
  latitud?: number;
  longitud?: number;
  comprador: PedidoCompradorRequest;
  detalle: PedidoDetalleRequest[];
}
export interface PedidoDetalle {
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
}