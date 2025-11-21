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
    // 1️⃣ Carrega dados do Local Storage
    const savedCards = localStorage.getItem('stockCards');
    if (savedCards) {
      this.currentCards = JSON.parse(savedCards);
      this.cardsSubject.next([...this.currentCards]);
    }

    // 2️⃣ Carrega dados do backend (sem price, apenas para registro)
    this.stockApiService.loadStocks().subscribe(response => {
      response.content.forEach(card => {
        // Só adiciona se não estiver no Local Storage
        if (!this.currentCards.find(c => c.stockSymbol === card.stockSymbol)) {
          this.currentCards.push(card);
        }
      });
      this.cardsSubject.next([...this.currentCards]);
    });
  }

  ngOnDestroy(): void {
    this.cardsSubscription.unsubscribe();
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
        const firstClose = closes[0];
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
}