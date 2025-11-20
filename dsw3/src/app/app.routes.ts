import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Signon } from './components/signon/signon';
import { Home } from './components/home/home';
import { PolygonTestComponent } from './components/polygon-test/polygon-test.component';
import { Details } from './components/details/details';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'signon', component: Signon },
    { path: 'polygon-test', component: PolygonTestComponent },
    { path: 'home', component: Home, canActivate: [AuthGuard] },
    { path: 'detalhes/:ticker', component: Details, canActivate: [AuthGuard] },
    { path: '', redirectTo: '/home', pathMatch: 'full' }
];
