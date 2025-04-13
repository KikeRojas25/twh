import { Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import {
    compactNavigation,
    defaultNavigation,
    futuristicNavigation,
    horizontalNavigation,
} from 'app/mock-api/common/navigation/data';
import { cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class NavigationMockApi {
    private  _compactNavigation: FuseNavigationItem[] = []
    private readonly _defaultNavigation: FuseNavigationItem[] =
        defaultNavigation;
    private readonly _futuristicNavigation: FuseNavigationItem[] =
        futuristicNavigation;
    private readonly _horizontalNavigation: FuseNavigationItem[] =
        horizontalNavigation;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Navigation - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService.onGet('api/common/navigation').reply(() => {
            this._compactNavigation = [];
            const menu = JSON.parse(localStorage.getItem('menu'));

            console.log('menu:', menu);

            menu.forEach((resp) => {
                this._compactNavigation.push({
                    id: resp.codigo,
                    title: resp.descripcion,
                    type: 'aside',
                    icon: resp.icono,
                    idpadre : resp.codigoPadre,
                    visible: resp.visible,
                    children: []

                });
            });


            // Fill compact navigation children using the default navigation
            this._compactNavigation.forEach((compactNavItem) => {
                   menu.forEach((defaultNavItem) => {

                    if ( defaultNavItem.codigoPadre === compactNavItem.id  )
                    {
                        defaultNavItem.submenu.forEach((el) => {
                            if(el.visible === true ){
                            compactNavItem.children.push({
                                id: el.codigo,
                                title: el.descripcion,
                                type: 'basic',
                                icon: el.icono,
                                idpadre : el.codigoPadre,
                                link: el.link
                            });
                          }
                        });

                        //compactNavItem.children = cloneDeep(defaultNavItem.submenu);

                    }
                });
            });

            // Fill futuristic navigation children using the default navigation
            // this._futuristicNavigation.forEach((futuristicNavItem) => {
            //     this._defaultNavigation.forEach((defaultNavItem) => {
            //         if ( defaultNavItem.id === futuristicNavItem.id )
            //         {
            //             futuristicNavItem.children = cloneDeep(defaultNavItem.children);
            //         }
            //     });
            // });

            // Fill horizontal navigation children using the default navigation
            // this._horizontalNavigation.forEach((horizontalNavItem) => {
            //     this._defaultNavigation.forEach((defaultNavItem) => {
            //         if ( defaultNavItem.id === horizontalNavItem.id )
            //         {
            //             horizontalNavItem.children = cloneDeep(defaultNavItem.children);
            //         }
            //     });
            // });

            // Return the response
            return [
                200,
                {
                    compact   : cloneDeep(this._compactNavigation),
                    default   : cloneDeep(this._compactNavigation),
                    futuristic: cloneDeep(this._compactNavigation),
                    horizontal: cloneDeep(this._compactNavigation)
                }
            ];
        });
    }
}
