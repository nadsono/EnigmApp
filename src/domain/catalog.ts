import type {
  BankCatalogItem,
  CatalogCustomCriterion,
  CatalogEntityType,
  CatalogFieldType,
  HouseCatalogItem,
} from './types.ts';

export const INITIAL_CUSTOM_CRITERIA: CatalogCustomCriterion[] = [
  {
    id: 'crit_casa_rollover',
    target: 'casa',
    key: 'rollover_deposito',
    label: 'Rollover Obrigatório (Depósito)',
    fieldType: 'selecao',
    options: [
      'Rollover 1x (Padrão Offshore)',
      'Rollover 3x (Regra BetFury)',
      'Sem Rollover (On-Chain / Overtime)',
      'Rollover 2x / Customizado',
    ],
    defaultValue: 'Rollover 1x (Padrão Offshore)',
    description: 'Volume mínimo de giro exigido pela casa offshore sobre o depósito em USDT antes de liberar saque.',
    required: true,
    createdAt: '03/11/2026 18:00',
  },
  {
    id: 'crit_casa_kyc_offshore',
    target: 'casa',
    key: 'kyc_offshore_protocolo',
    label: 'Verificação KYC Offshore',
    fieldType: 'selecao',
    options: [
      'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      'Sumsub Automatizado (Duel.com)',
      'Vídeo Chamada Ao Vivo + Docs (Bet25.com)',
      'Pré-Live · Pede Muitas Selfies + Papel (Thunderpick)',
      'Via Broker AsianConnect (Pinnacle / SBOBET)',
      'Sem KYC · Conexão Direta MetaMask (OvertimeMarkets)',
    ],
    defaultValue:
      'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
    description:
      'Regra de documentos: RG/CNH, Selfie RG/CNH, Comprovante de Endereço (se for fake, NÃO fazer conta de luz ou água) e Selfie com papel escrito nome da casa e data.',
    required: true,
    createdAt: '03/11/2026 18:00',
  },
  {
    id: 'crit_casa_rede_cripto',
    target: 'casa',
    key: 'rede_cripto_preferencial',
    label: 'Depósito & Moeda do Saldo na Casa',
    fieldType: 'selecao',
    options: [
      'Depósito USDT (BEP20/ERC20) · Saldo na Casa em USDT',
      'Depósito USDT (BEP20/ERC20) · Saldo na Casa em EUR (€)',
      'USDT/USDC · On-Chain (Arbitrum / Optimism)',
      'PIX Nacional · Saldo em BRL (R$)',
    ],
    defaultValue: 'Depósito USDT (BEP20/ERC20) · Saldo na Casa em USDT',
    description:
      'Define a rede de depósito (USDT via BEP20 ou ERC20) e se o saldo interno da casa fica em USDT ou convertido em Euro (EUR €).',
    required: false,
    createdAt: '03/11/2026 18:00',
  },
  {
    id: 'crit_casa_risco_limitacao',
    target: 'casa',
    key: 'perfil_limitacao',
    label: 'Perfil de Mercado & Limitação',
    fieldType: 'selecao',
    options: [
      'Não Limita (OvertimeMarkets / Pinnacle AsianConnect)',
      'Exclusivo Pré-Live (Duelbits / Thunderpick)',
      'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
      'Alerta: Sem Confiança Alta (Clones Estrela)',
    ],
    defaultValue: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    description: 'Comportamento da casa quanto a limitação e foco de mercado (Pré-Live vs Live).',
    required: false,
    createdAt: '03/11/2026 18:00',
  },
  {
    id: 'crit_banco_rede_padrao',
    target: 'banco',
    key: 'rede_padrao_wallet',
    label: 'Redes Suportadas (Envio/Saque)',
    fieldType: 'selecao',
    options: [
      'BEP20 (BSC) + ERC20 (Ethereum)',
      'BEP20 (BSC - Preferencial)',
      'ERC20 (Ethereum)',
      'Multi-Chain (BEP20 / ERC20 / Arbitrum / TRC20)',
    ],
    defaultValue: 'BEP20 (BSC) + ERC20 (Ethereum)',
    description: 'Redes principais para envio e recebimento de USDT entre corretora, carteira e casa.',
    required: true,
    createdAt: '03/11/2026 18:00',
  },
  {
    id: 'crit_banco_fluxo_operacional',
    target: 'banco',
    key: 'fluxo_envio_cripto',
    label: 'Procedimento Operacional (Corretora / Carteira)',
    fieldType: 'selecao',
    options: [
      'Corretora do Operador (OKX / Binance): Depositar BRL → Comprar USDT → Ativos → Enviar → Ler QR Code → Rede BEP20/ERC20',
      'MetaMask: Carteiras Ilimitadas para Parcerias (Endereço 0x... individual)',
      'Broker AsianConnect: Liquidação em USDT (Saldo Casa em EUR € ou USDT)',
      'Cofre / Tesouraria Central USDT',
      'Banco Nacional (PIX CPF / E-mail / Celular — Operação Híbrida)',
    ],
    defaultValue:
      'Corretora do Operador (OKX / Binance): Depositar BRL → Comprar USDT → Ativos → Enviar → Ler QR Code → Rede BEP20/ERC20',
    description: 'Roteiro operacional padrão para movimentação na corretora escolhida pelo operador (OKX ou Binance) ou carteira.',
    required: false,
    createdAt: '03/11/2026 18:00',
  },
];

