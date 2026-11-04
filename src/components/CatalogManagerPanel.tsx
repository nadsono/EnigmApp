import React, { useMemo, useState } from 'react';
import { Check, Palette, Plus, Tag } from 'lucide-react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import { formatCurrencyBRL } from '../domain/ledger.ts';
import {
  CLONE_PRESETS,
  HOUSE_COLOR_SUGGESTIONS,
  getHouseColorTheme,
} from '../domain/uiTheme.ts';
import type {
  BankCatalogItem,
  CatalogEntityType,
  CatalogFieldType,
  HouseCatalogItem,
} from '../domain/types.ts';

type CatalogSectionTab = 'casas' | 'bancos' | 'criterios';

export const CatalogManagerPanel: React.FC = () => {
  const {
    houseCatalog,
    bankCatalog,
    customCriteria,
    catalogPersistenceSnapshot,
    allHouseAccounts,
    allBankAccounts,
    upsertHouseCatalogItem,
    toggleHouseCatalogActive,
    removeHouseCatalogItem,
    upsertBankCatalogItem,
    toggleBankCatalogActive,
    removeBankCatalogItem,
    addCatalogCriterion,
    deleteCatalogCriterion,
    notify,
  } = useEnigma();

  const [sectionTab, setSectionTab] = useState<CatalogSectionTab>('casas');

  // =========================================================================
  // 1. Estados do Gerenciador de Casas de Apostas
  // =========================================================================
  const [houseFilter, setHouseFilter] = useState<'todas' | 'ativas' | 'inativas'>('todas');
  const [houseSearch, setHouseSearch] = useState('');
  const [showHouseForm, setShowHouseForm] = useState(false);
  const [editingHouseId, setEditingHouseId] = useState<string | null>(null);
  const [houseName, setHouseName] = useState('');
  const [houseCloneGroup, setHouseCloneGroup] = useState('Sem clones');
  const [houseCategory, setHouseCategory] = useState('Nacional');
  const [houseVerification, setHouseVerification] = useState('Facial no saque');
  const [houseMinStake, setHouseMinStake] = useState('20');
  const [houseWithdrawTime, setHouseWithdrawTime] = useState('PIX Imediato');
  const [houseActive, setHouseActive] = useState(true);
  const [houseNotes, setHouseNotes] = useState('');
  const [houseColorHex, setHouseColorHex] = useState<string>('#EA580C');
  const [customClones, setCustomClones] = useState<string[]>([]);
  const [isCreatingClone, setIsCreatingClone] = useState<boolean>(false);
  const [newCloneInput, setNewCloneInput] = useState<string>('');
  const [houseCustomValues, setHouseCustomValues] = useState<Record<string, string>>({});

  const allAvailableClones = useMemo(() => {
    const set = new Set<string>(CLONE_PRESETS);
    for (const h of houseCatalog) {
      if (h.cloneGroup?.trim()) set.add(h.cloneGroup.trim());
    }
    for (const c of customClones) {
      if (c.trim()) set.add(c.trim());
    }
    return Array.from(set);
  }, [houseCatalog, customClones]);

  // =========================================================================
  // 2. Estados do Gerenciador de Bancos Operacionais
  // =========================================================================
  const [bankFilter, setBankFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [bankSearch, setBankSearch] = useState('');
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankCompeCode, setBankCompeCode] = useState('');
  const [bankAccountType, setBankAccountType] = useState('Conta Digital PF');
  const [bankPixKeyTypes, setBankPixKeyTypes] = useState('CPF, E-mail, Celular, Aleatória');
  const [bankDailyLimit, setBankDailyLimit] = useState('25000');
  const [bankDevicePolicy, setBankDevicePolicy] = useState('App no celular da parceria');
  const [bankActive, setBankActive] = useState(true);
  const [bankNotes, setBankNotes] = useState('');
  const [bankCustomValues, setBankCustomValues] = useState<Record<string, string>>({});

  // =========================================================================
  // 3. Estados do Gerenciador de Critérios e Informações Adicionais
  // =========================================================================
  const [critLabel, setCritLabel] = useState('');
  const [critTarget, setCritTarget] = useState<CatalogEntityType>('casa');
  const [critFieldType, setCritFieldType] = useState<CatalogFieldType>('texto');
  const [critOptionsCsv, setCritOptionsCsv] = useState('');
  const [critDefaultValue, setCritDefaultValue] = useState('');
  const [critDescription, setCritDescription] = useState('');
  const [critRequired, setCritRequired] = useState(false);

  const houseCriteria = useMemo(
    () => customCriteria.filter((c) => c.target === 'casa'),
    [customCriteria]
  );

  const bankCriteria = useMemo(
    () => customCriteria.filter((c) => c.target === 'banco'),
    [customCriteria]
  );

  const openNewHouseForm = () => {
    setEditingHouseId(null);
    setHouseName('');
    setHouseCloneGroup('Sem clones');
    setIsCreatingClone(false);
    setNewCloneInput('');
    setHouseColorHex('#EA580C');
    setHouseCategory('Nacional');
    setHouseVerification('Facial no saque');
    setHouseMinStake('20');
    setHouseWithdrawTime('PIX Imediato');
    setHouseActive(true);
    setHouseNotes('');
    const defaults: Record<string, string> = {};
    for (const c of houseCriteria) {
      defaults[c.key] = c.defaultValue || '';
    }
    setHouseCustomValues(defaults);
    setShowHouseForm(true);
  };

  const openEditHouseForm = (house: HouseCatalogItem) => {
    setEditingHouseId(house.id);
    setHouseName(house.name);
    setHouseCloneGroup(house.cloneGroup || 'Sem clones');
    setIsCreatingClone(false);
    setNewCloneInput('');
    setHouseColorHex(house.color || getHouseColorTheme(house.name, house.cloneGroup).primary);
    setHouseCategory(house.category);
    setHouseVerification(house.verificationPolicy);
    setHouseMinStake(String(house.defaultMinStake));
    setHouseWithdrawTime(house.withdrawLeadTime);
    setHouseActive(house.active);
    setHouseNotes(house.notes);
    const vals: Record<string, string> = {};
    for (const c of houseCriteria) {
      vals[c.key] = house.customValues[c.key] ?? c.defaultValue ?? '';
    }
    setHouseCustomValues(vals);
    setShowHouseForm(true);
  };

  const handleSaveHouse = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedClone = isCreatingClone && newCloneInput.trim()
      ? newCloneInput.trim()
      : houseCloneGroup.trim() || 'Sem clones';

    const res = upsertHouseCatalogItem({
      id: editingHouseId || undefined,
      name: houseName,
      cloneGroup: resolvedClone,
      category: houseCategory,
      verificationPolicy: houseVerification,
      defaultMinStake: Number(houseMinStake) || 10,
      withdrawLeadTime: houseWithdrawTime,
      active: houseActive,
      notes: houseNotes,
      customValues: houseCustomValues,
      color: houseColorHex || undefined,
    });
    if (res.ok) {
      if (isCreatingClone && newCloneInput.trim()) {
        setCustomClones((prev) => Array.from(new Set([...prev, newCloneInput.trim()])));
      }
      setShowHouseForm(false);
      setEditingHouseId(null);
      setIsCreatingClone(false);
      setNewCloneInput('');
    }
  };

  const openNewBankForm = () => {
    setEditingBankId(null);
    setBankName('');
    setBankCompeCode('');
    setBankAccountType('Conta Digital PF');
    setBankPixKeyTypes('CPF, E-mail, Celular, Aleatória');
    setBankDailyLimit('25000');
    setBankDevicePolicy('App no celular da parceria');
    setBankActive(true);
    setBankNotes('');
    const defaults: Record<string, string> = {};
    for (const c of bankCriteria) {
      defaults[c.key] = c.defaultValue || '';
    }
    setBankCustomValues(defaults);
    setShowBankForm(true);
  };

  const openEditBankForm = (bank: BankCatalogItem) => {
    setEditingBankId(bank.id);
    setBankName(bank.name);
    setBankCompeCode(bank.compeCode);
    setBankAccountType(bank.accountType);
    setBankPixKeyTypes(bank.pixKeyTypes);
    setBankDailyLimit(String(bank.dailyPixLimit));
    setBankDevicePolicy(bank.devicePolicy);
    setBankActive(bank.active);
    setBankNotes(bank.notes);
    const vals: Record<string, string> = {};
    for (const c of bankCriteria) {
      vals[c.key] = bank.customValues[c.key] ?? c.defaultValue ?? '';
    }
    setBankCustomValues(vals);
    setShowBankForm(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    const res = upsertBankCatalogItem({
      id: editingBankId || undefined,
      name: bankName,
      compeCode: bankCompeCode,
      accountType: bankAccountType,
      pixKeyTypes: bankPixKeyTypes,
      dailyPixLimit: Math.max(0, Number(bankDailyLimit) || 0),
      devicePolicy: bankDevicePolicy,
      active: bankActive,
      notes: bankNotes,
      customValues: bankCustomValues,
    });
    if (res.ok) {
      setShowBankForm(false);
      setEditingBankId(null);
    }
  };

  const handleCreateCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    const options =
      critFieldType === 'selecao'
        ? critOptionsCsv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const res = addCatalogCriterion({
      target: critTarget,
      label: critLabel,
      fieldType: critFieldType,
      options,
      defaultValue: critDefaultValue,
      description: critDescription,
      required: critRequired,
    });
    if (res.ok) {
      setCritLabel('');
      setCritOptionsCsv('');
      setCritDefaultValue('');
      setCritDescription('');
      setCritRequired(false);
    }
  };

  const filteredHouses = useMemo(() => {
    const q = houseSearch.trim().toLowerCase();
    return houseCatalog.filter((h) => {
      if (houseFilter === 'ativas' && !h.active) return false;
      if (houseFilter === 'inativas' && h.active) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.cloneGroup.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q) ||
        h.notes.toLowerCase().includes(q)
      );
    });
  }, [houseCatalog, houseFilter, houseSearch]);

  const filteredBanks = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    return bankCatalog.filter((b) => {
      if (bankFilter === 'ativos' && !b.active) return false;
      if (bankFilter === 'inativos' && b.active) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.compeCode.toLowerCase().includes(q) ||
        b.accountType.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q)
      );
    });
  }, [bankCatalog, bankFilter, bankSearch]);

  const handleExportCatalogJson = () => {
    const jsonContent = JSON.stringify(catalogPersistenceSnapshot, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enigma_catalogo_casas_bancos_v${catalogPersistenceSnapshot.schemaVersion}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(
      'success',
      `Snapshot JSON do catálogo exportado (${houseCatalog.length} casas, ${bankCatalog.length} bancos e ${customCriteria.length} critérios).`
    );
  };

  return (
    <div
      role="tabpanel"
      aria-labelledby="admin-tab-catalogo"
      className="flex flex-col gap-[18px]"
    >
      {/* Cabeçalho do Gerenciador de Casas, Bancos e Critérios */}
      <div className="flex flex-wrap justify-between items-start gap-[12px]">
        <div>
          <div className="flex flex-wrap items-center gap-[8px]">
            <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-semibold bg-[#DCECE7] text-[#0F6B5C] uppercase tracking-wider">
              Catálogo Operacional Dinâmico · Banco de Dados
            </span>
            <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-semibold bg-[#EEF3F0] text-[#3A4A43]">
              Critérios Extensíveis (Casas & Bancos)
            </span>
          </div>
          <h2 className="text-[19px] font-bold text-[#1B2421] mt-[6px]">
            Gerenciador de Casas Offshore (Cripto), Corretoras/Carteiras e Critérios Adicionais
          </h2>
          <p className="text-[13px] text-[#5E6B65] mt-[2px]">
            Gerencie as Casas Gringas (Offshore Cripto, Clones Blaze, AsianConnect, Web3), Corretoras e Carteiras (Binance, MetaMask BEP20/ERC20) e critérios customizados (<code className="font-mono">Rollover 1x/3x</code>, <code className="font-mono">KYC Selfie/Papel</code>, <code className="font-mono">Taxas de Rede</code>).
          </p>
        </div>

        {/* Sub-navegação entre Casas, Corretoras/Carteiras e Critérios */}
        <div className="flex flex-wrap gap-[8px]">
          <button
            type="button"
            onClick={() => setSectionTab('casas')}
            className={`px-[14px] py-[8px] rounded-[9px] text-[13px] font-semibold transition-colors cursor-pointer ${
              sectionTab === 'casas'
                ? 'bg-[#0F6B5C] text-white'
                : 'bg-[#F0F3F1] text-[#3A4A43] hover:bg-[#E2E8E4]'
            }`}
          >
            Casas Offshore / Cripto ({houseCatalog.filter((h) => h.active).length}/{houseCatalog.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionTab('bancos')}
            className={`px-[14px] py-[8px] rounded-[9px] text-[13px] font-semibold transition-colors cursor-pointer ${
              sectionTab === 'bancos'
                ? 'bg-[#0F6B5C] text-white'
                : 'bg-[#F0F3F1] text-[#3A4A43] hover:bg-[#E2E8E4]'
            }`}
          >
            Corretoras & Carteiras ({bankCatalog.filter((b) => b.active).length}/{bankCatalog.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionTab('criterios')}
            className={`px-[14px] py-[8px] rounded-[9px] text-[13px] font-semibold transition-colors cursor-pointer ${
              sectionTab === 'criterios'
                ? 'bg-[#0F6B5C] text-white'
                : 'bg-[#F0F3F1] text-[#3A4A43] hover:bg-[#E2E8E4]'
            }`}
          >
            Critérios Adicionais ({customCriteria.length})
          </button>
        </div>
      </div>

      {/* ===================================================================
          SUB-ABA 1: GERENCIADOR DE CASAS DE APOSTAS
         =================================================================== */}
      {sectionTab === 'casas' && (
        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-wrap items-center justify-between gap-[10px]">
            <div className="flex flex-wrap items-center gap-[6px]">
              {(
                [
                  ['todas', `Todas (${houseCatalog.length})`],
                  ['ativas', `Ativas em Circulação (${houseCatalog.filter((h) => h.active).length})`],
                  ['inativas', `Retiradas / Inativas (${houseCatalog.filter((h) => !h.active).length})`],
                ] as const
              ).map(([st, label]) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setHouseFilter(st)}
                  className={`px-[12px] py-[6px] rounded-[8px] text-[12px] font-semibold transition-colors cursor-pointer ${
                    houseFilter === st
                      ? 'bg-[#0F6B5C] text-white'
                      : 'bg-[#F0F3F1] text-[#4F5E57] hover:bg-[#E2E8E4]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-[8px]">
              <input
                type="search"
                aria-label="Buscar casa no catálogo"
                value={houseSearch}
                onChange={(e) => setHouseSearch(e.target.value)}
                placeholder="Buscar casa, clone ou categoria..."
                className="px-[12px] py-[7px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[12px] min-w-[220px]"
              />
              <button
                type="button"
                onClick={openNewHouseForm}
                className="px-[14px] py-[8px] rounded-[9px] bg-[#0F6B5C] text-white text-[12px] font-semibold hover:bg-[#0B5448] cursor-pointer"
              >
                + Adicionar Casa ao Catálogo
              </button>
            </div>
          </div>

          {showHouseForm && (
            <form
              onSubmit={handleSaveHouse}
              className="p-[18px] rounded-[12px] bg-[#F7F9F8] border-2 border-[#0F6B5C] flex flex-col gap-[14px]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[#1B2421]">
                  {editingHouseId
                    ? 'Editar Casa de Apostas e Critérios'
                    : 'Adicionar Nova Casa de Apostas ao Banco de Dados'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowHouseForm(false);
                    setEditingHouseId(null);
                  }}
                  className="text-[12px] font-semibold text-[#5E6B65] hover:text-[#1B2421] cursor-pointer"
                >
                  × Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-[12px]">
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-house-name" className="text-[12px] font-semibold text-[#4F5E57]">
                    Nome da Casa *
                  </label>
                  <input
                    id="cat-house-name"
                    type="text"
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    placeholder="Ex.: Novibet, Betfair, Pinnacle"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-house-clone" className="text-[12px] font-semibold text-[#4F5E57] flex items-center justify-between">
                    <span>Grupo de Clone / Provedor</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingClone((v) => !v)}
                      className="text-[11px] text-[#0F6B5C] font-bold hover:underline cursor-pointer"
                    >
                      {isCreatingClone ? 'Selecionar existente' : '+ Novo provedor'}
                    </button>
                  </label>
                  {!isCreatingClone ? (
                    <select
                      id="cat-house-clone"
                      value={houseCloneGroup}
                      onChange={(e) => {
                        if (e.target.value === '__novo__') {
                          setIsCreatingClone(true);
                        } else {
                          setHouseCloneGroup(e.target.value);
                        }
                      }}
                      className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                    >
                      {allAvailableClones.map((cg) => (
                        <option key={cg} value={cg}>
                          {cg}
                        </option>
                      ))}
                      <option value="__novo__">+ Criar novo provedor / clone...</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-[6px]">
                      <input
                        type="text"
                        value={newCloneInput}
                        onChange={(e) => setNewCloneInput(e.target.value)}
                        placeholder="Ex.: Blaze, Estrela, 7k, Vbet..."
                        className="flex-1 px-[10px] py-[8px] rounded-[8px] border-2 border-[#0F6B5C] bg-white text-[13px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCloneInput.trim()) {
                            setHouseCloneGroup(newCloneInput.trim());
                            setCustomClones((prev) => Array.from(new Set([...prev, newCloneInput.trim()])));
                            setIsCreatingClone(false);
                          }
                        }}
                        className="px-[10px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[11.5px] font-bold cursor-pointer shrink-0"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-house-category" className="text-[12px] font-semibold text-[#4F5E57]">
                    Categoria Operacional
                  </label>
                  <input
                    id="cat-house-category"
                    type="text"
                    value={houseCategory}
                    onChange={(e) => setHouseCategory(e.target.value)}
                    placeholder="Ex.: Nacional, Europeia, Asiática"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-house-status" className="text-[12px] font-semibold text-[#4F5E57]">
                    Disponibilidade nas Telas
                  </label>
                  <select
                    id="cat-house-status"
                    value={houseActive ? 'ativa' : 'inativa'}
                    onChange={(e) => setHouseActive(e.target.value === 'ativa')}
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  >
                    <option value="ativa">Ativa (Visível para criar contas)</option>
                    <option value="inativa">Retirada / Inativa (Oculta em novos cadastros)</option>
                  </select>
                </div>
              </div>

              {/* Seção Nova: Cor & Identidade Visual da Casa com Cores Leves e Prévia ao Vivo */}
              <div className="p-[14px] rounded-[10px] bg-white border border-[#CBD5E1] flex flex-col gap-[10px]">
                <div className="flex flex-wrap items-center justify-between gap-[8px]">
                  <div className="flex items-center gap-[6px]">
                    <Palette className="w-[15px] h-[15px] text-[#0F6B5C]" strokeWidth={2} />
                    <span className="text-[13px] font-bold text-[#111815]">
                      Cor da Casa & Identidade Visual
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      (aplicada nos badges, tabelas e nas Casas Rápidas)
                    </span>
                  </div>

                  {/* Prévia ao Vivo */}
                  {(() => {
                    const previewTheme = getHouseColorTheme(
                      houseName || 'Nova Casa',
                      isCreatingClone && newCloneInput.trim() ? newCloneInput.trim() : houseCloneGroup,
                      houseColorHex
                    );
                    return (
                      <div className="flex items-center gap-[8px]">
                        <span className="text-[11px] font-semibold text-[#64748B]">
                          Prévia da Casa:
                        </span>
                        <div
                          style={{
                            backgroundColor: previewTheme.bg,
                            borderColor: previewTheme.border,
                            color: previewTheme.text,
                          }}
                          className="px-[10px] py-[3.5px] rounded-full border text-[12px] font-bold flex items-center gap-[6px] shadow-2xs"
                        >
                          <span
                            style={{ backgroundColor: previewTheme.primary }}
                            className="w-[7px] h-[7px] rounded-full shrink-0"
                          />
                          <span>{houseName || 'Nova Casa'}</span>
                          <span
                            style={{
                              backgroundColor: previewTheme.badgeBg,
                              color: previewTheme.badgeText,
                            }}
                            className="px-[5.5px] py-[1px] rounded-full text-[10px] font-bold"
                          >
                            1
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Grid de Paleta de Cores Leves das Principais Casas e Provedores */}
                <div className="flex flex-wrap gap-[6px] items-center">
                  {HOUSE_COLOR_SUGGESTIONS.map((sug) => {
                    const isSelected =
                      (houseColorHex || '').toLowerCase() === sug.hex.toLowerCase();
                    return (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => setHouseColorHex(sug.hex)}
                        title={`${sug.name} (${sug.description})`}
                        style={{
                          backgroundColor: sug.theme.bg,
                          borderColor: isSelected ? sug.theme.primary : sug.theme.border,
                          color: sug.theme.text,
                        }}
                        className={`px-[9px] py-[5px] rounded-[8px] text-[11.5px] font-medium border flex items-center gap-[6px] cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 font-bold shadow-xs'
                            : 'hover:brightness-95'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: sug.hex }}
                          className="w-[10px] h-[10px] rounded-full shrink-0 border border-white"
                        />
                        <span>{sug.name}</span>
                        {isSelected && <Check className="w-[12px] h-[12px]" strokeWidth={2.5} />}
                      </button>
                    );
                  })}

                  {/* Cor Personalizada via Color Picker */}
                  <div className="flex items-center gap-[6px] pl-[6px] border-l border-[#CBD5E1]">
                    <label
                      htmlFor="custom-house-color"
                      className="text-[11px] font-semibold text-[#475569] cursor-pointer flex items-center gap-[4px]"
                    >
                      <span>Custom:</span>
                      <input
                        id="custom-house-color"
                        type="color"
                        value={houseColorHex}
                        onChange={(e) => setHouseColorHex(e.target.value)}
                        className="w-[28px] h-[28px] rounded-[6px] border border-[#CBD5E1] p-[1px] cursor-pointer"
                      />
                    </label>
                    <span className="font-mono text-[11px] text-[#64748B]">
                      {houseColorHex}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px]">
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-house-kyc" className="text-[12px] font-semibold text-[#4F5E57]">
                    Política de Verificação / KYC
                  </label>
                  <input
                    id="cat-house-kyc"
                    type="text"
                    value={houseVerification}
                    onChange={(e) => setHouseVerification(e.target.value)}
                    placeholder="Ex.: Facial no saque, KYC padrão"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-house-minstake" className="text-[12px] font-semibold text-[#4F5E57]">
                    Stake Mínima Padrão (R$)
                  </label>
                  <input
                    id="cat-house-minstake"
                    type="number"
                    value={houseMinStake}
                    onChange={(e) => setHouseMinStake(e.target.value)}
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-house-withdraw" className="text-[12px] font-semibold text-[#4F5E57]">
                    Prazo Médio de Saque
                  </label>
                  <input
                    id="cat-house-withdraw"
                    type="text"
                    value={houseWithdrawTime}
                    onChange={(e) => setHouseWithdrawTime(e.target.value)}
                    placeholder="Ex.: PIX Imediato, Até 2h"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label htmlFor="cat-house-notes" className="text-[12px] font-semibold text-[#4F5E57]">
                  Observações Operacionais da Casa
                </label>
                <input
                  id="cat-house-notes"
                  type="text"
                  value={houseNotes}
                  onChange={(e) => setHouseNotes(e.target.value)}
                  placeholder="Regras de rollover, limites, velocidade de saque PIX..."
                  className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                />
              </div>

              {/* Critérios / Informações Adicionais Dinâmicas para Casas */}
              {houseCriteria.length > 0 && (
                <div className="pt-[10px] border-t border-[#DCE3DF] flex flex-col gap-[10px]">
                  <div className="text-[12px] font-bold text-[#0F6B5C]">
                    Critérios & Informações Adicionais da Casa (Estrutura Flexível no Banco)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
                    {houseCriteria.map((crit) => {
                      const val = houseCustomValues[crit.key] ?? '';
                      return (
                        <div key={crit.id} className="flex flex-col gap-[4px]">
                          <label
                            htmlFor={`house-crit-${crit.key}`}
                            className="text-[12px] font-medium text-[#4F5E57]"
                          >
                            {crit.label} {crit.required ? '*' : ''}
                          </label>
                          {crit.fieldType === 'selecao' && crit.options ? (
                            <select
                              id={`house-crit-${crit.key}`}
                              value={val}
                              onChange={(e) =>
                                setHouseCustomValues((prev) => ({
                                  ...prev,
                                  [crit.key]: e.target.value,
                                }))
                              }
                              className="px-[10px] py-[7px] rounded-[8px] border border-[#C9D2CD] bg-white text-[12px]"
                            >
                              {crit.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`house-crit-${crit.key}`}
                              type={crit.fieldType === 'numero' || crit.fieldType === 'moeda' ? 'number' : 'text'}
                              value={val}
                              onChange={(e) =>
                                setHouseCustomValues((prev) => ({
                                  ...prev,
                                  [crit.key]: e.target.value,
                                }))
                              }
                              placeholder={crit.defaultValue || crit.label}
                              className="px-[10px] py-[7px] rounded-[8px] border border-[#C9D2CD] bg-white text-[12px]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-[8px] pt-[4px]">
                <button
                  type="button"
                  onClick={() => {
                    setShowHouseForm(false);
                    setEditingHouseId(null);
                  }}
                  className="px-[14px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[#4F5E57] text-[12px] font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[12px] font-semibold hover:bg-[#0B5448] cursor-pointer"
                >
                  {editingHouseId ? 'Salvar Alterações da Casa' : 'Confirmar Inclusão da Casa'}
                </button>
              </div>
            </form>
          )}

          {/* Tabela de Casas do Catálogo */}
          <div className="overflow-x-auto border border-[#E5EBE7] rounded-[12px]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F4F6F5] text-[#4F5E57] border-b border-[#E5EBE7] text-[12px]">
                  <th className="py-[10px] px-[12px] font-semibold">Casa de Apostas</th>
                  <th className="py-[10px] px-[12px] font-semibold">Grupo Clone / Categoria</th>
                  <th className="py-[10px] px-[12px] font-semibold">Status</th>
                  <th className="py-[10px] px-[12px] font-semibold">Contas / Regras</th>
                  <th className="py-[10px] px-[12px] font-semibold">Critérios & Informações Adicionais</th>
                  <th className="py-[10px] px-[12px] font-semibold text-right">Ações no Catálogo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EFEA]">
                {filteredHouses.map((h) => {
                  const linkedCount = allHouseAccounts.filter(
                    (a) => a.houseName.toLowerCase() === h.name.toLowerCase()
                  ).length;
                  const hTheme = getHouseColorTheme(h.name, h.cloneGroup, h.color);

                  return (
                    <tr key={h.id} className="hover:bg-[#FAFBF9]">
                      <td className="py-[11px] px-[12px]">
                        <div className="flex items-center gap-[8px]">
                          <span
                            style={{
                              backgroundColor: hTheme.bg,
                              borderColor: hTheme.border,
                              color: hTheme.text,
                            }}
                            className="px-[8px] py-[2px] rounded-md border text-[12px] font-bold inline-flex items-center gap-[5px]"
                          >
                            <span
                              style={{ backgroundColor: hTheme.primary }}
                              className="w-[7px] h-[7px] rounded-full shrink-0"
                            />
                            {h.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7872] mt-[3px]">
                          {h.verificationPolicy} {h.notes ? `· ${h.notes}` : ''}
                        </div>
                      </td>
                      <td className="py-[11px] px-[12px]">
                        <span className="inline-block px-[8px] py-[2px] rounded-[6px] text-[11px] font-semibold bg-[#EEF2EF] text-[#3A4A43] border border-[#CBD5E1]">
                          {h.cloneGroup}
                        </span>
                        <div className="text-[11px] text-[#6B7872] mt-[2px]">{h.category}</div>
                      </td>
                      <td className="py-[11px] px-[12px]">
                        <span
                          className={`inline-block px-[8px] py-[2px] rounded-full text-[11px] font-semibold ${
                            h.active
                              ? 'bg-[#E1F3EA] text-[#0D6547]'
                              : 'bg-[#FBE9E7] text-[#8C1D18]'
                          }`}
                        >
                          {h.active ? 'Ativa' : 'Retirada / Inativa'}
                        </span>
                      </td>
                      <td className="py-[11px] px-[12px] tabular-nums text-[12px] text-[#4F5E57]">
                        <div>
                          <strong>{linkedCount}</strong> conta(s)
                        </div>
                        <div className="text-[11px] text-[#6B7872]">
                          Saque: {h.withdrawLeadTime}
                        </div>
                      </td>
                      <td className="py-[11px] px-[12px]">
                        <div className="flex flex-wrap gap-[5px]">
                          {houseCriteria.map((crit) => {
                            const val = h.customValues[crit.key];
                            if (!val) return null;
                            return (
                              <span
                                key={crit.id}
                                className="inline-block px-[7px] py-[2px] rounded-[6px] bg-[#F4F6F5] border border-[#DCE3DF] text-[11px] text-[#3A4A43]"
                              >
                                <strong className="text-[#1B2421]">{crit.label}:</strong> {val}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-[11px] px-[12px] text-right">
                        <div className="flex flex-wrap justify-end gap-[6px]">
                          <button
                            type="button"
                            onClick={() => openEditHouseForm(h)}
                            className="px-[10px] py-[5px] rounded-[7px] border border-[#C9D2CD] bg-white text-[#1B2421] text-[11px] font-semibold hover:bg-[#F0F3F1] cursor-pointer"
                          >
                            Editar / Critérios
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleHouseCatalogActive(h.id)}
                            className={`px-[10px] py-[5px] rounded-[7px] text-[11px] font-semibold cursor-pointer ${
                              h.active
                                ? 'border border-[#E5CFA0] bg-[#FDF7E8] text-[#8A5A10] hover:bg-[#F8ECCE]'
                                : 'bg-[#0F6B5C] text-white hover:bg-[#0B5448]'
                            }`}
                          >
                            {h.active ? 'Retirar Casa' : 'Reativar Casa'}
                          </button>
                          {linkedCount === 0 && (
                            <button
                              type="button"
                              onClick={() => removeHouseCatalogItem(h.id)}
                              className="px-[10px] py-[5px] rounded-[7px] border border-[#E7B5AD] bg-[#FBECE9] text-[#9E3324] text-[11px] font-semibold hover:bg-[#F6D7D2] cursor-pointer"
                            >
                              Excluir
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
        </div>
      )}

      {/* ===================================================================
          SUB-ABA 2: GERENCIADOR DE BANCOS OPERACIONAIS
         =================================================================== */}
      {sectionTab === 'bancos' && (
        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-wrap items-center justify-between gap-[10px]">
            <div className="flex flex-wrap items-center gap-[6px]">
              {(
                [
                  ['todos', `Todos (${bankCatalog.length})`],
                  ['ativos', `Ativos (${bankCatalog.filter((b) => b.active).length})`],
                  ['inativos', `Retirados / Inativos (${bankCatalog.filter((b) => !b.active).length})`],
                ] as const
              ).map(([st, label]) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBankFilter(st)}
                  className={`px-[12px] py-[6px] rounded-[8px] text-[12px] font-semibold transition-colors cursor-pointer ${
                    bankFilter === st
                      ? 'bg-[#0F6B5C] text-white'
                      : 'bg-[#F0F3F1] text-[#4F5E57] hover:bg-[#E2E8E4]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-[8px]">
              <input
                type="search"
                aria-label="Buscar banco no catálogo"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Buscar banco ou código COMPE..."
                className="px-[12px] py-[7px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[12px] min-w-[220px]"
              />
              <button
                type="button"
                onClick={openNewBankForm}
                className="px-[14px] py-[8px] rounded-[9px] bg-[#0F6B5C] text-white text-[12px] font-semibold hover:bg-[#0B5448] cursor-pointer"
              >
                + Adicionar Banco ao Catálogo
              </button>
            </div>
          </div>

          {showBankForm && (
            <form
              onSubmit={handleSaveBank}
              className="p-[18px] rounded-[12px] bg-[#F7F9F8] border-2 border-[#0F6B5C] flex flex-col gap-[14px]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[#1B2421]">
                  {editingBankId
                    ? 'Editar Banco Operacional e Critérios'
                    : 'Adicionar Novo Banco Operacional ao Banco de Dados'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowBankForm(false);
                    setEditingBankId(null);
                  }}
                  className="text-[12px] font-semibold text-[#5E6B65] hover:text-[#1B2421] cursor-pointer"
                >
                  × Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-[12px]">
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-bank-name" className="text-[12px] font-semibold text-[#4F5E57]">
                    Nome do Banco *
                  </label>
                  <input
                    id="cat-bank-name"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ex.: BTG Pactual, Neon, Mercado Pago"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-bank-compe" className="text-[12px] font-semibold text-[#4F5E57]">
                    Código COMPE / ISPB
                  </label>
                  <input
                    id="cat-bank-compe"
                    type="text"
                    value={bankCompeCode}
                    onChange={(e) => setBankCompeCode(e.target.value)}
                    placeholder="Ex.: 077, 260, 336"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px] font-mono"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-bank-type" className="text-[12px] font-semibold text-[#4F5E57]">
                    Tipo de Conta
                  </label>
                  <input
                    id="cat-bank-type"
                    type="text"
                    value={bankAccountType}
                    onChange={(e) => setBankAccountType(e.target.value)}
                    placeholder="Ex.: Conta Digital PF"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-bank-limit" className="text-[12px] font-semibold text-[#4F5E57]">
                    Limite Diário PIX (R$)
                  </label>
                  <input
                    id="cat-bank-limit"
                    type="number"
                    value={bankDailyLimit}
                    onChange={(e) => setBankDailyLimit(e.target.value)}
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-bank-status" className="text-[12px] font-semibold text-[#4F5E57]">
                    Status no Catálogo
                  </label>
                  <select
                    id="cat-bank-status"
                    value={bankActive ? 'ativo' : 'inativo'}
                    onChange={(e) => setBankActive(e.target.value === 'ativo')}
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  >
                    <option value="ativo">Ativo (Visível nas Parcerias)</option>
                    <option value="inativo">Retirado / Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px]">
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-bank-pix" className="text-[12px] font-semibold text-[#4F5E57]">
                    Tipos de Chave PIX Aceitos
                  </label>
                  <input
                    id="cat-bank-pix"
                    type="text"
                    value={bankPixKeyTypes}
                    onChange={(e) => setBankPixKeyTypes(e.target.value)}
                    placeholder="CPF, E-mail, Celular, Aleatória"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-bank-device" className="text-[12px] font-semibold text-[#4F5E57]">
                    Política de Aparelho / Celular
                  </label>
                  <input
                    id="cat-bank-device"
                    type="text"
                    value={bankDevicePolicy}
                    onChange={(e) => setBankDevicePolicy(e.target.value)}
                    placeholder="App no celular da parceria"
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="cat-bank-notes" className="text-[12px] font-semibold text-[#4F5E57]">
                    Observações Operacionais do Banco
                  </label>
                  <input
                    id="cat-bank-notes"
                    type="text"
                    value={bankNotes}
                    onChange={(e) => setBankNotes(e.target.value)}
                    placeholder="Regras de dispositivo, reconhecimento facial, limites..."
                    className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                  />
                </div>
              </div>

              {/* Critérios / Informações Adicionais Dinâmicas para Bancos */}
              {bankCriteria.length > 0 && (
                <div className="pt-[10px] border-t border-[#DCE3DF] flex flex-col gap-[10px]">
                  <div className="text-[12px] font-bold text-[#0F6B5C]">
                    Critérios & Informações Adicionais do Banco (Estrutura Flexível no Banco)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
                    {bankCriteria.map((crit) => {
                      const val = bankCustomValues[crit.key] ?? '';
                      return (
                        <div key={crit.id} className="flex flex-col gap-[4px]">
                          <label
                            htmlFor={`bank-crit-${crit.key}`}
                            className="text-[12px] font-medium text-[#4F5E57]"
                          >
                            {crit.label} {crit.required ? '*' : ''}
                          </label>
                          {crit.fieldType === 'selecao' && crit.options ? (
                            <select
                              id={`bank-crit-${crit.key}`}
                              value={val}
                              onChange={(e) =>
                                setBankCustomValues((prev) => ({
                                  ...prev,
                                  [crit.key]: e.target.value,
                                }))
                              }
                              className="px-[10px] py-[7px] rounded-[8px] border border-[#C9D2CD] bg-white text-[12px]"
                            >
                              {crit.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`bank-crit-${crit.key}`}
                              type={crit.fieldType === 'numero' || crit.fieldType === 'moeda' ? 'number' : 'text'}
                              value={val}
                              onChange={(e) =>
                                setBankCustomValues((prev) => ({
                                  ...prev,
                                  [crit.key]: e.target.value,
                                }))
                              }
                              placeholder={crit.defaultValue || crit.label}
                              className="px-[10px] py-[7px] rounded-[8px] border border-[#C9D2CD] bg-white text-[12px]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-[8px] pt-[4px]">
                <button
                  type="button"
                  onClick={() => {
                    setShowBankForm(false);
                    setEditingBankId(null);
                  }}
                  className="px-[14px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[#4F5E57] text-[12px] font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[12px] font-semibold hover:bg-[#0B5448] cursor-pointer"
                >
                  {editingBankId ? 'Salvar Alterações do Banco' : 'Confirmar Inclusão do Banco'}
                </button>
              </div>
            </form>
          )}

          {/* Tabela de Corretoras & Carteiras Cripto */}
          <div className="overflow-x-auto border border-[#E5EBE7] rounded-[12px]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F4F6F5] text-[#4F5E57] border-b border-[#E5EBE7] text-[12px]">
                  <th className="py-[10px] px-[12px] font-semibold">Corretora / Carteira Cripto</th>
                  <th className="py-[10px] px-[12px] font-semibold">Protocolo / Redes & Endereços</th>
                  <th className="py-[10px] px-[12px] font-semibold">Limite Operacional</th>
                  <th className="py-[10px] px-[12px] font-semibold">Status</th>
                  <th className="py-[10px] px-[12px] font-semibold">Critérios Cripto (Rede, Taxas, Conversão)</th>
                  <th className="py-[10px] px-[12px] font-semibold text-right">Ações no Catálogo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EFEA]">
                {filteredBanks.map((b) => {
                  const linkedCount = allBankAccounts.filter(
                    (acc) => acc.bankName.toLowerCase() === b.name.toLowerCase()
                  ).length;

                  return (
                    <tr key={b.id} className="hover:bg-[#FAFBF9]">
                      <td className="py-[11px] px-[12px]">
                        <div className="font-bold text-[#1B2421]">{b.name}</div>
                        <div className="text-[11px] text-[#6B7872]">
                          {linkedCount} conta(s) ativa(s) · {b.accountType} {b.notes ? `· ${b.notes}` : ''}
                        </div>
                      </td>
                      <td className="py-[11px] px-[12px] font-mono text-[12px]">
                        <div>COMPE: {b.compeCode}</div>
                        <div className="text-[11px] text-[#5E6B65]">{b.pixKeyTypes}</div>
                      </td>
                      <td className="py-[11px] px-[12px] tabular-nums font-semibold text-[#1B2421]">
                        {formatCurrencyBRL(b.dailyPixLimit)}
                      </td>
                      <td className="py-[11px] px-[12px]">
                        <span
                          className={`inline-block px-[8px] py-[2px] rounded-full text-[11px] font-semibold ${
                            b.active
                              ? 'bg-[#E1F3EA] text-[#0D6547]'
                              : 'bg-[#FBE9E7] text-[#8C1D18]'
                          }`}
                        >
                          {b.active ? 'Ativo' : 'Retirado / Inativo'}
                        </span>
                      </td>
                      <td className="py-[11px] px-[12px]">
                        <div className="flex flex-wrap gap-[5px]">
                          {bankCriteria.map((crit) => {
                            const val = b.customValues[crit.key];
                            if (!val) return null;
                            return (
                              <span
                                key={crit.id}
                                className="inline-block px-[7px] py-[2px] rounded-[6px] bg-[#F4F6F5] border border-[#DCE3DF] text-[11px] text-[#3A4A43]"
                              >
                                <strong className="text-[#1B2421]">{crit.label}:</strong> {val}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-[11px] px-[12px] text-right">
                        <div className="flex flex-wrap justify-end gap-[6px]">
                          <button
                            type="button"
                            onClick={() => openEditBankForm(b)}
                            className="px-[10px] py-[5px] rounded-[7px] border border-[#C9D2CD] bg-white text-[#1B2421] text-[11px] font-semibold hover:bg-[#F0F3F1] cursor-pointer"
                          >
                            Editar / Critérios
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBankCatalogActive(b.id)}
                            className={`px-[10px] py-[5px] rounded-[7px] text-[11px] font-semibold cursor-pointer ${
                              b.active
                                ? 'border border-[#E5CFA0] bg-[#FDF7E8] text-[#8A5A10] hover:bg-[#F8ECCE]'
                                : 'bg-[#0F6B5C] text-white hover:bg-[#0B5448]'
                            }`}
                          >
                            {b.active ? 'Retirar Banco' : 'Reativar Banco'}
                          </button>
                          {linkedCount === 0 && (
                            <button
                              type="button"
                              onClick={() => removeBankCatalogItem(b.id)}
                              className="px-[10px] py-[5px] rounded-[7px] border border-[#E7B5AD] bg-[#FBECE9] text-[#9E3324] text-[11px] font-semibold hover:bg-[#F6D7D2] cursor-pointer"
                            >
                              Excluir
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
        </div>
      )}

      {/* ===================================================================
          SUB-ABA 3: GERENCIADOR DE CRITÉRIOS & INFORMAÇÕES ADICIONAIS
         =================================================================== */}
      {sectionTab === 'criterios' && (
        <div className="flex flex-col gap-[16px]">
          <form
            onSubmit={handleCreateCriterion}
            className="p-[18px] rounded-[12px] bg-[#F7F9F8] border border-[#C9D7D1] flex flex-col gap-[14px]"
          >
            <div>
              <h3 className="text-[15px] font-bold text-[#1B2421]">
                Criar Novo Critério / Informação Adicional para Casas ou Bancos
              </h3>
              <p className="text-[12px] text-[#5E6B65] mt-[2px]">
                Sempre que surgir um novo requisito operacional (ex.: Rollover Mínimo, Taxa de Saque, Biometria no App, Limite PIX Noturno), adicione aqui para que passe a existir no formulário e no banco de dados (<code className="font-mono">catalog_custom_criteria</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-[12px]">
              <div className="flex flex-col gap-[4px]">
                <label htmlFor="crit-label" className="text-[12px] font-semibold text-[#4F5E57]">
                  Nome do Critério / Campo *
                </label>
                <input
                  id="crit-label"
                  type="text"
                  value={critLabel}
                  onChange={(e) => setCritLabel(e.target.value)}
                  placeholder="Ex.: Taxa por Saque PIX, Exige Selfie..."
                  className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                />
              </div>

              <div className="flex flex-col gap-[4px]">
                <label htmlFor="crit-entity" className="text-[12px] font-semibold text-[#4F5E57]">
                  Aplicar em Qual Catálogo?
                </label>
                <select
                  id="crit-entity"
                  value={critTarget}
                  onChange={(e) => setCritTarget(e.target.value as CatalogEntityType)}
                  className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                >
                  <option value="casa">Casas de Apostas</option>
                  <option value="banco">Bancos Operacionais</option>
                </select>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label htmlFor="crit-type" className="text-[12px] font-semibold text-[#4F5E57]">
                  Tipo de Dado
                </label>
                <select
                  id="crit-type"
                  value={critFieldType}
                  onChange={(e) => setCritFieldType(e.target.value as CatalogFieldType)}
                  className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                >
                  <option value="texto">Texto Livre</option>
                  <option value="numero">Número</option>
                  <option value="moeda">Valor Monetário (R$)</option>
                  <option value="selecao">Lista de Opções (Select)</option>
                </select>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label htmlFor="crit-default" className="text-[12px] font-semibold text-[#4F5E57]">
                  Valor Padrão Inicial
                </label>
                <input
                  id="crit-default"
                  type="text"
                  value={critDefaultValue}
                  onChange={(e) => setCritDefaultValue(e.target.value)}
                  placeholder="Valor padrão para registros"
                  className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                />
              </div>
            </div>

            {critFieldType === 'selecao' && (
              <div className="flex flex-col gap-[4px]">
                <label htmlFor="crit-options" className="text-[12px] font-semibold text-[#4F5E57]">
                  Opções da Lista (separadas por vírgula) *
                </label>
                <input
                  id="crit-options"
                  type="text"
                  value={critOptionsCsv}
                  onChange={(e) => setCritOptionsCsv(e.target.value)}
                  placeholder="Ex.: Baixo, Médio, Alto, Crítico"
                  className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-[10px]">
              <label className="flex items-center gap-[8px] text-[12px] font-semibold text-[#1B2421] cursor-pointer">
                <input
                  type="checkbox"
                  checked={critRequired}
                  onChange={(e) => setCritRequired(e.target.checked)}
                  className="w-[16px] h-[16px] accent-[#0F6B5C]"
                />
                Tornar preenchimento obrigatório nos cadastros do catálogo
              </label>

              <button
                type="submit"
                className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[12px] font-semibold hover:bg-[#0B5448] cursor-pointer"
              >
                + Adicionar Critério ao Banco de Dados
              </button>
            </div>
          </form>

          <div className="overflow-x-auto border border-[#E5EBE7] rounded-[12px]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F4F6F5] text-[#4F5E57] border-b border-[#E5EBE7] text-[12px]">
                  <th className="py-[10px] px-[12px] font-semibold">Critério / Campo</th>
                  <th className="py-[10px] px-[12px] font-semibold">Chave SQL / JSON</th>
                  <th className="py-[10px] px-[12px] font-semibold">Alvo</th>
                  <th className="py-[10px] px-[12px] font-semibold">Tipo / Opções</th>
                  <th className="py-[10px] px-[12px] font-semibold">Valor Padrão</th>
                  <th className="py-[10px] px-[12px] font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EFEA]">
                {customCriteria.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFBF9]">
                    <td className="py-[10px] px-[12px] font-bold text-[#1B2421]">
                      {c.label}
                    </td>
                    <td className="py-[10px] px-[12px] font-mono text-[12px] text-[#0F6B5C]">
                      {c.key}
                    </td>
                    <td className="py-[10px] px-[12px]">
                      <span className="px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-[#DCECE7] text-[#0F6B5C]">
                        {c.target === 'casa' ? 'Casas de Apostas' : 'Bancos Operacionais'}
                      </span>
                    </td>
                    <td className="py-[10px] px-[12px] text-[12px] text-[#4F5E57]">
                      {c.fieldType}
                      {c.options && c.options.length > 0
                        ? ` (${c.options.join(', ')})`
                        : ''}
                    </td>
                    <td className="py-[10px] px-[12px] font-mono text-[12px] text-[#5E6B65]">
                      {c.defaultValue || '—'}
                    </td>
                    <td className="py-[10px] px-[12px] text-right">
                      <button
                        type="button"
                        onClick={() => deleteCatalogCriterion(c.id)}
                        className="px-[10px] py-[5px] rounded-[7px] border border-[#E7B5AD] bg-[#FBECE9] text-[#9E3324] text-[11px] font-semibold hover:bg-[#F6D7D2] cursor-pointer"
                      >
                        Remover Critério
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================
          CAMADA DE PERSISTÊNCIA DO CATÁLOGO (CatalogRepository v1)
         =================================================================== */}
      <div className="p-[16px] rounded-[12px] bg-[#F8FAF9] border border-[#DCE3DF] flex flex-col gap-[12px]">
        <div className="flex flex-wrap items-center justify-between gap-[10px]">
          <div>
            <div className="flex items-center gap-[8px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#0F6B5C] inline-block" />
              <h3 className="text-[14px] font-bold text-[#1B2421]">
                Persistência de Catálogo (CatalogRepository v{catalogPersistenceSnapshot.schemaVersion})
              </h3>
            </div>
            <p className="text-[12px] text-[#5E6B65] mt-[2px]">
              Todas as Casas, Bancos e Critérios Adicionais ficam gravados em <code className="font-mono">{catalogPersistenceSnapshot.storageKey}</code> e são exportados automaticamente nas Migrations SQL (<code className="font-mono">003_catalog_houses_banks_and_criteria.sql</code>).
            </p>
          </div>

          <div className="flex flex-wrap gap-[8px]">
            <button
              type="button"
              onClick={handleExportCatalogJson}
              className="px-[12px] py-[7px] rounded-[8px] bg-[#17211E] text-white text-[12px] font-semibold hover:bg-[#263833] cursor-pointer"
            >
              Exportar Catálogo (.json)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px] text-[12px]">
          <div className="p-[10px] rounded-[8px] bg-white border border-[#E4EAE7]">
            <div className="text-[#6B7872]">Checksum do Catálogo</div>
            <div className="font-semibold text-[#0F6B5C] font-mono mt-[2px]">
              {catalogPersistenceSnapshot.checksum}
            </div>
          </div>
          <div className="p-[10px] rounded-[8px] bg-white border border-[#E4EAE7]">
            <div className="text-[#6B7872]">Casas Persistidas</div>
            <div className="font-semibold text-[#1B2421] mt-[2px]">
              {catalogPersistenceSnapshot.activeHousesCount} ativas / {catalogPersistenceSnapshot.housesCount} total
            </div>
          </div>
          <div className="p-[10px] rounded-[8px] bg-white border border-[#E4EAE7]">
            <div className="text-[#6B7872]">Bancos Persistidos</div>
            <div className="font-semibold text-[#1B2421] mt-[2px]">
              {catalogPersistenceSnapshot.activeBanksCount} ativos / {catalogPersistenceSnapshot.banksCount} total
            </div>
          </div>
          <div className="p-[10px] rounded-[8px] bg-white border border-[#E4EAE7]">
            <div className="text-[#6B7872]">Critérios Customizados</div>
            <div className="font-semibold text-[#1B2421] mt-[2px]">
              {catalogPersistenceSnapshot.customCriteriaCount} critério(s) ativo(s)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
