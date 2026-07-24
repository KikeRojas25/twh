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
    FuncionInvocada,
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
    /** mensajeId de la descarga en curso (para mostrar el spinner en ese botón). */
    descargandoId = signal<number | null>(null);
    inputTexto = '';
    conversacionId: string | null = null;

    /**
     * Tope de longitud del mensaje. Debe coincidir con la clave 'MaxCaracteresMensaje'
     * de chatia.ConfiguracionGlobal: el backend rechaza con 400 por encima de este valor.
     * Aquí solo evitamos el viaje inútil y damos feedback al escribir.
     */
    readonly maxCaracteres = 500;

    // Sugerencias por categoría (panel izquierdo). Alineadas a las funciones del backend.
    readonly sugerencias: { titulo: string; icon: string; items: string[] }[] = [
        {
            titulo: 'Stock',
            icon: 'heroicons_outline:cube',
            items: [
                'Dame el resumen de mi stock (top por cantidad)',
                '¿Cuáles son mis 10 productos con más stock disponible?',
            ],
        },
        {
            titulo: 'Kardex',
            icon: 'heroicons_outline:arrows-right-left',
            items: ['¿Qué ingresó esta semana?', '¿Qué se despachó ayer?'],
        },
        {
            titulo: 'Vencimientos',
            icon: 'heroicons_outline:clock',
            items: [
                '¿Qué productos vencen en los próximos 30 días?',
                'Lista de productos vencidos',
            ],
        },
        {
            titulo: 'Rotación',
            icon: 'heroicons_outline:chart-bar',
            items: [
                'Top 10 productos con más rotación del último mes',
                'Productos sin movimiento desde hace 90 días',
            ],
        },
        {
            titulo: 'Productos',
            icon: 'heroicons_outline:finger-print',
            items: ['Muéstrame mis códigos con sus huellas'],
        },
    ];

    // Indicaciones (panel derecho).
    readonly tips: string[] = [
        'Pregunta por código, lote, vencimiento o estado.',
        'Filtra el kardex por fecha o por número de guía.',
        'Pide “envíamelo por correo” para recibir Excel o PDF.',
        'Di “en gráfico de barras” o “en torta” para visualizar.',
    ];

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

        // Aviso del envío de correo en segundo plano (sale después de responder el chat).
        this._chatIa.emailStatus$
            .pipe(takeUntil(this._destroy$))
            .subscribe((ev) => {
                this.mensajes.update(m => [...m, {
                    rol: 'system',
                    contenido: (ev.ok ? '✅ ' : '⚠️ ') + ev.mensaje,
                    fecha: new Date(),
                }]);
                this._shouldScroll = true;
                this._cdr.detectChanges();
            });
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
        if (texto.length > this.maxCaracteres) {
            this.error.set(
                `El mensaje es demasiado largo (${texto.length} de ${this.maxCaracteres} caracteres). ` +
                'Divide tu consulta en preguntas más cortas.'
            );
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

    /**
     * Descarga directa a Excel del resultado de una función (no pasa por OpenAI).
     * El backend lee el JSON ya persistido y devuelve el archivo.
     */
    descargarExcel(f: FuncionInvocada): void {
        if (!f.mensajeId || this.descargandoId() !== null) return;
        this.descargandoId.set(f.mensajeId);

        this._chatIa.descargarExcel(f.mensajeId).subscribe({
            next: (resp) => {
                const blob = resp.body;
                if (!blob) {
                    this.error.set('No se pudo generar el archivo.');
                    this.descargandoId.set(null);
                    return;
                }

                // Nombre del archivo desde Content-Disposition; si no viene, uno por defecto.
                const cd = resp.headers.get('content-disposition') ?? '';
                const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
                const nombre = match
                    ? decodeURIComponent(match[1])
                    : `${f.nombre}.xlsx`;

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nombre;
                a.click();
                URL.revokeObjectURL(url);

                this.descargandoId.set(null);
            },
            error: async (err) => {
                // El cuerpo del error viene como Blob (responseType blob); intentamos leer el mensaje.
                let detalle = 'No se pudo descargar el Excel.';
                try {
                    if (err?.error instanceof Blob) {
                        const txt = await err.error.text();
                        detalle = JSON.parse(txt)?.error ?? detalle;
                    }
                } catch {
                    /* mantiene el mensaje por defecto */
                }
                this.error.set(detalle);
                this.descargandoId.set(null);
            },
        });
    }

    nuevaConversacion(): void {
        this.conversacionId = null;
        this.mensajes.set([]);
        this.error.set(null);
    }

    enviarSugerencia(pregunta: string): void {
        if (this.enviando() || !this.propietarioActivoId()) return;
        this.inputTexto = pregunta;
        this.enviar();
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
                // enlaces http(s) seguros: [texto](url)
                .replace(
                    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
                )
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

            // Encabezados: #, ##, ###
            const heading = line.match(/^(#{1,3})\s+(.*)$/);
            if (heading) {
                out.push(`<div class="msg__h msg__h--${heading[1].length}">${inline(heading[2])}</div>`);
                i++;
                continue;
            }

            // Lista no ordenada: "- " o "* "
            if (/^\s*[-*]\s+/.test(line)) {
                const items: string[] = [];
                while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                    items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`);
                    i++;
                }
                out.push(`<ul class="msg__ul">${items.join('')}</ul>`);
                continue;
            }

            // Lista ordenada: "1. ", "2. ", ...
            if (/^\s*\d+\.\s+/.test(line)) {
                const items: string[] = [];
                while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                    items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`);
                    i++;
                }
                out.push(`<ol class="msg__ol">${items.join('')}</ol>`);
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
