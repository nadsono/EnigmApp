import React, { useState, useMemo, useEffect } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import { CryptoRouteFields, CryptoRouteSummary, useCryptoNetworks } from '../components/CryptoNetworkManager.tsx';
import { buildCryptoRouteMetadata } from '../domain/cryptoNetworks.ts';
import {
  formatCurrencyBRL,
  formatBrlEquivalent,
  isWithdrawalInTransit,
  parseCurrencyInput,
  roundCurrency,
} from '../domain/ledger.ts';
import type { WithdrawalIssueType } from '../domain/types.ts';

export const SaquesScreen: React.FC = () => {
  const {
    houseAccounts,
    bankAccounts,
    partnerships,
    withdrawals,
    deposits,
    operationalMonthYearLabel,
    usdtBrlRate,
    eurUsdtRate,
    operatorPreferredExchange,
    createWithdrawal,
    advanceWithdrawalStage,
    registerStandaloneFacial,
    createDepositOrTransfer,
    confirmPendingDeposit,
    setActiveScreen,
  } = useEnigma();

  const activePartnershipIds = useMemo(
    () => new Set(partnerships.filter((p) => p.status === 'ativa').map((p) => p.id)),
    [partnerships]
  );

  const operationalHouseAccounts = useMemo(
    () => houseAccounts.filter((acc) => activePartnershipIds.has(acc.partnershipId)),
    [houseAccounts, activePartnershipIds]
  );

  // Tab do formulário principal: 'saque' | 'deposito'
  const [formTab, setFormTab] = useState<'saque' | 'deposito'>('saque');
  const { networks: cryptoNetworks, issue: cryptoCatalogIssue } = useCryptoNetworks();
  const [withdrawalNetwork, setWithdrawalNetwork] = useState('');
  const [depositNetwork, setDepositNetwork] = useState('');
  const [withdrawalAsset, setWithdrawalAsset] = useState('');
  const [depositAsset, setDepositAsset] = useState('');
  const [withdrawalCompatibilityConfirmed, setWithdrawalCompatibilityConfirmed] = useState(false);
  const [depositCompatibilityConfirmed, setDepositCompatibilityConfirmed] = useState(false);
  const selectedCryptoNetwork = formTab === 'saque' ? withdrawalNetwork : depositNetwork;
  const [showCryptoGuide, setShowCryptoGuide] = useState<boolean>(false);

  // Campos de Registrar Saque (fiel ao 02_Saques_e_transferencias.html)
  const [originHouseAccountId, setOriginHouseAccountId] = useState<string>('acc_bet365_maria');
  const [withdrawalAmountStr, setWithdrawalAmountStr] = useState<string>('2.000,00');
  const [destBankId, setDestBankId] = useState<string>('bank_inter_maria');
  const [requestedAtStr, setRequestedAtStr] = useState<string>(() => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ''));
  const [facial1Str, setFacial1Str] = useState<string>('8,00');
  const [facial2Str, setFacial2Str] = useState<string>('8,00');
  const [facial3Str, setFacial3Str] = useState<string>('');
  const [noCostChecked, setNoCostChecked] = useState<boolean>(false);

  // Modal/painel inline para ocorrência ou recebimento parcial/tarifa em um saque em andamento
  const [inspectingWithdrawalId, setInspectingWithdrawalId] = useState<string | null>(null);
  const [issueTypeInput, setIssueTypeInput] = useState<WithdrawalIssueType>('recebimento_parcial');
  const [receivedAmountStr, setReceivedAmountStr] = useState<string>('');
  const [feeAmountStr, setFeeAmountStr] = useState<string>('0,00');
  const [issueNotesInput, setIssueNotesInput] = useState<string>('');

  // Campos de Registrar Depósito (Banco -> Casa) ou Transferência entre Bancos
  const [depositType, setDepositType] = useState<'deposito_casa' | 'transferencia_bancos'>('deposito_casa');
  const [depOriginBankId, setDepOriginBankId] = useState<string>('bank_inter_maria');
  const [depDestHouseAccountId, setDepDestHouseAccountId] = useState<string>('acc_betnacional_maria');
  const [depDestBankId, setDepDestBankId] = useState<string>('bank_pg_joao');
  const [depAmountStr, setDepAmountStr] = useState<string>('1.500,00');
  const [depFeeStr, setDepFeeStr] = useState<string>('0,00');
  const [depStatus, setDepStatus] = useState<'pretendido' | 'confirmado'>('confirmado');
  const [depNotes, setDepNotes] = useState<string>('Reforço de saldo para operação');

  useEffect(() => { setWithdrawalCompatibilityConfirmed(false); }, [originHouseAccountId, destBankId]);
  useEffect(() => { setDepositCompatibilityConfirmed(false); }, [depositType, depOriginBankId, depDestHouseAccountId, depDestBankId]);

  // Campos de Facial avulsa ou semanal
  const [standaloneAccountId, setStandaloneAccountId] = useState<string>('acc_kto_maria');
  const [standaloneAmountStr, setStandaloneAmountStr] = useState<string>('8,00');
  const [standaloneKind, setStandaloneKind] = useState<'Semanal' | 'Avulsa'>('Semanal');

  // Ao selecionar conta da casa no saque, vincula automaticamente o banco da mesma parceria
  const handleSelectOriginHouse = (accId: string) => {
    setOriginHouseAccountId(accId);
    const acc = houseAccounts.find((a) => a.id === accId);
    if (acc) {
      const partnerBank = bankAccounts.find((b) => b.partnershipId === acc.partnershipId);
      if (partnerBank) {
        setDestBankId(partnerBank.id);
      }
    }
  };

  const totalFaciais = roundCurrency(
    (noCostChecked ? 0 : parseCurrencyInput(facial1Str) || 0) +
      (noCostChecked ? 0 : parseCurrencyInput(facial2Str) || 0) +
      (noCostChecked ? 0 : parseCurrencyInput(facial3Str) || 0)
  );

  const handleCreateWithdrawal = (stage: 'solicitado' | 'concluido_casa') => {
    const amount = parseCurrencyInput(withdrawalAmountStr) || 0;
    const faciais = noCostChecked
      ? []
      : [
          parseCurrencyInput(facial1Str) || 0,
          parseCurrencyInput(facial2Str) || 0,
          parseCurrencyInput(facial3Str) || 0,
        ].filter((v) => v > 0);

    createWithdrawal({
      houseAccountId: originHouseAccountId,
      destinationBankId: destBankId,
      amount,
      requestedAt: requestedAtStr,
      facialCosts: faciais,
      noCostConfirmed: noCostChecked,
      initialStage: stage,
      cryptoRoute: buildCryptoRouteMetadata(cryptoNetworks, withdrawalNetwork, withdrawalAsset, withdrawalCompatibilityConfirmed),
    });
  };

  const handleSubmitDeposit = () => {
    const amount = parseCurrencyInput(depAmountStr) || 0;
    const fee = parseCurrencyInput(depFeeStr) || 0;
    createDepositOrTransfer({
      type: depositType,
      originBankId: depOriginBankId,
      destinationHouseAccountId: depositType === 'deposito_casa' ? depDestHouseAccountId : null,
      destinationBankId: depositType === 'transferencia_bancos' ? depDestBankId : null,
      amount,
      feeAmount: fee,
      status: depStatus,
      notes: depNotes,
      cryptoRoute: buildCryptoRouteMetadata(cryptoNetworks, depositNetwork, depositAsset, depositCompatibilityConfirmed),
    });
  };

  const handleRegisterStandaloneFacial = () => {
    const val = parseCurrencyInput(standaloneAmountStr) || 0;
    registerStandaloneFacial({
      houseAccountId: standaloneAccountId,
      amount: val,
      kind: standaloneKind,
    });
  };

  const activeWithdrawals = withdrawals.filter(isWithdrawalInTransit);
  const completedWithdrawals = withdrawals.filter((w) => !isWithdrawalInTransit(w));

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Cabeçalho Enxuto Cripto / Offshore */}
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <div className="flex items-center gap-[12px]">
          <h1 className="m-0 text-[22px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Saques e Transferências
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <button
            type="button"
            onClick={() => setShowCryptoGuide((prev) => !prev)}
            className={`px-[12px] py-[6px] rounded-[8px] border text-[12px] font-semibold transition-colors cursor-pointer ${
              showCryptoGuide
                ? 'bg-[#0F6B5C] text-white border-[#0F6B5C]'
                : 'bg-white text-[#44504B] border-[#CBD2CD] hover:bg-[#F4F5F2]'
            }`}
          >
            {showCryptoGuide ? 'Ocultar Regras / Fluxo' : 'Ver Regras / Fluxo'}
          </button>
        </div>
      </div>

      {/* Guia Operacional Recolhível sob demanda */}
      {showCryptoGuide && (
        <div className="bg-[#FAFDFB] border border-[#CBE2D8] rounded-[12px] px-[16px] py-[12px] flex flex-wrap justify-between items-center gap-[12px] text-[12px]">
          <div className="flex flex-col gap-[2px]">
            <b className="text-[#0B4F44]">
              Conferência da operação{selectedCryptoNetwork ? ` · ${selectedCryptoNetwork}` : ''}:
            </b>
            <span className="text-[#44504B]">
              Confirme o ativo, a mesma rede na origem e no destino, o endereço e eventual memo/tag nos serviços utilizados. Confira taxas e conversão para a moeda de saldo separadamente. {selectedCryptoNetwork ? `A rede ${selectedCryptoNetwork} foi escolhida manualmente neste formulário.` : 'Escolha a rede no formulário quando a operação for cripto.'} O cadastro não comprova compatibilidade com nenhuma casa, carteira ou corretora. Se houver ponte entre redes, registre essa etapa separadamente.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-[20px] items-start">
        {/* Seção Esquerda: Registrar Saque ou Registrar Depósito/Transferência */}
        <section className="flex-1 min-w-0 w-full bg-white border border-[#E1E5E1] rounded-[14px] p-[22px] flex flex-col gap-[18px]">
          <div className="flex flex-wrap justify-between items-center gap-[10px]">
            <div className="text-[16px] font-semibold">
              {formTab === 'saque' ? 'Registrar saque' : 'Registrar depósito ou transferência'}
            </div>
            <div className="flex gap-[4px] p-[3px] rounded-[9px] bg-[#EEF1EE] text-[13px]">
              <button
                type="button"
                onClick={() => setFormTab('saque')}
                className={`px-[12px] py-[5px] rounded-[6px] cursor-pointer ${
                  formTab === 'saque'
                    ? 'bg-white text-[#0F6B5C] font-semibold shadow-xs'
                    : 'text-[#66716C]'
                }`}
              >
                Registrar saque
              </button>
              <button
                type="button"
                onClick={() => setFormTab('deposito')}
                className={`px-[12px] py-[5px] rounded-[6px] cursor-pointer ${
                  formTab === 'deposito'
                    ? 'bg-white text-[#0F6B5C] font-semibold shadow-xs'
                    : 'text-[#66716C]'
                }`}
              >
                Depósito ou transferência
              </button>
            </div>
          </div>

          {cryptoCatalogIssue && <p role="alert" className="m-0 text-[12px] text-[#8A5A10]">{cryptoCatalogIssue}</p>}
          <CryptoRouteFields
            networks={cryptoNetworks}
            selectedNetwork={selectedCryptoNetwork}
            onNetworkChange={(value) => {
              if (formTab === 'saque') { setWithdrawalNetwork(value); setWithdrawalCompatibilityConfirmed(false); }
              else { setDepositNetwork(value); setDepositCompatibilityConfirmed(false); }
            }}
            assetSymbol={formTab === 'saque' ? withdrawalAsset : depositAsset}
            onAssetChange={(value) => {
              if (formTab === 'saque') { setWithdrawalAsset(value); setWithdrawalCompatibilityConfirmed(false); }
              else { setDepositAsset(value); setDepositCompatibilityConfirmed(false); }
            }}
            confirmed={formTab === 'saque' ? withdrawalCompatibilityConfirmed : depositCompatibilityConfirmed}
            onConfirmedChange={formTab === 'saque' ? setWithdrawalCompatibilityConfirmed : setDepositCompatibilityConfirmed}
          />

          {formTab === 'saque' ? (
            <>
              {/* Stepper de 4 estágios rastreáveis */}
              <div className="flex flex-wrap items-center gap-[10px] text-[13px]">
                <div className="flex items-center gap-[8px]">
                  <span className="w-[24px] h-[24px] rounded-full bg-[#0F6B5C] text-white inline-flex items-center justify-center text-[12px] font-semibold">
                    1
                  </span>
                  <b>Solicitado</b>
                </div>
                <div className="flex-1 h-[2px] bg-[#CBD2CD] min-w-[20px]" />
                <div className="flex items-center gap-[8px] text-[#66716C]">
                  <span className="w-[24px] h-[24px] rounded-full border-2 border-[#CBD2CD] inline-flex items-center justify-center text-[12px]">
                    2
                  </span>
                  <span>Concluído na casa</span>
                </div>
                <div className="flex-1 h-[2px] bg-[#CBD2CD] min-w-[20px]" />
                <div className="flex items-center gap-[8px] text-[#66716C]">
                  <span className="w-[24px] h-[24px] rounded-full border-2 border-[#CBD2CD] inline-flex items-center justify-center text-[12px]">
                    3
                  </span>
                  <span>Em trânsito</span>
                </div>
                <div className="flex-1 h-[2px] bg-[#CBD2CD] min-w-[20px]" />
                <div className="flex items-center gap-[8px] text-[#66716C]">
                  <span className="w-[24px] h-[24px] rounded-full border-2 border-[#CBD2CD] inline-flex items-center justify-center text-[12px]">
                    4
                  </span>
                  <span>Recebido no banco</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="s-or" className="text-[12px] font-medium text-[#66716C]">
                    Casa de origem (conta)
                  </label>
                  <select
                    id="s-or"
                    value={originHouseAccountId}
                    onChange={(e) => handleSelectOriginHouse(e.target.value)}
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white cursor-pointer"
                  >
                    {operationalHouseAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.label} — Disponível: {formatCurrencyBRL(acc.availableBalance)}
                        {acc.status === 'limitada' ? ' (Limitada - saque liberado)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="s-vl" className="text-[12px] font-medium text-[#66716C]">
                    Valor do saque (moeda do registro local)
                  </label>
                  <input
                    id="s-vl"
                    value={withdrawalAmountStr}
                    onChange={(e) => setWithdrawalAmountStr(e.target.value)}
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] text-right tabular-nums"
                  />
                  <span className="text-[11px] text-[#0F6B5C] text-right tabular-nums">
                    {formatCurrencyBRL(parseCurrencyInput(withdrawalAmountStr) || 0)} ·{' '}
                    Equiv. Euro: €{' '}
                    {roundCurrency(
                      (parseCurrencyInput(withdrawalAmountStr) || 0) / (eurUsdtRate || 1.08)
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                    EUR · Rede: {withdrawalNetwork || 'não informada'}
                  </span>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="s-ds" className="text-[12px] font-medium text-[#66716C]">
                    Conta / Carteira de destino
                  </label>
                  <select
                    id="s-ds"
                    value={destBankId}
                    onChange={(e) => setDestBankId(e.target.value)}
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label} (Carteira: {b.pixKey})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="s-dt" className="text-[12px] font-medium text-[#66716C]">
                    Solicitado em
                  </label>
                  <input
                    id="s-dt"
                    value={requestedAtStr}
                    onChange={(e) => setRequestedAtStr(e.target.value)}
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
                  />
                </div>
              </div>

              {/* Faciais usadas neste saque */}
              <div className="border border-[#E1E5E1] rounded-[12px] p-[14px] flex flex-col gap-[12px] bg-[#FAFBF9]">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">Faciais usadas neste saque</div>
                  <div className="text-[12px] text-[#66716C]">
                    cada valor vira custo (saques) automaticamente
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-[12px]">
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="s-f1" className="text-[12px] font-medium text-[#66716C]">
                      Facial 1 (USDT)
                    </label>
                    <input
                      id="s-f1"
                      disabled={noCostChecked}
                      value={facial1Str}
                      onChange={(e) => setFacial1Str(e.target.value)}
                      className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] text-right bg-white tabular-nums disabled:opacity-50"
                    />
                    <span className="text-[10px] text-[#64748B] text-right tabular-nums">
                      ≈ {formatBrlEquivalent(parseCurrencyInput(facial1Str) || 0)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="s-f2" className="text-[12px] font-medium text-[#66716C]">
                      Facial 2 (USDT)
                    </label>
                    <input
                      id="s-f2"
                      disabled={noCostChecked}
                      value={facial2Str}
                      onChange={(e) => setFacial2Str(e.target.value)}
                      className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] text-right bg-white tabular-nums disabled:opacity-50"
                    />
                    <span className="text-[10px] text-[#64748B] text-right tabular-nums">
                      ≈ {formatBrlEquivalent(parseCurrencyInput(facial2Str) || 0)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="s-f3" className="text-[12px] font-medium text-[#66716C]">
                      Facial 3 (USDT)
                    </label>
                    <input
                      id="s-f3"
                      disabled={noCostChecked}
                      value={facial3Str}
                      onChange={(e) => setFacial3Str(e.target.value)}
                      placeholder="opcional"
                      className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] text-right bg-white tabular-nums disabled:opacity-50"
                    />
                    <span className="text-[10px] text-[#64748B] text-right tabular-nums">
                      ≈ {formatBrlEquivalent(parseCurrencyInput(facial3Str) || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[13px] text-[#66716C]">
                    Custo total lançado em Custos:{' '}
                    <b className="text-[#1B2421] tabular-nums">{formatCurrencyBRL(totalFaciais)}</b>
                    <span className="text-[11px] text-[#64748B] ml-[4px]">
                      (≈ {formatBrlEquivalent(totalFaciais)})
                    </span>
                  </div>
                  <div className="text-[13px] text-[#66716C] flex items-center gap-[6px]">
                    <input
                      id="s-sc"
                      type="checkbox"
                      checked={noCostChecked}
                      onChange={(e) => setNoCostChecked(e.target.checked)}
                    />
                    <label htmlFor="s-sc" className="cursor-pointer">
                      Saque sem custo
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-[14px] py-[12px] rounded-[10px] bg-[#FBF0DD] text-[#6B3E08] text-[13px] leading-[1.5]">
                <b>Alerta:</b> se você concluir o saque na casa sem lançar facial e sem marcar
                &quot;saque sem custo&quot;, o app avisa e mantém uma pendência. O saque permanece{' '}
                <b>em trânsito</b> até a confirmação do crédito no banco.
              </div>

              <div className="flex justify-end gap-[10px]">
                <button
                  type="button"
                  onClick={() => handleCreateWithdrawal('solicitado')}
                  className="px-[20px] py-[11px] rounded-[9px] border border-[#CBD2CD] text-[#44504B] font-medium hover:bg-[#F4F5F2] cursor-pointer"
                >
                  Salvar como solicitado
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateWithdrawal('concluido_casa')}
                  className="px-[22px] py-[11px] rounded-[9px] bg-[#0F6B5C] text-white font-semibold hover:bg-[#0B4F44] cursor-pointer"
                >
                  Concluir na casa (em trânsito)
                </button>
              </div>
            </>
          ) : (
            /* Aba: Registrar Depósito (Banco -> Casa) ou Transferência entre Bancos */
            <div className="flex flex-col gap-[16px]">
              <div className="flex gap-[8px] text-[13px]">
                <button
                  type="button"
                  onClick={() => setDepositType('deposito_casa')}
                  className={`px-[12px] py-[6px] rounded-full cursor-pointer ${
                    depositType === 'deposito_casa'
                      ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                      : 'border border-[#DDE2DD] text-[#66716C]'
                  }`}
                >
                  Depósito (Banco → Conta da Casa)
                </button>
                <button
                  type="button"
                  onClick={() => setDepositType('transferencia_bancos')}
                  className={`px-[12px] py-[6px] rounded-full cursor-pointer ${
                    depositType === 'transferencia_bancos'
                      ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                      : 'border border-[#DDE2DD] text-[#66716C]'
                  }`}
                >
                  Transferência entre Bancos
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <div className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-medium text-[#66716C]">
                    Banco de origem
                  </label>
                  <select
                    aria-label="Banco de origem do depósito"
                    value={depOriginBankId}
                    onChange={(e) => setDepOriginBankId(e.target.value)}
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label} — Saldo: {formatCurrencyBRL(b.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {depositType === 'deposito_casa' ? (
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[12px] font-medium text-[#66716C]">
                      Conta da casa de destino
                    </label>
                    <select
                      aria-label="Conta da casa de destino"
                      value={depDestHouseAccountId}
                      onChange={(e) => setDepDestHouseAccountId(e.target.value)}
                      className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white"
                    >
                      {operationalHouseAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.label} (Saldo atual: {formatCurrencyBRL(acc.availableBalance)})
                          {acc.status === 'limitada' ? ' [LIMITADA - bloqueada]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[12px] font-medium text-[#66716C]">
                      Banco de destino
                    </label>
                    <select
                      aria-label="Banco de destino da transferência"
                      value={depDestBankId}
                      onChange={(e) => setDepDestBankId(e.target.value)}
                      className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white"
                    >
                      {bankAccounts
                        .filter((b) => b.id !== depOriginBankId)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.label} — Saldo: {formatCurrencyBRL(b.balance)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-medium text-[#66716C]">
                    Valor da transferência/depósito (USDT)
                  </label>
                  <input
                    type="text"
                    value={depAmountStr}
                    onChange={(e) => setDepAmountStr(e.target.value)}
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] text-right tabular-nums bg-white"
                  />
                  <span className="text-[10px] text-[#64748B] text-right tabular-nums">
                    ≈ {formatBrlEquivalent(parseCurrencyInput(depAmountStr) || 0)}
                  </span>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-medium text-[#66716C]">
                    Tarifa efetivamente cobrada (USDT — só tarifa vira custo)
                  </label>
                  <input
                    type="text"
                    value={depFeeStr}
                    onChange={(e) => setDepFeeStr(e.target.value)}
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] text-right tabular-nums bg-white"
                  />
                  <span className="text-[10px] text-[#64748B] text-right tabular-nums">
                    ≈ {formatBrlEquivalent(parseCurrencyInput(depFeeStr) || 0)}
                  </span>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-medium text-[#66716C]">
                    Situação do depósito
                  </label>
                  <select
                    aria-label="Situação do depósito"
                    value={depStatus}
                    onChange={(e) =>
                      setDepStatus(e.target.value as 'pretendido' | 'confirmado')
                    }
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white"
                  >
                    <option value="confirmado">Confirmado na casa (atualiza saldo agora)</option>
                    <option value="pretendido">Pretendido / Pendente (vai para Pendências)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-medium text-[#66716C]">
                    Observação / Referência
                  </label>
                  <input
                    type="text"
                    value={depNotes}
                    onChange={(e) => setDepNotes(e.target.value)}
                    className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
                  />
                </div>
              </div>

              <div className="px-[14px] py-[10px] rounded-[10px] bg-[#F4F5F2] text-[12px] text-[#44504B]">
                Transferências entre banco e casa movimentam capital e <b>não contam como lucro ou despesa</b>. Apenas uma tarifa efetivamente cobrada entra em Custos.
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitDeposit}
                  className="px-[22px] py-[11px] rounded-[9px] bg-[#0F6B5C] text-white font-semibold hover:bg-[#0B4F44] cursor-pointer"
                >
                  {depStatus === 'confirmado'
                    ? 'Confirmar e atualizar saldos'
                    : 'Registrar depósito pretendido'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Coluna Lateral Direita (420px): Saques em andamento + Facial avulsa ou semanal */}
        <aside className="w-full lg:w-[420px] shrink-0 flex flex-col gap-[16px]">
          <section className="bg-white border border-[#E1E5E1] rounded-[14px] p-[18px] flex flex-col gap-[10px]">
            <div className="flex justify-between items-center">
              <div className="text-[15px] font-semibold">
                Saques em andamento ({activeWithdrawals.length})
              </div>
              <span className="text-[12px] text-[#66716C] tabular-nums">
                {formatCurrencyBRL(
                  activeWithdrawals.reduce((acc, w) => acc + w.amount, 0)
                )}{' '}
                em trânsito
              </span>
            </div>

            {activeWithdrawals.map((w) => {
              const acc = houseAccounts.find((a) => a.id === w.houseAccountId);
              const bank = bankAccounts.find((b) => b.id === w.destinationBankId);
              const isAlert = w.issueType !== 'nenhum' || w.hoursElapsed >= 24;
              const isInspecting = inspectingWithdrawalId === w.id;

              return (
                <div
                  key={w.id}
                  className={`p-[12px] rounded-[10px] flex flex-col gap-[6px] ${
                    isAlert ? 'bg-[#FBE9E7]' : 'bg-[#F4F5F2]'
                  }`}
                >
                  <div className="flex justify-between">
                    <b>{acc?.label || w.houseAccountId}</b>
                    <b className="tabular-nums">{formatCurrencyBRL(w.amount)}</b>
                  </div>
                  <div
                    className={`text-[12px] ${
                      isAlert ? 'text-[#8C1D18]' : 'text-[#66716C]'
                    }`}
                  >
                    {isAlert && w.issueNotes
                      ? w.issueNotes
                      : `para ${bank?.label || 'Banco'}`}
                  </div>

                  <CryptoRouteSummary route={w.cryptoRoute} />

                  <div className="flex flex-wrap justify-between items-center gap-[6px]">
                    <span
                      className={`px-[9px] py-[2px] rounded-full text-[12px] ${
                        w.stage === 'solicitado'
                          ? 'bg-[#EEF1EE] text-[#44504B]'
                          : w.stage === 'concluido_casa'
                          ? 'bg-[#E3F1EE] text-[#0B4F44]'
                          : 'bg-[#FBF0DD] text-[#8A4B08]'
                      }`}
                    >
                      {w.stage === 'solicitado'
                        ? '1 · Solicitado na casa'
                        : w.stage === 'concluido_casa'
                        ? '2 · Concluído na casa'
                        : '3 · Em trânsito'}
                    </span>
                    <span className="text-[12px] text-[#66716C]">
                      há {w.hoursElapsed} h{' '}
                      {w.stage === 'concluido_casa' ? '· esperado no banco' : ''}
                    </span>
                  </div>

                  {/* Botões de ação do ciclo rastreável */}
                  <div className="flex flex-wrap gap-[6px] pt-[4px]">
                    {w.stage === 'solicitado' && (
                      <button
                        type="button"
                        onClick={() => advanceWithdrawalStage(w.id, 'concluido_casa')}
                        className="px-[10px] py-[5px] rounded-[7px] bg-[#0F6B5C] text-white text-[12px] font-medium cursor-pointer"
                      >
                        Liberado na casa
                      </button>
                    )}
                    {w.stage === 'concluido_casa' && (
                      <button
                        type="button"
                        onClick={() => advanceWithdrawalStage(w.id, 'em_transito')}
                        className="px-[10px] py-[5px] rounded-[7px] border border-[#0F6B5C] text-[#0F6B5C] text-[12px] font-medium cursor-pointer"
                      >
                        Marcar em trânsito
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => advanceWithdrawalStage(w.id, 'recebido_banco')}
                      className={`px-[12px] py-[5px] rounded-[7px] text-[12px] font-medium cursor-pointer ${
                        isAlert
                          ? 'border border-[#E3B7B2] text-[#8C1D18] bg-white'
                          : 'bg-[#0F6B5C] text-white'
                      }`}
                    >
                      Chegou no banco
                    </button>

                    {isAlert && (
                      <button
                        type="button"
                        onClick={() => setActiveScreen('conferencia')}
                        className="px-[12px] py-[5px] rounded-[7px] bg-[#B3261E] text-white text-[12px] font-medium cursor-pointer"
                      >
                        Investigar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setInspectingWithdrawalId(isInspecting ? null : w.id);
                        setReceivedAmountStr(
                          w.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                        );
                      }}
                      className="px-[10px] py-[5px] rounded-[7px] border border-[#CBD2CD] bg-white text-[#44504B] text-[12px] cursor-pointer"
                    >
                      {isInspecting ? 'Fechar ocorrência' : 'Ocorrência / Parcial'}
                    </button>
                  </div>

                  {/* Painel expansível para registrar atraso, recebimento parcial, falha, devolução, tarifa ou destino incorreto */}
                  {isInspecting && (
                    <div className="mt-[6px] p-[10px] rounded-[8px] bg-white border border-[#CBD2CD] flex flex-col gap-[8px] text-[12px]">
                      <div className="font-semibold text-[#1B2421]">
                        Registrar ocorrência ou conciliação com diferença
                      </div>
                      <select
                        aria-label="Tipo de ocorrência no saque"
                        value={issueTypeInput}
                        onChange={(e) =>
                          setIssueTypeInput(e.target.value as WithdrawalIssueType)
                        }
                        className="p-[6px_8px] border border-[#CBD2CD] rounded-[6px]"
                      >
                        <option value="recebimento_parcial">Recebimento parcial ou com tarifa</option>
                        <option value="atraso">Atraso acima do prazo</option>
                        <option value="falha_devolvido">Falha / Devolvido para a casa</option>
                        <option value="erro_destino">Destino / Chave PIX incorreta</option>
                        <option value="em_investigacao">Em investigação junto à casa/banco</option>
                      </select>

                      {issueTypeInput === 'recebimento_parcial' && (
                        <div className="grid grid-cols-2 gap-[8px]">
                          <div>
                            <label className="text-[11px] text-[#66716C]">Valor creditado (USDT)</label>
                            <input
                              type="text"
                              value={receivedAmountStr}
                              onChange={(e) => setReceivedAmountStr(e.target.value)}
                              className="w-full p-[6px] border border-[#CBD2CD] rounded-[6px] text-right tabular-nums bg-white"
                            />
                            <span className="text-[9.5px] text-[#64748B] block text-right">
                              ≈ {formatBrlEquivalent(parseCurrencyInput(receivedAmountStr) || 0)}
                            </span>
                          </div>
                          <div>
                            <label className="text-[11px] text-[#66716C]">Tarifa cobrada (USDT)</label>
                            <input
                              type="text"
                              value={feeAmountStr}
                              onChange={(e) => setFeeAmountStr(e.target.value)}
                              className="w-full p-[6px] border border-[#CBD2CD] rounded-[6px] text-right tabular-nums bg-white"
                            />
                            <span className="text-[9.5px] text-[#64748B] block text-right">
                              ≈ {formatBrlEquivalent(parseCurrencyInput(feeAmountStr) || 0)}
                            </span>
                          </div>
                        </div>
                      )}

                      <input
                        type="text"
                        value={issueNotesInput}
                        onChange={(e) => setIssueNotesInput(e.target.value)}
                        placeholder="Observação da ocorrência..."
                        className="p-[6px_8px] border border-[#CBD2CD] rounded-[6px]"
                      />

                      <div className="flex justify-end gap-[6px]">
                        {issueTypeInput === 'falha_devolvido' ? (
                          <button
                            type="button"
                            onClick={() => {
                              advanceWithdrawalStage(w.id, 'devolvido_casa', {
                                issueType: 'falha_devolvido',
                                issueNotes: issueNotesInput || 'Saque falhou e voltou para a casa',
                              });
                              setInspectingWithdrawalId(null);
                            }}
                            className="px-[10px] py-[5px] rounded-[6px] bg-[#B3261E] text-white font-medium cursor-pointer"
                          >
                            Confirmar devolução à casa
                          </button>
                        ) : issueTypeInput === 'recebimento_parcial' ? (
                          <button
                            type="button"
                            onClick={() => {
                              advanceWithdrawalStage(w.id, 'recebido_banco', {
                                receivedAmount: parseCurrencyInput(receivedAmountStr) || w.amount,
                                feeAmount: parseCurrencyInput(feeAmountStr) || 0,
                                issueType: 'recebimento_parcial',
                                issueNotes: issueNotesInput || 'Recebido com ajuste/tarifa',
                              });
                              setInspectingWithdrawalId(null);
                            }}
                            className="px-[10px] py-[5px] rounded-[6px] bg-[#0F6B5C] text-white font-medium cursor-pointer"
                          >
                            Confirmar crédito parcial/tarifa
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              advanceWithdrawalStage(w.id, 'em_transito', {
                                issueType: issueTypeInput,
                                issueNotes:
                                  issueNotesInput ||
                                  `Ocorrência: ${issueTypeInput.replace('_', ' ')}`,
                              });
                              setInspectingWithdrawalId(null);
                            }}
                            className="px-[10px] py-[5px] rounded-[6px] bg-[#0F6B5C] text-white font-medium cursor-pointer"
                          >
                            Salvar ocorrência
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {completedWithdrawals.length > 0 && (
              <div className="pt-[6px] border-t border-[#EEF1EE] text-[12px] text-[#66716C]">
                Concluídos no banco recentemente: {completedWithdrawals.length} saque(s) conciliado(s).
              </div>
            )}
          </section>

          {/* Card: Facial avulsa ou semanal */}
          <section className="bg-white border border-[#E1E5E1] rounded-[14px] p-[18px] flex flex-col gap-[10px]">
            <div className="text-[15px] font-semibold">Facial avulsa ou semanal</div>
            <div className="text-[13px] text-[#66716C] leading-[1.5]">
              Para liberar acesso a uma casa ou cumprir a facial da semana, sem saque. Vai direto para Custos.
            </div>
            <div className="grid grid-cols-2 gap-[10px]">
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="fa-c" className="text-[12px] font-medium text-[#66716C]">
                  Conta
                </label>
                <select
                  id="fa-c"
                  value={standaloneAccountId}
                  onChange={(e) => setStandaloneAccountId(e.target.value)}
                  className="p-[9px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] bg-white"
                >
                  {operationalHouseAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-[4px]">
                <label htmlFor="fa-v" className="text-[12px] font-medium text-[#66716C]">
                  Valor (USDT)
                </label>
                <input
                  id="fa-v"
                  value={standaloneAmountStr}
                  onChange={(e) => setStandaloneAmountStr(e.target.value)}
                  className="p-[9px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] text-right tabular-nums bg-white"
                />
                <span className="text-[10px] text-[#64748B] text-right tabular-nums">
                  ≈ {formatBrlEquivalent(parseCurrencyInput(standaloneAmountStr) || 0)}
                </span>
              </div>
            </div>
            <div className="flex gap-[8px]">
              <button
                type="button"
                onClick={() => setStandaloneKind('Semanal')}
                className={`px-[12px] py-[5px] rounded-full text-[12px] cursor-pointer ${
                  standaloneKind === 'Semanal'
                    ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                    : 'border border-[#DDE2DD] text-[#66716C]'
                }`}
              >
                Semanal
              </button>
              <button
                type="button"
                onClick={() => setStandaloneKind('Avulsa')}
                className={`px-[12px] py-[5px] rounded-full text-[12px] cursor-pointer ${
                  standaloneKind === 'Avulsa'
                    ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                    : 'border border-[#DDE2DD] text-[#66716C]'
                }`}
              >
                Avulsa
              </button>
            </div>
            <button
              type="button"
              onClick={handleRegisterStandaloneFacial}
              className="py-[9px] px-[14px] rounded-[8px] bg-[#0F6B5C] text-white text-[13px] font-semibold text-center hover:bg-[#0B4F44] cursor-pointer"
            >
              Lançar custo e marcar facial feita
            </button>
          </section>
        </aside>
      </div>

      {/* Tabela inferior: Movimentações dos bancos e depósitos */}
      <section className="bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[8px]">
        <div className="text-[16px] font-semibold">
          Movimentações dos bancos e depósitos (registradas na conferência e operação)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[#66716C] text-[12px]">
                <th className="py-[6px] px-[8px] font-medium">Data</th>
                <th className="py-[6px] px-[8px] font-medium">De</th>
                <th className="py-[6px] px-[8px] font-medium">Para</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Valor</th>
                <th className="py-[6px] px-[8px] font-medium">Origem / Situação</th>
                <th className="py-[6px] px-[8px] font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((dep) => {
                const originBank = bankAccounts.find((b) => b.id === dep.originBankId);
                const destHouse = dep.destinationHouseAccountId
                  ? houseAccounts.find((a) => a.id === dep.destinationHouseAccountId)
                  : null;
                const destBank = dep.destinationBankId
                  ? bankAccounts.find((b) => b.id === dep.destinationBankId)
                  : null;

                return (
                  <tr key={dep.id} className="border-t border-[#EEF1EE]">
                    <td className="py-[9px] px-[8px] tabular-nums">{dep.createdAt}</td>
                    <td className="py-[9px] px-[8px]">{originBank?.label || dep.originBankId}</td>
                    <td className="py-[9px] px-[8px]">
                      {destHouse?.label || destBank?.label || 'Destino'}
                      <CryptoRouteSummary route={dep.cryptoRoute} />
                    </td>
                    <td className="py-[9px] px-[8px] text-right tabular-nums">
                      {formatCurrencyBRL(dep.amount)}
                    </td>
                    <td className="py-[9px] px-[8px]">
                      <span
                        className={`px-[9px] py-[2px] rounded-full text-[12px] ${
                          dep.status === 'pretendido'
                            ? 'bg-[#FBF0DD] text-[#8A4B08]'
                            : 'bg-[#EEF1EE] text-[#44504B]'
                        }`}
                      >
                        {dep.status === 'pretendido'
                          ? `Depósito pendente · ${dep.notes}`
                          : dep.originTag}
                      </span>
                    </td>
                    <td className="py-[9px] px-[8px] text-right">
                      {dep.status === 'pretendido' && (
                        <button
                          type="button"
                          onClick={() => confirmPendingDeposit(dep.id)}
                          className="px-[10px] py-[4px] rounded-[7px] bg-[#0F6B5C] text-white text-[12px] font-medium cursor-pointer"
                        >
                          Confirmar crédito na casa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
