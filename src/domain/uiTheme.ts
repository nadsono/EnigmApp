import type { HouseAccountStatus, LegResult, OperationType } from './types.ts';

export interface AppearancePreferences {
  theme: 'system' | 'light' | 'dark';
  density: 'comfortable' | 'compact';
  houseColors: 'discreet' | 'brand';
}

export const DEFAULT_APPEARANCE: Readonly<AppearancePreferences> = Object.freeze({
  theme: 'system',
  density: 'comfortable',
  houseColors: 'discreet',
});

/** Invalid or future values fall back individually, without discarding valid choices. */
export function normalizeAppearancePreferences(value: unknown): AppearancePreferences {
  const candidate = value && typeof value === 'object'
    ? value as Partial<AppearancePreferences>
    : {};
  return {
    theme: candidate.theme === 'light' || candidate.theme === 'dark' ? candidate.theme : 'system',
    density: candidate.density === 'compact' ? 'compact' : 'comfortable',
    houseColors: candidate.houseColors === 'brand' ? 'brand' : 'discreet',
  };
}

export function parseAppearancePreferences(serialized: string | null): AppearancePreferences {
  try {
    const envelope: unknown = serialized ? JSON.parse(serialized) : null;
    if (!envelope || typeof envelope !== 'object' || !('version' in envelope)
      || envelope.version !== 1 || !('preferences' in envelope)) {
      return { ...DEFAULT_APPEARANCE };
    }
    return normalizeAppearancePreferences(envelope.preferences);
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function appearanceStorageKey(authenticatedUserId: string | null): string {
  return authenticatedUserId === null
    ? 'enigma.appearance.v1.anonymous'
    : `enigma.appearance.v1.user.${encodeURIComponent(authenticatedUserId)}`;
}

export function serializeAppearancePreferences(preferences: AppearancePreferences): string {
  return JSON.stringify({ version: 1, preferences: normalizeAppearancePreferences(preferences) });
}

export interface HouseColorTheme {
  primary: string;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  ring: string;
}

export interface HouseColorSuggestion {
  id: string;
  name: string;
  description: string;
  hex: string;
  theme: HouseColorTheme;
}

export const CLONE_PRESETS: string[] = [
  'Sem clones',
  'Blaze',
  'Estrela',
  '7k',
  'Vbet',
  'AsianConnect',
  'KTO',
  'BetNacional',
  'Superbet',
];

const HOUSE_COLOR_PALETTES: HouseColorSuggestion[] = [
  {
    id: 'pinnacle_orange',
    name: 'Laranja Pinnacle',
    description: 'Pinnacle, AsianConnect, Casas Sharp',
    hex: '#EA580C',
    theme: {
      primary: '#EA580C',
      bg: '#FFF7ED',
      border: '#FED7AA',
      text: '#C2410C',
      badgeBg: '#FFEDD5',
      badgeText: '#9A3412',
      ring: 'rgba(234, 88, 12, 0.25)',
    },
  },
  {
    id: 'bcgame_emerald',
    name: 'Verde BC.Game',
    description: 'BC.Game, Cripto Offshore, Bet365',
    hex: '#16A34A',
    theme: {
      primary: '#16A34A',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#15803D',
      badgeBg: '#DCFCE7',
      badgeText: '#166534',
      ring: 'rgba(22, 163, 74, 0.25)',
    },
  },
  {
    id: 'blaze_red',
    name: 'Vermelho Blaze',
    description: 'Blaze, Clones Blaze, Bet25',
    hex: '#DC2626',
    theme: {
      primary: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#B91C1C',
      badgeBg: '#FEE2E2',
      badgeText: '#991B1B',
      ring: 'rgba(220, 38, 38, 0.25)',
    },
  },
  {
    id: 'estrela_gold',
    name: 'Dourado Estrela',
    description: 'EstrelaBet, BetNacional, Clones Estrela',
    hex: '#CA8A04',
    theme: {
      primary: '#CA8A04',
      bg: '#FEFCE8',
      border: '#FEF08A',
      text: '#A16207',
      badgeBg: '#FEF9C3',
      badgeText: '#854D0E',
      ring: 'rgba(202, 138, 4, 0.25)',
    },
  },
  {
    id: '7k_indigo',
    name: 'Roxo / Índigo 7k',
    description: '7kBet, Jonbet, Clones 7k',
    hex: '#6366F1',
    theme: {
      primary: '#6366F1',
      bg: '#EEF2FF',
      border: '#C7D2FE',
      text: '#4338CA',
      badgeBg: '#E0E7FF',
      badgeText: '#3730A3',
      ring: 'rgba(99, 102, 241, 0.25)',
    },
  },
  {
    id: 'vbet_magenta',
    name: 'Magenta Vbet',
    description: 'Vbet, Bwin, Clones Vbet',
    hex: '#DB2777',
    theme: {
      primary: '#DB2777',
      bg: '#FDF2F8',
      border: '#FBCFE8',
      text: '#BE185D',
      badgeBg: '#FCE7F3',
      badgeText: '#9D174D',
      ring: 'rgba(219, 39, 119, 0.25)',
    },
  },
  {
    id: 'cloudbet_blue',
    name: 'Azul Cloudbet',
    description: 'Cloudbet, Betfair, Overtime',
    hex: '#2563EB',
    theme: {
      primary: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1D4ED8',
      badgeBg: '#DBEAFE',
      badgeText: '#1E40AF',
      ring: 'rgba(37, 99, 235, 0.25)',
    },
  },
  {
    id: 'betfury_coral',
    name: 'Coral BetFury',
    description: 'BetFury, Roobet, Cripto',
    hex: '#E11D48',
    theme: {
      primary: '#E11D48',
      bg: '#FFF1F2',
      border: '#FECDD3',
      text: '#BE123C',
      badgeBg: '#FFE4E6',
      badgeText: '#9F1239',
      ring: 'rgba(225, 29, 72, 0.25)',
    },
  },
  {
    id: 'thunderpick_teal',
    name: 'Turquesa Thunderpick',
    description: 'Thunderpick, AsianBroker',
    hex: '#0D9488',
    theme: {
      primary: '#0D9488',
      bg: '#F0FDFA',
      border: '#99F6E4',
      text: '#0F766E',
      badgeBg: '#CCFBF1',
      badgeText: '#115E59',
      ring: 'rgba(13, 148, 136, 0.25)',
    },
  },
  {
    id: 'sportsbet_cyan',
    name: 'Ciano Sportsbet.io',
    description: 'Sportsbet.io, KTO',
    hex: '#0891B2',
    theme: {
      primary: '#0891B2',
      bg: '#ECFEFF',
      border: '#A5F3FC',
      text: '#0E7490',
      badgeBg: '#CFFAFE',
      badgeText: '#155E75',
      ring: 'rgba(8, 145, 178, 0.25)',
    },
  },
  {
    id: 'duel_violet',
    name: 'Violeta Duel / Duelbits',
    description: 'Duelbits, Duel.com, Sumsub',
    hex: '#7C3AED',
    theme: {
      primary: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      text: '#6D28D9',
      badgeBg: '#EDE9FE',
      badgeText: '#5B21B6',
      ring: 'rgba(124, 58, 237, 0.25)',
    },
  },
  {
    id: 'neutral_slate',
    name: 'Grafite Neutro',
    description: 'Casas sem identidade ou padrão',
    hex: '#475569',
    theme: {
      primary: '#475569',
      bg: '#F8FAFC',
      border: '#CBD5E1',
      text: '#334155',
      badgeBg: '#E2E8F0',
      badgeText: '#1E293B',
      ring: 'rgba(71, 85, 105, 0.25)',
    },
  },
];

/** Keep the editable HEX intact; presentation follows theme and personal intensity. */
function adaptHousePalette(palette: HouseColorTheme): HouseColorTheme {
  const color = palette.primary;
  return {
    primary: color,
    bg: `color-mix(in srgb, ${color} var(--house-surface-strength, 5%), var(--surface, #FFFFFF))`,
    border: `color-mix(in srgb, ${color} var(--house-border-strength, 24%), var(--border, #CBD6D1))`,
    text: `color-mix(in srgb, ${color} var(--house-text-strength, 26%), var(--house-ink, #1B2421))`,
    badgeBg: `color-mix(in srgb, ${color} var(--house-badge-strength, 11%), var(--surface, #FFFFFF))`,
    badgeText: `color-mix(in srgb, ${color} var(--house-text-strength, 26%), var(--house-ink, #1B2421))`,
    ring: `color-mix(in srgb, ${color} 30%, transparent)`,
  };
}

export const HOUSE_COLOR_SUGGESTIONS: HouseColorSuggestion[] = HOUSE_COLOR_PALETTES.map(
  (suggestion) => ({ ...suggestion, theme: adaptHousePalette(suggestion.theme) })
);

/**
 * Converte qualquer HEX em um tema de cores leves (bg, border, text)
 */
function buildLightPaletteFromHex(hex: string): HouseColorTheme {
  let clean = hex.replace('#', '').trim();
  if (/^[a-f\d]{3}$/i.test(clean)) clean = [...clean].map((digit) => digit + digit).join('');
  if (!/^[a-f\d]{6}$/i.test(clean)) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'neutral_slate')!.theme;
  }
  return adaptHousePalette({
    ...HOUSE_COLOR_PALETTES.find((s) => s.id === 'neutral_slate')!.theme,
    primary: `#${clean}`,
  });
}

