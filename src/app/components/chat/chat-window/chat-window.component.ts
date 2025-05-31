import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Chat } from '../../../models/chat.model';
import { Message } from '../../../models/message.model';
import { MessageService } from '../../../services/message.service';
import { SignalRService } from '../../../services/signalr.service';
import { AuthService } from '../../../services/auth.service';
import { MediaService } from '../../../services/media.service';
import { User } from '../../../models/user.model';
import { Media } from '../../../models/media.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject } from 'rxjs';

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
    MatIconModule
  ],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  @Input() chat: Chat | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  currentUser: User | null = null;
  selectedFile: File | null = null;
  mediaCache: { [mediaId: string]: Media } = {};
  presence: { [userId: string]: boolean } = {};

  constructor(
    private messageService: MessageService,
    private signalRService: SignalRService,
    private authService: AuthService,
    private mediaService: MediaService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    this.signalRService.presence$.subscribe(presence => this.presence = presence);
    if (this.chat) {
      this.loadMessages();
      this.signalRService.startConnection().then(() => {
        this.signalRService.joinChat(this.chat!.id);
      });
      this.signalRService.messages$.subscribe(messages => {
        this.messages = messages;
        this.loadMediaForMessages(messages);
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
      this.messageService.getMessages(this.chat.id).subscribe(messages => {
        this.signalRService['messagesSubject'].next(messages);
      });
    }
  }

  loadMediaForMessages(messages: Message[]) {
    messages
      .filter(m => m.mediaId && !this.mediaCache[m.mediaId])
      .forEach(m => {
        // Placeholder: Backend needs a GET /media/:id endpoint
        this.mediaCache[m.mediaId!] = { id: m.mediaId!, fileUrl: '', fileType: '', fileSize: 0, uploadedBy: '', uploadedAt: '' };
      });
  }

  sendMessage() {
    if (!this.chat || (!this.newMessage && !this.selectedFile)) return;

    if (this.selectedFile) {
      this.mediaService.uploadMedia(this.selectedFile).subscribe(media => {
        this.messageService.sendMessage(this.chat!.id, this.newMessage, media.id).subscribe();
        this.newMessage = '';
        this.selectedFile = null;
      });
    } else {
      this.messageService.sendMessage(this.chat!.id, this.newMessage).subscribe();
      this.newMessage = '';
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
  }

  getChatName(chat: Chat): string {
    const userId = this.currentUser?.id;
    const otherParticipants = chat.participants.filter(id => id !== userId);
    return otherParticipants.join(', ');
  }

  isOnline(chat: Chat): boolean {
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
}