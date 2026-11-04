import type {
  AppSystemVersionId,
  BankAccount,
  BankCatalogItem,
  CatalogCustomCriterion,
  HouseAccount,
  HouseCatalogItem,
  Partnership,
} from './types.ts';
import {
  INITIAL_BANK_CATALOG,
  INITIAL_CUSTOM_CRITERIA,
  INITIAL_HOUSE_CATALOG,
} from './catalog.ts';
import {
  INITIAL_BANK_ACCOUNTS,
  INITIAL_HOUSE_ACCOUNTS,
  INITIAL_PARTNERSHIPS,
} from './seed.ts';
import type { CurrencyDisplayMode } from './ledger.ts';

export interface SystemVersionMetadata {
  id: AppSystemVersionId;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  releasedAt: string;
  defaultCurrencyMode: CurrencyDisplayMode;
  defaultUsdtBrlRate: number;
  defaultEurUsdtRate: number;
  highlights: string[];
}

export const SYSTEM_VERSIONS: SystemVersionMetadata[] = [
  {
    id: 'v2_cripto_offshore',
    tag: 'v2.0 (Atual · Offshore & Cripto)',
    title: 'v2.0 — Offshore & Cripto (OKX / Binance / MetaMask + Saldo USDT & EUR €)',
    subtitle: 'Corretora por Operador (OKX ou Binance) · MetaMask Ilimitada · Casas em USDT e EUR (€)',
    description:
      'Operação 100% focada em Casas Gringas Offshore e Cripto: corretora à escolha do operador (OKX, Binance, Bybit), carteiras MetaMask ilimitadas (BEP20/ERC20), protocolo KYC Offshore, Rollover 1x/3x e suporte a casas com depósito via USDT e saldo interno em Euro (EUR €).',
    releasedAt: '03/11/2026 22:15',
    defaultCurrencyMode: 'usdt_brl_mirror',
    defaultUsdtBrlRate: 5.48,
    defaultEurUsdtRate: 1.08,
    highlights: [
      'Corretora à escolha do operador: OKX, Binance ou Bybit (mesmo fluxo QR Code BEP20/ERC20)',
      'Casas com depósito via USDT e saldo interno em EUR (€) ou USDT ($)',
      'Carteiras MetaMask ilimitadas por parceria (0x...) + OvertimeMarkets Web3',
      'Catálogo completo: Clones Blaze (BC.Game, BetFury 3x, FortuneJack, Duel Sumsub, Bet25 Vídeo), Pinnacle AsianConnect, Cloudbet, Duelbits, Thunderpick, Sportsbet.io',
    ],
  },
  {
    id: 'v1_5_hibrido',
    tag: 'v1.5 (Operação Híbrida)',
    title: 'v1.5 — Operação Híbrida (Bancos PIX + Corretoras OKX/Binance & Carteiras Cripto)',
    subtitle: 'Mantém Bancos Nacionais (Inter, PGBank, Nubank) + Ecossistema Cripto (OKX, Binance, MetaMask, EUR/USDT)',
    description:
      'Modo híbrido que une os dois mundos: mantém todas as Contas Bancárias e chaves PIX (Inter, PGBank, Nubank, C6) e Casas Nacionais (.bet.br) ao lado das Corretoras Cripto (OKX, Binance), Carteiras MetaMask (BEP20/ERC20) e Casas Offshore em USDT e EUR.',
    releasedAt: '03/11/2026 22:15',
    defaultCurrencyMode: 'usdt_brl_mirror',
    defaultUsdtBrlRate: 5.48,
    defaultEurUsdtRate: 1.08,
    highlights: [
      'Bancos PIX (Inter, PGBank, Nubank, C6) + Corretoras/Carteiras Cripto (OKX, Binance, MetaMask) juntos',
      'Casas Nacionais (Bet365, Betnacional, KTO, Estrelabet) + Casas Offshore (Pinnacle, Clones Blaze, Cloudbet)',
      'Ideal para transição gradual entre banca em R$ (PIX) e banca em USDT / EUR (€)',
    ],
  },
  {
    id: 'v1_bancos_pix',
    tag: 'v1.0 (Clássico Bancos & PIX)',
    title: 'v1.0 — Clássico Nacional (Contas de Banco & PIX · Moeda R$)',
    subtitle: 'Estado original pré-cripto: Banco Inter, PGBank, Nubank e Casas Nacionais em R$',
    description:
      'Retorna o sistema ao estado clássico original operando exclusivamente com Contas Bancárias (Inter, PGBank, Nubank, C6), chaves PIX e Casas Nacionais (Bet365, Betnacional, KTO, Estrelabet, Superbet, Blaze, Jonbet) em Reais (R$).',
    releasedAt: '11/10/2026 09:00',
    defaultCurrencyMode: 'brl_only',
    defaultUsdtBrlRate: 1.0,
    defaultEurUsdtRate: 1.08,
    highlights: [
      '100% em Reais (R$) sem conversão USDT',
      'Bancos tradicionais: Banco Inter, PGBank, Nubank, C6 Bank, PicPay',
      'Casas originais: Pinnacle, Bet365, Betnacional, KTO, Estrelabet, Superbet, Sportingbet, Blaze, Jonbet',
    ],
  },
];

