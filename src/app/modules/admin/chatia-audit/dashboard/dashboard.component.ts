import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { ChatIaService } from 'app/core/chatia/chatia.service';
import { DashboardChatIa, RankingPropietario } from 'app/core/chatia/chatia.types';

Chart.register(...registerables);

@Component({
    selector: 'audit-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, RouterLink, DecimalPipe, PercentPipe],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AuditDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    private _chatIa = inject(ChatIaService);

    data = signal<DashboardChatIa | null>(null);
    cargando = signal(true);
    error = signal<string | null>(null);

    // Edición inline del tope por cliente
    editandoId = signal<number | null>(null);
    editValor = 0;
    guardando = signal(false);

    @ViewChild('canvasConsumo') canvasConsumo?: ElementRef<HTMLCanvasElement>;
    private _chart?: Chart;

    ngOnInit(): void {
        this._chatIa.obtenerDashboard(30).subscribe({
            next: (d) => {
                this.data.set(d);
                this.cargando.set(false);
                queueMicrotask(() => this._renderChart());
            },
            error: (err) => {
                this.cargando.set(false);
                this.error.set(err?.error?.error ?? 'No se pudo cargar el dashboard.');
            },
        });
    }

    ngAfterViewInit(): void {
        if (this.data()) this._renderChart();
    }

    ngOnDestroy(): void {
        this._chart?.destroy();
    }

    // ------- Edición del tope por cliente -------

    editarLimite(r: RankingPropietario): void {
        this.editandoId.set(r.idPropietario);
        this.editValor = r.limiteMensualUSD;
    }

    cancelarEdicion(): void {
        this.editandoId.set(null);
    }

    guardarLimite(r: RankingPropietario): void {
        const nuevo = Number(this.editValor);
        if (!Number.isFinite(nuevo) || nuevo < 0) return;

        this.guardando.set(true);
        this._chatIa.actualizarLimitePropietario(r.idPropietario, nuevo).subscribe({
            next: () => {
                // Actualiza el tope y recalcula el % en memoria (sin recargar todo).
                this.data.update((d) => {
                    if (!d) return d;
                    const ranking = d.rankingPropietarios.map((x) =>
                        x.idPropietario === r.idPropietario
                            ? {
                                  ...x,
                                  limiteMensualUSD: nuevo,
                                  porcentajeUsado: nuevo > 0 ? x.costoUSD / nuevo : 0,
                              }
                            : x,
                    );
                    return { ...d, rankingPropietarios: ranking };
                });
                this.editandoId.set(null);
                this.guardando.set(false);
            },
            error: () => {
                this.guardando.set(false);
                this.error.set('No se pudo guardar el tope. Verifica que tengas permisos de administrador.');
            },
        });
    }

    private _renderChart(): void {
        const d = this.data();
        if (!d || !this.canvasConsumo) return;
        this._chart?.destroy();

        this._chart = new Chart(this.canvasConsumo.nativeElement, {
            type: 'line',
            data: {
                labels: d.consumoUltimos30Dias.map(r => r.fecha?.substring(0, 10) ?? ''),
                datasets: [
                    {
                        label: 'Costo USD',
                        data: d.consumoUltimos30Dias.map(r => r.costoUSD),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        tension: 0.3,
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
            },
        });
    }
}
