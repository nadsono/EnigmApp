# UI e dados de demonstração — plano de melhoria

> **Para agentes:** executar este plano tarefa a tarefa. Preservar o desenho de produto aprovado e manter histórico revisável.

**Objetivo:** reconciliar a fila Antigravity com a base canônica e melhorar clareza, consistência e uso diário sem descaracterizar a interface que já foi construída.

**Arquitetura:** portar mudanças do Antigravity uma a uma após a fila terminar. Refatorar apresentação de forma incremental apoiando-se nos tokens/tema existentes, preservar fluxos e estados úteis e deixar dados demo identificáveis como fictícios. Não substituir a navegação por um dashboard genérico.

**Tecnologias:** React 19, TypeScript, CSS/Tailwind existente, skill local tirar-cara-de-ia, automação visual por navegador.

**Especificação:** docs/superpowers/specs/2026-11-04-enigma-producao-unificada-design.md

## Restrições globais

- Manter telas e fluxos visuais do Antigravity como experiência padrão.
- Não reduzir duplicidade removendo fluxo antes de confirmar que nenhuma ação útil se perde.
- Usar apenas registros fictícios; não alegar que bilhetes de demonstração são registros reais mascarados.
- Evitar linguagem pomposa, selos ou conteúdo promocional; manter rótulos simples de operação.
- Preservar contraste, navegação por teclado, tamanho de alvo e preferências de movimento reduzido.
- Um único escritor por arquivo/conjunto de arquivos durante a reconciliação.

## Foco da revisão

- Mudanças da fila que conflitam com alterações da cópia: comparar antes de portar e manter a intenção que o usuário confirmou.
- Métricas de moeda ou resultado duplicadas: validar fonte, unidade, cotação e caso sem operação.
- Alterações em CPF/nascimento: tratar como campos sensíveis; o pedido é limitar edição a esses campos e incluir observação, sem ampliar o cadastro para senha/documentos.
- Seletores de casas: preservar cor e nome de marca com contraste, sem pontinhos decorativos e sem ocultar opções fora da área visível.
- Rolagem por botões: manter foco, histórico e funcionamento de voltar/avançar, inclusive em zoom alto.

---

### Tarefa 1: Reconciliar fila Antigravity

**Arquivos:**
- Comparar: arquivos alterados na pasta Antigravity antiga com src da raiz canônica
- Atualizar: docs/STATE.md e SNAPSHOT-ORIGIN.md

**Interfaces:** a cópia canônica é o ponto de partida; a fila antiga é fonte temporária de mudanças até ser reconciliada.

- [x] Confirmar que não há mais tarefa nem mensagens seriais pendentes na IDE.
- [x] Inspecionar os diffs funcionais de UI/servidor/auth e comparar com a versão canônica.
- [x] Portar somente o scrollspy e a mudança de posição de “Equalizar Stakes”; preservar o seletor neutro e controles melhores da versão canônica.
- [x] Registrar conflitos e decisão em `SNAPSHOT-ORIGIN.md`; a origem Antigravity não tem hash Git disponível.
- [x] Só então abrir esta raiz no Antigravity como workspace comum; a janela está em modo restrito aguardando a decisão de confiança do titular.

### Tarefa 2: Ajustes de fluxo pedidos na fila

**Arquivos:** src/screens/EstoqueScreen.tsx, src/screens/ParceriasScreen.tsx, src/screens/EntradasScreen.tsx, src/components/SidebarNav.tsx e telas afetadas pela rolagem

