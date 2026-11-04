import React from 'react';
import { ArrowRight, RotateCcw, Wallet } from 'lucide-react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  evaluateBetEntry,
  formatBrlEquivalent,
  formatCurrencyBRL,
  isWithdrawalInTransit,
} from '../domain/ledger.ts';

export const VisaoGeralScreen: React.FC = () => {
  const {
    globalSummary,
    entries,
    withdrawals,
    deposits,
    divergences,
    houseAccounts,
    partnerships,
    ledgerMovements,
    setActiveScreen,
    resetDemoData,
  } = useEnigma();

  const openEntries = entries.filter((e) => e.resultStatus !== 'concluida');
  const transitWithdrawals = withdrawals.filter(isWithdrawalInTransit);
  const openDivergences = divergences.filter((d) => d.status !== 'resolvida');
  const pendingDeposits = deposits.filter(
    (d) => d.type === 'deposito_casa' && d.status === 'pretendido'
  );
  const stockPartnershipsCount = partnerships.filter((p) => p.status === 'estoque').length;

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <h1 className="m-0 text-[22px] font-bold text-[#0F172A] tracking-[-0.02em]">
          Visão Geral
        </h1>
        <div className="flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            onClick={resetDemoData}
            className="px-[12px] py-[7px] rounded-[8px] border border-[#CBD5E1] bg-white text-[#475569] text-[12px] font-semibold hover:bg-[#F1F5F9] hover:text-[#0F172A] inline-flex items-center gap-[6px] cursor-pointer"
          >
            <RotateCcw className="w-[13px] h-[13px]" strokeWidth={1.75} />
            <span>Restaurar dados iniciais</span>
          </button>
        </div>
      </div>

      {/* Linha 1: Cards KPI Interativos com Borda Lateral e Equivalente R$ Discreto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-[12px]">
        <button
          type="button"
          onClick={() => setActiveScreen('saldos')}
          className="enigma-card text-left bg-[#0F172A] text-white rounded-[12px] p-[16px] flex flex-col gap-[4px] border border-[#1E293B] hover:border-[#334155] cursor-pointer"
        >
          <div className="flex justify-between items-center text-[11.5px] text-[#94A3B8] font-medium">
            <span>Capital Global</span>
            <Wallet className="w-[14px] h-[14px] text-[#94A3B8]" strokeWidth={1.75} />
          </div>
          <div className="text-[20px] font-bold tabular-nums whitespace-nowrap text-white">
            {formatCurrencyBRL(globalSummary.totalGlobalCapital)}
          </div>
          <div className="text-[11px] text-[#94A3B8] tabular-nums font-medium pt-[4px] border-t border-[#1E293B]">
            ≈ {formatBrlEquivalent(globalSummary.totalGlobalCapital)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('saldos')}
          className="enigma-card text-left bg-white border border-[#CBD5E1] border-l-4 border-l-[#0F6B5C] hover:border-[#0F6B5C] rounded-[12px] p-[16px] flex flex-col gap-[4px] cursor-pointer"
        >
          <div className="flex justify-between items-center text-[11.5px] text-[#475569] font-bold">
            <span>Disponível Casas</span>
            <span className="px-[7px] py-[1px] rounded-full bg-[#ECFDF5] border border-[#BBF7D0] text-[#0F6B5C] text-[10px] font-bold tabular-nums">
              {globalSummary.activeAccountsCount} ativas
            </span>
          </div>
          <div className="text-[19px] font-bold tabular-nums whitespace-nowrap text-[#0F172A]">
            {formatCurrencyBRL(globalSummary.availableInHouses)}
          </div>
          <div className="text-[11px] text-[#475569] tabular-nums pt-[4px] border-t border-[#E2E8F0]">
            ≈ {formatBrlEquivalent(globalSummary.availableInHouses)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('parcerias')}
          className="enigma-card text-left bg-white border border-[#CBD5E1] border-l-4 border-l-[#334155] hover:border-[#0F6B5C] rounded-[12px] p-[16px] flex flex-col gap-[4px] cursor-pointer"
        >
          <div className="flex justify-between items-center text-[11.5px] text-[#475569] font-bold">
            <span>Carteiras / Corretoras</span>
            <span className="px-[7px] py-[1px] rounded-full bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] text-[10px] font-bold">
              USDT
            </span>
          </div>
          <div className="text-[19px] font-bold tabular-nums whitespace-nowrap text-[#0F172A]">
            {formatCurrencyBRL(globalSummary.totalBankBalances)}
          </div>
          <div className="text-[11px] text-[#475569] tabular-nums pt-[4px] border-t border-[#E2E8F0]">
            ≈ {formatBrlEquivalent(globalSummary.totalBankBalances)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('entradas')}
          className="enigma-card text-left bg-white border border-[#CBD5E1] border-l-4 border-l-[#64748B] hover:border-[#0F6B5C] rounded-[12px] p-[16px] flex flex-col gap-[4px] cursor-pointer"
        >
          <div className="flex justify-between items-center text-[11.5px] text-[#475569] font-bold">
            <span>Apostas Abertas</span>
            <span className="px-[7px] py-[1px] rounded-full bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] text-[10px] font-bold tabular-nums">
              {globalSummary.openBetsCount} op.
            </span>
          </div>
          <div className="text-[19px] font-bold tabular-nums whitespace-nowrap text-[#0F172A]">
            {formatCurrencyBRL(globalSummary.reservedInOpenBets)}
          </div>
          <div className="text-[11px] text-[#475569] tabular-nums pt-[4px] border-t border-[#E2E8F0]">
            ≈ {formatBrlEquivalent(globalSummary.reservedInOpenBets)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('saques')}
          className="enigma-card text-left bg-white border border-[#CBD5E1] border-l-4 border-l-[#B45309] hover:border-[#B45309] rounded-[12px] p-[16px] flex flex-col gap-[4px] cursor-pointer"
        >
          <div className="flex justify-between items-center text-[11.5px] text-[#475569] font-bold">
            <span>Saques em Trânsito</span>
            <span className="px-[7px] py-[1px] rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[10px] font-bold tabular-nums">
              {globalSummary.inTransitWithdrawalsCount}
            </span>
          </div>
          <div className="text-[19px] font-bold tabular-nums text-[#B45309] whitespace-nowrap">
            {formatCurrencyBRL(globalSummary.inTransitWithdrawals)}
          </div>
          <div className="text-[11px] text-[#475569] tabular-nums pt-[4px] border-t border-[#E2E8F0]">
            ≈ {formatBrlEquivalent(globalSummary.inTransitWithdrawals)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('custos')}
          className="enigma-card text-left bg-[#F0FDF4] border border-[#BBF7D0] border-l-4 border-l-[#15803D] hover:border-[#15803D] rounded-[12px] p-[16px] flex flex-col gap-[4px] cursor-pointer"
        >
          <div className="flex justify-between items-center text-[11.5px] text-[#15803D] font-bold">
            <span>Lucro Realizado</span>
            <span className="text-[10px] px-[7px] py-[1px] rounded-full bg-white text-[#15803D] border border-[#BBF7D0] tabular-nums">
              {globalSummary.roiMonthPercent}% ROI
            </span>
          </div>
          <div className="text-[19px] font-bold text-[#15803D] tabular-nums whitespace-nowrap">
            {formatCurrencyBRL(globalSummary.realizedProfitMonth, true)}
          </div>
          <div className="text-[11px] text-[#15803D] tabular-nums whitespace-nowrap font-medium pt-[4px] border-t border-[#BBF7D0]">
            ≈ {formatBrlEquivalent(globalSummary.realizedProfitMonth)} · Proj:{' '}
            {formatCurrencyBRL(globalSummary.projectedOpenProfit, true)}
          </div>
        </button>
      </div>

      {/* Barra Visual de Alocação do Capital Global */}
      {globalSummary.totalGlobalCapital > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] px-[18px] py-[12px] flex flex-col gap-[8px]">
          <div className="flex flex-wrap justify-between items-center text-[11.5px] font-semibold text-[#475569]">
            <span className="text-[#0F172A]">Distribuição da Banca em Tempo Real</span>
            <div className="flex flex-wrap items-center gap-[14px]">
              <span className="flex items-center gap-[5px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#0F6B5C]" />
                Casas (
                {Math.round(
                  (globalSummary.availableInHouses / globalSummary.totalGlobalCapital) * 100
                )}
                %)
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#334155]" />
                Carteiras (
                {Math.round(
                  (globalSummary.totalBankBalances / globalSummary.totalGlobalCapital) * 100
                )}
                %)
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#94A3B8]" />
                Em Aberto (
                {Math.round(
                  (globalSummary.reservedInOpenBets / globalSummary.totalGlobalCapital) * 100
                )}
                %)
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#B45309]" />
                Em Trânsito (
                {Math.round(
                  (globalSummary.inTransitWithdrawals / globalSummary.totalGlobalCapital) * 100
                )}
                %)
              </span>
            </div>
          </div>
          <div className="w-full h-[8px] rounded-full bg-[#F1F5F9] overflow-hidden flex gap-[2px]">
            <div
              style={{
                width: `${(globalSummary.availableInHouses / globalSummary.totalGlobalCapital) * 100}%`,
              }}
              className="h-full bg-[#0F6B5C]"
              title={`Disponível nas casas: ${formatCurrencyBRL(globalSummary.availableInHouses)}`}
            />
            <div
              style={{
                width: `${(globalSummary.totalBankBalances / globalSummary.totalGlobalCapital) * 100}%`,
              }}
              className="h-full bg-[#334155]"
              title={`Carteiras/Corretoras: ${formatCurrencyBRL(globalSummary.totalBankBalances)}`}
            />
            <div
              style={{
                width: `${(globalSummary.reservedInOpenBets / globalSummary.totalGlobalCapital) * 100}%`,
              }}
              className="h-full bg-[#94A3B8]"
              title={`Em apostas abertas: ${formatCurrencyBRL(globalSummary.reservedInOpenBets)}`}
            />
            <div
              style={{
                width: `${(globalSummary.inTransitWithdrawals / globalSummary.totalGlobalCapital) * 100}%`,
              }}
              className="h-full bg-[#B45309]"
              title={`Saques em trânsito: ${formatCurrencyBRL(globalSummary.inTransitWithdrawals)}`}
            />
          </div>
        </div>
      )}

      {/* Fluxo Operacional Conectado (conforme mapa de integração) */}
      <section className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden flex flex-col">
        <div className="px-[18px] py-[11px] bg-[#0F172A] text-white flex flex-wrap justify-between items-center gap-[8px]">
          <div className="text-[14.5px] font-bold text-white">
            Estado operacional das contas e fluxo conectado
          </div>
          <div className="text-[12px] text-[#94A3B8]">
            Clique em qualquer indicador para abrir a tela responsável
          </div>
        </div>

        <div className="p-[16px] bg-[#F8FAFC] grid grid-cols-2 md:grid-cols-6 gap-[10px]">
          <button
            type="button"
            onClick={() => setActiveScreen('estoque')}
            className="text-left p-[12px] rounded-[8px] bg-white border border-[#CBD5E1] hover:bg-[#ECFDF5] hover:border-[#0F6B5C] cursor-pointer flex flex-col gap-[2px]"
          >
            <span className="text-[11px] font-semibold text-[#475569]">10 · Estoque disponível</span>
            <span className="text-[20px] font-bold text-[#0F172A] tabular-nums">
              {stockPartnershipsCount} parcerias
            </span>
            <span className="text-[11px] text-[#0F6B5C] font-semibold inline-flex items-center gap-[4px]">
              <span>Puxar ou cadastrar</span>
              <ArrowRight className="w-[11px] h-[11px]" strokeWidth={2} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('saldos')}
            className="text-left p-[12px] rounded-[8px] bg-white border border-[#CBD5E1] hover:bg-[#ECFDF5] hover:border-[#0F6B5C] cursor-pointer flex flex-col gap-[2px]"
          >
            <span className="text-[11px] font-semibold text-[#475569]">Contas prontas</span>
            <span className="text-[20px] font-bold text-[#15803D] tabular-nums">
              {globalSummary.accountStatusCounts.prontas}
            </span>
            <span className="text-[11px] text-[#64748B]">Liberadas para iniciar uso</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('saldos')}
            className="text-left p-[12px] rounded-[8px] bg-white border border-[#CBD5E1] hover:bg-[#ECFDF5] hover:border-[#0F6B5C] cursor-pointer flex flex-col gap-[2px]"
          >
            <span className="text-[11px] font-semibold text-[#475569]">Contas em uso</span>
            <span className="text-[20px] font-bold text-[#0F6B5C] tabular-nums">
              {globalSummary.accountStatusCounts.em_uso}
            </span>
            <span className="text-[11px] text-[#64748B]">Operando normalmente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('saldos')}
            className="text-left p-[12px] rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] hover:border-[#B91C1C] cursor-pointer flex flex-col gap-[2px]"
          >
            <span className="text-[11px] font-semibold text-[#B91C1C]">Contas limitadas</span>
            <span className="text-[20px] font-bold text-[#B91C1C] tabular-nums">
              {globalSummary.accountStatusCounts.limitadas}
            </span>
            <span className="text-[11px] text-[#B91C1C] font-semibold inline-flex items-center gap-[4px]">
              <span>Sacar saldo / conciliar</span>
              <ArrowRight className="w-[11px] h-[11px]" strokeWidth={2} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('saques')}
            className="text-left p-[12px] rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] hover:border-[#B45309] cursor-pointer flex flex-col gap-[2px]"
          >
            <span className="text-[11px] font-semibold text-[#B45309]">Saque / em trânsito</span>
            <span className="text-[20px] font-bold text-[#B45309] tabular-nums">
              {globalSummary.accountStatusCounts.aguardando_saque_ou_transito}
            </span>
            <span className="text-[11px] text-[#B45309] font-semibold inline-flex items-center gap-[4px]">
              <span>Acompanhar crédito</span>
              <ArrowRight className="w-[11px] h-[11px]" strokeWidth={2} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('conferencia')}
            className="text-left p-[12px] rounded-[8px] bg-white border border-[#CBD5E1] hover:bg-[#ECFDF5] hover:border-[#0F6B5C] cursor-pointer flex flex-col gap-[2px]"
          >
            <span className="text-[11px] font-semibold text-[#475569]">Depósito / conferência</span>
            <span className="text-[20px] font-bold text-[#0F172A] tabular-nums">
              {globalSummary.accountStatusCounts.aguardando_deposito_ou_conferencia}
            </span>
            <span className="text-[11px] text-[#0F6B5C] font-semibold inline-flex items-center gap-[4px]">
              <span>Conferir saldos</span>
              <ArrowRight className="w-[11px] h-[11px]" strokeWidth={2} />
            </span>
          </button>
        </div>
      </section>

      {/* Ações Prioritárias de Triagem (levam ao registro original) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
        <section className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden flex flex-col">
          <div className="px-[18px] py-[11px] bg-[#0F172A] text-white flex justify-between items-center">
            <div className="text-[14.5px] font-bold text-white">
              Ações prioritárias (triagem direta)
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('pendencias')}
              className="text-[12px] text-[#4ADE80] font-semibold hover:underline inline-flex items-center gap-[4px] cursor-pointer"
            >
              <span>Ver fila completa</span>
              <ArrowRight className="w-[12px] h-[12px]" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col divide-y divide-[#CBD5E1] text-[13px]">
            {openDivergences.map((div) => (
              <div
                key={div.id}
                className="px-[18px] py-[11px] bg-[#FEF2F2]/60 flex justify-between items-center gap-[12px]"
              >
                <div className="flex flex-col gap-[2px]">
                  <div className="font-bold text-[#B91C1C]">
                    Divergência: {div.targetLabel} ({formatCurrencyBRL(div.difference)})
                  </div>
                  <div className="text-[12px] text-[#475569]">{div.justification}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveScreen('conferencia', { divergenceId: div.id })
                  }
                  className="px-[12px] py-[6px] rounded-[8px] bg-[#B91C1C] text-white text-[12px] font-semibold shrink-0 cursor-pointer"
                >
                  Classificar na conferência
                </button>
              </div>
            ))}

            {transitWithdrawals.map((w) => {
              const acc = houseAccounts.find((a) => a.id === w.houseAccountId);
              return (
                <div
                  key={w.id}
                  className="px-[18px] py-[11px] bg-white odd:bg-white even:bg-[#F1F5F9] flex justify-between items-center gap-[12px]"
                >
                  <div className="flex flex-col gap-[2px]">
                    <div className="font-semibold text-[#0F172A]">
                      Saque em trânsito · {acc?.label || w.houseAccountId} (
                      {formatCurrencyBRL(w.amount)})
                    </div>
                    <div className="text-[12px] text-[#475569]">
                      Estágio: {w.stage.replace('_', ' ')} · há {w.hoursElapsed} h
                      {w.issueType !== 'nenhum' ? ` · Alerta: ${w.issueNotes}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveScreen('saques', { withdrawalId: w.id })
                    }
                    className="px-[12px] py-[6px] rounded-[8px] border border-[#0F6B5C] bg-white text-[#0F6B5C] hover:bg-[#ECFDF5] text-[12px] font-semibold shrink-0 cursor-pointer"
                  >
                    Abrir saque
                  </button>
                </div>
              );
            })}

            {openEntries.slice(0, 3).map((entry) => {
              const ev = evaluateBetEntry(entry);
              return (
                <div
                  key={entry.id}
                  className="px-[18px] py-[11px] bg-white odd:bg-white even:bg-[#F1F5F9] flex justify-between items-center gap-[12px]"
                >
                  <div className="flex flex-col gap-[2px]">
                    <div className="font-semibold text-[#0F172A]">
                      Entrada aberta · {entry.houses.join(', ')} (
                      {formatCurrencyBRL(ev.totalStake)})
                    </div>
                    <div className="text-[12px] text-[#B45309] font-medium">{entry.notes}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveScreen('entradas', { entryId: entry.id })
                    }
                    className="px-[12px] py-[6px] rounded-[8px] bg-[#0F6B5C] hover:bg-[#0B4F44] text-white text-[12px] font-semibold shrink-0 cursor-pointer"
                  >
                    {ev.canConclude ? 'Concluir entrada' : 'Detalhar entrada'}
                  </button>
                </div>
              );
            })}

            {pendingDeposits.map((dep) => {
              const acc = houseAccounts.find(
                (a) => a.id === dep.destinationHouseAccountId
              );
              return (
                <div
                  key={dep.id}
                  className="px-[18px] py-[11px] bg-white odd:bg-white even:bg-[#F1F5F9] flex justify-between items-center gap-[12px]"
                >
                  <div className="flex flex-col gap-[2px]">
                    <div className="font-semibold text-[#0F172A]">
                      Depósito pretendido · {acc?.label || 'Conta'} (
                      {formatCurrencyBRL(dep.amount)})
                    </div>
                    <div className="text-[12px] text-[#475569]">{dep.notes}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('pendencias')}
                    className="px-[12px] py-[6px] rounded-[8px] border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9] text-[12px] font-semibold shrink-0 cursor-pointer"
                  >
                    Confirmar em Pendências
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trilha Recente do Livro Único (Rastreabilidade) */}
        <section className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden flex flex-col">
          <div className="px-[18px] py-[11px] bg-[#0F172A] text-white flex justify-between items-center">
            <div className="text-[14.5px] font-bold text-white">
              Últimos registros da trilha única
            </div>
            <div className="text-[12px] text-[#94A3B8]">
              Histórico auditável (estorno/ajuste preservados)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[#64748B] text-[11px] font-bold uppercase tracking-wider bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-[8px] px-[12px]">Data/hora</th>
                  <th className="py-[8px] px-[10px]">Origem → Destino</th>
                  <th className="py-[8px] px-[10px] text-right">Valor</th>
                  <th className="py-[8px] px-[12px]">Situação</th>
                </tr>
              </thead>
              <tbody>
                {ledgerMovements.slice(0, 6).map((mov) => (
                  <tr key={mov.id} className="border-t border-[#E2E8F0]">
                    <td className="py-[9px] px-[12px] text-[12px] text-[#475569] tabular-nums whitespace-nowrap">
                      {mov.timestamp}
                    </td>
                    <td className="py-[9px] px-[10px]">
                      <div className="font-semibold text-[#0F172A]">
                        {mov.origin} → {mov.destination}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {mov.notes} · por {mov.authorName}
                      </div>
                    </td>
                    <td className="py-[9px] px-[10px] text-right font-bold text-[#0F172A] tabular-nums whitespace-nowrap">
                      {formatCurrencyBRL(mov.amount)}
                    </td>
                    <td className="py-[9px] px-[12px] whitespace-nowrap">
                      <span
                        className={`inline-block px-[8px] py-[2px] rounded-full text-[11px] font-semibold whitespace-nowrap ${
                          mov.status === 'conciliado'
                            ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                            : mov.status === 'em_transito'
                            ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                            : mov.status === 'estornado'
                            ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] line-through'
                            : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                        }`}
                      >
                        {mov.status === 'em_transito'
                          ? 'em trânsito'
                          : mov.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
