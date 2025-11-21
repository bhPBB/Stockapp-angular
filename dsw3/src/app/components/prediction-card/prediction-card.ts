import { Component, Input, OnInit } from '@angular/core';
import { PredictionResponse, PredictionService } from '../../services/prediction.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-prediction-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-card.html',
})
export class PredictionCard implements OnInit {
  @Input() ticker!: string;

  loading = true;
  error: string | null = null;

  predictionRF: PredictionResponse | null = null;
  predictionLR: PredictionResponse | null = null;

  constructor(private predictionService: PredictionService) {}

  ngOnInit(): void {
    if (this.ticker) {
      this.loadPredictions();
    }
  }

  async loadPredictions(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // Executa as duas chamadas de predição em paralelo
      const [rf, lr] = await Promise.all([
        this.predictionService.predictRF(this.ticker),
        this.predictionService.predictLR(this.ticker)
      ]);

      this.predictionRF = rf;
      this.predictionLR = lr;

    } catch (err: any) {
      console.error('Erro ao buscar predições:', err);
      this.error = err.message || 'Não foi possível carregar as predições. Tente novamente mais tarde.';
    } finally {
      this.loading = false;
    }
  }
}
