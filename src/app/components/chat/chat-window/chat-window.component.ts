import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Chat } from '../../../models/chat.model';
import { Message } from '../../../models/message.model';
import { MessageService } from '../../../services/message.service';
import { SignalRService } from '../../../services/signalr.service';
import { AuthService } from '../../../services/auth.service';
import { MediaService } from '../../../services/media.service';
import { ChatService } from '../../../services/chat.service';
import { User } from '../../../models/user.model';
import { Media } from '../../../models/media.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  chat: Chat | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  currentUser: User | null = null;
  selectedFile: File | null = null;
  mediaCache: { [mediaId: string]: Media } = {};
  presence: { [userId: string]: boolean } = {};
  isSending: boolean = false;
  isLoading: boolean = true;
  chatId : string = "";

  constructor(
    private messageService: MessageService,
    private signalRService: SignalRService,
    private authService: AuthService,
    private mediaService: MediaService,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.signalRService.presence$.subscribe(presence => {
      this.presence = presence;
    });

    this.chatId = this.route.snapshot.paramMap.get('id') ?? '';
  if (this.chatId.trim()) {
    this.chatService.getChatById(this.chatId).subscribe({
      next: (chat) => {
          this.chat = chat;
          this.isLoading = false;
          this.initializeChat();
        },
        error: (err) => {
          console.error('Failed to load chat:', err);
          this.snackBar.open('Failed to load chat', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
      this.snackBar.open('Invalid chat ID', 'Close', { duration: 3000 });
    }
  }

  private initializeChat() {
    if (this.chat) {
      this.loadMessages();
      this.signalRService.startConnection().then(() => {
        this.signalRService.joinChat(this.chat!.id);
        this.signalRService.messages$.subscribe(messages => {
          this.messages = messages.map(msg => ({
            ...msg,
            chatId: msg.chatId || this.chat!.id
          }));
          this.loadMediaForMessages(this.messages);
        });
      }).catch(err => {
        console.error('SignalR initialization failed:', err);
        this.snackBar.open('Failed to connect to chat', 'Close', { duration: 3000 });
      });
    }
  }

  ngOnDestroy() {
    if (this.chat) {
      this.signalRService.stopConnection();
    }
  }

  loadMessages() {
    if (this.chat) {
      this.messageService.getMessages(this.chat.id).subscribe({
        next: (messages) => {
          this.signalRService['messagesSubject'].next(messages);
        },
        error: (err) => {
          console.error('Failed to load messages:', err);
          this.snackBar.open('Failed to load messages', 'Close', { duration: 3000 });
        }
      });
    }
  }

  loadMediaForMessages(messages: Message[]) {
    messages
      .filter(m => m.mediaId && !this.mediaCache[m.mediaId])
      .forEach(m => {
        this.mediaService.getMedia(m.mediaId!).subscribe({
          next: (media: Media) => {
            this.mediaCache[m.mediaId!] = media;
          },
          error: (err: any) => {
            console.error('Failed to load media:', m.mediaId, err);
            this.snackBar.open('Failed to load media', 'Close', { duration: 3000 });
          }
        });
      });
  }

  sendMessage() {
    if (!this.chat || (!this.newMessage.trim() && !this.selectedFile) || this.isSending || !this.currentUser) {
      this.snackBar.open('Please enter a message or select a file', 'Close', { duration: 3000 });
      return;
    }

    this.isSending = true;

    if (this.selectedFile) {
      this.mediaService.uploadMedia(this.selectedFile).subscribe({
        next: (media) => {
          this.messageService.sendMessage(this.chat!.id, this.newMessage, media.id).subscribe({
            next: (message) => {
              // Message is broadcast via SignalR by backend, no need to update manually
              this.newMessage = '';
              this.selectedFile = null;
              this.isSending = false;
              this.snackBar.open('Message sent', 'Close', { duration: 2000 });
            },
            error: (err) => {
              console.error('Failed to send message:', err);
              this.isSending = false;
              this.snackBar.open('Failed to send message: ' + (err.message || 'Unknown error'), 'Close', { duration: 3000 });
            }
          });
        },
        error: (err) => {
          console.error('Failed to upload media:', err);
          this.isSending = false;
          this.snackBar.open('Failed to upload file: ' + (err.message || 'Unknown error'), 'Close', { duration: 3000 });
        }
      });
    } else {
      this.messageService.sendMessage(this.chat!.id, this.newMessage).subscribe({
        next: (message) => {
          // Message is broadcast via SignalR by backend
          this.newMessage = '';
          this.isSending = false;
          this.snackBar.open('Message sent', 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error('Failed to send message:', err);
          this.isSending = false;
          this.snackBar.open('Failed to send message: ' + (err.message || 'Unknown error'), 'Close', { duration: 3000 });
        }
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      if (file.size > 100 * 1024 * 1024) {
        this.snackBar.open('File size exceeds 100MB limit', 'Close', { duration: 3000 });
        return;
      }
      this.selectedFile = file;
    }
  }

  getChatName(chat: Chat | null): string {
    if (!chat || !chat.participants || !this.currentUser?.id) {
      return 'Unknown Chat';
    }
    const userId = this.currentUser.id;
    const otherParticipants = chat.participants.filter(id => id !== userId);
    return otherParticipants.join(', ') || 'Empty Chat';
  }

  isOnline(chat: Chat | null): boolean {
    if (!chat || !chat.participants || !this.currentUser?.id) {
      return false;
    }
    const otherUserId = chat.participants.find(id => id !== this.currentUser?.id);
    return otherUserId ? this.presence[otherUserId] || false : false;
  }

  isImage(mediaId: string): boolean {
    return this.mediaCache[mediaId]?.fileType.startsWith('image/') || false;
  }

  isVideo(mediaId: string): boolean {
    return this.mediaCache[mediaId]?.fileType.startsWith('video/') || false;
  }

  getMediaUrl(mediaId: string): string {
    return this.mediaCache[mediaId]?.fileUrl || '';
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}