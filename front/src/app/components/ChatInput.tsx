import { Send, AlignLeft, BarChart2, FileText } from 'lucide-react';
import { useState, useEffect, KeyboardEvent } from 'react';
import type { ResponseMode } from './ChatMessage';

const PLACEHOLDERS = [
  'Envie uma mensagem...',
  'Qual o CNAE mais comum no Nordeste?',
  'Compare empresas por porte e região...',
  'Quantas empresas abertas no último ano?',
  'Qual estado tem mais MEIs ativos?',
  'Mostre a distribuição por regime tributário...',
];

interface ChatInputProps {
  onSend: (message: string, mode: ResponseMode) => void;
  disabled?: boolean;
}

const MODES: { value: ResponseMode; label: string; icon: React.ReactNode; tooltip: string }[] = [
  {
    value: 'normal',
    label: 'Normal',
    icon: <AlignLeft className="size-3.5" />,
    tooltip: 'Resposta completa com todos os detalhes',
  },
  {
    value: 'executive',
    label: 'Executivo',
    icon: <FileText className="size-3.5" />,
    tooltip: 'Resumo direto com conclusão e recomendação',
  },
  {
    value: 'chart',
    label: 'Gráfico',
    icon: <BarChart2 className="size-3.5" />,
    tooltip: 'Visualização dos dados em gráfico interativo',
  },
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput]             = useState('');
  const [mode, setMode]               = useState<ResponseMode>('normal');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pt-3 pb-4 transition-colors duration-200">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Seletor de modo */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-300 font-medium mr-1">Formato:</span>
          {MODES.map((m) => (
            <div key={m.value} className="relative group">
              <button
                onClick={() => setMode(m.value)}
                disabled={disabled}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
                  transition-all duration-150 border
                  ${
                    mode === m.value
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {m.icon}
                {m.label}
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg
                bg-slate-900 dark:bg-slate-700 text-white text-[11px] leading-snug whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-10
                shadow-lg">
                {m.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
              </div>
            </div>
          ))}
        </div>

        {/* Área de texto + botão */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              disabled={disabled}
              rows={1}
              className="
                w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700
                bg-slate-50 dark:bg-slate-800
                px-4 py-3 pr-12 text-sm text-slate-900 dark:text-slate-100
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10
                focus:border-slate-400 dark:focus:border-slate-500
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
              bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900
              hover:bg-slate-700 dark:hover:bg-slate-300 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            <Send className="size-4" />
          </button>
        </div>

        {/* Hint de teclado */}
        <p className="text-[10px] text-slate-300 dark:text-slate-400 text-right">
          ↵ enviar · Shift+↵ nova linha
        </p>
      </div>
    </div>
  );
}
