import React, { useMemo, useState } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  evaluateBetEntry,
  formatCurrencyBRL,
  isWithdrawalInTransit,
  roundCurrency,
} from '../domain/ledger.ts';

export const PendenciasScreen: React.FC = () => {
  const {
    withdrawals,
    deposits,
    houseAccounts,
    bankAccounts,
    partnerships,
    entries,
    divergences,
    operationalMonthYearLabel,
    advanceWithdrawalStage,
    confirmPendingDeposit,
    registerStandaloneFacial,
    setActiveScreen,
    notify,
  } = useEnigma();

  const [withdrawalTab, setWithdrawalTab] = useState<'abertas' | 'concluidas'>('abertas');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const transitWithdrawals = withdrawals.filter(isWithdrawalInTransit);
  const completedWithdrawals = withdrawals.filter((w) => !isWithdrawalInTransit(w));
  const pendingDeposits = deposits.filter(
    (d) => d.type === 'deposito_casa' && d.status === 'pretendido'
  );
  const limitedAccountsWithBalance = houseAccounts.filter(
    (a) => a.status === 'limitada' && a.availableBalance > 0
  );
  const weeklyFacialAccounts = houseAccounts.filter((a) => a.weeklyFacialPending);

  const totalTransitAmount = roundCurrency(
    transitWithdrawals.reduce((acc, w) => acc + w.amount, 0)
  );
  const totalPendingDepositsAmount = roundCurrency(
    pendingDeposits.reduce((acc, d) => acc + d.amount, 0)
  );

  const handleCopyText = (text: string, label: string) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {
      // ignore
    }
    notify('success', `Dados de "${label}" copiados para a área de transferência.`);
  };

  // Fila unificada de todas as pendências (entradas, saques, depósitos, conferências, custos e contas)
  const unifiedPendencies = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'saques' | 'depositos' | 'entradas' | 'conferencia' | 'contas_custos';
      categoryLabel: string;
      title: string;
      titular: string;
      amount: number | null;
      openSince: string;
      responsible: string;
      situation:
        | 'pendente'
        | 'aguardando_conferencia'
        | 'em_transito'
        | 'divergente'
        | 'em_investigacao'
        | 'resolvido';
      nextAction: string;
      onOpenOriginal: () => void;
    }> = [];

    for (const w of withdrawals) {
      const acc = houseAccounts.find((a) => a.id === w.houseAccountId);
      const p = partnerships.find((item) => item.id === w.partnershipId);
      const inTransit = isWithdrawalInTransit(w);
      list.push({
        id: `p_wd_${w.id}`,
        category: 'saques',
        categoryLabel: 'Saque',
        title: `${acc?.label || w.houseAccountId}`,
        titular: p?.shortName || 'Titular',
        amount: w.amount,
        openSince: `${w.requestedAt} (${w.hoursElapsed} h)`,
        responsible: 'Operador A',
        situation: !inTransit
          ? 'resolvido'
          : w.issueType === 'em_investigacao' || w.hoursElapsed >= 24
          ? 'em_investigacao'
          : 'em_transito',
        nextAction: inTransit ? 'Confirmar crédito no banco' : 'Conciliado no banco',
        onOpenOriginal: () => setActiveScreen('saques', { withdrawalId: w.id }),
      });
    }

    for (const e of entries) {
      const ev = evaluateBetEntry(e);
      list.push({
        id: `p_en_${e.id}`,
        category: 'entradas',
        categoryLabel: 'Entrada',
        title: `${e.houses.join(', ')}${e.event ? ` · ${e.event}` : ''}`,
        titular: 'Operação',
        amount: ev.totalStake,
        openSince: e.createdAt,
        responsible: e.operatorId === 'op_b' ? 'Operador B' : 'Operador A',
        situation:
          e.resultStatus === 'concluida'
            ? 'resolvido'
            : ev.canConclude
            ? 'aguardando_conferencia'
            : 'pendente',
        nextAction:
          e.resultStatus === 'concluida'
            ? 'Concluída'
            : ev.canConclude
            ? 'Concluir entrada'
            : `Detalhar (${e.notes})`,
        onOpenOriginal: () => setActiveScreen('entradas', { entryId: e.id }),
      });
    }

    for (const d of divergences) {
      const p = partnerships.find((item) => item.id === d.partnershipId);
      list.push({
        id: `p_div_${d.id}`,
        category: 'conferencia',
        categoryLabel: 'Conferência',
        title: d.targetLabel,
        titular: p?.shortName || 'Titular',
        amount: Math.abs(d.difference),
        openSince: d.updatedAt,
        responsible: d.responsibleName,
        situation:
          d.status === 'resolvida'
            ? 'resolvido'
            : d.status === 'em_investigacao'
            ? 'em_investigacao'
            : 'divergente',
        nextAction: d.justification,
        onOpenOriginal: () => setActiveScreen('conferencia', { divergenceId: d.id }),
      });
    }

    for (const dep of deposits.filter((d) => d.type === 'deposito_casa')) {
      const acc = houseAccounts.find((a) => a.id === dep.destinationHouseAccountId);
      const p = partnerships.find((item) => item.id === dep.partnershipId);
      list.push({
        id: `p_dep_${dep.id}`,
        category: 'depositos',
        categoryLabel: 'Depósito',
        title: acc?.label || 'Conta da casa',
        titular: p?.shortName || 'Titular',
        amount: dep.amount,
        openSince: dep.createdAt,
        responsible: 'Operador A',
        situation: dep.status === 'confirmado' ? 'resolvido' : 'pendente',
        nextAction: dep.notes,
        onOpenOriginal: () => setActiveScreen('saques'),
      });
    }

    for (const p of partnerships.filter((item) => !item.reimbursementSettled && item.reimbursementAmount > 0)) {
      list.push({
        id: `p_reimb_${p.id}`,
        category: 'contas_custos',
        categoryLabel: 'Custo / Ressarcimento',
        title: `Ressarcimento de parceria · ${p.shortName}`,
        titular: p.shortName,
        amount: p.reimbursementAmount,
        openSince: p.createdAt,
        responsible: 'Operador A',
        situation: 'pendente',
        nextAction: 'Quitar ressarcimento ao operador que pagou a criação',
        onOpenOriginal: () => setActiveScreen('parcerias', { partnershipId: p.id }),
      });
    }

    return list.filter((item) => {
      if (categoryFilter !== 'todas' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'todos' && item.situation !== statusFilter) return false;
      if (
        searchQuery.trim() &&
        !`${item.title} ${item.titular} ${item.nextAction}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [
    withdrawals,
    entries,
    divergences,
    deposits,
    partnerships,
    houseAccounts,
    categoryFilter,
    statusFilter,
    searchQuery,
  ]);

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Cabeçalho idêntico à tela 04_Pendencias.html */}
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 text-[22px] font-bold text-[#0F172A] tracking-[-0.02em]">Pendências</h1>
          <div className="text-[13px] text-[#475569]">
            Tudo que ainda precisa de uma ação, agrupado por tipo.
          </div>
        </div>
      </div>

      {/* 4 Cards Superiores idênticos ao 04_Pendencias.html */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <div className="bg-white border border-[#E1E5E1] rounded-[12px] p-[16px] flex flex-col gap-[4px]">
          <div className="text-[12px] text-[#66716C]">Saques aguardando</div>
          <div className="text-[28px] font-semibold tabular-nums">
            {transitWithdrawals.length}
          </div>
          <div className="text-[12px] text-[#66716C] tabular-nums">
            {formatCurrencyBRL(totalTransitAmount)} a receber
          </div>
        </div>

        <div className="bg-white border border-[#E1E5E1] rounded-[12px] p-[16px] flex flex-col gap-[4px]">
          <div className="text-[12px] text-[#66716C]">Depósitos pretendidos</div>
          <div className="text-[28px] font-semibold tabular-nums">
            {pendingDeposits.length}
          </div>
          <div className="text-[12px] text-[#66716C] tabular-nums">
            {formatCurrencyBRL(totalPendingDepositsAmount)} a depositar
          </div>
        </div>

        <div className="bg-white border border-[#E1E5E1] rounded-[12px] p-[16px] flex flex-col gap-[4px]">
          <div className="text-[12px] text-[#66716C]">Contas limitadas</div>
          <div className="text-[28px] font-semibold tabular-nums">
            {limitedAccountsWithBalance.length > 0 ? 1 : 0}
          </div>
          <div className="text-[12px] text-[#66716C]">aguardando saque final</div>
        </div>

        <div className="bg-white border border-[#E1E5E1] rounded-[12px] p-[16px] flex flex-col gap-[4px]">
          <div className="text-[12px] text-[#66716C]">Facial semanal</div>
          <div className="text-[28px] font-semibold tabular-nums">
            {weeklyFacialAccounts.length}
          </div>
          <div className="text-[12px] text-[#B3261E]">
            {weeklyFacialAccounts.length > 0 ? 'vence amanhã' : 'em dia'}
          </div>
        </div>
      </div>

      {/* Seção Principal: Saques aguardando conclusão */}
      <section className="bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[6px]">
        <div className="flex justify-between items-center pb-[6px]">
          <div className="text-[16px] font-semibold">Saques aguardando conclusão</div>
          <div className="flex gap-[8px] text-[13px]">
            <button
              type="button"
              onClick={() => setWithdrawalTab('abertas')}
              className={`px-[12px] py-[5px] rounded-full cursor-pointer ${
                withdrawalTab === 'abertas'
                  ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                  : 'text-[#66716C]'
              }`}
            >
              Abertas ({transitWithdrawals.length})
            </button>
            <button
              type="button"
              onClick={() => setWithdrawalTab('concluidas')}
              className={`px-[12px] py-[5px] rounded-full cursor-pointer ${
                withdrawalTab === 'concluidas'
                  ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                  : 'text-[#66716C]'
              }`}
            >
              Concluídas ({completedWithdrawals.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[#66716C] text-[12px]">
                <th className="py-[6px] px-[8px] font-medium">Desde</th>
                <th className="py-[6px] px-[8px] font-medium">Conta</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Valor</th>
                <th className="py-[6px] px-[8px] font-medium">Destino</th>
                <th className="py-[6px] px-[8px] font-medium">Prioridade</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {(withdrawalTab === 'abertas' ? transitWithdrawals : completedWithdrawals).map(
                (w) => {
                  const acc = houseAccounts.find((a) => a.id === w.houseAccountId);
                  const bank = bankAccounts.find((b) => b.id === w.destinationBankId);
                  const p = partnerships.find((item) => item.id === w.partnershipId);

                  return (
                    <tr key={w.id} className="border-t border-[#EEF1EE]">
                      <td className="py-[11px] px-[8px] tabular-nums">
                        {w.requestedAt.replace('/2026', '')}
                      </td>
                      <td className="py-[11px] px-[8px]">
                        {acc?.label || w.houseAccountId}
                      </td>
                      <td className="py-[11px] px-[8px] text-right tabular-nums">
                        {formatCurrencyBRL(w.amount)}
                      </td>
                      <td className="py-[11px] px-[8px]">
                        {p ? `Banco de ${p.shortName}` : bank?.label || 'Banco'}
                      </td>
                      <td className="py-[11px] px-[8px]">
                        <span
                          className={`px-[9px] py-[2px] rounded-full text-[12px] ${
                            w.priority === 'alta'
                              ? 'bg-[#FBE9E7] text-[#8C1D18]'
                            : w.priority === 'media'
                              ? 'bg-[#FBF0DD] text-[#8A4B08]'
                              : 'bg-[#EEF1EE] text-[#44504B]'
                          }`}
                        >
                          {w.priority === 'alta'
                            ? 'Alta'
                            : w.priority === 'media'
                            ? 'Média'
                            : 'Baixa'}
                        </span>
                      </td>
                      <td className="py-[11px] px-[8px]">
                        <div className="flex gap-[6px] justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                `${acc?.label} · ${formatCurrencyBRL(w.amount)} · Destino: ${
                                  bank?.label
                                }`,
                                acc?.label || 'Saque'
                              )
                            }
                            className="px-[12px] py-[6px] rounded-[7px] border border-[#CBD2CD] text-[12px] hover:bg-[#F4F5F2] cursor-pointer"
                          >
                            Copiar
                          </button>
                          {isWithdrawalInTransit(w) && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  advanceWithdrawalStage(w.id, 'recebido_banco')
                                }
                                className="px-[12px] py-[6px] rounded-[7px] bg-[#0F6B5C] text-white text-[12px] font-medium hover:bg-[#0B4F44] cursor-pointer"
                              >
                                Concluído
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  advanceWithdrawalStage(w.id, 'em_transito', {
                                    issueType: 'em_investigacao',
                                    issueNotes: 'Marcado como Não concluído em Pendências',
                                  });
                                  setActiveScreen('saques', { withdrawalId: w.id });
                                }}
                                className="px-[12px] py-[6px] rounded-[7px] border border-[#E3B7B2] text-[#8C1D18] text-[12px] hover:bg-[#FBE9E7] cursor-pointer"
                              >
                                Não concluído
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid 2 Colunas: Depósitos pretendidos + Contas limitadas e facial semanal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
        <section className="bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[8px]">
          <div className="text-[16px] font-semibold pb-[4px]">Depósitos pretendidos</div>
          {pendingDeposits.length > 0 ? (
            pendingDeposits.map((dep) => {
              const acc = houseAccounts.find(
                (a) => a.id === dep.destinationHouseAccountId
              );
              return (
                <div
                  key={dep.id}
                  className="flex justify-between items-center py-[10px] border-t border-[#EEF1EE]"
                >
                  <div>
                    <div className="font-medium">{acc?.label || 'Conta'}</div>
                    <div className="text-[12px] text-[#66716C] tabular-nums">
                      {formatCurrencyBRL(dep.amount)} · {dep.notes}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmPendingDeposit(dep.id)}
                    className="px-[12px] py-[6px] rounded-[7px] bg-[#0F6B5C] text-white text-[12px] font-medium hover:bg-[#0B4F44] cursor-pointer"
                  >
                    Concluído
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-[10px] text-[13px] text-[#1F7A3D]">
              Todos os depósitos pretendidos foram confirmados!
            </div>
          )}
        </section>

        <section className="bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[8px]">
          <div className="text-[16px] font-semibold pb-[4px]">
            Contas limitadas e facial semanal
          </div>
          <div className="flex justify-between items-center py-[10px] border-t border-[#EEF1EE]">
            <div>
              <div className="font-medium">Bet365 · Carlos</div>
              <div className="text-[12px] text-[#66716C]">
                Limitada · sacar saldo restante 640,00 USDT (≈ R$ 3.507,20)
              </div>
            </div>
            <div className="flex gap-[6px]">
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    'Bet365 · Carlos — Saldo 640,00 USDT (≈ R$ 3.507,20)',
                    'Bet365 · Carlos'
                  )
                }
                className="px-[12px] py-[6px] rounded-[7px] border border-[#CBD2CD] text-[12px] hover:bg-[#F4F5F2] cursor-pointer"
              >
                Copiar
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen('saques')}
                className="px-[12px] py-[6px] rounded-[7px] border border-[#0F6B5C] text-[#0F6B5C] text-[12px] font-medium cursor-pointer"
              >
                Solicitar saque
              </button>
            </div>
          </div>

          {weeklyFacialAccounts.length > 0 ? (
            weeklyFacialAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex justify-between items-center py-[10px] border-t border-[#EEF1EE]"
              >
                <div>
                  <div className="font-medium">{acc.label}</div>
                  <div className="text-[12px] text-[#B3261E]">Facial vence amanhã</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    registerStandaloneFacial({
                      houseAccountId: acc.id,
                      amount: 8,
                      kind: 'Semanal',
                    })
                  }
                  className="px-[12px] py-[6px] rounded-[7px] bg-[#0F6B5C] text-white text-[12px] font-medium hover:bg-[#0B4F44] cursor-pointer"
                >
                  Concluído
                </button>
              </div>
            ))
          ) : (
            <div className="py-[10px] border-t border-[#EEF1EE] text-[13px] text-[#1F7A3D]">
              Facial semanal de KTO · Maria concluída!
            </div>
          )}
        </section>
      </div>

      {/* Centralização e Filtros Avançados de Todas as Pendências (Entradas, Saques, Conferências, Custos e Contas) */}
      <section className="bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[12px]">
        <div className="flex flex-wrap justify-between items-center gap-[10px]">
          <div>
            <div className="text-[16px] font-semibold">
              Fila centralizada de pendências e histórico
            </div>
            <div className="text-[12px] text-[#66716C]">
              Filtre por categoria, titular/conta ou situação e abra o registro original sem duplicar informações.
            </div>
          </div>

          <div className="flex flex-wrap gap-[8px] items-center">
            <select
              aria-label="Filtrar pendências por categoria"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-[7px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] bg-white"
            >
              <option value="todas">Todas as categorias</option>
              <option value="entradas">Entradas</option>
              <option value="saques">Saques</option>
              <option value="depositos">Depósitos</option>
              <option value="conferencia">Conferências / Divergências</option>
              <option value="contas_custos">Contas e Custos</option>
            </select>

            <select
              aria-label="Filtrar pendências por situação"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-[7px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] bg-white"
            >
              <option value="todos">Todas as situações</option>
              <option value="pendente">Pendente</option>
              <option value="aguardando_conferencia">Aguardando conferência</option>
              <option value="em_transito">Em trânsito</option>
              <option value="divergente">Divergente</option>
              <option value="em_investigacao">Em investigação</option>
              <option value="resolvido">Resolvido</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conta, casa ou titular..."
              className="p-[7px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] w-[200px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[#66716C] text-[12px]">
                <th className="py-[6px] px-[8px] font-medium">Categoria</th>
                <th className="py-[6px] px-[8px] font-medium">Conta / Item</th>
                <th className="py-[6px] px-[8px] font-medium">Titular / Resp.</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Valor</th>
                <th className="py-[6px] px-[8px] font-medium">Tempo em aberto</th>
                <th className="py-[6px] px-[8px] font-medium">Situação</th>
                <th className="py-[6px] px-[8px] font-medium">Próxima ação</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Registro original</th>
              </tr>
            </thead>
            <tbody>
              {unifiedPendencies.map((item) => (
                <tr key={item.id} className="border-t border-[#EEF1EE]">
                  <td className="py-[9px] px-[8px] font-medium text-[#44504B]">
                    {item.categoryLabel}
                  </td>
                  <td className="py-[9px] px-[8px] font-medium">{item.title}</td>
                  <td className="py-[9px] px-[8px] text-[#66716C]">
                    {item.titular} · {item.responsible}
                  </td>
                  <td className="py-[9px] px-[8px] text-right tabular-nums">
                    {item.amount !== null ? formatCurrencyBRL(item.amount) : '—'}
                  </td>
                  <td className="py-[9px] px-[8px] text-[12px] text-[#66716C] tabular-nums">
                    {item.openSince}
                  </td>
                  <td className="py-[9px] px-[8px]">
                    <span
                      className={`px-[9px] py-[2px] rounded-full text-[11px] font-medium ${
                        item.situation === 'resolvido'
                          ? 'bg-[#E3F1EE] text-[#0B4F44]'
                          : item.situation === 'divergente' ||
                            item.situation === 'em_investigacao'
                          ? 'bg-[#FBE9E7] text-[#8C1D18]'
                          : 'bg-[#FBF0DD] text-[#8A4B08]'
                      }`}
                    >
                      {item.situation.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-[9px] px-[8px] text-[12px] text-[#44504B]">
                    {item.nextAction}
                  </td>
                  <td className="py-[9px] px-[8px] text-right">
                    <button
                      type="button"
                      onClick={item.onOpenOriginal}
                      className="px-[10px] py-[5px] rounded-[7px] border border-[#0F6B5C] text-[#0F6B5C] text-[12px] font-medium hover:bg-[#E3F1EE] cursor-pointer"
                    >
                      Abrir registro
                    </button>
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
