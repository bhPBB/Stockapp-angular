import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { StockApiService, StockCard } from '../../services/stock-api.service';
import { AuthApiService } from '../../services/auth-api.service';
import { PolygonService } from '../../services/polygon.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GetStocksAggregatesTimespanEnum } from '@massive.com/client-js';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, OnDestroy {
  cards$: Observable<StockCard[]>;
  private cardsSubject = new BehaviorSubject<StockCard[]>([]);
  stockForm: FormGroup;
  errorMessage: string | null = null;
  private cardsSubscription: Subscription;
  isLoading = true;
  private backendStockSymbols: Set<string> = new Set();
  private currentCards: StockCard[] = [];

  constructor(
    private stockApiService: StockApiService,
    private polygonService: PolygonService,
    private fb: FormBuilder,
    private authService: AuthApiService
  ) {
    this.cards$ = this.cardsSubject.asObservable();
    this.cardsSubscription = this.cards$.subscribe(cards => {
      this.currentCards = cards;
    });

    this.stockForm = this.fb.group({
      stockSymbol: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAndRefreshCards();
  }

  private async loadAndRefreshCards(): Promise<void> {
    this.isLoading = true;

    // 1. Carrega os dados do localStorage primeiro para uma exibição rápida
    const savedCardsRaw = localStorage.getItem('stockCards');
    const savedCards: StockCard[] = savedCardsRaw ? JSON.parse(savedCardsRaw) : [];
    this.currentCards = savedCards;
    this.cardsSubject.next([...this.currentCards]);

    // 2. Carrega os símbolos do backend e combina com os do localStorage, sem duplicatas
    this.stockApiService.loadStocks().subscribe(async (response) => {
      const savedSymbols = new Set(this.currentCards.map(c => c.stockSymbol));
      const backendSymbols = response.content.map(c => c.stockSymbol);
      this.backendStockSymbols = new Set(backendSymbols);
      const allSymbols = new Set([...savedSymbols, ...backendSymbols]);

      // 3. Atualiza os dados de cada ação individualmente
      for (const symbol of allSymbols) {
        try {
          const date = this.getMostRecentTradingDay();
          const stockDetails = await this.polygonService.getOpenClose(symbol, date);

          if (stockDetails.status === 'OK' && stockDetails.from) {
            const aggregates = await this.polygonService.getAggregates(
              symbol, 1, GetStocksAggregatesTimespanEnum.Day,
              this.getPastDate(30), this.getToday()
            );

            let variation = 0;
            if (aggregates.results && aggregates.results.length > 1) {
              const firstClose = aggregates.results[0].c;
              const lastClose = aggregates.results[aggregates.results.length - 1].c;
              if (firstClose > 0) variation = ((lastClose - firstClose) / firstClose) * 100;
            }

            const cardIndex = this.currentCards.findIndex(c => c.stockSymbol === symbol);
            const updatedCard: StockCard = { stockId: Date.now(), stockSymbol: stockDetails.symbol, companyName: stockDetails.from, price: stockDetails.close, variation: variation };

            if (cardIndex > -1) {
              this.currentCards[cardIndex] = updatedCard;
            } else {
              this.currentCards.push(updatedCard);
            }

            this.cardsSubject.next([...this.currentCards]);
            localStorage.setItem('stockCards', JSON.stringify(this.currentCards));
          }
        } catch (error) {
          console.error(`Erro ao atualizar dados para a ação "${symbol}":`, error);
        }
      }
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.cardsSubscription.unsubscribe();
  }

  deleteStock(stockSymbol: string): void {
    // 1. Remove o card da lista local
    this.currentCards = this.currentCards.filter(card => card.stockSymbol !== stockSymbol);

    // 2. Atualiza o Observable para refletir na UI
    this.cardsSubject.next([...this.currentCards]);

    // 3. Atualiza o localStorage
    localStorage.setItem('stockCards', JSON.stringify(this.currentCards));
  }

  async addStock(): Promise<void> {
    if (this.stockForm.invalid) return;
    this.errorMessage = null;

    const ticker = this.stockForm.value.stockSymbol.toUpperCase();
    const date = this.getMostRecentTradingDay();

    if (this.currentCards.some(card => card.stockSymbol === ticker)) {
      this.errorMessage = `A ação "${ticker}" já foi adicionada.`;
      return;
    }

    try {
      // 1️⃣ Obtem dados do Polygon para o preço atual
      const stockDetails = await this.polygonService.getOpenClose(ticker, date);
      if (stockDetails.status !== 'OK' || !stockDetails.from) {
        throw new Error('Ticker não encontrado ou dados indisponíveis.');
      }

      // 2️⃣ Obtem agregados dos últimos 30 dias para calcular a variação
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Alterado de 1 para 30 dias

      const aggregates = await this.polygonService.getAggregates(
        ticker,
        1,
        GetStocksAggregatesTimespanEnum.Day,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Calcula variação percentual entre primeiro e último fechamento
      let variation = 0;
      if (aggregates.results && aggregates.results.length > 1) {
        const closes = aggregates.results.map(r => r.c);
        const firstClose = closes[0]; // Alterado para pegar o primeiro fechamento
        const lastClose = closes[closes.length - 1];
        if (firstClose) variation = ((lastClose - firstClose) / firstClose) * 100;
      }

      // 3️⃣ Cria o novo card
      const newStockData: StockCard = {
        stockId: Date.now(),
        stockSymbol: stockDetails.symbol,
        companyName: stockDetails.from,
        price: stockDetails.close,
        variation: variation
      };

      // 4️⃣ Atualiza cards locais
      this.currentCards.push(newStockData);
      this.cardsSubject.next([...this.currentCards]);
      localStorage.setItem('stockCards', JSON.stringify(this.currentCards));

      // 5️⃣ Envia dados mínimos ao backend
      this.stockApiService.addStock({
        stockSymbol: newStockData.stockSymbol,
        companyName: newStockData.companyName,
        price: 0,
        variation: 0
      }).subscribe();
      // 5️⃣ Se a ação for nova (não existe no backend), adiciona.
      if (!this.backendStockSymbols.has(newStockData.stockSymbol)) {
        this.stockApiService.addStock({
          stockSymbol: newStockData.stockSymbol,
          companyName: newStockData.companyName,
          price: 0, // O preço real não precisa ser salvo no backend
          variation: 0 // A variação real não precisa ser salva no backend
        }).subscribe(() => this.backendStockSymbols.add(newStockData.stockSymbol));
      }

      this.stockForm.reset();

    } catch (error) {
      console.error('Erro ao buscar dados da ação:', error);
      this.errorMessage = `Não foi possível encontrar a ação "${ticker}". Verifique o símbolo e tente novamente.`;
    }
  }

  logout(): void {
    this.authService.logout();
  }

  private getMostRecentTradingDay(): string {
    const date = new Date();
    const day = date.getDay(); // Domingo = 0, Sábado = 6

    if (day === 0) date.setDate(date.getDate() - 2); // Domingo → sexta
    else if (day === 1) date.setDate(date.getDate() - 3); // Segunda → sexta
    else if (day === 6) date.setDate(date.getDate() - 1); // Sábado → sexta
    else date.setDate(date.getDate() - 1); // outros → dia anterior

    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getPastDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}