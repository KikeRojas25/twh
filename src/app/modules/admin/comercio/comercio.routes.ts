import { Routes } from '@angular/router';
import { ExampleComponent } from 'app/modules/admin/example/example.component';
import { ComercioComponent } from './comercio.component';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';


// export const comercioRoutes: Routes = [
//     {
//         path: '',
//         component: ComercioComponent,
//         children: [
//             {
//                 path: 'listadocomercios',
//                 loadComponent: () => import('app/modules/admin/comercio/list/list.component')
//                                       .then(m => m.ListComponent),
//             },
//             // Más rutas hijas de ComercioComponent pueden ir aquí
//         ],
//     },
// ];