import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const token = localStorage.getItem('token');
  console.log(`Interceptor: Adding token to ${req.url}:`, !!token);

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned).pipe(
      catchError((err) => {
        if (err.status === 401) {
          console.warn(`401 Unauthorized for ${req.url}, clearing token`);
          localStorage.removeItem('token');
          // Instead of router navigation, rely on AuthService or guards to handle redirect
          window.location.href = '/login'; // Fallback navigation (not ideal, but works)
        }
        return throwError(() => err);
      })
    );
  }

  console.log(`Interceptor: No token for ${req.url}`);
  return next(req);
};