/**
 * Sugestão visual local por nome ou cor customizada, sem verificação de identidade oficial.
 * Grupo de clone é mantido na assinatura por compatibilidade; não define identidade visual.
 */
export function getHouseColorTheme(
  houseName: string,
  cloneGroup?: string,
  customColorHex?: string
): HouseColorTheme {
  if (customColorHex && customColorHex.startsWith('#')) {
    // Procura na paleta de sugestões
    const match = HOUSE_COLOR_SUGGESTIONS.find(
      (s) => s.hex.toLowerCase() === customColorHex.toLowerCase()
    );
    if (match) return match.theme;
    return buildLightPaletteFromHex(customColorHex);
  }

  const name = (houseName || '').toLowerCase().trim();

  // 1. Pinnacle / AsianConnect
  if (name.includes('pinnacle') || name.includes('asianconnect')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'pinnacle_orange')!.theme;
  }

  // 2. BC.Game / Bet365
  if (name.includes('bc.game') || name.includes('bcgame') || name.includes('bet365')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'bcgame_emerald')!.theme;
  }

  // 3. BetFury
  if (name.includes('betfury')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'betfury_coral')!.theme;
  }

  // 4. FortuneJack
  if (name.includes('fortunejack')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'fortunejack_gold')
      ?.theme || HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'estrela_gold')!.theme;
  }

  // 5. Duel / Duelbits
  if (name.includes('duel')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'duel_violet')!.theme;
  }

  // 6. Sportsbet.io
  if (name.includes('sportsbet') || name.includes('sbotop')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'sportsbet_cyan')!.theme;
  }

  // 7. Cloudbet / Overtime / Betfair
  if (name.includes('cloudbet') || name.includes('overtime') || name.includes('betfair')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'cloudbet_blue')!.theme;
  }

  // 8. Thunderpick
  if (name.includes('thunderpick')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'thunderpick_teal')!.theme;
  }

  // 9. Clones Estrela
  if (name.includes('estrela') || name.includes('betnacional')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'estrela_gold')!.theme;
  }

  // 10. Clones 7k
  if (name.includes('7k') || name.includes('jonbet')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === '7k_indigo')!.theme;
  }

  // 11. Clones Vbet
  if (name.includes('vbet') || name.includes('bwin')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'vbet_magenta')!.theme;
  }

  // 12. Clones Blaze gerais
  if (name.includes('blaze') || name.includes('bet25')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'blaze_red')!.theme;
  }

  // 13. KTO
  if (name.includes('kto')) {
    return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'blaze_red')!.theme;
  }

  // A casa desconhecida não recebe uma identidade de marca por semelhança.
  return HOUSE_COLOR_SUGGESTIONS.find((s) => s.id === 'neutral_slate')!.theme;
}

