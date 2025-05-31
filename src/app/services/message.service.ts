import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  sendMessage(chatId: string, content: string, mediaId?: string): Observable<Message> {
    return this.http.post<Message>(this.apiUrl, { chatId, content, mediaId });
  }

  getMessages(chatId: string, skip: number = 0, take: number = 50): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${chatId}?skip=${skip}&take=${take}`);
  }
}