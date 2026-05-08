import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { ChatIaService } from './chatia.service';

/**
 * Para llamadas a /api/chatia/*:
 *  - Inyecta el header X-Propietario-Id desde el estado del ChatIaService.
 *  - SOBRESCRIBE el Authorization con el accessToken bueno.
 *    (El authInterceptor compartido del proyecto, para URLs que empiezan con
 *     environment.baseUrl, intenta usar accessToken2 que está vacío en el flujo
 *     actual; aquí garantizamos el header correcto solo para nuestro módulo.)
 */
export const chatIaInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const isChatIaRequest = req.url.startsWith(environment.baseUrl + '/api/chatia');
    if (!isChatIaRequest) {
        return next(req);
    }

    const auth = inject(AuthService);
    const chatIa = inject(ChatIaService);

    const headers: { [k: string]: string } = {};

    // 1) Authorization siempre con el token principal (no vacío y no expirado)
    const token = auth.accessToken;
    if (token && !AuthUtils.isTokenExpired(token)) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    // 2) X-Propietario-Id desde la sesión activa
    const id = chatIa.propietarioActivoId();
    if (id && id > 0 && !req.headers.has('X-Propietario-Id')) {
        headers['X-Propietario-Id'] = String(id);
    }

    if (Object.keys(headers).length > 0) {
        let cloned = req.clone();
        for (const [k, v] of Object.entries(headers)) {
            cloned = cloned.clone({ headers: cloned.headers.set(k, v) });
        }
        return next(cloned);
    }

    return next(req);
};
