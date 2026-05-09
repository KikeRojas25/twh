export interface Producto {
    id: any;
    ClienteId: number;
    AlmacenId: number;
    FamiliaId: number;
    codigo: string;
    codigoTWH: string;
    codigoEAN?: string;
    descripcionLarga: string;
    seriado: boolean;
    etiquetado: boolean;
    cliente: string;
    familia?: string;
    canal?: string;
    volumen?: number;
    ancho?: number;
    alto?: number;
    largo?: number;
    sobredimensionado?: number;
}
