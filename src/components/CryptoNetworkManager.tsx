import React, { useId, useMemo, useState, useSyncExternalStore } from 'react';
import {
  CRYPTO_NETWORKS_STORAGE_KEY,
  addCryptoNetwork,
  getCryptoNetworkOptions,
  parseCryptoNetworkCatalog,
  persistCryptoNetworkCatalog,
  toggleCryptoNetwork,
  type CryptoNetwork,
  type CryptoRouteMetadata,
} from '../domain/cryptoNetworks.ts';

const changedEvent = 'enigma-crypto-networks-changed';
const unavailableStorage = '__storage_unavailable__';
const getSnapshot = () => {
  try { return window.localStorage.getItem(CRYPTO_NETWORKS_STORAGE_KEY); }
  catch { return unavailableStorage; }
};
const subscribe = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CRYPTO_NETWORKS_STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(changedEvent, callback);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(changedEvent, callback);
  };
};

export function useCryptoNetworks() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const parsed = useMemo(() => parseCryptoNetworkCatalog(raw), [raw]);
  const saveNetworks = (networks: readonly CryptoNetwork[]): string | null => {
    try {
      const error = persistCryptoNetworkCatalog(window.localStorage, networks);
      if (!error) window.dispatchEvent(new Event(changedEvent));
      return error;
    } catch {
      return 'O navegador não permitiu salvar o catálogo. A alteração não foi aplicada.';
    }
  };
  return {
    networks: parsed.networks,
    issue: raw === unavailableStorage ? 'O navegador não permitiu ler o catálogo local. As redes iniciais estão disponíveis.' : parsed.issue,
    saveNetworks,
  };
}

