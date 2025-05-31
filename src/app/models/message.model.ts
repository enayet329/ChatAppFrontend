export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content?: string;
  mediaId?: string;
  timestamp: string;
  isRead: boolean;
  isDelivered: boolean;
}