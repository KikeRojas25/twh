import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [

    // Redirect empty path to '/example'
    {path: '', pathMatch : 'full', redirectTo: 'example'},

    // Redirect signed-in user to the '/example'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    {path: 'signed-in-redirect', pathMatch : 'full', redirectTo: 'example'},

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.routes')},
            {path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.routes')},
            {path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.routes')},
            {path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes')},
            {path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.routes')}
        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes')},
            {path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.routes')}
        ]
    },

    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: 'home', loadChildren: () => import('app/modules/landing/home/home.routes')},
        ]
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver
        },
        children: [
            {
                path: 'example',
                loadComponent: () => import('app/modules/admin/example/example.component')
                  .then(m => m.ExampleComponent)
            },
           
              {
                path: 'facturacion',
                loadComponent: () => import('./modules/admin/facturacion/facturacion.component')
                                      .then(m => m.FacturacionComponent),
                children: [
                  {
                    path: 'pendientespreliquidacion',
                    loadComponent: () => import('./modules/admin/facturacion/liquidacionservicio/liquidacionservicio.component')
                                          .then(m => m.LiquidacionservicioComponent)
                  },
               
                ]
              },
              {
                path: 'despacho',
                loadComponent: () => import('./modules/admin/despachos/despachos.component')
                                      .then(m => m.DespachosComponent),
                children: [
                  {
                    path: 'listadocarga',
                    loadComponent: () => import('./modules/admin/despachos/despachocarga/despachocarga.component')
                                          .then(m => m.DespachocargaComponent)
                  },
                ]
              },
              {
                path: 'picking',
                loadComponent: () => import('./modules/admin/despachos/despachos.component')
                                      .then(m => m.DespachosComponent),
                children: [
                  {
                    path: 'listaordensalida',
                    loadComponent: () => import('./modules/admin/despachos/list/list.component')
                                          .then(m => m.ListComponent)
                  },
                  {
                    path: 'nuevaordensalida',
                    loadComponent: () => import('./modules/admin/despachos/new/new.component')
                                          .then(m => m.NewComponent)
                  },
                  {
                    path: 'nuevasalidamasiva',
                    loadComponent: () => import('./modules/admin/despachos/batch/batch.component')
                                          .then(m => m.BatchComponent)
                  },
                  {
                    path: 'planificarpicking',
                    loadComponent: () => import('./modules/admin/planning/pending-picking-orders/pending-picking-orders.component')
                                          .then(m => m.PendingPickingOrdersComponent)
                  },
                  {
                    path: 'planificardespachos',
                    loadComponent: () => import('./modules/admin/planning/planificar-despachos/planificar-despachos.component')
                                          .then(m => m.PlanificarDespachosComponent)
                  },
                  {
                    path: 'despachosplanificados',
                    loadComponent: () => import('./modules/admin/planning/pedidos-planificados/pedidos-planificados.component')
                                          .then(m => m.PedidosPlanificadosComponent)
                  },




               
                ]
              },
              
           
              {
                path: 'reporte',
                loadComponent: () => import('./modules/admin/reportes/reportes.component')
                                      .then(m => m.ReportesComponent),
                children: [
                  {
                    path: 'inventariopaletas',
                    loadComponent: () => import('./modules/admin/reportes/inventariopaletas/inventariopaletas.component')
                                          .then(m => m.InventariopaletasComponent)
                  },
                  {
                    path: 'avancepicking',
                    loadComponent: () => import('./modules/admin/reportes/avancepicking/avancepicking.component')
                                          .then(m => m.AvancepickingComponent)
                  },
                  {
                    path: 'reporteingresossalida',
                    loadComponent: () => import('./modules/admin/reportes/ingresosalida/ingresosalida.component')
                                          .then(m => m.IngresosalidaComponent)
                  },
                  
                  {
                    path: 'reportecobertura',
                    loadComponent: () => import('./modules/admin/reportes/reportecobertura/reportecobertura.component')
                                          .then(m => m.ReportecoberturaComponent)
                  },
               
                ]
              },
              
              {
                path: 'inventario',
                loadComponent: () => import('./modules/admin/reportes/reportes.component')
                                      .then(m => m.ReportesComponent),
                children: [
                  {
                    path: 'inventariogeneral',
                    loadComponent: () => import('./modules/admin/reportes/inventariogeneral/inventariogeneral.component')
                                          .then(m => m.InventariogeneralComponent)
                  },
                  {
                    path: 'kardexgeneral',
                    loadComponent: () => import('./modules/admin/reportes/kardexgeneral/kardexgeneral.component')
                                          .then(m => m.KardexgeneralComponent)
                  },
               
                ]
              },
              {
                path: 'recibo',
                loadComponent: () => import('./modules/admin/recepcion/recepcion.component')
                                      .then(m => m.RecepcionComponent),
                children: [
                  {
                    path: 'listaordenrecibo',
                    loadComponent: () => import('./modules/admin/recepcion/list/list.component')
                                          .then(m => m.ListComponent)
                  },
                  {
                    path: 'nuevaordenmasiva',
                    loadComponent: () => import('./modules/admin/recepcion/newbatch/newbatch.component')
                                          .then(m => m.NewbatchComponent)
                  },
                  {
                    path: 'nuevaorden',
                    loadComponent: () => import('./modules/admin/recepcion/new/new.component')
                                          .then(m => m.NewComponent)
                  },
               
                ]
              },
              {
                path: 'mantenimiento',
                loadComponent: () => import('./modules/admin/mantenimientos/mantenimientos.component')
                                      .then(m => m.MantenimientosComponent),
                children: [
                  {
                    path: 'vehiculos',
                    loadComponent: () => import('./modules/admin/mantenimientos/vehiculos/vehiculos.component')
                                          .then(m => m.VehiculosComponent),
                                          children:[
                                            {
                                              path: 'list',
                                              loadComponent: () => import('./modules/admin/mantenimientos/vehiculos/list/list.component')
                                                                    .then(m => m.ListComponent)
                                            },
                                    ]
                  },
                ]
              }
              
        ]
    }
];