/**
 * Cores leves para status operacionais de contas
 */
export function getHouseAccountStatusTheme(status: HouseAccountStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dotColor: string;
} {
  switch (status) {
    case 'pronta':
      return {
        label: 'Pronta',
        bg: 'bg-[#ECFDF5]',
        text: 'text-[#065F46]',
        border: 'border-[#A7F3D0]',
        dotColor: '#10B981',
      };
    case 'em_uso':
      return {
        label: 'Em uso',
        bg: 'bg-[#EFF6FF]',
        text: 'text-[#1E40AF]',
        border: 'border-[#BFDBFE]',
        dotColor: '#3B82F6',
      };
    case 'limitada':
      return {
        label: 'Limitada',
        bg: 'bg-[#FEF2F2]',
        text: 'text-[#991B1B]',
        border: 'border-[#FECACA]',
        dotColor: '#EF4444',
      };
    case 'verificar':
      return {
        label: 'Verificar',
        bg: 'bg-[#EEF2FF]',
        text: 'text-[#4338CA]',
        border: 'border-[#C7D2FE]',
        dotColor: '#6366F1',
      };
    case 'aguardando_saque':
      return {
        label: 'Aguardando saque',
        bg: 'bg-[#FFFBEB]',
        text: 'text-[#92400E]',
        border: 'border-[#FDE68A]',
        dotColor: '#F59E0B',
      };
    case 'aguardando_deposito':
      return {
        label: 'Aguardando depósito',
        bg: 'bg-[#FFF7ED]',
        text: 'text-[#9A3412]',
        border: 'border-[#FED7AA]',
        dotColor: '#F97316',
      };
    case 'em_conferencia':
      return {
        label: 'Em conferência',
        bg: 'bg-[#F0FDFA]',
        text: 'text-[#115E59]',
        border: 'border-[#99F6E4]',
        dotColor: '#14B8A6',
      };
    default:
      return {
        label: String(status),
        bg: 'bg-[#F8FAFC]',
        text: 'text-[#334155]',
        border: 'border-[#CBD5E1]',
        dotColor: '#64748B',
      };
  }
}

