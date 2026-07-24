import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from 'environments/environment';
import { Observable, Subject } from 'rxjs';
import {
    ChatRequest,
    ChatResponse,
    ConversacionResumen,
    DashboardChatIa,
    EmailStatusEvent,
    HubErrorEvent,
    HubFunctionEvent,
    LimiteEstado,
    MensajeAudit,
    PropietarioAutorizado,
} from './chatia.types';

const STORAGE_KEY_PROPIETARIO_ACTIVO = 'chatia.propietarioActivoId';

@Injectable({ providedIn: 'root' })
export class ChatIaService {
    private _http = inject(HttpClient);
    private _auth = inject(AuthService);

    private _api = environment.baseUrl + '/api/chatia';

    /** Propietario activo seleccionado por el usuario para esta sesión. */
    readonly propietarioActivoId = signal<number | null>(this._loadStored());

    /** Lista de propietarios autorizados (cargada al abrir el chat). */
    readonly propietariosAutorizados = signal<PropietarioAutorizado[]>([]);

    // ----- SignalR -----
    private _hub?: HubConnection;

    private _functionStarted$ = new Subject<HubFunctionEvent>();
    private _functionCompleted$ = new Subject<HubFunctionEvent>();
    private _done$ = new Subject<ChatResponse>();
    private _error$ = new Subject<HubErrorEvent>();
    private _emailStatus$ = new Subject<EmailStatusEvent>();

    readonly functionStarted$: Observable<HubFunctionEvent> = this._functionStarted$.asObservable();
    readonly functionCompleted$: Observable<HubFunctionEvent> = this._functionCompleted$.asObservable();
    readonly done$: Observable<ChatResponse> = this._done$.asObservable();
    readonly error$: Observable<HubErrorEvent> = this._error$.asObservable();
    readonly emailStatus$: Observable<EmailStatusEvent> = this._emailStatus$.asObservable();

    // ============================================================
    // Propietario activo
    // ============================================================

    setPropietarioActivo(id: number): void {
        this.propietarioActivoId.set(id);
        try {
            localStorage.setItem(STORAGE_KEY_PROPIETARIO_ACTIVO, String(id));
        } catch {
            /* ignore */
        }
    }

    private _loadStored(): number | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_PROPIETARIO_ACTIVO);
            const n = raw ? parseInt(raw, 10) : NaN;
            return Number.isFinite(n) && n > 0 ? n : null;
        } catch {
            return null;
        }
    }

    // ============================================================
    // HTTP
    // ============================================================

    obtenerPropietariosAutorizados(): Observable<PropietarioAutorizado[]> {
        return this._http.get<PropietarioAutorizado[]>(`${this._api}/propietarios-autorizados`);
    }

    confirmarPropietarioActivo(id: number): Observable<unknown> {
        return this._http.post(`${this._api}/propietario-activo`, { idPropietario: id });
    }

    enviarMensaje(req: ChatRequest): Observable<ChatResponse> {
        return this._http.post<ChatResponse>(`${this._api}/messages`, req);
    }

    /**
     * Descarga directa a Excel del resultado de una tool (por su mensajeId).
     * No pasa por OpenAI: el backend lee el JSON ya persistido y arma el archivo.
     * observe:'response' para leer el nombre del archivo del header Content-Disposition.
     */
    descargarExcel(mensajeId: number): Observable<HttpResponse<Blob>> {
        return this._http.get(`${this._api}/descargas/${mensajeId}`, {
            observe: 'response',
            responseType: 'blob',
        });
    }

    obtenerLimiteMe(): Observable<LimiteEstado> {
        return this._http.get<LimiteEstado>(`${this._api}/limits/me`);
    }

    /** Crea o actualiza el tope mensual (USD) de un propietario/cliente (admin). */
    actualizarLimitePropietario(
        idPropietario: number,
        limiteMensualUSD: number,
        activo = true,
    ): Observable<unknown> {
        return this._http.put(`${this._api}/limits/${idPropietario}`, {
            limiteMensualUSD,
            activo,
        });
    }

    // ----- Auditoría (admin) -----
    obtenerDashboard(dias = 30): Observable<DashboardChatIa> {
        return this._http.get<DashboardChatIa>(`${this._api}/audit/dashboard`, {
            params: { dias: String(dias) },
        });
    }

    listarConversaciones(idPropietario: number, skip = 0, take = 50): Observable<ConversacionResumen[]> {
        return this._http.get<ConversacionResumen[]>(`${this._api}/audit/conversations`, {
            params: { idPropietario: String(idPropietario), skip: String(skip), take: String(take) },
        });
    }

    obtenerMensajesConversacion(id: string, skip = 0, take = 200): Observable<MensajeAudit[]> {
        return this._http.get<MensajeAudit[]>(`${this._api}/audit/conversations/${id}/messages`, {
            params: { skip: String(skip), take: String(take) },
        });
    }

    // ============================================================
    // SignalR
    // ============================================================

    async ensureHubConnected(): Promise<void> {
        if (!environment.enableWebSocket) return;
        if (this._hub && this._hub.state === HubConnectionState.Connected) return;
        if (!this._auth.accessToken) return;

        if (!this._hub) {
            this._hub = new HubConnectionBuilder()
                .withUrl(`${environment.socketUrl}/hubs/chatia`, {
                    accessTokenFactory: () => this._auth.accessToken,
                })
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Warning)
                .build();

            this._hub.on('function_started',   (ev: HubFunctionEvent) => this._functionStarted$.next(ev));
            this._hub.on('function_completed', (ev: HubFunctionEvent) => this._functionCompleted$.next(ev));
            this._hub.on('done',               (ev: ChatResponse)     => this._done$.next(ev));
            this._hub.on('error',              (ev: HubErrorEvent)    => this._error$.next(ev));
            this._hub.on('email_status',       (ev: EmailStatusEvent) => this._emailStatus$.next(ev));
        }

        try {
            await this._hub.start();
        } catch (err) {
            console.warn('[ChatIA] No se pudo conectar al hub:', err);
        }
    }

    async disconnectHub(): Promise<void> {
        if (this._hub && this._hub.state !== HubConnectionState.Disconnected) {
            await this._hub.stop();
        }
    }
}
