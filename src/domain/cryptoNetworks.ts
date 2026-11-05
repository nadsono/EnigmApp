/** Workspace-local catalog. A listed network does not establish support at either endpoint. */
export interface CryptoNetwork {
  id: string;
  name: string;
  tokenStandard?: string;
  active: boolean;
}

/** Historical selection only; this is not a transfer instruction or an asset contract. */
export interface CryptoRouteMetadata {
  networkId: string | null;
  networkName: string;
  tokenStandard?: string;
  assetSymbol?: string;
  compatibility: 'unknown' | 'confirmed_manually';
  compatibilityCheckedAt?: string;
}

export const CRYPTO_NETWORKS_STORAGE_KEY = 'enigma-crypto-networks:v1';

export const INITIAL_CRYPTO_NETWORKS: readonly CryptoNetwork[] = [
  { id: 'ethereum', name: 'Ethereum', tokenStandard: 'ERC20', active: true },
  { id: 'bnb-smart-chain', name: 'BNB Smart Chain', tokenStandard: 'BEP20', active: true },
  { id: 'polygon', name: 'Polygon', active: true },
  { id: 'avalanche', name: 'Avalanche', active: true },
  { id: 'arbitrum', name: 'Arbitrum', active: true },
  { id: 'optimism', name: 'Optimism', active: true },
  { id: 'tron', name: 'Tron', tokenStandard: 'TRC20', active: true },
];

const copyInitialCatalog = () => INITIAL_CRYPTO_NETWORKS.map((network) => ({ ...network }));
const normalized = (value: string) => value.trim().toLocaleLowerCase('pt-BR');

export function serializeCryptoNetworkCatalog(networks: readonly CryptoNetwork[]): string {
  return JSON.stringify({ version: 1, networks });
}

export function parseCryptoNetworkCatalog(raw: string | null): { networks: CryptoNetwork[]; issue: string | null } {
  if (raw === null) return { networks: copyInitialCatalog(), issue: null };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== 1 ||
      !('networks' in parsed) || !Array.isArray(parsed.networks)) throw new Error('Invalid catalog');
    const ids = new Set<string>();
    const names = new Set<string>();
    const networks = parsed.networks.map((item: unknown): CryptoNetwork => {
      if (!item || typeof item !== 'object' ||
        !('id' in item) || typeof item.id !== 'string' || !item.id.trim() ||
        !('name' in item) || typeof item.name !== 'string' || !item.name.trim() ||
        !('active' in item) || typeof item.active !== 'boolean' ||
        ('tokenStandard' in item && typeof item.tokenStandard !== 'string')) throw new Error('Invalid network');
      const id = item.id.trim();
      const name = item.name.trim();
      if (ids.has(id) || names.has(normalized(name))) throw new Error('Duplicate network');
      ids.add(id);
      names.add(normalized(name));
      return {
        id, name, active: item.active,
        ...('tokenStandard' in item && typeof item.tokenStandard === 'string' && item.tokenStandard.trim() ? { tokenStandard: item.tokenStandard.trim() } : {}),
      };
    });
    return { networks, issue: null };
  } catch {
    return { networks: copyInitialCatalog(), issue: 'Não foi possível ler o catálogo salvo. As redes iniciais estão disponíveis; o conteúdo salvo só será substituído ao salvar uma alteração.' };
  }
}

export function addCryptoNetwork(
  networks: readonly CryptoNetwork[],
  input: { name: string; tokenStandard?: string },
  id: string,
): { networks: CryptoNetwork[]; error: string | null } {
  const name = input.name.trim();
  if (!name || !id.trim()) return { networks: [...networks], error: 'Informe o nome da rede.' };
  if (networks.some((network) => normalized(network.name) === normalized(name) || network.id === id)) {
    return { networks: [...networks], error: 'Esta rede já está no catálogo. Reative-a se estiver inativa.' };
  }
  const tokenStandard = input.tokenStandard?.trim();
  return { networks: [...networks, { id, name, active: true, ...(tokenStandard ? { tokenStandard } : {}) }], error: null };
}

export function toggleCryptoNetwork(networks: readonly CryptoNetwork[], id: string): CryptoNetwork[] {
  return networks.map((network) => network.id === id ? { ...network, active: !network.active } : network);
}

export function persistCryptoNetworkCatalog(
  storage: Pick<Storage, 'setItem'>,
  networks: readonly CryptoNetwork[],
): string | null {
  try {
    storage.setItem(CRYPTO_NETWORKS_STORAGE_KEY, serializeCryptoNetworkCatalog(networks));
    return null;
  } catch {
    return 'O navegador não permitiu salvar o catálogo. A alteração não foi aplicada.';
  }
}

export function getCryptoNetworkOptions(networks: readonly CryptoNetwork[], selectedValue: string) {
  const options = [
    { value: '', label: 'Sem rede informada / não se aplica', legacy: false, inactive: false },
    ...networks.filter((network) => network.active || network.name === selectedValue).map((network) => ({
      value: network.name,
      label: `${network.name}${network.tokenStandard ? ` · ${network.tokenStandard}` : ''}${network.active ? '' : ' · inativa (preservada)'}`,
      legacy: false,
      inactive: !network.active,
    })),
  ];
  if (selectedValue && !options.some((option) => option.value === selectedValue)) {
    options.push({ value: selectedValue, label: `${selectedValue} · legado / fora do catálogo`, legacy: true, inactive: false });
  }
  return options;
}

export function buildCryptoRouteMetadata(
  networks: readonly CryptoNetwork[],
  selectedNetwork: string,
  assetSymbol: string,
  confirmedManually: boolean,
  checkedAt = new Date().toISOString(),
): CryptoRouteMetadata | undefined {
  if (!selectedNetwork.trim()) return undefined;
  const network = networks.find((item) => item.name === selectedNetwork);
  return {
    networkId: network?.id ?? null,
    networkName: selectedNetwork,
    ...(network?.tokenStandard ? { tokenStandard: network.tokenStandard } : {}),
    ...(assetSymbol.trim() ? { assetSymbol: assetSymbol.trim().toUpperCase() } : {}),
    compatibility: confirmedManually ? 'confirmed_manually' : 'unknown',
    ...(confirmedManually ? { compatibilityCheckedAt: checkedAt } : {}),
  };
}
