import React from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useAppearance } from '../context/AppearanceContext.tsx';
import { getHouseColorTheme, type AppearancePreferences } from '../domain/uiTheme.ts';

const THEMES = [
  { value: 'system', label: 'Sistema', description: 'Acompanha o seu dispositivo', Icon: Monitor },
  { value: 'light', label: 'Claro', description: 'Superfícies claras do Enigma', Icon: Sun },
  { value: 'dark', label: 'Escuro', description: 'Tons escuros e contraste suave', Icon: Moon },
] as const;

export const AppearanceSettings: React.FC = () => {
  const { preferences, resolvedTheme, persistenceWarning, setPreferences, resetPreferences } = useAppearance();
  const houseTheme = getHouseColorTheme('Casa de exemplo', undefined, '#2563EB');

  return (
    <section className="appearance-settings" aria-labelledby="appearance-heading">
      <div className="appearance-settings__heading">
        <div>
          <h2 id="appearance-heading">Aparência</h2>
          <p>Personalize a aparência para a sua conta neste navegador.</p>
        </div>
        <button type="button" className="appearance-reset" onClick={resetPreferences}>
          Restaurar aparência padrão
        </button>
      </div>
      {persistenceWarning && <p role="status" className="appearance-help">O navegador não permitiu salvar. Estas escolhas valem apenas durante esta sessão.</p>}

      <fieldset className="appearance-fieldset">
        <legend>Tema</legend>
        <div className="appearance-theme-options">
          {THEMES.map(({ value, label, description, Icon }) => (
            <label key={value} className="appearance-option" data-selected={preferences.theme === value}>
              <input type="radio" name="appearance-theme" value={value} checked={preferences.theme === value}
                onChange={() => setPreferences({ theme: value })} />
              <Icon size={18} aria-hidden="true" />
              <span><strong>{label}</strong><small>{description}</small></span>
              {preferences.theme === value && <Check size={15} aria-hidden="true" />}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="appearance-settings__details">
        <div className="appearance-settings__controls">
          <fieldset className="appearance-fieldset">
            <legend>Densidade</legend>
            <div className="appearance-segment">
              {([{ value: 'comfortable', label: 'Confortável' }, { value: 'compact', label: 'Compacta' }] as const)
                .map(({ value, label }) => <AppearanceChoice key={value} group="density" value={value} label={label}
                  checked={preferences.density === value} onChange={() => setPreferences({ density: value })} />)}
            </div>
            <p className="appearance-help">Ajusta os espaços das tabelas e dos formulários.</p>
          </fieldset>
          <fieldset className="appearance-fieldset">
            <legend>Cores das casas</legend>
            <div className="appearance-segment">
              {([{ value: 'discreet', label: 'Discretas' }, { value: 'brand', label: 'Mais presentes' }] as const)
                .map(({ value, label }) => <AppearanceChoice key={value} group="houseColors" value={value} label={label}
                  checked={preferences.houseColors === value} onChange={() => setPreferences({ houseColors: value })} />)}
            </div>
            <p className="appearance-help">Muda a intensidade das cores escolhidas para as casas.</p>
          </fieldset>
        </div>

        <div className="appearance-preview" aria-label="Prévia da aparência">
          <div className="appearance-preview__heading"><strong>Prévia</strong><span>{resolvedTheme === 'dark' ? 'Escuro' : 'Claro'} · {preferences.density === 'compact' ? 'Compacta' : 'Confortável'}</span></div>
          <div className="appearance-preview__row">
            <span style={{ backgroundColor: houseTheme.bg, borderColor: houseTheme.border, color: houseTheme.text }} className="appearance-house-badge">
              <span style={{ backgroundColor: houseTheme.primary }} /> Casa de exemplo
            </span>
            <span className="appearance-status"><Check size={12} aria-hidden="true" /> Concluída</span>
          </div>
          <div className="appearance-preview__row"><span>Resultado de exemplo</span><strong className="appearance-positive">+ R$ 120,00</strong></div>
          <p className="appearance-help">Exemplo ilustrativo · As alterações são aplicadas na hora.</p>
        </div>
      </div>
    </section>
  );
};

function AppearanceChoice({ group, value, label, checked, onChange }: {
  group: keyof Pick<AppearancePreferences, 'density' | 'houseColors'>;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return <label className="appearance-segment__option" data-selected={checked}>
    <input type="radio" name={`appearance-${group}`} value={value} checked={checked} onChange={onChange} />
    <span>{label}</span>
  </label>;
}
