import React, { useEffect, useMemo, useState } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  canUserAccessCredentials,
  computeReservedStakesByAccount,
  formatBrlEquivalent,
  formatCurrencyBRL,
  formatHouseAccountBalance,
  formatShortHouseName,
  roundCurrency,
} from '../domain/ledger.ts';
import type { HouseAccountCurrency, HouseAccountStatus } from '../domain/types.ts';
import {
  CLONE_PRESETS,
  getHouseAccountStatusTheme,
  getHouseColorTheme,
} from '../domain/uiTheme.ts';

export const ParceriasScreen: React.FC = () => {
  const {
    partnerships,
    houseAccounts,
    bankAccounts,
    entries,
    users,
    currentUser,
    availableHouses,
    availableBanks,
    houseCatalog,
    credentialLogs,
    operationalMonthYearLabel,
    isDateFilterActive,
    operatorPreferredExchange,
    systemVersion,
    setActiveScreen,
    navFocus,
    clearNavFocus,
    logCredentialReveal,
    addHouseToPartnership,
    addBankToPartnership,
    updateBankInPartnership,
    removeBankFromPartnership,
    updatePartnershipDetails,
    updateHouseAccountOperationalStatus,
    returnPartnershipToStock,
    settlePartnershipReimbursement,
    notify,
  } = useEnigma();

  const activeList = useMemo(
    () => partnerships.filter((p) => p.status === 'ativa'),
    [partnerships]
  );
  const stockCount = useMemo(
    () => partnerships.filter((p) => p.status === 'estoque' || p.status === 'fila').length,
    [partnerships]
  );

  const [selectedPartnershipId, setSelectedPartnershipId] = useState<string>('parc_maria');
  const [showKycRules, setShowKycRules] = useState<boolean>(false);

  // Controle de quais senhas estão reveladas na sessão atual
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Modais inline para "Adicionar casa", "Adicionar corretora/carteira" e "Editar ficha"
  const [showAddHouseModal, setShowAddHouseModal] = useState<boolean>(false);
  const [newHouseName, setNewHouseName] = useState<string>('BC.Game (bcgame2.com)');
  const [newHouseClone, setNewHouseClone] = useState<string>('Blaze');
  const [newHouseCurrency, setNewHouseCurrency] = useState<HouseAccountCurrency>('USDT');
  const [newHouseLogin, setNewHouseLogin] = useState<string>('');
  const [newHousePassword, setNewHousePassword] = useState<string>('');

  const [showAddBankModal, setShowAddBankModal] = useState<boolean>(false);
  const [newBankName, setNewBankName] = useState<string>('OKX');
  const [newBankDevice, setNewBankDevice] = useState<string>('BEP20 (BSC) / ERC20');
  const [newBankLogin, setNewBankLogin] = useState<string>('');
  const [newBankPassword, setNewBankPassword] = useState<string>('');
  const [newBankPixKey, setNewBankPixKey] = useState<string>('');

  // Edição inline de carteira individual
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editBankName, setEditBankName] = useState<string>('');
  const [editBankDevice, setEditBankDevice] = useState<string>('');
  const [editBankLogin, setEditBankLogin] = useState<string>('');
  const [editBankPassword, setEditBankPassword] = useState<string>('');
  const [editBankPixKey, setEditBankPixKey] = useState<string>('');

  const [showEditFicha, setShowEditFicha] = useState<boolean>(false);
  const [editAddress, setEditAddress] = useState<string>('');
  const [editPhones, setEditPhones] = useState<string>('');
  const [editChip, setEditChip] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPixWithdrawals, setEditPixWithdrawals] = useState<string>('');
  const [editPixPayments, setEditPixPayments] = useState<string>('');

  useEffect(() => {
    if (navFocus.partnershipId) {
      setSelectedPartnershipId(navFocus.partnershipId);
      clearNavFocus();
    }
  }, [navFocus.partnershipId]);

  const currentPartnership = useMemo(() => {
    const found = partnerships.find((p) => p.id === selectedPartnershipId);
    if (found && found.status === 'ativa') return found;
    return activeList[0] || found || partnerships[0];
  }, [partnerships, activeList, selectedPartnershipId]);

  const reservedByAccount = useMemo(
    () => computeReservedStakesByAccount(entries),
    [entries]
  );

  const partnershipAccounts = useMemo(
    () =>
      houseAccounts.filter(
        (a) =>
          a.partnershipId === currentPartnership?.id &&
          !a.label.includes('Mesa Sócios')
      ),
    [houseAccounts, currentPartnership?.id]
  );

  const partnershipBanks = useMemo(
    () => bankAccounts.filter((b) => b.partnershipId === currentPartnership?.id),
    [bankAccounts, currentPartnership?.id]
  );

  const activePartnerNetworks = useMemo(() => {
    if (systemVersion === 'v1_bancos_pix') return 'PIX · R$';
    if (!partnershipBanks || partnershipBanks.length === 0) return 'Rede: BEP20';
    const nets = new Set<string>();
    for (const b of partnershipBanks) {
      const raw = b.phoneDevice || '';
      if (raw.includes('BEP20') && raw.includes('ERC20')) {
        nets.add('BEP20 & ERC20');
      } else if (raw.includes('BEP20')) {
        nets.add('BEP20');
      } else if (raw.includes('ERC20')) {
        nets.add('ERC20');
      } else if (raw.includes('Polygon')) {
        nets.add('Polygon');
      } else if (raw.includes('TRC20') || raw.includes('Tron')) {
        nets.add('TRC20');
      } else if (raw.trim()) {
        const cleaned = raw.replace(/Rede/gi, '').trim();
        if (cleaned) nets.add(cleaned);
      }
    }
    return nets.size > 0 ? Array.from(nets).join(' · ') : 'BEP20';
  }, [partnershipBanks, systemVersion]);

  const totalPartnershipBalance = useMemo(() => {
    if (!currentPartnership) return 0;
    const avail = partnershipAccounts.reduce((s, a) => s + a.availableBalance, 0);
    const dynamicOpen = partnershipAccounts.reduce(
      (s, a) => s + (reservedByAccount[a.id] || 0),
      0
    );
    const open = isDateFilterActive
      ? dynamicOpen
      : currentPartnership.id === 'parc_maria' && entries.length === 8
        ? 3160
        : dynamicOpen;
    return roundCurrency(avail + open);
  }, [currentPartnership, partnershipAccounts, reservedByAccount, entries.length, isDateFilterActive]);

  if (!currentPartnership) {
    return null;
  }

  const isAuthorizedForSecrets = canUserAccessCredentials(
    currentUser,
    currentPartnership
  );

  const handleToggleReveal = (
    key: string,
    targetType: 'banco' | 'casa',
    targetLabel: string
  ) => {
    if (revealedKeys[key]) {
      setRevealedKeys((prev) => ({ ...prev, [key]: false }));
      return;
    }
    const ok = logCredentialReveal(currentPartnership.id, targetType, targetLabel);
    if (ok) {
      setRevealedKeys((prev) => ({ ...prev, [key]: true }));
    }
  };

  const handleCopy = (value: string, label: string) => {
    if (!isAuthorizedForSecrets) {
      notify('error', 'Acesso restrito às credenciais desta parceria.');
      return;
    }
    try {
      navigator.clipboard?.writeText(value);
    } catch {
      // ignore
    }
    notify('success', `${label} copiado para a área de transferência!`);
  };

  const operatorUser = users.find((u) => u.id === currentPartnership.operatorId);
  const paidByUser = users.find((u) => u.id === currentPartnership.paidByOperatorId);

  // Agrupa contas por clone para exibir na tabela Casas por clone idêntica ao 06_Ficha_da_parceria.html
  const cloneGroups = useMemo(() => {
    const groups: Record<string, typeof partnershipAccounts> = {};
    for (const acc of partnershipAccounts) {
      const g = acc.cloneGroup || 'Sem clones';
      if (!groups[g]) groups[g] = [];
      groups[g].push(acc);
    }
    return Object.entries(groups);
  }, [partnershipAccounts]);

  const cloneOptions = useMemo(() => {
    const set = new Set<string>(CLONE_PRESETS);
    for (const h of houseCatalog) {
      if (h.cloneGroup?.trim()) set.add(h.cloneGroup.trim());
    }
    for (const a of houseAccounts) {
      if (a.cloneGroup?.trim()) set.add(a.cloneGroup.trim());
    }
    return Array.from(set);
  }, [houseCatalog, houseAccounts]);

  const partnershipAccessLogs = credentialLogs.filter(
    (l) => l.partnershipId === currentPartnership.id
  );

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Cabeçalho enxuto com botão discreto para Regras / KYC sob demanda */}
      <div className="flex flex-wrap justify-between items-center gap-[10px]">
        <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#1B2421]">
          Contas e Parcerias
        </h1>
        <div className="flex flex-wrap gap-[8px] items-center">
          <button
            type="button"
            onClick={() => setShowKycRules((v) => !v)}
            className={`px-[12px] py-[7px] rounded-[8px] border text-[12px] font-medium transition-colors cursor-pointer ${
              showKycRules
                ? 'bg-[#E3F1EE] border-[#0F6B5C] text-[#0B4F44] font-semibold'
                : 'bg-white border-[#CBD2CD] text-[#44504B] hover:bg-[#F4F5F2]'
            }`}
          >
            {showKycRules ? 'Ocultar Regras / KYC' : 'Ver Regras / KYC'}
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('estoque')}
            className="px-[14px] py-[7px] rounded-[8px] border border-[#0F6B5C] text-[#0F6B5C] font-semibold text-[12px] hover:bg-[#E3F1EE] cursor-pointer"
          >
            Puxar do estoque
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('estoque')}
            className="px-[14px] py-[7px] rounded-[8px] bg-[#0F6B5C] text-white font-semibold text-[12px] hover:bg-[#0B4F44] cursor-pointer"
          >
            + Nova parceria
          </button>
        </div>
      </div>

      {showKycRules && (
        <div className="bg-[#FAFDFB] border border-[#CBE2D8] rounded-[12px] p-[14px] flex flex-col gap-[10px]">
          <div className="flex flex-wrap justify-between items-center gap-[8px]">
            <div className="flex items-center gap-[8px]">
              <span className="px-[8px] py-[2px] rounded-full bg-[#0F6B5C] text-white text-[11px] font-semibold uppercase">
                Protocolo Offshore / Cripto
              </span>
              <b className="text-[13px] text-[#1B2421]">
                Checklist KYC, Rollover & Fluxo Corretora ({operatorPreferredExchange} / Binance)
              </b>
            </div>
            <button
              type="button"
              onClick={() => setShowKycRules(false)}
              className="text-[12px] text-[#66716C] hover:text-[#1B2421] cursor-pointer"
            >
              × Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px] text-[12px]">
            <div className="p-[10px_12px] rounded-[8px] bg-white border border-[#E1E5E1] flex flex-col gap-[3px]">
              <b className="text-[#0B4F44]">1. Documentos & KYC</b>
              <div className="text-[#44504B]">• <b>RG/CNH</b> + <b>Selfie segurando RG/CNH</b></div>
              <div className="text-[#8C1D18] font-medium">
                • <b>Endereço:</b> se fake, <u>não usar conta de luz ou água</u>.
              </div>
              <div className="text-[#44504B]">
                • <b>Selfie c/ papel:</b> <i>&quot;Nome da Casa + Data&quot;</i> (Bet25 = vídeo chamada; Duel = Sumsub).
              </div>
            </div>

            <div className="p-[10px_12px] rounded-[8px] bg-white border border-[#E1E5E1] flex flex-col gap-[3px]">
              <b className="text-[#0B4F44]">2. Depósito ({operatorPreferredExchange} / Binance → Casa)</b>
              <div className="text-[#44504B]">
                1º Depositar BRL na corretora ({operatorPreferredExchange} / Binance) e comprar <b>USDT</b>.
              </div>
              <div className="text-[#44504B]">
                2º Na Casa: Depositar → <b>USDT</b> → rede <b>BEP20</b> ou <b>ERC20</b> (algumas casas creditam saldo em <b>EUR €</b>).
              </div>
              <div className="text-[#44504B]">
                3º Na Corretora: <b>Ativos</b> → <b>Enviar</b> → <b>USDT</b> → Ler QR Code.
              </div>
            </div>

            <div className="p-[10px_12px] rounded-[8px] bg-white border border-[#E1E5E1] flex flex-col gap-[3px]">
              <b className="text-[#0B4F44]">3. Rollover & Carteiras</b>
              <div className="text-[#44504B]">• <b>Rollover:</b> <b>1x</b> padrão (<b>BetFury = 3x</b>).</div>
              <div className="text-[#44504B]">• <b>Parcerias:</b> <b>MetaMask</b> (carteiras ilimitadas 0x...).</div>
              <div className="text-[#44504B]">• <b>Pinnacle:</b> via AsianConnect · <b>Overtime:</b> não limita.</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-[20px] items-start">
        {/* Lista Lateral de Parcerias (270px) */}
        <section className="w-full lg:w-[270px] shrink-0 bg-white border border-[#E1E5E1] rounded-[14px] p-[14px] flex flex-col gap-[6px]">
          <div className="flex items-center justify-between pb-[10px] px-[2px] border-b border-[#EEF2F0]">
            <div className="flex items-center gap-[6px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#10B981]" />
              <span className="text-[12px] font-bold text-[#1B2421] tracking-wide">
                Parcerias Ativas ({activeList.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('estoque')}
              title="Acessar o Estoque de Parcerias para puxar ou gerenciar novos titulares"
              className="text-[11px] font-semibold text-[#0F6B5C] hover:underline cursor-pointer flex items-center gap-[2px]"
            >
              Estoque ({stockCount}) →
            </button>
          </div>

          {activeList.length === 0 && (
            <div className="py-[16px] text-center text-[12px] text-[#66716C]">
              Nenhuma parceria ativa no momento.
            </div>
          )}

          {activeList.map((p, idx) => {
            const isSelected = p.id === currentPartnership.id;
            const pAccs = houseAccounts.filter(
              (a) => a.partnershipId === p.id && !a.label.includes('Mesa Sócios')
            );
            const inUseCount = pAccs.filter((a) => a.status === 'em_uso').length;
            const limitedCount = pAccs.filter((a) => a.status === 'limitada').length;
            const opName =
              users.find((u) => u.id === p.operatorId)?.shortName || 'Estoque';

            const displayTitle =
              p.id === 'parc_maria'
                ? 'Titular Exemplo A (Maria)'
                : p.id === 'parc_joao'
                  ? 'Titular Exemplo B (João)'
                  : p.id === 'parc_carlos'
                    ? 'Titular Exemplo C (Carlos)'
                    : p.id === 'parc_ana'
                      ? 'Titular Exemplo D (Ana)'
                      : p.id === 'parc_pedro'
                        ? 'Titular Exemplo E (Pedro)'
                        : p.titularName;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPartnershipId(p.id)}
                className={`text-left px-[12px] py-[10px] rounded-[9px] flex flex-col gap-[2px] transition-colors cursor-pointer ${isSelected ? 'bg-[#E3F1EE]' : 'hover:bg-[#F4F5F2]'
                  }`}
              >
                <span className={isSelected ? 'font-semibold text-[#1B2421]' : 'text-[#1B2421]'}>
                  {displayTitle}
                </span>
                <span
                  className={`text-[12px] ${limitedCount > 0 && p.id === 'parc_carlos'
                      ? 'text-[#B3261E]'
                      : idx === 4
                        ? 'text-[#8A4B08]'
                        : isSelected
                          ? 'text-[#0B4F44]'
                          : 'text-[#66716C]'
                    }`}
                >
                  {p.id === 'parc_carlos'
                    ? `${opName} · 1 limitada`
                    : p.id === 'parc_pedro'
                      ? 'Criando contas · 3 de 5'
                      : `${opName} · ${inUseCount || pAccs.length} em uso`}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveScreen('estoque')}
            className="mt-[6px] w-full py-[8px] px-[10px] rounded-[8px] border border-dashed border-[#0F6B5C]/30 text-[#0F6B5C] text-[12px] font-semibold hover:bg-[#E3F1EE]/40 cursor-pointer flex items-center justify-center gap-[6px]"
          >
            <span>+ Puxar do estoque ({stockCount})</span>
          </button>
        </section>

        {/* Área Principal da Ficha da Parceria */}
        <section className="flex-1 min-w-0 w-full flex flex-col gap-[16px]">
          {/* Banner de Cabeçalho da Parceria */}
          <div className="bg-white border border-[#DCE6E2] rounded-[16px] p-[20px] flex flex-wrap justify-between items-start gap-[16px]">
            <div className="flex flex-col gap-[4px]">
              <div className="flex items-center gap-[10px]">
                <span className={`w-[10px] h-[10px] rounded-full ${currentPartnership.status === 'ativa' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                <div className="text-[21px] font-bold text-[#0F1D19]">
                  {currentPartnership.id === 'parc_maria'
                    ? 'Titular Exemplo A (Maria)'
                    : currentPartnership.titularName}
                </div>
              </div>
              <div className="text-[13px] text-[#5A7068]">
                Parceria <b className="text-[#0D7A68] uppercase text-[11px]">{currentPartnership.status}</b> · Responsável:{' '}
                <b className="text-[#0F1D19]">{operatorUser?.shortName || 'Estoque'}</b> · Custos pagos por:{' '}
                <b className="text-[#0F1D19]">{paidByUser?.shortName || 'Operador'}</b> · Indicação:{' '}
                {currentPartnership.referral}
              </div>

              {currentPartnership.status !== 'ativa' && (
                <div className="mt-[6px] p-[10px_14px] rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[12.5px] flex items-center justify-between gap-[10px]">
                  <span>
                    Esta parceria consta no <b>Estoque</b> (não atribuída a uma operação ativa). Puxe-a para a sua operação no módulo Estoque para movimentar saldos e lançar apostas.
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('estoque')}
                    className="px-[10px] py-[4px] rounded-[6px] bg-[#0F6B5C] text-white font-semibold text-[11px] shrink-0 cursor-pointer"
                  >
                    Ir para o Estoque
                  </button>
                </div>
              )}
              {!currentPartnership.reimbursementSettled &&
                currentPartnership.reimbursementAmount > 0 && (
                  <div className="mt-[4px] inline-flex items-center gap-[10px] px-[10px] py-[4px] rounded-[7px] bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[12px]">
                    <span>
                      Obrigação de ressarcimento pendente:{' '}
                      <b>{formatCurrencyBRL(currentPartnership.reimbursementAmount)}</b> devido a{' '}
                      {users.find((u) => u.id === currentPartnership.reimbursementDueToOperatorId)
                        ?.shortName || 'Operador'}
                    </span>
                    <button
                      type="button"
                      onClick={() => settlePartnershipReimbursement(currentPartnership.id)}
                      className="px-[8px] py-[2px] rounded-[5px] bg-[#0D7A68] text-white font-semibold cursor-pointer"
                    >
                      Quitar ressarcimento
                    </button>
                  </div>
                )}
            </div>

            <div className="flex gap-[18px] items-center bg-[#F4F8F6] px-[16px] py-[10px] rounded-[12px] border border-[#E2ECE8]">
              <div className="text-right">
                <div className="text-[11px] text-[#5A7068] font-semibold uppercase">Período</div>
                <div className="font-bold text-[#0F1D19]">{currentPartnership.period}</div>
              </div>
              <div className="h-[28px] w-[1px] bg-[#DCE6E2]" />
              <div className="text-right">
                <div className="text-[11px] text-[#5A7068] font-semibold uppercase">Total da Parceria</div>
                <div className="text-[20px] font-bold text-[#059669] tabular-nums">
                  {formatCurrencyBRL(totalPartnershipBalance)}
                </div>
                <div className="text-[11px] text-[#6A827A] tabular-nums">
                  ≈ {formatBrlEquivalent(totalPartnershipBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* Grid 2 Colunas: Dados de cadastro + Bancos disponíveis & Pagamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
            {/* Dados de cadastro */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
              <div className="px-[16px] py-[11px] bg-[#0F172A] text-white font-bold text-[13.5px] flex items-center justify-between">
                <span>Dados do Titular</span>
                <span className="text-[11px] font-normal text-[#94A3B8]">Ficha Cadastral</span>
              </div>
              <div className="grid grid-cols-[130px_1fr] text-[13px]">
                <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C] border-b border-[#EEF1EE]">
                  Nome completo
                </div>
                <div className="px-[14px] py-[8px] border-b border-[#EEF1EE]">
                  {currentPartnership.titularName}
                </div>

                <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C] border-b border-[#EEF1EE]">
                  CPF
                </div>
                <div className="px-[14px] py-[8px] border-b border-[#EEF1EE] flex justify-between items-center">
                  <span className="tabular-nums">
                    {isAuthorizedForSecrets ? currentPartnership.cpf : '***.***.***-**'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentPartnership.cpf, 'CPF')}
                    className="text-[12px] text-[#0F6B5C] hover:underline cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>

                <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C] border-b border-[#EEF1EE]">
                  Nascimento
                </div>
                <div className="px-[14px] py-[8px] border-b border-[#EEF1EE] tabular-nums">
                  {currentPartnership.birthDate}
                </div>

                <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C] border-b border-[#EEF1EE]">
                  Endereço
                </div>
                <div className="px-[14px] py-[8px] border-b border-[#EEF1EE]">
                  {currentPartnership.address}
                </div>

                <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C] border-b border-[#EEF1EE]">
                  E-mail nosso
                </div>
                <div className="px-[14px] py-[8px] border-b border-[#EEF1EE] flex justify-between items-center gap-[6px]">
                  <span className="truncate">{currentPartnership.emailOperation}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(currentPartnership.emailOperation, 'E-mail de operação')
                    }
                    className="text-[12px] text-[#0F6B5C] hover:underline shrink-0 cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>

                <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C] border-b border-[#EEF1EE]">
                  E-mail pessoal
                </div>
                <div className="px-[14px] py-[8px] border-b border-[#EEF1EE] truncate">
                  {currentPartnership.emailPersonal}
                </div>

                <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C] border-b border-[#EEF1EE]">
                  Telefones
                </div>
                <div className="px-[14px] py-[8px] border-b border-[#EEF1EE] tabular-nums">
                  {currentPartnership.phones}
                </div>

                <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C]">
                  Local do chip
                </div>
                <div className="px-[14px] py-[8px]">{currentPartnership.chipLocation}</div>
              </div>
            </div>

            {/* Coluna Direita: Corretoras & Carteiras Cripto + Carteiras de Saque */}
            <div className="flex flex-col gap-[16px]">
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
                <div className="px-[16px] py-[11px] bg-[#0F172A] text-white font-bold text-[13.5px] flex justify-between items-center">
                  <div className="flex items-center gap-[8px]">
                    <span>
                      {systemVersion === 'v1_bancos_pix'
                        ? 'Bancos Disponíveis (PIX)'
                        : 'Corretoras & Carteiras da Parceria'}
                    </span>
                    <span className="text-[11px] font-normal text-[#94A3B8]">
                      ({partnershipBanks.length} {partnershipBanks.length === 1 ? 'vinculada' : 'vinculadas'})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold bg-[#1E293B] text-[#E2E8F0] border border-[#334155] px-[8px] py-[2px] rounded-full">
                    {activePartnerNetworks}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 text-[13px]">
                  {(partnershipBanks.length > 0
                    ? partnershipBanks
                    : [
                      {
                        id: 'b_default_1',
                        partnershipId: currentPartnership.id,
                        bankName: 'MetaMask',
                        label: `MetaMask · ${currentPartnership.shortName} (BEP20/ERC20)`,
                        status: 'ativo' as const,
                        phoneDevice: 'BEP20 / ERC20 (USDT)',
                        login: currentPartnership.emailOperation,
                        passwordSecret: 'Seed@MetaMask2026',
                        pixKey: '0x0000...BEP20',
                        balance: 0,
                        informedRealBalance: 0,
                        lastReconciledAt: null,
                        authorizedOperatorIds: [],
                      },
                    ]
                  ).map((bank, idx) => {
                    const rKey = `bank_${bank.id}`;
                    const isRev = Boolean(revealedKeys[rKey]);
                    const isDefaultWithdrawal =
                      Boolean(currentPartnership.pixWithdrawals) &&
                      Boolean(bank.pixKey) &&
                      currentPartnership.pixWithdrawals.toLowerCase().trim() ===
                        bank.pixKey.toLowerCase().trim();
                    const isEditing = editingBankId === bank.id;

                    if (isEditing) {
                      return (
                        <div
                          key={bank.id}
                          className={`p-[14px] flex flex-col gap-[8px] bg-[#F8FAFC] ${
                            idx === 0 ? 'sm:border-r border-[#EEF1EE]' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <b className="text-[12px] text-[#0F6B5C]">
                              Editar Carteira {idx + 1}
                            </b>
                            <button
                              type="button"
                              onClick={() => setEditingBankId(null)}
                              className="text-[11px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                          <div className="flex flex-col gap-[4px]">
                            <label className="text-[11px] font-medium text-[#64748B]">
                              Corretora / Carteira
                            </label>
                            <input
                              type="text"
                              value={editBankName}
                              onChange={(e) => setEditBankName(e.target.value)}
                              placeholder="ex: OKX, Binance, MetaMask"
                              className="p-[6px_8px] border border-[#CBD5E1] rounded-[6px] text-[12px] bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-[4px]">
                            <label className="text-[11px] font-medium text-[#64748B]">
                              Rede configurada
                            </label>
                            <input
                              type="text"
                              value={editBankDevice}
                              onChange={(e) => setEditBankDevice(e.target.value)}
                              placeholder="ex: BEP20, ERC20, Polygon"
                              className="p-[6px_8px] border border-[#CBD5E1] rounded-[6px] text-[12px] bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-[4px]">
                            <label className="text-[11px] font-medium text-[#64748B]">
                              Endereço 0x da carteira
                            </label>
                            <input
                              type="text"
                              value={editBankPixKey}
                              onChange={(e) => setEditBankPixKey(e.target.value)}
                              placeholder="0x..."
                              className="p-[6px_8px] border border-[#CBD5E1] rounded-[6px] text-[12px] font-mono bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-[6px]">
                            <div className="flex flex-col gap-[4px]">
                              <label className="text-[11px] font-medium text-[#64748B]">
                                Login / ID
                              </label>
                              <input
                                type="text"
                                value={editBankLogin}
                                onChange={(e) => setEditBankLogin(e.target.value)}
                                className="p-[6px_8px] border border-[#CBD5E1] rounded-[6px] text-[12px] bg-white"
                              />
                            </div>
                            <div className="flex flex-col gap-[4px]">
                              <label className="text-[11px] font-medium text-[#64748B]">
                                Senha / Seed
                              </label>
                              <input
                                type="text"
                                value={editBankPassword}
                                onChange={(e) => setEditBankPassword(e.target.value)}
                                className="p-[6px_8px] border border-[#CBD5E1] rounded-[6px] text-[12px] bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-[6px] pt-[4px]">
                            <button
                              type="button"
                              onClick={() => {
                                updateBankInPartnership(bank.id, {
                                  bankName: editBankName,
                                  phoneDevice: editBankDevice,
                                  pixKey: editBankPixKey,
                                  login: editBankLogin,
                                  passwordSecret: editBankPassword,
                                });
                                setEditingBankId(null);
                              }}
                              className="px-[12px] py-[5px] rounded-[6px] bg-[#0F6B5C] text-white text-[12px] font-semibold hover:bg-[#0B4F44] cursor-pointer"
                            >
                              Salvar Carteira
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={bank.id}
                        className={`p-[12px_14px] flex flex-col gap-[6px] ${
                          idx === 0 ? 'sm:border-r border-[#EEF1EE]' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-[6px]">
                            <b>
                              Carteira {idx + 1} · {bank.bankName}
                            </b>
                            {isDefaultWithdrawal && (
                              <span className="px-[6px] py-[1px] rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#0F6B5C] border border-[#BBF7D0]">
                                ✓ Saque Padrão
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-[8px] py-[1.5px] rounded-full text-[11px] font-medium ${
                              bank.status === 'ativo'
                                ? 'bg-[#E3F1EE] text-[#0B4F44]'
                                : 'bg-[#EEF1EE] text-[#44504B]'
                            }`}
                          >
                            {bank.status === 'ativo' ? 'Ativa' : 'Sem status'}
                          </span>
                        </div>
                        <div className="text-[#66716C] text-[12px]">
                          Rede: <b className="text-[#1B2421]">{bank.phoneDevice}</b> · Saldo:{' '}
                          <b className="text-[#0F6B5C]">{formatCurrencyBRL(bank.balance)}</b>
                        </div>
                        <div className="flex justify-between items-center gap-[6px] bg-[#F4F5F2] px-[8px] py-[4px] rounded-[6px]">
                          <span className="font-mono text-[11px] truncate" title={bank.pixKey}>
                            Endereço: {bank.pixKey}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(bank.pixKey, `Endereço ${bank.bankName}`)}
                            className="text-[11px] text-[#0F6B5C] font-semibold hover:underline shrink-0 cursor-pointer"
                          >
                            Copiar 0x
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="truncate text-[12px]">Login/ID: {bank.login}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(bank.login, `Login ${bank.bankName}`)}
                            className="text-[11px] text-[#0F6B5C] hover:underline cursor-pointer"
                          >
                            Copiar
                          </button>
                        </div>
                        <div className="flex gap-[8px] items-center justify-between">
                          <div className="text-[12px]">
                            Senha/Seed:{' '}
                            <span className={isRev ? 'font-mono font-medium' : 'tracking-[2px]'}>
                              {isRev && isAuthorizedForSecrets
                                ? bank.passwordSecret
                                : '••••••••'}
                            </span>
                          </div>
                          <div className="flex gap-[6px]">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleReveal(rKey, 'banco', bank.label)
                              }
                              className="text-[12px] text-[#0F6B5C] hover:underline cursor-pointer"
                            >
                              {isRev ? 'Ocultar' : 'Revelar'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(bank.passwordSecret, `Senha/Seed ${bank.bankName}`)
                              }
                              className="text-[12px] text-[#0F6B5C] hover:underline cursor-pointer"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-[6px] border-t border-[#EEF1EE] mt-[2px] text-[11px]">
                          <div className="flex items-center gap-[8px]">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBankId(bank.id);
                                setEditBankName(bank.bankName);
                                setEditBankDevice(bank.phoneDevice);
                                setEditBankPixKey(bank.pixKey);
                                setEditBankLogin(bank.login);
                                setEditBankPassword(bank.passwordSecret);
                              }}
                              className="text-[#0F6B5C] font-semibold hover:underline cursor-pointer"
                            >
                              Editar Carteira
                            </button>
                            {!isDefaultWithdrawal && bank.pixKey && (
                              <button
                                type="button"
                                onClick={() => {
                                  updatePartnershipDetails(currentPartnership.id, {
                                    pixWithdrawals: bank.pixKey,
                                  });
                                  notify('success', `${bank.bankName} definida como carteira de saques padrão.`);
                                }}
                                className="text-[#64748B] hover:text-[#0F6B5C] hover:underline cursor-pointer"
                              >
                                Definir como Saque
                              </button>
                            )}
                          </div>
                          {partnershipBanks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBankFromPartnership(bank.id)}
                              className="text-[#DC2626] hover:underline cursor-pointer"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Carteiras de Saque e Fluxo Cripto */}
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
                <div className="px-[16px] py-[11px] bg-[#0F172A] text-white font-bold text-[13.5px]">
                  Endereços de Saque & Rampa Cripto (USDT)
                </div>
                <div className="grid grid-cols-[150px_1fr] text-[13px]">
                  <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C] border-b border-[#EEF1EE]">
                    Carteira de saques (USDT)
                  </div>
                  <div className="px-[14px] py-[8px] border-b border-[#EEF1EE] flex justify-between items-center gap-[6px]">
                    <span className="truncate font-mono text-[12px]">{currentPartnership.pixWithdrawals}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(currentPartnership.pixWithdrawals, 'Carteira de saques USDT')
                      }
                      className="text-[12px] text-[#0F6B5C] hover:underline shrink-0 cursor-pointer"
                    >
                      Copiar
                    </button>
                  </div>

                  <div className="px-[14px] py-[8px] bg-[#F4F5F2] text-[#66716C]">
                    Rampa / Pagamentos
                  </div>
                  <div className="px-[14px] py-[8px] flex justify-between items-center gap-[6px]">
                    <span className="tabular-nums text-[12px]">{currentPartnership.pixPayments}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(currentPartnership.pixPayments, 'Rampa / Pagamentos')
                      }
                      className="text-[12px] text-[#0F6B5C] hover:underline shrink-0 cursor-pointer"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-[14px] py-[12px] rounded-[10px] bg-[#E3F1EE] text-[#0B4F44] text-[12px] leading-[1.5]">
                Senhas e seeds ficam ocultas por padrão. Cada vez que alguém clica em Revelar, o app registra quem viu e quando ({partnershipAccessLogs.length} acesso(s) auditado(s)).
              </div>
            </div>
          </div>

          {/* Tabela: Casas por clone — Login e Senha juntos na mesma área com Revelar e Copiar individualmente */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
            <div className="px-[16px] py-[11px] bg-[#0F172A] text-white font-bold text-[13.5px] flex flex-wrap justify-between items-center gap-[8px]">
              <span>Contas nas Casas ({partnershipAccounts.length})</span>
              <span className="font-normal text-[11.5px] text-[#94A3B8]">
                Acesso rápido: Login, Senha e Saldo por Moeda (USDT / EUR €)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-[#66716C] text-[12px]">
                    <th className="py-[8px] px-[14px] font-medium w-[130px]">Clone</th>
                    <th className="py-[8px] px-[14px] font-medium">Casa</th>
                    <th className="py-[8px] px-[14px] font-medium">Status</th>
                    <th className="py-[8px] px-[14px] font-medium">
                      Login e Senha (Acesso Unificado)
                    </th>
                    <th className="py-[8px] px-[14px] font-medium text-right">Saldo</th>
                    <th className="py-[8px] px-[14px] font-medium">Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {cloneGroups.map(([groupName, accs], groupIdx) =>
                    accs.map((acc, idx) => {
                      const rKey = `house_${acc.id}`;
                      const isRev = Boolean(revealedKeys[rKey]);

                      return (
                        <tr
                          key={acc.id}
                          className={
                            idx === 0 && groupIdx > 0
                              ? 'border-t border-[#DDE2DD]'
                              : 'border-t border-[#EEF1EE]'
                          }
                        >
                          {idx === 0 && (
                            <td
                              rowSpan={accs.length}
                              className="py-[10px] px-[14px] bg-[#F4F8F6] font-bold text-[#0D7A68] align-top border-r border-[#EBF1EE]"
                            >
                              {groupName}
                            </td>
                          )}
                          <td className="py-[8px] px-[14px]">
                            {(() => {
                              const houseTheme = getHouseColorTheme(acc.houseName, acc.cloneGroup, acc.color);
                              return (
                                <div className="flex items-center gap-[6px]">
                                  <span
                                    className="w-[7px] h-[7px] rounded-full shrink-0"
                                    style={{ backgroundColor: houseTheme.primary }}
                                  />
                                  <span className="font-semibold text-[#0F1D19]">
                                    {formatShortHouseName(acc.houseName)}
                                  </span>
                                  {acc.cloneGroup && acc.cloneGroup !== 'Sem clones' && (
                                    <span
                                      style={{
                                        backgroundColor: houseTheme.badgeBg,
                                        color: houseTheme.badgeText,
                                      }}
                                      className="px-[5px] py-[0.5px] rounded-[4px] text-[10px] font-medium"
                                    >
                                      {acc.cloneGroup}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-[8px] px-[14px]">
                            {(() => {
                              const stTheme = getHouseAccountStatusTheme(acc.status);
                              return (
                                <select
                                  aria-label={`Status da conta ${acc.label}`}
                                  value={acc.status}
                                  onChange={(e) =>
                                    updateHouseAccountOperationalStatus(
                                      acc.id,
                                      e.target.value as HouseAccountStatus
                                    )
                                  }
                                  className={`px-[9px] py-[2px] rounded-full text-[12px] font-semibold cursor-pointer border ${stTheme.bg} ${stTheme.text} ${stTheme.border}`}
                                >
                                  <option value="pronta">Pronta</option>
                                  <option value="verificar">Verificar</option>
                                  <option value="em_uso">Em uso</option>
                                  <option value="limitada">Limitada</option>
                                  <option value="aguardando_saque">Aguardando saque</option>
                                  <option value="aguardando_deposito">Aguardando depósito</option>
                                  <option value="em_conferencia">Em conferência</option>
                                </select>
                              );
                            })()}
                          </td>
                          {/* Login e Senha juntos na mesma área da conta da casa */}
                          <td className="py-[8px] px-[14px]">
                            <div className="flex flex-wrap items-center gap-[10px]">
                              <div className="inline-flex items-center gap-[6px] bg-[#F4F5F2] px-[8px] py-[3px] rounded-[6px]">
                                <span className="text-[11px] text-[#66716C]">Login:</span>
                                <span className="font-medium">
                                  {isAuthorizedForSecrets ? acc.login : '••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(acc.login, `Login ${acc.houseName}`)
                                  }
                                  className="text-[11px] text-[#0F6B5C] font-medium hover:underline cursor-pointer"
                                >
                                  Copiar
                                </button>
                              </div>

                              <div className="inline-flex items-center gap-[6px] bg-[#F4F5F2] px-[8px] py-[3px] rounded-[6px]">
                                <span className="text-[11px] text-[#66716C]">Senha:</span>
                                <span
                                  className={
                                    isRev ? 'font-mono font-medium' : 'tracking-[2px]'
                                  }
                                >
                                  {isRev && isAuthorizedForSecrets
                                    ? acc.passwordSecret
                                    : '••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleReveal(rKey, 'casa', acc.label)
                                  }
                                  className="text-[11px] text-[#0F6B5C] font-medium hover:underline cursor-pointer"
                                >
                                  {isRev ? 'Ocultar' : 'Revelar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(acc.passwordSecret, `Senha ${acc.houseName}`)
                                  }
                                  className="text-[11px] text-[#0F6B5C] font-medium hover:underline cursor-pointer"
                                >
                                  Copiar
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="py-[8px] px-[14px] text-right tabular-nums font-medium">
                            <div className="flex flex-col items-end gap-[2px]">
                              <span>
                                {formatHouseAccountBalance(
                                  acc.availableBalance,
                                  acc.accountCurrency || 'USDT'
                                )}
                              </span>
                              {acc.accountCurrency === 'EUR' && (
                                <span className="px-[6px] py-[1px] rounded-[4px] bg-[#E8F0FE] text-[#1967D2] text-[10px] font-semibold">
                                  Depósito USDT → Saldo EUR (€)
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            className={`py-[8px] px-[14px] ${acc.notes.includes('vence')
                                ? 'text-[#B3261E]'
                                : acc.notes.includes('sacar')
                                  ? 'text-[#8A4B08]'
                                  : 'text-[#66716C]'
                              }`}
                          >
                            {acc.notes}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modais Inline: Adicionar Casa / Adicionar Banco / Editar Ficha */}
          {showAddHouseModal && (
            <div className="p-[16px] rounded-[12px] bg-white border-2 border-[#0F6B5C] flex flex-col gap-[12px]">
              <div className="flex justify-between items-center">
                <b className="text-[14px]">
                  Adicionar nova conta de casa para {currentPartnership.shortName} (Catálogo de Casas)
                </b>
                <button
                  type="button"
                  onClick={() => setShowAddHouseModal(false)}
                  className="text-[12px] text-[#66716C] cursor-pointer"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-[10px]">
                <select
                  aria-label="Selecionar casa do catálogo"
                  value={newHouseName}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setNewHouseName(selected);
                    const catalogItem = houseCatalog.find(
                      (h) => h.name.toLowerCase() === selected.toLowerCase()
                    );
                    if (catalogItem) {
                      setNewHouseClone(catalogItem.cloneGroup);
                    }
                  }}
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] bg-white cursor-pointer"
                >
                  {availableHouses.map((hName) => (
                    <option key={hName} value={hName}>
                      {hName}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Grupo de clone"
                  value={newHouseClone}
                  onChange={(e) => setNewHouseClone(e.target.value)}
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] bg-white cursor-pointer"
                >
                  {cloneOptions.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Sem clones' ? 'Sem clones (Individual Offshore)' : `Clone ${c}`}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Moeda do saldo interno na casa"
                  value={newHouseCurrency}
                  onChange={(e) => setNewHouseCurrency(e.target.value as HouseAccountCurrency)}
                  className="p-[8px_10px] border border-[#0F6B5C] rounded-[8px] text-[13px] bg-[#F4FAF8] text-[#0B4F44] font-medium"
                >
                  <option value="USDT">Saldo em USDT (Depósito USDT)</option>
                  <option value="EUR">Saldo em EUR € (Depósito via USDT)</option>
                  <option value="BRL">Saldo em BRL R$ (PIX Nacional)</option>
                </select>
                <input
                  type="text"
                  value={newHouseLogin}
                  onChange={(e) => setNewHouseLogin(e.target.value)}
                  placeholder="Login da conta"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
                <input
                  type="text"
                  value={newHousePassword}
                  onChange={(e) => setNewHousePassword(e.target.value)}
                  placeholder="Senha da conta"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    addHouseToPartnership({
                      partnershipId: currentPartnership.id,
                      houseName: newHouseName,
                      cloneGroup: newHouseClone,
                      login: newHouseLogin,
                      passwordSecret: newHousePassword,
                      accountCurrency: newHouseCurrency,
                    });
                    setShowAddHouseModal(false);
                  }}
                  className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Salvar conta na parceria
                </button>
              </div>
            </div>
          )}

          {showAddBankModal && (
            <div className="p-[16px] rounded-[12px] bg-white border-2 border-[#0F6B5C] flex flex-col gap-[12px]">
              <div className="flex justify-between items-center">
                <b className="text-[14px]">
                  Vincular nova Corretora ou Carteira Cripto para {currentPartnership.shortName} (Binance / MetaMask)
                </b>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="text-[12px] text-[#66716C] cursor-pointer"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-[10px]">
                <select
                  aria-label="Selecionar corretora ou carteira do catálogo"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] bg-white cursor-pointer"
                >
                  {availableBanks.map((bName) => (
                    <option key={bName} value={bName}>
                      {bName}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newBankDevice}
                  onChange={(e) => setNewBankDevice(e.target.value)}
                  placeholder="Rede / App (ex: BEP20 / ERC20)"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
                <input
                  type="text"
                  value={newBankLogin}
                  onChange={(e) => setNewBankLogin(e.target.value)}
                  placeholder="Login / E-mail / Sub-carteira"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
                <input
                  type="text"
                  value={newBankPassword}
                  onChange={(e) => setNewBankPassword(e.target.value)}
                  placeholder="Senha / Seed / 2FA"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
                <input
                  type="text"
                  value={newBankPixKey}
                  onChange={(e) => setNewBankPixKey(e.target.value)}
                  placeholder="Endereço da Carteira (0x... BEP20/ERC20)"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] font-mono"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    addBankToPartnership({
                      partnershipId: currentPartnership.id,
                      bankName: newBankName,
                      phoneDevice: newBankDevice,
                      login: newBankLogin,
                      passwordSecret: newBankPassword,
                      pixKey: newBankPixKey,
                    });
                    setShowAddBankModal(false);
                  }}
                  className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Salvar carteira/corretora na parceria
                </button>
              </div>
            </div>
          )}

          {showEditFicha && (
            <div className="p-[16px] rounded-[12px] bg-white border-2 border-[#0F6B5C] flex flex-col gap-[12px]">
              <div className="flex justify-between items-center">
                <b className="text-[14px]">Editar ficha da parceria</b>
                <button
                  type="button"
                  onClick={() => setShowEditFicha(false)}
                  className="text-[12px] text-[#66716C] cursor-pointer"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Endereço"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
                <input
                  type="text"
                  value={editPhones}
                  onChange={(e) => setEditPhones(e.target.value)}
                  placeholder="Telefones"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
                <input
                  type="text"
                  value={editChip}
                  onChange={(e) => setEditChip(e.target.value)}
                  placeholder="Local do chip"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Observações da parceria"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
                <input
                  type="text"
                  value={editPixWithdrawals}
                  onChange={(e) => setEditPixWithdrawals(e.target.value)}
                  placeholder="Carteira de saques padrão (0x... USDT)"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] font-mono"
                />
                <input
                  type="text"
                  value={editPixPayments}
                  onChange={(e) => setEditPixPayments(e.target.value)}
                  placeholder="Rampa / Chave de pagamento"
                  className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    updatePartnershipDetails(currentPartnership.id, {
                      address: editAddress || currentPartnership.address,
                      phones: editPhones || currentPartnership.phones,
                      chipLocation: editChip || currentPartnership.chipLocation,
                      notes: editNotes || currentPartnership.notes,
                      pixWithdrawals: editPixWithdrawals || currentPartnership.pixWithdrawals,
                      pixPayments: editPixPayments || currentPartnership.pixPayments,
                    });
                    setShowEditFicha(false);
                  }}
                  className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Salvar alterações
                </button>
              </div>
            </div>
          )}

          {/* Barra de Ações Inferior idêntica ao 06_Ficha_da_parceria.html + Adicionar banco + Devolver ao estoque */}
          <div className="flex flex-wrap gap-[10px] items-center justify-between">
            <div className="flex flex-wrap gap-[10px]">
              {currentPartnership.status === 'ativa' && (
                <>
                  <button
                    type="button"
                    disabled={partnershipAccounts.length === 0}
                    onClick={() => setActiveScreen('entradas')}
                    title={
                      partnershipAccounts.length === 0
                        ? 'Cadastre ao menos 1 conta na parceria antes de registrar entradas'
                        : 'Lançar aposta com as contas desta parceria'
                    }
                    className={`px-[16px] py-[9px] rounded-[8px] text-[13px] font-medium transition-colors ${
                      partnershipAccounts.length === 0
                        ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                        : 'bg-[#0F6B5C] text-white hover:bg-[#0B4F44] cursor-pointer'
                    }`}
                  >
                    Registrar entrada
                  </button>
                  <button
                    type="button"
                    disabled={partnershipAccounts.length === 0}
                    onClick={() => setActiveScreen('saques')}
                    title={
                      partnershipAccounts.length === 0
                        ? 'Cadastre ao menos 1 conta na parceria antes de registrar saques'
                        : 'Solicitar saque de uma conta desta parceria'
                    }
                    className={`px-[16px] py-[9px] rounded-[8px] border text-[13px] transition-colors ${
                      partnershipAccounts.length === 0
                        ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed'
                        : 'border-[#CBD2CD] bg-white text-[#1B2421] hover:bg-[#F4F5F2] cursor-pointer'
                    }`}
                  >
                    Registrar saque
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowAddHouseModal((v) => !v)}
                className="px-[16px] py-[9px] rounded-[8px] border border-[#CBD2CD] bg-white text-[13px] hover:bg-[#F4F5F2] cursor-pointer"
              >
                Adicionar casa
              </button>
              <button
                type="button"
                onClick={() => setShowAddBankModal((v) => !v)}
                className="px-[16px] py-[9px] rounded-[8px] border border-[#CBD2CD] bg-white text-[13px] hover:bg-[#F4F5F2] cursor-pointer"
              >
                Adicionar corretora / carteira
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditAddress(currentPartnership.address);
                  setEditPhones(currentPartnership.phones);
                  setEditChip(currentPartnership.chipLocation);
                  setEditNotes(currentPartnership.notes);
                  setEditPixWithdrawals(currentPartnership.pixWithdrawals || '');
                  setEditPixPayments(currentPartnership.pixPayments || '');
                  setShowEditFicha((v) => !v);
                }}
                className="px-[16px] py-[9px] rounded-[8px] border border-[#CBD2CD] bg-white text-[13px] hover:bg-[#F4F5F2] cursor-pointer"
              >
                Editar ficha
              </button>
            </div>

            {currentPartnership.status === 'ativa' && (
              <button
                type="button"
                onClick={() =>
                  returnPartnershipToStock(
                    currentPartnership.id,
                    'Devolvida ao estoque pelo operador responsável'
                  )
                }
                className="px-[14px] py-[9px] rounded-[8px] border border-[#E8A33D] text-[#8A4B08] bg-white text-[13px] font-medium hover:bg-[#FBF0DD] cursor-pointer"
              >
                Devolver parceria ao estoque
              </button>
            )}
          </div>

          {/* Histórico de Atribuição e Auditoria da Parceria */}
          {currentPartnership.assignmentHistory.length > 0 && (
            <div className="bg-white border border-[#E1E5E1] rounded-[14px] p-[16px] flex flex-col gap-[6px] text-[12px]">
              <b className="text-[#1B2421]">
                Histórico de atribuição, estoque e ressarcimento desta parceria:
              </b>
              {currentPartnership.assignmentHistory.map((ev) => (
                <div key={ev.id} className="text-[#66716C]">
                  • {ev.date} — <b className="text-[#44504B]">{ev.authorName}</b>: {ev.note}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
