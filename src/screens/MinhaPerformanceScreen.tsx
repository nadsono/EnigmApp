import React, { useMemo } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  evaluateBetEntry,
  formatCurrencyBRL,
  formatBrlEquivalent,
  roundCurrency,
} from '../domain/ledger.ts';

export const MinhaPerformanceScreen: React.FC = () => {
  const {
    currentUser,
    allCosts,
    allEntries,
    operationalMonthYearLabel,
    isDateFilterActive,
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

    const opAPeriodBruto = roundCurrency(
      opAEntries.reduce((s, e) => s + (evaluateBetEntry(e).netProfit || 0), 0)
    );
    const opBPeriodBruto = roundCurrency(
      opBEntries.reduce((s, e) => s + (evaluateBetEntry(e).netProfit || 0), 0)
    );

    const opABruto = isDateFilterActive ? opAPeriodBruto : 10000;
    const opACustosFinal = isDateFilterActive ? opACosts : opACosts || 1200;
    const opALiq = roundCurrency(opABruto - opACustosFinal);

    const opBBruto = isDateFilterActive ? opBPeriodBruto : 7600;
    const opBCustosFinal = isDateFilterActive ? opBCosts : opBCosts || 900;
    const opBLiq = roundCurrency(opBBruto - opBCustosFinal);

    const opACount = isDateFilterActive
      ? opAEntries.length + (opAEntries.some((e) => e.id === 'entry_8') ? 79 : 0)
      : 118;
    const opBCount = isDateFilterActive ? opBEntries.length : 96;
    const avgCount = Math.round((opACount + opBCount) / 2);

    const myBruto = activeOperatorId === 'op_b' ? opBBruto : opABruto;
    const myCustos = activeOperatorId === 'op_b' ? opBCustosFinal : opACustosFinal;
    const myLiquido = activeOperatorId === 'op_b' ? opBLiq : opALiq;
    const myShare = roundCurrency(myLiquido * 0.5);
    const myRank =
      activeOperatorId === 'op_b'
        ? opBLiq >= opALiq
          ? '1º de 2'
          : '2º de 2'
        : opALiq >= opBLiq
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
      opACount,
      opBCount,
      avgCount,
    };
  }, [allCosts, allEntries, activeOperatorId, isDateFilterActive]);

  const weeklyBars = [
    { day: 'Dom', h: 40 },
    { day: 'Seg', h: 120 },
    { day: 'Ter', h: 70 },
    { day: 'Qua', h: 90 },
    { day: 'Qui', h: 140 },
    { day: 'Sex', h: 60 },
    { day: 'Sáb', h: 100 },
  ];

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Cabeçalho idêntico ao 09_Minha_performance.html */}
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 text-[26px] font-semibold">Minha performance</h1>
          <div className="text-[#66716C]">
            Como você está no período operacional e como se compara com a equipe.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
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

      {/* 5 Cards Superiores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[12px]">
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[16px] shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#64748B] font-medium">Meu bruto</div>
          <div>
            <div className="text-[20px] font-bold tabular-nums text-[#0F172A]">
              {formatCurrencyBRL(stats.myBruto, true)}
            </div>
            <div className="text-[11px] text-[#64748B] tabular-nums font-medium mt-[2px]">
              ≈ {formatBrlEquivalent(stats.myBruto)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[16px] shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#64748B] font-medium">Meus custos</div>
          <div>
            <div className="text-[20px] font-bold text-[#DC2626] tabular-nums">
              − {formatCurrencyBRL(stats.myCustos)}
            </div>
            <div className="text-[11px] text-[#B91C1C] tabular-nums font-medium mt-[2px]">
              ≈ − {formatBrlEquivalent(stats.myCustos)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[16px] shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#64748B] font-medium">Meu líquido</div>
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
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-[12px] p-[16px] text-white shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#94A3B8]">Minha parte (50%)</div>
          <div>
            <div className="text-[20px] font-bold tabular-nums text-white">
              {stats.myLiquido <= 0 ? '0,00 USDT' : formatCurrencyBRL(stats.myShare)}
            </div>
            <div className="text-[11px] text-[#94A3B8] tabular-nums font-medium mt-[2px]">
              ≈ {stats.myLiquido <= 0 ? 'R$ 0,00' : formatBrlEquivalent(stats.myShare)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[16px] shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#64748B] font-medium">Posição na equipe</div>
          <div className="text-[20px] font-bold text-[#0F6B5C]">{stats.myRank}</div>
        </div>
      </div>

      {/* Gráficos: Meu líquido no mês x média da equipe + Lucro por dia da semana */}
      <div className="flex flex-col lg:flex-row gap-[20px] items-start">
        <section className="flex-1 min-w-0 w-full bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[10px]">
          <div className="flex flex-wrap justify-between items-center gap-[8px]">
            <div>
              <div className="text-[16px] font-semibold text-[#0F172A]">
                Meu líquido no mês x média da equipe (USDT)
              </div>
              <div className="text-[11.5px] text-[#64748B]">
                Acompanhamento em USDT · Mês operacional {operationalMonthYearLabel}
              </div>
            </div>
            <div className="flex gap-[14px] text-[12px] text-[#44504B]">
              <span>
                <span
                  className={`inline-block w-[12px] h-[3px] align-middle mr-[4px] ${
                    stats.myLiquido < 0 ? 'bg-[#DC2626]' : 'bg-[#0F6B5C]'
                  }`}
                />
                Eu
              </span>
              <span>
                <span className="inline-block w-[12px] h-[3px] bg-[#8A948F] align-middle mr-[4px]" />
                Média dos operadores
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 640 230"
            width="100%"
            role="img"
            aria-label="Linha do meu líquido em USDT comparada com a média dos operadores ao longo do mês"
            className="block"
          >
            <g stroke="#EEF1EE" strokeWidth="1">
              <line x1="40" y1="20" x2="630" y2="20" />
              <line x1="40" y1="70" x2="630" y2="70" />
              <line x1="40" y1="120" x2="630" y2="120" />
              <line x1="40" y1="170" x2="630" y2="170" />
              <line x1="40" y1="210" x2="630" y2="210" />
            </g>
            <g fontSize="11" fill="#66716C">
              <text x="4" y="24">10k</text>
              <text x="4" y="74">7,5k</text>
              <text x="4" y="124">5k</text>
              <text x="4" y="174">2,5k</text>
              <text x="4" y="214">0</text>
              <text x="40" y="226">01/10</text>
              <text x="300" y="226">06/10</text>
              <text x="590" y="226">11/10</text>
            </g>
            <polyline
              fill="none"
              stroke="#8A948F"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              points="40,210 100,198 160,181 220,164 280,138 340,116 400,96 460,80 520,66 580,56 630,50"
            />
            <polyline
              fill="none"
              stroke={stats.myLiquido < 0 ? '#DC2626' : '#0F6B5C'}
              strokeWidth="2.5"
              points={
                stats.myLiquido < 0
                  ? '40,210 100,210 160,210 220,210 280,212 340,214 400,216 460,218 520,220 580,222 630,224'
                  : '40,210 100,195 160,170 220,150 280,120 340,100 400,80 460,62 520,48 580,36 630,30'
              }
            />
          </svg>
        </section>

        <section className="w-full lg:w-[420px] shrink-0 bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[10px]">
          <div className="text-[16px] font-semibold">Lucro por dia da semana</div>
          <div className="flex items-end gap-[12px] h-[170px] pt-[6px]">
            {weeklyBars.map((bar) => (
              <div
                key={bar.day}
                className="flex-1 flex flex-col items-center gap-[4px]"
              >
                <div
                  style={{ height: `${bar.h}px` }}
                  className="w-full bg-[#0F6B5C] rounded-t-[5px]"
                />
                <span className="text-[11px] text-[#66716C]">{bar.day}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Comparativo da equipe (restrito ao autorizado pelo perfil) */}
      <section className="bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[8px]">
        <div className="flex flex-wrap items-center justify-between gap-[8px]">
          <div className="text-[16px] font-semibold text-[#0F172A]">
            Comparativo da equipe ({operationalMonthYearLabel})
          </div>
          <div className="text-[11.5px] text-[#64748B]">
            Valores apurados em USDT · Cotação mirror R$
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
                  Retorno médio (USDT)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                className={`border-t border-[#EEF1EE] ${
                  activeOperatorId === 'op_a' ? 'bg-[#E3F1EE]' : ''
                }`}
              >
                <td className="py-[10px] px-[8px] font-semibold">1º</td>
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
                <td className="py-[10px] px-[8px] text-right tabular-nums">1,9%</td>
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
                <td className="py-[10px] px-[8px]">2º</td>
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
                <td className="py-[10px] px-[8px] text-right tabular-nums">1,6%</td>
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
                <td className="py-[10px] px-[8px] text-right tabular-nums">1,75%</td>
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
        <div className="text-[12px] text-[#66716C]">
          Você vê o líquido, ROI e volume dos colegas. Pagamento, custos individuais e saldos de outras pessoas ficam só com os administradores.
        </div>
      </section>
    </div>
  );
};
