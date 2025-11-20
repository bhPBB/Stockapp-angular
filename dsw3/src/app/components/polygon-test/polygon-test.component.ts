import { Component, OnInit } from '@angular/core';
import { PolygonService } from '../../services/polygon.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-polygon-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './polygon-test.component.html',
  styleUrls: ['./polygon-test.component.css']
})
export class PolygonTestComponent implements OnInit {
  ticker = 'AAPL'; // Ticker padrão para teste inicial
  aggregates: any;
  openClose: any;
  error: any;

  constructor(private polygonService: PolygonService) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.error = null;
    this.aggregates = null;
    this.openClose = null;

    this.getAggregates();
    this.getOpenClose();
  }

  async getAggregates(): Promise<void> {
    try {
      // Adicionando ".SA" para tickers brasileiros, uma suposição comum.
      // const tickerToUse = this.ticker.match(/^\w{4}\d$/) ? `${this.ticker}.SA` : this.ticker;
      // this.aggregates = await this.polygonService.getAggregates(ticker);
      this.aggregates = await this.polygonService.getAggregates(this.ticker);
    } catch (e) {
      this.handleError(e);
    }
  }

  async getOpenClose(): Promise<void> {
    try {
      this.openClose = await this.polygonService.getOpenClose(this.ticker, "2025-10-27");
      console.log(this.openClose);
    } catch (e) {
      console.error(e);
      this.handleError(e);
    }
  }

  private handleError(e: any): void {
    console.error(e);
    this.error = e;
  }
}