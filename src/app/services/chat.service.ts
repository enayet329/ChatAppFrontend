import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Chat } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chats`;

  constructor(private http: HttpClient) {}

  createChat(participantIds: string[], isGroupChat: boolean, groupName?: string): Observable<Chat> {
    return this.http.post<Chat>(this.apiUrl, { participantIds, isGroupChat, groupName });
  }

  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(this.apiUrl);
  }
}