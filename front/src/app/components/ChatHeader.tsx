import { Bot, Menu, Plus } from 'lucide-react';
import { Button } from './ui/button';
import logo from 'figma:asset/98cbf83f9a88db9560e2e22a82c966e2efbff843.png';

interface ChatHeaderProps {
  onNewChat?: () => void;
}

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Contabilizei" className="size-8" />
            <div>
              <h1 className="font-semibold text-zinc-900">Copilot Contabilizei</h1>
              <p className="text-xs text-zinc-500">Assistente Inteligente</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onNewChat}>
          <Plus className="size-4 mr-2" />
          Nova Conversa
        </Button>
      </div>
    </header>
  );
}