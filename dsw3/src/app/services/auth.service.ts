import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, tap, throwError } from 'rxjs';

// Interface para a resposta da API de login/registro
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL da sua API de backend (comentada para usar o mock)
  // private apiUrl = 'https://sua-api.com/auth';

  // BehaviorSubject para manter e emitir o estado de autenticação atual
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  /**
   * Realiza o login do usuário (MOCK com localStorage).
   * @param credentials - Objeto com email e senha.
   */
  login(credentials: {email: string, password: string}): Observable<AuthResponse> {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(
      (user: any) => user.email === credentials.email && user.password === credentials.password
    );

    if (foundUser) {
      // Simula a criação de um token e a resposta da API
      const fakeToken = btoa(JSON.stringify({ userId: foundUser.id, email: foundUser.email }));
      const response: AuthResponse = {
        user: { id: foundUser.id, name: foundUser.name, email: foundUser.email },
        token: fakeToken,
      };

      this.setSession(response.token);
      this.isAuthenticatedSubject.next(true);
      return of(response); // Retorna um Observable de sucesso
    }

    // Retorna um Observable de erro se o usuário não for encontrado
    return throwError(() => new Error('Credenciais inválidas'));
  }

  /**
   * Realiza o registro (sign-on) de um novo usuário (MOCK com localStorage).
   * @param userData - Dados do novo usuário.
   */
  signup(userData: any): Observable<AuthResponse> {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = users.some((user: any) => user.email === userData.email);

    if (userExists) {
      return throwError(() => new Error('E-mail já cadastrado.'));
    }

    const newUser = {
      id: new Date().getTime().toString(), // ID simples para o mock
      ...userData,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Após o cadastro, realiza o login automaticamente
    return this.login({ email: newUser.email, password: newUser.password });
  }

  /**
   * Realiza o logout do usuário.
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Salva o token no localStorage.
   * @param token - O token JWT.
   */
  private setSession(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Obtém o token do localStorage.
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Verifica se existe um token, indicando que o usuário está (provavelmente) logado.
   */
  private hasToken(): boolean {
    return !!this.getToken();
  }
}
