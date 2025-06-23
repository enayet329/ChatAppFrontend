import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private usersApiUrl = `${environment.apiUrl}/Chats/user`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    console.log('AuthService init: token found:', token ? 'yes' : 'no', 'token:', token);
    if (token) {
      this.getProfile().subscribe({
        error: err => console.error('Initial profile fetch failed:', err.message, err.status)
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  register(username: string, email: string, password: string): Observable<{ userId: string }> {
    return this.http.post<{ userId: string }>(`${this.apiUrl}/register`, { username, email, password })
      .pipe(
        catchError(err => {
          console.error('Registration error:', err);
          return throwError(() => new Error('Registration failed'));
        })
      );
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        console.log('Login response:', response);
        localStorage.setItem('token', response.token);
        console.log('Token stored:', response.token);
        this.getProfile().subscribe({
          error: err => console.error('Profile fetch after login failed:', err.message, err.status)
        });
      }),
      catchError(err => {
        console.error('Login error:', err);
        return throwError(() => new Error('Login failed'));
      })
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      tap(user => {
        console.log('Profile fetched:', user);
        this.currentUserSubject.next(user);
      }),
      catchError(err => {
        console.error('Get profile error:', err.message, err.status);
        if (err.status === 401) {
          this.logout();
        }
        return throwError(() => new Error('Failed to fetch profile'));
      })
    );
  }

  logout() {
    console.log('Logging out, clearing token');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.usersApiUrl).pipe(
      tap(users => console.log('Fetched users:', users)),
      catchError(err => {
        console.error('Get users error:', err.message, err.status);
        return throwError(() => new Error('Failed to fetch users'));
      })
    );
  }
}