export const CLASSIC_V1_HOUSE_CATALOG: HouseCatalogItem[] = [
  {
    id: 'hcat_v1_pinnacle',
    name: 'Pinnacle',
    code: 'pinnacle',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Asiática / Sharp',
    verificationPolicy: 'KYC padrão documental',
    defaultMinStake: 50,
    withdrawLeadTime: 'PIX / Transferência (Até 2h)',
    notes: 'Casa sharp de referência.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      rede_cripto_preferencial: 'PIX Nacional · Saldo em BRL (R$)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'hcat_v1_bet365',
    name: 'Bet365',
    code: 'bet365',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Nacional (.bet.br)',
    verificationPolicy: 'Facial no saque + KYC',
    defaultMinStake: 20,
    withdrawLeadTime: 'PIX 1h a 4h',
    notes: 'Alta liquidez nacional via PIX.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      rede_cripto_preferencial: 'PIX Nacional · Saldo em BRL (R$)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'hcat_v1_betnacional',
    name: 'Betnacional',
    code: 'betnacional',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Nacional (.bet.br)',
    verificationPolicy: 'Facial obrigatória no saque',
    defaultMinStake: 10,
    withdrawLeadTime: 'PIX Imediato',
    notes: 'Saque PIX rápido.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      rede_cripto_preferencial: 'PIX Nacional · Saldo em BRL (R$)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'hcat_v1_kto',
    name: 'KTO',
    code: 'kto',
    active: true,
    cloneGroup: 'KTO',
    category: 'Nacional (.bet.br)',
    verificationPolicy: 'Facial semanal + saque',
    defaultMinStake: 20,
    withdrawLeadTime: 'PIX Imediato',
    notes: 'Exige facial semanal das parcerias.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      rede_cripto_preferencial: 'PIX Nacional · Saldo em BRL (R$)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'hcat_v1_estrelabet',
    name: 'Estrelabet',
    code: 'estrelabet',
    active: true,
    cloneGroup: 'KTO',
    category: 'Nacional (.bet.br)',
    verificationPolicy: 'Facial no saque',
    defaultMinStake: 20,
    withdrawLeadTime: 'PIX Imediato',
    notes: 'Mesma plataforma KTO.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      rede_cripto_preferencial: 'PIX Nacional · Saldo em BRL (R$)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'hcat_v1_superbet',
    name: 'Superbet',
    code: 'superbet',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Nacional (.bet.br)',
    verificationPolicy: 'Facial no login e saque',
    defaultMinStake: 20,
    withdrawLeadTime: 'PIX Imediato',
    notes: 'Boa cobertura pré-jogo e live.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      rede_cripto_preferencial: 'PIX Nacional · Saldo em BRL (R$)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'hcat_v1_sportingbet',
    name: 'Sportingbet',
    code: 'sportingbet',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Nacional (.bet.br)',
    verificationPolicy: 'Facial no saque',
    defaultMinStake: 20,
    withdrawLeadTime: 'PIX Até 2h',
    notes: 'Tradicional nacional.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      rede_cripto_preferencial: 'PIX Nacional · Saldo em BRL (R$)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'hcat_v1_blaze',
    name: 'Blaze',
    code: 'blaze',
    active: true,
    cloneGroup: 'Blaze',
    category: 'Nacional / Clone Blaze',
    verificationPolicy: 'KYC + Facial no saque',
    defaultMinStake: 20,
    withdrawLeadTime: 'PIX Até 1h',
    notes: 'Matriz grupo Blaze.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      rede_cripto_preferencial: 'PIX Nacional · Saldo em BRL (R$)',
    },
    updatedAt: '11/10/2026 09:00',
  },
];

