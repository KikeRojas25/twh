import { Injectable, OnDestroy } from '@angular/core';
import { environment } from 'environments/environment';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
    private connection: signalR.HubConnection | null = null;
    private _connected$ = new BehaviorSubject<boolean>(false);
    private isStarting = false;
    private handlers = new Map<string, (data: any) => void>();
    private joinedGroups = new Set<string>(); // Grupos a los que se ha unido

    constructor() {
        if (environment.enableWebSocket && environment.socketUrl) {
            this.startConnection();
        }
    }

    /**
     * Conectar al servidor SignalR
     */
    private async startConnection(): Promise<void> {
        if (this.isStarting) return;
        this.isStarting = true;

        const token = localStorage.getItem('token');
        
        if (!token) {
            console.warn('⚠️ No hay token disponible para conectar SignalR');
            this.isStarting = false;
            return;
        }

        const hubUrl = `${environment.socketUrl}/hubs/ordenSalida`;
        console.log('🔌 Intentando conectar a SignalR Hub:', hubUrl);

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                // Permitir negociación primero, si falla intentará WebSocket directo
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets,
                accessTokenFactory: () => token || ''
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    // Reintentar con delay incremental: 0s, 2s, 10s, 30s
                    if (retryContext.previousRetryCount === 0) return 0;
                    if (retryContext.previousRetryCount === 1) return 2000;
                    if (retryContext.previousRetryCount === 2) return 10000;
                    return 30000;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Eventos de conexión
        this.connection.onclose((error) => {
            if (error) {
                console.log('⚠️ SignalR desconectado:', error);
            } else {
                console.log('ℹ️ SignalR desconectado');
            }
            this._connected$.next(false);
            this.isStarting = false;
        });

        this.connection.onreconnecting((error) => {
            console.log('🔄 SignalR reconectando...', error);
            this._connected$.next(false);
        });

        this.connection.onreconnected(async (connectionId) => {
            console.log('✅ SignalR reconectado. Connection ID:', connectionId);
            console.log('♻ Re-registrando handlers...');
            // Re-registrar todos los handlers después de reconectar
            this.handlers.forEach((handler, event) => {
                if (this.connection) {
                    this.connection.on(event, handler);
                }
            });
            // Re-unirse a los grupos después de reconectar
            if (this.joinedGroups.size > 0) {
                console.log('♻ Re-uniéndose a grupos:', Array.from(this.joinedGroups));
                for (const group of this.joinedGroups) {
                    try {
                        await this.connection.invoke('JoinGroup', group);
                    } catch (error) {
                        console.warn(`Error al re-unirse al grupo ${group}:`, error);
                    }
                }
            }
            this._connected$.next(true);
        });

        // Manejar métodos desconocidos del servidor (evitar warnings)
        this.connection.on('NuevaOrden', () => {
            // El servidor está llamando a 'nuevaorden' pero no lo necesitamos
            // Esto evita el warning en consola
        });

        try {
            await this.connection.start();
            console.log('✅ SignalR conectado. Connection ID:', this.connection?.connectionId);
            this._connected$.next(true);
        } catch (error: any) {
            console.error('❌ Error al conectar SignalR:', error);
            console.warn('   La aplicación continuará funcionando sin notificaciones en tiempo real.');
            console.warn('   Verifica:');
            console.warn('   1. Que el servidor SignalR esté corriendo en:', hubUrl);
            console.warn('   2. Que el Hub esté configurado correctamente en el backend');
            console.warn('   3. Que no haya problemas de CORS o firewall');
            
            if (error?.message) {
                console.warn('   Error detallado:', error.message);
            }
            
            this._connected$.next(false);
        } finally {
            this.isStarting = false;
        }
    }

    /**
     * Observable para saber si está conectado
     */
    get connected$(): Observable<boolean> {
        return this._connected$.asObservable();
    }

    /**
     * Verificar si está conectado
     */
    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    /**
     * Suscribirse a un evento específico del Hub (sin duplicados)
     */
    on<T>(event: string): Observable<T> {
        return new Observable<T>(observer => {
            const handler = (data: T) => observer.next(data);

            // Registrar solo 1 vez por evento
            if (!this.handlers.has(event)) {
                this.handlers.set(event, handler);
                if (this.connection) {
                    this.connection.on(event, handler);
                } else {
                    // Si la conexión aún no está lista, esperar a que se conecte
                    const sub = this.connected$.subscribe(connected => {
                        if (connected && this.connection && this.handlers.has(event)) {
                            this.connection.on(event, this.handlers.get(event)!);
                            sub.unsubscribe();
                        }
                    });
                }
            }

            // Cleanup cuando se desuscribe
            return () => {
                if (this.handlers.has(event)) {
                    if (this.connection) {
                        this.connection.off(event, this.handlers.get(event)!);
                    }
                    this.handlers.delete(event);
                }
            };
        });
    }

    /**
     * Invocar un método en el servidor (equivalente a emit en Socket.io)
     */
    invoke(methodName: string, ...args: any[]): Promise<any> {
        if (this.connection && this.isConnected()) {
            return this.connection.invoke(methodName, ...args);
        } else {
            console.warn('No se puede invocar método: SignalR no está conectado');
            return Promise.reject('SignalR no está conectado');
        }
    }

    /**
     * Emitir un evento al servidor (alias para invoke para mantener compatibilidad)
     */
    emit(methodName: string, data?: any): void {
        this.invoke(methodName, data).catch(error => {
            console.warn('Error al emitir evento:', error);
        });
    }

    /**
     * Unirse a un grupo específico del Hub
     * Los grupos permiten recibir notificaciones filtradas
     * @param groupName Nombre del grupo (ej: 'propietario_1', 'almacen_19')
     * @returns Promise que se resuelve cuando se une al grupo
     */
    async joinGroup(groupName: string): Promise<void> {
        if (!this.isConnected()) {
            // Esperar a que se conecte antes de unirse al grupo
            return new Promise((resolve, reject) => {
                const sub = this.connected$.subscribe(connected => {
                    if (connected) {
                        sub.unsubscribe();
                        this._doJoinGroup(groupName)
                            .then(resolve)
                            .catch(reject);
                    }
                });
                // Timeout después de 10 segundos
                setTimeout(() => {
                    sub.unsubscribe();
                    reject(new Error('Timeout esperando conexión para unirse al grupo'));
                }, 10000);
            });
        }
        return this._doJoinGroup(groupName);
    }

    /**
     * Unirse a un grupo (método interno)
     */
    private async _doJoinGroup(groupName: string): Promise<void> {
        try {
            await this.invoke('JoinGroup', groupName);
            this.joinedGroups.add(groupName);
            console.log(`✅ Unido al grupo: ${groupName}`);
        } catch (error) {
            console.error(`❌ Error al unirse al grupo ${groupName}:`, error);
            throw error;
        }
    }

    /**
     * Salir de un grupo específico del Hub
     * @param groupName Nombre del grupo del que se desea salir
     * @returns Promise que se resuelve cuando sale del grupo
     */
    async leaveGroup(groupName: string): Promise<void> {
        if (!this.isConnected()) {
            console.warn('No se puede salir del grupo: SignalR no está conectado');
            return;
        }
        try {
            await this.invoke('LeaveGroup', groupName);
            this.joinedGroups.delete(groupName);
            console.log(`✅ Salido del grupo: ${groupName}`);
        } catch (error) {
            console.error(`❌ Error al salir del grupo ${groupName}:`, error);
            throw error;
        }
    }

    /**
     * Desconectar del servidor
     */
    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this._connected$.next(false);
            this.handlers.clear();
        }
    }

    /**
     * Reconectar manualmente
     */
    reconnect(): void {
        this.disconnect().then(() => {
            // Esperar un poco antes de reconectar
            setTimeout(() => {
                this.startConnection();
            }, 1000);
        });
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
