import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
    ENVIRONMENT_INITIALIZER,
    EnvironmentProviders,
    Provider,
    inject,
} from '@angular/core';
import { authInterceptor } from 'app/core/auth/auth.interceptor';
import { AuthService } from 'app/core/auth/auth.service';
import { chatIaInterceptor } from 'app/core/chatia/chatia.interceptor';

export const provideAuth = (): Array<Provider | EnvironmentProviders> => {
    return [
        // Encadenamos: authInterceptor agrega Authorization,
        // chatIaInterceptor agrega X-Propietario-Id en llamadas /api/chatia/*.
        provideHttpClient(withInterceptors([authInterceptor, chatIaInterceptor])),
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(AuthService),
            multi: true,
        },
    ];
};
