import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth.service';
import { Chat } from '../../../models/chat.model';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CreateChatComponent } from '../create-chat/create-chat.component';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    RouterModule,
    MatSnackBarModule
  ],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit {
  chats: Chat[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.loadChats(currentUser.id);
    } else {
      console.warn('No user logged in');
      this.snackBar.open('Please log in to view chats', 'Close', { duration: 3000 });
    }
  }

  openCreateChatDialog(): void {
    const dialogRef = this.dialog.open(CreateChatComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const currentUser = this.authService.currentUser;
        if (currentUser) {
          this.loadChats(currentUser.id);
        }
      }
    });
  }

  private loadChats(userId: string): void {
    this.chatService.getUserChats(userId).subscribe({
      next: (chats: Chat[]) => {
        this.chats = chats;
        console.log('Chats loaded:', chats);
      },
      error: (err) => {
        console.error('Failed to load chats:', err);
        this.snackBar.open('Failed to load chats', 'Close', { duration: 3000 });
      }
    });
  }

  refreshChats(): void {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.loadChats(currentUser.id);
    } else {
      this.snackBar.open('Please log in to refresh chats', 'Close', { duration: 3000 });
    }
  }

  getChatName(chat: Chat): string {
    const userId = this.authService.currentUser?.id;
    const otherParticipants = chat.participants.filter(id => id !== userId);
    return otherParticipants.join(', ');
  }
}