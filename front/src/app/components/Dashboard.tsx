import { useEffect, useState } from 'react';
import { Users, Tag, MapPin, BarChart2, RefreshCw, AlertCircle } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import logo from '../../assets/logo.png';

const API_URL = (import.meta.env.VITE_API_URL as string ?? 'http://localhost:8000').replace(/\/$/, '');

interface KpiData {
  id: string;
  label: string;
  value: string;
  type: string;
  error: boolean;
}

const CHART_COLORS = ['#0057B8', '#00A3E0', '#00C389', '#F5A623', '#E8453C'];

const KPI_ICONS: Record<string, React.ReactNode> = {
  clientes_ativos: <Users className="size-4 text-blue-500" />,
  cnae_comum:      <Tag className="size-4 text-amber-500" />,
  regioes:         <MapPin className="size-4 text-purple-500" />,
  top5_uf:         <BarChart2 className="size-4 text-emerald-500" />,
};

const KPI_QUESTIONS: Record<string, string> = {
  clientes_ativos: 'Quantos clientes ativos eu possuo?',
  cnae_comum:      'Qual é o CNAE mais comum entre meus clientes?',
  regioes:         'Separe os clientes por região',
  top5_uf:         'Quais são os 5 estados com mais clientes ativos?',
};

// Converte "Nome:Valor|Nome:Valor" em array para Recharts
function parsePipeData(value: string): { name: string; value: number }[] {
  return value.split('|').map((item) => {
    const [name, qty] = item.split(':');
    return { name: name?.trim(), value: parseInt(qty?.replace(/\D/g, '') || '0', 10) };
  }).filter((d) => d.name && d.value > 0);
}

function ErrorState() {
  return (
    <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
      <AlertCircle className="size-3.5" />
      Erro ao carregar
    </div>
  );
}

// Card KPI simples
function KpiCard({ kpi, onClick }: { kpi: KpiData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer
        hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        {KPI_ICONS[kpi.id]}
        <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
      </div>
      {kpi.error ? <ErrorState /> : (
        <p className="text-lg font-semibold text-slate-900 leading-tight">{kpi.value}</p>
      )}
    </div>
  );
}

// Card pie chart — regiões
function PieCard({ kpi, onClick }: { kpi: KpiData; onClick: () => void }) {
  const data = parsePipeData(kpi.value);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer
        hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        {KPI_ICONS[kpi.id]}
        <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
      </div>
      {kpi.error || !data.length ? <ErrorState /> : (
        <div className="flex items-center gap-3">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR')} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 flex-1">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="size-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-[11px] text-slate-600 flex-1 truncate">{d.name}</span>
                <span className="text-[11px] font-medium text-slate-800">
                  {d.value.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Card bar chart — top 5 UFs
function BarCard({ kpi, onClick }: { kpi: KpiData; onClick: () => void }) {
  const data = parsePipeData(kpi.value);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer
        hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        {KPI_ICONS[kpi.id]}
        <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
      </div>
      {kpi.error || !data.length ? <ErrorState /> : (
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR')} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Skeleton de loading
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className}`} />;
}

interface DashboardProps {
  onQuestionClick: (question: string) => void;
}

export function Dashboard({ onQuestionClick }: DashboardProps) {
  const [kpis, setKpis]       = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/dashboard`);
      if (!res.ok) throw new Error();
      setKpis(await res.json());
    } catch {
      console.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const getKpi = (id: string) => kpis.find((k) => k.id === id);

  const handleClick = (id: string) => {
    onQuestionClick(KPI_QUESTIONS[id] || id);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8 gap-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="size-14 rounded-2xl bg-[#003366] flex items-center justify-center p-2.5 mx-auto">
          <img src={logo} alt="Contabilizei" className="size-full object-contain" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Copilot Contabilizei</h2>
        <p className="text-sm text-slate-500 max-w-xs">
          Visão geral da sua base. Clique em qualquer card para explorar.
        </p>
      </div>

      {/* Grid de cards */}
      <div className="w-full max-w-2xl space-y-3">
        {loading ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </>
        ) : (
          <>
            {/* Linha 1 — KPIs simples */}
            <div className="grid grid-cols-2 gap-3">
              {getKpi('clientes_ativos') && (
                <KpiCard kpi={getKpi('clientes_ativos')!} onClick={() => handleClick('clientes_ativos')} />
              )}
              {getKpi('cnae_comum') && (
                <KpiCard kpi={getKpi('cnae_comum')!} onClick={() => handleClick('cnae_comum')} />
              )}
            </div>

            {/* Linha 2 — Gráficos */}
            <div className="grid grid-cols-2 gap-3">
              {getKpi('regioes') && (
                <PieCard kpi={getKpi('regioes')!} onClick={() => handleClick('regioes')} />
              )}
              {getKpi('top5_uf') && (
                <BarCard kpi={getKpi('top5_uf')!} onClick={() => handleClick('top5_uf')} />
              )}
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
}
