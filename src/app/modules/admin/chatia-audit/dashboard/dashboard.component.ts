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
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { ChatIaService } from 'app/core/chatia/chatia.service';
import { DashboardChatIa } from 'app/core/chatia/chatia.types';

Chart.register(...registerables);

@Component({
    selector: 'audit-dashboard',
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterLink, DecimalPipe, PercentPipe],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AuditDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    private _chatIa = inject(ChatIaService);

    data = signal<DashboardChatIa | null>(null);
    cargando = signal(true);
    error = signal<string | null>(null);

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
