/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : '1',
        title: 'Importaciones',
        type : 'group',
        icon : 'heroicons_outline:chart-pie',
        link : '/example',
        children: [
            {
                id: 'dashboards.project',
                title: 'Seguimiento',
                type: 'basic',
                icon: 'heroicons_outline:clipboard-document-check',
                link: '/dashboards/project',
            },
            {
                id: 'dashboards.analytics',
                title: 'Reportes',
                type: 'basic',
                icon: 'heroicons_outline:chart-pie',
                link: '/dashboards/analytics',
            }
           
        ],
    },
    {
        id   : '2',
        title: 'MRP',
        type : 'aside',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    },
    {
        id   : '3',
        title: 'Push Comercial',
        type : 'aside',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : '1',
        title: 'Importaciones',
        type : 'aside',
        icon : 'heroicons_outline:chart-pie',
        link : '/example',
        children: [
            {
                id: '2',
                title: 'Seguimiento',
                type: 'basic',
                icon: 'heroicons_outline:clipboard-document-check',
                link: '/importacionesoc/list',
            },
            {
                id: '3',
                title: 'Reportes',
                type: 'basic',
                icon: 'heroicons_outline:chart-pie',
                link: '/dashboards/analytics',
            }
           
        ],
    },
    {
        id   : '2',
        title: 'MRP',
        type : 'aside',
        icon : 'heroicons_outline:chart-pie',
        link : '/example',
        children: [
            {
                id: '2',
                title: 'Seguimiento',
                type: 'basic',
                icon: 'heroicons_outline:clipboard-document-check',
                link: '/dashboards/project',
            },
            {
                id: '3',
                title: 'Reportes',
                type: 'basic',
                icon: 'heroicons_outline:chart-pie',
                link: '/dashboards/analytics',
            }
           
        ],
    },
    {
        id   : '3',
        title: 'Push Comercial',
        type : 'aside',
        icon : 'heroicons_outline:chart-pie',
        link : '/example',
        children: [
            {
                id: '2',
                title: 'Seguimiento',
                type: 'basic',
                icon: 'heroicons_outline:clipboard-document-check',
                link: '/dashboards/project',
            },
            {
                id: '3',
                title: 'Reportes',
                type: 'basic',
                icon: 'heroicons_outline:chart-pie',
                link: '/dashboards/analytics',
            }
           
        ],
    },
    {
        id   : '4',
        title: 'INCIDENCIAS',
        type : 'aside',
        icon : 'heroicons_outline:chart-pie',
        link : '/cic',
        children: [
            {
                id: '2',
                title: 'Descarga Documentos',
                type: 'basic',
                icon: 'heroicons_outline:clipboard-document-check',
                link: '/cic/masivocomprobantes',
            }
           
        ],
    }
];
