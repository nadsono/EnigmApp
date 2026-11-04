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

- [ ] Confirmar que não há mais tarefa nem mensagens seriais pendentes na IDE.
- [ ] Inspecionar diff de cada arquivo tocado e comparar com a versão canônica.
- [ ] Portar somente os prompts concluídos e desejados, sem sobrescrever trabalho canônico fora do escopo.
- [ ] Registrar conflitos, decisões e hash/horário do snapshot.
- [ ] Só então abrir esta raiz no Antigravity como workspace comum.

### Tarefa 2: Ajustes de fluxo pedidos na fila

**Arquivos:** src/screens/EstoqueScreen.tsx, src/screens/ParceriasScreen.tsx, src/screens/EntradasScreen.tsx, src/components/SidebarNav.tsx e telas afetadas pela rolagem

- [ ] Finalizar a solicitação do Estoque que está ativa sem introduzir outra cópia dos mesmos indicadores.
- [ ] Aplicar mudança do botão e campos de edição apenas no alcance da solicitação aprovada; notas devem ser não sensíveis.
- [ ] Substituir seleção redundante por uma interação principal clara; manter fallback explícito para entrada personalizada.
- [ ] Ajustar faixa de seletores para rolagem horizontal por toque, teclado e roda do mouse, com opções não recortadas.
- [ ] Aplicar navegação por rolagem somente onde âncoras correspondem a seções reais e não confundem navegação de página.
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
- [ ] Eliminar senha literal ou credencial reutilizável da seed e das telas; fornecer fluxo demonstrativo seguro quando necessário.
- [ ] Diferenciar valores simulados de dados persistidos ou sincronizados sem poluir as telas.

### Tarefa 5: Revisão e registro do resultado

**Arquivos:** docs/STATE.md e docs/visual-audit-baseline.md

- [ ] Atualizar contagens da auditoria e anotar falsos positivos/exceções que permanecerem.
- [ ] Navegar visualmente nos fluxos alterados e confirmar o estado final em execução local sem criar dados reais.
- [ ] Registrar alterações concluídas, problemas restantes e um próximo passo único.
- [ ] Não executar testes de software nesta etapa sem solicitação explícita do usuário.
