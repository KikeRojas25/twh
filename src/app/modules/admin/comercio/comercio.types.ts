export interface ComercioSearchResultDto {
    idComercio: number;
    publicId: string;
    razonSocial: string;
    ruc: string;
    nombreCorto: string;
    telefono: string;
    direccionFiscal: string;
    tipoComercio: string;
    estado: string;
    tipoEntrega: string;
    idEstado: number;
    urlImage: string;
    urlMuro: string;
}

export class ComercioSearchParams {
    nombre: string;
    idTipoEntrega?: number;
    idTipoComercio?: number;
    idEstado?: number;

    constructor(nombre: string, idTipoEntrega?: number, idTipoComercio?: number, idEstado?: number) {
        this.nombre = nombre;
        this.idTipoEntrega = idTipoEntrega;
        this.idTipoComercio = idTipoComercio;
        this.idEstado = idEstado;
    }
}
