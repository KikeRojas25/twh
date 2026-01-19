export type OrdenSalidaDetalleInput = {
  productoId: number;
  cantidad: number;
  estadoId?: any;
  lote?: string | null;
  referencia?: string | null;
  huellaId?: number | null;
};

export function formatFechaISO(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d).toISOString().split('T')[0];
}

export function formatHoraHHmm(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function buildOrdenSalidaCabeceraPayload(args: {
  formValue: any;
  propietarioLabel: string | null;
  usuarioId: number;
}): any {
  const { formValue, propietarioLabel, usuarioId } = args;

  return {
    Id: 0,
    PropietarioId: formValue.propietarioId,
    Propietario: propietarioLabel,
    NumOrden: null,
    AlmacenId: formValue.almacenId,
    GuiaRemision: formValue.guiaRemision || '',
    FechaRequerida: formatFechaISO(formValue.fechaRequerida),
    HoraRequerida: formatHoraHHmm(formValue.horaRequerida),
    OrdenCompraCliente: formValue.ordenCompraCliente || '',
    ClienteId: formValue.clienteId || 0,
    DireccionId: formValue.direccionId || 0,
    EquipoTransporteId: null,
    EstadoId: 0,
    UsuarioRegistro: usuarioId,
    UbicacionId: null,
    TipoRegistroId: 170,
    codigodespacho: null,
    distrito: null,
    departamento: null,
    contacto: formValue.contacto || null,
    telefono: formValue.telefono || null,
    usuarioid: usuarioId,
    sucursal: null,
    CargaMasivaId: 0,
    GuiaRemisionIngreso: null,
    tipodescargaid: formValue.tipoDescargaId ? Number(formValue.tipoDescargaId) : null,
    Items: 0,
    ordeninfor: formValue.ordenInfor || null,
    ordenentrega: formValue.ordenEntrega || null,
    Tamano: null,
    ocingreso: null,
    peso: null,
    cantidad: null,
    destino: null,
    referencia: null,
    Detalles: []
  };
}

export function buildOrdenSalidaUpdatePayload(args: {
  ordenSalidaId: number;
  cabeceraPayload: any;
  detalle: OrdenSalidaDetalleInput[];
}): any {
  const { ordenSalidaId, cabeceraPayload, detalle } = args;

  return {
    ...cabeceraPayload,
    Id: ordenSalidaId,
    Items: detalle.length,
    Detalles: detalle.map((x) => {
      const d: any = {
        productoId: x.productoId,
        cantidad: Number(x.cantidad),
        estadoId: x.estadoId || 0,
        huellaId: x.huellaId ? Number(x.huellaId) : 0
      };
      if (x.lote) d.lote = x.lote;
      if (x.referencia) d.referencia = x.referencia;
      if (x.huellaId !== null && x.huellaId !== undefined && typeof x.huellaId === 'number') {
        d.huellaId = Number(x.huellaId);
      }
      return d;
    })
  };
}

export function buildOrdenSalidaDetalleRegisterRequest(args: {
  ordenSalidaId: number;
  usuarioId: number;
  detalle: OrdenSalidaDetalleInput[];
}): any {
  const { ordenSalidaId, usuarioId, detalle } = args;

  return {
    OrdenSalidaId: ordenSalidaId,
    UsuarioRegistro: usuarioId,
    Items: detalle.length,
    Detalles: detalle.map((x) => {
      const d: any = {
        productoId: x.productoId,
        cantidad: Number(x.cantidad),
        estadoId: x.estadoId || 0,
        huellaId: x.huellaId ? Number(x.huellaId) : 0
      };
      if (x.lote) d.lote = x.lote;
      if (x.referencia) d.referencia = x.referencia;
      if (x.huellaId !== null && x.huellaId !== undefined && typeof x.huellaId === 'number') {
        d.huellaId = Number(x.huellaId);
      }
      return d;
    })
  };
}
