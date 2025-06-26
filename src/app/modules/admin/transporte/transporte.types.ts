

export interface tarifario {
    id: number;
    iddistrito_origen: number;
    iddistrito_destino: number;
    idprovincia_origen: number ;
    idprovincia_destino: number;
    idtipounidad: number;
    razon_social: string;
    ruc: string;
    provincia_destino: string;
    distrito_destino: string;
    provincia_origen: string;
    distrito_origen: string;
    tipounidad: string;
    tarifa: number;
}

export interface Distrito {
    idDistrito: number;
    distrito: string;
}
export interface Provincia {
    idprovincia: number;
    provincia: string;
}

export interface Distrito {
    iddistrito: number;
    distrito: string;
}
export interface TarifaProveedorTransporte {
  id?: number;
  idProveedor: number;
  idOrigenDistrito?: number;
  idOrigenProvincia?: number;
  idOrigenDepartamento?: number;
  idDestinoDistrito?: number;
  idDestinoProvincia?: number;
  idDestinoDepartamento?: number;
  idTipoUnidad?: number;
  precio?: number;
  adicional?: number;
  desde?: number;
  hasta?: number;
  minimo?: number;  
  primerKilo?: number;
}
