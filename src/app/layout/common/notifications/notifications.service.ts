import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Notification } from 'app/layout/common/notifications/notifications.types';
import { WebSocketService } from 'app/core/services/websocket.service';
import { map, Observable, ReplaySubject, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
    private _notifications: ReplaySubject<Notification[]> = new ReplaySubject<
        Notification[]
    >(1);
    private _destroy$ = new Subject<void>();

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _webSocketService: WebSocketService
    ) {
        // Inicializar con array vacío para que el componente siempre tenga un valor inicial
        this._notifications.next([]);
        this._initializeWebSocketListeners();
    }

    /**
     * Inicializar listeners de SignalR para notificaciones en tiempo real
     */
    private _initializeWebSocketListeners(): void {
        // Escuchar evento de órdenes actualizadas desde SignalR
        // Usar debounceTime para evitar notificaciones excesivas (máximo una vez cada 2 segundos)
        this._webSocketService
            .on<any>('OrdenesActualizadas')
            .pipe(
                debounceTime(2000), // Esperar 2 segundos después del último evento antes de crear notificación
                distinctUntilChanged((prev, curr) => {
                    // Solo crear notificación si el timestamp cambió significativamente
                    return prev?.timestamp === curr?.timestamp;
                }),
                takeUntil(this._destroy$)
            )
            .subscribe((data) => {
                console.log('📦 Órdenes actualizadas recibidas vía SignalR:', data);
                
                // Si hay nuevas órdenes, crear notificaciones
                // El backend envía 'ordenes' (minúscula) no 'Ordenes'
                const ordenes = data?.ordenes || data?.Ordenes;
                if (ordenes && Array.isArray(ordenes) && ordenes.length > 0) {
                    // Crear notificación usando el timestamp del evento para evitar duplicados
                    const notificationId = `ordenes-actualizadas-${data.timestamp || Date.now()}`;
                    const notification: Notification = {
                        id: notificationId,
                        icon: 'heroicons_outline:shopping-cart',
                        title: 'Órdenes Actualizadas',
                        description: `Se han actualizado ${ordenes.length} orden(es)`,
                        time: new Date().toISOString(),
                        link: `/b2b/ordenessalida`,
                        useRouter: true,
                        read: false
                    };
                    this._addNotificationDirectly(notification);
                }
            });

        // Escuchar evento NuevaOrden del servidor SignalR
        this._webSocketService
            .on<any>('NuevaOrden')
            .pipe(takeUntil(this._destroy$))
            .subscribe((data) => {
                console.log('📦 Nueva orden recibida vía SignalR:', data);
                // Crear notificación específica para nueva orden
                const ordenId = data?.OrdenId || data?.ordenId || data?.ordenSalidaId || 'N/A';
                const notification: Notification = {
                    id: `nueva-orden-${data?.OrdenId || data?.ordenId || data?.ordenSalidaId || Date.now()}`,
                    icon: 'heroicons_outline:shopping-cart',
                    title: 'Nueva Orden Creada',
                    description: `Se ha creado una nueva orden: ${ordenId}`,
                    time: new Date().toISOString(),
                    link: `/b2b/ordenessalida`,
                    useRouter: true,
                    read: false
                };
                this._addNotificationDirectly(notification);
            });

        // Escuchar evento de nuevo pedido B2B registrado
        this._webSocketService
            .on<any>('nuevoPedidoB2B')
            .pipe(takeUntil(this._destroy$))
            .subscribe((data) => {
                console.log('📦 Nuevo pedido registrado vía SignalR:', data);
                // Crear notificación específica para nuevo pedido
                const numOrden = data?.numOrden || data?.NumOrden || data?.ordenSalidaId || 'N/A';
                const notification: Notification = {
                    id: `nuevo-pedido-${data?.ordenSalidaId || data?.id || Date.now()}`,
                    icon: 'heroicons_outline:shopping-cart',
                    title: 'Nuevo Pedido Registrado',
                    description: `Se ha registrado un nuevo pedido: ${numOrden}`,
                    time: new Date().toISOString(),
                    link: `/b2b/ordenessalida`,
                    useRouter: true,
                    read: false
                };
                this._addNotificationDirectly(notification);
            });

        // Escuchar evento genérico de notificación
        this._webSocketService
            .on<Notification>('nuevaNotificacion')
            .pipe(takeUntil(this._destroy$))
            .subscribe((notification) => {
                console.log('🔔 Nueva notificación recibida vía SignalR:', notification);
                this._addNotificationDirectly(notification);
            });
    }

    /**
     * Agregar notificación directamente desde WebSocket
     */
    private _addNotificationDirectly(notification: Notification): void {
        this.notifications$
            .pipe(take(1))
            .subscribe((notifications) => {
                // Verificar si la notificación ya existe (por ID)
                const exists = notifications.some((n) => n.id === notification.id);
                if (!exists) {
                    // Agregar al inicio de la lista
                    this._notifications.next([notification, ...notifications]);
                }
            });
    }

    /**
     * Crear notificación desde datos de pedido recibidos por WebSocket
     */
    private _addNotificationFromWebSocket(pedidoData: any): void {
        const notification: Notification = {
            id: `pedido-${pedidoData.id || Date.now()}`,
            icon: 'heroicons_outline:shopping-cart',
            title: 'Nuevo Pedido B2B',
            description: `Se ha registrado un nuevo pedido: ${pedidoData.numOrden || 'N/A'}`,
            time: new Date().toISOString(),
            link: `/b2b/ordenessalida`,
            useRouter: true,
            read: false
        };

        this._addNotificationDirectly(notification);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for notifications
     */
    get notifications$(): Observable<Notification[]> {
        return this._notifications.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all notifications
     */
    getAll(): Observable<Notification[]> {
        return this._httpClient
            .get<Notification[]>('api/common/notifications')
            .pipe(
                tap((notifications) => {
                    this._notifications.next(notifications);
                })
            );
    }

    /**
     * Create a notification
     *
     * @param notification
     */
    create(notification: Notification): Observable<Notification> {
        return this.notifications$.pipe(
            take(1),
            switchMap((notifications) =>
                this._httpClient
                    .post<Notification>('api/common/notifications', {
                        notification,
                    })
                    .pipe(
                        map((newNotification) => {
                            // Update the notifications with the new notification
                            this._notifications.next([
                                ...notifications,
                                newNotification,
                            ]);

                            // Return the new notification from observable
                            return newNotification;
                        })
                    )
            )
        );
    }

    /**
     * Update the notification
     *
     * @param id
     * @param notification
     */
    update(id: string, notification: Notification): Observable<Notification> {
        return this.notifications$.pipe(
            take(1),
            switchMap((notifications) =>
                this._httpClient
                    .patch<Notification>('api/common/notifications', {
                        id,
                        notification,
                    })
                    .pipe(
                        map((updatedNotification: Notification) => {
                            // Find the index of the updated notification
                            const index = notifications.findIndex(
                                (item) => item.id === id
                            );

                            // Update the notification
                            notifications[index] = updatedNotification;

                            // Update the notifications
                            this._notifications.next(notifications);

                            // Return the updated notification
                            return updatedNotification;
                        })
                    )
            )
        );
    }

    /**
     * Delete the notification
     *
     * @param id
     */
    delete(id: string): Observable<boolean> {
        return this.notifications$.pipe(
            take(1),
            switchMap((notifications) =>
                this._httpClient
                    .delete<boolean>('api/common/notifications', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted notification
                            const index = notifications.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the notification
                            notifications.splice(index, 1);

                            // Update the notifications
                            this._notifications.next(notifications);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): Observable<boolean> {
        return this.notifications$.pipe(
            take(1),
            switchMap((notifications) =>
                this._httpClient
                    .get<boolean>('api/common/notifications/mark-all-as-read')
                    .pipe(
                        map((isUpdated: boolean) => {
                            // Go through all notifications and set them as read
                            notifications.forEach((notification, index) => {
                                notifications[index].read = true;
                            });

                            // Update the notifications
                            this._notifications.next(notifications);

                            // Return the updated status
                            return isUpdated;
                        })
                    )
            )
        );
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }
}
