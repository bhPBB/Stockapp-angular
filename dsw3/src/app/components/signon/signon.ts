import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signon',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './signon.html',
  styleUrl: './signon.css'
})
export class Signon {
  signonForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthApiService,
    private router: Router
  ) {
    this.signonForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.signonForm.invalid) {
      return;
    }
    this.errorMessage = null;
    this.authService.signup(this.signonForm.value).subscribe({
      next: () => {
        this.authService.login(this.signonForm.value).subscribe({
          next: () => this.router.navigate(['/home']),
          error: () => (this.errorMessage = 'Login automático falhou. Por favor, faça login manualmente.'),
        });
      },
      error: (err) =>
        (this.errorMessage = 'Não foi possível criar a conta. Tente novamente.'),
    });
  }
}