export const INITIAL_HOUSE_CATALOG: HouseCatalogItem[] = [
  {
    id: 'hcat_pinnacle',
    name: 'Pinnacle',
    code: 'pinnacle',
    active: true,
    cloneGroup: 'AsianConnect',
    category: 'Asiática / Broker Sharp',
    verificationPolicy: 'Via Broker AsianConnect (KYC único no broker)',
    defaultMinStake: 25,
    withdrawLeadTime: 'USDT BEP20/ERC20 (Até 1h)',
    notes: 'Operada através da AsianConnect. Referência sharp sem limitação por conta individual.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo: 'Via Broker AsianConnect (Pinnacle / SBOBET)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Não Limita (OvertimeMarkets / Pinnacle AsianConnect)',
    },
    updatedAt: '03/11/2026 18:00',
    color: '#EA580C',
  },
  {
    id: 'hcat_bcgame',
    name: 'BC.Game',
    code: 'bcgame',
    active: true,
    cloneGroup: 'Blaze',
    category: 'Offshore Cripto / Clone Blaze',
    verificationPolicy: 'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome e Data)',
    defaultMinStake: 10,
    withdrawLeadTime: 'USDT BEP20/ERC20 Imediato',
    notes: 'Clone Blaze principal (bcgame2.com). Rollover 1x sobre depósito em USDT.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo:
        'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
    color: '#16A34A',
  },
  {
    id: 'hcat_betfury',
    name: 'BetFury',
    code: 'betfury',
    active: true,
    cloneGroup: 'Blaze',
    category: 'Offshore Cripto / Clone Blaze',
    verificationPolicy: 'RG/CNH + Selfie RG/CNH + Endereço + Selfie Papel (BetFury + Data)',
    defaultMinStake: 10,
    withdrawLeadTime: 'USDT BEP20/ERC20 Imediato',
    notes: 'ATENÇÃO: Rollover 3x obrigatório sobre o depósito antes de solicitar saque em USDT.',
    customValues: {
      rollover_deposito: 'Rollover 3x (Regra BetFury)',
      kyc_offshore_protocolo:
        'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
    color: '#E11D48',
  },
  {
    id: 'hcat_fortunejack',
    name: 'FortuneJack',
    code: 'fortunejack',
    active: true,
    cloneGroup: 'Blaze',
    category: 'Offshore Cripto / Clone Blaze',
    verificationPolicy: 'RG/CNH + Selfie + Comprovante Endereço (não usar luz/água se fake) + Selfie Papel',
    defaultMinStake: 10,
    withdrawLeadTime: 'USDT BEP20/ERC20 (Até 30min)',
    notes: 'Integrante da linha Clone Blaze cripto (fortunejack.com). Rollover 1x.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo:
        'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
    color: '#D97706',
  },
  {
    id: 'hcat_duel',
    name: 'Duel',
    code: 'duel_com',
    active: true,
    cloneGroup: 'Blaze',
    category: 'Offshore Cripto / Clone Blaze',
    verificationPolicy: 'Verificação Sumsub (RG/CNH + Liveness Facial Automatizado)',
    defaultMinStake: 10,
    withdrawLeadTime: 'USDT BEP20/ERC20 Imediato',
    notes: 'Clone Blaze (duel.com) com onboarding e verificação documental/facial via Sumsub.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo: 'Sumsub Automatizado (Duel.com)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
    color: '#7C3AED',
  },
  {
    id: 'hcat_bet25',
    name: 'Bet25',
    code: 'bet25_com',
    active: true,
    cloneGroup: 'Blaze',
    category: 'Offshore Cripto / Clone Blaze',
    verificationPolicy: 'Vídeo Chamada Obrigatória + RG/CNH + Selfie Papel (Bet25 + Data)',
    defaultMinStake: 15,
    withdrawLeadTime: 'USDT BEP20/ERC20 (Após Vídeo Chamada)',
    notes: 'Clone Blaze (bet25.com) que exige verificação por Vídeo Chamada com o titular da parceria.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo: 'Vídeo Chamada Ao Vivo + Docs (Bet25.com)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
    color: '#DC2626',
  },
  {
    id: 'hcat_cloudbet',
    name: 'Cloudbet',
    code: 'cloudbet',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Offshore Cripto Consolidada',
    verificationPolicy: 'RG/CNH + Selfie RG/CNH + Endereço + Selfie Papel',
    defaultMinStake: 15,
    withdrawLeadTime: 'USDT BEP20/ERC20 Imediato',
    notes: 'Alta liquidez cripto (cloudbet.com · USDT). Rollover 1x sobre depósito.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo:
        'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
    color: '#2563EB',
  },
  {
    id: 'hcat_overtimemarkets',
    name: 'Overtime',
    code: 'overtimemarkets',
    active: true,
    cloneGroup: 'Web3 / MetaMask',
    category: 'DeFi / On-Chain (Não Limita)',
    verificationPolicy: 'Sem KYC (Conexão Direta via Carteira MetaMask)',
    defaultMinStake: 20,
    withdrawLeadTime: 'Liquidação On-Chain Automática (MetaMask)',
    notes: 'Protocolo Web3 (overtimemarkets.xyz): NÃO LIMITA stakes e opera conectado direto às carteiras MetaMask das parcerias.',
    customValues: {
      rollover_deposito: 'Sem Rollover (On-Chain / Overtime)',
      kyc_offshore_protocolo: 'Sem KYC · Conexão Direta MetaMask (OvertimeMarkets)',
      rede_cripto_preferencial: 'USDT/USDC · On-Chain (Arbitrum / Optimism)',
      perfil_limitacao: 'Não Limita (OvertimeMarkets / Pinnacle AsianConnect)',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'hcat_duelbits',
    name: 'Duelbits',
    code: 'duelbits',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Offshore Cripto (Pré-Live)',
    verificationPolicy: 'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel',
    defaultMinStake: 15,
    withdrawLeadTime: 'USDT BEP20/ERC20 Imediato',
    notes: 'Foco operacional em PRÉ-LIVE. Depósito e saque em USDT via BEP20 ou ERC20.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo:
        'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Exclusivo Pré-Live (Duelbits / Thunderpick)',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'hcat_thunderpick',
    name: 'Thunderpick',
    code: 'thunderpick',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Offshore Cripto (Pré-Live · Muitas Selfies)',
    verificationPolicy: 'Pede Muitas Selfies + Selfie Papel (Thunderpick + Data) + RG/CNH + Endereço',
    defaultMinStake: 15,
    withdrawLeadTime: 'USDT BEP20/ERC20 (Após validação de selfies)',
    notes: 'Operar em PRÉ-LIVE. Atenção: solicita muitas selfies do titular durante a verificação de saque.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo: 'Pré-Live · Pede Muitas Selfies + Papel (Thunderpick)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Exclusivo Pré-Live (Duelbits / Thunderpick)',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'hcat_betonline',
    name: 'BetOnline',
    code: 'betonline',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Offshore Internacional / Cripto',
    verificationPolicy: 'RG/CNH + Selfie + Comprovante Endereço',
    defaultMinStake: 20,
    withdrawLeadTime: 'USDT BEP20/ERC20 (Até 2h)',
    notes: 'Casa offshore tradicional com alta aceitação em USDT e Rollover 1x.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo:
        'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'hcat_sbobet',
    name: 'SBOBET',
    code: 'sbobet',
    active: true,
    cloneGroup: 'AsianConnect',
    category: 'Asiática / Offshore',
    verificationPolicy: 'Via Broker AsianConnect ou KYC Offshore Completo',
    defaultMinStake: 25,
    withdrawLeadTime: 'USDT BEP20/ERC20 (Até 2h)',
    notes: 'Casa asiática clássica para cobertura de handicap e over/under.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo: 'Via Broker AsianConnect (Pinnacle / SBOBET)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'hcat_sportsbetio',
    name: 'Sportsbet.io',
    code: 'sportsbet_io',
    active: true,
    cloneGroup: 'Sem clones',
    category: 'Offshore Cripto (sportsbet.io/pt/sports)',
    verificationPolicy: 'RG/CNH + Selfie RG/CNH + Endereço + Selfie Papel (Sportsbet.io + Data)',
    defaultMinStake: 15,
    withdrawLeadTime: 'USDT BEP20/ERC20 Imediato',
    notes: 'Acesso em sportsbet.io/pt/sports. Operação direta em USDT com saque rápido para MetaMask ou Binance.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo:
        'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Offshore Cripto Geral (Clones Blaze / Cloudbet / Sportsbet.io)',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'hcat_clones_estrela_alerta',
    name: 'Clones Estrela (Sem Confiança)',
    code: 'clones_estrela',
    active: false,
    cloneGroup: 'Estrela',
    category: 'Alerta de Risco / Clone Estrela',
    verificationPolicy: 'NÃO OPERAR — Nenhum clone Estrela de confiança alta até o momento',
    defaultMinStake: 0,
    withdrawLeadTime: 'Bloqueado por Segurança',
    notes: 'Até o momento, nenhum clone Estrela apresenta confiança alta no mercado offshore. Mantido inativo.',
    customValues: {
      rollover_deposito: 'Rollover 1x (Padrão Offshore)',
      kyc_offshore_protocolo:
        'RG/CNH + Selfie RG/CNH + Endereço (sem luz/água fake) + Selfie Papel (Nome Casa e Data)',
      rede_cripto_preferencial: 'USDT · BEP20 (BSC) ou ERC20',
      perfil_limitacao: 'Alerta: Sem Confiança Alta (Clones Estrela)',
    },
    updatedAt: '03/11/2026 18:00',
  },
];

export const INITIAL_BANK_CATALOG: BankCatalogItem[] = [
  {
    id: 'bcat_okx',
    name: 'OKX',
    code: 'okx',
    compeCode: 'CEX-OKX',
    active: true,
    accountType: 'Corretora Cripto (CEX) · Opção do Operador (USDT / QR Code)',
    pixKeyTypes: 'USDT · Redes BEP20 (BSC), ERC20, TRC20 · Leitura QR Code',
    dailyPixLimit: 50000,
    transferFeeDefault: 0.5,
    devicePolicy: 'App OKX: Ativos → Sacar/Enviar On-Chain → USDT → Ler QR Code da Casa/MetaMask → Rede BEP20 ou ERC20',
    notes: 'Corretora principal utilizada na operação (junto à Binance, conforme preferência do operador). Mesmo fluxo: Depositar BRL → Comprar USDT → Enviar via QR Code nas redes BEP20 ou ERC20.',
    customValues: {
      rede_padrao_wallet: 'BEP20 (BSC) + ERC20 (Ethereum)',
      fluxo_envio_cripto:
        'Corretora do Operador (OKX / Binance): Depositar BRL → Comprar USDT → Ativos → Enviar → Ler QR Code → Rede BEP20/ERC20',
    },
    updatedAt: '03/11/2026 22:00',
  },
  {
    id: 'bcat_binance',
    name: 'Binance',
    code: 'binance',
    compeCode: 'CEX-BIN',
    active: true,
    accountType: 'Corretora Cripto (CEX) · Opção do Operador (USDT / QR Code)',
    pixKeyTypes: 'USDT · Redes BEP20 (BSC) e ERC20 · Leitura QR Code',
    dailyPixLimit: 50000,
    transferFeeDefault: 0.8,
    devicePolicy: 'App Binance: Ativos (canto inf. direito) → Enviar → Selecionar USDT → Ler QR Code → Rede BEP20/ERC20',
    notes: 'Corretora opção do operador (OKX ou Binance). Fluxo: 1) Depositar BRL → 2) Comprar USDT → 3) Enviar USDT lendo QR Code da casa ou MetaMask nas redes BEP20 ou ERC20.',
    customValues: {
      rede_padrao_wallet: 'BEP20 (BSC) + ERC20 (Ethereum)',
      fluxo_envio_cripto:
        'Corretora do Operador (OKX / Binance): Depositar BRL → Comprar USDT → Ativos → Enviar → Ler QR Code → Rede BEP20/ERC20',
    },
    updatedAt: '03/11/2026 22:00',
  },
  {
    id: 'bcat_metamask',
    name: 'MetaMask',
    code: 'metamask',
    compeCode: 'WEB3-MM',
    active: true,
    accountType: 'Carteira Web3 Descentralizada (Carteiras Ilimitadas p/ Parcerias)',
    pixKeyTypes: 'Endereço 0x... · Redes BEP20 (BSC), ERC20, Arbitrum, Optimism',
    dailyPixLimit: 100000,
    transferFeeDefault: 0.15,
    devicePolicy: 'Extensão / App MetaMask com geração ilimitada de subcarteiras por parceria',
    notes: 'Para parcerias: permite criar carteiras ilimitadas (endereços 0x... independentes) para isolar depósitos/saques de cada titular e conectar na OvertimeMarkets.xyz.',
    customValues: {
      rede_padrao_wallet: 'BEP20 (BSC) + ERC20 (Ethereum)',
      fluxo_envio_cripto: 'MetaMask: Carteiras Ilimitadas para Parcerias (Endereço 0x... individual)',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'bcat_asianconnect',
    name: 'AsianConnect',
    code: 'asianconnect',
    compeCode: 'BRK-AC',
    active: true,
    accountType: 'Broker Asiático (Pinnacle / SBOBET)',
    pixKeyTypes: 'USDT · Redes BEP20 (BSC), ERC20 e TRC20',
    dailyPixLimit: 80000,
    transferFeeDefault: 0,
    devicePolicy: 'Painel Web / Suporte Verificado AsianConnect',
    notes: 'Intermediador oficial para operar Pinnacle e SBOBET em USDT.',
    customValues: {
      rede_padrao_wallet: 'BEP20 (BSC) + ERC20 (Ethereum)',
      fluxo_envio_cripto: 'Broker AsianConnect: Liquidação Direta em USDT para Pinnacle/SBOBET',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'bcat_enigma',
    name: 'Tesouraria Cripto Enigma',
    code: 'tesouraria_enigma',
    compeCode: 'VAULT',
    active: true,
    accountType: 'Cofre Central / Tesouraria USDT',
    pixKeyTypes: 'USDT Multi-Rede (BEP20 / ERC20 / Arbitrum)',
    dailyPixLimit: 250000,
    transferFeeDefault: 0,
    devicePolicy: 'Custódia Central Administrativa (Multisig / Hardware Wallet)',
    notes: 'Carteira centralizadora da tesouraria Enigma para abastecimento de Binance e subcarteiras MetaMask.',
    customValues: {
      rede_padrao_wallet: 'Multi-Chain (BEP20 / ERC20 / Arbitrum / TRC20)',
      fluxo_envio_cripto: 'Cofre / Tesouraria Central USDT',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'bcat_bybit',
    name: 'Bybit',
    code: 'bybit',
    compeCode: 'CEX-BYB',
    active: true,
    accountType: 'Corretora Cripto (CEX) Secundária',
    pixKeyTypes: 'USDT · Redes BEP20 (BSC), ERC20, Arbitrum · QR Code',
    dailyPixLimit: 50000,
    transferFeeDefault: 0.5,
    devicePolicy: 'App Bybit com 2FA para conversão BRL ⇄ USDT e envio rápido',
    notes: 'Corretora alternativa à Binance para on-ramp/off-ramp de BRL para USDT.',
    customValues: {
      rede_padrao_wallet: 'BEP20 (BSC) + ERC20 (Ethereum)',
      fluxo_envio_cripto:
        'Binance: Depositar BRL → Comprar USDT → Ativos (inf. direito) → Enviar → Ler QR Code → Rede BEP20/ERC20',
    },
    updatedAt: '03/11/2026 18:00',
  },
  {
    id: 'bcat_trustwallet',
    name: 'Trust Wallet',
    code: 'trust_wallet',
    compeCode: 'WEB3-TW',
    active: true,
    accountType: 'Carteira Web3 Multi-Chain (Estoque / Parcerias)',
    pixKeyTypes: 'Endereço 0x... · Redes BEP20 (BSC) e ERC20',
    dailyPixLimit: 50000,
    transferFeeDefault: 0.2,
    devicePolicy: 'App Mobile instalado nos aparelhos das parcerias',
    notes: 'Carteira descentralizada complementar à MetaMask para parcerias em estoque.',
    customValues: {
      rede_padrao_wallet: 'BEP20 (BSC) + ERC20 (Ethereum)',
      fluxo_envio_cripto: 'MetaMask: Carteiras Ilimitadas para Parcerias (Endereço 0x... individual)',
    },
    updatedAt: '03/11/2026 18:00',
  },
];

export function slugifyCatalogCode(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getActiveHouseNames(houses: HouseCatalogItem[]): string[] {
  const cleanName = (raw: string) =>
    raw
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/Overtime Markets/i, 'Overtime')
      .replace(/\.com|\.xyz/gi, '')
      .trim();
  const active = houses.filter((h) => h.active).map((h) => cleanName(h.name));
  return active.length > 0 ? active : houses.map((h) => cleanName(h.name));
}

export function getActiveBankNames(banks: BankCatalogItem[]): string[] {
  const active = banks.filter((b) => b.active).map((b) => b.name);
  return active.length > 0 ? active : banks.map((b) => b.name);
}

export interface UpsertHouseCatalogInput {
  id?: string;
  name: string;
  cloneGroup?: string;
  category?: string;
  verificationPolicy?: string;
  defaultMinStake?: number;
  withdrawLeadTime?: string;
  active?: boolean;
  notes?: string;
  customValues?: Record<string, string>;
  color?: string;
}

export function upsertHouseCatalogItemPure(
  houses: HouseCatalogItem[],
  input: UpsertHouseCatalogInput,
  nowText = '11/10/2026 12:00'
): {
  ok: boolean;
  message: string;
  houses: HouseCatalogItem[];
  item?: HouseCatalogItem;
} {
  const cleanName = input.name.trim();
  if (!cleanName || cleanName.length < 2) {
    return {
      ok: false,
      message: 'Informe o nome da casa de apostas (mínimo de 2 caracteres).',
      houses,
    };
  }

  const code = slugifyCatalogCode(cleanName);
  const duplicate = houses.find(
    (h) =>
      h.id !== input.id &&
      (h.name.trim().toLowerCase() === cleanName.toLowerCase() || h.code === code)
  );

  if (duplicate) {
    return {
      ok: false,
      message: `A casa "${duplicate.name}" já está cadastrada no catálogo.`,
      houses,
    };
  }

  if (input.id) {
    const existing = houses.find((h) => h.id === input.id);
    if (!existing) {
      return {
        ok: false,
        message: 'Casa não encontrada no catálogo para edição.',
        houses,
      };
    }

    const updated: HouseCatalogItem = {
      ...existing,
      name: cleanName,
      code,
      cloneGroup: input.cloneGroup?.trim() || existing.cloneGroup || 'Sem clones',
      category: input.category?.trim() || existing.category || 'Nacional',
      verificationPolicy:
        input.verificationPolicy?.trim() || existing.verificationPolicy || 'Facial no saque',
      defaultMinStake:
        input.defaultMinStake !== undefined
          ? Math.max(0, Number(input.defaultMinStake) || 0)
          : existing.defaultMinStake,
      withdrawLeadTime:
        input.withdrawLeadTime?.trim() || existing.withdrawLeadTime || 'PIX Imediato',
      active: input.active !== undefined ? input.active : existing.active,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      customValues: input.customValues
        ? { ...existing.customValues, ...input.customValues }
        : existing.customValues,
      updatedAt: nowText,
    };

    return {
      ok: true,
      message: `Configurações da casa "${updated.name}" atualizadas no catálogo.`,
      houses: houses.map((h) => (h.id === input.id ? updated : h)),
      item: updated,
    };
  }

  const newItem: HouseCatalogItem = {
    id: `hcat_${code}_${Date.now().toString(36).slice(-4)}`,
    name: cleanName,
    code,
    active: input.active ?? true,
    cloneGroup: input.cloneGroup?.trim() || 'Sem clones',
    category: input.category?.trim() || 'Nacional',
    verificationPolicy: input.verificationPolicy?.trim() || 'Facial no saque',
    defaultMinStake: Math.max(0, Number(input.defaultMinStake) || 10),
    withdrawLeadTime: input.withdrawLeadTime?.trim() || 'PIX Imediato',
    notes: input.notes?.trim() || '',
    customValues: { ...(input.customValues || {}) },
    updatedAt: nowText,
  };

  return {
    ok: true,
    message: `Casa "${newItem.name}" adicionada ao catálogo operacional!`,
    houses: [...houses, newItem],
    item: newItem,
  };
}

export function toggleHouseCatalogActivePure(
  houses: HouseCatalogItem[],
  houseId: string,
  nowText = '11/10/2026 12:05'
): {
  ok: boolean;
  message: string;
  houses: HouseCatalogItem[];
  item?: HouseCatalogItem;
} {
  const target = houses.find((h) => h.id === houseId);
  if (!target) {
    return { ok: false, message: 'Casa não localizada no catálogo.', houses };
  }

  const activeCount = houses.filter((h) => h.active).length;
  if (target.active && activeCount <= 1) {
    return {
      ok: false,
      message: 'Mantenha ao menos uma casa ativa no catálogo operacional.',
      houses,
    };
  }

  const updated: HouseCatalogItem = {
    ...target,
    active: !target.active,
    updatedAt: nowText,
  };

  return {
    ok: true,
    message: updated.active
      ? `Casa "${updated.name}" reativada nos seletores operacionais.`
      : `Casa "${updated.name}" retirada dos seletores de novas operações (histórico preservado).`,
    houses: houses.map((h) => (h.id === houseId ? updated : h)),
    item: updated,
  };
}

export function removeHouseCatalogItemPure(
  houses: HouseCatalogItem[],
  houseId: string
): {
  ok: boolean;
  message: string;
  houses: HouseCatalogItem[];
} {
  const target = houses.find((h) => h.id === houseId);
  if (!target) {
    return { ok: false, message: 'Casa não encontrada no catálogo.', houses };
  }
  if (houses.length <= 1) {
    return {
      ok: false,
      message: 'Não é possível remover a última casa do catálogo.',
      houses,
    };
  }

  return {
    ok: true,
    message: `Casa "${target.name}" removida do catálogo.`,
    houses: houses.filter((h) => h.id !== houseId),
  };
}

export interface UpsertBankCatalogInput {
  id?: string;
  name: string;
  compeCode?: string;
  accountType?: string;
  pixKeyTypes?: string;
  dailyPixLimit?: number;
  transferFeeDefault?: number;
  devicePolicy?: string;
  active?: boolean;
  notes?: string;
  customValues?: Record<string, string>;
}

export function upsertBankCatalogItemPure(
  banks: BankCatalogItem[],
  input: UpsertBankCatalogInput,
  nowText = '11/10/2026 12:00'
): {
  ok: boolean;
  message: string;
  banks: BankCatalogItem[];
  item?: BankCatalogItem;
} {
  const cleanName = input.name.trim();
  if (!cleanName || cleanName.length < 2) {
    return {
      ok: false,
      message: 'Informe o nome do banco ou instituição (mínimo de 2 caracteres).',
      banks,
    };
  }

  const code = slugifyCatalogCode(cleanName);
  const duplicate = banks.find(
    (b) =>
      b.id !== input.id &&
      (b.name.trim().toLowerCase() === cleanName.toLowerCase() || b.code === code)
  );

  if (duplicate) {
    return {
      ok: false,
      message: `O banco "${duplicate.name}" já está cadastrado no catálogo.`,
      banks,
    };
  }

  if (input.id) {
    const existing = banks.find((b) => b.id === input.id);
    if (!existing) {
      return {
        ok: false,
        message: 'Banco não encontrado no catálogo para edição.',
        banks,
      };
    }

    const updated: BankCatalogItem = {
      ...existing,
      name: cleanName,
      code,
      compeCode: input.compeCode?.trim() || existing.compeCode || '000',
      accountType: input.accountType?.trim() || existing.accountType || 'Conta Digital PF',
      pixKeyTypes:
        input.pixKeyTypes?.trim() || existing.pixKeyTypes || 'CPF, E-mail, Celular, Aleatória',
      dailyPixLimit:
        input.dailyPixLimit !== undefined
          ? Math.max(0, Number(input.dailyPixLimit) || 0)
          : existing.dailyPixLimit,
      transferFeeDefault:
        input.transferFeeDefault !== undefined
          ? Math.max(0, Number(input.transferFeeDefault) || 0)
          : existing.transferFeeDefault,
      devicePolicy:
        input.devicePolicy?.trim() || existing.devicePolicy || 'App no celular da parceria',
      active: input.active !== undefined ? input.active : existing.active,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      customValues: input.customValues
        ? { ...existing.customValues, ...input.customValues }
        : existing.customValues,
      updatedAt: nowText,
    };

    return {
      ok: true,
      message: `Configurações do banco "${updated.name}" atualizadas no catálogo.`,
      banks: banks.map((b) => (b.id === input.id ? updated : b)),
      item: updated,
    };
  }

  const newItem: BankCatalogItem = {
    id: `bcat_${code}_${Date.now().toString(36).slice(-4)}`,
    name: cleanName,
    code,
    compeCode: input.compeCode?.trim() || '000',
    active: input.active ?? true,
    accountType: input.accountType?.trim() || 'Conta Digital PF',
    pixKeyTypes: input.pixKeyTypes?.trim() || 'CPF, E-mail, Celular, Aleatória',
    dailyPixLimit: Math.max(0, Number(input.dailyPixLimit) || 20000),
    transferFeeDefault: Math.max(0, Number(input.transferFeeDefault) || 0),
    devicePolicy: input.devicePolicy?.trim() || 'App no celular da parceria',
    notes: input.notes?.trim() || '',
    customValues: { ...(input.customValues || {}) },
    updatedAt: nowText,
  };

  return {
    ok: true,
    message: `Banco "${newItem.name}" adicionado ao catálogo operacional!`,
    banks: [...banks, newItem],
    item: newItem,
  };
}

export function toggleBankCatalogActivePure(
  banks: BankCatalogItem[],
  bankId: string,
  nowText = '11/10/2026 12:05'
): {
  ok: boolean;
  message: string;
  banks: BankCatalogItem[];
  item?: BankCatalogItem;
} {
  const target = banks.find((b) => b.id === bankId);
  if (!target) {
    return { ok: false, message: 'Banco não localizado no catálogo.', banks };
  }

  const activeCount = banks.filter((b) => b.active).length;
  if (target.active && activeCount <= 1) {
    return {
      ok: false,
      message: 'Mantenha ao menos um banco ativo no catálogo operacional.',
      banks,
    };
  }

  const updated: BankCatalogItem = {
    ...target,
    active: !target.active,
    updatedAt: nowText,
  };

  return {
    ok: true,
    message: updated.active
      ? `Banco "${updated.name}" reativado nos seletores operacionais.`
      : `Banco "${updated.name}" retirado dos seletores de novas contas (histórico preservado).`,
    banks: banks.map((b) => (b.id === bankId ? updated : b)),
    item: updated,
  };
}

export function removeBankCatalogItemPure(
  banks: BankCatalogItem[],
  bankId: string
): {
  ok: boolean;
  message: string;
  banks: BankCatalogItem[];
} {
  const target = banks.find((b) => b.id === bankId);
  if (!target) {
    return { ok: false, message: 'Banco não encontrado no catálogo.', banks };
  }
  if (banks.length <= 1) {
    return {
      ok: false,
      message: 'Não é possível remover o último banco do catálogo.',
      banks,
    };
  }

  return {
    ok: true,
    message: `Banco "${target.name}" removido do catálogo.`,
    banks: banks.filter((b) => b.id !== bankId),
  };
}

export interface AddCatalogCriterionInput {
  target: CatalogEntityType;
  label: string;
  key?: string;
  fieldType: CatalogFieldType;
  options?: string[];
  defaultValue?: string;
  description?: string;
  required?: boolean;
}

export function addCatalogCriterionPure(
  criteria: CatalogCustomCriterion[],
  houses: HouseCatalogItem[],
  banks: BankCatalogItem[],
  input: AddCatalogCriterionInput,
  nowText = '11/10/2026 12:10'
): {
  ok: boolean;
  message: string;
  criteria: CatalogCustomCriterion[];
  houses: HouseCatalogItem[];
  banks: BankCatalogItem[];
  criterion?: CatalogCustomCriterion;
} {
  const cleanLabel = input.label.trim();
  if (!cleanLabel || cleanLabel.length < 2) {
    return {
      ok: false,
      message: 'Informe o nome do novo critério adicional (mínimo de 2 caracteres).',
      criteria,
      houses,
      banks,
    };
  }

  const key = slugifyCatalogCode(input.key?.trim() || cleanLabel);
  if (!key) {
    return {
      ok: false,
      message: 'Não foi possível gerar uma chave técnica válida para este critério.',
      criteria,
      houses,
      banks,
    };
  }

  const duplicate = criteria.find(
    (c) =>
      c.target === input.target &&
      (c.key === key || c.label.toLowerCase() === cleanLabel.toLowerCase())
  );

  if (duplicate) {
    return {
      ok: false,
      message: `Já existe o critério "${duplicate.label}" configurado para ${
        input.target === 'casa' ? 'Casas' : 'Bancos'
      }.`,
      criteria,
      houses,
      banks,
    };
  }

  const cleanedOptions =
    input.fieldType === 'selecao'
      ? (input.options || [])
          .map((o) => o.trim())
          .filter(Boolean)
      : undefined;

  const resolvedDefault =
    input.defaultValue?.trim() ||
    (cleanedOptions && cleanedOptions.length > 0 ? cleanedOptions[0] : '');

  const newCriterion: CatalogCustomCriterion = {
    id: `crit_${input.target}_${key}_${Date.now().toString(36).slice(-3)}`,
    target: input.target,
    key,
    label: cleanLabel,
    fieldType: input.fieldType,
    options: cleanedOptions,
    defaultValue: resolvedDefault,
    description: input.description?.trim() || '',
    required: Boolean(input.required),
    createdAt: nowText,
  };

  const nextHouses =
    input.target === 'casa'
      ? houses.map((h) => ({
          ...h,
          customValues: {
            ...h.customValues,
            [key]: h.customValues[key] ?? resolvedDefault,
          },
        }))
      : houses;

  const nextBanks =
    input.target === 'banco'
      ? banks.map((b) => ({
          ...b,
          customValues: {
            ...b.customValues,
            [key]: b.customValues[key] ?? resolvedDefault,
          },
        }))
      : banks;

  return {
    ok: true,
    message: `Novo critério "${newCriterion.label}" criado para ${
      input.target === 'casa' ? 'Casas de Apostas' : 'Bancos'
    } e propagado para o esquema do banco de dados.`,
    criteria: [...criteria, newCriterion],
    houses: nextHouses,
    banks: nextBanks,
    criterion: newCriterion,
  };
}

export function deleteCatalogCriterionPure(
  criteria: CatalogCustomCriterion[],
  criterionId: string
): {
  ok: boolean;
  message: string;
  criteria: CatalogCustomCriterion[];
} {
  const target = criteria.find((c) => c.id === criterionId);
  if (!target) {
    return { ok: false, message: 'Critério adicional não encontrado.', criteria };
  }

  return {
    ok: true,
    message: `Critério "${target.label}" removido da estrutura de ${
      target.target === 'casa' ? 'Casas' : 'Bancos'
    }.`,
    criteria: criteria.filter((c) => c.id !== criterionId),
  };
}
