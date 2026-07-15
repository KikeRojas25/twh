import { Injectable, signal } from '@angular/core';

/**
 * Contexto compartido entre las pantallas de analítica: el cliente y el horizonte
 * elegidos "siguen" al usuario de un reporte a otro. Cada pantalla lo lee al entrar
 * y lo actualiza cuando el usuario cambia el filtro.
 *
 * providedIn: 'root' → una sola instancia; el contexto persiste mientras la sesión
 * viva (también al ir y volver del módulo).
 */
@Injectable({ providedIn: 'root' })
export class AnaliticaContextService {
    /** Cliente activo. null = ninguno todavía (la pantalla decide su default). */
    readonly propietarioId = signal<number | null>(null);

    /** Horizonte de proyección en meses (1, 3, 6, 9, 12). */
    readonly meses = signal<number>(6);

    setCliente(id: number | null): void {
        this.propietarioId.set(id);
    }

    setMeses(m: number): void {
        this.meses.set(m);
    }
}
