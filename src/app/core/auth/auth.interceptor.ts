import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { environment } from 'environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);

    // Detectar si es para el segundo servicio
    const isServicio2 = req.url.startsWith(environment.baseUrl);

    // Elegir el token correcto según la URL. Si accessToken2 no está disponible
    // (no está cableado en el flujo actual de login), caer al accessToken principal
    // para que las llamadas al backend igualmente lleven Authorization.
    const token = isServicio2
        ? (authService.accessToken2 || authService.accessToken)
        : authService.accessToken;

    // Verificar que el token exista y no esté expirado
    if (token && !AuthUtils.isTokenExpired(token)) {
        req = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + token),
        });
    }

    return next(req).pipe(
        catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
                // Solo cerrar sesión si el token principal falla
                if (!isServicio2) {
                    authService.signOut();
                    location.reload();
                }
            }

            if (error instanceof HttpErrorResponse && error.status === 403) {
                if (!isServicio2) {
                    authService.signOut();
                    location.reload();
                }
            }

            return throwError(() => error);
        })
    );
};
