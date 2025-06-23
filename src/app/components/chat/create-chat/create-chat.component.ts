import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog'; // Add MatDialogModule
import { FormsModule } from '@angular/forms';
import { User } from '../../../models/user.model';
import { HttpClient } from '@angular/common/http'; // For API calls
import { Observable } from 'rxjs';

@Component({
  selector: 'app-create-chat',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule, // Include MatDialogModule
    FormsModule
  ],
  templateUrl: './create-chat.component.html',
  styleUrls: ['./create-chat.component.scss']
})
export class CreateChatComponent implements OnInit {
  isGroupChat: boolean = false;
  groupName: string = '';
  selectedUsers: string[] = [];
  users: User[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<CreateChatComponent>,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient // For fetching users
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<User[]>('http://localhost:5110/api/chats/user').subscribe({
      next: (users) => {
        this.users = users;
        console.log('Users loaded:', users);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }

  toggleUserSelection(userId: string) {
    const index = this.selectedUsers.indexOf(userId);
    if (index >= 0) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  onCreate() {
    if (this.selectedUsers.length === 0) {
      this.snackBar.open('Please select at least one user', 'Close', { duration: 3000 });
      return;
    }
    if (this.isGroupChat && (!this.groupName || this.groupName.trim() === '')) {
      this.snackBar.open('Group name is required', 'Close', { duration: 3000 });
      return;
    }

    // No need to add currentUser.id; backend handles it
    const participantIds = [...this.selectedUsers];

    this.chatService
      .createChat(participantIds, this.isGroupChat, this.groupName)
      .subscribe({
        next: (chat) => {
          this.snackBar.open('Chat created successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
          this.router.navigate(['/chat', chat.id]);
        },
        error: (err) => {
          this.snackBar.open('Failed to create chat', 'Close', { duration: 3000 });
          console.error('Failed to create chat:', err);
        }
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}