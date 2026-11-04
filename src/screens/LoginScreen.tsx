import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Layers,
  PieChart,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import { EnigmaHexLogoIcon } from '../components/SidebarNav.tsx';
import { SocialProofShowcase } from '../components/SocialProofShowcase.tsx';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials, registerUserRequest } = useEnigma();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [authError, setAuthError] = useState<{
    reason?: string;
    message: string;
  } | null>(null);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regShortName, setRegShortName] = useState('');
  const [regLogin, setRegLogin] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNotes, setRegNotes] = useState('');
  const [regFeedback, setRegFeedback] = useState<{
    ok: boolean;
    message: string;
    registeredLogin?: string;
  } | null>(null);

  // Estado interativo leve para o "Spoiler" na rolagem (sem dados sensíveis)
  const [previewCapitalTab, setPreviewCapitalTab] = useState<'resumo' | 'frentes'>('resumo');
  const [previewSimPreset, setPreviewSimPreset] = useState<'padrao' | 'protegida'>('padrao');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = loginWithCredentials(identifier, password);
    if (!res.ok) {
      setAuthError({ reason: res.reason, message: res.message });
    }
  };

  const handleQuickFill = (loginVal: string, passVal: string, autoSubmit = false) => {
    setMode('login');
    setAuthError(null);
    setIdentifier(loginVal);
    setPassword(passVal);
    if (autoSubmit) {
      const res = loginWithCredentials(loginVal, passVal);
      if (!res.ok) {
        setAuthError({ reason: res.reason, message: res.message });
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegFeedback(null);
    const derivedLogin =
      regLogin.trim() ||
      regEmail
        .trim()
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '');

    const res = registerUserRequest({
      name: regName,
      shortName: regShortName || regName.split(' ')[0] || 'Operador',
      login: derivedLogin,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      registrationNotes: regNotes,
      requestedRole: 'operador',
    });

    if (res.ok) {
      setRegFeedback({
        ok: true,
        message: res.message,
        registeredLogin: res.targetUser?.email || res.targetUser?.login,
      });
      setRegName('');
      setRegShortName('');
      setRegLogin('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegNotes('');
    } else {
      setRegFeedback({
        ok: false,
        message: res.message,
      });
    }
  };

  const scrollToSpoiler = () => {
    const el = document.getElementById('enigma-spoiler-tour');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F8F7] text-[#111815] flex flex-col justify-between select-none sm:select-auto">
      {/* Faixa superior de continuidade com a Topbar interna do app */}
      <div className="w-full h-[5px] bg-[#111815]" />

      {/* Header Fixo no Topo */}
      <header className="w-full sticky top-0 z-30 bg-[#F7F8F7]/95 backdrop-blur-md border-b border-[#E4EAE7]">
        <div className="w-full max-w-[1320px] mx-auto px-[24px] sm:px-[48px] py-[16px] flex items-center justify-between">
          <div className="flex items-center gap-[12px]">
            <div className="w-[34px] h-[34px] flex items-center justify-center text-[#0D6E57]">
              <EnigmaHexLogoIcon className="w-[28px] h-[28px]" strokeColor="#0D6E57" />
            </div>
            <div className="flex flex-col">
              <div className="text-[18px] font-extrabold tracking-[-0.02em] leading-none text-[#111815]">
                ENIGMA<span className="text-[#0D6E57]">.</span>
              </div>
              <div className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-[#78837E] mt-[4px]">
                GRUPO · GESTÃO DE OPERAÇÕES
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[12px]">
            <button
              type="button"
              onClick={scrollToSpoiler}
              className="hidden sm:inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-[#354640] hover:text-[#0D6E57] py-[6px] px-[12px] rounded-[8px] border border-[#DCE4E0] bg-white hover:bg-[#EDF3F0] cursor-pointer"
            >
              <span>Conhecer por dentro</span>
              <ArrowDown className="w-[13px] h-[13px] text-[#0D6E57]" strokeWidth={2} />
            </button>

            <div className="relative">
              <button
                type="button"
                data-testid="login-team-env-btn"
                onClick={() => setShowQuickAccess((prev) => !prev)}
                className="inline-flex items-center gap-[7px] text-[12.5px] font-medium text-[#57635E] hover:text-[#0D6E57] transition-colors cursor-pointer py-[6px] px-[10px] rounded-[8px] hover:bg-[#ECEFEE]"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0D6E57"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Ambiente da equipe</span>
              </button>

              {showQuickAccess && (
                <div className="absolute right-0 mt-[8px] w-[310px] bg-white border border-[#DCE2DF] rounded-[12px] shadow-lg p-[14px] z-40 flex flex-col gap-[8px]">
                  <div className="flex items-center justify-between border-b border-[#EEF1EF] pb-[6px]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0D6E57]">
                      Acesso Rápido (Ambiente da Equipe)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQuickAccess(false)}
                      className="text-[12px] text-[#6E7873] hover:text-[#111815] cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickFill('admin@enigma.com', 'admin123');
                      setShowQuickAccess(false);
                    }}
                    className="text-left p-[8px_10px] rounded-[8px] bg-[#F4F7F6] hover:bg-[#E4EFEA] transition-colors cursor-pointer"
                  >
                    <div className="text-[12px] font-semibold text-[#111815]">
                      Administrador Geral
                    </div>
                    <div className="text-[11px] text-[#5E6B65] tabular-nums">
                      admin@enigma.com · Senha: admin123
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickFill('operador.a@enigma.com', 'op123');
                      setShowQuickAccess(false);
                    }}
                    className="text-left p-[8px_10px] rounded-[8px] bg-[#F4F7F6] hover:bg-[#E4EFEA] transition-colors cursor-pointer"
                  >
                    <div className="text-[12px] font-semibold text-[#111815]">
                      Operador A (Matheus)
                    </div>
                    <div className="text-[11px] text-[#5E6B65] tabular-nums">
                      operador.a@enigma.com · Senha: op123
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickFill('operador.b@enigma.com', 'op123');
                      setShowQuickAccess(false);
                    }}
                    className="text-left p-[8px_10px] rounded-[8px] bg-[#F4F7F6] hover:bg-[#E4EFEA] transition-colors cursor-pointer"
                  >
                    <div className="text-[12px] font-semibold text-[#111815]">
                      Operador B (Gabriel)
                    </div>
                    <div className="text-[11px] text-[#5E6B65] tabular-nums">
                      operador.b@enigma.com · Senha: op123
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Container Principal com Scroll Contínuo à Esquerda e Card de Login Travado (Sticky) à Direita */}
      <main className="w-full max-w-[1260px] mx-auto px-[24px] sm:px-[48px] pt-[36px] pb-[72px] flex-1">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-[44px] lg:gap-[40px] items-start">
          {/* COLUNA ESQUERDA: Hero + Slogan + Tour Visual ("Spoiler" de Funcionalidades em Scroll) */}
          <div className="lg:col-span-7 flex flex-col gap-[64px]">
            {/* DOBRA 1: Mensagem Editorial + Slogan "Cadê o dinheiro que estava aqui?" */}
            <div className="min-h-[calc(100vh-220px)] flex flex-col justify-center items-start py-[12px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0D6E57] mb-[16px]">
                ENIGMA GRUPO
              </span>

              <h1 className="text-[40px] sm:text-[52px] font-extrabold tracking-[-0.035em] leading-[1.06] text-[#111815]">
                Cada operação.
                <br />
                Tudo em ordem.
              </h1>

              <p className="text-[16px] text-[#5F6C66] leading-[1.6] mt-[20px] max-w-[440px]">
                Um lugar para acompanhar entradas, contas e resultados do seu dia.
              </p>

              {/* Slogan Integrado ao Nome ENIGMA */}
              <div className="mt-[26px] w-full max-w-[500px] p-[16px_18px] rounded-[12px] bg-[#FFFFFF] border border-[#D5E2DC] border-l-4 border-l-[#0D6E57] shadow-[0_4px_16px_rgba(17,24,21,0.04)] flex flex-col gap-[4px]">
                <div className="flex items-center justify-between gap-[8px]">
                  <span className="text-[14.5px] font-bold text-[#111815] tracking-[-0.015em]">
                    “Cadê o dinheiro que estava aqui?”
                  </span>
                  <span className="px-[8px] py-[2px] rounded-full bg-[#E2F2EE] text-[#0D6E57] text-[10px] font-bold uppercase tracking-wider shrink-0">
                    Zero Mistério
                  </span>
                </div>
                <p className="text-[13px] text-[#4B5853] leading-[1.5]">
                  No <b className="text-[#111815]">Enigma</b>, o único mistério fica no nome. Saiba exatamente onde está cada centavo — disponível, em operação ou em trânsito — sem planilhas desencontradas.
                </p>
              </div>

              <div className="mt-[32px] pl-[18px] border-l-2 border-[#0D6E57] flex flex-col gap-[4px]">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.11em] text-[#7A8580]">
                  CONTROLE COM CLAREZA
                </span>
                <span className="text-[16px] font-medium text-[#1E2824]">
                  O próximo passo começa aqui.
                </span>
              </div>

              {/* Ações de navegação suave para o tour e prova social */}
              <div className="mt-[36px] flex flex-wrap items-center gap-[12px]">
                <button
                  type="button"
                  onClick={scrollToSpoiler}
                  className="inline-flex items-center gap-[10px] text-[12.5px] font-semibold text-[#0D6E57] hover:text-[#085744] group cursor-pointer"
                >
                  <span className="w-[28px] h-[28px] rounded-full bg-[#E2F2EE] group-hover:bg-[#CFE9E2] flex items-center justify-center">
                    <ArrowDown className="w-[14px] h-[14px]" strokeWidth={2.2} />
                  </span>
                  <span>Role para explorar o visual e ferramentas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('enigma-social-proof');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-[6px] text-[12px] font-semibold text-[#111815] bg-white hover:bg-[#F4F7F6] border border-[#D5E2DC] px-[12px] py-[6.5px] rounded-[8px] cursor-pointer shadow-2xs transition-all"
                >
                  <span>Ver Exemplos de Operações</span>
                </button>
              </div>
            </div>

            {/* DOBRA 2 EM DIANTE: Tour Visual ("Spoiler" sem expor dados sensíveis) */}
            <div id="enigma-spoiler-tour" className="flex flex-col gap-[40px] pt-[16px]">
              {/* EXEMPLOS DE ENTRADAS REAIS */}
              <div id="enigma-social-proof" className="flex flex-col gap-[12px] border-t border-[#DCE4E0] pt-[36px]">
                <div className="flex flex-col gap-[4px]">
                  <h2 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.03em] text-[#111815]">
                    Exemplos de Operações da Mesa
                  </h2>
                  <p className="text-[13px] text-[#5F6C66] leading-[1.5] max-w-[620px]">
                    Bilhetes reais de arbitragem e cobertura executados pela operação (dados de titulares mascarados).
                  </p>
                </div>

                <SocialProofShowcase />
              </div>

              {/* Cabeçalho das Demais Ferramentas */}
              <div className="flex flex-col gap-[6px] border-t border-[#DCE4E0] pt-[28px]">
                <div className="inline-flex items-center gap-[8px]">
                  <span className="px-[9px] py-[2px] rounded-full bg-[#111815] text-[#34D399] text-[10.5px] font-bold uppercase tracking-wider">
                    Tour da Mesa
                  </span>
                  <span className="text-[11.5px] font-semibold text-[#68746F]">
                    Continuidade Visual · Mesma interface de dentro da mesa
                  </span>
                </div>
                <h3 className="text-[22px] sm:text-[24px] font-bold tracking-[-0.03em] text-[#111815]">
                  Velocidade de planilha, precisão de tesouraria.
                </h3>
                <p className="text-[13.5px] text-[#5F6C66] leading-[1.55] max-w-[580px]">
                  Veja como a operação organiza saldos, cálculos de retorno, conciliação diária e fechamento de equipe em uma única linha de comando.
                </p>
              </div>

              {/* SPOILER 1: Rastreabilidade de Capital ("Cadê o dinheiro que estava aqui?") */}
              <div className="bg-white border border-[#CBD6D1] rounded-[14px] overflow-hidden shadow-[0_6px_20px_rgba(17,24,21,0.05)]">
                <div className="px-[18px] py-[12px] bg-[#111815] text-white flex flex-wrap items-center justify-between gap-[10px]">
                  <div className="flex items-center gap-[8px]">
                    <Layers className="w-[15px] h-[15px] text-[#10B981]" strokeWidth={2} />
                    <span className="text-[13.5px] font-bold">
                      1. Rastreamento de Capital em Tempo Real
                    </span>
                  </div>
                  <div className="flex items-center gap-[4px] bg-[#18241F] p-[3px] rounded-[7px] border border-[#263830] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPreviewCapitalTab('resumo')}
                      className={`px-[9px] py-[3px] rounded-[5px] cursor-pointer ${
                        previewCapitalTab === 'resumo'
                          ? 'bg-[#0A6C54] text-white font-semibold'
                          : 'text-[#9AB0A6] hover:text-white'
                      }`}
                    >
                      Mapa de Liquidez
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewCapitalTab('frentes')}
                      className={`px-[9px] py-[3px] rounded-[5px] cursor-pointer ${
                        previewCapitalTab === 'frentes'
                          ? 'bg-[#0A6C54] text-white font-semibold'
                          : 'text-[#9AB0A6] hover:text-white'
                      }`}
                    >
                      Por Frente Operacional
                    </button>
                  </div>
                </div>

                <div className="p-[18px] bg-[#F7F9F8] flex flex-col gap-[14px]">
                  <div className="text-[12.5px] text-[#4B5853]">
                    Nunca mais se pergunte <b className="text-[#111815]">“cadê o dinheiro que estava aqui?”</b>. Todo o giro do dia é separado automaticamente entre saldo livre, posições abertas e valores em trânsito:
                  </div>

                  {previewCapitalTab === 'resumo' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px]">
                      <div className="p-[12px] rounded-[10px] bg-[#111815] text-white flex flex-col gap-[3px]">
                        <span className="text-[10.5px] text-[#9AB0A6] font-semibold uppercase">
                          Capital Total
                        </span>
                        <span className="text-[17px] font-bold tabular-nums text-white">
                          157.430,00
                        </span>
                        <span className="text-[10.5px] text-[#34D399] tabular-nums">
                          100% rastreado
                        </span>
                      </div>
                      <div className="p-[12px] rounded-[10px] bg-white border border-[#CBD6D1] border-l-4 border-l-[#0D6E57] flex flex-col gap-[3px]">
                        <span className="text-[10.5px] text-[#57635E] font-bold uppercase">
                          Disponível
                        </span>
                        <span className="text-[17px] font-bold tabular-nums text-[#111815]">
                          96.310,00
                        </span>
                        <span className="text-[10.5px] text-[#0D6E57] font-semibold">
                          Pronto para giro
                        </span>
                      </div>
                      <div className="p-[12px] rounded-[10px] bg-white border border-[#CBD6D1] border-l-4 border-l-[#334155] flex flex-col gap-[3px]">
                        <span className="text-[10.5px] text-[#57635E] font-bold uppercase">
                          Em Operação
                        </span>
                        <span className="text-[17px] font-bold tabular-nums text-[#111815]">
                          21.480,00
                        </span>
                        <span className="text-[10.5px] text-[#475569] tabular-nums">
                          5 posições ativas
                        </span>
                      </div>
                      <div className="p-[12px] rounded-[10px] bg-white border border-[#CBD6D1] border-l-4 border-l-[#D97706] flex flex-col gap-[3px]">
                        <span className="text-[10.5px] text-[#57635E] font-bold uppercase">
                          Em Trânsito
                        </span>
                        <span className="text-[17px] font-bold tabular-nums text-[#B45309]">
                          7.450,00
                        </span>
                        <span className="text-[10.5px] text-[#B45309] font-semibold">
                          Aguardando liquidação
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-[8px] border border-[#CBD6D1]">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr>
                            <th className="py-[7px] px-[12px] text-left">Frente Operacional</th>
                            <th className="py-[7px] px-[10px] text-right">Disponível</th>
                            <th className="py-[7px] px-[10px] text-right">Em Aberto</th>
                            <th className="py-[7px] px-[10px] text-right">Resultado Mês</th>
                            <th className="py-[7px] px-[12px] text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-[8px] px-[12px] font-bold text-[#111815]">
                              Unidade Alpha · 01
                            </td>
                            <td className="py-[8px] px-[10px] text-right tabular-nums">
                              31.200,00
                            </td>
                            <td className="py-[8px] px-[10px] text-right tabular-nums">
                              5.804,00
                            </td>
                            <td className="py-[8px] px-[10px] text-right font-bold text-[#0D6E57] tabular-nums">
                              + 1.239,19
                            </td>
                            <td className="py-[8px] px-[12px] text-center">
                              <span className="px-[8px] py-[1.5px] rounded-full bg-[#E2F2EE] text-[#0D6E57] text-[10.5px] font-semibold">
                                Ativa
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-[8px] px-[12px] font-bold text-[#111815]">
                              Unidade Beta · 02
                            </td>
                            <td className="py-[8px] px-[10px] text-right tabular-nums">
                              24.700,00
                            </td>
                            <td className="py-[8px] px-[10px] text-right tabular-nums">
                              3.160,00
                            </td>
                            <td className="py-[8px] px-[10px] text-right font-bold text-[#0D6E57] tabular-nums">
                              + 1.200,81
                            </td>
                            <td className="py-[8px] px-[12px] text-center">
                              <span className="px-[8px] py-[1.5px] rounded-full bg-[#E2F2EE] text-[#0D6E57] text-[10.5px] font-semibold">
                                Ativa
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-[8px] px-[12px] font-bold text-[#111815]">
                              Reserva de Tesouraria
                            </td>
                            <td className="py-[8px] px-[10px] text-right tabular-nums">
                              32.190,00
                            </td>
                            <td className="py-[8px] px-[10px] text-right tabular-nums">0,00</td>
                            <td className="py-[8px] px-[10px] text-right font-semibold text-[#68746F] tabular-nums">
                              —
                            </td>
                            <td className="py-[8px] px-[12px] text-center">
                              <span className="px-[8px] py-[1.5px] rounded-full bg-[#F1F5F9] text-[#334155] text-[10.5px] font-semibold">
                                Liquidez Imediata
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* SPOILER 2: Calculadora Multi-Ponta & Simulador de Retorno */}
              <div className="bg-white border border-[#CBD6D1] rounded-[14px] overflow-hidden shadow-[0_6px_20px_rgba(17,24,21,0.05)]">
                <div className="px-[18px] py-[12px] bg-[#111815] text-white flex flex-wrap items-center justify-between gap-[10px]">
                  <div className="flex items-center gap-[8px]">
                    <Calculator className="w-[15px] h-[15px] text-[#10B981]" strokeWidth={2} />
                    <span className="text-[13.5px] font-bold">
                      2. Calculadora de Distribuição & Retorno Garantido
                    </span>
                  </div>
                  <div className="flex items-center gap-[4px] bg-[#18241F] p-[3px] rounded-[7px] border border-[#263830] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPreviewSimPreset('padrao')}
                      className={`px-[9px] py-[3px] rounded-[5px] cursor-pointer ${
                        previewSimPreset === 'padrao'
                          ? 'bg-[#0A6C54] text-white font-semibold'
                          : 'text-[#9AB0A6] hover:text-white'
                      }`}
                    >
                      2 Pontas Simétricas
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewSimPreset('protegida')}
                      className={`px-[9px] py-[3px] rounded-[5px] cursor-pointer ${
                        previewSimPreset === 'protegida'
                          ? 'bg-[#0A6C54] text-white font-semibold'
                          : 'text-[#9AB0A6] hover:text-white'
                      }`}
                    >
                      3 Pontas Ponderadas
                    </button>
                  </div>
                </div>

                <div className="p-[18px] bg-[#F7F9F8] flex flex-col gap-[12px]">
                  <div className="flex flex-wrap items-center justify-between gap-[10px] bg-white p-[12px_14px] rounded-[10px] border border-[#CBD6D1]">
                    <div className="flex items-center gap-[14px]">
                      <div>
                        <div className="text-[10.5px] font-bold uppercase text-[#68746F]">
                          Volume Alocado
                        </div>
                        <div className="text-[16px] font-bold text-[#111815] tabular-nums">
                          {previewSimPreset === 'padrao' ? '2.500,00' : '4.200,00'}
                        </div>
                      </div>
                      <div className="h-[26px] w-[1px] bg-[#DCE4E0]" />
                      <div>
                        <div className="text-[10.5px] font-bold uppercase text-[#68746F]">
                          Retorno Líquido Projetado
                        </div>
                        <div className="text-[16px] font-bold text-[#0D6E57] tabular-nums">
                          {previewSimPreset === 'padrao' ? '+ 71,25 (+2,85%)' : '+ 138,60 (+3,30%)'}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full bg-[#E2F2EE] text-[#0D6E57] text-[11px] font-bold">
                      <CheckCircle2 className="w-[13px] h-[13px]" />
                      100% Distribuído
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-[8px] border border-[#CBD6D1]">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr>
                          <th className="py-[7px] px-[12px] text-left">Ponta</th>
                          <th className="py-[7px] px-[10px] text-left">Cenário</th>
                          <th className="py-[7px] px-[10px] text-right">Multiplicador</th>
                          <th className="py-[7px] px-[10px] text-right">Alocação</th>
                          <th className="py-[7px] px-[12px] text-right">Retorno</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-[8px] px-[12px] font-bold text-[#0D6E57]">Ponta 1</td>
                          <td className="py-[8px] px-[10px]">Cenário Principal A</td>
                          <td className="py-[8px] px-[10px] text-right font-bold tabular-nums">
                            2,080
                          </td>
                          <td className="py-[8px] px-[10px] text-right tabular-nums">
                            {previewSimPreset === 'padrao' ? '1.236,18' : '2.020,00'}
                          </td>
                          <td className="py-[8px] px-[12px] text-right font-bold text-[#111815] tabular-nums">
                            {previewSimPreset === 'padrao' ? '2.571,25' : '4.338,60'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-[8px] px-[12px] font-bold text-[#0D6E57]">Ponta 2</td>
                          <td className="py-[8px] px-[10px]">Cobertura Oposta B</td>
                          <td className="py-[8px] px-[10px] text-right font-bold tabular-nums">
                            2,035
                          </td>
                          <td className="py-[8px] px-[10px] text-right tabular-nums">
                            {previewSimPreset === 'padrao' ? '1.263,82' : '1.480,00'}
                          </td>
                          <td className="py-[8px] px-[12px] text-right font-bold text-[#111815] tabular-nums">
                            {previewSimPreset === 'padrao' ? '2.571,25' : '4.338,60'}
                          </td>
                        </tr>
                        {previewSimPreset === 'protegida' && (
                          <tr>
                            <td className="py-[8px] px-[12px] font-bold text-[#0D6E57]">Ponta 3</td>
                            <td className="py-[8px] px-[10px]">Proteção de Empate</td>
                            <td className="py-[8px] px-[10px] text-right font-bold tabular-nums">
                              6,198
                            </td>
                            <td className="py-[8px] px-[10px] text-right tabular-nums">700,00</td>
                            <td className="py-[8px] px-[12px] text-right font-bold text-[#111815] tabular-nums">
                              4.338,60
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SPOILER 3 & 4: Conciliação de Saldos + Fechamento Mensal (Grid 2 Colunas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                <div className="bg-white border border-[#CBD6D1] rounded-[14px] overflow-hidden flex flex-col">
                  <div className="px-[16px] py-[11px] bg-[#111815] text-white flex items-center gap-[8px]">
                    <RefreshCw className="w-[14px] h-[14px] text-[#10B981]" strokeWidth={2} />
                    <span className="text-[13px] font-bold">
                      3. Conferência em 1 Clique
                    </span>
                  </div>
                  <div className="p-[16px] flex flex-col gap-[10px] text-[12.5px] text-[#4B5853] flex-1 justify-between">
                    <p>
                      Compare o <b className="text-[#111815]">Saldo Esperado</b> pelo sistema com o <b className="text-[#111815]">Saldo Real</b> informado no fim do turno. Se houver qualquer centavo fora do lugar, o sistema aponta a origem na hora.
                    </p>
                    <div className="flex flex-col gap-[6px] pt-[6px]">
                      <div className="p-[8px_10px] rounded-[8px] bg-[#F2F6F4] border border-[#CBD6D1] flex items-center justify-between">
                        <span className="font-semibold text-[#111815]">Frente Operacional #01</span>
                        <span className="px-[7px] py-[1px] rounded-full bg-[#E2F2EE] text-[#0D6E57] text-[10.5px] font-bold">
                          Bateu (0,00)
                        </span>
                      </div>
                      <div className="p-[8px_10px] rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between">
                        <span className="font-semibold text-[#111815]">Frente Operacional #03</span>
                        <span className="px-[7px] py-[1px] rounded-full bg-[#FEF3C7] text-[#B45309] text-[10.5px] font-bold">
                          Em Trânsito
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#CBD6D1] rounded-[14px] overflow-hidden flex flex-col">
                  <div className="px-[16px] py-[11px] bg-[#111815] text-white flex items-center gap-[8px]">
                    <TrendingUp className="w-[14px] h-[14px] text-[#10B981]" strokeWidth={2} />
                    <span className="text-[13px] font-bold">
                      4. Do Bruto ao Líquido & Equipe
                    </span>
                  </div>
                  <div className="p-[16px] flex flex-col gap-[10px] text-[12.5px] text-[#4B5853] flex-1 justify-between">
                    <p>
                      Aportes e retiradas não distorcem o resultado: o fechamento desconta despesas operacionais automaticamente e calcula a participação de cada operador.
                    </p>
                    <div className="grid grid-cols-3 gap-[6px] pt-[6px] text-center">
                      <div className="p-[7px] rounded-[8px] bg-[#F2F6F4] border border-[#CBD6D1]">
                        <div className="text-[10px] text-[#68746F] font-semibold">Bruto</div>
                        <div className="text-[12.5px] font-bold text-[#111815] tabular-nums">
                          + 10.000
                        </div>
                      </div>
                      <div className="p-[7px] rounded-[8px] bg-[#FEF2F2] border border-[#FECACA]">
                        <div className="text-[10px] text-[#991B1B] font-semibold">Custos</div>
                        <div className="text-[12.5px] font-bold text-[#B91C1C] tabular-nums">
                          − 1.150
                        </div>
                      </div>
                      <div className="p-[7px] rounded-[8px] bg-[#E2F2EE] border border-[#A7D7C5]">
                        <div className="text-[10px] text-[#0D6E57] font-semibold">Líquido</div>
                        <div className="text-[12.5px] font-bold text-[#0D6E57] tabular-nums">
                          + 8.850
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Card de Login / Cadastro TRAVADO NA TELA (Sticky) durante todo o scroll */}
          <div className="lg:col-span-5 lg:sticky lg:top-[88px] flex justify-center lg:justify-end">
            <div className="w-full max-w-[430px] bg-[#FFFFFF] border border-[#CBD6D1] rounded-[16px] shadow-[0_12px_36px_rgba(17,24,21,0.06)] p-[32px] sm:p-[38px]">
              {/* Ícone de cadeado no topo do card */}
              <div className="w-[42px] h-[42px] rounded-[11px] bg-[#E2F2EE] text-[#0D6E57] flex items-center justify-center mb-[20px]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="flex flex-col">
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#111815]">
                    Bem-vindo ao Enigma
                  </h2>
                  <p className="text-[13.5px] text-[#6E7A75] mt-[4px] mb-[22px]">
                    Entre na sua conta para continuar.
                  </p>

                  {authError && (
                    <div
                      role="alert"
                      className={`mb-[18px] p-[12px_14px] rounded-[9px] border text-[12.5px] leading-[1.45] ${
                        authError.reason === 'cadastro_pendente'
                          ? 'bg-[#FDF6E7] border-[#E6C786] text-[#8E5B12]'
                          : 'bg-[#FBECE9] border-[#E7B5AD] text-[#9E3324]'
                      }`}
                    >
                      <div className="font-semibold mb-[2px]">
                        {authError.reason === 'cadastro_pendente'
                          ? 'Aguardando Liberação do Administrador'
                          : authError.reason === 'conta_bloqueada'
                          ? 'Conta Bloqueada'
                          : 'Não foi possível entrar'}
                      </div>
                      <div>{authError.message}</div>
                    </div>
                  )}

                  {/* Campo E-mail / Login */}
                  <div className="flex flex-col gap-[6px] mb-[16px]">
                    <label
                      htmlFor="login-identifier"
                      className="text-[12px] font-medium text-[#1F2925]"
                    >
                      E-mail
                    </label>
                    <input
                      id="login-identifier"
                      data-testid="login-identifier-input"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="voce@exemplo.com"
                      autoComplete="username"
                      className="w-full px-[14px] py-[10px] rounded-[8px] border border-[#D5DDD9] bg-[#FFFFFF] text-[13.5px] text-[#111815] placeholder:text-[#9AA5A0] focus:outline-none focus:border-[#0D6E57] transition-colors"
                    />
                  </div>

                  {/* Campo Senha com ícone de visualizar */}
                  <div className="flex flex-col gap-[6px]">
                    <label
                      htmlFor="login-password"
                      className="text-[12px] font-medium text-[#1F2925]"
                    >
                      Senha
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="login-password"
                        data-testid="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Pelo menos 8 caracteres"
                        autoComplete="current-password"
                        className="w-full pl-[14px] pr-[40px] py-[10px] rounded-[8px] border border-[#D5DDD9] bg-[#FFFFFF] text-[13.5px] text-[#111815] placeholder:text-[#9AA5A0] focus:outline-none focus:border-[#0D6E57] transition-colors"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-[12px] text-[#6E7A75] hover:text-[#111815] cursor-pointer p-[2px]"
                      >
                        {showPassword ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Link Esqueci minha senha */}
                  <div className="flex justify-end mt-[10px] mb-[18px]">
                    <button
                      type="button"
                      onClick={() => setShowForgotHelp((prev) => !prev)}
                      className="text-[12px] font-medium text-[#0D6E57] hover:underline cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  {showForgotHelp && (
                    <div className="mb-[16px] p-[12px] rounded-[9px] bg-[#F3F8F6] border border-[#CFE2DC] text-[12px] text-[#354640] flex flex-col gap-[8px]">
                      <div>
                        A redefinição de credenciais é gerenciada pelo Administrador na aba <strong>Configurações → Usuários</strong>. Para testar agora, clique em um perfil:
                      </div>
                      <div className="flex flex-wrap gap-[6px]">
                        <button
                          type="button"
                          onClick={() => handleQuickFill('admin@enigma.com', 'admin123')}
                          className="px-[9px] py-[4px] rounded-[6px] bg-[#0D6E57] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Preencher Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickFill('operador.a@enigma.com', 'op123')}
                          className="px-[9px] py-[4px] rounded-[6px] bg-white border border-[#C5D4CE] text-[#111815] text-[11px] font-medium cursor-pointer"
                        >
                          Preencher Operador A
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickFill('operador.b@enigma.com', 'op123')}
                          className="px-[9px] py-[4px] rounded-[6px] bg-white border border-[#C5D4CE] text-[#111815] text-[11px] font-medium cursor-pointer"
                        >
                          Preencher Operador B
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botão Primário Entrar */}
                  <button
                    type="submit"
                    data-testid="login-submit-btn"
                    className="w-full py-[11px] px-[18px] rounded-[8px] bg-[#0A6C54] hover:bg-[#085744] text-white text-[13.5px] font-semibold transition-colors flex items-center justify-center gap-[8px] cursor-pointer"
                  >
                    <span>Entrar</span>
                    <span aria-hidden="true">→</span>
                  </button>

                  {/* Divisor OU CONTINUE COM centralizado com linhas laterais */}
                  <div className="my-[20px] flex items-center gap-[12px]">
                    <div className="flex-1 border-t border-[#EAECEB]" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#88948F] whitespace-nowrap">
                      OU CONTINUE COM
                    </span>
                    <div className="flex-1 border-t border-[#EAECEB]" />
                  </div>

                  {/* Botão Secundário (Google) */}
                  <button
                    type="button"
                    data-testid="login-google-btn"
                    onClick={() => handleQuickFill('admin@enigma.com', 'admin123', true)}
                    title="Entrar com conta Google"
                    className="w-full py-[9.5px] px-[14px] rounded-[8px] border border-[#DCDAD5] bg-[#F9F9F8] hover:bg-[#EFEFED] text-[#1B2421] text-[13px] font-semibold flex items-center justify-center gap-[8px] transition-colors cursor-pointer"
                  >
                    <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar com o Google</span>
                  </button>

                  {/* Rodapé do Card: Ainda não tem uma conta? Criar conta */}
                  <div className="mt-[22px] text-center text-[12.5px] text-[#6E7A75]">
                    <span>Ainda não tem uma conta? </span>
                    <button
                      type="button"
                      data-testid="login-toggle-mode"
                      onClick={() => {
                        setMode('register');
                        setRegFeedback(null);
                        setAuthError(null);
                      }}
                      className="font-semibold text-[#0D6E57] hover:underline cursor-pointer"
                    >
                      Criar conta
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="flex flex-col">
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#111815]">
                    Criar conta no Enigma
                  </h2>
                  <p className="text-[13px] text-[#6E7A75] mt-[4px] mb-[18px]">
                    Preencha seus dados. O cadastro ficará visível para liberação do Administrador.
                  </p>

                  {regFeedback && (
                    <div
                      role="alert"
                      className={`mb-[16px] p-[12px_14px] rounded-[9px] border text-[12.5px] leading-[1.45] flex flex-col gap-[8px] ${
                        regFeedback.ok
                          ? 'bg-[#E3F3EC] border-[#A7D7C5] text-[#0E5F44]'
                          : 'bg-[#FBECE9] border-[#E7B5AD] text-[#9E3324]'
                      }`}
                    >
                      <div className="font-semibold">
                        {regFeedback.ok
                          ? 'Solicitação enviada para o Administrador!'
                          : 'Não foi possível concluir o cadastro'}
                      </div>
                      <div>{regFeedback.message}</div>
                      {regFeedback.ok && (
                        <div className="flex flex-wrap gap-[8px] pt-[2px]">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('admin@enigma.com', 'admin123', true)}
                            className="px-[10px] py-[5px] rounded-[7px] bg-[#0A6C54] text-white text-[11.5px] font-semibold cursor-pointer"
                          >
                            Entrar como Admin para aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMode('login');
                              setIdentifier(regFeedback.registeredLogin || '');
                              setPassword('');
                            }}
                            className="px-[10px] py-[5px] rounded-[7px] border border-[#0E5F44] text-[#0E5F44] text-[11.5px] font-medium cursor-pointer"
                          >
                            Voltar ao login
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-[12px]">
                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="reg-name" className="text-[12px] font-medium text-[#1F2925]">
                        Nome completo
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full px-[13px] py-[9px] rounded-[8px] border border-[#D5DDD9] text-[13px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                      <div className="flex flex-col gap-[4px]">
                        <label htmlFor="reg-email" className="text-[12px] font-medium text-[#1F2925]">
                          E-mail
                        </label>
                        <input
                          id="reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="voce@exemplo.com"
                          className="w-full px-[13px] py-[9px] rounded-[8px] border border-[#D5DDD9] text-[13px]"
                        />
                      </div>

                      <div className="flex flex-col gap-[4px]">
                        <label htmlFor="reg-login" className="text-[12px] font-medium text-[#1F2925]">
                          Login de acesso
                        </label>
                        <input
                          id="reg-login"
                          type="text"
                          value={regLogin}
                          onChange={(e) => setRegLogin(e.target.value)}
                          placeholder="Ex.: operador.c"
                          className="w-full px-[13px] py-[9px] rounded-[8px] border border-[#D5DDD9] text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                      <div className="flex flex-col gap-[4px]">
                        <label htmlFor="reg-password" className="text-[12px] font-medium text-[#1F2925]">
                          Senha
                        </label>
                        <input
                          id="reg-password"
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Pelo menos 8 caracteres"
                          className="w-full px-[13px] py-[9px] rounded-[8px] border border-[#D5DDD9] text-[13px]"
                        />
                      </div>

                      <div className="flex flex-col gap-[4px]">
                        <label htmlFor="reg-phone" className="text-[12px] font-medium text-[#1F2925]">
                          Telefone / Turno
                        </label>
                        <input
                          id="reg-phone"
                          type="text"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="(11) 99999-0000"
                          className="w-full px-[13px] py-[9px] rounded-[8px] border border-[#D5DDD9] text-[13px]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-[18px] w-full py-[11px] px-[18px] rounded-[8px] bg-[#0A6C54] hover:bg-[#085744] text-white text-[13.5px] font-semibold transition-colors flex items-center justify-center gap-[8px] cursor-pointer"
                  >
                    <span>Criar conta</span>
                    <span aria-hidden="true">→</span>
                  </button>

                  <div className="mt-[20px] text-center text-[12.5px] text-[#6E7A75]">
                    <span>Já possui uma conta? </span>
                    <button
                      type="button"
                      data-testid="login-toggle-mode"
                      onClick={() => {
                        setMode('login');
                        setAuthError(null);
                      }}
                      className="font-semibold text-[#0D6E57] hover:underline cursor-pointer"
                    >
                      Entrar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Minimalista */}
      <footer className="w-full border-t border-[#E4EAE7] bg-[#F7F8F7]">
        <div className="w-full max-w-[1320px] mx-auto px-[24px] sm:px-[48px] py-[22px] flex flex-wrap items-center justify-between gap-[10px] text-[12px] text-[#78837E]">
          <span>© 2026 ENIGMA. Grupo · Gestão de operações</span>
          <span>“Cadê o dinheiro que estava aqui?” — Rastreabilidade total de ponta a ponta</span>
        </div>
      </footer>
    </div>
  );
};
