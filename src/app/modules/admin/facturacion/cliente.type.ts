export interface Cliente {
    id: number;
    nombre: string;
    razonSocial: string;
    tipoDocumentoId: number;
    documento: string;
    etiquetado: string;

    idCliente: number;
    cliente: string;
}
export interface Sucursal {
    idTienda: number;
    codTienda : string;
    descripTienda: string;
    idCliente: number;
   
}
export interface Grupo {
    id : number;
    nombre: string;
}

