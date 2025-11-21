import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PolygonService } from '../../services/polygon.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { GetStocksAggregatesTimespanEnum } from '@massive.com/client-js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalhes',
  standalone: true,
  templateUrl: './details.html',
  styleUrls: ['./details.css'],
  imports: [BaseChartDirective, RouterModule, CommonModule ]
})
export class Details implements OnInit {
  ticker!: string;
  loading = true;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Histórico dos últimos 30 dias' }
    },
    scales: {
      x: { title: { display: true, text: 'Data' } },
      y: { title: { display: true, text: 'Preço (USD)' } }
    }
  };
  chartType: ChartType = 'line';

  // ➕ novas propriedades de estatísticas
  minPrice: number | null = null;
  maxPrice: number | null = null;
  avgPrice: number | null = null;
  variation: number | null = null;
  lastClose: number | null = null;

  constructor(private route: ActivatedRoute, private polygon: PolygonService) {}

  async ngOnInit() {
    this.ticker = this.route.snapshot.paramMap.get('id')!;
    await this.loadChartData();
  }

  async loadChartData() {
    try {
      const hoje = new Date();
      const fim = hoje.toISOString().split('T')[0];

      const inicio = new Date();
      inicio.setDate(inicio.getDate() - 30);
      const inicioFormatado = inicio.toISOString().split('T')[0];

      const response = await this.polygon.getAggregates(
        this.ticker,
        1,
        GetStocksAggregatesTimespanEnum.Day,
        inicioFormatado,
        fim
      );

      const candles = response.results ?? [];
      if (!candles.length) return;

      const labels = candles.map((c: any) =>
        new Date(c.t).toLocaleDateString('pt-BR')
      );
      const closes = candles.map((c: any) => c.c);

      this.chartData = {
        labels,
        datasets: [
          {
            data: closes,
            label: this.ticker,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13,110,253,0.15)',
            fill: true,
            tension: 0.25,
            pointRadius: 2
          }
        ]
      };

      // 📊 Estatísticas
      const min = Math.min(...closes);
      const max = Math.max(...closes);
      const avg = closes.reduce((a, b) => a + b, 0) / closes.length;
      const first = closes[0];
      const last = closes[closes.length - 1];
      const variation = ((last - first) / first) * 100;

      this.minPrice = min;
      this.maxPrice = max;
      this.avgPrice = avg;
      this.variation = variation;
      this.lastClose = last;
    } catch (e) {
      console.error('Erro ao carregar dados do gráfico:', e);
    } finally {
      this.loading = false;
    }
  }
}