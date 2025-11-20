// src/app/services/polygon.service.ts
import { Injectable } from '@angular/core';
import { restClient, GetStocksAggregatesTimespanEnum } from '@massive.com/client-js';
import { environment } from '../../env/environment';

@Injectable({
  providedIn: 'root'
})
export class PolygonService {
  private client = restClient(environment.polygonApiKey);
    
  async getAggregates(
    ticker: string,
    multiplier = 1,
    timespan = GetStocksAggregatesTimespanEnum.Day,
    from = '2025-10-27',
    to = '2025-10-28'
  ) {
    try {
      const response = await this.client.getStocksAggregates(ticker, multiplier, timespan, from, to);
      return response;
    } catch (e) {
      throw e;
    }
  }
  async getOpenClose(ticker: string, date: string = "2023-01-09",) {
    try {
      const response = await this.client.getStocksOpenClose(ticker, date);
      return response;
    } catch (e) {
      throw e;
    }
  }
  // NÃO ESTÁ FUNCIONANDO
  // src/app/utils/date-utils.ts
  // getTradingDate(): string {
  //   const data = new Date();

  //   // Se for domingo (0) → voltar 2 dias (para sexta)
  //   // Se for sábado (6) → voltar 1 dia (para sexta)
  //   // ⏰ Ajusta fim de semana → volta para sexta-feira
  //   const day = data.getDay();
  //   if (day === 0) data.setDate(data.getDate() - 2); // domingo → sexta
  //   if (day === 6) data.setDate(data.getDate() - 1); // sábado → sexta

  //   // Formatar em YYYY-MM-DD
  //   return data.toISOString().split('T')[0];
  // }
}
