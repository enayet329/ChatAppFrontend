import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message } from '../models/message.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  messages$ = this.messagesSubject.asObservable();
  private presenceSubject = new BehaviorSubject<{ [userId: string]: boolean }>({});
  presence$ = this.presenceSubject.asObservable();

  constructor(private authService: AuthService) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRHubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .build();

    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      const messages = this.messagesSubject.value;
      this.messagesSubject.next([...messages, message]);
    });

    this.hubConnection.on('UserPresenceUpdated', (userId: string, isOnline: boolean) => {
      const presence = { ...this.presenceSubject.value, [userId]: isOnline };
      this.presenceSubject.next(presence);
    });
  }

  async startConnection() {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      await this.hubConnection.start().catch(err => console.error('SignalR Connection Error:', err));
    }
  }

  async joinChat(chatId: string) {
    await this.hubConnection.invoke('JoinChat', chatId);
  }

  async sendMessage(chatId: string, userId: string, content: string) {
    await this.hubConnection.invoke('SendMessage', chatId, userId, content);
  }

  async stopConnection() {
    await this.hubConnection.stop();
  }
}