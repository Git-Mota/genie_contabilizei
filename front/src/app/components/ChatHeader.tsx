import { RotateCcw, Download, Sun, Moon } from 'lucide-react';
import SwellLogo from './figma/SwellLogo';

interface ChatHeaderProps {
  onNewChat?: () => void;
  onExport?: () => void;
  hasMessages?: boolean;
  isExporting?: boolean;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

export function ChatHeader({ onNewChat, onExport, hasMessages, isExporting, darkMode, onToggleDark }: ChatHeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3.5 transition-colors duration-200">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Identidade */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center">
            <SwellLogo className="h-full w-full" ariaLabel="SwellData" />
          </div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            SwellData
          </h1>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {hasMessages && (
            <button
              onClick={onExport}
              disabled={isExporting}
              className="
                flex items-center gap-1.5 text-xs font-medium
                text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100
                border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500
                px-3 py-1.5 rounded-lg transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Download className="size-3" />
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
          )}

          <button
            onClick={onNewChat}
            className="
              flex items-center gap-1.5 text-xs font-medium
              text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100
              border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500
              px-3 py-1.5 rounded-lg transition-all duration-150
            "
          >
            <RotateCcw className="size-3" />
            Nova conversa
          </button>

          <button
            onClick={onToggleDark}
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
            className="
              flex items-center justify-center size-8 rounded-lg
              text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100
              border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500
              transition-all duration-150
            "
          >
            {darkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
