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
  canal?: string;
  volumen?: number;
  ancho?: number;
  alto?: number;
  largo?: number;
  sobredimensionado?: number;
}