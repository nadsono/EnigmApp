import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3 } from 'lucide-react';
import type {
  BetEntry,
  DateRangePreset,
  ScreenId,
} from '../../domain/types.ts';
import {
  evaluateBetEntry,
  formatCurrencyBRL,
} from '../../domain/ledger.ts';
import type { GlobalFinancialSummary } from '../../domain/ledger.ts';
import { buildSettledProfitSeries } from '../../domain/reporting.ts';

type Props = {
  entries: BetEntry[];
  undatedCount: number;
  onOpenEntry: (entryId: string) => void;
  summary: GlobalFinancialSummary;
  periodLabel: string;
  activePreset: DateRangePreset;
  onPeriodChange: (preset: DateRangePreset) => void;
  onNavigate: (screen: ScreenId) => void;
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 230;
const PLOT = { left: 100, right: 18, top: 18, bottom: 34 };

const periodOptions: { value: DateRangePreset; label: string }[] = [
  { value: 'mes_atual', label: 'Este mês' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'todo_periodo', label: 'Todo o período' },
];

function ProfitTrend({
  entries,
  periodLabel,
  activePreset,
  onPeriodChange,
  undatedCount,
  onOpenEntry,
}: Pick<Props, 'entries' | 'periodLabel' | 'activePreset' | 'onPeriodChange' | 'undatedCount' | 'onOpenEntry'>) {
  const [mode, setMode] = useState<'dia' | 'acumulado'>('acumulado');
  const [focusedPoint, setFocusedPoint] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const dailyPoints = useMemo(() => buildSettledProfitSeries(entries), [entries]);
  const points = useMemo(() => {
    let runningTotal = 0;
    return dailyPoints.map((point) => {
      runningTotal += point.amount;
      return { ...point, plottedAmount: mode === 'dia' ? point.amount : runningTotal };
    });
  }, [dailyPoints, mode]);

  const plotWidth = CHART_WIDTH - PLOT.left - PLOT.right;
  const plotHeight = CHART_HEIGHT - PLOT.top - PLOT.bottom;
  const values = points.map((point) => point.plottedAmount);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const span = high - low || 1;
  const zeroY = PLOT.top + ((high - 0) / span) * plotHeight;
  const firstDay = points.length ? Date.parse(points[0].date) : 0;
  const daySpan = points.length ? Date.parse(points[points.length - 1].date) - firstDay : 0;
  const positioned = points.map((point) => ({
    ...point,
    x: PLOT.left + (daySpan === 0 ? plotWidth / 2 : ((Date.parse(point.date) - firstDay) / daySpan) * plotWidth),
    y: PLOT.top + ((high - point.plottedAmount) / span) * plotHeight,
  }));
  const linePath = positioned
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = positioned.length
    ? `${linePath} L ${positioned[positioned.length - 1].x} ${zeroY} L ${positioned[0].x} ${zeroY} Z`
    : '';
  const activePoint = focusedPoint === null ? null : positioned[focusedPoint] ?? null;
  const totalProfit = dailyPoints.reduce((sum, point) => sum + point.amount, 0);
  const plotTicks = [0, 1, 2, 3].map((tick) => ({
    y: PLOT.top + (plotHeight * tick) / 3,
    value: high - (span * tick) / 3,
  }));
  const xLabels = positioned.length > 1
    ? [...new Map([positioned[0], positioned[Math.floor((positioned.length - 1) / 2)], positioned[positioned.length - 1]].map((point) => [point.date, point])).values()]
    : positioned;

  return (
    <section className="min-w-0 rounded-[12px] border border-[#D8E0E8] bg-white p-[18px] sm:p-[22px]">
      <div className="flex flex-wrap items-start justify-between gap-[12px]">
        <div>
          <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-[#17212B]">
            Resultado liquidado
          </h2>
          <p className="mb-0 mt-[4px] text-[12px] text-[#667484]">
            Resultado pela data de liquidação. Selecione um ponto para ver os registros.
          </p>
        </div>
        <div className="inline-flex rounded-[8px] border border-[#D8E0E8] bg-[#F7F9FA] p-[3px]" aria-label="Visualização do gráfico">
          {([
            ['acumulado', 'Acumulado'],
            ['dia', 'Por dia'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`rounded-[6px] px-[9px] py-[6px] text-[11px] font-semibold transition-colors ${
                mode === value
                  ? 'bg-white text-[#0F6B5C] shadow-sm'
                  : 'text-[#667484] hover:text-[#17212B]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[10px] border-b border-[#E9EEF2] pb-[12px]">
        <div className="flex flex-wrap gap-[5px]" aria-label="Período dos indicadores">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPeriodChange(option.value)}
              aria-pressed={activePreset === option.value}
              className={`rounded-full border px-[10px] py-[5px] text-[11px] font-medium transition-colors ${
                activePreset === option.value
                  ? 'border-[#0F6B5C] bg-[#EAF4F1] text-[#0F6B5C]'
                  : 'border-[#D8E0E8] bg-white text-[#667484] hover:border-[#9AA9B8] hover:text-[#17212B]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[#7B8794]">{points.length ? periodLabel : 'Sem operações concluídas'}</span>
      </div>

      <div className="relative mt-[8px] min-h-[190px]">
        {positioned.length ? (
          <>
            <svg
              className="block h-[210px] w-full overflow-visible"
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              role="group"
              aria-label={`Gráfico ${mode === 'dia' ? 'diário' : 'acumulado'} do resultado liquidado`}
            >
              <defs>
                <linearGradient id="enigma-profit-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-positive, #0F6B5C)" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="var(--chart-positive, #0F6B5C)" stopOpacity="0.015" />
                </linearGradient>
              </defs>
              {plotTicks.map((tick, index) => (
                <g key={index}>
                  <line
                    x1={PLOT.left}
                    x2={CHART_WIDTH - PLOT.right}
                    y1={tick.y}
                    y2={tick.y}
                    stroke={Math.abs(tick.value) < span / 100 ? 'var(--chart-neutral, #AAB6C2)' : 'var(--chart-grid, #E9EEF2)'}
                    strokeDasharray={Math.abs(tick.value) < span / 100 ? undefined : '3 5'}
                  />
                  <text x={PLOT.left - 8} y={tick.y + 4} textAnchor="end" fill="var(--chart-label, #8793A0)" fontSize="10">
                    {formatCurrencyBRL(tick.value)}
                  </text>
                </g>
              ))}
              <path d={areaPath} fill="url(#enigma-profit-area)" />
              <path d={linePath} fill="none" stroke="var(--chart-positive, #0F6B5C)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              {positioned.map((point, index) => (
                <g key={point.date}
                  tabIndex={0} role="button"
                  aria-label={point.label + ': ' + formatCurrencyBRL(point.plottedAmount, true) + '. Mostrar registros deste dia'}
                  aria-pressed={selectedDate === point.date}
                  onClick={() => setSelectedDate(point.date)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedDate(point.date); } }}
                  onMouseEnter={() => setFocusedPoint(index)} onMouseLeave={() => setFocusedPoint(null)}
                  onFocus={() => setFocusedPoint(index)} onBlur={() => setFocusedPoint(null)}
                  className="cursor-pointer focus:outline-none"
                >
                  <circle cx={point.x} cy={point.y} r="14" fill="transparent" stroke={focusedPoint === index ? "var(--chart-focus, #0F6B5C)" : "transparent"} />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={focusedPoint === index ? 5.5 : 4}
                    fill={point.plottedAmount >= 0 ? 'var(--chart-positive, #0F6B5C)' : 'var(--chart-negative, #B45309)'}
                    stroke="var(--chart-surface, white)"
                    strokeWidth="2"
                  >
                    <title>{`${point.label} · ${formatCurrencyBRL(point.amount, true)} · ${point.operations} operações`}</title>
                  </circle>
                </g>
              ))}
              {xLabels.map((point, index) => (
                <text
                  key={`${point.date}-${index}`}
                  x={point.x}
                  y={CHART_HEIGHT - 7}
                  textAnchor={index === 0 ? 'start' : index === xLabels.length - 1 ? 'end' : 'middle'}
                  fill="var(--chart-label, #8793A0)"
                  fontSize="10"
                >
                  {point.label}
                </text>
              ))}
            </svg>
            {activePoint && (
              <div
                className="pointer-events-none absolute z-10 rounded-[8px] bg-[#17212B] px-[10px] py-[7px] text-[11px] text-white shadow-lg"
                style={{
                  left: `${Math.max(12, Math.min(88, (activePoint.x / CHART_WIDTH) * 100))}%`,
                  top: `${Math.max(4, (activePoint.y / CHART_HEIGHT) * 100 - 3)}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <span className="block text-[#C5D0D8]">{activePoint.label} · {activePoint.operations} {activePoint.operations === 1 ? 'operação' : 'operações'}</span>
                <strong className="mt-[2px] block tabular-nums">{formatCurrencyBRL(activePoint.plottedAmount, true)}</strong>
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-[190px] flex-col items-center justify-center gap-[7px] rounded-[8px] bg-[#F7F9FA] px-[16px] text-center">
            <BarChart3 className="h-[18px] w-[18px] text-[#8B98A5]" strokeWidth={1.7} />
            <p className="m-0 text-[13px] font-medium text-[#475563]">Nenhuma operação liquidada neste intervalo</p>
            <p className="m-0 max-w-[390px] text-[11px] text-[#7B8794]">
              O gráfico aparece quando há operações concluídas com resultado registrado. Troque o período para consultar outros registros da demonstração.
            </p>
          </div>
        )}
      </div>

      {undatedCount > 0 && <p className="text-[11px] text-[#B45309]">{undatedCount} registros concluídos sem data válida de liquidação ficam fora deste gráfico.</p>}
      {selectedDate && <div className="mt-[10px] border-t border-[#E9EEF2] pt-[10px]">
        <div className="flex justify-between text-[12px] font-semibold text-[#475569]">
          <span>Registros de {selectedDate.split('-').reverse().join('/')}</span>
          <button type="button" onClick={() => setSelectedDate(null)} className="underline">Fechar detalhes</button>
        </div>
        {entries.filter((entry) => dailyPoints.find((point) => point.date === selectedDate)?.entryIds.includes(entry.id)).map((entry) => (
          <button key={entry.id} type="button" onClick={() => onOpenEntry(entry.id)} className="mt-[6px] flex w-full items-center justify-between gap-[12px] rounded-[7px] bg-[#F7F9FA] px-[10px] py-[8px] text-left text-[12px] text-[#17212B] hover:bg-[#EAF4F1]">
            <span className="truncate">{entry.event || 'Operação registrada'}</span><strong className="shrink-0 tabular-nums">{formatCurrencyBRL(evaluateBetEntry(entry).netProfit ?? 0, true)}</strong>
          </button>
        ))}
        {!dailyPoints.some((point) => point.date === selectedDate) && <p className="text-[11px] text-[#667484]">Sem registros deste dia no período selecionado.</p>}
      </div>}
      <div className="mt-[4px] flex flex-wrap items-center justify-between gap-[8px] border-t border-[#E9EEF2] pt-[12px]">
        <span className="text-[11px] text-[#667484]">
          {dailyPoints.reduce((sum, point) => sum + point.operations, 0)} registros liquidados
        </span>
        <span className={`inline-flex items-center gap-[4px] text-[13px] font-semibold tabular-nums ${totalProfit >= 0 ? 'text-[#0F6B5C]' : 'text-[#B45309]'}`}>
          {totalProfit >= 0 ? <ArrowUpRight className="h-[14px] w-[14px]" /> : <ArrowDownRight className="h-[14px] w-[14px]" />}
          {formatCurrencyBRL(totalProfit, true)}
        </span>
      </div>
    </section>
  );
}

function CapitalAllocation({ summary, onNavigate }: Pick<Props, 'summary' | 'onNavigate'>) {
  const categories = [
    { label: 'Nas casas', amount: summary.availableInHouses, color: '#0F6B5C', screen: 'saldos' as const },
    { label: 'Carteiras e corretoras', amount: summary.totalBankBalances, color: '#334155', screen: 'parcerias' as const },
    { label: 'Em operações abertas', amount: summary.reservedInOpenBets, color: '#94A3B8', screen: 'entradas' as const },
    { label: 'Em saques', amount: summary.inTransitWithdrawals, color: '#B45309', screen: 'saques' as const },
  ];
  const total = summary.totalGlobalCapital;
  let cursor = 0;
  const stops = categories
    .filter((category) => category.amount > 0 && total > 0)
    .map((category) => {
      const start = cursor;
      cursor += (category.amount / total) * 100;
      return `${category.color} ${start}% ${cursor}%`;
    });

  return (
    <section className="min-w-0 rounded-[12px] border border-[#D8E0E8] bg-white p-[18px] sm:p-[22px]">
      <div>
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-[#17212B]">Onde está o capital</h2>
        <p className="mb-0 mt-[4px] text-[12px] text-[#667484]">Distribuição dos saldos registrados na operação.</p>
      </div>

      {total > 0 ? (
        <>
          <div className="mt-[18px] flex items-center justify-center">
            <div
              className="relative grid h-[164px] w-[164px] place-items-center rounded-full"
              role="img"
              aria-label={`Distribuição de capital: ${categories.map((item) => `${item.label} ${Math.round((item.amount / total) * 100)} por cento`).join(', ')}`}
              style={{ background: stops.length ? `conic-gradient(${stops.join(', ')})` : '#E9EEF2' }}
            >
              <div className="grid h-[116px] w-[116px] content-center justify-items-center rounded-full bg-white text-center">
                <span className="text-[10px] font-medium text-[#7B8794]">Capital global</span>
                <strong className="mt-[3px] text-[16px] font-bold tabular-nums tracking-[-0.03em] text-[#17212B]">
                  {formatCurrencyBRL(total)}
                </strong>
              </div>
            </div>
          </div>
          <div className="mt-[14px] grid grid-cols-1 gap-[2px]">
            {categories.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.screen)}
                className="group flex items-center justify-between gap-[10px] rounded-[7px] px-[7px] py-[7px] text-left hover:bg-[#F7F9FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0F6B5C]"
                aria-label={`Abrir ${item.label}: ${formatCurrencyBRL(item.amount)}`}
              >
                <span className="flex min-w-0 items-center gap-[8px] text-[11px] text-[#5C6875] group-hover:text-[#17212B]">
                  <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 text-right">
                  <strong className="block text-[11px] font-semibold tabular-nums text-[#17212B]">{formatCurrencyBRL(item.amount)}</strong>
                  <span className="block text-[10px] tabular-nums text-[#8793A0]">{Math.round((item.amount / total) * 100)}%</span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-[18px] flex min-h-[260px] items-center justify-center rounded-[8px] bg-[#F7F9FA] px-[18px] text-center text-[12px] text-[#7B8794]">
          Ainda não há saldos registrados para distribuir.
        </div>
      )}
      <p className="mb-0 mt-[10px] border-t border-[#E9EEF2] pt-[10px] text-[10px] leading-[1.5] text-[#8793A0]">
        Selecione uma categoria para abrir os registros correspondentes.
      </p>
    </section>
  );
}

export const OperationalAnalytics: React.FC<Props> = (props) => (
  <div className="grid grid-cols-1 items-stretch gap-[16px] xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
    <ProfitTrend
      entries={props.entries}
      undatedCount={props.undatedCount}
      onOpenEntry={props.onOpenEntry}
      periodLabel={props.periodLabel}
      activePreset={props.activePreset}
      onPeriodChange={props.onPeriodChange}
    />
    <CapitalAllocation summary={props.summary} onNavigate={props.onNavigate} />
  </div>
);