- [x] Finalizar a solicitação do Estoque que está ativa sem introduzir outra cópia dos mesmos indicadores: cadastro direto agora aceita endereço opcional e observações operacionais.
- [x] Aplicar mudança do botão e campos de edição apenas no alcance da solicitação aprovada; notas devem ser não sensíveis. Campos da ficha foram ampliados, dados de titular ficam restritos no UI e destinos exigem confirmação e histórico local sem valores.
- [ ] Substituir seleção redundante por uma interação principal clara; manter fallback explícito para entrada personalizada.
- [x] Ajustar faixa de seletores para rolagem horizontal por toque, teclado e roda do mouse, com opções não recortadas.
- [x] Aplicar navegação por rolagem somente onde âncoras correspondem a seções reais e não confundem navegação de página.
- [ ] Rever nomes de calculadora/operação/acompanhamento com rótulos que descrevem a etapa atual.

### Tarefa 3: Refinar sistema visual com base na auditoria

**Arquivos:** src/index.css, src/domain/uiTheme.ts, componentes/telas identificados por docs/visual-audit-baseline.md

- [ ] Manter a identidade verde/navy e os padrões próprios do projeto.
- [ ] Agrupar cores fixas recorrentes em tokens apenas após confirmar cada uso visual; não substituir blocos inteiros de hex por busca/substituição.
- [ ] Corrigir labels de campos sem associação, controles falsos em div/span/tr e comportamento de movimento reduzido onde a inspeção confirmar problema.
- [ ] Simplificar densidade/duplicação nos fluxos diários sem remover dados operacionais que não aparecem em outro lugar.
- [ ] Conferir comportamento visual em largura de celular, desktop, teclado e zoom elevado com a aplicação local.

### Tarefa 4: Corrigir comunicação e dados sintéticos

**Arquivos:** src/components/SocialProofShowcase.tsx, src/screens/LoginScreen.tsx, src/domain/seed.ts e docs do produto

- [ ] Trocar texto que sugere dados reais mascarados por identificação clara de exemplos fictícios.
- [ ] Conferir se nomes, contas, CPFs, bilhetes e saldos da seed são obviamente sintéticos e não apontam para pessoas reais.
- [ ] Manter apenas credenciais sintéticas e claramente demonstrativas; não usar segredos reais/reutilizáveis, e garantir que a experiência de demo seja isolada da autenticação de produção.
- [ ] Diferenciar valores simulados de dados persistidos ou sincronizados sem poluir as telas.

### Tarefa 5: Revisão e registro do resultado

**Arquivos:** docs/STATE.md e docs/visual-audit-baseline.md

- [ ] Atualizar contagens da auditoria e anotar falsos positivos/exceções que permanecerem.
- [ ] Navegar visualmente nos fluxos alterados e confirmar o estado final em execução local sem criar dados reais.
- [ ] Registrar alterações concluídas, problemas restantes e um próximo passo único.
- [ ] Não executar testes de software nesta etapa sem solicitação explícita do usuário.

### Tarefa 6: Páginas independentes e espaçamento do dashboard

**Revisão do direcionamento:** a implementação anterior separou Resumo e Performance como páginas independentes. O usuário esclareceu que queria seções contínuas, com uma tela por rolagem e subtelas sincronizadas. A reestruturação foi concluída pelo plano `2026-11-04-scrollspy-and-port-recovery.md`.

**Especificação:** `docs/superpowers/specs/2026-11-04-dashboard-pages-refinement.md`

**Arquivos:** `src/App.tsx`, `src/screens/VisaoGeralScreen.tsx`, `src/screens/MinhaPerformanceScreen.tsx`, `src/components/SidebarNav.tsx`, `src/screens/EntradasScreen.tsx`, `src/components/SocialProofShowcase.tsx`, `src/screens/LoginScreen.tsx`, `src/screens/EstoqueScreen.tsx`.

- [x] Reagrupar Resumo e Performance como seções do mesmo fluxo de rolagem; não usar a arquitetura de páginas independentes.
- [x] Aplicar scrollspy aos demais grupos com várias subtelas conforme o novo plano; manter Entradas isolada como grupo de uma tela.
- [x] Reavaliar espaçamento e dashboards existentes dentro das seções, preservando dados e regras atuais.
- [x] Conferir os grupos por seletor e separador no navegador no viewport de referência.
