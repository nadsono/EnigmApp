# Estado do projeto — 5 nov 2026

## Atualização de continuidade e sincronização — 5 nov 2026

- Causa confirmada da perda de contexto: este checkout da Produção não tinha remoto Git; o GitHub `nadsono/EnigmApp` está privado e vazio; o Codex não lista esta raiz entre os projetos salvos; e não há `graphify-out/graph.json` aqui. A pasta de Downloads e a pasta de Estudo são outros checkouts, não sincronizam esse diretório.
- `origin` agora aponta para `https://github.com/nadsono/EnigmApp.git`. A conexão GitHub do Codex consegue ler o repositório, mas o Git local não autenticou (`git ls-remote` foi cancelado no prompt de credenciais). Nenhum push foi feito.
- O projeto foi adicionado ao índice do Second Brain em `Second Brain/04 - Projetos/Enigma/`, com registro e instruções que apontam para a raiz canônica; o código não foi duplicado ali.
- `docs/CONTINUITY.md` virou o resumo operacional curto para retomar tarefas sem reler conversas inteiras; `AGENTS.md` agora o cita como primeira leitura.
- Graphify está instalado, mas o grafo ainda não foi gerado. É necessário confirmar antes de criar `graphify-out/` conforme a skill Graphify.
- Há 44 itens modificados/não rastreados no checkout antes desta atualização. Revisar e classificar antes de commit; `.env`, `node_modules` e `dist` são ignorados. A inspeção de nomes sensíveis no histórico não encontrou caminhos correspondentes.
- Revalidação após esta análise: `npm run build`, `npm run lint` e os 55 testes de domínio passaram. Permanecem os avisos de `__dirname` no Vite e chunk JavaScript de 897 kB. A automação do Chrome expirou duas vezes durante o teste de viewport reduzido; QA visual responsiva continua pendente.
- Sincronização concluída: commits `f233fbc` (interface/fluxos) e `134ee58` (contexto e planos) estão em `origin/codex/server-hardening`; checkout limpo antes da geração do grafo.
- Grafo Graphify código-apenas gerado sem LLM: 66 arquivos, 556 nós, 1.642 ligações, 21 comunidades. `src/screens/ParceriasScreen.tsx` foi extraído parcialmente por limitação de parser na linha 366; build e TypeScript passam.
- Revisão e sincronização do grafo concluídas: `graphify-out/graph.json`, `GRAPH_REPORT.md`, `graph.html` e `manifest.json` estão no commit `b62f007`, enviado para `origin/codex/server-hardening`. O cache local do Graphify fica fora do Git. Uma consulta `graphify explain "EntradasScreen.tsx"` confirmou conexões com `EnigmaContext`, `ledger`, `operationCapital` e a navegação. O grafo indexa código, não documentos; o resumo humano continua em `docs/CONTINUITY.md` e no Second Brain.
- **Próximo passo:** validar o pacote de mudanças e autenticar o Git local; então fazer commits focados e enviar a branch para o repositório privado. Em paralelo, retomar QA responsivo. Graphify segue pendente de confirmação.

## Marco atual

- A raiz canônica continua em `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção)`, branch local `codex/server-hardening`; o checkpoint desta mudança de interface/servidor está versionado localmente.
- A fila de prompts do Antigravity foi confirmada como concluída na IDE. A pasta antiga de referência não tem metadados Git; a reconciliação foi feita por comparação de conteúdo, sem copiar a árvore inteira.
- `ScrollspyScreenGroup` agora reúne subtelas em rolagem contínua nos grupos Visão Geral, Caixa & Saques, Parcerias & Contas e Financeiro & Equipe. Entradas continua isolada. Subseletores e separadores levam à seção correta e a tela ativa acompanha a navegação; a Equipe continua restrita a quem já tinha acesso.
- Cada seção tem altura mínima relativa ao viewport, limitada a 1040 px CSS para reduzir intervalos excessivos quando o zoom amplia o viewport CSS; conteúdo maior continua expandindo a seção. Resumo Geral e Minha Performance distribuem apenas os blocos já existentes, sem gerar métricas ou registros.
- A repetição visual do Estoque ao rolar vinha de uma segunda renderização avulsa em `App.tsx` além da seção já montada em `ScrollspyScreenGroup`; a renderização duplicada foi removida.
- Na Visão Geral, os resumos globais de Banca/Mês e Casas/Aberto/Trânsito/Carteiras foram ocultados porque repetiam os cartões da própria tela. Cotação e navegação continuam visíveis; os resumos permanecem nas outras telas.
- Em Conferência, selecionar uma divergência usa controles de botão acessíveis por teclado. O seletor de casas em Entradas mantém o redesenho neutro já feito e sua alteração local pré-existente foi preservada.
- O cadastro direto no Estoque agora inclui endereço opcional e observações operacionais; a área fica restrita a admin/operador e nomes de titulares no estoque são ocultados para quem não tem acesso à ficha. A edição da ficha preserva os dados KYC como leitura, controla campos sensíveis e exige confirmação explícita e evento de histórico ao alterar destinos financeiros.
- As verificações de permissão e o histórico de destino são locais à demonstração. A heurística de rede ajuda a não bloquear fichas antigas com chave PIX, mas não valida endereço cripto e não substitui autorização/auditoria no servidor.
- A última verificação não encontrou resposta HTTP em `127.0.0.1:3001` para o servidor da pasta de Estudo (conexão recusada). Ele não foi iniciado nem alterado nesta rodada; não presumir que a aba antiga ainda tenha servidor ativo.
- O preview da raiz canônica de Produção fica em `http://127.0.0.1:3002`, com HMR em `24679`; o servidor antigo mantém HMR em `24678`. O `vite.config.ts` não foi alterado. O preview da Produção está com HMR habilitado para refletir edições da pasta compartilhada.
- Há duas janelas Antigravity abertas: uma na raiz Produção e outra na pasta de Estudo, em `PendenciasScreen.tsx`. O workspace antigo e seus arquivos não foram modificados.

