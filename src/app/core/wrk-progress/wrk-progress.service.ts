import { Injectable, inject, OnDestroy } from '@angular/core';
import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from 'environments/environment';
import { Observable, Subject } from 'rxjs';

/** Payload del evento "wrk-avance" emitido por WrkProgressHub. */
export interface WrkAvanceEvent {
    wrkId: number;
    totalUnidades: number;
    picadoUnidades: number;
    porcentaje: number;
    lineasTotal: number;
    lineasCerradas: number;
    completo: boolean;
    tipo: 'picking' | 'validacion';
}

/**
 * Conexión SignalR al hub /hubs/wrk-progress.
 * Singleton de aplicación — los componentes se suscriben a `avance$`
 * y filtran por wrkId si necesitan.
 */
@Injectable({ providedIn: 'root' })
export class WrkProgressService implements OnDestroy {
    private _hub: HubConnection | null = null;
    private _auth = inject(AuthService);

    private readonly _avance$ = new Subject<WrkAvanceEvent>();

    /** Stream de avances en tiempo real (cualquier wrk, cualquier tipo). */
    get avance$(): Observable<WrkAvanceEvent> {
        return this._avance$.asObservable();
    }

    /** Asegura una conexión activa. Llamar al entrar a la pantalla que consume el stream. */
    async ensureConnected(): Promise<void> {
        if (this._hub && this._hub.state === HubConnectionState.Connected) return;

        if (!this._hub) {
            this._hub = new HubConnectionBuilder()
                .withUrl(`${environment.socketUrl}/hubs/wrk-progress`, {
                    accessTokenFactory: () => this._auth.accessToken,
                })
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Warning)
                .build();

            this._hub.on('wrk-avance', (ev: WrkAvanceEvent) => {
                this._avance$.next(ev);
            });
        }

        if (this._hub.state === HubConnectionState.Disconnected) {
            try {
                await this._hub.start();
            } catch (err) {
                console.warn('[WrkProgressService] No se pudo iniciar el hub:', err);
            }
        }
    }

    async disconnect(): Promise<void> {
        if (this._hub && this._hub.state !== HubConnectionState.Disconnected) {
            try {
                await this._hub.stop();
            } catch (_) { /* ignore */ }
        }
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
