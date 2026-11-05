/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { EnigmaProvider, useEnigma } from './context/EnigmaContext.tsx';
import { AppearanceProvider } from './context/AppearanceContext.tsx';
import { SidebarNav } from './components/SidebarNav.tsx';
import { ScrollspyScreenGroup } from './components/ScrollspyScreenGroup.tsx';
import { VisaoGeralScreen } from './screens/VisaoGeralScreen.tsx';
import { EntradasScreen } from './screens/EntradasScreen.tsx';
import { SaquesScreen } from './screens/SaquesScreen.tsx';
import { ConferenciaScreen } from './screens/ConferenciaScreen.tsx';
import { PendenciasScreen } from './screens/PendenciasScreen.tsx';
import { SaldosCaixaScreen } from './screens/SaldosCaixaScreen.tsx';
import { ParceriasScreen } from './screens/ParceriasScreen.tsx';
import { EquipeScreen } from './screens/EquipeScreen.tsx';
import { CustosLiquidoScreen } from './screens/CustosLiquidoScreen.tsx';
import { MinhaPerformanceScreen } from './screens/MinhaPerformanceScreen.tsx';
import { EstoqueScreen } from './screens/EstoqueScreen.tsx';
import { ConfiguracoesScreen } from './screens/ConfiguracoesScreen.tsx';
import { LoginScreen } from './screens/LoginScreen.tsx';
import {
  isIsolatedMaintenanceDomainActive,
  PROJECT_DATABASE_BOOT_MODE,
  ISOLATED_MAINTENANCE_DOMAIN_PARAM,
} from './database/systemMaintenance.ts';

const OVERVIEW_SECTIONS = [
  {
    id: 'visao_geral',
    label: 'Resumo Geral',
    component: <VisaoGeralScreen />,
  },
  {
    id: 'minha_performance',
    label: 'Minha Performance',
    component: <MinhaPerformanceScreen />,
  },
] as const;

const CASH_SECTIONS = [
  {
    id: 'saques',
    label: 'Saques & Depósitos',
    component: <SaquesScreen />,
  },
  {
    id: 'saldos',
    label: 'Saldos & Caixa',
    component: <SaldosCaixaScreen />,
  },
  {
    id: 'conferencia',
    label: 'Conferência',
    component: <ConferenciaScreen />,
  },
  {
    id: 'pendencias',
    label: 'Pendências',
    component: <PendenciasScreen />,
  },
] as const;

const PARTNERSHIP_SECTIONS = [
  {
    id: 'parcerias',
    label: 'Titulares em Operação',
    component: <ParceriasScreen />,
  },
  {
    id: 'estoque',
    label: 'Estoque de Parcerias',
    component: <EstoqueScreen />,
  },
] as const;

const FINANCE_SECTIONS = [
  {
    id: 'custos',
    label: 'Custos & Líquido',
    component: <CustosLiquidoScreen />,
  },
  {
    id: 'equipe',
    label: 'Equipe & Fechamento de Operadores',
    component: <EquipeScreen />,
  },
] as const;

