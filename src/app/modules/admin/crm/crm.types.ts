// Tipos del módulo CRM (Fase 1: Entidades + Contactos).

export type EstadoEntidad = 'PROSPECTO' | 'CLIENTE' | 'INACTIVO' | 'DESCARTADO';

export type RolContacto = 'COMERCIAL' | 'OPERATIVO' | 'FACTURACION' | 'DECISOR' | 'OTRO';

export interface EntidadListItem {
  entidadId: number;
  razonSocial: string;
  ruc: string;
  nombreComercial?: string | null;
  estado: EstadoEntidad;
  origen?: string | null;
  propietarioWmsId?: number | null;
  propietarioUsuarioId?: number | null;
  propietarioNombre?: string | null;
  fechaCreacion: string;
  totalContactos: number;
}

export interface Vendedor {
  id: number;
  nombre: string;
}

/** Propietario del WMS (cliente operativo) — destino de la bisagra. */
export interface PropietarioWmsRef {
  id: number;
  nombre: string;
  documento?: string;
}

export interface Contacto {
  contactoId: number;
  entidadId: number;
  nombres: string;
  apellidos?: string | null;
  cargo?: string | null;
  rol: RolContacto;
  email?: string | null;
  telefono?: string | null;
  celular?: string | null;
  esPrincipal: boolean;
  activo: boolean;
}

export interface EntidadDetail {
  entidadId: number;
  razonSocial: string;
  ruc: string;
  nombreComercial?: string | null;
  giro?: string | null;
  estado: EstadoEntidad;
  origen?: string | null;
  propietarioWmsId?: number | null;
  propietarioWmsNombre?: string | null;
  propietarioUsuarioId?: number | null;
  propietarioNombre?: string | null;
  fechaCreacion: string;
  fechaModificacion?: string | null;
  contactos: Contacto[];
}

export type TipoComunicacion =
  | 'LLAMADA' | 'CORREO' | 'VISITA' | 'REUNION' | 'WHATSAPP' | 'NOTA';

export type DireccionComunicacion = 'ENTRANTE' | 'SALIENTE';

export interface Comunicacion {
  comunicacionId: number;
  entidadId: number;
  contactoId?: number | null;
  contactoNombre?: string | null;
  oportunidadId?: number | null;
  oportunidadNombre?: string | null;
  tipo: TipoComunicacion;
  direccion?: DireccionComunicacion | null;
  asunto?: string | null;
  detalle?: string | null;
  fecha: string;
  usuarioId?: number | null;
  usuarioNombre?: string | null;
}

export type EtapaOportunidad =
  | 'PROSPECCION' | 'VISITA' | 'PROPUESTA' | 'NEGOCIACION' | 'GANADA' | 'PERDIDA';

export interface OportunidadCard {
  oportunidadId: number;
  entidadId: number;
  entidadRazonSocial: string;
  nombre: string;
  etapa: EtapaOportunidad;
  valorEstimadoMensual: number;
  probabilidad: number;
  motivoPerdida?: string | null;
  fechaCierreEstimada?: string | null;
  fechaCierreReal?: string | null;
  propietarioUsuarioId?: number | null;
  propietarioNombre?: string | null;
  orden: number;
  numComunicaciones: number;
  numAdjuntos?: number;
  numActividadesPendientes?: number;
  proximaActividadFecha?: string | null;
  proximaActividadTitulo?: string | null;
  fechaUltimoCambio?: string;
}

export type TipoActividad = 'LLAMAR' | 'ENVIAR_PROPUESTA' | 'VISITAR' | 'SEGUIMIENTO' | 'OTRO';
export type EstadoActividad = 'PENDIENTE' | 'COMPLETADA' | 'VENCIDA';

export interface Actividad {
  actividadId: number;
  entidadId?: number | null;
  oportunidadId?: number | null;
  oportunidadNombre?: string | null;
  titulo: string;
  tipo: TipoActividad;
  fechaVencimiento: string;
  estado: EstadoActividad;
  vencida: boolean;
  responsableUsuarioId?: number | null;
  responsableNombre?: string | null;
  fechaCompletada?: string | null;
}

export type EstadoPropuesta = 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA';

export type TipoServicio =
  | 'ALMACENAJE_POSICION' | 'ALMACENAJE_M3' | 'PICKING_LINEA' | 'RECEPCION'
  | 'DESPACHO' | 'CROSSDOCKING' | 'VALOR_AGREGADO' | 'TRANSPORTE' | 'OTRO';

export type Moneda = 'PEN' | 'USD';

export interface PropuestaTarifa {
  propuestaTarifaId?: number;
  tipoServicio: TipoServicio;
  descripcion?: string | null;
  unidad?: string | null;
  precioUnitario: number;
  cantidadProyectada?: number | null;
  moneda: Moneda;
  subtotal?: number;
}

export interface PropuestaSummary {
  propuestaId: number;
  oportunidadId: number;
  version: number;
  estado: EstadoPropuesta;
  fechaEnvio?: string | null;
  fechaCreacion: string;
  numLineas: number;
  totalMensualPEN: number;
  totalMensualUSD: number;
}

export interface PropuestaDetail {
  propuestaId: number;
  oportunidadId: number;
  version: number;
  estado: EstadoPropuesta;
  fechaEnvio?: string | null;
  notas?: string | null;
  fechaCreacion: string;
  fechaModificacion?: string | null;
  totalMensualPEN: number;
  totalMensualUSD: number;
  tarifas: PropuestaTarifa[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface EstadoCorreo {
  conectado: boolean;
  email?: string | null;
}

export interface BandejaCorreo {
  messageId: string;
  de?: string | null;
  deNombre?: string | null;
  asunto?: string | null;
  fecha?: string | null;
  snippet?: string | null;
  conocido: boolean;
  contactoId?: number | null;
  contactoNombre?: string | null;
  entidadId?: number | null;
  entidadRazonSocial?: string | null;
  yaVinculado: boolean;
}

export interface MetaVendedor {
  vendedorUsuarioId: number;
  vendedorNombre?: string | null;
  anio: number;
  mes: number;
  monto: number;
}

/** Actividad con responsable + contexto, para la vista "Actividades por vendedor". */
export interface ActividadAgenda {
  actividadId: number;
  titulo: string;
  tipo: string;
  fechaVencimiento: string;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'VENCIDA';
  fechaCompletada?: string | null;
  responsableUsuarioId?: number | null;
  responsableNombre?: string | null;
  entidadId?: number | null;
  entidadRazonSocial?: string | null;
  oportunidadId?: number | null;
  oportunidadNombre?: string | null;
}

export interface RucInfo {
  ruc: string;
  encontrado: boolean;
  razonSocial?: string | null;
  direccion?: string | null;
  estado?: string | null;
  condicion?: string | null;
  mensaje?: string | null;
}

export interface Adjunto {
  adjuntoId: number;
  oportunidadId: number;
  nombreArchivo: string;
  contentType?: string | null;
  extension?: string | null;
  tamano: number;
  subidoPorUsuarioId?: number | null;
  subidoPorNombre?: string | null;
  fechaCreacion: string;
}