## O que foi preparado

- Regras e contexto comuns: `AGENTS.md`, `PROJECT_CONTEXT.md`, `.agents/rules/project.md` e skills do projeto.
- Decisão de manter a experiência visual Antigravity com a camada de dados Codex como infraestrutura interna, sem experiência visual separada de Supabase.
- Planos de workspace, qualidade de UI/demonstração e integração/lançamento.
- `GLOSSARY.md` define a linguagem do domínio; `docs/data-mapping.md` registra entidades, estados, gaps, invariantes e trilhas de schema candidatas.
- Snapshot inicial: 102 arquivos, cerca de 1,82 MiB, commit de importação `7cf559bcf8ebfd5ba411f6b38620d2e44f9a70fd`.
- O second brain do projeto está nos arquivos de contexto versionáveis da raiz Produção (`AGENTS.md`, `PROJECT_CONTEXT.md`, `docs/STATE.md`, regras e planos). A pasta de Estudo não recebe essas mudanças automaticamente.
- Git: branch local `codex/server-hardening`; `git remote -v` não lista remoto. O checkpoint de navegação/servidor e seus documentos foi criado localmente. Outras alterações pendentes de arquivos de domínio, autenticação e parceria ficaram fora desse commit e precisam de revisão separada antes de versionar.

## Segurança e limites

- `server.ts` retorna HTTP 503 em `/api` até existirem autenticação, autorização, validação e handlers auditáveis; o servidor de desenvolvimento vincula em `127.0.0.1`.
- `src/lib/supabase.ts` mantém sync de usuário/catálogo desativado e informa backend offline sem configuração; seeds locais seguem sintéticas.
- `src/database/migrations.ts` e `src/db/*` são código legado de preview/Drizzle, não a história Supabase ativa. O candidato `codex/supabase-integration` tem migrations e RLS mais completas, mas sua árvore estava com mudanças não commitadas e ainda precisa de compatibilidade e revisão integral.
- `src/db/queries.ts` contém um upsert de usuário que exclui registros conflitantes por login/e-mail e preenche hash ausente com `sha256:default`; esse caminho precisa ser removido antes de qualquer uso.
- Migrations Antigravity de `database/` e `supabase/migrations/20261028…` não são candidatas a execução: competem com a trilha Codex e incluem políticas abertas e campos de senha/fallback.
- Não foi consultado nem alterado banco remoto; não foram aplicadas migrations, configuradas chaves, usados dados reais ou feita publicação.
- O login da aplicação atual continua sendo demo/local. O hash demo não é autenticação de produção; Auth real, isolamento por organização e persistência ainda precisam ser integrados à UI preservada.

## Verificação desta rodada

