export interface Category {
  id: number;
  name: string;
}

export interface Document {
  id: number;
  original_file_name: string;
  parsing_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  category_id?: number;
  created_at: string;
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_type: 'USER' | 'AI';
  content: string;
  created_at: string;
  sources?: Source[];
}

export type ViewMode = 'chat' | 'explorer';

export interface Source {
  filename: string;
  category: string;
  page: number | null;
}

export interface SimpleMessage {
  sender: 'user' | 'ai';
  content: string;
  sources?: Source[];
}

export interface OpenTab {
  documentId: number;
  filename: string;
  messages: SimpleMessage[];
  isAsking: boolean;
}
