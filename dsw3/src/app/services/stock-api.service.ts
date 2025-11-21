import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../env/environment';

// Interface correspondente à resposta da API (StockDataResponse)
export interface StockCard {
  stockId: number; // Corresponde a stockId no Java
  stockSymbol: string; // Corresponde a stockSymbol no Java 
  companyName: string; // Corresponde a companyName no Java
  price: number;
  variation: number;
}

// Interface para a criação de um novo stock (StockDataCreation)
export interface StockCardCreation {
  stockSymbol: string; // Corresponde a stockSymbol no Java
  companyName: string; // Corresponde a companyName no Java
  price: number;
  variation: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockApiService {
  private apiUrl = `${environment.apiUrl}/stocks`; 
  private cardsSubject = new BehaviorSubject<StockCard[]>([]);
  public cards$: Observable<StockCard[]> = this.cardsSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Carrega os stocks da API
  // O backend retorna um objeto de paginação, então esperamos por { content: ... }
  loadStocks(): Observable<{ content: StockCard[] }> {
    return this.http.get<{ content: StockCard[] }>(this.apiUrl).pipe(
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

  // Busca um único stock pelo ID
  getStockById(stockId: number): Observable<StockCard> {
    return this.http.get<StockCard>(`${this.apiUrl}/${stockId}`);
  }
}