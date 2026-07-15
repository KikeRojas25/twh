import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Shell del módulo: solo aloja las páginas hijas. */
@Component({
    selector: 'app-analitica',
    template: '<router-outlet></router-outlet>',
    standalone: true,
    imports: [RouterOutlet],
})
export class AnaliticaComponent {}
