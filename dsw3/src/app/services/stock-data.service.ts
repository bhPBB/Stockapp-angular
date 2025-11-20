import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

interface Card {
  codigo: string;
  nome: string;
  preco: number;
  variacao: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockDataService {
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  public cards$: Observable<Card[]> = this.cardsSubject.asObservable();

  private userId: string | null = null;

  constructor(private authService: AuthService) {
    // Reage a mudanças de autenticação para carregar/limpar os dados
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadCardsFromStorage();
      } else {
        this.cardsSubject.next([]); // Limpa os cards no logout
        this.userId = null;
      }
    });
  }

  private getUserIdFromToken(): string | null {
    const token = this.authService.getToken();
    if (!token) return null;
    try {
      // Decodifica o payload do token falso para obter o ID do usuário
      const payload = JSON.parse(atob(token));
      return payload.userId || null;
    } catch (e) {
      console.error("Erro ao decodificar o token:", e);
      return null;
    }
  }

  private loadCardsFromStorage(): void {
    this.userId = this.getUserIdFromToken();
    if (this.userId) {
      const storedData = localStorage.getItem(`stock_list_${this.userId}`);
      const cards = storedData ? JSON.parse(storedData) : [];
      this.cardsSubject.next(cards);
    }
  }

  addCard(card: Card): void {
    if (!this.userId) {
      this.userId = this.getUserIdFromToken();
      if (!this.userId) {
        console.error("Usuário não autenticado. Não é possível salvar o card.");
        return;
      }
    }

    const currentCards = this.cardsSubject.getValue();
    const updatedCards = [...currentCards, card];
    this.cardsSubject.next(updatedCards);
    localStorage.setItem(`stock_list_${this.userId}`, JSON.stringify(updatedCards));
  }

  getCurrentCards(): Card[] {
    return this.cardsSubject.getValue();
  }
}