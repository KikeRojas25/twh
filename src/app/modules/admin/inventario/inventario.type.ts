export interface Estado {
    id: any;
    nombreEstado: string;
    descripcion: string;
    tablaId: number;
}
export interface Ubicacion {
    id: number;
    ubicacion: string;
    area: string;
    estado: string ;
}

export interface Nivel {
    id: string;
    descripcion: string;
}

export interface Area {
    id: number;
    nombre: string;
}
export interface Producto {
    id: any;
    ClienteId: number;
    AlmacenId: number;
    FamiliaId: number;
    codigo: string;
    codigoTWH: string;
    descripcionLarga: string;
    seriado: boolean;
    etiquetado: boolean;
    cliente: string;
}

export interface Huella {
    id: any;
    productoId: any;
    codigoHuella: string;
    caslvl : number;
    cantidad: number;
    fechaRegistro : string;

   
}
export interface HuellaDetalle {
    id: number;
    height: number;
    length: number;
    width: number;
    unidadMedidaId: number;
    unidadMedida: string;
    untQty: number;
}
export interface Inventario {
    id?: number ;
    idpropietario: number;
    idalmacen: number;
    fecharegistro: Date;
    idusuario: number;
    propietario: string;
    almacen: string;
    usuarioregistro: string;
}

export interface GraficoStock {
    descripcionLarga?:  string ;
    untQty?:  number ;
}
export interface GraficoRecepcion {
    nombreEstado?:  string ;
    cantidad?:  number ;
}

export interface InventarioForEdit {
  id: number;
  lotNum: string;
  fechaExpire: string;       // Formato: 'YYYY-MM-DD' o similar
  fechaManufactura: string;  // Formato: 'YYYY-MM-DD'
}