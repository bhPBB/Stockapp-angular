import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

// Interface para a resposta da API de login
export interface LoginResponse {
  token: string;
}

// Interface para a resposta da API de cadastro
export interface UserResponse {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  // A URL agora aponta para o nome do serviço do backend no Docker Compose
  private apiUrl = 'http://stockapp-backend:8080';

  // BehaviorSubject para manter e emitir o estado de autenticação atual
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  /**
   * Realiza o login do usuário via API.
   * @param credentials - Objeto com email e senha.
   */
  login(credentials: {email: string, password: string}): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          this.setSession(response.token);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  /**
   * Realiza o registro (signup) de um novo usuário via API.
   * @param userData - Dados do novo usuário (name, email, password).
   */
  signup(userData: any): Observable<UserResponse> {
    const signupData = {
      name: userData.name,
      email: userData.email,
      password: userData.password
    };
    return this.http.post<UserResponse>(`${this.apiUrl}/user`, signupData);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  private setSession(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}
