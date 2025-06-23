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
        accessTokenFactory: () => this.authService.getToken() || '',
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();
  this.hubConnection.on('ReceiveMessage', (userId: string, content: string) => {
    const messages = this.messagesSubject.value;
    const newMessage: Message = {
      id: `client-${Date.now()}`,
      chatId: '', // Set in ChatWindowComponent
      senderId: userId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false, // Default value
      isDelivered: false // Default value
    };
    this.messagesSubject.next([...messages, newMessage]);
  });

    this.hubConnection.on('UserPresenceUpdated', (userId: string, isOnline: boolean) => {
      const presence = { ...this.presenceSubject.value, [userId]: isOnline };
      this.presenceSubject.next(presence);
    });

    this.hubConnection.onreconnecting(error => {
      console.warn('SignalR reconnecting:', error);
    });

    this.hubConnection.onreconnected(connectionId => {
      console.log('SignalR reconnected:', connectionId);
    });

    this.hubConnection.onclose(error => {
      console.error('SignalR connection closed:', error);
    });
  }

  async startConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      try {
        await this.hubConnection.start();
        console.log('SignalR connected');
      } catch (err) {
        console.error('SignalR Connection Error:', err);
        throw err;
      }
    }
  }

  async joinChat(chatId: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.hubConnection.invoke('JoinChat', chatId);
      console.log(`Joined chat: ${chatId}`);
    } catch (err) {
      console.error('Failed to join chat:', err);
      throw err;
    }
  }

  async sendMessage(chatId: string, userId: string, content: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.hubConnection.invoke('SendMessage', chatId, userId, content);
      console.log('Message sent via SignalR:', { chatId, userId, content });
    } catch (err) {
      console.error('SignalR SendMessage Error:', err);
      throw err;
    }
  }

  async stopConnection(): Promise<void> {
    try {
      if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
        await this.hubConnection.stop();
        console.log('SignalR disconnected');
      }
    } catch (err) {
      console.error('SignalR Disconnection Error:', err);
    }
  }

private async ensureConnection(): Promise<void> {
  const state = this.hubConnection.state as signalR.HubConnectionState; // Type assertion
  if (state === signalR.HubConnectionState.Disconnected) {
    await this.startConnection();
  } else if (
    state === signalR.HubConnectionState.Connecting ||
    state === signalR.HubConnectionState.Reconnecting
  ) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not ready');
    }
  }
}
}