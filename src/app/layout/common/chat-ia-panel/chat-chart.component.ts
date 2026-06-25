import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { Chart, ChartType, registerables } from 'chart.js';
import { ChartData } from 'app/core/chatia/chatia.types';

Chart.register(...registerables);

@Component({
    selector: 'chat-ia-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chat-chart.component.html',
    styleUrls: ['./chat-chart.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ChatChartComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() datos!: ChartData;

    @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
    private _chart?: Chart;

    private static readonly PALETTE = [
        '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
        '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
    ];

    ngAfterViewInit(): void {
        this._render();
    }

    ngOnChanges(_: SimpleChanges): void {
        if (this._chart) this._render();
    }

    ngOnDestroy(): void {
        this._chart?.destroy();
    }

    private _render(): void {
        if (!this.datos || !this.canvas) return;
        this._chart?.destroy();

        const isPie = this.datos.tipo === 'pie' || this.datos.tipo === 'doughnut';
        const palette = ChatChartComponent.PALETTE;

        const datasets = this.datos.datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: isPie
                ? this.datos.labels.map((_, idx) => palette[idx % palette.length])
                : palette[i % palette.length] + 'cc',
            borderColor: palette[i % palette.length],
            borderWidth: isPie ? 1 : 2,
            tension: 0.3,
            fill: this.datos.tipo === 'line' ? false : undefined,
        }));

        this._chart = new Chart(this.canvas.nativeElement, {
            type: this.datos.tipo as ChartType,
            data: { labels: this.datos.labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: this.datos.datasets.length > 1 || isPie },
                    title: this.datos.titulo
                        ? { display: true, text: this.datos.titulo, font: { size: 12 } }
                        : { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx: any) => {
                                const data = (ctx.dataset?.data ?? []) as number[];
                                const total = data.reduce(
                                    (a, b) => a + (Number(b) || 0),
                                    0
                                );
                                const val =
                                    Number(ctx.parsed?.y ?? ctx.parsed ?? ctx.raw) || 0;
                                const pct =
                                    total > 0
                                        ? ((val / total) * 100).toFixed(1)
                                        : '0';
                                const label = ctx.label ?? ctx.dataset?.label ?? '';
                                return `${label}: ${val.toLocaleString()} (${pct}%)`;
                            },
                        },
                    },
                },
                scales: isPie ? {} : { y: { beginAtZero: true } },
            },
        });
    }
}