export const CLASSIC_V1_BANK_CATALOG: BankCatalogItem[] = [
  {
    id: 'bcat_v1_inter',
    name: 'Inter',
    code: 'inter',
    compeCode: '077',
    active: true,
    accountType: 'Conta Digital PF (PIX)',
    pixKeyTypes: 'CPF, E-mail, Celular, Aleatória',
    dailyPixLimit: 30000,
    transferFeeDefault: 0,
    devicePolicy: 'App instalado no celular da parceria (A14 / A22 / A31)',
    notes: 'Banco principal para recebimento de saques PIX das casas nacionais.',
    customValues: {
      rede_padrao_wallet: 'PIX Nacional (BRL)',
      fluxo_envio_cripto: 'Banco Nacional (PIX CPF / E-mail / Celular — Operação Híbrida)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'bcat_v1_pgbank',
    name: 'PGBank',
    code: 'pgbank',
    compeCode: '380',
    active: true,
    accountType: 'Conta Digital PF / Pagamentos',
    pixKeyTypes: 'CPF, E-mail, Aleatória',
    dailyPixLimit: 25000,
    transferFeeDefault: 0,
    devicePolicy: 'App no celular da parceria',
    notes: 'Segundo banco padrão nas parcerias.',
    customValues: {
      rede_padrao_wallet: 'PIX Nacional (BRL)',
      fluxo_envio_cripto: 'Banco Nacional (PIX CPF / E-mail / Celular — Operação Híbrida)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'bcat_v1_nubank',
    name: 'Nubank',
    code: 'nubank',
    compeCode: '260',
    active: true,
    accountType: 'Conta Digital PF (PIX)',
    pixKeyTypes: 'CPF, E-mail, Celular, Aleatória',
    dailyPixLimit: 25000,
    transferFeeDefault: 0,
    devicePolicy: 'Reconhecimento facial do titular no aparelho',
    notes: 'Banco digital complementar.',
    customValues: {
      rede_padrao_wallet: 'PIX Nacional (BRL)',
      fluxo_envio_cripto: 'Banco Nacional (PIX CPF / E-mail / Celular — Operação Híbrida)',
    },
    updatedAt: '11/10/2026 09:00',
  },
  {
    id: 'bcat_v1_c6',
    name: 'C6 Bank',
    code: 'c6_bank',
    compeCode: '336',
    active: true,
    accountType: 'Conta Digital PF (PIX)',
    pixKeyTypes: 'CPF, E-mail, Celular',
    dailyPixLimit: 20000,
    transferFeeDefault: 0,
    devicePolicy: 'App no celular da parceria',
    notes: 'Conta digital de apoio.',
    customValues: {
      rede_padrao_wallet: 'PIX Nacional (BRL)',
      fluxo_envio_cripto: 'Banco Nacional (PIX CPF / E-mail / Celular — Operação Híbrida)',
    },
    updatedAt: '11/10/2026 09:00',
  },
];

export function buildVersionPresetData(versionId: AppSystemVersionId): {
  metadata: SystemVersionMetadata;
  houseCatalog: HouseCatalogItem[];
  bankCatalog: BankCatalogItem[];
  customCriteria: CatalogCustomCriterion[];
  partnerships: Partnership[];
  bankAccounts: BankAccount[];
  houseAccounts: HouseAccount[];
} {
  const metadata =
    SYSTEM_VERSIONS.find((v) => v.id === versionId) || SYSTEM_VERSIONS[0];

  if (versionId === 'v1_bancos_pix') {
    const v1Banks: BankAccount[] = [
      {
        id: 'bank_inter_maria',
        partnershipId: 'parc_maria',
        bankName: 'Inter',
        label: 'Inter · Maria',
        status: 'ativo',
        phoneDevice: 'A22',
        login: '000.000.000-00',
        passwordSecret: 'Inter@Maria2026',
        pixKey: 'exemplo.operacao@gmail.com',
        balance: 6000,
        informedRealBalance: 6000,
        lastReconciledAt: '11/10/2026 09:30',
        authorizedOperatorIds: ['op_a'],
      },
      {
        id: 'bank_pg_maria',
        partnershipId: 'parc_maria',
        bankName: 'PGBank',
        label: 'PGBank · Maria',
        status: 'ativo',
        phoneDevice: 'A31',
        login: '000.000.000-00',
        passwordSecret: 'PG#Maria99',
        pixKey: '000.000.000-00',
        balance: 0,
        informedRealBalance: 0,
        lastReconciledAt: '11/10/2026 09:30',
        authorizedOperatorIds: ['op_a'],
      },
      {
        id: 'bank_pg_joao',
        partnershipId: 'parc_joao',
        bankName: 'PGBank',
        label: 'PGBank · João',
        status: 'ativo',
        phoneDevice: 'A22',
        login: '111.222.333-44',
        passwordSecret: 'PG@Joao2026',
        pixKey: 'joao.operacao@gmail.com',
        balance: 3200,
        informedRealBalance: null,
        lastReconciledAt: null,
        authorizedOperatorIds: ['op_a'],
      },
      {
        id: 'bank_inter_carlos',
        partnershipId: 'parc_carlos',
        bankName: 'Inter',
        label: 'Inter · Carlos',
        status: 'ativo',
        phoneDevice: 'A31',
        login: '222.333.444-55',
        passwordSecret: 'Inter@Carlos88',
        pixKey: 'carlos.operacao@gmail.com',
        balance: 2250,
        informedRealBalance: 0,
        lastReconciledAt: '11/10/2026 10:00',
        authorizedOperatorIds: ['op_a'],
      },
      {
        id: 'bank_inter_ana',
        partnershipId: 'parc_ana',
        bankName: 'Inter',
        label: 'Inter · Ana',
        status: 'ativo',
        phoneDevice: 'A54',
        login: '333.444.555-66',
        passwordSecret: 'Inter@Ana77',
        pixKey: 'ana.operacao@gmail.com',
        balance: 1800,
        informedRealBalance: 1800,
        lastReconciledAt: '11/10/2026 08:40',
        authorizedOperatorIds: ['op_b'],
      },
      {
        id: 'bank_enigma',
        partnershipId: null,
        bankName: 'Caixa Enigma',
        label: 'Caixa Geral Enigma (PIX)',
        status: 'ativo',
        phoneDevice: 'Central',
        login: 'enigma.tesouraria',
        passwordSecret: 'Enigma#2026',
        pixKey: 'financeiro@enigma.com',
        balance: 18940,
        informedRealBalance: 18940,
        lastReconciledAt: '11/10/2026 09:00',
        authorizedOperatorIds: ['admin'],
      },
    ];

    const v1Houses: HouseAccount[] = INITIAL_HOUSE_ACCOUNTS.map((acc) => {
      if (acc.id === 'acc_bet365_maria') {
        return { ...acc, houseName: 'Bet365', label: 'Bet365 · Maria', accountCurrency: 'BRL', notes: 'pediu selfie hoje' };
      }
      if (acc.id === 'acc_kto_maria') {
        return { ...acc, houseName: 'KTO', cloneGroup: 'KTO', label: 'KTO · Maria', accountCurrency: 'BRL', notes: 'facial semanal vence amanhã' };
      }
      if (acc.id === 'acc_blaze_maria') {
        return { ...acc, houseName: 'Blaze', cloneGroup: 'Blaze', label: 'Blaze · Maria', accountCurrency: 'BRL', notes: 'sacar saldo restante' };
      }
      if (acc.id === 'acc_betnacional_maria') {
        return { ...acc, houseName: 'Betnacional', cloneGroup: 'Sem clones', label: 'Betnacional · Maria', accountCurrency: 'BRL', notes: 'Depósito pretendido R$ 1.500,00' };
      }
      return { ...acc, accountCurrency: 'BRL' };
    });

    const v1Partnerships: Partnership[] = INITIAL_PARTNERSHIPS.map((p) => {
      if (p.id === 'parc_maria') {
        return {
          ...p,
          pixWithdrawals: 'exemplo.operacao@gmail.com (Inter, PGBank)',
          pixPayments: '000.000.000-00',
          notes: 'Parceria titular A (Bancos PIX & Casas Nacionais).',
        };
      }
      return p;
    });

    return {
      metadata,
      houseCatalog: CLASSIC_V1_HOUSE_CATALOG,
      bankCatalog: CLASSIC_V1_BANK_CATALOG,
      customCriteria: INITIAL_CUSTOM_CRITERIA,
      partnerships: v1Partnerships,
      bankAccounts: v1Banks,
      houseAccounts: v1Houses,
    };
  }

  if (versionId === 'v1_5_hibrido') {
    // Combina catálogo Cripto Offshore + catálogo Clássico de Bancos PIX e Casas Nacionais
    const mergedHouses = [
      ...INITIAL_HOUSE_CATALOG,
      ...CLASSIC_V1_HOUSE_CATALOG.filter(
        (ch) => !INITIAL_HOUSE_CATALOG.some((ih) => ih.code === ch.code)
      ),
    ];
    const mergedBanks = [
      ...INITIAL_BANK_CATALOG,
      ...CLASSIC_V1_BANK_CATALOG.filter(
        (cb) => !INITIAL_BANK_CATALOG.some((ib) => ib.code === cb.code)
      ),
    ];

    const hybridBanks: BankAccount[] = [
      ...INITIAL_BANK_ACCOUNTS,
      {
        id: 'bank_inter_hibrido_maria',
        partnershipId: 'parc_maria',
        bankName: 'Inter',
        label: 'Banco Inter (PIX R$) · Maria',
        status: 'ativo',
        phoneDevice: 'A22 (App Inter PIX)',
        login: '000.000.000-00',
        passwordSecret: 'Inter@Maria2026',
        pixKey: 'exemplo.operacao@gmail.com (PIX)',
        balance: 2500,
        informedRealBalance: 2500,
        lastReconciledAt: '03/11/2026 22:00',
        authorizedOperatorIds: ['op_a'],
      },
      {
        id: 'bank_pg_hibrido_joao',
        partnershipId: 'parc_joao',
        bankName: 'PGBank',
        label: 'PGBank (PIX R$) · João',
        status: 'ativo',
        phoneDevice: 'A22 (App PGBank)',
        login: '111.222.333-44',
        passwordSecret: 'PG@Joao2026',
        pixKey: 'joao.operacao@gmail.com (PIX)',
        balance: 1800,
        informedRealBalance: 1800,
        lastReconciledAt: '03/11/2026 22:00',
        authorizedOperatorIds: ['op_a'],
      },
    ];

    return {
      metadata,
      houseCatalog: mergedHouses,
      bankCatalog: mergedBanks,
      customCriteria: INITIAL_CUSTOM_CRITERIA,
      partnerships: INITIAL_PARTNERSHIPS,
      bankAccounts: hybridBanks,
      houseAccounts: INITIAL_HOUSE_ACCOUNTS,
    };
  }

  // Default: 'v2_cripto_offshore'
  return {
    metadata,
    houseCatalog: INITIAL_HOUSE_CATALOG,
    bankCatalog: INITIAL_BANK_CATALOG,
    customCriteria: INITIAL_CUSTOM_CRITERIA,
    partnerships: INITIAL_PARTNERSHIPS,
    bankAccounts: INITIAL_BANK_ACCOUNTS,
    houseAccounts: INITIAL_HOUSE_ACCOUNTS,
  };
}

