import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    AfterViewChecked,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation,
    computed,
    inject,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatIaService } from 'app/core/chatia/chatia.service';
import {
    HubFunctionEvent,
    PropietarioAutorizado,
    UiMensaje,
} from 'app/core/chatia/chatia.types';
import { Subject, takeUntil } from 'rxjs';
import { ChatChartComponent } from './chat-chart.component';

@Component({
    selector: 'chat-ia-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, ChatChartComponent],
    templateUrl: './chat-ia-panel.component.html',
    styleUrls: ['./chat-ia-panel.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ChatIaPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
    @Input() open = false;
    @Output() closePanel = new EventEmitter<void>();

    private _chatIa = inject(ChatIaService);
    private _cdr = inject(ChangeDetectorRef);
    private _sanitizer = inject(DomSanitizer);
    private _destroy$ = new Subject<void>();
    private _htmlCache = new WeakMap<UiMensaje, SafeHtml>();

    @ViewChild('messagesEnd') messagesEnd?: ElementRef<HTMLDivElement>;

    propietarios = signal<PropietarioAutorizado[]>([]);
    propietarioActivoId = this._chatIa.propietarioActivoId;
    propietarioActivo = computed(() =>
        this.propietarios().find(p => p.id === this.propietarioActivoId()) ?? null
    );

    mensajes = signal<UiMensaje[]>([]);
    funcionEjecutando = signal<string | null>(null);
    enviando = signal(false);
    error = signal<string | null>(null);
    inputTexto = '';
    conversacionId: string | null = null;

    private _shouldScroll = false;

    ngOnInit(): void {
        this._chatIa.obtenerPropietariosAutorizados().subscribe({
            next: (props) => {
                this.propietarios.set(props);
                // Si no hay propietario activo y solo tiene uno, seleccionarlo automáticamente
                if (!this.propietarioActivoId() && props.length === 1) {
                    this._chatIa.setPropietarioActivo(props[0].id);
                }
                // Si el guardado ya no está autorizado, limpiar
                if (this.propietarioActivoId() &&
                    !props.some(p => p.id === this.propietarioActivoId())) {
                    this._chatIa.setPropietarioActivo(props[0]?.id ?? 0);
                }
            },
            error: (err) => {
                this.error.set('No se pudo cargar los propietarios autorizados.');
                console.error('[ChatIA] propietarios autorizados:', err);
            },
        });

        // Conectar al hub para recibir eventos de funciones en tiempo real
        this._chatIa.ensureHubConnected();

        this._chatIa.functionStarted$
            .pipe(takeUntil(this._destroy$))
            .subscribe((ev: HubFunctionEvent) => this.funcionEjecutando.set(ev.nombre));

        this._chatIa.functionCompleted$
            .pipe(takeUntil(this._destroy$))
            .subscribe(() => this.funcionEjecutando.set(null));
    }

    ngAfterViewChecked(): void {
        if (this._shouldScroll) {
            this._scrollAlFondo();
            this._shouldScroll = false;
        }
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    onClose(): void {
        this.closePanel.emit();
    }

    cambiarPropietario(id: number): void {
        if (id === this.propietarioActivoId()) return;
        this._chatIa.setPropietarioActivo(id);
        // Cambio de propietario = nueva conversación (no mezclar contextos)
        this.conversacionId = null;
        this.mensajes.set([]);
        this.error.set(null);
    }

    async enviar(): Promise<void> {
        const texto = this.inputTexto.trim();
        if (!texto || this.enviando()) return;
        if (!this.propietarioActivoId()) {
            this.error.set('Selecciona un propietario para iniciar el chat.');
            return;
        }

        this.error.set(null);
        this.inputTexto = '';

        const userMsg: UiMensaje = { rol: 'user', contenido: texto, fecha: new Date() };
        this.mensajes.update(m => [...m, userMsg]);
        this._shouldScroll = true;

        // Placeholder del asistente "pensando..."
        const placeholder: UiMensaje = {
            rol: 'assistant',
            contenido: '',
            fecha: new Date(),
            cargando: true,
        };
        this.mensajes.update(m => [...m, placeholder]);
        this._shouldScroll = true;
        this.enviando.set(true);

        try {
            const resp = await new Promise<any>((resolve, reject) => {
                this._chatIa
                    .enviarMensaje({
                        conversacionId: this.conversacionId,
                        mensaje: texto,
                    })
                    .subscribe({ next: resolve, error: reject });
            });

            this.conversacionId = resp.conversacionId;

            this.mensajes.update(m => {
                const next = [...m];
                next[next.length - 1] = {
                    rol: 'assistant',
                    contenido: resp.respuesta,
                    fecha: new Date(),
                    datos: resp.datos,
                    funciones: resp.funciones,
                };
                return next;
            });
            this._shouldScroll = true;

            // Si quedó bloqueado por límite, mostrarlo
            if (resp.limite?.bloqueado) {
                this.error.set(resp.limite.mensaje ?? 'Límite alcanzado.');
            } else if (
                resp.limite?.nivel &&
                resp.limite.nivel !== 'ok' &&
                resp.limite.mensaje
            ) {
                this.error.set('⚠ ' + resp.limite.mensaje);
            }
        } catch (err: any) {
            const detalle = err?.error?.error ?? err?.message ?? 'Error desconocido.';
            this.mensajes.update(m => {
                const next = [...m];
                next[next.length - 1] = {
                    rol: 'assistant',
                    contenido: '❌ ' + detalle,
                    fecha: new Date(),
                    error: detalle,
                };
                return next;
            });
            this.error.set(detalle);
        } finally {
            this.enviando.set(false);
            this.funcionEjecutando.set(null);
            this._shouldScroll = true;
        }
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.enviar();
        }
    }

    nuevaConversacion(): void {
        this.conversacionId = null;
        this.mensajes.set([]);
        this.error.set(null);
    }

    private _scrollAlFondo(): void {
        try {
            this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } catch {
            /* ignore */
        }
    }

    renderizarContenido(msg: UiMensaje): SafeHtml {
        const cached = this._htmlCache.get(msg);
        if (cached) return cached;
        const html = this._sanitizer.bypassSecurityTrustHtml(
            this._markdownLite(msg.contenido ?? '')
        );
        this._htmlCache.set(msg, html);
        return html;
    }

    private _markdownLite(texto: string): string {
        const escape = (s: string) =>
            s.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');

        const inline = (s: string) =>
            escape(s)
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

        const splitRow = (row: string): string[] => {
            let r = row.trim();
            if (r.startsWith('|')) r = r.slice(1);
            if (r.endsWith('|')) r = r.slice(0, -1);
            return r.split('|').map(c => c.trim());
        };

        const isSeparator = (row: string) =>
            /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(row);

        const lines = texto.replace(/\r\n/g, '\n').split('\n');
        const out: string[] = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const isTableHead =
                line.includes('|') &&
                i + 1 < lines.length &&
                isSeparator(lines[i + 1]);

            if (isTableHead) {
                const headers = splitRow(line);
                i += 2;
                const rows: string[][] = [];
                while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
                    rows.push(splitRow(lines[i]));
                    i++;
                }
                let table = '<div class="msg__table-wrap"><table class="msg__table"><thead><tr>';
                table += headers.map(h => `<th>${inline(h)}</th>`).join('');
                table += '</tr></thead><tbody>';
                for (const r of rows) {
                    table += '<tr>';
                    for (let c = 0; c < headers.length; c++) {
                        table += `<td>${inline(r[c] ?? '')}</td>`;
                    }
                    table += '</tr>';
                }
                table += '</tbody></table></div>';
                out.push(table);
                continue;
            }

            if (line.trim() === '') {
                out.push('<div class="msg__br"></div>');
            } else {
                out.push(`<div class="msg__line">${inline(line)}</div>`);
            }
            i++;
        }

        return out.join('');
    }
}
