import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatIaService } from 'app/core/chatia/chatia.service';
import { MensajeAudit } from 'app/core/chatia/chatia.types';

@Component({
    selector: 'audit-conversation-view',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
    templateUrl: './conversation-view.component.html',
    styleUrls: ['./conversation-view.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AuditConversationViewComponent implements OnInit {
    private _chatIa = inject(ChatIaService);
    private _route = inject(ActivatedRoute);

    conversacionId = '';
    mensajes = signal<MensajeAudit[]>([]);
    cargando = signal(true);
    error = signal<string | null>(null);

    ngOnInit(): void {
        this.conversacionId = this._route.snapshot.paramMap.get('id') ?? '';
        if (!this.conversacionId) {
            this.error.set('Falta el id de conversación.');
            this.cargando.set(false);
            return;
        }
        this._chatIa.obtenerMensajesConversacion(this.conversacionId, 0, 200).subscribe({
            next: (rs) => { this.mensajes.set(rs); this.cargando.set(false); },
            error: (err) => {
                this.cargando.set(false);
                this.error.set(err?.error?.error ?? 'No se pudo cargar la conversación.');
            },
        });
    }

    formatearJson(s?: string): string {
        if (!s) return '';
        try { return JSON.stringify(JSON.parse(s), null, 2); }
        catch { return s; }
    }
}
