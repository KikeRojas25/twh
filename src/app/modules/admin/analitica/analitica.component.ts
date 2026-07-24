import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Shell del módulo: una barra de pestañas para saltar entre reportes al instante,
 * más el router-outlet. Mismo patrón que el switcher del tablero de CRM.
 * El cliente/horizonte elegido se conserva vía AnaliticaContextService, así que
 * las pestañas no necesitan pasar nada por la URL.
 */
@Component({
    selector: 'app-analitica',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
        <div class="flex flex-col flex-auto min-w-0">
            <nav class="flex gap-1 px-6 sm:px-10 pt-3 border-b bg-card overflow-x-auto">
                @for (t of tabs; track t.link) {
                    <a [routerLink]="t.link" routerLinkActive #rla="routerLinkActive"
                       class="px-4 py-2.5 font-semibold whitespace-nowrap border-b-2 transition-colors"
                       [class.text-primary-600]="rla.isActive"
                       [class.border-primary-600]="rla.isActive"
                       [class.text-secondary]="!rla.isActive"
                       [class.border-transparent]="!rla.isActive">
                        {{ t.label }}
                    </a>
                }
            </nav>
            <router-outlet></router-outlet>
        </div>
    `,
})
export class AnaliticaComponent {
    tabs = [
        { link: 'dashboard', label: 'Dashboard' },
        { link: 'proyeccion', label: 'Proyección' },
        { link: 'inventario-cliente', label: 'Inventario' },
        { link: 'pareto-clientes', label: 'Pareto' },
        { link: 'abc-producto', label: 'ABC' },
        { link: 'ingresos', label: 'Ingresos' },
    ];
}
