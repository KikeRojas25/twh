import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfigService, Scheme } from '@fuse/services/config';
import { Subject, takeUntil } from 'rxjs';

/**
 * Botón global de modo claro/oscuro. Conmuta el `scheme` de Fuse (afecta a TODA
 * la app vía la clase light/dark en el <body>) y persiste la preferencia en
 * localStorage para mantenerla entre recargas.
 */
@Component({
    selector: 'scheme-toggle',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatTooltipModule],
    template: `
        <button
            mat-icon-button
            [matTooltip]="esOscuro ? 'Modo claro' : 'Modo oscuro'"
            (click)="toggle()"
        >
            <mat-icon
                [svgIcon]="esOscuro ? 'heroicons_solid:sun' : 'heroicons_solid:moon'"
            ></mat-icon>
        </button>
    `,
})
export class SchemeToggleComponent implements OnInit, OnDestroy {
    private static readonly STORAGE_KEY = 'appScheme';
    esOscuro = false;
    private _unsubscribeAll = new Subject<void>();

    constructor(private _fuseConfigService: FuseConfigService) {}

    ngOnInit(): void {
        // Restaurar la preferencia persistida (si la hay) al iniciar el layout.
        const guardado = localStorage.getItem(SchemeToggleComponent.STORAGE_KEY);
        if (guardado === 'dark' || guardado === 'light') {
            this._fuseConfigService.config = { scheme: guardado as Scheme };
        }

        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.esOscuro = config.scheme === 'dark';
                this.aplicarTemaPrimeNg(this.esOscuro);
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    toggle(): void {
        const scheme: Scheme = this.esOscuro ? 'light' : 'dark';
        this._fuseConfigService.config = { scheme };
        localStorage.setItem(SchemeToggleComponent.STORAGE_KEY, scheme);
    }

    /**
     * PrimeNG no reacciona a la clase `dark`: trae su tema en una hoja de estilos fija.
     * Por eso los dos temas se emiten como bundles (angular.json, `inject: false`) y aquí
     * se conmuta el href del <link id="primeng-theme"> de index.html.
     */
    private aplicarTemaPrimeNg(oscuro: boolean): void {
        const link = document.getElementById('primeng-theme') as HTMLLinkElement | null;
        if (!link) return;
        const href = oscuro ? 'primeng-dark.css' : 'primeng-light.css';
        if (!link.getAttribute('href')?.includes(href)) {
            link.setAttribute('href', href);
        }
    }
}