/**
 * Cores leves para tipos de operação e suas etapas
 */
export function getOperationTypeTheme(opType: OperationType): {
  activeClass: string;
  inactiveClass: string;
} {
  switch (opType) {
    case 'ao_vivo':
      return {
        activeClass: 'bg-[#ECFDF5] text-[#065F46] border-[#10B981] font-bold shadow-xs',
        inactiveClass: 'text-[#94A3B8] hover:text-white',
      };
    case 'pre_jogo':
      return {
        activeClass: 'bg-[#EFF6FF] text-[#1E40AF] border-[#3B82F6] font-bold shadow-xs',
        inactiveClass: 'text-[#94A3B8] hover:text-white',
      };
    case 'cashout':
      return {
        activeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#F59E0B] font-bold shadow-xs',
        inactiveClass: 'text-[#94A3B8] hover:text-white',
      };
    case 'bonus':
      return {
        activeClass: 'bg-[#F5F3FF] text-[#5B21B6] border-[#8B5CF6] font-bold shadow-xs',
        inactiveClass: 'text-[#94A3B8] hover:text-white',
      };
    case 'delay':
      return {
        activeClass: 'bg-[#FFF7ED] text-[#9A3412] border-[#F97316] font-bold shadow-xs',
        inactiveClass: 'text-[#94A3B8] hover:text-white',
      };
    case 'extracao':
      return {
        activeClass: 'bg-[#F0FDFA] text-[#115E59] border-[#14B8A6] font-bold shadow-xs',
        inactiveClass: 'text-[#94A3B8] hover:text-white',
      };
    default:
      return {
        activeClass: 'bg-white text-[#0F6B5C] border-[#0F6B5C] font-bold',
        inactiveClass: 'text-[#94A3B8] hover:text-white',
      };
  }
}

/**
 * Cores leves para resultado de pernas (Green, Red, Void, Cashout, Pendente)
 */
export function getLegResultTheme(result: LegResult): {
  label: string;
  badgeClass: string;
  borderClass: string;
  dotColor: string;
} {
  switch (result) {
    case 'green':
      return {
        label: 'GREEN',
        badgeClass: 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
        borderClass: 'border-l-4 border-l-[#10B981]',
        dotColor: '#10B981',
      };
    case 'red':
      return {
        label: 'RED',
        badgeClass: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]',
        borderClass: 'border-l-4 border-l-[#EF4444]',
        dotColor: '#EF4444',
      };
    case 'void':
      return {
        label: 'VOID',
        badgeClass: 'bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1]',
        borderClass: 'border-l-4 border-l-[#64748B]',
        dotColor: '#64748B',
      };
    case 'cashout':
      return {
        label: 'CASH',
        badgeClass: 'bg-[#F0FDFA] text-[#115E59] border border-[#99F6E4]',
        borderClass: 'border-l-4 border-l-[#14B8A6]',
        dotColor: '#14B8A6',
      };
    case 'pendente':
    default:
      return {
        label: 'PEND',
        badgeClass: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
        borderClass: 'border-l-4 border-l-[#F59E0B]',
        dotColor: '#F59E0B',
      };
  }
}

