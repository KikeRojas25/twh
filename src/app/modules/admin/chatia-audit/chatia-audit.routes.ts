import { Routes } from '@angular/router';

export default [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
            import('./dashboard/dashboard.component').then(m => m.AuditDashboardComponent),
    },
    {
        path: 'conversaciones',
        loadComponent: () =>
            import('./conversations/conversations.component').then(m => m.AuditConversationsComponent),
    },
    {
        path: 'conversaciones/:id',
        loadComponent: () =>
            import('./conversation-view/conversation-view.component').then(m => m.AuditConversationViewComponent),
    },
] satisfies Routes;
