import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Signon } from './components/signon/signon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Signon],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('dsw3');
}