const IsolatedMaintenanceConsole: React.FC = () => {
  const {
    users,
    allPartnerships,
    allHouseAccounts,
    allBankAccounts,
    allEntries,
    houseCatalog,
    bankCatalog,
    customCriteria,
    activateCleanProductionBase,
    resetDemoData,
    feedbackBanner,
  } = useEnigma();
  const [confirmToken, setConfirmToken] = useState('');

  return (
    <div className="min-h-screen w-full bg-[#111917] text-[#E4ECE8] p-[24px] md:p-[48px] flex flex-col items-center justify-center">
      <div className="w-full max-w-[880px] bg-[#17211E] border border-[#2C3F39] rounded-[16px] p-[28px] flex flex-col gap-[20px] shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[#2C3F39] pb-[16px]">
          <div>
            <span className="inline-block px-[10px] py-[3px] rounded-full text-[11px] font-mono font-semibold bg-[#0F6B5C] text-white uppercase tracking-wider">
              Domínio Isolado de Manutenção · ?domain={ISOLATED_MAINTENANCE_DOMAIN_PARAM}
            </span>
            <h1 className="text-[24px] font-bold text-white mt-[8px]">
              Controle de Base Limpa de Produção & Manutenção do Projeto
            </h1>
            <p className="text-[13px] text-[#9AB0A8] mt-[4px]">
              Este console é inacessível pela navegação comum e não aparece na tela de Configurações do Administrador, evitando qualquer zeramento acidental em operação.
            </p>
          </div>
          <a
            href="/"
            className="px-[14px] py-[9px] rounded-[9px] bg-[#263833] text-white text-[13px] font-semibold hover:bg-[#324943]"
          >
            Voltar ao Sistema Enigma
          </a>
        </div>

        {feedbackBanner && (
          <div className="p-[12px] rounded-[10px] bg-[#0F6B5C] text-white text-[13px] font-semibold">
            {feedbackBanner.message}
          </div>
        )}

        <div className="p-[16px] rounded-[12px] bg-[#101715] border border-[#263833] font-mono text-[12px] flex flex-col gap-[6px]">
          <div className="text-[#7CE2C8] font-semibold">
            1. Linha Específica no Código do Projeto (src/database/systemMaintenance.ts — Linha 19):
          </div>
          <div className="text-[#E4ECE8]">
            export const PROJECT_DATABASE_BOOT_MODE: SystemBootMode = &apos;{PROJECT_DATABASE_BOOT_MODE}&apos;;
          </div>
          <div className="text-[#8FA39B] text-[11px]">
            • Altere para &apos;force_production_clean&apos; para iniciar o projeto em Modo Base Limpa de Produção automaticamente.
          </div>
          <div className="text-[#7CE2C8] font-semibold mt-[6px]">
            2. Comando Direto via Console DevTools:
          </div>
          <div className="text-[#E4ECE8]">
            window.__ENIGMA_PROJECT_MAINTENANCE__.activateCleanProductionBase()
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px] text-[12px]">
          <div className="p-[12px] rounded-[10px] bg-[#1F2D29] border border-[#2C3F39]">
            <div className="text-[#8FA39B]">Usuários na Base</div>
            <div className="text-[18px] font-bold text-white mt-[2px]">{users.length}</div>
          </div>
          <div className="p-[12px] rounded-[10px] bg-[#1F2D29] border border-[#2C3F39]">
            <div className="text-[#8FA39B]">Parcerias / Contas</div>
            <div className="text-[18px] font-bold text-white mt-[2px]">
              {allPartnerships.length} / {allHouseAccounts.length + allBankAccounts.length}
            </div>
          </div>
          <div className="p-[12px] rounded-[10px] bg-[#1F2D29] border border-[#2C3F39]">
            <div className="text-[#8FA39B]">Movimentações</div>
            <div className="text-[18px] font-bold text-white mt-[2px]">{allEntries.length}</div>
          </div>
          <div className="p-[12px] rounded-[10px] bg-[#1F2D29] border border-[#2C3F39]">
            <div className="text-[#8FA39B]">Catálogo (Casas / Bancos)</div>
            <div className="text-[18px] font-bold text-[#7CE2C8] mt-[2px]">
              {houseCatalog.length}C · {bankCatalog.length}B · {customCriteria.length} Crit.
            </div>
          </div>
        </div>

        <div className="p-[18px] rounded-[12px] bg-[#1F2D29] border border-[#385049] flex flex-col gap-[12px]">
          <label htmlFor="maint-confirm-token" className="text-[12px] font-semibold text-[#CFE0D9]">
            Para executar uma ação de inicialização de banco neste domínio isolado, digite <code className="text-[#7CE2C8]">CONFIRMAR</code>:
          </label>
          <div className="flex flex-wrap gap-[10px] items-center">
            <input
              id="maint-confirm-token"
              type="text"
              value={confirmToken}
              onChange={(e) => setConfirmToken(e.target.value)}
              placeholder="Digite CONFIRMAR"
              className="px-[12px] py-[9px] rounded-[8px] border border-[#3E5850] bg-[#111917] text-white text-[13px] font-mono"
            />
            <button
              type="button"
              disabled={confirmToken.trim().toUpperCase() !== 'CONFIRMAR'}
              onClick={() => {
                activateCleanProductionBase();
                setConfirmToken('');
              }}
              className="px-[16px] py-[9px] rounded-[8px] bg-[#0F6B5C] disabled:opacity-40 text-white text-[13px] font-semibold cursor-pointer"
            >
              Ativar Modo Base Limpa de Produção (Preserva Admin + Catálogo)
            </button>
            <button
              type="button"
              disabled={confirmToken.trim().toUpperCase() !== 'CONFIRMAR'}
              onClick={() => {
                resetDemoData();
                setConfirmToken('');
              }}
              className="px-[14px] py-[9px] rounded-[8px] border border-[#E5604F] disabled:opacity-40 text-[#FF9B8E] text-[13px] font-semibold cursor-pointer"
            >
              Recarregar Dados de Demonstração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnigmaWorkspace: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    currentUser,
    isAuthenticated,
    logoutUser,
    feedbackBanner,
    clearFeedback,
  } = useEnigma();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || isIsolatedMaintenanceDomainActive()) return;

    const standaloneScreen =
      activeScreen === 'entradas' ||
      activeScreen === 'configuracoes' ||
      (currentUser.role === 'operador' && activeScreen === 'custos');

    if (standaloneScreen) {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';
      window.scrollTo({ top: 0, behavior });
    }
  }, [activeScreen, currentUser.role, isAuthenticated]);

  if (isIsolatedMaintenanceDomainActive()) {
    return <IsolatedMaintenanceConsole />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const isOperator = currentUser.role === 'operador';

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#E4EAE7] text-[#111815] text-[14px]">
      {/* Topbar Horizontal Consolidada (Desktop e Mobile) */}
      <SidebarNav />

      {/* Área Principal com Largura Total Aproveitada */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-[16px] py-[18px] md:px-[28px] md:py-[22px] flex flex-col gap-[16px]">
        {feedbackBanner && (
          <div
            role="status"
            className={`px-[16px] py-[10px] rounded-[10px] flex justify-between items-center gap-[12px] text-[13px] font-medium ${
              feedbackBanner.tone === 'success'
                ? 'bg-[#E3F1EE] text-[#0B4F44] border border-[#CFE6DF]'
                : feedbackBanner.tone === 'warning'
                ? 'bg-[#FBF0DD] text-[#6B3E08] border border-[#E8A33D]'
                : 'bg-[#FBE9E7] text-[#8C1D18] border border-[#E5604F]'
            }`}
          >
            <span>{feedbackBanner.message}</span>
            <button
              type="button"
              onClick={clearFeedback}
              className="text-[12px] underline cursor-pointer shrink-0"
            >
              Fechar
            </button>
          </div>
        )}

        {OVERVIEW_SECTIONS.some((section) => section.id === activeScreen) && (
          <ScrollspyScreenGroup groupId="visao-geral" sections={OVERVIEW_SECTIONS} />
        )}
        {activeScreen === 'entradas' && <EntradasScreen />}
        {CASH_SECTIONS.some((section) => section.id === activeScreen) && (
          <ScrollspyScreenGroup groupId="caixa" sections={CASH_SECTIONS} />
        )}
        {PARTNERSHIP_SECTIONS.some((section) => section.id === activeScreen) && (
          <ScrollspyScreenGroup groupId="parcerias" sections={PARTNERSHIP_SECTIONS} />
        )}
        {!isOperator && (activeScreen === 'custos' || activeScreen === 'equipe') && (
          <ScrollspyScreenGroup groupId="financeiro" sections={FINANCE_SECTIONS} />
        )}
        {isOperator && activeScreen === 'custos' && <CustosLiquidoScreen />}
        {activeScreen === 'configuracoes' && <ConfiguracoesScreen />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <EnigmaProvider>
      <AppearanceProvider>
        <EnigmaWorkspace />
      </AppearanceProvider>
    </EnigmaProvider>
  );
}
