import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ChatListComponent } from './components/chat/chat-list/chat-list.component';
import { ChatWindowComponent } from './components/chat/chat-window/chat-window.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chats', component: ChatListComponent, canActivate: [AuthGuard] },
  { path: 'chat/:id', component: ChatWindowComponent, canActivate: [AuthGuard] }, // Use /chat/:id
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];