import React, { useMemo, useState } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import { formatCurrencyBRL, parseCurrencyInput } from '../domain/ledger.ts';

export const EstoqueScreen: React.FC = () => {
  const {
    partnerships,
    users,
    currentUser,
    availableHouses,
    availableBanks,
    pullPartnershipFromStock,
    createDirectPartnership,
    setActiveScreen,
    notify,
  } = useEnigma();

  const [stockFilter, setStockFilter] = useState<'todas' | 'com_banco' | 'casas_prontas'>(
    'todas'
  );
  const [selectedStockId, setSelectedStockId] = useState<string>('est_014');

  // Campos de Atendimento: cadastrar direto na minha planilha
  const [atNome, setAtNome] = useState<string>('');
  const [atCpf, setAtCpf] = useState<string>('');
  const [atNasc, setAtNasc] = useState<string>('');
  const [atTel, setAtTel] = useState<string>('');
  const [atInd, setAtInd] = useState<string>('');
  const [atBanco, setAtBanco] = useState<string>('Inter');
  const [atEmail, setAtEmail] = useState<string>('');
  const [atChip, setAtChip] = useState<string>('');
  const [atCostStr, setAtCostStr] = useState<string>('200,00');
  const [selectedCloneHouses, setSelectedCloneHouses] = useState<string[]>([
    'Betano',
    'Bet365',
    'Superbet',
    'KTO',
  ]);

  const stockPartnerships = useMemo(
    () => partnerships.filter((p) => p.status === 'estoque'),
    [partnerships]
  );

  const filteredStock = useMemo(() => {
    return stockPartnerships.filter((p) => {
      if (stockFilter === 'com_banco') {
        return p.pixWithdrawals !== 'Sem banco';
      }
      if (stockFilter === 'casas_prontas') {
        return p.notes.includes('9 de 9') || p.notes.includes('8 de 9');
      }
      return true;
    });
  }, [stockPartnerships, stockFilter]);

  const selectedStockItem = useMemo(
    () =>
      stockPartnerships.find((p) => p.id === selectedStockId) ||
      stockPartnerships[0],
    [stockPartnerships, selectedStockId]
  );

  const activePartnerships = useMemo(
    () => partnerships.filter((p) => p.status === 'ativa'),
    [partnerships]
  );
  const createdInAtendimentoCount = activePartnerships.filter(
    (p) => p.origin === 'atendimento'
  ).length;
  const pulledFromStockCount = activePartnerships.filter(
    (p) => p.origin === 'estoque'
  ).length;

  const toggleHouseSelection = (h: string) => {
    setSelectedCloneHouses((prev) =>
      prev.includes(h) ? prev.filter((item) => item !== h) : [...prev, h]
    );
  };

  const handleCreateAtendimento = () => {
    if (!atNome.trim()) {
      notify('error', 'Informe o nome completo do titular para criar a parceria.');
      return;
    }
    createDirectPartnership({
      titularName: atNome,
      cpf: atCpf,
      birthDate: atNasc,
      phones: atTel,
      referral: atInd,
      bankName: atBanco,
      emailOperation: atEmail,
      chipLocation: atChip,
      selectedHouses: selectedCloneHouses,
      creationCost: parseCurrencyInput(atCostStr) || 0,
    });
  };

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Cabeçalho idêntico ao 10_Estoque_de_contas.html */}
      <div className="flex flex-wrap justify-between items-center gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 text-[26px] font-semibold">Estoque de contas</h1>
          <div className="text-[#66716C]">
            Parcerias completas, prontas para uso. Puxe uma para a sua planilha ou cadastre direto no atendimento.
          </div>
        </div>
        <div className="flex flex-wrap gap-[10px] items-center">
          <div className="px-[12px] py-[6px] rounded-full bg-[#FBF0DD] text-[#8A4B08] text-[12px] font-medium">
            Dados fictícios de exemplo
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen('parcerias')}
            className="px-[14px] py-[9px] rounded-[9px] border border-[#CBD2CD] bg-white text-[13px] hover:bg-[#F4F5F2] cursor-pointer"
          >
            Voltar para minhas parcerias
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-[20px] items-start">
        {/* Tabela Esquerda: Disponíveis no estoque */}
        <section className="flex-1 min-w-0 w-full bg-white border border-[#E1E5E1] rounded-[14px] px-[20px] py-[18px] flex flex-col gap-[10px]">
          <div className="flex flex-wrap justify-between items-center gap-[10px]">
            <div className="text-[16px] font-semibold">
              Disponíveis no estoque ({stockPartnerships.length === 5 ? 8 : stockPartnerships.length})
            </div>
            <div className="flex gap-[6px] text-[13px]">
              <button
                type="button"
                onClick={() => setStockFilter('todas')}
                className={`px-[12px] py-[5px] rounded-full cursor-pointer ${stockFilter === 'todas'
                    ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                    : 'border border-[#DDE2DD] text-[#66716C]'
                  }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('com_banco')}
                className={`px-[12px] py-[5px] rounded-full cursor-pointer ${stockFilter === 'com_banco'
                    ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                    : 'border border-[#DDE2DD] text-[#66716C]'
                  }`}
              >
                Com banco
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('casas_prontas')}
                className={`px-[12px] py-[5px] rounded-full cursor-pointer ${stockFilter === 'casas_prontas'
                    ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                    : 'border border-[#DDE2DD] text-[#66716C]'
                  }`}
              >
                Casas prontas
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[#66716C] text-[12px]">
                  <th className="py-[6px] px-[8px] font-medium">Código</th>
                  <th className="py-[6px] px-[8px] font-medium">Titular</th>
                  <th className="py-[6px] px-[8px] font-medium">Banco</th>
                  <th className="py-[6px] px-[8px] font-medium text-right">Casas prontas</th>
                  <th className="py-[6px] px-[8px] font-medium">Criada em</th>
                  <th className="py-[6px] px-[8px] font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => {
                  const isSel = selectedStockItem?.id === item.id;
                  const bankText = item.id === 'est_014'
                    ? 'Inter'
                    : item.id === 'est_013'
                      ? 'PGBank'
                      : item.id === 'est_012'
                        ? 'Inter, PGBank'
                        : item.id === 'est_011'
                          ? 'Inter'
                          : item.pixWithdrawals === 'Sem banco'
                            ? 'Sem banco'
                            : 'Inter';

                  const readyRatio =
                    item.id === 'est_014'
                      ? '7 de 9'
                      : item.id === 'est_013'
                        ? '9 de 9'
                        : item.id === 'est_012'
                          ? '8 de 9'
                          : item.id === 'est_011'
                            ? '5 de 9'
                            : '9 de 9';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedStockId(item.id)}
                      className={`border-t border-[#EEF1EE] cursor-pointer ${isSel ? 'bg-[#E3F1EE]' : 'hover:bg-[#F4F5F2]'
                        }`}
                    >
                      <td className="py-[10px] px-[8px] font-semibold">{item.code}</td>
                      <td className="py-[10px] px-[8px]">{item.titularName}</td>
                      <td
                        className={`py-[10px] px-[8px] ${bankText === 'Sem banco' ? 'text-[#B3261E]' : ''
                          }`}
                      >
                        {bankText}
                      </td>
                      <td className="py-[10px] px-[8px] text-right tabular-nums">
                        {readyRatio}
                      </td>
                      <td className="py-[10px] px-[8px] tabular-nums">
                        {item.createdAt.slice(0, 5)}
                      </td>
                      <td className="py-[10px] px-[8px] text-right">
                        {isSel ? (
                          <span className="px-[12px] py-[5px] rounded-[7px] bg-[#0F6B5C] text-white text-[12px] font-semibold">
                            Selecionada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStockId(item.id);
                            }}
                            className={`px-[12px] py-[5px] rounded-[7px] text-[12px] font-medium cursor-pointer ${bankText === 'Sem banco'
                                ? 'border border-[#CBD2CD] text-[#66716C]'
                                : 'border border-[#0F6B5C] text-[#0F6B5C]'
                              }`}
                          >
                            Puxar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[12px] text-[#66716C]">
            Mostrando {filteredStock.length} de {stockPartnerships.length === 5 ? 8 : stockPartnerships.length}.
          </div>
        </section>

        {/* Coluna Lateral Direita (380px): Puxar parceria selecionada + Minha planilha */}
        <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-[16px]">
          {selectedStockItem && (
            <section className="bg-white border-2 border-[#0F6B5C] rounded-[14px] p-[18px] flex flex-col gap-[12px]">
              <div className="text-[15px] font-semibold">
                Puxar {selectedStockItem.code} para a minha planilha
              </div>
              <div className="flex flex-col gap-[6px] text-[13px]">
                <div className="flex justify-between">
                  <span>Cadastro completo</span>
                  <span className="text-[#1F7A3D] font-medium">OK</span>
                </div>
                <div className="flex justify-between">
                  <span>Banco ({selectedStockItem.pixWithdrawals === 'Sem banco' ? 'Pendente' : 'Inter / PGBank'})</span>
                  <span
                    className={
                      selectedStockItem.pixWithdrawals === 'Sem banco'
                        ? 'text-[#B3261E] font-medium'
                        : 'text-[#1F7A3D] font-medium'
                    }
                  >
                    {selectedStockItem.pixWithdrawals === 'Sem banco' ? 'Sem banco' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Casas prontas</span>
                  <span className="font-medium">
                    {selectedStockItem.id === 'est_014' ? '7 de 9' : '9 de 9'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Casas a verificar</span>
                  <span className="text-[#8A4B08] font-medium">
                    {selectedStockItem.id === 'est_014' ? '2' : '0'}
                  </span>
                </div>
                <div className="flex justify-between pt-[4px] border-t border-[#EEF1EE]">
                  <span>Custo de criação pago por</span>
                  <span className="font-medium">
                    {users.find((u) => u.id === selectedStockItem.paidByOperatorId)
                      ?.shortName || 'Admin'}{' '}
                    ({formatCurrencyBRL(selectedStockItem.creationCost)})
                  </span>
                </div>
              </div>

              <div className="px-[12px] py-[10px] rounded-[9px] bg-[#EEF1EE] text-[12px] text-[#44504B] leading-[1.5]">
                Ao puxar, a parceria sai do estoque e passa a existir na sua planilha, com ficha, bancos e casas. Se outro operador pagou o custo inicial, o sistema registra a obrigação de ressarcimento sem cobrar o custo duas vezes.
              </div>

              <div className="flex gap-[8px] justify-end">
                <button
                  type="button"
                  onClick={() => setActiveScreen('parcerias')}
                  className="px-[16px] py-[9px] rounded-[8px] border border-[#CBD2CD] text-[13px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    pullPartnershipFromStock(
                      selectedStockItem.id,
                      currentUser.role === 'operador' ? currentUser.id : 'op_a'
                    )
                  }
                  className="px-[18px] py-[9px] rounded-[8px] bg-[#0F6B5C] text-white text-[13px] font-semibold hover:bg-[#0B4F44] cursor-pointer"
                >
                  Puxar parceria
                </button>
              </div>
            </section>
          )}

          <section className="bg-white border border-[#E1E5E1] rounded-[14px] p-[18px] flex flex-col gap-[8px]">
            <div className="text-[15px] font-semibold">Minha planilha</div>
            <div className="flex justify-between">
              <span className="text-[#66716C]">Parcerias ativas</span>
              <b className="tabular-nums">{activePartnerships.length}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66716C]">Criadas no atendimento</span>
              <b className="tabular-nums">{createdInAtendimentoCount}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66716C]">Puxadas do estoque</span>
              <b className="tabular-nums">{pulledFromStockCount}</b>
            </div>
          </section>
        </aside>
      </div>

      {/* Formulário Inferior: Atendimento: cadastrar direto na minha planilha */}
      <section className="bg-white border border-[#E1E5E1] rounded-[14px] p-[20px] flex flex-col gap-[14px]">
        <div className="flex flex-wrap justify-between items-center gap-[8px]">
          <div className="text-[16px] font-semibold">
            Atendimento: cadastrar direto na minha planilha
          </div>
          <div className="text-[12px] text-[#66716C]">
            Cria a ficha e as contas sem passar pelo estoque
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[14px]">
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="a-n" className="text-[12px] font-medium text-[#66716C]">
              Nome completo
            </label>
            <input
              id="a-n"
              value={atNome}
              onChange={(e) => setAtNome(e.target.value)}
              placeholder="Titular Exemplo"
              className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="a-c" className="text-[12px] font-medium text-[#66716C]">
              CPF
            </label>
            <input
              id="a-c"
              value={atCpf}
              onChange={(e) => setAtCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="a-d" className="text-[12px] font-medium text-[#66716C]">
              Nascimento
            </label>
            <input
              id="a-d"
              value={atNasc}
              onChange={(e) => setAtNasc(e.target.value)}
              placeholder="dd/mm/aaaa"
              className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="a-t" className="text-[12px] font-medium text-[#66716C]">
              Telefone
            </label>
            <input
              id="a-t"
              value={atTel}
              onChange={(e) => setAtTel(e.target.value)}
              placeholder="(00) 90000-0000"
              className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="a-i" className="text-[12px] font-medium text-[#66716C]">
              Indicação
            </label>
            <input
              id="a-i"
              value={atInd}
              onChange={(e) => setAtInd(e.target.value)}
              placeholder="Quem indicou"
              className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="a-b" className="text-[12px] font-medium text-[#66716C]">
              Financeiro
            </label>
            <select
              id="a-b"
              value={atBanco}
              onChange={(e) => setAtBanco(e.target.value)}
              className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px] bg-white cursor-pointer"
            >
              {availableBanks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
              <option value="Sem banco">Sem banco</option>
            </select>
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="a-e" className="text-[12px] font-medium text-[#66716C]">
              E-mail de operação
            </label>
            <input
              id="a-e"
              value={atEmail}
              onChange={(e) => setAtEmail(e.target.value)}
              placeholder="criação e operação"
              className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="a-ch" className="text-[12px] font-medium text-[#66716C]">
              Local do chip
            </label>
            <input
              id="a-ch"
              value={atChip}
              onChange={(e) => setAtChip(e.target.value)}
              placeholder="Celular e gaveta"
              className="p-[10px_12px] border border-[#CBD2CD] rounded-[8px] text-[14px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-end gap-[14px]">
          <div className="flex flex-col gap-[8px]">
            <div className="text-[12px] font-medium text-[#66716C]">
              Casas a criar (Catálogo ativo — {availableHouses.length} disponíveis)
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {availableHouses.map((house) => {
                const isSel = selectedCloneHouses.includes(house);
                return (
                  <button
                    key={house}
                    type="button"
                    onClick={() => toggleHouseSelection(house)}
                    className={`px-[12px] py-[5px] rounded-full text-[12px] cursor-pointer ${isSel
                        ? 'bg-[#E3F1EE] text-[#0B4F44] font-medium'
                        : 'border border-[#DDE2DD] text-[#1B2421]'
                      }`}
                  >
                    {house}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-[8px]">
            <label htmlFor="a-cost" className="text-[12px] text-[#66716C]">
              Custo de criação (USDT):
            </label>
            <input
              id="a-cost"
              value={atCostStr}
              onChange={(e) => setAtCostStr(e.target.value)}
              className="w-[100px] p-[8px_10px] border border-[#CBD2CD] rounded-[8px] text-[13px] text-right tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-[10px]">
          <div className="text-[12px] text-[#66716C]">
            Cada casa criada nasce com status &quot;pronta&quot; e sobe sozinha para a ficha da parceria. O custo de criação pode ser lançado junto.
          </div>
          <button
            type="button"
            onClick={handleCreateAtendimento}
            className="px-[18px] py-[10px] rounded-[9px] bg-[#0F6B5C] text-white text-[13px] font-semibold hover:bg-[#0B4F44] cursor-pointer"
          >
            Criar parceria e contas
          </button>
        </div>
      </section>
    </div>
  );
};
