import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PolygonService } from './polygon.service';
import { lastValueFrom } from 'rxjs';
import { GetStocksAggregatesTimespanEnum } from '@massive.com/client-js';
import { environment } from '../../env/environment';

export interface StockHistoryRequest {
  date: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface PredictionRequest {
  ticker: string;
  history: StockHistoryRequest[];
}

export interface PredictionResponse {
  highPrediction: number;
  lowPrediction: number;
}

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = `${environment.apiUrl}/stocks`; 

  constructor(private http: HttpClient, private polygonService: PolygonService) {}

  /**
   * Executa a predição para o modelo Random Forest.
   * @param ticker O símbolo da ação (ex: "AAPL").
   * @returns Uma Promise com a predição de alta e baixa.
   */
  async predictRF(ticker: string): Promise<PredictionResponse> {
    return this.predict(ticker);
  }

  /**
   * Executa a predição para o modelo Linear Regression.
   * @param ticker O símbolo da ação (ex: "AAPL").
   * @returns Uma Promise com a predição de alta e baixa.
   */
  async predictLR(ticker: string): Promise<PredictionResponse> {
    return this.predict(ticker);
  }

  /**
   * Método privado que busca o histórico e chama a API de predição.
   * @param ticker O símbolo da ação.
   */
  private async predict(ticker: string): Promise<PredictionResponse> {
    // 1️⃣ Busca o histórico dos últimos 5 dias de negociação
    const history = await this.getRecentHistory(ticker);

    // 2️⃣ Monta o corpo da requisição para a API Java
    const body: PredictionRequest = {
      ticker,
      history
    };

    // 3️⃣ Chama o endpoint de predição
    const prediction$ = this.http.post<PredictionResponse>(`${this.apiUrl}/prediction`, body);

    // Converte o Observable para Promise usando lastValueFrom (prática moderna)
    return lastValueFrom(prediction$);
  }

  /**
   * Busca os dados agregados dos últimos 5 dias de negociação no Polygon.io
   * e os transforma no formato esperado pela API de predição.
   */
  private async getRecentHistory(ticker: string): Promise<StockHistoryRequest[]> {
    const today = new Date();
    const startDate = new Date();
    // Pede um intervalo de 10 dias para garantir que teremos 5 dias de negociação (considerando fins de semana/feriados)
    startDate.setDate(today.getDate() - 10);

    const aggregates = await this.polygonService.getAggregates(
      ticker,
      1,
      GetStocksAggregatesTimespanEnum.Day,
      startDate.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    );

    if (!aggregates.results || aggregates.results.length < 5) {
      throw new Error('Não há histórico suficiente (mínimo 5 dias)');
    }

    // Pega os 5 resultados mais recentes e mapeia para o formato StockHistoryRequest
    return aggregates.results
      .slice(-5)
      .map(day => ({
        date: new Date(day.t).toISOString().split('T')[0],
        o: day.o,
        h: day.h,
        l: day.l,
        c: day.c,
        v: day.v
      }));
  }
}
