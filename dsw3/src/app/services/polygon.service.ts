// src/app/services/polygon.service.ts
import { Injectable } from '@angular/core';
import { restClient, GetStocksAggregatesTimespanEnum } from '@massive.com/client-js';
import { environment } from '../../env/environment';

@Injectable({
  providedIn: 'root'
})
export class PolygonService {
  private client = restClient(environment.polygonApiKey, "https://api.massive.com");
    
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
    } catch (e: any) {
      console.error('Error message:', e.message);
      console.error('Error config:', e.config);
      console.error('Error response:', e.response);
      throw e;
    }
  }
  async getOpenClose(ticker: string, date: string = "2023-01-09",) {
    try {
      const response = await this.client.getStocksOpenClose(ticker, date);
      return response;
    } catch (e: any) {
      console.error('Error message:', e.message);
      console.error('Error config:', e.config);
      console.error('Error response:', e.response);
      throw e;
    }
  }
}
