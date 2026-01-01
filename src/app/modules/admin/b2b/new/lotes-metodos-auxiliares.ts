// ============================================
// MÉTODOS AUXILIARES PARA: new.component.ts
// ============================================
// Agregar estos métodos al final de la clase (antes del cierre })
// ============================================

/**
 * Calcular el stock total sumando todos los lotes
 */
calcularStockTotal(): number {
  if (!this.lotesInfo || this.lotesInfo.length === 0) {
    return 0;
  }
  return this.lotesInfo.reduce((total, lote) => total + (lote.cantidadDisponible || 0), 0);
}

/**
 * Obtener la fecha de vencimiento más próxima
 */
obtenerProximoVencimiento(): string {
  if (!this.lotesInfo || this.lotesInfo.length === 0) {
    return 'N/A';
  }

  const lotesConFecha = this.lotesInfo.filter(l => l.fechaVencimiento);

  if (lotesConFecha.length === 0) {
    return 'Sin fechas';
  }

  const proximaFecha = lotesConFecha.reduce((min, lote) => {
    const fecha = new Date(lote.fechaVencimiento);
    return fecha < new Date(min) ? lote.fechaVencimiento : min;
  }, lotesConFecha[0].fechaVencimiento);

  // Formatear la fecha
  const fecha = new Date(proximaFecha);
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();

  return `${dia}/${mes}/${anio}`;
}
