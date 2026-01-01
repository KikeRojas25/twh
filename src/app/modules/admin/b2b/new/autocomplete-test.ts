// MÉTODOS PARA AGREGAR/REEMPLAZAR EN new.component.ts

// Reemplazar el método buscarProductos (línea 253-269) con este:
buscarProductos(event: any): void {
  console.log('🔍 buscarProductos llamado', event);

  const texto = event.query?.trim();
  console.log('📝 Texto de búsqueda:', texto);
  console.log('👤 Propietario ID:', this.idPropietario);

  // Validar que existe el texto
  if (!texto) {
    console.warn('⚠️ No hay texto de búsqueda');
    this.productosFiltrados = [];
    return;
  }

  // Validar longitud mínima
  if (texto.length < 3) {
    console.warn('⚠️ Texto muy corto, mínimo 3 caracteres');
    this.productosFiltrados = [];
    return;
  }

  // Validar que hay propietario seleccionado
  if (!this.idPropietario) {
    console.error('❌ No hay propietario seleccionado');
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención',
      detail: 'Debe seleccionar un propietario primero'
    });
    this.productosFiltrados = [];
    return;
  }

  console.log('✅ Llamando al servicio...');

  // Realizar búsqueda
  this.productoService.buscarProductosPorPropietario(this.idPropietario, texto)
    .subscribe({
      next: (res) => {
        console.log('✅ Respuesta del servicio:', res);

        if (!res || res.length === 0) {
          console.warn('⚠️ Sin resultados');
          this.productosFiltrados = [];
          this.messageService.add({
            severity: 'info',
            summary: 'Sin resultados',
            detail: `No se encontraron productos con "${texto}"`
          });
          return;
        }

        this.productosFiltrados = res.map(p => ({
          id: p.id,
          codigo: p.codigo,
          nombreCompleto: p.nombreCompleto || p.descripcion || p.nombre,
          unidad: p.unidad || 'UND',
          ...p
        }));

        console.log('✅ Productos filtrados:', this.productosFiltrados.length);
      },
      error: (err) => {
        console.error('❌ Error al buscar productos:', err);
        this.productosFiltrados = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo realizar la búsqueda: ' + (err.message || 'Error desconocido')
        });
      }
    });
}

// Agregar este nuevo método
onProductoSeleccionado(event: any): void {
  console.log('✅ Producto seleccionado:', event);
  this.model.productoSeleccionado = event;
}

// Agregar este nuevo método
limpiarProducto(): void {
  this.model.productoSeleccionado = null;
  this.model.cantidad = null;
  this.model.lote = null;
  this.model.referencia = null;
}
