import { RotateCcw, Download } from 'lucide-react';
import logo from '../../assets/logo.png';

interface ChatHeaderProps {
  onNewChat?: () => void;
  onExport?: () => void;
  hasMessages?: boolean;
  isExporting?: boolean;
}

export function ChatHeader({ onNewChat, onExport, hasMessages, isExporting }: ChatHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-3.5">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Identidade */}
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-[#003366] flex items-center justify-center p-1.5">
            <img src={logo} alt="Contabilizei" className="size-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">
              Copilot Contabilizei
            </h1>
            <p className="text-[11px] text-slate-400 leading-tight">Databricks Genie</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Exportar PDF — só aparece quando há mensagens */}
          {hasMessages && (
            <button
              onClick={onExport}
              disabled={isExporting}
              className="
                flex items-center gap-1.5 text-xs font-medium
                text-slate-500 hover:text-slate-900
                border border-slate-200 hover:border-slate-400
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
              text-slate-500 hover:text-slate-900
              border border-slate-200 hover:border-slate-400
              px-3 py-1.5 rounded-lg transition-all duration-150
            "
          >
            <RotateCcw className="size-3" />
            Nova conversa
          </button>
        </div>
      </div>
    </header>
  );
}
