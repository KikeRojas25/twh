import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatIaService } from 'app/core/chatia/chatia.service';
import { ConversacionResumen } from 'app/core/chatia/chatia.types';

@Component({
    selector: 'audit-conversations',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, DatePipe],
    templateUrl: './conversations.component.html',
    styleUrls: ['./conversations.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AuditConversationsComponent implements OnInit {
    private _chatIa = inject(ChatIaService);
    private _route = inject(ActivatedRoute);

    idPropietarioFilter = 0;
    rows = signal<ConversacionResumen[]>([]);
    cargando = signal(false);
    error = signal<string | null>(null);

    ngOnInit(): void {
        const param = this._route.snapshot.queryParamMap.get('idPropietario');
        const id = param ? parseInt(param, 10) : 0;
        if (id > 0) {
            this.idPropietarioFilter = id;
            this.buscar();
        }
    }

    buscar(): void {
        if (this.idPropietarioFilter <= 0) {
            this.error.set('Ingresa un IdPropietario válido.');
            this.rows.set([]);
            return;
        }
        this.error.set(null);
        this.cargando.set(true);
        this._chatIa.listarConversaciones(this.idPropietarioFilter, 0, 100).subscribe({
            next: (rs) => { this.rows.set(rs); this.cargando.set(false); },
            error: (err) => {
                this.cargando.set(false);
                this.error.set(err?.error?.error ?? 'No se pudo cargar las conversaciones.');
            },
        });
    }
}
