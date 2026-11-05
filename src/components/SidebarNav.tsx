import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ClipboardList,
  Calendar,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  formatBrlEquivalent,
  formatCurrencyBRL,
  isWithdrawalInTransit,
} from '../domain/ledger.ts';
import type { ScreenId } from '../domain/types.ts';

interface SubTabItem {
  id: ScreenId;
  label: string;
  shortLabel: string;
  badge?: number;
  badgeColor?: 'red' | 'amber' | 'emerald';
  hidden?: boolean;
}

interface MainGroupItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  defaultScreen: ScreenId;
  screens: ScreenId[];
  badge?: number;
  badgeColor?: 'red' | 'amber' | 'emerald';
  subTabs: SubTabItem[];
}

export const EnigmaHexLogoIcon: React.FC<{ className?: string; strokeColor?: string }> = ({
  className = 'w-[26px] h-[26px] shrink-0',
  strokeColor = '#10B981',
}) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M14 2.5L24.5 8.5V19.5L14 25.5L3.5 19.5V8.5L14 2.5Z"
      stroke={strokeColor}
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <path
      d="M14 2.5V14M14 14L24.5 8.5M14 14L3.5 8.5M14 14V25.5M8.5 16.5L14 19.5L19.5 16.5"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SidebarNav: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    currentUser,
    logoutUser,
    pendingUsersCount,
    divergences,
    withdrawals,
    deposits,
    entries,
    houseAccounts,
    globalSummary,
    operationalMonth,
    operationalYear,
    operationalMonthYearLabel,
    systemVersion,
    usdtBrlRate,
    operatorPreferredExchange,
  } = useEnigma();

  const headerRef = useRef<HTMLElement | null>(null);
  const [barWidth, setBarWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const updateWidth = () => {
      const w = headerRef.current?.clientWidth || window.innerWidth;
      setBarWidth(w);
    };
    updateWidth();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      ro = new ResizeObserver(() => updateWidth());
      ro.observe(headerRef.current);
    }
    window.addEventListener('resize', updateWidth);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Níveis progressivos de compactação calibrados para zero colisão em qualquer zoom / resolução
  const isShortLabels = barWidth < 1380; // ~105%+ zoom: encurta rótulos e simplifica textos secundários
  const isIconNav = barWidth < 1180; // ~120%+ zoom: abas principais passam para ícones puros (+ badge)
  const isCompactRight = barWidth < 980; // ~140%+ zoom: botões do lado direito simplificam para ícones
  const isUltraIcon = barWidth < 740; // ~175%+ zoom: tudo estritamente em ícones compactos em linha única
  const isExtremeZoom = barWidth < 520; // ~250%-400% zoom: remove botões redundantes
  const isMicroZoom = barWidth < 400; // ~400%-500% zoom: dimensões e paddings ultra compactos
  const isCompact = isShortLabels; // retrocompatibilidade com sub-rótulos

  const isOperator = currentUser.role === 'operador';
  const isAdmin = currentUser.role === 'admin';

  const openDivergencesCount = divergences.filter((d) => d.status !== 'resolvida').length;
  const transitCount = withdrawals.filter(isWithdrawalInTransit).length;
  const pendingDepositsCount = deposits.filter(
    (d) => d.type === 'deposito_casa' && d.status === 'pretendido'
  ).length;
  const limitedWithBalanceCount = houseAccounts.filter(
    (a) => a.status === 'limitada' && a.availableBalance > 0
  ).length;
  const weeklyFacialCount = houseAccounts.filter((a) => a.weeklyFacialPending).length;
  const incompleteEntriesCount = entries.filter((e) => e.resultStatus !== 'concluida').length;

  const totalPendenciasCount =
    transitCount + pendingDepositsCount + limitedWithBalanceCount + weeklyFacialCount ||
    incompleteEntriesCount;

  const shortPeriodLabel = `${String(operationalMonth).padStart(2, '0')}/${String(
    operationalYear
  ).slice(-2)}`;

  const mainGroups: MainGroupItem[] = [
    {
      id: 'grp_visao',
      label: 'Visão Geral',
      shortLabel: 'Visão',
      icon: <LayoutDashboard className="w-[15px] h-[15px] shrink-0" strokeWidth={1.85} />,
      defaultScreen: 'visao_geral',
      screens: ['visao_geral', 'minha_performance'],
      subTabs: [
        { id: 'visao_geral', label: 'Resumo Geral', shortLabel: 'Resumo' },
        { id: 'minha_performance', label: 'Minha Performance', shortLabel: 'Performance' },
      ],
    },
    {
      id: 'grp_entradas',
      label: 'Entradas',
      shortLabel: 'Entradas',
      icon: <ClipboardList className="w-[15px] h-[15px] shrink-0" strokeWidth={1.85} />,
      defaultScreen: 'entradas',
      screens: ['entradas'],
      badge: incompleteEntriesCount > 0 ? incompleteEntriesCount : undefined,
      badgeColor: 'amber',
      subTabs: [
        {
          id: 'entradas',
          label: 'Operações',
          shortLabel: 'Operações',
          badge: incompleteEntriesCount > 0 ? incompleteEntriesCount : undefined,
          badgeColor: 'amber',
        },
      ],
    },
    {
      id: 'grp_caixa',
      label: 'Caixa & Saques',
      shortLabel: 'Caixa',
      icon: <ArrowLeftRight className="w-[15px] h-[15px] shrink-0" strokeWidth={1.85} />,
      defaultScreen: 'saques',
      screens: ['saques', 'saldos', 'conferencia', 'pendencias'],
      badge:
        openDivergencesCount > 0
          ? openDivergencesCount
          : totalPendenciasCount > 0
          ? totalPendenciasCount
          : undefined,
      badgeColor: openDivergencesCount > 0 ? 'red' : 'amber',
      subTabs: [
        {
          id: 'saques',
          label: 'Saques & Depósitos',
          shortLabel: 'Saques',
          badge: transitCount > 0 ? transitCount : undefined,
          badgeColor: 'amber',
        },
        {
          id: 'saldos',
          label: isOperator ? 'Meus Saldos' : 'Saldos & Caixa',
          shortLabel: 'Saldos',
        },
        {
          id: 'conferencia',
          label: 'Conferência',
          shortLabel: 'Conferência',
          badge: openDivergencesCount > 0 ? openDivergencesCount : undefined,
          badgeColor: 'red',
        },
        {
          id: 'pendencias',
          label: 'Pendências',
          shortLabel: 'Pendências',
          badge: totalPendenciasCount > 0 ? totalPendenciasCount : undefined,
          badgeColor: 'amber',
        },
      ],
    },
    {
      id: 'grp_parcerias',
      label: 'Parcerias & Contas',
      shortLabel: 'Parcerias',
      icon: <Users className="w-[15px] h-[15px] shrink-0" strokeWidth={1.85} />,
      defaultScreen: 'parcerias',
      screens: ['parcerias', 'estoque'],
      subTabs: [
        {
          id: 'parcerias',
          label: isOperator ? 'Minhas Parcerias' : 'Titulares em Operação',
          shortLabel: 'Titulares',
        },
        { id: 'estoque', label: 'Estoque de Parcerias', shortLabel: 'Estoque' },
      ],
    },
    {
      id: 'grp_financeiro',
      label: isOperator ? 'Meus Custos' : 'Financeiro & Equipe',
      shortLabel: isOperator ? 'Custos' : 'Financeiro',
      icon: <Wallet className="w-[15px] h-[15px] shrink-0" strokeWidth={1.85} />,
      defaultScreen: 'custos',
      screens: ['custos', 'equipe'],
      subTabs: isOperator
        ? [{ id: 'custos', label: 'Meus Custos & Líquido', shortLabel: 'Custos' }]
        : [
            { id: 'custos', label: 'Custos & Líquido', shortLabel: 'Custos' },
            {
              id: 'equipe',
              label: 'Equipe & Operadores',
              shortLabel: 'Equipe',
              hidden: isOperator,
            },
          ],
    },
  ];

  const activeGroup = mainGroups.find((g) => g.screens.includes(activeScreen)) || null;
  const visibleSubTabs = (activeGroup?.subTabs || []).filter((t) => !t.hidden);
  const versionTag =
    systemVersion === 'v1_bancos_pix'
      ? 'v1.0'
      : systemVersion === 'v1_5_hibrido'
      ? 'v1.5'
      : 'v2.0';

  return (
    <header
      ref={headerRef}
      aria-label="Navegação principal Enigma"
      className="w-full sticky top-0 z-30 flex flex-col select-none"
    >
      {/* Topbar Principal — Mesma Identidade da Tela de Login (Cubo Hexagonal + ENIGMA. + GRUPO · GESTÃO) em 1 linha */}
      <div className="w-full bg-[#111815] text-[#F7F8F7] px-[6px] sm:px-[14px] md:px-[20px] h-[52px] flex flex-nowrap items-center justify-between gap-[4px] sm:gap-[10px] border-b border-[#1E2B25] whitespace-nowrap overflow-x-auto no-scrollbar">
        {/* Esquerda: Marca Oficial ENIGMA. + 5 Abas Principais */}
        <div className="flex flex-nowrap items-center gap-[4px] sm:gap-[8px] shrink-0">
          <button
            type="button"
            onClick={() => setActiveScreen('visao_geral')}
            title={`ENIGMA. Grupo · Gestão de Operações (${versionTag}) — “Cadê o dinheiro que estava aqui?”`}
            className="flex flex-nowrap items-center gap-[6px] sm:gap-[8px] text-left cursor-pointer shrink-0 group"
          >
            <div className={`${isMicroZoom ? 'w-[26px] h-[26px]' : 'w-[30px] h-[30px]'} rounded-[7px] bg-[#18241F] border border-[#263830] group-hover:border-[#0D6E57] flex items-center justify-center shrink-0`}>
              <EnigmaHexLogoIcon className={isMicroZoom ? 'w-[16px] h-[16px]' : 'w-[20px] h-[20px]'} strokeColor="#10B981" />
            </div>
            {!isUltraIcon && (
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-[4px]">
                  <span className="text-[15px] font-extrabold tracking-[-0.02em] text-white">
                    ENIGMA<span className="text-[#10B981]">.</span>
                  </span>
                  {!isCompactRight && (
                    <span className="px-[4px] py-[1px] rounded-[3px] bg-[#18241F] border border-[#263830] text-[#8FA39B] text-[9px] font-semibold">
                      {versionTag}
                    </span>
                  )}
                </div>
                {!isShortLabels && (
                  <span className="text-[8px] font-semibold tracking-[0.13em] uppercase text-[#8FA39B] mt-[2px]">
                    GRUPO · GESTÃO DE OPERAÇÕES
                  </span>
                )}
              </div>
            )}
          </button>

          {/* 5 Abas Principais — Texto completo -> Texto curto -> Apenas Ícones */}
          <nav className={`flex flex-nowrap items-center ${isMicroZoom ? 'gap-[1.5px] p-[2px]' : 'gap-[2.5px] p-[3px]'} bg-[#18241F] rounded-[8px] border border-[#263830] shrink-0`}>
            {mainGroups.map((group) => {
              const isGroupActive = group.screens.includes(activeScreen);
              return (
                <button
                  key={group.id}
                  type="button"
                  title={group.label}
                  aria-label={group.label}
                  onClick={() => setActiveScreen(group.defaultScreen)}
                  className={`relative ${
                    isMicroZoom
                      ? 'px-[6px] py-[4.5px]'
                      : isIconNav
                      ? 'px-[8px] py-[5px]'
                      : 'px-[10px] py-[5px]'
                  } rounded-[6px] text-[12px] flex flex-nowrap items-center gap-[4px] cursor-pointer shrink-0 transition-colors ${
                    isGroupActive
                      ? 'bg-[#0A6C54] text-white font-semibold'
                      : 'text-[#9AB0A6] hover:bg-[#22332C] hover:text-white font-medium'
                  }`}
                >
                  <span className={isGroupActive ? 'text-white' : 'text-[#9AB0A6]'}>
                    {group.icon}
                  </span>
                  {!isIconNav && (
                    <span>{isShortLabels ? group.shortLabel : group.label}</span>
                  )}
                  {group.badge !== undefined && (
                    <span
                      className={`${isMicroZoom ? 'text-[8.5px] px-[4px] py-[0.5px]' : 'text-[9.5px] px-[5px] py-[0.5px]'} font-bold rounded-full tabular-nums leading-none ${
                        group.badgeColor === 'red'
                          ? 'bg-[#FEF2F2] text-[#B91C1C]'
                          : isGroupActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#FFFBEB] text-[#B45309]'
                      }`}
                    >
                      {group.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Direita: Resumo Global Compacto + Período + Configurações + Perfil (tudo em 1 linha) */}
        <div className="flex flex-nowrap items-center gap-[3px] sm:gap-[6px] shrink-0">
          {/* Pílula Global Banca & Mês — centralizada no topo */}
          {!isUltraIcon && (
            <button
              type="button"
              onClick={() => setActiveScreen('saldos')}
              title={`Banca Total: ${formatCurrencyBRL(
                globalSummary.totalOperationalCapital
              )} (${formatBrlEquivalent(
                globalSummary.totalOperationalCapital
              )}) · Lucro Mês: ${formatCurrencyBRL(
                globalSummary.realizedProfitMonth,
                true
              )} (${formatBrlEquivalent(globalSummary.realizedProfitMonth)})`}
              className="px-[8px] py-[4.5px] rounded-[7px] bg-[#18241F] border border-[#263830] hover:border-[#0D6E57] flex flex-nowrap items-center gap-[6px] text-[11px] cursor-pointer shrink-0"
            >
              <span className="text-[#9AB0A6]">
                {!isCompactRight && 'Banca: '}
                <b className="text-white tabular-nums">
                  {formatCurrencyBRL(globalSummary.totalOperationalCapital)}
                </b>
              </span>
              {!isShortLabels && (
                <>
                  <span className="h-[10px] w-[1px] bg-[#263830]" />
                  <span className="text-[#9AB0A6]">
                    Mês:{' '}
                    <b className="text-[#34D399] tabular-nums">
                      {formatCurrencyBRL(globalSummary.realizedProfitMonth, true)}
                    </b>
                  </span>
                </>
              )}
            </button>
          )}

          {/* Botão Período — em zoom extremo (>300%), omitido para evitar duplicar acesso com o botão Configurações */}
          {!isExtremeZoom && (
            <button
              type="button"
              onClick={() => setActiveScreen('configuracoes')}
              title={`Período Operacional: ${operationalMonthYearLabel} · ${operatorPreferredExchange} (1 USDT = R$ ${usdtBrlRate
                .toFixed(2)
                .replace('.', ',')})`}
              aria-label={`Período Operacional: ${operationalMonthYearLabel}`}
              className="px-[8px] py-[5px] rounded-[7px] bg-[#18241F] border border-[#263830] hover:border-[#0D6E57] text-[11.5px] text-[#E2ECE8] flex flex-nowrap items-center gap-[4px] cursor-pointer shrink-0"
            >
              <Calendar className="w-[13px] h-[13px] text-[#9AB0A6] shrink-0" strokeWidth={1.85} />
              {!isUltraIcon && (
                <b className="text-white font-semibold tabular-nums text-[11px]">
                  {shortPeriodLabel}
                </b>
              )}
            </button>
          )}

          {/* Botão Configurações */}
          <button
            type="button"
            onClick={() => setActiveScreen('configuracoes')}
            title="Configurações"
            aria-label="Configurações"
            className={`${isMicroZoom ? 'px-[6px] py-[4.5px]' : 'px-[8px] py-[5px]'} rounded-[7px] text-[11.5px] font-medium flex flex-nowrap items-center gap-[4px] border cursor-pointer shrink-0 ${
              activeScreen === 'configuracoes'
                ? 'bg-[#0A6C54] border-[#0A6C54] text-white font-semibold'
                : 'bg-[#18241F] border-[#263830] text-[#E2ECE8] hover:bg-[#22332C] hover:text-white'
            }`}
          >
            <Settings className="w-[13px] h-[13px] shrink-0" strokeWidth={1.85} />
            {!isShortLabels && <span>Configurações</span>}
            {isAdmin && pendingUsersCount > 0 && (
              <span className="px-[5px] py-[0.5px] rounded-full bg-[#FFFBEB] text-[#B45309] text-[9.5px] font-bold tabular-nums">
                {pendingUsersCount}
              </span>
            )}
          </button>

          {/* Perfil + Sair */}
          <div className="flex flex-nowrap items-center gap-[3px] sm:gap-[5px] pl-[3px] sm:pl-[5px] border-l border-[#263830] shrink-0">
            {isCompactRight ? (
              <span
                title={`${currentUser.shortName} (${
                  isAdmin ? 'Admin' : isOperator ? 'Operador' : 'Sócio'
                })`}
                className={`${isMicroZoom ? 'w-[24px] h-[24px] text-[10px]' : 'w-[26px] h-[26px] text-[10.5px]'} rounded-full bg-[#18241F] border border-[#263830] text-[#E2ECE8] font-bold inline-flex items-center justify-center shrink-0`}
              >
                <User className={isMicroZoom ? 'w-[11px] h-[11px]' : 'w-[12px] h-[12px]'} strokeWidth={1.85} />
              </span>
            ) : (
              <>
                <span className="text-[11.5px] font-semibold text-white">
                  {currentUser.shortName}
                </span>
                {!isShortLabels && (
                  <span
                    className={`px-[5px] py-[0.5px] rounded-full text-[9.5px] font-semibold uppercase ${
                      isOperator
                        ? 'bg-[#FFFBEB] text-[#B45309]'
                        : 'bg-[#18241F] text-[#E2ECE8] border border-[#263830]'
                    }`}
                  >
                    {isAdmin ? 'Admin' : isOperator ? 'Operador' : 'Sócio'}
                  </span>
                )}
              </>
            )}

            <button
              type="button"
              onClick={logoutUser}
              title={`Sair (${currentUser.shortName})`}
              aria-label="Sair da conta"
              className={`${isMicroZoom ? 'px-[5px] py-[4.5px]' : 'px-[7px] py-[5px]'} rounded-[7px] bg-[#18241F] border border-[#263830] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#B91C1C] text-[#9AB0A6] text-[11px] font-medium flex flex-nowrap items-center gap-[3px] cursor-pointer shrink-0`}
            >
              <LogOut className="w-[13px] h-[13px] shrink-0" strokeWidth={1.85} />
              {!isCompactRight && <span>Sair</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-barra Contextual + Resumo Operacional Global no Topo (1 linha única) */}
      <div className="w-full bg-[#18241F] border-b border-[#263830] px-[6px] sm:px-[14px] md:px-[20px] py-[5px] flex flex-nowrap items-center justify-between gap-[6px] sm:gap-[12px] whitespace-nowrap overflow-x-auto no-scrollbar">
        <div className="flex flex-nowrap items-center gap-[5px] shrink-0">
          {!isCompactRight && activeGroup && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8FA39B] mr-[2px] shrink-0">
              {activeGroup.shortLabel}:
            </span>
          )}
          {visibleSubTabs.map((sub) => {
            const isSubActive = activeScreen === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                title={sub.label}
                onClick={() => setActiveScreen(sub.id)}
                className={`${
                  isMicroZoom ? 'px-[7px] py-[3px] text-[11px]' : 'px-[9px] py-[3.5px] text-[11.5px]'
                } rounded-[6px] flex flex-nowrap items-center gap-[4px] cursor-pointer shrink-0 transition-colors ${
                  isSubActive
                    ? 'bg-[#0A6C54] text-white font-semibold'
                    : 'bg-[#111815]/70 text-[#CFE0D9] hover:bg-[#22332C] hover:text-white font-medium border border-[#263830]'
                }`}
              >
                <span>{isShortLabels ? sub.shortLabel : sub.label}</span>
                {sub.badge !== undefined && (
                  <span
                    className={`px-[5px] py-[0.5px] rounded-full text-[9.5px] font-bold tabular-nums ${
                      sub.badgeColor === 'red'
                        ? 'bg-[#FEF2F2] text-[#B91C1C]'
                        : isSubActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FFFBEB] text-[#B45309]'
                    }`}
                  >
                    {sub.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Indicadores Globais Centralizados no Topo (Casas · Em Aberto · Trânsito · Carteiras · Cotação) */}
        {!isUltraIcon && (
          <div className="flex flex-nowrap items-center gap-[8px] sm:gap-[10px] text-[11px] sm:text-[11.5px] text-[#9AB0A6] shrink-0">
            <span
              title={`Disponível nas Casas: ${formatBrlEquivalent(
                globalSummary.availableInHouses
              )} (${globalSummary.activeAccountsCount} contas ativas)`}
            >
              Casas:{' '}
              <b className="text-[#F7F8F7] tabular-nums">
                {formatCurrencyBRL(globalSummary.availableInHouses)}
              </b>
            </span>
            {!isCompactRight && (
              <>
                <span className="text-[#3A4F46]">·</span>
                <span
                  title={`Em Apostas Abertas: ${formatBrlEquivalent(
                    globalSummary.reservedInOpenBets
                  )} (${globalSummary.openBetsCount} op.)`}
                >
                  Aberto:{' '}
                  <b className="text-[#F7F8F7] tabular-nums">
                    {formatCurrencyBRL(globalSummary.reservedInOpenBets)}
                  </b>
                </span>
                <span className="text-[#3A4F46]">·</span>
                <span
                  title={`Saques em Trânsito: ${formatBrlEquivalent(
                    globalSummary.inTransitWithdrawals
                  )}`}
                >
                  Trânsito:{' '}
                  <b className="text-[#FBBF24] tabular-nums">
                    {formatCurrencyBRL(globalSummary.inTransitWithdrawals)}
                  </b>
                </span>
              </>
            )}
            {!isShortLabels && (
              <>
                <span className="text-[#3A4F46]">·</span>
                <span
                  title={`Saldo em Carteiras & Corretoras: ${formatBrlEquivalent(
                    globalSummary.totalBankBalances
                  )}`}
                >
                  Carteiras:{' '}
                  <b className="text-[#34D399] tabular-nums">
                    {formatCurrencyBRL(globalSummary.totalBankBalances)}
                  </b>
                </span>
                <span className="text-[#3A4F46]">·</span>
                <button
                  type="button"
                  onClick={() => setActiveScreen('configuracoes')}
                  title="Clique para ajustar corretora ou cotação USDT/BRL"
                  className="px-[7px] py-[1.5px] rounded-[6px] bg-[#111815] border border-[#263830] text-[#CFE0D9] hover:text-white text-[11px] tabular-nums cursor-pointer"
                >
                  {operatorPreferredExchange} · 1 USDT = R${' '}
                  {usdtBrlRate.toFixed(2).replace('.', ',')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
