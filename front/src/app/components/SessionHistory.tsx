import { MessageSquare, Clock } from 'lucide-react';

export interface HistoryEntry {
  messageId: string;
  question: string;
  timestamp: Date;
}

interface SessionHistoryProps {
  entries: HistoryEntry[];
  onEntryClick: (messageId: string) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function SessionHistory({ entries, onEntryClick }: SessionHistoryProps) {
  return (
    <aside className="w-60 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col h-full transition-colors duration-200">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Sessão atual
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto py-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
            <MessageSquare className="size-6 text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              As perguntas desta sessão aparecem aqui
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <button
              key={entry.messageId}
              onClick={() => onEntryClick(entry.messageId)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-snug line-clamp-2 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                {entry.question}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {formatTime(entry.timestamp)}
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
