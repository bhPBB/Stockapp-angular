import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Se não houver token, apenas continue com a requisição original
  if (!token) {
    return next(req);
  }

  // Se houver um token, clone a requisição e adicione o cabeçalho de autorização
  const clonedReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(clonedReq);
};