export interface Huella {
    id: any;
    productoId: any;
    codigoHuella: string;
    caslvl: number;
    cantidad: number;
    fechaRegistro: string;
}

export interface HuellaDetalle {
    id: number;
    huellaId?: number;
    height: number;
    length: number;
    width: number;
    grswgt?: number;
    netwgt?: number;
    unidadMedidaId: number;
    unidadMedida: string;
    untQty: number;
}
