import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ChatService } from '../../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-create-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './create-chat.component.html',
  styleUrls: ['./create-chat.component.scss']
})
export class CreateChatComponent {
  participantIds: string = '';
  isGroupChat: boolean = false;
  groupName: string = '';

  constructor(
    private chatService: ChatService,
    private dialogRef: MatDialogRef<CreateChatComponent>
  ) {}

  onCreate() {
    const ids = this.participantIds.split(',').map(id => id.trim());
    this.chatService.createChat(ids, this.isGroupChat, this.isGroupChat ? this.groupName : undefined)
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => alert('Failed to create chat: ' + err.message)
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}