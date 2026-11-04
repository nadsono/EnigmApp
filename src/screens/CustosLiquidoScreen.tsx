import React, { useMemo, useState } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  evaluateBetEntry,
  formatCurrencyBRL,
  formatBrlEquivalent,
  parseCurrencyInput,
  roundCurrency,
} from '../domain/ledger.ts';
import type { CostCategory } from '../domain/types.ts';

const COST_CATEGORIES: CostCategory[] = [
  'Saques',
  'Criação de conta',
  'Novas parcerias',
  'Fintech',
  'Custos de operação',
  'Software',
];

export const CustosLiquidoScreen: React.FC = () => {
  const {
    currentUser,
    costs,
    entries,
    partnerships,
    withdrawals,
    operationalMonthYearLabel,
    isDateFilterActive,
    addManualCost,
    reverseCostRecord,
    setActiveScreen,
    usdtBrlRate,
  } = useEnigma();

  const isAdmin = currentUser.role === 'admin';
  const [selectedOperatorTab, setSelectedOperatorTab] = useState<'op_a' | 'op_b' | 'todos'>(
    currentUser.id === 'op_b' ? 'op_b' : 'op_a'
  );

  // Formulário Lançar Custo
  const [selectedCategory, setSelectedCategory] = useState<CostCategory>('Novas parcerias');
  const [costOperatorId, setCostOperatorId] = useState<string>(
    currentUser.role === 'operador' ? currentUser.id : 'op_a'
  );
  const [costAmountStr, setCostAmountStr] = useState<string>('200,00');
  const [costDateStr, setCostDateStr] = useState<string>('11/10/2026');
  const [costDetailStr, setCostDetailStr] = useState<string>('');
  const [costPartnershipId, setCostPartnershipId] = useState<string>('');

  const filteredCosts = useMemo(() => {
    if (!isAdmin) {
      return costs.filter((c) => c.operatorId === currentUser.id);
    }
    if (selectedOperatorTab === 'todos') {
      return costs;
    }
    return costs.filter((c) => c.operatorId === selectedOperatorTab);
  }, [costs, isAdmin, currentUser.id, selectedOperatorTab]);

  // Cálculo de Saldo inicial, Saldo final, Bruto, Custos, Líquido e Pagamento do operador (50%)
  const metrics = useMemo(() => {
    const activeTab = !isAdmin ? currentUser.id : selectedOperatorTab;
    const saldoInicial =
      activeTab === 'op_a' ? 20000 : activeTab === 'op_b' ? 18000 : 38000;

    // Se o filtro de período estiver ativo, calcula o bruto dinamicamente a partir das entradas do período
    const operatorEntries = entries.filter((e) => {
      if (e.resultStatus !== 'concluida') return false;
      if (activeTab === 'todos') return true;
      return e.operatorId === activeTab;
    });

    const periodEntriesBruto = roundCurrency(
      operatorEntries.reduce((sum, e) => sum + (evaluateBetEntry(e).netProfit || 0), 0)
    );

    const baseSaldoFinal =
      activeTab === 'op_a' ? 30000 : activeTab === 'op_b' ? 25600 : 55600;

    const bruto = isDateFilterActive
      ? periodEntriesBruto
      : roundCurrency(baseSaldoFinal - saldoInicial);
    const saldoFinal = roundCurrency(saldoInicial + bruto);

    const totalCustos = roundCurrency(
      filteredCosts.reduce((sum, c) => sum + c.amount, 0)
    );
    const liquido = roundCurrency(bruto - totalCustos);
    const pagamentoOperador = roundCurrency(liquido * 0.5);

    return {
      saldoInicial,
      saldoFinal,
      bruto,
      totalCustos,
      liquido,
      pagamentoOperador,
      titleLabel:
        activeTab === 'op_a'
          ? 'Operador A'
          : activeTab === 'op_b'
          ? 'Operador B'
          : 'Equipe (Operadores)',
    };
  }, [isAdmin, currentUser.id, selectedOperatorTab, filteredCosts, entries, isDateFilterActive]);

  // Custos agrupados por categoria para o card lateral direito
  const categoryBreakdown = useMemo(() => {
    const sums: Record<string, number> = {
      'Novas parcerias': 0,
      Software: 0,
      'Criação de conta': 0,
      'Custos de operação': 0,
      Fintech: 0,
      'Saques (faciais)': 0,
    };

    for (const c of filteredCosts) {
      if (c.category === 'Saques') {
        sums['Saques (faciais)'] = roundCurrency(
          sums['Saques (faciais)'] + c.amount
        );
      } else {
        sums[c.category] = roundCurrency((sums[c.category] || 0) + c.amount);
      }
    }

    return Object.entries(sums);
  }, [filteredCosts]);

  const withdrawalsWithoutFacial = withdrawals.filter(
    (w) => w.facialCosts.length === 0 && !w.noCostConfirmed
  );

  const handleLaunchCost = () => {
    const amount = parseCurrencyInput(costAmountStr) || 0;
    addManualCost({
      category: selectedCategory,
      operatorId: !isAdmin ? currentUser.id : costOperatorId,
      amount,
      date: costDateStr,
      detail: costDetailStr,
      partnershipId: costPartnershipId || null,
    });
    setCostDetailStr('');
  };

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Cabeçalho idêntico ao 08_Custos_e_liquido.html */}
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 text-[22px] font-bold text-[#0F172A] tracking-[-0.02em]">Custos e Líquido</h1>
          <div className="text-[13px] text-[#475569]">
            Custos lançados por operador. Saque e facial entram sozinhos; o resto você lança aqui.
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-[20px] items-start">
        {/* Seção Esquerda: Do bruto ao pagamento + Tabela Custos lançados */}
        <section className="flex-1 min-w-0 w-full bg-white border border-[#E1E5E1] rounded-[14px] p-[20px] flex flex-col gap-[14px]">
          <div className="flex flex-wrap justify-between items-center gap-[10px]">
            <div className="text-[16px] font-semibold">
              Do bruto ao pagamento: {metrics.titleLabel}
            </div>

            {isAdmin && (
              <div className="flex gap-[6px]">
                <button
                  type="button"
                  onClick={() => setSelectedOperatorTab('op_a')}
                  className={`px-[12px] py-[5px] rounded-full text-[12px] cursor-pointer ${
                    selectedOperatorTab === 'op_a'
                      ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                      : 'border border-[#DDE2DD] text-[#66716C]'
                  }`}
                >
                  Operador A
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOperatorTab('op_b')}
                  className={`px-[12px] py-[5px] rounded-full text-[12px] cursor-pointer ${
                    selectedOperatorTab === 'op_b'
                      ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                      : 'border border-[#DDE2DD] text-[#66716C]'
                  }`}
                >
                  Operador B
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOperatorTab('todos')}
                  className={`px-[12px] py-[5px] rounded-full text-[12px] cursor-pointer ${
                    selectedOperatorTab === 'todos'
                      ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                      : 'border border-[#DDE2DD] text-[#66716C]'
                  }`}
                >
                  Todos
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-[10px] items-stretch">
            <div className="p-[14px] rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
              <div className="text-[12px] text-[#64748B] font-medium">Saldo inicial</div>
              <div>
                <div className="text-[17px] font-bold tabular-nums text-[#0F172A]">
                  {formatCurrencyBRL(metrics.saldoInicial)}
                </div>
                <div className="text-[11px] text-[#64748B] tabular-nums font-medium mt-[2px]">
                  ≈ {formatBrlEquivalent(metrics.saldoInicial)}
                </div>
              </div>
            </div>

            <div className="p-[14px] rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
              <div className="text-[12px] text-[#64748B] font-medium">Saldo final</div>
              <div>
                <div className="text-[17px] font-bold tabular-nums text-[#0F172A]">
                  {formatCurrencyBRL(metrics.saldoFinal)}
                </div>
                <div className="text-[11px] text-[#64748B] tabular-nums font-medium mt-[2px]">
                  ≈ {formatBrlEquivalent(metrics.saldoFinal)}
                </div>
              </div>
            </div>

            <div className="p-[14px] rounded-[10px] bg-[#ECFDF5] border border-[#BBF7D0] shadow-xs flex flex-col justify-between">
              <div className="text-[12px] text-[#065F46] font-medium">Bruto</div>
              <div>
                <div className="text-[17px] font-bold tabular-nums text-[#065F46]">
                  {formatCurrencyBRL(metrics.bruto, true)}
                </div>
                <div className="text-[11px] text-[#047857] tabular-nums font-medium mt-[2px]">
                  ≈ {formatBrlEquivalent(metrics.bruto)}
                </div>
              </div>
            </div>

            <div className="p-[14px] rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] shadow-xs flex flex-col justify-between">
              <div className="text-[12px] text-[#991B1B] font-medium">Custos</div>
              <div>
                <div className="text-[17px] font-bold text-[#DC2626] tabular-nums">
                  − {formatCurrencyBRL(metrics.totalCustos)}
                </div>
                <div className="text-[11px] text-[#B91C1C] tabular-nums font-medium mt-[2px]">
                  ≈ − {formatBrlEquivalent(metrics.totalCustos)}
                </div>
              </div>
            </div>

            <div className="p-[14px] rounded-[10px] bg-[#F0FDF4] border border-[#86EFAC] shadow-xs flex flex-col justify-between">
              <div className="text-[12px] text-[#166534] font-medium">Líquido</div>
              <div>
                <div className="text-[17px] font-bold text-[#15803D] tabular-nums">
                  {formatCurrencyBRL(metrics.liquido, true)}
                </div>
                <div className="text-[11px] text-[#16A34A] tabular-nums font-medium mt-[2px]">
                  ≈ {formatBrlEquivalent(metrics.liquido)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-[12px] px-[16px] py-[14px] rounded-[10px] bg-[#0F172A] border border-[#1E293B] text-white">
            <div>
              <div className="text-[12px] text-[#94A3B8]">
                Pagamento do operador (50% do líquido)
              </div>
              <div className="flex items-baseline gap-[8px] mt-[2px]">
                <div className="text-[22px] font-bold tabular-nums text-white">
                  {formatCurrencyBRL(metrics.pagamentoOperador)}
                </div>
                <div className="text-[13px] text-[#94A3B8] tabular-nums font-normal">
                  (≈ {formatBrlEquivalent(metrics.pagamentoOperador)})
                </div>
              </div>
            </div>
            <div className="text-[12px] text-[#94A3B8] max-w-[340px] leading-[1.5] text-right">
              Aportes e retiradas de capital não contam como lucro: o bruto é a variação de saldo descontada dessas movimentações.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-[8px] pt-[6px]">
            <div className="text-[15px] font-semibold">
              Custos lançados ({filteredCosts.length})
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[#66716C] text-[12px]">
                  <th className="py-[6px] px-[8px] font-medium">Data</th>
                  <th className="py-[6px] px-[8px] font-medium">Categoria</th>
                  <th className="py-[6px] px-[8px] font-medium">Detalhe</th>
                  <th className="py-[6px] px-[8px] font-medium">Origem</th>
                  <th className="py-[6px] px-[8px] font-medium text-right">Valor</th>
                  <th className="py-[6px] px-[8px] font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredCosts.length === 0 && (
                  <tr className="border-t border-[#EEF1EE]">
                    <td colSpan={6} className="py-[18px] px-[8px] text-center text-[#66716C]">
                      Nenhum custo lançado no período selecionado ({operationalMonthYearLabel}).
                    </td>
                  </tr>
                )}
                {filteredCosts.map((c) => (
                  <tr key={c.id} className="border-t border-[#EEF1EE]">
                    <td className="py-[9px] px-[8px] tabular-nums whitespace-nowrap">{c.date}</td>
                    <td className="py-[9px] px-[8px] whitespace-nowrap">{c.category}</td>
                    <td className="py-[9px] px-[8px]">{c.detail}</td>
                    <td className="py-[9px] px-[8px] whitespace-nowrap">
                      <span
                        className={`inline-block px-[9px] py-[2px] rounded-full text-[12px] whitespace-nowrap ${
                          c.origin.startsWith('Automático')
                            ? 'bg-[#E3F1EE] text-[#0B4F44]'
                            : 'bg-[#EEF1EE] text-[#44504B]'
                        }`}
                      >
                        {c.origin}
                      </span>
                    </td>
                    <td className="py-[9px] px-[8px] text-right tabular-nums whitespace-nowrap">
                      <div className="font-semibold text-[#0F172A]">{formatCurrencyBRL(c.amount)}</div>
                      <div className="text-[11px] text-[#64748B]">≈ {formatBrlEquivalent(c.amount)}</div>
                    </td>
                    <td className="py-[9px] px-[8px] text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          reverseCostRecord(c.id, 'Estornado pelo usuário na tela de Custos')
                        }
                        className="text-[11px] text-[#B3261E] hover:underline cursor-pointer"
                      >
                        Estornar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Coluna Lateral Direita (380px): Lançar custo + Custos por categoria + Alerta de saque sem custo */}
        <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-[16px]">
          <section className="bg-white border border-[#E1E5E1] rounded-[14px] p-[18px] flex flex-col gap-[12px]">
            <div className="text-[15px] font-semibold">Lançar custo</div>
            <div className="flex flex-wrap gap-[6px]">
              {COST_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-[12px] py-[5px] rounded-full text-[12px] cursor-pointer ${
                      active
                        ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                        : 'border border-[#DDE2DD] text-[#1B2421]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="k-op" className="text-[12px] font-medium text-[#66716C]">
                Operador
              </label>
              <select
                id="k-op"
                disabled={!isAdmin}
                value={costOperatorId}
                onChange={(e) => setCostOperatorId(e.target.value)}
                className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white disabled:bg-[#F4F5F2]"
              >
                <option value="op_a">Operador A</option>
                <option value="op_b">Operador B</option>
                <option value="socio_nadson">Nadson (sócio)</option>
                <option value="socio_alef">Alef (sócio)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-[10px]">
              <div className="flex flex-col gap-[4px]">
                <label htmlFor="k-v" className="text-[12px] font-medium text-[#475569]">
                  Valor (USDT)
                </label>
                <input
                  id="k-v"
                  value={costAmountStr}
                  onChange={(e) => setCostAmountStr(e.target.value)}
                  className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] text-right tabular-nums bg-white"
                />
                <span className="text-[11px] text-[#64748B] text-right tabular-nums">
                  ≈ {formatBrlEquivalent(parseCurrencyInput(costAmountStr) || 0)}
                </span>
              </div>
              <div className="flex flex-col gap-[4px]">
                <label htmlFor="k-d" className="text-[12px] font-medium text-[#475569]">
                  Data
                </label>
                <input
                  id="k-d"
                  value={costDateStr}
                  onChange={(e) => setCostDateStr(e.target.value)}
                  className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="k-p" className="text-[12px] font-medium text-[#66716C]">
                Parceria vinculada (opcional)
              </label>
              <select
                id="k-p"
                value={costPartnershipId}
                onChange={(e) => setCostPartnershipId(e.target.value)}
                className="p-[9px_12px] border border-[#CBD2CD] rounded-[8px] text-[13px] bg-white"
              >
                <option value="">Sem vínculo específico</option>
                {partnerships
                  .filter((p) => p.status === 'ativa')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titularName}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="k-n" className="text-[12px] font-medium text-[#66716C]">
                Detalhe (opcional)
              </label>
              <input
                id="k-n"
                value={costDetailStr}
                onChange={(e) => setCostDetailStr(e.target.value)}
                placeholder="Ex.: pagamento de indicação"
                className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
              />
            </div>

            <button
              type="button"
              onClick={handleLaunchCost}
              className="py-[10px] px-[14px] rounded-[9px] bg-[#0F6B5C] text-white font-semibold text-center hover:bg-[#0B4F44] cursor-pointer"
            >
              Lançar custo
            </button>
          </section>

          <section className="bg-white border border-[#CBD2CD] rounded-[14px] p-[18px] flex flex-col gap-[10px]">
            <div className="text-[15px] font-bold text-[#0F172A]">Custos por categoria</div>
            {categoryBreakdown.map(([catLabel, sum]) => (
              <div key={catLabel} className="flex justify-between items-center text-[13px] py-[3px] border-b border-[#F1F5F9] last:border-b-0">
                <span className="text-[#475569]">{catLabel}</span>
                <div className="text-right tabular-nums">
                  <span className="font-semibold text-[#0F172A]">{formatCurrencyBRL(sum)}</span>
                  <span className="text-[11px] text-[#64748B] block">≈ {formatBrlEquivalent(sum)}</span>
                </div>
              </div>
            ))}
          </section>

          {withdrawalsWithoutFacial.length > 0 && (
            <div className="px-[14px] py-[12px] rounded-[10px] bg-[#FBF0DD] text-[#6B3E08] text-[13px] leading-[1.5]">
              <b>{withdrawalsWithoutFacial.length} saque sem custo:</b> Pinnacle · Carlos foi concluído sem facial lançada.{' '}
              <button
                type="button"
                onClick={() => setActiveScreen('saques')}
                className="underline font-medium cursor-pointer"
              >
                Resolver
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
