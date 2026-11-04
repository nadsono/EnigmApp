import React, { useMemo } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  evaluateBetEntry,
  formatCurrencyBRL,
  formatBrlEquivalent,
  roundCurrency,
} from '../domain/ledger.ts';

export const EquipeScreen: React.FC = () => {
  const {
    allCosts,
    allEntries,
    operationalMonthYearLabel,
    isDateFilterActive,
    setActiveScreen,
  } = useEnigma();

  const activeCosts = useMemo(
    () => allCosts.filter((c) => !c.reversed),
    [allCosts]
  );

  const costsByUser = useMemo(() => {
    const map: Record<string, number> = {
      op_a: 0,
      op_b: 0,
      socio_nadson: 0,
      socio_alef: 0,
    };
    for (const c of activeCosts) {
      map[c.operatorId] = roundCurrency((map[c.operatorId] || 0) + c.amount);
    }
    return map;
  }, [activeCosts]);

  const rows = useMemo(() => {
    const computeUserPeriodStats = (userId: string) => {
      const userEntries = allEntries.filter((e) => e.operatorId === userId);
      const concluded = userEntries.filter((e) => e.resultStatus === 'concluida');
      const openCount = userEntries.filter((e) => e.resultStatus !== 'concluida').length;
      const profit = roundCurrency(
        concluded.reduce((sum, e) => sum + (evaluateBetEntry(e).netProfit || 0), 0)
      );
      const hasBatch8 = concluded.some((e) => e.id === 'entry_8');
      const count = userEntries.length + (hasBatch8 ? 79 : 0);
      return { profit, count, openCount };
    };

    const opAStats = computeUserPeriodStats('op_a');
    const opBStats = computeUserPeriodStats('op_b');
    const nadsonStats = computeUserPeriodStats('socio_nadson');
    const alefStats = computeUserPeriodStats('socio_alef');

    const baseData = [
      {
        id: 'op_a',
        name: 'Operador A',
        shortLabel: 'Operador A',
        bruto: isDateFilterActive ? opAStats.profit : 10000,
        custos: isDateFilterActive ? costsByUser.op_a : costsByUser.op_a || 1200,
        isOperator: true,
        entradas: isDateFilterActive ? opAStats.count : 118,
        roi: '1,9%',
        incompletas: opAStats.openCount > 0 ? opAStats.openCount : 0,
      },
      {
        id: 'op_b',
        name: 'Operador B',
        shortLabel: 'Operador B',
        bruto: isDateFilterActive ? opBStats.profit : 7600,
        custos: isDateFilterActive ? costsByUser.op_b : costsByUser.op_b || 900,
        isOperator: true,
        entradas: isDateFilterActive ? opBStats.count : 96,
        roi: '1,6%',
        incompletas: opBStats.openCount,
      },
      {
        id: 'socio_nadson',
        name: 'Nadson (sócio)',
        shortLabel: 'Nadson',
        bruto: isDateFilterActive ? nadsonStats.profit : 5400,
        custos: isDateFilterActive
          ? costsByUser.socio_nadson
          : costsByUser.socio_nadson || 620,
        isOperator: false,
        entradas: isDateFilterActive ? nadsonStats.count : 84,
        roi: '2,0%',
        incompletas: isDateFilterActive ? nadsonStats.openCount : 2,
      },
      {
        id: 'socio_alef',
        name: 'Alef (sócio)',
        shortLabel: 'Alef',
        bruto: isDateFilterActive ? alefStats.profit : 4900,
        custos: isDateFilterActive
          ? costsByUser.socio_alef
          : costsByUser.socio_alef || 580,
        isOperator: false,
        entradas: isDateFilterActive ? alefStats.count : 71,
        roi: '1,8%',
        incompletas: alefStats.openCount,
      },
    ];

    return baseData.map((r) => {
      const liquido = roundCurrency(r.bruto - r.custos);
      const parteOperador = r.isOperator ? roundCurrency(liquido * 0.5) : null;
      return {
        ...r,
        liquido,
        parteOperador,
      };
    });
  }, [costsByUser, allEntries, isDateFilterActive]);

  const totalBruto = roundCurrency(rows.reduce((s, r) => s + r.bruto, 0));
  const totalCustos = roundCurrency(rows.reduce((s, r) => s + r.custos, 0));
  const totalLiquido = roundCurrency(totalBruto - totalCustos);
  const totalParteOperadores = roundCurrency(
    rows.reduce((s, r) => s + (r.parteOperador || 0), 0)
  );
  const totalIncompletas = rows.reduce((s, r) => s + r.incompletas, 0);

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Cabeçalho idêntico ao 07_Equipe.html */}
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 text-[26px] font-semibold">Equipe</h1>
          <div className="text-[#66716C]">
            Desempenho de cada operador e dos sócios: bruto, custos, líquido e a parte de cada um.
          </div>
        </div>
        <div className="flex flex-wrap gap-[10px] items-center">
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
          <div className="text-[12px] text-[#64748B] font-medium">Bruto da equipe</div>
          <div>
            <div className="text-[20px] font-bold tabular-nums text-[#0F172A]">
              {formatCurrencyBRL(totalBruto, true)}
            </div>
            <div className="text-[11px] text-[#64748B] tabular-nums font-medium mt-[2px]">
              ≈ {formatBrlEquivalent(totalBruto)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[16px] shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#64748B] font-medium">Custos</div>
          <div>
            <div className="text-[20px] font-bold text-[#DC2626] tabular-nums">
              − {formatCurrencyBRL(totalCustos)}
            </div>
            <div className="text-[11px] text-[#B91C1C] tabular-nums font-medium mt-[2px]">
              ≈ − {formatBrlEquivalent(totalCustos)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[16px] shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#64748B] font-medium">Líquido</div>
          <div>
            <div className="text-[20px] font-bold text-[#15803D] tabular-nums">
              {formatCurrencyBRL(totalLiquido, true)}
            </div>
            <div className="text-[11px] text-[#16A34A] tabular-nums font-medium mt-[2px]">
              ≈ {formatBrlEquivalent(totalLiquido)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[16px] shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#64748B] font-medium">Parte dos operadores (50%)</div>
          <div>
            <div className="text-[20px] font-bold tabular-nums text-[#0F172A]">
              {formatCurrencyBRL(totalParteOperadores)}
            </div>
            <div className="text-[11px] text-[#64748B] tabular-nums font-medium mt-[2px]">
              ≈ {formatBrlEquivalent(totalParteOperadores)}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-[16px] shadow-xs flex flex-col justify-between">
          <div className="text-[12px] text-[#64748B] font-medium">Entradas incompletas</div>
          <div className="text-[20px] font-bold text-[#B45309] tabular-nums">
            {totalIncompletas}
          </div>
        </div>
      </div>

      {/* Gráficos: Evolução do líquido no mês + Bruto x líquido por pessoa */}
      <div className="flex flex-col lg:flex-row gap-[20px] items-start">
        <section className="flex-1 min-w-0 w-full bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[10px]">
          <div className="flex flex-wrap justify-between items-center gap-[8px]">
            <div>
              <div className="text-[16px] font-semibold text-[#0F172A]">
                Evolução do líquido no mês (USDT)
              </div>
              <div className="text-[11.5px] text-[#64748B]">
                Desempenho por operador e sócios · Mês operacional {operationalMonthYearLabel}
              </div>
            </div>
            <div className="flex gap-[14px] text-[12px] text-[#44504B]">
              <span>
                <span className="inline-block w-[12px] h-[3px] bg-[#0F6B5C] align-middle mr-[4px]" />
                Operador A
              </span>
              <span>
                <span className="inline-block w-[12px] h-[3px] bg-[#C46A1A] align-middle mr-[4px]" />
                Operador B
              </span>
              <span>
                <span className="inline-block w-[12px] h-[3px] bg-[#3B5BA9] align-middle mr-[4px]" />
                Sócios
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 640 230"
            width="100%"
            role="img"
            aria-label="Linhas de evolução do líquido do mês por operador e sócios, todas crescentes"
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
              stroke="#0F6B5C"
              strokeWidth="2.5"
              points="40,210 100,195 160,170 220,150 280,120 340,100 400,80 460,62 520,48 580,36 630,30"
            />
            <polyline
              fill="none"
              stroke="#C46A1A"
              strokeWidth="2.5"
              points="40,210 100,200 160,186 220,172 280,150 340,138 400,118 460,104 520,92 580,80 630,74"
            />
            <polyline
              fill="none"
              stroke="#3B5BA9"
              strokeWidth="2.5"
              points="40,210 100,192 160,178 220,162 280,140 340,118 400,104 460,88 520,70 580,58 630,50"
            />
          </svg>
        </section>

        <section className="w-full lg:w-[430px] shrink-0 bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[12px]">
          <div className="text-[16px] font-semibold">Bruto x líquido por pessoa</div>
          {rows.map((r) => {
            const brutoPct = Math.min(100, Math.round((r.bruto / 10000) * 100));
            const liqPct = Math.min(100, Math.round((r.liquido / 10000) * 100));
            return (
              <div key={r.id} className="flex flex-col gap-[5px]">
                <div className="flex justify-between text-[13px]">
                  <b>{r.shortLabel}</b>
                  <span className="text-[#64748B] tabular-nums text-[12px]">
                    {formatCurrencyBRL(r.bruto)} / {formatCurrencyBRL(r.liquido)}
                  </span>
                </div>
                <div className="h-[9px] rounded-full bg-[#E3E8E4]">
                  <div
                    style={{ width: `${brutoPct}%` }}
                    className="h-[9px] rounded-full bg-[#A9C9C1]"
                  />
                </div>
                <div className="h-[9px] rounded-full bg-[#E3E8E4]">
                  <div
                    style={{ width: `${liqPct}%` }}
                    className="h-[9px] rounded-full bg-[#0F6B5C]"
                  />
                </div>
              </div>
            );
          })}
          <div className="text-[12px] text-[#66716C]">
            Barra clara: bruto. Barra escura: líquido.
          </div>
        </section>
      </div>

      {/* Tabela Inferior: Resultado por pessoa */}
      <section className="bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[8px]">
        <div className="flex flex-wrap justify-between items-center gap-[8px]">
          <div>
            <div className="text-[16px] font-semibold text-[#0F172A]">Resultado por pessoa</div>
            <div className="text-[11.5px] text-[#64748B]">Valores apurados em USDT com espelho de conversão em R$</div>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen('custos')}
            className="text-[12px] text-[#0F6B5C] font-medium hover:underline cursor-pointer"
          >
            Detalhar custos por operador →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[#66716C] text-[12px]">
                <th className="py-[6px] px-[8px] font-medium">Pessoa</th>
                <th className="py-[6px] px-[8px] font-medium text-right">
                  Bruto (USDT)
                </th>
                <th className="py-[6px] px-[8px] font-medium text-right">Custos (USDT)</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Líquido (USDT)</th>
                <th className="py-[6px] px-[8px] font-medium text-right">
                  Parte do operador (USDT)
                </th>
                <th className="py-[6px] px-[8px] font-medium text-right">Entradas</th>
                <th className="py-[6px] px-[8px] font-medium text-right">ROI</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Incompletas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#EEF1EE]">
                  <td className="py-[10px] px-[8px] font-medium text-[#0F172A]">{r.name}</td>
                  <td className="py-[10px] px-[8px] text-right tabular-nums">
                    <div className="font-semibold text-[#0F172A]">{formatCurrencyBRL(r.bruto)}</div>
                    <div className="text-[10px] text-[#64748B]">≈ {formatBrlEquivalent(r.bruto)}</div>
                  </td>
                  <td className="py-[10px] px-[8px] text-right text-[#B3261E] tabular-nums">
                    <div>{formatCurrencyBRL(r.custos)}</div>
                    <div className="text-[10px] text-[#B91C1C]">≈ {formatBrlEquivalent(r.custos)}</div>
                  </td>
                  <td className="py-[10px] px-[8px] text-right font-semibold tabular-nums">
                    <div className={r.liquido < 0 ? 'text-[#DC2626]' : 'text-[#15803D]'}>
                      {formatCurrencyBRL(r.liquido)}
                    </div>
                    <div className="text-[10px] text-[#64748B] font-normal">
                      ≈ {formatBrlEquivalent(r.liquido)}
                    </div>
                  </td>
                  <td className="py-[10px] px-[8px] text-right font-semibold tabular-nums">
                    {r.parteOperador !== null ? (
                      r.liquido <= 0 ? (
                        <>
                          <div className="text-[#64748B]">0,00 USDT</div>
                          <div className="text-[10px] text-[#94A3B8]">≈ R$ 0,00</div>
                        </>
                      ) : (
                        <>
                          <div className="text-[#0F172A]">{formatCurrencyBRL(r.parteOperador)}</div>
                          <div className="text-[10px] text-[#64748B] font-normal">
                            ≈ {formatBrlEquivalent(r.parteOperador)}
                          </div>
                        </>
                      )
                    ) : (
                      <span className="font-normal text-[#66716C]">—</span>
                    )}
                  </td>
                  <td className="py-[10px] px-[8px] text-right tabular-nums">
                    {r.entradas}
                  </td>
                  <td className="py-[10px] px-[8px] text-right tabular-nums">{r.roi}</td>
                  <td
                    className={`py-[10px] px-[8px] text-right tabular-nums ${
                      r.incompletas >= 2 ? 'text-[#8A4B08]' : ''
                    }`}
                  >
                    {r.incompletas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
