export interface Chat {
  id: string;
  participants: string[];
  isGroupChat: boolean;
  groupName?: string;
  lastMessageId?: string;
  createdAt: string;
  updatedAt: string;
}