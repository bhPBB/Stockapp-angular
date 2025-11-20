import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { PolygonService } from '../../services/polygon.service';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StockDataService } from '../../services/stock-data.service';
import { Observable } from 'rxjs';

interface Card {
  codigo: string;
  nome: string;
  preco: number;
  variacao: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ NgClass, DecimalPipe, RouterModule, AsyncPipe ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  openClose: any;
  error: any;
  errorMessage: string | null = null;
  cards$: Observable<Card[]>;

  constructor(
    private polygonService: PolygonService,
    private authService: AuthService,
    private stockDataService: StockDataService
  ) {
    this.cards$ = this.stockDataService.cards$;
  }

    async getOpenClose(ticker: string): Promise<void> {
      if (!ticker) {
        return;
      }
      this.errorMessage = null;
      this.error = null;

      try {
        // const hoje = this.polygonService.getTradingDate();
        const hoje = "2025-11-07";
        const openClose = await this.polygonService.getOpenClose(ticker, hoje);

         // Se a API ainda assim não tiver dados, trate a resposta:
        if (!openClose || openClose.status !== 'OK') {
          this.errorMessage = `Ação "${ticker.toUpperCase()}" não encontrada. Verifique o código e tente novamente.`;
          return;
        }

        // Calcular variação percentual
        const variacao = ((openClose.close - openClose.open) / openClose.open) * 100;

        // Criar novo card
        const novoCard = {
          codigo: openClose.symbol,
          nome: openClose.symbol,  // você pode buscar o nome real se quiser
          preco: openClose.close,
          variacao: Number(variacao.toFixed(2))
        };

        // Adiciona o card através do serviço
        const currentCards = this.stockDataService.getCurrentCards();
        if (!currentCards.some(c => c.codigo === novoCard.codigo)) {
          this.stockDataService.addCard(novoCard);
        }
      } catch (e) {
        console.error(e);
        this.errorMessage = 'Ação não encontrada (erro ao buscar dados.)';
        this.error = e;
      }
    }
  
  private handleError(e: any): void {
    console.error(e);
    this.error = e;
  }

  logout(): void {
    this.authService.logout();
  }
}
