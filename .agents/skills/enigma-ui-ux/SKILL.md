---
name: enigma-ui-ux
description: >-
  Diretrizes de Design System, UI e UX para o Enigma Gestão (Mesa de Operação
  de Arbitragem, Cripto Offshore USDT/EUR e Bancos/PIX), integradas com as leis
  Anti-Slop da skill Uizze ui-taste. Use esta skill ao revisar, redesenhar ou
  refatorar telas, tabelas, cards e fluxos operacionais.
---

# Enigma Gestão — Design System & UI/UX (Uizze `ui-taste` Anti-Slop Spec)

## 1. Anti-Slop Pre-Flight (Regras Mecânicas Obrigatórias)
1. **Um Único Accent Travado (`#0F6B5C`)**:
   - Cor de ação primária e estado ativo: `#0F6B5C` (hover `#0B4F44`, superfície sutil `#ECFDF5` / `#E6F4F1`).
   - Proibido misturar azul, índigo, roxo ou múltiplos tons de verde para ações em telas diferentes.
2. **Uma Única Família de Neutros (Cool Slate)**:
   - Canvas: `#F8FAFC` (plano, sem gradientes de malha ou halos brilhantes).
   - Cards / Superfícies: `#FFFFFF` com borda `#E2E8F0` e sombra suave com offset (`0 1px 3px rgba(15,23,42,0.05)`).
   - Cabeçalhos de tabela / Fundos secundários: `#F1F5F9`.
   - Bordas de controles: `#CBD5E1`.
   - Tipografia: Primário `#0F172A`, Secundário `#475569`, Muted `#64748B`.
   - Topbar escura: `#0F172A` com borda `#1E293B`.
3. **Cores Semânticas Restritas a Status**:
   - **Green / Lucro**: texto `#15803D`, fundo `#F0FDF4`, borda `#BBF7D0`.
   - **Amber / Pendente / Trânsito**: texto `#B45309`, fundo `#FFFBEB`, borda `#FDE68A`.
   - **Red / Red / Limitada / Divergência**: texto `#B91C1C`, fundo `#FEF2F2`, borda `#FECACA`.
4. **Shape Lock (Escala Única de Raios de Borda)**:
   - Cards e seções: `rounded-[12px]` (`12px`)
   - Inputs, selects e botões de ação: `rounded-[8px]` (`8px`)
   - Badges de status e pílulas de filtro: `rounded-full`
5. **Zero Emoji / Zero Unicode como Ícone na Interface**:
   - Usar exclusivamente ícones vetoriais `lucide-react` (`strokeWidth={1.75}`).
6. **Motion & Frequência**:
   - Transições rápidas (`< 150ms`, `cubic-bezier(0.23, 1, 0.32, 1)`), feedback de clique `scale(0.97)` em botões, highlight de fundo em linhas de tabela (nunca scale em linha), respeitando `prefers-reduced-motion`.
