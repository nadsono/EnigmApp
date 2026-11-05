import React, { useMemo } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  evaluateBetEntry,
  formatCurrencyBRL,
  formatBrlEquivalent,
  roundCurrency,
} from '../domain/ledger.ts';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseEntryDate(value: string): Date | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export const MinhaPerformanceScreen: React.FC = () => {
  const {
    currentUser,
    allCosts,
    allEntries,
    operationalMonthYearLabel,
    setActiveScreen,
  } = useEnigma();

  const activeOperatorId = currentUser.id === 'op_b' ? 'op_b' : 'op_a';

  const stats = useMemo(() => {
    const activeCosts = allCosts.filter((c) => !c.reversed);
    const opACosts = roundCurrency(
      activeCosts
        .filter((c) => c.operatorId === 'op_a')
        .reduce((s, c) => s + c.amount, 0)
    );
    const opBCosts = roundCurrency(
      activeCosts
        .filter((c) => c.operatorId === 'op_b')
        .reduce((s, c) => s + c.amount, 0)
    );

    const opAEntries = allEntries.filter(
      (e) => e.operatorId === 'op_a' && e.resultStatus === 'concluida'
    );
    const opBEntries = allEntries.filter(
      (e) => e.operatorId === 'op_b' && e.resultStatus === 'concluida'
    );

    const opAEvaluations = opAEntries.map(evaluateBetEntry);
    const opBEvaluations = opBEntries.map(evaluateBetEntry);
    const opABruto = roundCurrency(
      opAEvaluations.reduce((sum, evaluation) => sum + (evaluation.netProfit || 0), 0)
    );
    const opBBruto = roundCurrency(
      opBEvaluations.reduce((sum, evaluation) => sum + (evaluation.netProfit || 0), 0)
    );
    const opAInvested = roundCurrency(
      opAEvaluations.reduce((sum, evaluation) => sum + evaluation.totalStake, 0)
    );
    const opBInvested = roundCurrency(
      opBEvaluations.reduce((sum, evaluation) => sum + evaluation.totalStake, 0)
    );
    const opACustosFinal = opACosts;
    const opBCustosFinal = opBCosts;
    const opALiq = roundCurrency(opABruto - opACustosFinal);
    const opBLiq = roundCurrency(opBBruto - opBCustosFinal);

    const opACount = opAEntries.length;
    const opBCount = opBEntries.length;
    const avgCount = Math.round((opACount + opBCount) / 2);
    const opARoi = opAInvested > 0 ? roundCurrency((opALiq / opAInvested) * 100) : 0;
    const opBRoi = opBInvested > 0 ? roundCurrency((opBLiq / opBInvested) * 100) : 0;
    const combinedInvested = opAInvested + opBInvested;
    const avgRoi =
      combinedInvested > 0
        ? roundCurrency(((opALiq + opBLiq) / combinedInvested) * 100)
        : 0;

    const myBruto = activeOperatorId === 'op_b' ? opBBruto : opABruto;
    const myCustos = activeOperatorId === 'op_b' ? opBCustosFinal : opACustosFinal;
    const myLiquido = activeOperatorId === 'op_b' ? opBLiq : opALiq;
    const myShare = roundCurrency(myLiquido * 0.5);
    const myRank =
      opALiq === opBLiq
        ? 'Empate'
        : (activeOperatorId === 'op_b' ? opBLiq > opALiq : opALiq > opBLiq)
        ? '1º de 2'
        : '2º de 2';

    const avgLiq = roundCurrency((opALiq + opBLiq) / 2);

    return {
      myBruto,
      myCustos,
      myLiquido,
      myShare,
      myRank,
      opALiq,
      opBLiq,
      avgLiq,
      opARoi,
      opBRoi,
      avgRoi,
      opACount,
      opBCount,
      avgCount,
    };
  }, [allCosts, allEntries, activeOperatorId]);

  const weeklyBars = useMemo(() => {
    const totals = Array.from({ length: 7 }, () => 0);
    allEntries
      .filter((entry) => entry.operatorId === activeOperatorId && entry.resultStatus === 'concluida')
      .forEach((entry) => {
        const date = parseEntryDate(entry.createdAt);
        if (!date) return;
        const result = evaluateBetEntry(entry).netProfit || 0;
        totals[date.getDay()] += result;
      });

    const maxAbs = Math.max(...totals.map(Math.abs), 0);
    return WEEKDAY_LABELS.map((day, index) => ({
      day,
      value: roundCurrency(totals[index]),
      h: maxAbs > 0 ? Math.max(3, (Math.abs(totals[index]) / maxAbs) * 64) : 0,
    }));
  }, [allEntries, activeOperatorId]);

  const comparisonMax = Math.max(Math.abs(stats.myLiquido), Math.abs(stats.avgLiq), 1);
  const opAPosition =
    stats.opALiq === stats.opBLiq ? '—' : stats.opALiq > stats.opBLiq ? '1º' : '2º';
  const opBPosition =
    stats.opALiq === stats.opBLiq ? '—' : stats.opBLiq > stats.opALiq ? '1º' : '2º';

  return (
    <div
      className="flex flex-col justify-between gap-[28px]"
      style={{ minHeight: 'min(calc(100svh - 126px), 1040px)' }}
    >
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 text-[26px] font-semibold">Minha performance</h1>
          <div className="text-[#66716C]">
            Resultados do período e comparação com a equipe.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <span className="px-[10px] py-[6px] rounded-full border border-[#CBD5E1] bg-[#F8FAFC] text-[#475569] text-[11px] font-medium">
            Dados de demonstração
          </span>
          <button
            type="button"
            onClick={() => setActiveScreen('configuracoes')}
            title="Alterar Período Operacional em Configurações"
            className="px-[12px] py-[6px] rounded-full bg-[#E3F1EE] text-[#0B4F44] text-[12px] font-semibold hover:bg-[#CFE6DF] transition-colors cursor-pointer"
          >
            Período: {operationalMonthYearLabel}
          </button>
        </div>
      </div>

      {/* Indicadores do período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[16px]">
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[20px] shadow-xs flex flex-col justify-between min-h-[112px]">
          <div className="text-[12px] text-[#64748B] font-medium">Resultado das entradas</div>
          <div>
            <div className="text-[20px] font-bold tabular-nums text-[#0F172A]">
              {formatCurrencyBRL(stats.myBruto, true)}
            </div>
            <div className="text-[11px] text-[#64748B] tabular-nums font-medium mt-[2px]">
              ≈ {formatBrlEquivalent(stats.myBruto)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[20px] shadow-xs flex flex-col justify-between min-h-[112px]">
          <div className="text-[12px] text-[#64748B] font-medium">Custos registrados</div>
          <div>
            <div className="text-[20px] font-bold text-[#DC2626] tabular-nums">
              − {formatCurrencyBRL(stats.myCustos)}
            </div>
            <div className="text-[11px] text-[#B91C1C] tabular-nums font-medium mt-[2px]">
              ≈ − {formatBrlEquivalent(stats.myCustos)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[20px] shadow-xs flex flex-col justify-between min-h-[112px]">
          <div className="text-[12px] text-[#64748B] font-medium">Resultado líquido</div>
          <div>
            <div
              className={`text-[20px] font-bold tabular-nums ${
                stats.myLiquido < 0 ? 'text-[#DC2626]' : 'text-[#15803D]'
              }`}
            >
              {formatCurrencyBRL(stats.myLiquido, true)}
            </div>
            <div
              className={`text-[11px] tabular-nums font-medium mt-[2px] ${
                stats.myLiquido < 0 ? 'text-[#B91C1C]' : 'text-[#16A34A]'
              }`}
            >
              ≈ {formatBrlEquivalent(stats.myLiquido)}
            </div>
          </div>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-[12px] p-[20px] text-white shadow-xs flex flex-col justify-between min-h-[112px]">
          <div className="text-[12px] text-[#94A3B8]">Minha participação (50%)</div>
          <div>
            <div className="text-[20px] font-bold tabular-nums text-white">
              {stats.myLiquido <= 0 ? '0,00 USDT' : formatCurrencyBRL(stats.myShare)}
            </div>
            <div className="text-[11px] text-[#94A3B8] tabular-nums font-medium mt-[2px]">
              ≈ {stats.myLiquido <= 0 ? 'R$ 0,00' : formatBrlEquivalent(stats.myShare)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[20px] shadow-xs flex flex-col justify-between min-h-[112px]">
          <div className="text-[12px] text-[#64748B] font-medium">Posição na equipe</div>
          <div className="text-[20px] font-bold text-[#0F6B5C]">{stats.myRank}</div>
        </div>
      </div>

      {/* Gráficos: Meu líquido no mês x média da equipe + Lucro por dia da semana */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)] gap-[24px] items-stretch">
        <section className="min-w-0 w-full bg-white border border-[#E1E5E1] rounded-[14px] px-[24px] py-[22px] flex flex-col gap-[16px]">
          <div className="flex flex-wrap justify-between items-center gap-[8px]">
            <div>
              <div className="text-[16px] font-semibold text-[#0F172A]">
                Resultado líquido x média da equipe (USDT)
              </div>
              <div className="text-[12px] text-[#64748B] mt-[4px]">
                Resultado líquido no período {operationalMonthYearLabel}
              </div>
            </div>
          </div>

          <div
            className="flex flex-col gap-[22px] pt-[4px]"
            role="img"
            aria-label="Comparação do resultado líquido pessoal com a média da equipe; valores negativos ficam à esquerda do zero"
          >
            {[
              { label: 'Meu resultado', value: stats.myLiquido, color: '#0F6B5C' },
              { label: 'Média da equipe', value: stats.avgLiq, color: '#64748B' },
            ].map((item) => {
              const width = (Math.abs(item.value) / comparisonMax) * 50;
              const left = item.value < 0 ? 50 - width : 50;
              return (
                <div key={item.label}>
                  <div className="mb-[8px] flex items-center justify-between gap-[12px] text-[13px]">
                    <span className="font-medium text-[#475569]">{item.label}</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        item.value < 0 ? 'text-[#B91C1C]' : 'text-[#0F172A]'
                      }`}
                    >
                      {formatCurrencyBRL(item.value, true)}
                    </span>
                  </div>
                  <div className="relative h-[22px] rounded-[6px] bg-[#F1F5F9]">
                    <span className="absolute left-1/2 top-0 h-full w-px bg-[#94A3B8]" />
                    <span
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: item.value < 0 ? '#B91C1C' : item.color,
                      }}
                      className="absolute top-0 h-full rounded-[6px]"
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-[11px] text-[#64748B]">
              <span>Prejuízo</span>
              <span>0</span>
              <span>Lucro</span>
            </div>
          </div>
        </section>

        <section className="w-full bg-white border border-[#E1E5E1] rounded-[14px] px-[24px] py-[22px] flex flex-col gap-[16px]">
          <div>
            <div className="text-[16px] font-semibold">Resultado por dia da semana</div>
            <div className="mt-[4px] text-[12px] text-[#64748B]">
              Entradas concluídas · passe sobre uma coluna para ver o valor
            </div>
          </div>
          {weeklyBars.some((bar) => bar.value !== 0) ? (
            <div
              className="grid grid-cols-7 gap-[8px] pt-[4px]"
              role="img"
              aria-label="Resultado líquido das entradas concluídas por dia da semana"
            >
              {weeklyBars.map((bar) => (
                <div key={bar.day} className="flex min-w-0 flex-col items-center gap-[8px]">
                  <div className="relative h-[156px] w-full" title={`${bar.day}: ${formatCurrencyBRL(bar.value)}`}>
                    <span className="absolute left-0 top-1/2 h-px w-full bg-[#CBD5E1]" />
                    {bar.value !== 0 && (
                      <span
                        aria-label={`${bar.day}: ${formatCurrencyBRL(bar.value)}`}
                        style={{
                          height: `${bar.h}px`,
                          top: bar.value > 0 ? `calc(50% - ${bar.h}px)` : '50%',
                        }}
                        className={`absolute left-1/4 w-1/2 rounded-[4px] ${
                          bar.value < 0 ? 'bg-[#B91C1C]' : 'bg-[#0F6B5C]'
                        }`}
                      />
                    )}
                  </div>
                  <span className="text-[11px] text-[#66716C]">{bar.day}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[156px] items-center justify-center rounded-[8px] bg-[#F8FAFC] px-[16px] text-center text-[13px] text-[#64748B]">
              Nenhuma entrada concluída neste período.
            </div>
          )}
        </section>
      </div>

      {/* Comparativo da equipe (restrito ao autorizado pelo perfil) */}
      <section className="bg-white border border-[#E1E5E1] rounded-[14px] px-[24px] py-[22px] flex flex-col gap-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-[8px]">
          <div className="text-[16px] font-semibold text-[#0F172A]">
            Comparativo da equipe ({operationalMonthYearLabel})
          </div>
          <div className="text-[11.5px] text-[#64748B]">
            Valores em USDT · equivalentes em reais para demonstração
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[#66716C] text-[12px]">
                <th className="py-[6px] px-[8px] font-medium">Posição</th>
                <th className="py-[6px] px-[8px] font-medium">Operador</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Líquido (USDT)</th>
                <th className="py-[6px] px-[8px] font-medium text-right">ROI</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Entradas</th>
                <th className="py-[6px] px-[8px] font-medium text-right">
                  Líquido médio por entrada
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                className={`border-t border-[#EEF1EE] ${
                  activeOperatorId === 'op_a' ? 'bg-[#E3F1EE]' : ''
                }`}
              >
                <td className="py-[10px] px-[8px] font-semibold">{opAPosition}</td>
                <td className="py-[10px] px-[8px] font-semibold">
                  Operador A {activeOperatorId === 'op_a' ? '(você)' : ''}
                </td>
                <td className="py-[10px] px-[8px] text-right font-semibold tabular-nums">
                  <div className={stats.opALiq < 0 ? 'text-[#DC2626]' : 'text-[#15803D]'}>
                    {formatCurrencyBRL(stats.opALiq)}
                  </div>
                  <div className="text-[10px] text-[#64748B] font-normal">
                    ≈ {formatBrlEquivalent(stats.opALiq)}
                  </div>
                </td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">{formatPercent(stats.opARoi)}</td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">
                  {stats.opACount}
                </td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">
                  {stats.opACount > 0 ? (
                    <>
                      <div className="font-medium text-[#0F172A]">
                        {formatCurrencyBRL(roundCurrency(stats.opALiq / stats.opACount), true)}
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        ≈ {formatBrlEquivalent(roundCurrency(stats.opALiq / stats.opACount))}
                      </div>
                    </>
                  ) : (
                    <span className="text-[#94A3B8]">—</span>
                  )}
                </td>
              </tr>
              <tr
                className={`border-t border-[#EEF1EE] ${
                  activeOperatorId === 'op_b' ? 'bg-[#E3F1EE]' : ''
                }`}
              >
                <td className="py-[10px] px-[8px]">{opBPosition}</td>
                <td className="py-[10px] px-[8px]">
                  Operador B {activeOperatorId === 'op_b' ? '(você)' : ''}
                </td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">
                  <div className={stats.opBLiq < 0 ? 'text-[#DC2626] font-semibold' : 'text-[#0F172A]'}>
                    {formatCurrencyBRL(stats.opBLiq)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    ≈ {formatBrlEquivalent(stats.opBLiq)}
                  </div>
                </td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">{formatPercent(stats.opBRoi)}</td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">
                  {stats.opBCount}
                </td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">
                  {stats.opBCount > 0 ? (
                    <>
                      <div className="font-medium text-[#0F172A]">
                        {formatCurrencyBRL(roundCurrency(stats.opBLiq / stats.opBCount), true)}
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        ≈ {formatBrlEquivalent(roundCurrency(stats.opBLiq / stats.opBCount))}
                      </div>
                    </>
                  ) : (
                    <span className="text-[#94A3B8]">—</span>
                  )}
                </td>
              </tr>
              <tr className="border-t border-[#EEF1EE] text-[#66716C]">
                <td className="py-[10px] px-[8px]">—</td>
                <td className="py-[10px] px-[8px]">Média dos operadores</td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">
                  <div className="font-semibold text-[#0F172A]">{formatCurrencyBRL(stats.avgLiq)}</div>
                  <div className="text-[10px] text-[#64748B]">
                    ≈ {formatBrlEquivalent(stats.avgLiq)}
                  </div>
                </td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">{formatPercent(stats.avgRoi)}</td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">
                  {stats.avgCount}
                </td>
                <td className="py-[10px] px-[8px] text-right tabular-nums">
                  {stats.opACount + stats.opBCount > 0 ? (
                    <>
                      <div className="font-medium text-[#0F172A]">
                        {formatCurrencyBRL(
                          roundCurrency((stats.opALiq + stats.opBLiq) / (stats.opACount + stats.opBCount)),
                          true
                        )}
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        ≈{' '}
                        {formatBrlEquivalent(
                          roundCurrency((stats.opALiq + stats.opBLiq) / (stats.opACount + stats.opBCount))
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-[#94A3B8]">—</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-[6px] text-[12px] text-[#66716C]">
          <span>ROI = resultado líquido dividido pelo capital investido.</span>
          <span>Você vê o resultado, ROI e volume da equipe. Pagamentos, custos individuais e saldos de outras pessoas ficam restritos aos administradores.</span>
        </div>
      </section>
    </div>
  );
};
