import { Send, AlignLeft, BarChart2, FileText } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';
import type { ResponseMode } from './ChatMessage';

interface ChatInputProps {
  onSend: (message: string, mode: ResponseMode) => void;
  disabled?: boolean;
}

const MODES: { value: ResponseMode; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'normal',
    label: 'Normal',
    icon: <AlignLeft className="size-3.5" />,
    description: 'Resposta completa',
  },
  {
    value: 'executive',
    label: 'Executivo',
    icon: <FileText className="size-3.5" />,
    description: 'Resumo direto',
  },
  {
    value: 'chart',
    label: 'Gráfico',
    icon: <BarChart2 className="size-3.5" />,
    description: 'Visualização',
  },
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ResponseMode>('normal');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim(), mode);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 pt-3 pb-4">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Seletor de modo */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Formato:</span>
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              disabled={disabled}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
                transition-all duration-150 border
                ${
                  mode === m.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* Área de texto + botão */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Envie uma mensagem..."
              disabled={disabled}
              rows={1}
              className="
                w-full resize-none rounded-xl border border-slate-200 bg-slate-50
                px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
                disabled:opacity-50 transition-all
                min-h-[48px] max-h-[180px] overflow-y-auto
              "
              style={{ height: 'auto' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 180) + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="
              size-11 rounded-xl flex items-center justify-center flex-shrink-0
              bg-slate-900 text-white
              hover:bg-slate-700 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
