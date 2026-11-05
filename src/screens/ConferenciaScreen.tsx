import React, { useEffect, useMemo, useState } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  formatCurrencyBRL,
  parseBankStatementText,
  parseCurrencyInput,
  roundCurrency,
} from '../domain/ledger.ts';
import type {
  DivergenceClassification,
  StatementImportCandidate,
} from '../domain/types.ts';

const CLASSIFICATION_OPTIONS: Array<{
  id: DivergenceClassification;
  label: string;
}> = [
  {
    id: 'saque_em_transito',
    label: 'O saque ainda não chegou (esperar mais um pouco)',
  },
  {
    id: 'falhou_voltou_casa',
    label: 'Falhou e o valor voltou para a casa',
  },
  {
    id: 'pix_chave_errada',
    label: 'Pix enviado para chave ou pessoa errada',
  },
  {
    id: 'transferencia_outra_conta',
    label: 'Transferi para outra conta (informar qual)',
  },
  {
    id: 'tarifa_custo',
    label: 'Tarifa ou custo',
  },
  {
    id: 'entrada_nao_lancada',
    label: 'Entrada não lançada ou retorno pendente',
  },
  {
    id: 'outro',
    label: 'Outro motivo',
  },
];

const SAMPLE_STATEMENT_CSV = `Data;Descricao;Valor
11/10/2026;PIX RECEBIDO KTO JOAO;3.200,00
11/10/2026;TRANSFERENCIA OPERACIONAL INTER;1.250,00
09/10/2026;TRANSFERENCIA BANCO ENIGMA;6.500,00`;

