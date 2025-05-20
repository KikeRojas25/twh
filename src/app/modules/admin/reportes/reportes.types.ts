export interface OrderSummary {
    totalOrdenes: number;
    pickingValidado: number;
    'picking Validado %': number;
    pickingIniciado: number;
    'picking Iniciado %': number;
    pickingFinalizado: number;
    'picking Finalizado %': number;
    despachado: number;
    'despachado %': number;
    ordenesRetrasadas: number;
    tasaConfirmacion: number;
    pendientes: number;
    planificado:number;
    tasaEntrega:number;
    pendiente: number;
    programado: number;
    enRuta: number;
    entregado: number;
  }
  
  export interface ReporteAjusteInventario {
  lodNum: string;
  propietarioId: number;
  nueva: string;
  antigua: string;
  fechaHoraAjuste: Date;
  propietario: string;
}