- `npm run build`: passou após a correção de Estoque e do limite de altura. O Vite ainda avisa sobre o uso futuro de `__dirname` e o bundle JavaScript acima de 500 kB.
- `git diff --check`: passou sem erros de whitespace. A mudança de duplicação foi identificada por duas renderizações condicionais para `estoque`; validação visual pós-correção em 75%/50% ainda está pendente. Nenhum teste automatizado foi executado.
- `npm run lint` executou o TypeScript e ainda falha em três referências fora das telas desta rodada: `src/domain/auth.test.ts:22` (migration ausente), `src/screens/ParceriasScreen.tsx:244` (valor possivelmente indefinido) e `src/screens/ParceriasScreen.tsx:948` (tom `info` fora da união permitida). Nenhum teste automatizado foi executado.
- No viewport de referência 1562 × 1155 px, os quatro grupos foram abertos; clique em subtelas e em um separador levou à seção com o seletor ativo. Parcerias e Estoque cresceram além do mínimo conforme seus formulários e tabelas. Não foi observada rolagem horizontal; Entradas voltou ao topo quando selecionada.
- A prévia de Produção em 3002 responde HTTP 200 e entrega os módulos novos; a porta 3001 recusou conexão nesta checagem. A tela antiga não foi reaberta nem substituída.
- Não foram usados dados reais, executados testes automatizados, conectados bancos remotos, aplicadas migrations nem feita publicação.

## Verificação da atualização visual — 5 nov 2026

- `npm run build` passou após ocultar os resumos duplicados na Visão Geral. O Vite continua mostrando os avisos existentes sobre `__dirname` e o tamanho do bundle JavaScript.
- `git diff --check` não encontrou erros de whitespace; mostrou apenas avisos de conversão LF/CRLF em arquivos já modificados.
- Nenhum teste automatizado foi executado.

## Referências visuais recebidas — 5 nov 2026

- As referências de Planna, Flowra, Orbit e Strapp apontam para uma hierarquia de dashboard clara, gráficos de leitura rápida, controles compactos e listas operacionais próximas dos indicadores. A aplicação mantém a marca e a paleta do Enigma; nomes, valores e identidade dos produtos de referência não foram reutilizados.
- A Visão Geral ganhou o painel Resultado liquidado, com visualização diária/acumulada, pontos com tooltip/foco de teclado e alternância do período global. O gráfico usa somente operações concluídas e o cálculo existente do domínio.
- A distribuição de capital foi reorganizada como gráfico de anel com categorias navegáveis para as áreas correspondentes. Os períodos sem operações liquidadas mostram estado vazio, sem preencher com dados estimados.
- O espaçamento da página passou a usar gaps consistentes no lugar de distribuir as seções com `justify-between`, evitando os intervalos grandes em zoom reduzido.
- `npm run build` passou; o preview local de Produção em `127.0.0.1:3002` respondeu HTTP 200. `npm run lint` ainda aponta apenas os três erros TypeScript anteriores em `src/domain/auth.test.ts` e `src/screens/ParceriasScreen.tsx`; não executamos testes automatizados nem inspeção visual no navegador após esta alteração.

## Alinhamento de UX e personalização em revisão — 5 nov 2026

- O usuário confirmou que o nome público é Enigma e que gosta da base visual atual. Pediu um prompt/plano para leitura antes de implementar temas, ajustes de UX, capital adaptável e operação cripto configurável para uso individual ou em equipe.
- O rascunho está em docs/superpowers/specs/2026-11-05-enigma-alinhamento-ux-e-personalizacao.md. As escolhas de padrão de tema, densidade e regra de sugestão de capital estão identificadas como propostas.
- Foram consultados a análise e o procedimento do Surebet Engine, além de amostras de quadros já extraídos. O vídeo completo não foi reanalisado; informações reais da gravação não foram copiadas para a demonstração.
- Esta rodada alterou apenas documentação. A revisão pedida pelo usuário vem antes de novas alterações na aplicação, integração remota ou publicação.

## Próximo passo recomendado

Receber a revisão do usuário sobre o briefing e confirmar se Capital sugerido significa orçamento da próxima entrada. Após esse alinhamento, delimitar a primeira entrega e corrigir as inconsistências de datas, acessibilidade e TypeScript já conhecidas. Validar os fluxos em diferentes larguras/zooms; definir contratos configuráveis de conta, ativo, rede e preferências antes de persistir no Supabase. Revisar em separado as alterações ainda não versionadas e decidir qual remoto Git será usado para backup e colaboração.

## Pendências para lançamento

1. Resolver o mapeamento entre `socio`, `manager` e `aprovador`, além das regras de aprovação de destino.
2. Definir ativos, redes, precisão decimal, status de transferência e tratamento de cotações/taxas.
3. Integrar Auth invite-only, memberships, autorização e adaptadores de dados sem fallback silencioso para demo.
4. Revisar grants, RLS, RPCs, vault, rotação/recuperação, observabilidade e backup/restore; validar em staging somente com dados fictícios.
5. Escolher e configurar hospedagem, domínio, e-mail e ambientes de staging/produção.
6. Aplicar migrations remotas, conectar dados reais ou publicar produção somente com configuração e liberação explícita do titular.
