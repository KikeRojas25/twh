export interface PropietarioAutorizado {
    id: number;
    nombre: string;
    nombreCorto?: string;
}

export interface ChatRequest {
    conversacionId?: string | null;
    mensaje: string;
}

export interface ChartDataset {
    label: string;
    data: number[];
}

export interface ChartData {
    tipo: 'bar' | 'line' | 'pie' | 'doughnut';
    titulo?: string;
    labels: string[];
    datasets: ChartDataset[];
}

export interface FuncionInvocada {
    nombre: string;
    parametrosJson: string;
    duracionMs: number;
    ok: boolean;
    error?: string;
}

export interface LimiteEstado {
    consumoMesUSD: number;
    limiteMensualUSD: number;
    porcentajeUsado: number;
    nivel: 'ok' | 'warning_70' | 'warning_85' | 'warning_95' | 'blocked' | 'blocked_global' | string;
    bloqueado: boolean;
    mensaje?: string;
}

export interface ChatResponse {
    conversacionId: string;
    mensajeId: number;
    respuesta: string;
    datos?: ChartData | null;
    funciones: FuncionInvocada[];
    costoUSD: number;
    limite: LimiteEstado;
}

// Mensaje en la UI (puede ser local o persistido).
export interface UiMensaje {
    id?: number;
    rol: 'user' | 'assistant' | 'system';
    contenido: string;
    fecha: Date;
    datos?: ChartData | null;
    funciones?: FuncionInvocada[];
    error?: string;
    cargando?: boolean;
}

// Eventos del hub
export interface HubFunctionEvent {
    conversacionId: string;
    nombre: string;
    parametros?: string;
    ok?: boolean;
    duracionMs?: number;
}

export interface HubErrorEvent {
    conversacionId?: string;
    mensaje: string;
}

// Resultado del envío de correo en segundo plano (push del backend).
export interface EmailStatusEvent {
    ok: boolean;
    mensaje: string;
}

// Auditoría
export interface ConsumoDiario {
    fecha: string;
    costoUSD: number;
    numMensajes: number;
}

export interface RankingPropietario {
    idPropietario: number;
    nombre?: string;
    costoUSD: number;
    numMensajes: number;
    limiteMensualUSD: number;
    porcentajeUsado: number;
}

export interface RankingFuncion {
    funcion: string;
    llamadas: number;
    errores: number;
    duracionPromedioMs: number;
}

export interface DashboardChatIa {
    limiteGlobalUSD: number;
    consumoMesGlobalUSD: number;
    porcentajeUsadoGlobal: number;
    totalMensajesMes: number;
    propietariosActivosMes: number;
    rankingPropietarios: RankingPropietario[];
    consumoUltimos30Dias: ConsumoDiario[];
    rankingFunciones: RankingFuncion[];
}

export interface ConversacionResumen {
    id: string;
    idUsuario: number;
    idPropietario: number;
    tituloAuto?: string;
    fechaInicio: string;
    fechaUltimo: string;
    estado: number;
}

export interface MensajeAudit {
    id: number;
    conversacionId: string;
    rol: string;
    contenido?: string;
    funcionLlamada?: string;
    parametrosJson?: string;
    resultadoJson?: string;
    tokensInput: number;
    tokensOutput: number;
    costoUSD: number;
    duracionMs: number;
    fecha: string;
    error?: string;
}
