import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

// Interface correspondente à resposta da API (StockDataResponse)
export interface StockCard {
  stockId: number;
  code: string;
  name: string;
  price: number;
  variation: number;
}

// Interface para a criação de um novo stock (StockDataCreation)
export interface StockCardCreation {
  code: string;
  name: string;
  price: number;
  variation: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockApiService {
  private apiUrl = 'http://localhost:8080/stocks'; // URL do seu backend
  private cardsSubject = new BehaviorSubject<StockCard[]>([]);
  public cards$: Observable<StockCard[]> = this.cardsSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Carrega os stocks da API
  loadStocks(): Observable<{content: StockCard[]}> {
    return this.http.get<{content: StockCard[]}>(this.apiUrl).pipe(
      tap(response => {
        this.cardsSubject.next(response.content);
      })
    );
  }

  // Adiciona um novo stock via API
  addStock(stockData: StockCardCreation): Observable<StockCard> {
    return this.http.post<StockCard>(this.apiUrl, stockData).pipe(
      tap(newCard => {
        const currentCards = this.cardsSubject.getValue();
        this.cardsSubject.next([...currentCards, newCard]);
      })
    );
  }
}