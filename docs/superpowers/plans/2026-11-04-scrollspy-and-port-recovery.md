# Navegação contínua e isolamento do preview — plano

> **Para agentes:** executar depois da revisão do titular; trabalhar somente na raiz canônica de Produção.

**Objetivo:** preservar o servidor e a operação Antigravity de Estudo, separar o preview da raiz Produção e apresentar cada subtela de grupos relacionados em uma seção de rolagem contínua.

**Arquitetura:** reutilizar `ScrollspyScreenGroup` para todos os grupos com múltiplas subtelas. Cada seção acompanha a subtela ativa, ocupa pelo menos a área útil de um viewport e pode crescer com seu conteúdo. Usar portas HTTP/HMR próprias para a raiz Produção, preservando o servidor e as configurações do projeto Antigravity antigo.

**Tecnologias:** React 19, TypeScript, Express, Vite e Git local.

**Especificação:** `docs/superpowers/specs/2026-11-04-dashboard-pages-refinement.md`.

## Restrições

- Alterar somente `Enigma Gestão (Produção)`; não editar nem parar a pasta de Estudo/Antigravity.
- Manter Entradas como uma subtela independente. Aplicar rolagem contínua aos grupos Visão Geral, Caixa & Saques, Parcerias & Contas e Financeiro/Equipe.
- Preservar todos os formulários, tabelas, dados fictícios, permissões e estados existentes; não inventar métricas ou fórmulas.
- Não alterar `vite.config.ts`; para o preview da raiz Produção usar `PORT=3002`, `VITE_HMR_PORT=24679` e `DISABLE_HMR=true` quando for necessário congelar file watching durante edições assistidas.
- Criar checkpoints Git locais depois de revisar o diff; não configurar nem enviar a um remoto sem um destino definido pelo titular.
- Validar manualmente no navegador; não executar testes automatizados sem solicitação.

## Pontos de revisão

- A rolagem manual e o clique em subtelas/separadores precisam manter a seção e o item ativo sincronizados.
- Seções maiores que a tela devem crescer sem cortar controles; formulários não podem perder dados por remontagem inesperada.
- Os grupos Caixa e Parcerias contêm telas operacionais densas: observar tempo de renderização e evitar duplicar áreas de trabalho.
- Admin e operador devem manter subtelas e permissões atuais, em especial a restrição de Equipe para operador.
- O servidor antigo continua em `0.0.0.0:3001`; o preview Produção fica em `127.0.0.1:3002`, com HMR separado em `24679`.

---

### Tarefa 1: isolar os servidores locais

**Arquivos:** `server.ts`.

- [x] Definir `PORT` padrão como 3002 e permitir override por variável de ambiente.
- [x] Definir a porta HMR própria como 24679, com override `VITE_HMR_PORT`; preservar `vite.config.ts`.
- [x] Parar somente a sessão Codex que ocupava 127.0.0.1:3001; manter o processo da pasta de Estudo em 3001.
- [x] Iniciar a raiz Produção em 3002, com HMR em 24679 e abrir a prévia em uma nova aba, sem atualizar a aba antiga.
- [x] Registrar comandos de inicialização e estado final de portas em `docs/STATE.md`.

### Tarefa 2: revisar e versionar o conjunto desta mudança

**Arquivos:** árvore Git da raiz Produção; `docs/STATE.md`.

- [x] Revisar o diff dos arquivos de navegação, espaçamento, porta e documentação incluídos neste checkpoint; deixar outros arquivos pendentes da árvore intactos.
- [x] Confirmar que os arquivos selecionados não incluem `.env`, chaves ou dados pessoais reais; exemplos da demonstração são sintéticos.
- [x] Criar um checkpoint Git local apenas para o conjunto revisado, sem incluir alterações pendentes não relacionadas.
- [x] Registrar que a branch atual é local (`codex/server-hardening`) e que `git remote -v` não lista remoto; não publicar/push.

### Tarefa 3: agrupar subtelas em seções contínuas

**Arquivos:** `src/App.tsx`, `src/components/ScrollspyScreenGroup.tsx`, `src/components/SidebarNav.tsx`.

- [x] Criar a lista `OVERVIEW_SECTIONS` para Resumo Geral e Minha Performance.
- [x] Criar a lista `CASH_SECTIONS` para Saques, Saldos, Conferência e Pendências.
- [x] Criar a lista `PARTNERSHIP_SECTIONS` para Titulares em Operação e Estoque de Parcerias.
- [x] Manter `FINANCE_SECTIONS` com Custos e Equipe; renderizar Equipe somente para não operadores e preservar a tela de Custos isolada para operador.
- [x] Renderizar um único `ScrollspyScreenGroup` por grupo ativo; manter `entradas` e outras telas de uma única subtela no fluxo direto.
- [x] Confirmar por navegação no preview que as subtelas e um separador rolam até a seção, atualizam o seletor ativo e não geram rolagem horizontal.

### Tarefa 4: dar uma área de leitura por seção

**Arquivos:** telas de Visão Geral, Performance, Saques, Saldos, Conferência, Pendências, Parcerias e Estoque que precisarem de reflow.

- [x] Aplicar altura mínima baseada no viewport útil; tabelas e formulários ampliam a seção quando precisam.
- [x] Distribuir verticalmente os blocos existentes em Resumo Geral e Minha Performance, preservando a escala, paleta e componentes atuais.
- [x] Usar somente gráficos/resumos já derivados dos dados existentes; manter estados vazios sem preencher artificialmente.
- [x] Manter navegação por teclado, foco visível, contraste e redução de movimento.
- [x] Não adicionar Kanban nem métricas fictícias.

### Tarefa 5: conferir e registrar

**Arquivos:** `docs/STATE.md`, `docs/superpowers/plans/2026-11-04-ui-quality-and-demo.md`.

- [x] No viewport de referência 1562 × 1155 px, conferir os quatro grupos, navegação por seletor e separador, crescimento das telas densas e retorno de Entradas ao topo; não foi observada rolagem horizontal.
- [x] Confirmar resposta HTTP 200 em 3001 (Estudo) e 3002 (Produção); a porta HMR da Produção é 24679 e a antiga continua em 24678.
- [x] Registrar verificações, erros de TypeScript já conhecidos e o próximo passo no estado do projeto.
- [x] Revisar o diff integrado e criar um commit local para esta mudança; manter o remoto vazio até o titular indicar o destino.
