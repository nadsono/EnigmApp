import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface SocialProofCase {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  event: string;
  market: string;
  totalStake: number;
  totalReturn: number;
  netProfit: number;
}

export const SOCIAL_PROOF_CASES: SocialProofCase[] = [
  {
    id: 'case_middle_spurs_mavs',
    title: 'Middle NBA (Green Duplo)',
    subtitle: 'Dallas Mavericks @ San Antonio Spurs',
    tag: 'Green Duplo',
    event: 'DAL Mavericks @ SA Spurs',
    market: '1º Quarto - Total de Pontos',
    totalStake: 3300,
    totalReturn: 7205,
    netProfit: 3905,
  },
  {
    id: 'case_split_bulls_heat',
    title: 'Cobertura Split em Contas',
    subtitle: 'Miami Heat @ Chicago Bulls',
    tag: 'Split 7 Bilhetes',
    event: 'CHI Bulls @ MIA Heat',
    market: '1º Tempo - Totais (99.5)',
    totalStake: 4970,
    totalReturn: 5754,
    netProfit: 784,
  },
];

interface SocialProofShowcaseProps {
  className?: string;
  onLoadCaseToCalculator?: (caseItem: SocialProofCase) => void;
}

export const SocialProofShowcase: React.FC<SocialProofShowcaseProps> = ({
  className = '',
  onLoadCaseToCalculator,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case_middle_spurs_mavs');

  return (
    <div className={`flex flex-col gap-[14px] ${className}`}>
      {/* Seletor discreto de exemplo */}
      <div className="flex flex-wrap items-center justify-between gap-[8px]">
        <div className="flex items-center gap-[6px]">
          {SOCIAL_PROOF_CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCaseId(c.id)}
              className={`px-[12px] py-[6px] rounded-[8px] text-[12px] font-semibold transition-colors cursor-pointer ${
                selectedCaseId === c.id
                  ? 'bg-[#111815] text-white'
                  : 'bg-white border border-[#D5E2DC] text-[#4B5853] hover:bg-[#F4F7F6]'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {onLoadCaseToCalculator && (
          <button
            type="button"
            onClick={() => {
              const active =
                SOCIAL_PROOF_CASES.find((c) => c.id === selectedCaseId) || SOCIAL_PROOF_CASES[0];
              onLoadCaseToCalculator(active);
            }}
            className="text-[11.5px] font-semibold text-[#0F6B5C] hover:underline cursor-pointer"
          >
            Preencher operação →
          </button>
        )}
      </div>

      {selectedCaseId === 'case_middle_spurs_mavs' ? (
        /* CASO 1: MIDDLE SPURS @ MAVS */
        <div className="flex flex-col gap-[12px]">
          {/* Bilhete Escuro (Ponta Over 67.5 - Cripto Offshore) */}
          <div className="bg-[#1E252B] text-white rounded-[10px] p-[16px] border border-[#2D3843] flex flex-col gap-[10px]">
            <div className="flex items-center justify-between pb-[8px] border-b border-[#2D3843]">
              <div className="text-[17px] font-bold text-[#00FFA3]">
                R$1.300,00 Simples
              </div>
              <div className="px-[10px] py-[3px] rounded-[5px] bg-[#11241C] border border-[#00FFA3]/40 text-[#00FFA3] text-right">
                <div className="text-[13px] font-bold tabular-nums">R$3705,00</div>
                <div className="text-[9px] uppercase opacity-80">Retorno Obtido</div>
              </div>
            </div>

            <div className="flex flex-col gap-[2px]">
              <div className="flex items-center justify-between text-[15px] font-bold">
                <span className="flex items-center gap-[6px] text-white">
                  <CheckCircle2 className="w-[16px] h-[16px] text-[#00FFA3]" />
                  Mais de 67.5
                </span>
                <span className="text-[16px] font-bold tabular-nums text-white">2.85</span>
              </div>
              <div className="text-[11.5px] text-[#94A3B8]">
                1º Quarto - Total - Mais Alternativas
              </div>
              <div className="text-[12px] text-[#CBD5E1]">
                DAL Mavericks @ SA Spurs
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[8px] pt-[8px] border-t border-[#2D3843] text-[12px]">
              <div>
                <span className="text-[#94A3B8] text-[11px]">Aposta: </span>
                <b className="text-white">R$1300,00</b>
              </div>
              <div className="text-right">
                <span className="text-[#94A3B8] text-[11px]">Retorno Total: </span>
                <b className="text-[#00FFA3]">R$3705,00</b>
              </div>
            </div>

            <div className="text-[10.5px] text-[#64748B] pt-[2px]">
              Casa: BC.Game · Titular: ••••• · ID: TX-••••-8129
            </div>
          </div>

          {/* 3 Bilhetes Claros (Ponta Under - Bet365) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
            {/* Bilhete 1: R$ 400 @ 1.75 */}
            <div className="bg-white rounded-[10px] p-[12px] border border-[#D5E2DC] flex flex-col justify-between gap-[8px]">
              <div>
                <div className="flex items-center justify-between pb-[6px] border-b border-[#EEF2F0]">
                  <span className="text-[12.5px] font-bold text-[#111815]">Simples R$400,00</span>
                  <span className="px-[6px] py-[1px] rounded-[4px] bg-[#ECFDF5] text-[#15803D] text-[10px] font-bold">
                    Ganhou
                  </span>
                </div>

                <div className="mt-[6px] flex flex-col gap-[2px]">
                  <div className="flex items-center justify-between text-[13px] font-bold text-[#111815]">
                    <span>Menos de 70.5</span>
                    <span>1.75</span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">1º Quarto - Total de Pontos</div>
                  <div className="text-[11px] text-[#334155]">San Antonio Spurs @ Dallas Mavericks</div>
                </div>
              </div>

              <div className="pt-[6px] border-t border-[#EEF2F0] flex justify-between text-[11.5px]">
                <span className="text-[#64748B]">Prêmios: <b className="text-[#15803D]">R$700,00</b></span>
                <span className="text-[10px] text-[#94A3B8]">Bet365 · •••••</span>
              </div>
            </div>

            {/* Bilhete 2: R$ 1.000 @ 1.75 */}
            <div className="bg-white rounded-[10px] p-[12px] border border-[#D5E2DC] flex flex-col justify-between gap-[8px]">
              <div>
                <div className="flex items-center justify-between pb-[6px] border-b border-[#EEF2F0]">
                  <span className="text-[12.5px] font-bold text-[#111815]">Simples R$1.000,00</span>
                  <span className="px-[6px] py-[1px] rounded-[4px] bg-[#ECFDF5] text-[#15803D] text-[10px] font-bold">
                    Ganhou
                  </span>
                </div>

                <div className="mt-[6px] flex flex-col gap-[2px]">
                  <div className="flex items-center justify-between text-[13px] font-bold text-[#111815]">
                    <span>Under 68.5</span>
                    <span>1.75</span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">1º Quarto - Total de Pontos</div>
                  <div className="text-[11px] text-[#334155]">San Antonio Spurs @ Dallas Mavericks</div>
                </div>
              </div>

              <div className="pt-[6px] border-t border-[#EEF2F0] flex justify-between text-[11.5px]">
                <span className="text-[#64748B]">Prêmios: <b className="text-[#15803D]">R$1.750,00</b></span>
                <span className="text-[10px] text-[#94A3B8]">Bet365 · •••••</span>
              </div>
            </div>

            {/* Bilhete 3: R$ 600 @ 1.75 */}
            <div className="bg-white rounded-[10px] p-[12px] border border-[#D5E2DC] flex flex-col justify-between gap-[8px]">
              <div>
                <div className="flex items-center justify-between pb-[6px] border-b border-[#EEF2F0]">
                  <span className="text-[12.5px] font-bold text-[#111815]">Simples R$600,00</span>
                  <span className="text-[12px] font-bold text-[#111815]">1.75</span>
                </div>

                <div className="mt-[6px] flex flex-col gap-[2px]">
                  <div className="flex items-center justify-between text-[13px] font-bold text-[#111815]">
                    <span>Menos de 70.5</span>
                    <span className="text-[11px] text-[#15803D] font-bold">✓ 68 pts</span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">1º Quarto - Total de Pontos</div>
                  <div className="text-[11px] text-[#334155]">San Antonio Spurs @ Dallas Mavericks</div>
                </div>
              </div>

              <div className="pt-[6px] border-t border-[#EEF2F0] flex justify-between text-[11.5px]">
                <span className="text-[#64748B]">Retorno: <b className="text-[#15803D]">R$1.050,00</b></span>
                <span className="text-[10px] text-[#94A3B8]">Bet365 · •••••</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CASO 2: SPLIT COBERTURA MULTICONTAS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
          {/* Ponta 1: Over */}
          <div className="bg-white rounded-[10px] p-[14px] border border-[#D5E2DC] flex flex-col gap-[10px]">
            <div className="flex justify-between items-center pb-[6px] border-b border-[#EEF2F0]">
              <span className="text-[13px] font-bold text-[#111815]">Ponta 1 (Over 99.5) · 4 Bilhetes</span>
              <span className="text-[12px] font-bold text-[#0F6B5C]">Odd 1.91 - 1.93</span>
            </div>
            <div className="flex flex-col gap-[6px]">
              {[
                { val: 'R$ 900,00', ret: 'R$ 1.719,00' },
                { val: 'R$ 900,00', ret: 'R$ 1.719,00' },
                { val: 'R$ 500,00', ret: 'R$ 965,00' },
                { val: 'R$ 700,00', ret: 'R$ 1.351,00' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-[6px_10px] rounded-[6px] bg-[#F8FAFC] text-[12px]"
                >
                  <span className="text-[#475569]">Bilhete #{idx + 1} · {item.val}</span>
                  <span className="font-semibold text-[#15803D]">{item.ret}</span>
                </div>
              ))}
            </div>
            <div className="text-[10.5px] text-[#94A3B8]">Contas Bet365 / Clones · Dados mascarados</div>
          </div>

          {/* Ponta 2: Under */}
          <div className="bg-[#1E252B] text-white rounded-[10px] p-[14px] border border-[#2D3843] flex flex-col gap-[10px]">
            <div className="flex justify-between items-center pb-[6px] border-b border-[#2D3843]">
              <span className="text-[13px] font-bold text-white">Ponta 2 (Under 99.5) · 3 Bilhetes</span>
              <span className="text-[12px] font-bold text-[#00FFA3]">Odd 2.30</span>
            </div>
            <div className="flex flex-col gap-[6px]">
              {[
                { val: 'R$ 670,00', cash: 'R$ 1.438,24' },
                { val: 'R$ 650,00', cash: 'R$ 1.395,35' },
                { val: 'R$ 650,00', cash: 'R$ 1.395,35' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-[6px_10px] rounded-[6px] bg-[#141C22] text-[12px]"
                >
                  <span className="text-[#94A3B8]">Bilhete #{idx + 1} · {item.val}</span>
                  <span className="font-semibold text-[#00FFA3]">{item.cash}</span>
                </div>
              ))}
            </div>
            <div className="text-[10.5px] text-[#64748B]">Contas Cripto Offshore · Dados mascarados</div>
          </div>
        </div>
      )}
    </div>
  );
};
