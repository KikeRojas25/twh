export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status?: string;
    dni?: string;
    phone?: string;
    /** Roles del usuario (RolId). Lo envía el login. */
    roles?: number[];
    /** True si tiene el rol Copilot: habilita el botón del chat en la cabecera. */
    esCopilot?: boolean;
}
