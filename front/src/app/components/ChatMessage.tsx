import { useState } from 'react';
import { User, Copy, Check, ChevronDown, ChevronUp, Download } from 'lucide-react';
import SwellLogo from './figma/SwellLogo';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export type ResponseMode = 'normal' | 'executive' | 'chart';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: ResponseMode;
  sql_query?: string | null;
  suggestions?: string[];
}

interface ChatMessageProps {
  message: Message;
  onSuggestionClick?: (text: string) => void;
}

const CHART_COLORS = ['#0057B8', '#00A3E0', '#00C389', '#F5A623', '#E8453C', '#9B59B6'];

// ── Parsing ──────────────────────────────────

function extractChartData(content: string): { chartType: string; data: Record<string, unknown>[] } | null {
  try {
    const parsed = JSON.parse(content.trim());
    if (parsed.chartType && Array.isArray(parsed.data)) return parsed;
  } catch { /* continua */ }

  try {
    const match = content.match(/```json\s*([\s\S]*?)```/);
    if (!match) return null;
    const parsed = JSON.parse(match[1]);
    if (parsed.chartType && Array.isArray(parsed.data)) return parsed;
  } catch { /* continua */ }

  return null;
}

// ── Markdown renderer ─────────────────────────

function renderInline(text: string): React.ReactNode {
  // Trata **negrito** e *itálico*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Lista com - ou *
        if (/^[-*] /.test(trimmed)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-slate-400 flex-shrink-0 mt-0.5">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Linha vazia — espaçamento
        if (!trimmed) return <div key={i} className="h-1" />;

        // Linha normal
        return <div key={i}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

// ── Export ────────────────────────────────────

function exportCSV(data: Record<string, unknown>[]) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h] ?? '').join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resultado.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportTXT(content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resposta.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Subcomponentes ────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
    >
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-[11px] font-medium text-slate-500 dark:text-slate-400"
      >
        <span>SQL gerada pelo Genie</span>
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {open && (
        <div className="relative">
          <pre className="text-[11px] bg-slate-950 text-emerald-300 p-3 overflow-x-auto leading-relaxed">
            {sql}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            {copied ? 'Copiado' : 'Copiar SQL'}
          </button>
        </div>
      )}
    </div>
  );
}

function ChartRenderer({ content }: { content: string }) {
  const chartData = extractChartData(content);

  if (!chartData) {
    return <MarkdownText content={content} />;
  }

  const { chartType, data } = chartData;
  const keys    = Object.keys(data[0] || {}).filter((k) => k !== 'name');
  const nameKey = 'name';
  const commonProps = { data, margin: { top: 8, right: 16, left: 0, bottom: 8 } };

  return (
    <div className="mt-2 w-full space-y-2">
      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={data}
              dataKey={keys[0]}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : chartType === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {keys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
            ))}
          </LineChart>
        ) : (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {keys.map((key, i) => (
              <Bar key={key} dataKey={key}
                fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>

      <div className="flex justify-end">
        <button
          onClick={() => exportCSV(data as Record<string, unknown>[])}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Download className="size-3" />
          Exportar CSV
        </button>
      </div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: ResponseMode }) {
  const config: Record<ResponseMode, { label: string; className: string }> = {
    normal:    { label: 'Normal',    className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' },
    executive: { label: 'Executivo', className: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
    chart:     { label: 'Gráfico',   className: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
  };
  const { label, className } = config[mode];
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}

// ── Componente principal ──────────────────────

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser  = message.role === 'user';
  const isChart = !isUser && message.mode === 'chart';

  return (
    <div className={`flex gap-3 px-6 py-5 ${isUser ? 'bg-transparent' : 'bg-slate-50/70 dark:bg-slate-800/40'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="size-7 rounded-full flex items-center justify-center bg-slate-800 dark:bg-slate-600 text-white">
            <User className="size-3.5" />
          </div>
        ) : (
          <div className="size-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1">
            <SwellLogo className="size-full object-contain" ariaLabel="SwellData" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isUser ? 'Você' : 'SwellData'}
          </span>
          {isUser && message.mode && message.mode !== 'normal' && (
            <ModeBadge mode={message.mode} />
          )}
          {!isUser && message.mode && (
            <ModeBadge mode={message.mode} />
          )}
        </div>

        {/* Corpo — usuário usa texto simples, assistente usa markdown */}
        {isUser ? (
          <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : isChart ? (
          <ChartRenderer content={message.content} />
        ) : (
          <MarkdownText content={message.content} />
        )}

        {/* Ações pós-resposta */}
        {!isUser && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <CopyButton text={message.content} />
              {!isChart && (
                <button
                  onClick={() => exportTXT(message.content)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <Download className="size-3" />
                  Exportar TXT
                </button>
              )}
            </div>

            {message.sql_query && <SqlBlock sql={message.sql_query} />}

            {message.suggestions && message.suggestions.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Perguntas sugeridas</p>
                <div className="flex flex-col gap-1.5">
                  {message.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => onSuggestionClick?.(s)}
                      className="text-left text-[12px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2
                        hover:border-slate-400 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