type NetworkSelectProps = {
  networks: readonly CryptoNetwork[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  'aria-label'?: string;
  className?: string;
};

export const CryptoNetworkSelect: React.FC<NetworkSelectProps> = ({ networks, value, onChange, ...props }) => (
  <select {...props} value={value} onChange={(event) => onChange(event.target.value)}>
    {getCryptoNetworkOptions(networks, value).map((option) => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

export const CryptoRouteFields: React.FC<{
  networks: readonly CryptoNetwork[];
  selectedNetwork: string;
  onNetworkChange: (value: string) => void;
  assetSymbol: string;
  onAssetChange: (value: string) => void;
  confirmed: boolean;
  onConfirmedChange: (value: boolean) => void;
}> = ({ networks, selectedNetwork, onNetworkChange, assetSymbol, onAssetChange, confirmed, onConfirmedChange }) => {
  const id = useId();
  return (
    <div className="border border-[#DCE3DF] bg-[#F7F9F8] rounded-[10px] p-[12px] flex flex-col gap-[10px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
        <label htmlFor={`${id}-network`} className="flex flex-col gap-[5px] text-[12px] text-[#4F5E57] font-medium">
          Rede desta operação (opcional)
          <CryptoNetworkSelect id={`${id}-network`} networks={networks} value={selectedNetwork} onChange={onNetworkChange} className="p-[9px_10px] border border-[#CBD2CD] rounded-[8px] bg-white text-[13px]" />
        </label>
        <label htmlFor={`${id}-asset`} className="flex flex-col gap-[5px] text-[12px] text-[#4F5E57] font-medium">
          Ativo transferido (opcional)
          <input id={`${id}-asset`} value={assetSymbol} onChange={(event) => onAssetChange(event.target.value)} placeholder="Ex.: USDT, USDC" maxLength={24} disabled={!selectedNetwork} className="p-[9px_10px] border border-[#CBD2CD] rounded-[8px] bg-white text-[13px] disabled:opacity-60" />
        </label>
      </div>
      {selectedNetwork ? (
        <label className="flex gap-[8px] items-start text-[12px] text-[#4F5E57]">
          <input type="checkbox" checked={confirmed} onChange={(event) => onConfirmedChange(event.target.checked)} className="mt-[2px] accent-[#0F6B5C]" />
          Conferi manualmente o ativo e a rede {selectedNetwork} na origem e no destino, incluindo endereço e memo/tag quando exigido.
        </label>
      ) : null}
      <p className="m-0 text-[11px] text-[#66716C]">
        {selectedNetwork ? (confirmed ? 'Compatibilidade conferida manualmente para este registro.' : 'Compatibilidade desconhecida: a escolha no catálogo não confirma suporte nos dois extremos.') : 'Nenhuma rede será atribuída automaticamente. Para operações cripto, selecione a rede efetivamente usada.'}{' '}
        O Enigma registra a operação localmente; nenhum envio é realizado aqui.
      </p>
    </div>
  );
};

export const CryptoRouteSummary: React.FC<{ route?: CryptoRouteMetadata }> = ({ route }) => (
  <div className="text-[11px] text-[#66716C] mt-[4px]">
    {route ? `${route.assetSymbol ? `${route.assetSymbol} · ` : ''}${route.networkName} · ${route.compatibility === 'confirmed_manually' ? 'conferida manualmente' : 'compatibilidade desconhecida'}` : 'Rede não registrada'}
    {route?.compatibilityCheckedAt ? ` · ${new Date(route.compatibilityCheckedAt).toLocaleString('pt-BR')}` : ''}
  </div>
);

export const CryptoNetworkManager: React.FC = () => {
  const { networks, issue, saveNetworks } = useCryptoNetworks();
  const [name, setName] = useState('');
  const [tokenStandard, setTokenStandard] = useState('');
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const id = useId();
  const save = (nextNetworks: CryptoNetwork[]) => {
    const error = saveNetworks(nextNetworks);
    setFeedback({ error: Boolean(error), text: error || 'Catálogo salvo neste navegador.' });
    return !error;
  };
  return (
    <section aria-labelledby={`${id}-title`} className="bg-white border border-[#DCE3DF] rounded-[12px] p-[18px] flex flex-col gap-[14px]">
      <div>
        <h2 id={`${id}-title`} className="m-0 text-[16px] font-bold text-[#1B2421]">Redes cripto</h2>
        <p className="m-0 mt-[4px] text-[12px] text-[#5E6B65]">Catálogo local deste espaço de trabalho. Ativar uma rede a disponibiliza nos formulários; confirme a compatibilidade na origem e no destino a cada operação. Registros anteriores mantêm sua rede ao desativá-la.</p>
      </div>
      {issue && <p role="alert" className="m-0 text-[12px] text-[#8A5A10]">{issue}</p>}
      <form onSubmit={(event) => {
        event.preventDefault();
        const result = addCryptoNetwork(networks, { name, tokenStandard }, `custom_${crypto.randomUUID()}`);
        if (result.error) { setFeedback({ error: true, text: result.error }); return; }
        if (save(result.networks)) { setName(''); setTokenStandard(''); }
      }} className="flex flex-wrap items-end gap-[10px]">
        <label htmlFor={`${id}-name`} className="flex-1 min-w-[180px] flex flex-col gap-[5px] text-[12px] font-medium text-[#4F5E57]">
          Nome da rede
          <input id={`${id}-name`} required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: uma rede usada na operação" className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]" />
        </label>
        <label htmlFor={`${id}-standard`} className="flex-1 min-w-[180px] flex flex-col gap-[5px] text-[12px] font-medium text-[#4F5E57]">
          Padrão de token (opcional, informação manual)
          <input id={`${id}-standard`} maxLength={80} value={tokenStandard} onChange={(event) => setTokenStandard(event.target.value)} placeholder="Quando aplicável" className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]" />
        </label>
        <button type="submit" className="px-[14px] py-[9px] rounded-[8px] bg-[#0F6B5C] text-white text-[12px] font-semibold cursor-pointer">Cadastrar rede</button>
      </form>
      {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`m-0 text-[12px] ${feedback.error ? 'text-[#9E3324]' : 'text-[#0F6B5C]'}`}>{feedback.text}</p>}
      <ul className="list-none p-0 m-0 divide-y divide-[#E5EBE7]">
        {networks.map((network) => (
          <li key={network.id} className="flex flex-wrap items-center justify-between gap-[10px] py-[9px] text-[13px]">
            <span className="text-[#1B2421]"><b>{network.name}</b>{network.tokenStandard ? ` · ${network.tokenStandard}` : ''} <span className="text-[11px] text-[#66716C]">· {network.active ? 'Ativa no catálogo' : 'Inativa no catálogo'}</span></span>
            <button type="button" onClick={() => save(toggleCryptoNetwork(networks, network.id))} aria-label={`${network.active ? 'Desativar' : 'Ativar'} ${network.name}`} className="px-[10px] py-[6px] rounded-[7px] border border-[#C9D2CD] text-[#4F5E57] bg-white text-[12px] font-semibold cursor-pointer">{network.active ? 'Desativar' : 'Ativar'}</button>
          </li>
        ))}
      </ul>
    </section>
  );
};