export const ConferenciaScreen: React.FC = () => {
  const {
    bankAccounts,
    houseAccounts,
    divergences,
    withdrawals,
    deposits,
    operationalMonthYearLabel,
    setActiveScreen,
    updateInformedRealBalance,
    classifyDivergence,
    confirmImportStatementCandidates,
    updateHouseAccountOperationalStatus,
    navFocus,
    clearNavFocus,
  } = useEnigma();

  const [scopeTab, setScopeTab] = useState<'todos' | 'bancos' | 'casas'>('todos');
  const [selectedDivergenceId, setSelectedDivergenceId] = useState<string>('div_1');
  const [selectedClassification, setSelectedClassification] =
    useState<DivergenceClassification>('saque_em_transito');
  const [customJustification, setCustomJustification] = useState<string>('');
  const [transferTargetAccount, setTransferTargetAccount] = useState<string>('');

  // Estado para "Antes de mudar o status da conta" (Bet365 · Carlos)
  const [carlosRealInput, setCarlosRealInput] = useState<string>('250,00');
  const [carlosStatusReason, setCarlosStatusReason] = useState<string>('');

  // Modal/Painel de Importação de Extrato CSV/OFX com prévia e deduplicação
  const [showImportPanel, setShowImportPanel] = useState<boolean>(false);
  const [importBankId, setImportBankId] = useState<string>('bank_pg_joao');
  const [rawStatementText, setRawStatementText] = useState<string>(SAMPLE_STATEMENT_CSV);
  const [statementCandidates, setStatementCandidates] = useState<StatementImportCandidate[]>([]);

  useEffect(() => {
    if (navFocus.divergenceId) {
      setSelectedDivergenceId(navFocus.divergenceId);
      clearNavFocus();
    }
  }, [navFocus.divergenceId]);

  const activeDivergence = useMemo(
    () =>
      divergences.find((d) => d.id === selectedDivergenceId) ||
      divergences.find((d) => d.status !== 'resolvida') ||
      divergences[0],
    [divergences, selectedDivergenceId]
  );

  useEffect(() => {
    if (activeDivergence) {
      setSelectedClassification(
        activeDivergence.classification === 'nao_classificada'
          ? 'saque_em_transito'
          : activeDivergence.classification
      );
    }
  }, [activeDivergence?.id]);

  // Monta as linhas de conferência separando Bancos e Casas
  const bankRows = useMemo(
    () =>
      bankAccounts.map((b) => {
        const diff =
          b.informedRealBalance !== null
            ? roundCurrency(b.informedRealBalance - b.balance)
            : null;
        return {
          key: `banco_${b.id}`,
          targetType: 'banco' as const,
          id: b.id,
          label: b.id === 'bank_enigma' ? b.label : `${b.label} (banco)`,
          expected: b.balance,
          real: b.informedRealBalance,
          diff,
        };
      }),
    [bankAccounts]
  );

  const houseRows = useMemo(
    () =>
      houseAccounts
        .filter(
          (a) =>
            a.id === 'acc_bet365_carlos' ||
            a.availableBalance > 0 ||
            a.informedRealBalance !== null
        )
        .slice(0, 6)
        .map((a) => {
          const diff =
            a.informedRealBalance !== null
              ? roundCurrency(a.informedRealBalance - a.availableBalance)
              : null;
          return {
            key: `casa_${a.id}`,
            targetType: 'casa' as const,
            id: a.id,
            label: `${a.label} (casa)`,
            expected: a.availableBalance,
            real: a.informedRealBalance,
            diff,
          };
        }),
    [houseAccounts]
  );

  const visibleRows = useMemo(() => {
    if (scopeTab === 'bancos') return bankRows;
    if (scopeTab === 'casas') return houseRows;
    // Na visão combinada padrão, preserva os 5 itens principais de 03_Conferencia_de_saldos.html no topo
    const priorityIds = new Set([
      'banco_bank_inter_carlos',
      'casa_acc_bet365_carlos',
      'banco_bank_inter_maria',
      'banco_bank_pg_joao',
      'banco_bank_enigma',
    ]);
    const combined = [...bankRows, ...houseRows];
    const top5 = combined.filter((r) => priorityIds.has(r.key));
    const rest = combined.filter((r) => !priorityIds.has(r.key));
    return [...top5, ...rest];
  }, [scopeTab, bankRows, houseRows]);

  const openDivergences = divergences.filter((d) => d.status !== 'resolvida');
  const unexplainedSum = roundCurrency(
    openDivergences.reduce((acc, d) => acc + Math.abs(d.difference), 0)
  );
  const reconciledTodayCount = visibleRows.filter(
    (r) => r.real !== null && Math.abs(r.diff || 0) < 0.01
  ).length;

  const handlePreviewStatement = () => {
    const bank = bankAccounts.find((b) => b.id === importBankId);
    const parsed = parseBankStatementText(
      rawStatementText,
      importBankId,
      bank?.label || 'Banco',
      withdrawals,
      deposits
    );
    setStatementCandidates(parsed);
  };

  const handleOpenImport = () => {
    setShowImportPanel((v) => {
      const next = !v;
      if (next && statementCandidates.length === 0) {
        const bank = bankAccounts.find((b) => b.id === importBankId);
        setStatementCandidates(
          parseBankStatementText(
            rawStatementText,
            importBankId,
            bank?.label || 'Banco',
            withdrawals,
            deposits
          )
        );
      }
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setRawStatementText(text);
      const bank = bankAccounts.find((b) => b.id === importBankId);
      setStatementCandidates(
        parseBankStatementText(text, importBankId, bank?.label || 'Banco', withdrawals, deposits)
      );
    };
    reader.readAsText(file);
  };

  const carlosAccount = houseAccounts.find((a) => a.id === 'acc_bet365_carlos');
  const carlosRealNum = parseCurrencyInput(carlosRealInput) ?? 250;
  const carlosDiff = roundCurrency((carlosAccount?.availableBalance || 640) - carlosRealNum);

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Cabeçalho idêntico à tela 03_Conferencia_de_saldos.html */}
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 text-[26px] font-semibold">Conferência de saldos</h1>
          <div className="text-[#66716C]">
            Abra o banco ou a casa, digite o saldo real. Se bater, é um clique. Se não bater, o app ajuda a descobrir o motivo.
          </div>
        </div>
        <div className="flex gap-[10px] items-center">
          <button
            type="button"
            onClick={handleOpenImport}
            className="px-[14px] py-[9px] rounded-[9px] border border-[#CBD2CD] bg-white text-[13px] hover:bg-[#F4F5F2] cursor-pointer"
          >
            Importar extrato (CSV ou OFX)
          </button>
        </div>
      </div>

      {/* Painel de Importação de Extrato CSV/OFX com Prévia e Validação */}
      {showImportPanel && (
        <section className="bg-white border-2 border-[#0F6B5C] rounded-[14px] p-[18px] flex flex-col gap-[12px]">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[16px] font-semibold">
                Importar extrato bancário (CSV ou OFX): prévia e validação
              </div>
              <div className="text-[12px] text-[#66716C]">
                Valida os dados, concilia saques em trânsito e desmarca duplicidades antes de confirmar os lançamentos.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowImportPanel(false)}
              className="text-[12px] text-[#66716C] hover:text-[#1B2421] cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] items-end">
            <div className="flex flex-col gap-[4px]">
              <label className="text-[12px] font-medium text-[#66716C]">
                Conta bancária do extrato
              </label>
              <select
                aria-label="Conta bancária do extrato"
                value={importBankId}
                onChange={(e) => setImportBankId(e.target.value)}
                className="p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] bg-white"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-[4px]">
              <label className="text-[12px] font-medium text-[#66716C]">
                Carregar arquivo (.csv / .ofx)
              </label>
              <input
                type="file"
                accept=".csv,.ofx,.txt"
                onChange={handleFileUpload}
                className="p-[6px] border border-[#CBD2CD] rounded-[8px] text-[12px] bg-white"
              />
            </div>
            <div className="flex gap-[8px]">
              <button
                type="button"
                onClick={handlePreviewStatement}
                className="px-[14px] py-[8px] rounded-[8px] border border-[#0F6B5C] text-[#0F6B5C] text-[13px] font-medium cursor-pointer"
              >
                Atualizar prévia
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmImportStatementCandidates(statementCandidates);
                  setShowImportPanel(false);
                }}
                className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[13px] font-semibold cursor-pointer"
              >
                Confirmar lançamentos validados
              </button>
            </div>
          </div>

          <textarea
            aria-label="Conteúdo do extrato CSV"
            rows={3}
            value={rawStatementText}
            onChange={(e) => setRawStatementText(e.target.value)}
            className="w-full p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[12px] font-mono bg-[#F4F5F2]"
          />

          {statementCandidates.length > 0 && (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[#66716C] text-[12px]">
                  <th className="py-[5px] px-[8px]" />
                  <th className="py-[5px] px-[8px]">Data</th>
                  <th className="py-[5px] px-[8px]">Descrição</th>
                  <th className="py-[5px] px-[8px] text-right">Valor</th>
                  <th className="py-[5px] px-[8px]">Validação</th>
                </tr>
              </thead>
              <tbody>
                {statementCandidates.map((cand) => (
                  <tr key={cand.id} className="border-t border-[#EEF1EE]">
                    <td className="p-[8px]">
                      <input
                        type="checkbox"
                        checked={cand.selected}
                        onChange={() =>
                          setStatementCandidates((prev) =>
                            prev.map((c) =>
                              c.id === cand.id ? { ...c, selected: !c.selected } : c
                            )
                          )
                        }
                      />
                    </td>
                    <td className="p-[8px] tabular-nums">{cand.date}</td>
                    <td className="p-[8px]">{cand.description}</td>
                    <td className="p-[8px] text-right tabular-nums">
                      {formatCurrencyBRL(cand.amount)}
                    </td>
                    <td className="p-[8px]">
                      <span
                        className={`px-[8px] py-[2px] rounded-full text-[11px] ${
                          cand.status === 'conciliavel_saque'
                            ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                            : cand.status === 'duplicado'
                            ? 'bg-[#FBF0DD] text-[#8A4B08]'
                            : 'bg-[#EEF1EE] text-[#44504B]'
                        }`}
                      >
                        {cand.status === 'conciliavel_saque'
                          ? 'Concilia saque em trânsito automaticamente'
                          : cand.status === 'duplicado'
                          ? 'Duplicado (já existe — ignorado por padrão)'
                          : 'Novo lançamento bancário'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* 3 Cards de Resumo (Conferidos hoje, Divergências abertas, Valor sem explicação) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
        <div className="bg-white border border-[#E1E5E1] rounded-[12px] p-[16px]">
          <div className="text-[12px] text-[#66716C]">Conferidos hoje</div>
          <div className="text-[26px] font-semibold tabular-nums">
            {reconciledTodayCount} de {visibleRows.length}
          </div>
        </div>
        <div className="bg-white border border-[#E1E5E1] rounded-[12px] p-[16px]">
          <div className="text-[12px] text-[#66716C]">Divergências abertas</div>
          <div className="text-[26px] font-semibold text-[#B3261E] tabular-nums">
            {openDivergences.length}
          </div>
        </div>
        <div className="bg-white border border-[#E1E5E1] rounded-[12px] p-[16px]">
          <div className="text-[12px] text-[#66716C]">Valor sem explicação</div>
          <div className="text-[26px] font-semibold text-[#B3261E] tabular-nums">
            {formatCurrencyBRL(unexplainedSum)}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-[20px] items-start">
        {/* Tabela Esquerda: Bancos e casas com movimento (com filtro separado Bancos / Casas) */}
        <section className="flex-1 min-w-0 w-full bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[10px]">
          <div className="flex flex-wrap justify-between items-center gap-[10px]">
            <div className="text-[16px] font-semibold">Bancos e casas com movimento</div>
            <div className="flex gap-[6px] text-[12px]">
              <button
                type="button"
                onClick={() => setScopeTab('todos')}
                className={`px-[12px] py-[5px] rounded-full cursor-pointer ${
                  scopeTab === 'todos'
                    ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                    : 'border border-[#DDE2DD] text-[#66716C]'
                }`}
              >
                Todos ({bankRows.length + houseRows.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeTab('bancos')}
                className={`px-[12px] py-[5px] rounded-full cursor-pointer ${
                  scopeTab === 'bancos'
                    ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                    : 'border border-[#DDE2DD] text-[#66716C]'
                }`}
              >
                Só Bancos ({bankRows.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeTab('casas')}
                className={`px-[12px] py-[5px] rounded-full cursor-pointer ${
                  scopeTab === 'casas'
                    ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                    : 'border border-[#DDE2DD] text-[#66716C]'
                }`}
              >
                Só Casas ({houseRows.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[#66716C] text-[12px]">
                  <th className="py-[6px] px-[8px] font-medium">Conta</th>
                  <th className="py-[6px] px-[8px] font-medium text-right">Previsto</th>
                  <th className="py-[6px] px-[8px] font-medium text-right">Saldo real</th>
                  <th className="py-[6px] px-[8px] font-medium">Situação / Diferença</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const hasError = row.diff !== null && Math.abs(row.diff) >= 0.01;
                  const isConfirmed = row.real !== null && !hasError;
                  const matchingDiv = divergences.find(
                    (d) => d.targetId === row.id && d.targetType === row.targetType
                  );

                  return (
                    <tr
                      key={row.key}
                      className={`border-t border-[#EEF1EE] ${hasError ? 'bg-[#FEF7F6]' : ''}`}
                    >
                      <td className="py-[10px] px-[8px] font-medium">
                        {matchingDiv ? (
                          <button
                            type="button"
                            aria-pressed={activeDivergence?.id === matchingDiv.id}
                            onClick={() => setSelectedDivergenceId(matchingDiv.id)}
                            className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B5C] cursor-pointer"
                          >
                            {row.label}
                          </button>
                        ) : (
                          row.label
                        )}
                      </td>
                      <td className="py-[10px] px-[8px] text-right tabular-nums">
                        {formatCurrencyBRL(row.expected)}
                      </td>
                      <td className="py-[10px] px-[8px] text-right">
                        <input
                          aria-label={`Saldo real de ${row.label}`}
                          defaultValue={
                            row.real !== null
                              ? row.real.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })
                              : ''
                          }
                          placeholder="digite"
                          onBlur={(e) => {
                            const parsed = parseCurrencyInput(e.target.value);
                            updateInformedRealBalance(row.targetType, row.id, parsed);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const parsed = parseCurrencyInput(
                                (e.target as HTMLInputElement).value
                              );
                              updateInformedRealBalance(row.targetType, row.id, parsed);
                            }
                          }}
                          className={`w-[110px] px-[8px] py-[6px] rounded-[7px] text-right text-[13px] tabular-nums bg-white ${
                            hasError
                              ? 'border-2 border-[#B3261E]'
                              : 'border border-[#CBD2CD]'
                          }`}
                        />
                      </td>
                      <td className="py-[10px] px-[8px]">
                        {hasError ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (matchingDiv) setSelectedDivergenceId(matchingDiv.id);
                            }}
                            className="px-[9px] py-[2px] rounded-full bg-[#FBE9E7] text-[#8C1D18] text-[12px] cursor-pointer"
                          >
                            {row.diff! < 0
                              ? `Faltam ${formatCurrencyBRL(Math.abs(row.diff!))}`
                              : `Sobram ${formatCurrencyBRL(row.diff!)}`}
                          </button>
                        ) : isConfirmed ? (
                          <span className="px-[9px] py-[2px] rounded-full bg-[#E3F1EE] text-[#0B4F44] text-[12px]">
                            Conferido
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              updateInformedRealBalance(row.targetType, row.id, row.expected)
                            }
                            className="px-[9px] py-[2px] rounded-full bg-[#EEF1EE] text-[#44504B] text-[12px] hover:bg-[#E3F1EE] hover:text-[#0B4F44] cursor-pointer"
                          >
                            A conferir (1 clique = bateu)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Histórico de Divergências Classificadas (nunca apaga divergências!) */}
          <div className="pt-[12px] border-t border-[#EEF1EE] flex flex-col gap-[8px]">
            <div className="text-[14px] font-semibold">
              Histórico e auditoria de divergências ({divergences.length})
            </div>
            <div className="flex flex-col gap-[6px]">
              {divergences.map((div) => (
                <button
                  type="button"
                  key={div.id}
                  aria-pressed={activeDivergence?.id === div.id}
                  onClick={() => setSelectedDivergenceId(div.id)}
                  className={`w-full text-left p-[10px_12px] rounded-[9px] border text-[12px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B5C] ${
                    activeDivergence?.id === div.id
                      ? 'border-[#0F6B5C] bg-[#F4FAF8]'
                      : 'border-[#EEF1EE] bg-[#FAFBF9]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <b>
                      {div.targetLabel} · Diferença: {formatCurrencyBRL(div.difference)}
                    </b>
                    <span
                      className={`px-[8px] py-[1px] rounded-full text-[11px] ${
                        div.status === 'resolvida'
                          ? 'bg-[#E3F1EE] text-[#0B4F44]'
                          : div.status === 'em_acompanhamento'
                          ? 'bg-[#FBF0DD] text-[#8A4B08]'
                          : 'bg-[#FBE9E7] text-[#8C1D18]'
                      }`}
                    >
                      {div.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[#44504B] mt-[2px]">
                    Motivo: {div.justification} · Resp.: {div.responsibleName} ({div.updatedAt})
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Coluna Lateral Direita (470px): Classificação de Divergência + Antes de mudar status da conta */}
        <aside className="w-full lg:w-[470px] shrink-0 flex flex-col gap-[16px]">
          {activeDivergence && (
            <section className="bg-white border-2 border-[#E5604F] rounded-[14px] p-[18px] flex flex-col gap-[12px]">
              <div className="text-[15px] font-semibold text-[#8C1D18]">
                {activeDivergence.targetLabel.replace(' (banco)', '').replace(' (casa)', '')}:{' '}
                {activeDivergence.difference < 0
                  ? `faltam ${formatCurrencyBRL(Math.abs(activeDivergence.difference))}`
                  : `diferença ${formatCurrencyBRL(activeDivergence.difference)}`}
              </div>
              <div className="text-[13px] text-[#44504B] leading-[1.5]">
                {activeDivergence.contextHint}
              </div>

              <div className="flex flex-col gap-[8px]">
                {CLASSIFICATION_OPTIONS.map((opt) => {
                  const isSel = selectedClassification === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedClassification(opt.id)}
                      className={`text-left px-[12px] py-[10px] rounded-[9px] text-[13px] transition-colors cursor-pointer ${
                        isSel
                          ? 'border-2 border-[#0F6B5C] bg-[#E3F1EE] font-medium text-[#1B2421]'
                          : 'border border-[#DDE2DD] bg-white hover:bg-[#F4F5F2]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {selectedClassification === 'transferencia_outra_conta' && (
                <input
                  type="text"
                  value={transferTargetAccount}
                  onChange={(e) => setTransferTargetAccount(e.target.value)}
                  placeholder="Informe para qual conta foi transferido..."
                  className="p-[9px_12px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
                />
              )}

              <input
                type="text"
                value={customJustification}
                onChange={(e) => setCustomJustification(e.target.value)}
                placeholder="Justificativa / observação adicional para o histórico..."
                className="p-[9px_12px] border border-[#CBD2CD] rounded-[8px] text-[13px]"
              />

              <div className="text-[12px] text-[#66716C] leading-[1.5]">
                Pelo extrato importado: nenhuma entrada de 2.250,00 USDT (≈ R$ 12.330,00) nos últimos 2 dias. Classificar mantém a divergência rastreável sem apagar o histórico.
              </div>

              <div className="flex gap-[8px]">
                <button
                  type="button"
                  onClick={() => {
                    classifyDivergence({
                      divergenceId: activeDivergence.id,
                      classification: selectedClassification,
                      justification:
                        customJustification ||
                        CLASSIFICATION_OPTIONS.find((o) => o.id === selectedClassification)
                          ?.label ||
                        '',
                      markResolved: false,
                      targetTransferAccountLabel: transferTargetAccount,
                    });
                    setCustomJustification('');
                  }}
                  className="flex-1 py-[10px] px-[14px] rounded-[9px] bg-[#0F6B5C] text-white font-semibold text-center hover:bg-[#0B4F44] cursor-pointer"
                >
                  Registrar e acompanhar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    classifyDivergence({
                      divergenceId: activeDivergence.id,
                      classification: selectedClassification,
                      justification:
                        customJustification ||
                        `Resolvida: ${
                          CLASSIFICATION_OPTIONS.find((o) => o.id === selectedClassification)
                            ?.label || ''
                        }`,
                      markResolved: true,
                      targetTransferAccountLabel: transferTargetAccount,
                    });
                    setCustomJustification('');
                  }}
                  className="py-[10px] px-[14px] rounded-[9px] border border-[#0F6B5C] text-[#0F6B5C] font-semibold hover:bg-[#E3F1EE] cursor-pointer"
                >
                  Resolver com justificativa
                </button>
              </div>

              {/* Histórico da resolução desta divergência */}
              <div className="pt-[8px] border-t border-[#EEF1EE] flex flex-col gap-[4px] text-[11px] text-[#66716C]">
                <b className="text-[#44504B]">Histórico registrado nesta divergência:</b>
                {activeDivergence.history.map((h) => (
                  <div key={h.id}>
                    • {h.timestamp} ({h.author}): {h.note} [{h.status}]
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Card: Antes de mudar o status da conta */}
          <section className="bg-white border border-[#E1E5E1] rounded-[14px] p-[18px] flex flex-col gap-[10px]">
            <div className="text-[15px] font-semibold">Antes de mudar o status da conta</div>
            <div className="p-[12px] rounded-[10px] bg-[#FBF0DD] flex flex-col gap-[8px]">
              <div className="font-semibold text-[#6B3E08]">
                Bet365 · Carlos: Em uso para Limitada
              </div>
              <div className="text-[13px] text-[#6B3E08] leading-[1.5]">
                Saldo previsto na casa: {formatCurrencyBRL(carlosAccount?.availableBalance || 640)}. Confira o saldo real antes de confirmar a mudança.
              </div>
              <div className="flex gap-[8px] items-center">
                <label htmlFor="c-st" className="text-[12px] text-[#6B3E08]">
                  Saldo real na casa
                </label>
                <input
                  id="c-st"
                  value={carlosRealInput}
                  onChange={(e) => setCarlosRealInput(e.target.value)}
                  className="w-[110px] px-[8px] py-[6px] border border-[#CBD2CD] rounded-[7px] text-right text-[13px] bg-white tabular-nums"
                />
              </div>

              {Math.abs(carlosDiff) >= 0.01 ? (
                <>
                  <div className="text-[12px] text-[#8C1D18]">
                    Diferença de {formatCurrencyBRL(Math.abs(carlosDiff))}: a mudança de status fica bloqueada até explicar.
                  </div>
                  <input
                    type="text"
                    value={carlosStatusReason}
                    onChange={(e) => setCarlosStatusReason(e.target.value)}
                    placeholder="Explique a diferença (ex.: aposta aberta ou ajuste)..."
                    className="p-[7px_10px] border border-[#CBD2CD] rounded-[7px] text-[12px] bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateHouseAccountOperationalStatus(
                        'acc_bet365_carlos',
                        'limitada',
                        carlosRealNum,
                        carlosStatusReason
                      )
                    }
                    className="py-[8px] px-[12px] rounded-[7px] bg-[#8A4B08] text-white text-[12px] font-semibold cursor-pointer"
                  >
                    Explicar diferença e confirmar status Limitada
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    updateHouseAccountOperationalStatus(
                      'acc_bet365_carlos',
                      'limitada',
                      carlosRealNum,
                      'Saldo real conferido sem diferença'
                    )
                  }
                  className="py-[8px] px-[12px] rounded-[7px] bg-[#0F6B5C] text-white text-[12px] font-semibold cursor-pointer"
                >
                  Saldo bateu — Confirmar mudança para Limitada
                </button>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
