import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { Chat } from '../../../models/chat.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateChatComponent } from '../create-chat/create-chat.component';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit {
  chats: Chat[] = [];
  @Output() chatSelected = new EventEmitter<Chat>();
  currentUserId: string | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.id || null;
      this.chatService.getChats().subscribe(chats => {
        this.chats = chats;
      });
    });
  }

  selectChat(chat: Chat) {
    this.chatSelected.emit(chat);
  }

  getChatName(chat: Chat): string {
    const otherParticipants = chat.participants.filter(id => id !== this.currentUserId);
    return otherParticipants.join(', ');
  }

  openCreateChatDialog() {
    this.dialog.open(CreateChatComponent, {
      width: '400px'
    }).afterClosed().subscribe(result => {
      if (result) {
        this.chatService.getChats().subscribe(chats => this.chats = chats);
      }
    });
  }
}