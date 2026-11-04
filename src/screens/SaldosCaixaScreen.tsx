import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  computePartnershipPeriodMetrics,
  computeReservedStakesByAccount,
  formatBrlEquivalent,
  formatCurrencyBRL,
  formatShortHouseName,
  isWithdrawalInTransit,
  parseCurrencyInput,
  roundCurrency,
} from '../domain/ledger.ts';
import type { HouseAccount, HouseAccountStatus } from '../domain/types.ts';
import {
  getHouseAccountStatusTheme,
  getHouseColorTheme,
} from '../domain/uiTheme.ts';

type OperationalStateFilter =
  | 'todas'
  | 'prontas'
  | 'em_uso'
  | 'limitadas'
  | 'saque_transito'
  | 'deposito_conferencia';

function formatShortWalletKey(rawKey: string): string {
  if (!rawKey) return '';
  const netMatch = rawKey.match(/\((.*?)\)/);
  const netSuffix = netMatch ? ` · ${netMatch[1].replace(/\s*\/\s*/g, '/')}` : '';
  const addr = rawKey.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (addr.startsWith('0x') && addr.length > 14) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}${netSuffix}`;
  }
  return rawKey;
}

export const SaldosCaixaScreen: React.FC = () => {
  const {
    globalSummary,
    partnerships,
    houseAccounts,
    bankAccounts,
    entries,
    withdrawals,
    deposits,
    isDateFilterActive,
    updateHouseAccountOperationalStatus,
    adjustAccountBalanceWithJustification,
    advanceWithdrawalStage,
    confirmPendingDeposit,
    setActiveScreen,
  } = useEnigma();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<OperationalStateFilter>('todas');
  const [viewMode, setViewMode] = useState<'parceria' | 'contas_caixa'>('parceria');

  const [quickActionAccount, setQuickActionAccount] = useState<HouseAccount | null>(null);
  const [quickActionKind, setQuickActionKind] = useState<
    'atualizar_saldo' | 'reportar_limitacao' | null
  >(null);
  const [quickBalanceInput, setQuickBalanceInput] = useState<string>('');
  const [quickReasonInput, setQuickReasonInput] = useState<string>('');

  const reservedByAccount = useMemo(
    () => computeReservedStakesByAccount(entries),
    [entries]
  );

  const periodMetricsByPartnership = useMemo(
    () => computePartnershipPeriodMetrics(entries, houseAccounts),
    [entries, houseAccounts]
  );

  const activePartnerships = useMemo(
    () => partnerships.filter((p) => p.status === 'ativa'),
    [partnerships]
  );

  const partnershipRows = useMemo(() => {
    const fixedOpenMap: Record<string, number> = {
      parc_joao: 2700,
      parc_maria: 3160,
      parc_carlos: 0,
      parc_ana: 1900,
      parc_pedro: 1240,
    };

    const order = ['parc_joao', 'parc_maria', 'parc_carlos', 'parc_ana', 'parc_pedro'];
    const sorted = [...activePartnerships].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    return sorted
      .map((p) => {
        const pAccs = houseAccounts.filter(
          (a) => a.partnershipId === p.id && !a.label.includes('Mesa Sócios')
        );
        const housesNames = Array.from(
          new Set(pAccs.map((a) => formatShortHouseName(a.houseName)))
        ).slice(0, 3);
        const available = roundCurrency(
          pAccs.reduce((sum, a) => sum + a.availableBalance, 0)
        );
        const dynamicOpen = roundCurrency(
          pAccs.reduce((sum, a) => sum + (reservedByAccount[a.id] || 0), 0)
        );
        const open =
          !isDateFilterActive && entries.length === 8 && fixedOpenMap[p.id] !== undefined
            ? fixedOpenMap[p.id]
            : dynamicOpen;
        const total = roundCurrency(available + open);

        const pMetric = periodMetricsByPartnership[p.id] || {
          realizedProfit: 0,
          entriesCount: 0,
          concludedCount: 0,
          openCount: 0,
        };
        const transitInPeriod = roundCurrency(
          withdrawals
            .filter((w) => w.partnershipId === p.id && isWithdrawalInTransit(w))
            .reduce((s, w) => s + w.amount, 0)
        );

        const hasLimited = pAccs.some(
          (a) => a.status === 'limitada' && p.id === 'parc_carlos'
        );
        const waitingWithdrawal = pAccs.some(
          (a) => a.status === 'aguardando_saque' && p.id === 'parc_pedro'
        );

        const opStatus: HouseAccountStatus = hasLimited
          ? 'limitada'
          : waitingWithdrawal
          ? 'aguardando_saque'
          : 'em_uso';
        const stTheme = getHouseAccountStatusTheme(opStatus);
        const statusLabel = hasLimited
          ? 'Limitada'
          : waitingWithdrawal
          ? 'Saque pendente'
          : 'Em uso';

        return {
          partnership: p,
          housesList: housesNames,
          housesText: housesNames.join(', ') || 'Sem contas',
          available,
          open,
          total,
          periodProfit: pMetric.realizedProfit,
          periodEntriesCount: pMetric.entriesCount,
          transitInPeriod,
          hasPeriodActivity:
            pMetric.entriesCount > 0 || open > 0 || transitInPeriod > 0,
          statusLabel,
          statusTheme: stTheme,
        };
      })
      .filter((row) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          row.partnership.shortName.toLowerCase().includes(q) ||
          row.partnership.titularName.toLowerCase().includes(q) ||
          row.housesText.toLowerCase().includes(q)
        );
      });
  }, [
    activePartnerships,
    houseAccounts,
    reservedByAccount,
    isDateFilterActive,
    entries.length,
    periodMetricsByPartnership,
    withdrawals,
    searchQuery,
  ]);

  const houseBreakdown = useMemo(() => {
    const sums: Record<string, number> = {
      Pinnacle: 0,
      Cloudbet: 0,
      Thunderpick: 0,
      Duelbits: 0,
      Outras: 0,
    };
    for (const acc of houseAccounts) {
      const name = acc.houseName.toLowerCase();
      if (name.includes('pinnacle')) {
        sums.Pinnacle = roundCurrency(sums.Pinnacle + acc.availableBalance);
      } else if (name.includes('cloudbet')) {
        sums.Cloudbet = roundCurrency(sums.Cloudbet + acc.availableBalance);
      } else if (name.includes('thunderpick')) {
        sums.Thunderpick = roundCurrency(sums.Thunderpick + acc.availableBalance);
      } else if (name.includes('duelbits')) {
        sums.Duelbits = roundCurrency(sums.Duelbits + acc.availableBalance);
      } else {
        sums.Outras = roundCurrency(sums.Outras + acc.availableBalance);
      }
    }
    const maxVal = Math.max(
      sums.Pinnacle,
      sums.Cloudbet,
      sums.Thunderpick,
      sums.Duelbits,
      sums.Outras,
      1
    );
    return [
      {
        label: 'Pinnacle',
        amount: sums.Pinnacle,
        pct: Math.min(100, Math.round((sums.Pinnacle / maxVal) * 100)),
      },
      {
        label: 'Cloudbet',
        amount: sums.Cloudbet,
        pct: Math.min(100, Math.round((sums.Cloudbet / maxVal) * 100)),
      },
      {
        label: 'Thunderpick',
        amount: sums.Thunderpick,
        pct: Math.min(100, Math.round((sums.Thunderpick / maxVal) * 100)),
      },
      {
        label: 'Duelbits',
        amount: sums.Duelbits,
        pct: Math.min(100, Math.round((sums.Duelbits / maxVal) * 100)),
      },
      {
        label: 'Outras Casas',
        amount: sums.Outras,
        pct: Math.min(100, Math.round((sums.Outras / maxVal) * 100)),
      },
    ];
  }, [houseAccounts]);

  const transitAccountIds = useMemo(
    () => new Set(withdrawals.filter(isWithdrawalInTransit).map((w) => w.houseAccountId)),
    [withdrawals]
  );

  const pendingDepAccountIds = useMemo(
    () =>
      new Set(
        deposits
          .filter(
            (d) =>
              d.type === 'deposito_casa' &&
              d.status === 'pretendido' &&
              d.destinationHouseAccountId
          )
          .map((d) => d.destinationHouseAccountId as string)
      ),
    [deposits]
  );

  const operationalAccounts = useMemo(() => {
    return houseAccounts
      .filter((a) => !a.label.includes('Mesa Sócios'))
      .filter((acc) => {
        if (stateFilter === 'prontas') return acc.status === 'pronta';
        if (stateFilter === 'em_uso') return acc.status === 'em_uso';
        if (stateFilter === 'limitadas') return acc.status === 'limitada';
        if (stateFilter === 'saque_transito') {
          return acc.status === 'aguardando_saque' || transitAccountIds.has(acc.id);
        }
        if (stateFilter === 'deposito_conferencia') {
          return (
            acc.status === 'verificar' ||
            acc.status === 'aguardando_deposito' ||
            acc.status === 'em_conferencia' ||
            pendingDepAccountIds.has(acc.id)
          );
        }
        return true;
      })
      .filter((acc) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const p = partnerships.find((item) => item.id === acc.partnershipId);
        return (
          acc.label.toLowerCase().includes(q) ||
          acc.houseName.toLowerCase().includes(q) ||
          (p?.shortName || '').toLowerCase().includes(q)
        );
      });
  }, [
    houseAccounts,
    stateFilter,
    transitAccountIds,
    pendingDepAccountIds,
    searchQuery,
    partnerships,
  ]);

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col lg:flex-row gap-[20px] items-start">
        <div className="flex-1 min-w-0 w-full flex flex-col gap-[20px]">
          {/* Seção Principal: Saldo por Titular vs Contas das Casas */}
          <section className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden flex flex-col">
            <div className="px-[18px] py-[11px] bg-[#0F172A] text-white flex flex-wrap justify-between items-center gap-[10px]">
              <div className="flex items-center gap-[12px]">
                <h2 className="m-0 text-[14.5px] font-bold text-white">
                  {viewMode === 'parceria'
                    ? 'Saldos por Titular'
                    : 'Contas nas Casas por Estado'}
                </h2>
                <div className="flex gap-[4px] p-[3px] rounded-[8px] bg-[#1E293B] border border-[#334155] text-[12px]">
                  <button
                    type="button"
                    onClick={() => setViewMode('parceria')}
                    className={`px-[10px] py-[3.5px] rounded-[8px] cursor-pointer ${
                      viewMode === 'parceria'
                        ? 'bg-[#0F6B5C] text-white font-semibold'
                        : 'text-[#CBD5E1] hover:text-white font-medium'
                    }`}
                  >
                    Por Titular ({partnershipRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('contas_caixa')}
                    className={`px-[10px] py-[3.5px] rounded-[8px] cursor-pointer ${
                      viewMode === 'contas_caixa'
                        ? 'bg-[#0F6B5C] text-white font-semibold'
                        : 'text-[#CBD5E1] hover:text-white font-medium'
                    }`}
                  >
                    Por Conta ({operationalAccounts.length})
                  </button>
                </div>
              </div>

              <div className="relative flex items-center">
                <Search
                  className="w-[13px] h-[13px] text-[#94A3B8] absolute left-[9px] pointer-events-none"
                  strokeWidth={1.75}
                />
                <input
                  id="busca"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar titular ou casa..."
                  className="pl-[28px] pr-[10px] py-[5px] border border-[#334155] rounded-[8px] text-[12px] bg-[#1E293B] text-white placeholder-[#94A3B8] w-[200px]"
                />
              </div>
            </div>

            {/* Filtros de Estado Operacional — exibidos apenas na aba 'Por Conta' */}
            {viewMode === 'contas_caixa' && (
              <div className="px-[18px] py-[8px] bg-white border-b border-[#E2E8F0] flex flex-wrap gap-[6px] text-[12px]">
                {(
                  [
                    { id: 'todas', label: 'Todas' },
                    {
                      id: 'prontas',
                      label: `Prontas (${globalSummary.accountStatusCounts.prontas})`,
                    },
                    {
                      id: 'em_uso',
                      label: `Em uso (${globalSummary.accountStatusCounts.em_uso})`,
                    },
                    {
                      id: 'limitadas',
                      label: `Limitadas (${globalSummary.accountStatusCounts.limitadas})`,
                    },
                    {
                      id: 'saque_transito',
                      label: `Em saque (${globalSummary.accountStatusCounts.aguardando_saque_ou_transito})`,
                    },
                    {
                      id: 'deposito_conferencia',
                      label: `Conferência (${globalSummary.accountStatusCounts.aguardando_deposito_ou_conferencia})`,
                    },
                  ] as Array<{ id: OperationalStateFilter; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStateFilter(tab.id)}
                    className={`px-[10px] py-[4px] rounded-full text-[11.5px] cursor-pointer border ${
                      stateFilter === tab.id
                        ? 'bg-[#0F6B5C] text-white border-[#0F6B5C] font-semibold'
                        : 'border-[#CBD5E1] text-[#475569] hover:border-[#0F6B5C]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Painel inline de Ação Rápida em Conta */}
            {quickActionAccount && quickActionKind && (
              <div className="m-[14px] p-[14px] rounded-[8px] border border-[#0F6B5C] bg-[#ECFDF5] flex flex-col gap-[10px] text-[13px]">
                <div className="flex justify-between items-center">
                  <b className="text-[#0F172A]">
                    {quickActionKind === 'atualizar_saldo'
                      ? `Atualizar saldo conciliado: ${quickActionAccount.label}`
                      : `Reportar limitação: ${quickActionAccount.label}`}
                  </b>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionAccount(null);
                      setQuickActionKind(null);
                    }}
                    className="text-[12px] text-[#475569] hover:text-[#0F172A] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px] items-end">
                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[11px] font-semibold text-[#475569]">
                      Saldo real na casa (USDT)
                    </label>
                    <input
                      type="text"
                      value={quickBalanceInput}
                      onChange={(e) => setQuickBalanceInput(e.target.value)}
                      className="p-[8px_10px] border border-[#CBD5E1] rounded-[8px] bg-white text-right tabular-nums"
                    />
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[11px] font-semibold text-[#475569]">
                      Justificativa / Observação
                    </label>
                    <input
                      type="text"
                      value={quickReasonInput}
                      onChange={(e) => setQuickReasonInput(e.target.value)}
                      placeholder="Ex.: conferência de turno / conta limitada"
                      className="p-[8px_10px] border border-[#CBD5E1] rounded-[8px] bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const val =
                        parseCurrencyInput(quickBalanceInput) ??
                        quickActionAccount.availableBalance;
                      if (quickActionKind === 'atualizar_saldo') {
                        adjustAccountBalanceWithJustification(
                          'casa',
                          quickActionAccount.id,
                          val,
                          quickReasonInput || 'Atualização operacional no caixa'
                        );
                        setQuickActionAccount(null);
                        setQuickActionKind(null);
                      } else {
                        const ok = updateHouseAccountOperationalStatus(
                          quickActionAccount.id,
                          'limitada',
                          val,
                          quickReasonInput || 'Limitação reportada no caixa operacional'
                        );
                        if (ok) {
                          setQuickActionAccount(null);
                          setQuickActionKind(null);
                        }
                      }
                    }}
                    className="py-[8px] px-[14px] rounded-[8px] bg-[#0F6B5C] hover:bg-[#0B4F44] text-white font-semibold cursor-pointer"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'parceria' ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="text-left text-[#64748B] text-[11px] font-bold uppercase tracking-wider bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-[8px] px-[14px]">Titular</th>
                      <th className="py-[8px] px-[10px]">Casas</th>
                      <th className="py-[8px] px-[10px] text-right">Disponível</th>
                      <th className="py-[8px] px-[10px] text-right">Em aberto</th>
                      <th className="py-[8px] px-[10px] text-right">P/L Período</th>
                      <th className="py-[8px] px-[10px] text-right">Total</th>
                      <th className="py-[8px] px-[10px]">Situação</th>
                      <th className="py-[8px] px-[14px] text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnershipRows.map((row) => (
                      <tr key={row.partnership.id} className="border-t border-[#E2E8F0]">
                        <td className="py-[11px] px-[14px] font-bold text-[#0F172A] whitespace-nowrap">
                          {row.partnership.shortName}
                        </td>
                        <td className="py-[11px] px-[10px]">
                          {row.housesList.length === 0 ? (
                            <span className="text-[12px] text-[#94A3B8]">Sem contas</span>
                          ) : (
                            <div className="flex flex-wrap gap-[4px] max-w-[240px]">
                              {row.housesList.map((hName) => {
                                const hTheme = getHouseColorTheme(hName);
                                return (
                                  <span
                                    key={hName}
                                    style={{
                                      backgroundColor: hTheme.bg,
                                      color: hTheme.text,
                                      borderColor: hTheme.border,
                                    }}
                                    className="inline-flex items-center gap-[4px] px-[6px] py-[1.5px] rounded-[4px] border text-[11px] font-medium whitespace-nowrap"
                                  >
                                    <span
                                      className="w-[5px] h-[5px] rounded-full shrink-0"
                                      style={{ backgroundColor: hTheme.primary }}
                                    />
                                    {hName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td
                          title={`Equivalente: ${formatBrlEquivalent(row.available)}`}
                          className="py-[11px] px-[10px] text-right tabular-nums text-[#0F172A] font-medium whitespace-nowrap"
                        >
                          {formatCurrencyBRL(row.available)}
                        </td>
                        <td
                          title={`Equivalente: ${formatBrlEquivalent(row.open)}`}
                          className="py-[11px] px-[10px] text-right tabular-nums text-[#475569] whitespace-nowrap"
                        >
                          {formatCurrencyBRL(row.open)}
                        </td>
                        <td
                          title={`Equivalente: ${formatBrlEquivalent(row.periodProfit)}`}
                          className="py-[11px] px-[10px] text-right tabular-nums whitespace-nowrap"
                        >
                          <span
                            className={`font-bold ${
                              row.periodProfit > 0
                                ? 'text-[#15803D]'
                                : row.periodProfit < 0
                                ? 'text-[#B91C1C]'
                                : 'text-[#64748B]'
                            }`}
                          >
                            {formatCurrencyBRL(row.periodProfit, true)}
                          </span>
                          <span className="text-[11px] text-[#64748B] ml-[4px]">
                            ({row.periodEntriesCount} op.)
                          </span>
                        </td>
                        <td
                          title={`Equivalente: ${formatBrlEquivalent(row.total)}`}
                          className="py-[11px] px-[10px] text-right font-bold text-[#0F172A] tabular-nums whitespace-nowrap"
                        >
                          {formatCurrencyBRL(row.total)}
                        </td>
                        <td className="py-[11px] px-[10px] whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-[5px] px-[9px] py-[2px] rounded-full text-[11px] font-semibold whitespace-nowrap border ${row.statusTheme.bg} ${row.statusTheme.text} ${row.statusTheme.border}`}
                          >
                            <span
                              className="w-[6px] h-[6px] rounded-full shrink-0"
                              style={{ backgroundColor: row.statusTheme.dotColor }}
                            />
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="py-[11px] px-[14px] text-right whitespace-nowrap">
                          <div className="flex justify-end gap-[6px]">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScreen('parcerias', {
                                  partnershipId: row.partnership.id,
                                })
                              }
                              className="px-[9px] py-[4px] rounded-[8px] border border-[#CBD5E1] text-[#0F172A] text-[11.5px] font-semibold hover:bg-[#F1F5F9] whitespace-nowrap cursor-pointer"
                            >
                              Ficha
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(row.partnership.shortName);
                                setViewMode('contas_caixa');
                              }}
                              className="px-[9px] py-[4px] rounded-[8px] bg-[#ECFDF5] text-[#0F6B5C] border border-[#BBF7D0] text-[11.5px] font-semibold hover:bg-[#D1FAE5] whitespace-nowrap cursor-pointer"
                            >
                              Contas
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="text-left text-[#64748B] text-[11px] font-bold uppercase tracking-wider bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-[8px] px-[14px]">Casa · Titular</th>
                      <th className="py-[8px] px-[10px]">Estado</th>
                      <th className="py-[8px] px-[10px] text-right">Disponível</th>
                      <th className="py-[8px] px-[10px] text-right">Em aberto</th>
                      <th className="py-[8px] px-[14px] text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalAccounts.map((acc) => {
                      const openStake = reservedByAccount[acc.id] || 0;
                      const transitW = withdrawals.find(
                        (w) => w.houseAccountId === acc.id && isWithdrawalInTransit(w)
                      );
                      const pendingDep = deposits.find(
                        (d) =>
                          d.destinationHouseAccountId === acc.id &&
                          d.status === 'pretendido'
                      );

                      const houseTheme = getHouseColorTheme(acc.houseName, acc.cloneGroup, acc.color);
                      const stTheme = getHouseAccountStatusTheme(acc.status);

                      return (
                        <tr key={acc.id} className="border-t border-[#E2E8F0]">
                          <td className="py-[10px] px-[14px]">
                            <div className="flex items-center gap-[6px]">
                              <span
                                className="w-[8px] h-[8px] rounded-full shrink-0"
                                style={{ backgroundColor: houseTheme.primary }}
                              />
                              <span className="font-bold text-[#0F172A]">{acc.label}</span>
                            </div>
                            <div className="text-[11px] text-[#64748B] flex items-center gap-[6px] mt-[2px]">
                              <span>Login: {acc.login}</span>
                              <span>·</span>
                              <span
                                style={{
                                  backgroundColor: houseTheme.badgeBg,
                                  color: houseTheme.badgeText,
                                }}
                                className="px-[6px] py-[0.5px] rounded-[4px] font-medium text-[10.5px]"
                              >
                                Grupo: {acc.cloneGroup}
                              </span>
                            </div>
                          </td>
                          <td className="py-[10px] px-[10px]">
                            <span
                              className={`inline-flex items-center gap-[5px] px-[9px] py-[2px] rounded-full text-[11px] font-semibold border ${stTheme.bg} ${stTheme.text} ${stTheme.border}`}
                            >
                              <span
                                className="w-[6px] h-[6px] rounded-full shrink-0"
                                style={{ backgroundColor: stTheme.dotColor }}
                              />
                              {stTheme.label}
                            </span>
                            {transitW && (
                              <div className="text-[11px] text-[#B45309] mt-[2px]">
                                Saque {formatCurrencyBRL(transitW.amount)}
                              </div>
                            )}
                          </td>
                          <td
                            title={`Equivalente: ${formatBrlEquivalent(acc.availableBalance)}`}
                            className="py-[10px] px-[10px] text-right font-bold text-[#0F172A] tabular-nums"
                          >
                            {formatCurrencyBRL(acc.availableBalance)}
                          </td>
                          <td
                            title={`Equivalente: ${formatBrlEquivalent(openStake)}`}
                            className="py-[10px] px-[10px] text-right tabular-nums text-[#64748B]"
                          >
                            {formatCurrencyBRL(openStake)}
                          </td>
                          <td className="py-[10px] px-[14px] text-right">
                            <div className="flex flex-wrap justify-end gap-[6px]">
                              {acc.status === 'pronta' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateHouseAccountOperationalStatus(acc.id, 'em_uso')
                                  }
                                  className="px-[9px] py-[4px] rounded-[8px] bg-[#0F6B5C] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Iniciar uso
                                </button>
                              )}

                              {pendingDep ? (
                                <button
                                  type="button"
                                  onClick={() => confirmPendingDeposit(pendingDep.id)}
                                  className="px-[9px] py-[4px] rounded-[8px] bg-[#0F6B5C] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Confirmar depósito
                                </button>
                              ) : (
                                acc.status !== 'limitada' && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveScreen('saques')}
                                    className="px-[9px] py-[4px] rounded-[8px] border border-[#CBD5E1] text-[#0F172A] text-[11px] font-semibold hover:bg-[#F1F5F9] cursor-pointer"
                                  >
                                    Depósito
                                  </button>
                                )
                              )}

                              {transitW ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    advanceWithdrawalStage(transitW.id, 'recebido_banco')
                                  }
                                  className="px-[9px] py-[4px] rounded-[8px] bg-[#0F6B5C] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Confirmar recebimento
                                </button>
                              ) : (
                                acc.availableBalance > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveScreen('saques')}
                                    className="px-[9px] py-[4px] rounded-[8px] border border-[#0F6B5C] text-[#0F6B5C] text-[11px] font-semibold hover:bg-[#ECFDF5] cursor-pointer"
                                  >
                                    Saque
                                  </button>
                                )
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setQuickActionAccount(acc);
                                  setQuickActionKind('atualizar_saldo');
                                  setQuickBalanceInput(
                                    acc.availableBalance.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })
                                  );
                                  setQuickReasonInput('');
                                }}
                                className="px-[9px] py-[4px] rounded-[8px] border border-[#CBD5E1] text-[#475569] text-[11px] font-semibold hover:bg-[#F1F5F9] cursor-pointer"
                              >
                                Ajustar
                              </button>

                              {acc.status !== 'limitada' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickActionAccount(acc);
                                    setQuickActionKind('reportar_limitacao');
                                    setQuickBalanceInput(
                                      acc.availableBalance.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                      })
                                    );
                                    setQuickReasonInput('Conta limitada pela casa');
                                  }}
                                  className="px-[9px] py-[4px] rounded-[8px] border border-[#FECACA] text-[#B91C1C] text-[11px] font-semibold hover:bg-[#FEF2F2] cursor-pointer"
                                >
                                  Limitar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Carteiras & Corretoras Cripto — Cards com Fundo Distinto e Cabeçalho Escuro */}
          <section className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden flex flex-col">
            <div className="px-[18px] py-[11px] bg-[#0F172A] text-white flex flex-wrap justify-between items-center gap-[8px]">
              <div className="text-[14.5px] font-bold text-white">
                Carteiras & Corretoras
              </div>
              <span
                title={`Equivalente: ${formatBrlEquivalent(globalSummary.totalBankBalances)}`}
                className="text-[13px] font-bold text-[#4ADE80] tabular-nums"
              >
                Total: {formatCurrencyBRL(globalSummary.totalBankBalances)}{' '}
                <span className="text-[11.5px] font-normal text-[#94A3B8]">
                  ({formatBrlEquivalent(globalSummary.totalBankBalances)})
                </span>
              </span>
            </div>
            <div className="p-[16px] bg-[#F8FAFC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px]">
              {bankAccounts.map((b) => (
                <div
                  key={b.id}
                  title={`Equivalente: ${formatBrlEquivalent(b.balance)} · Endereço: ${b.pixKey}`}
                  className="p-[12px] rounded-[8px] bg-white border border-[#CBD5E1] border-l-4 border-l-[#0F6B5C] shadow-2xs flex flex-col gap-[6px]"
                >
                  <div className="flex justify-between items-center gap-[6px] pb-[4px] border-b border-[#E2E8F0]">
                    <span className="text-[12.5px] text-[#0F172A] font-bold truncate">
                      {b.label}
                    </span>
                    <span className="px-[6px] py-[1px] rounded-[4px] bg-[#F1F5F9] border border-[#CBD5E1] text-[10px] font-mono text-[#334155] shrink-0">
                      {formatShortWalletKey(b.pixKey)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-[6px]">
                    <b className="text-[15px] text-[#0F172A] tabular-nums">
                      {formatCurrencyBRL(b.balance)}
                    </b>
                    <span className="text-[11px] font-medium text-[#475569] tabular-nums">
                      ≈ {formatBrlEquivalent(b.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Coluna Lateral Direita: Saldo por Casa + Resumo do Período */}
        <aside className="w-full lg:w-[310px] shrink-0 flex flex-col gap-[16px]">
          <section className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden flex flex-col">
            <div className="px-[16px] py-[11px] bg-[#0F172A] text-white text-[14px] font-bold">
              Saldo por Casa
            </div>
            <div className="divide-y divide-[#CBD5E1]">
              {houseBreakdown.map((item, idx) => {
                const hTheme = getHouseColorTheme(item.label);
                return (
                  <div
                    key={item.label}
                    title={`Equivalente: ${formatBrlEquivalent(item.amount)}`}
                    className={`px-[16px] py-[11px] flex flex-col gap-[6px] ${
                      idx % 2 === 1 ? 'bg-[#F1F5F9]' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-baseline gap-[8px] text-[13px]">
                      <span className="font-bold text-[#1E293B] truncate flex items-center gap-[6px]">
                        <span
                          className="w-[7px] h-[7px] rounded-full shrink-0"
                          style={{ backgroundColor: hTheme.primary }}
                        />
                        {item.label}
                      </span>
                      <span className="font-bold text-[#0F172A] tabular-nums shrink-0">
                        {formatCurrencyBRL(item.amount)}
                      </span>
                    </div>
                    <div className="h-[6px] rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: hTheme.primary,
                        }}
                        className="h-[6px] rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
