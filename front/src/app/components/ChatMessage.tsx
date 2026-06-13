import { User } from 'lucide-react';
import logo from '../../assets/logo.png';
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
}

interface ChatMessageProps {
  message: Message;
}

// Paleta de cores para os gráficos
const CHART_COLORS = ['#0057B8', '#00A3E0', '#00C389', '#F5A623', '#E8453C'];

// Tenta extrair JSON de dados de um texto que contenha ```json ... ```
function extractChartData(content: string) {
  try {
    // Tenta parsear direto (retorno do backend via SQL)
    const parsed = JSON.parse(content.trim());
    if (parsed.chartType && Array.isArray(parsed.data)) return parsed;
  } catch {
    // não era JSON puro, tenta bloco markdown
  }

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.chartType && Array.isArray(parsed.data)) return parsed;
    return null;
  } catch {
    return null;
  }
}

// Renderiza o gráfico com base nos dados extraídos
function ChartRenderer({ content }: { content: string }) {
  const chartData = extractChartData(content);

  // Se não encontrou dados estruturados, exibe o texto normalmente
  if (!chartData) {
    return (
      <div className="text-zinc-900 whitespace-pre-wrap break-words text-sm leading-relaxed">
        {content}
      </div>
    );
  }

  const { chartType, data } = chartData;
  const keys = Object.keys(data[0] || {}).filter((k) => k !== 'name' && k !== 'label');
  const nameKey = data[0]?.name !== undefined ? 'name' : 'label';

  const commonProps = {
    data,
    margin: { top: 8, right: 16, left: 0, bottom: 8 },
  };

  return (
    <div className="mt-2 w-full">
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
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        ) : (
          // Padrão: bar chart
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {keys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// Badge de modo de resposta
function ModeBadge({ mode }: { mode: ResponseMode }) {
  const config: Record<ResponseMode, { label: string; className: string }> = {
    normal: { label: 'Resposta normal', className: 'bg-zinc-100 text-zinc-500' },
    executive: { label: 'Resumo executivo', className: 'bg-blue-50 text-blue-600' },
    chart: { label: 'Visualização em gráfico', className: 'bg-emerald-50 text-emerald-600' },
  };
  const { label, className } = config[mode];
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 px-6 py-5 ${isUser ? 'bg-transparent' : 'bg-slate-50/70'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="size-7 rounded-full flex items-center justify-center bg-slate-800 text-white">
            <User className="size-3.5" />
          </div>
        ) : (
          <div className="size-7 rounded-full bg-white border border-slate-200 flex items-center justify-center p-1">
            <img src={logo} alt="Copilot" className="size-full object-contain" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            {isUser ? 'Você' : 'Copilot'}
          </span>
          {!isUser && message.mode && message.mode !== 'normal' && (
            <ModeBadge mode={message.mode} />
          )}
        </div>

        {/* Conteúdo renderizado */}
        {!isUser && message.mode === 'chart' ? (
          <ChartRenderer content={message.content} />
        ) : (
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}
