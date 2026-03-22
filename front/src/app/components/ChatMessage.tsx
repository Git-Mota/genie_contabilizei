import { Bot, User } from 'lucide-react';
import logo from '../../assets/logo.png';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div
      className={`flex gap-4 px-4 py-6 ${
        isUser ? 'bg-white' : 'bg-cyan-50'
      }`}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="size-8 rounded-sm flex items-center justify-center bg-zinc-900 text-white">
            <User className="size-5" />
          </div>
        ) : (
          <img src={logo} alt="Copilot" className="size-8 rounded-sm" />
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="text-zinc-900 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}