export interface Rol {
    id: number;
    descripcion: string;
    alias: string;
    activo?: boolean;
    publico?: boolean;
}

export interface RolForUpsert {
    descripcion: string;
    alias: string;
    activo: boolean;
    publico: boolean;
}

export interface Pagina {
    id: number;
    codigo: string;
    codigoPadre: string;
    descripcion: string;
    link: string;
    nivel: number;
    orden: number;
    icono: string;
}

export interface RolPagina {
    idRol: number;
    idPagina: number;
    permisos: string;
}
