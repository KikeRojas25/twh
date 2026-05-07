export interface Almacen {
    id: number;
    descripcion: string;
    activo?: boolean;
}

export interface AlmacenForUpsert {
    descripcion: string;
    activo: boolean;
}