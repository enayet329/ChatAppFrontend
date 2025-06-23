import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Chat } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chats`;

  constructor(private http: HttpClient) {}

  // ✨ Create chat with PascalCase payload
createChat(participantIds: string[], isGroupChat: boolean, groupName?: string): Observable<Chat> {
  if (!participantIds || participantIds.length === 0) {
    console.error('ParticipantIds cannot be empty');
    return throwError(() => new Error('At least one participant is required'));
  }
  if (isGroupChat && (!groupName || groupName.trim() === '')) {
    console.error('GroupName is required for group chats');
    return throwError(() => new Error('Group name is required for group chats'));
  }
  const body = {
    ParticipantIds: participantIds,
    IsGroupChat: isGroupChat,
    GroupName: isGroupChat ? groupName : null
  };
  console.log('Create chat payload:', body);
  return this.http.post<Chat>(this.apiUrl, body).pipe(
    tap(chat => console.log('Chat created:', chat)),
    catchError(err => {
      console.error('Create chat error:', {
        message: err.message,
        status: err.status,
        error: err.error,
        details: err.error?.errors || err.error?.message
      });
      return throwError(() => new Error(err.error?.message || 'Failed to create chat'));
    })
  );
}
  getUserChats(userId: string): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.apiUrl}`).pipe(
      tap(chats => console.log('Fetched user chats:', chats)),
      catchError(err => {
        console.error('Get user chats error:', err.message, err.status);
        return throwError(() => new Error('Failed to fetch user chats'));
      })
    );
  }

  getChatById(chatId: string): Observable<Chat> {
  return this.http.get<Chat>(`${this.apiUrl}`).pipe(
    tap(chat => console.log('Fetched chat:', chat)),
    catchError(err => {
      console.error('Get chat error:', err.message, err.status);
      return throwError(() => new Error('Failed to fetch chat'));
    })
  );
}
}

