export interface Chat {
  id: string;
  participants: string[];
  isGroupChat: boolean;
  groupName?: string;
  lastMessageId?: string; // ✨ New field
  createdAt: string;
  updatedAt: string;
}