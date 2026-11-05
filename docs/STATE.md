# Estado do projeto — 4 nov 2026

## Marco atual

- A raiz canônica continua em `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção)`, branch local `codex/server-hardening`; o checkpoint desta mudança de interface/servidor está versionado localmente.
- A fila de prompts do Antigravity foi confirmada como concluída na IDE. A pasta antiga de referência não tem metadados Git; a reconciliação foi feita por comparação de conteúdo, sem copiar a árvore inteira.
- `ScrollspyScreenGroup` agora reúne subtelas em rolagem contínua nos grupos Visão Geral, Caixa & Saques, Parcerias & Contas e Financeiro & Equipe. Entradas continua isolada. Subseletores e separadores levam à seção correta e a tela ativa acompanha a navegação; a Equipe continua restrita a quem já tinha acesso.
- Cada seção tem altura mínima relativa ao viewport, limitada a 1040 px CSS para reduzir intervalos excessivos quando o zoom amplia o viewport CSS; conteúdo maior continua expandindo a seção. Resumo Geral e Minha Performance distribuem apenas os blocos já existentes, sem gerar métricas ou registros.
- A repetição visual do Estoque ao rolar vinha de uma segunda renderização avulsa em `App.tsx` além da seção já montada em `ScrollspyScreenGroup`; a renderização duplicada foi removida.
- Em Conferência, selecionar uma divergência usa controles de botão acessíveis por teclado. O seletor de casas em Entradas mantém o redesenho neutro já feito e sua alteração local pré-existente foi preservada.
- O cadastro direto no Estoque agora inclui endereço opcional e observações operacionais; a área fica restrita a admin/operador e nomes de titulares no estoque são ocultados para quem não tem acesso à ficha. A edição da ficha preserva os dados KYC como leitura, controla campos sensíveis e exige confirmação explícita e evento de histórico ao alterar destinos financeiros.
- As verificações de permissão e o histórico de destino são locais à demonstração. A heurística de rede ajuda a não bloquear fichas antigas com chave PIX, mas não valida endereço cripto e não substitui autorização/auditoria no servidor.
- O servidor Antigravity da pasta `Enigma Gestão (Estudo)\Google IA Studio\enigma-gestão-GoogleIAStudio-v1` continua em `0.0.0.0:3001`. O processo da raiz Produção que ocupava `127.0.0.1:3001` foi encerrado sem tocar no servidor antigo.
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
- HTTP 200 foi confirmado em 3001 e 3002. A prévia da raiz Produção é aberta em nova aba; a interface antiga em 3001 não foi recarregada nem substituída.
- Não foram usados dados reais, executados testes automatizados, conectados bancos remotos, aplicadas migrations nem feita publicação.

## Próximo passo recomendado

Receber capturas acessíveis dos exemplos de interface enviados por Threads/Notion, cuja página não foi acessível pela ferramenta de pesquisa; então desenhar gráficos e controles interativos usando os dados operacionais já disponíveis, sem métricas artificiais. Em paralelo, corrigir os três erros de TypeScript já conhecidos e revisar em separado as alterações ainda não versionadas; depois, decidir qual remoto Git será usado para backup e colaboração.

## Pendências para lançamento

1. Resolver o mapeamento entre `socio`, `manager` e `aprovador`, além das regras de aprovação de destino.
2. Definir ativos, redes, precisão decimal, status de transferência e tratamento de cotações/taxas.
3. Integrar Auth invite-only, memberships, autorização e adaptadores de dados sem fallback silencioso para demo.
4. Revisar grants, RLS, RPCs, vault, rotação/recuperação, observabilidade e backup/restore; validar em staging somente com dados fictícios.
5. Escolher e configurar hospedagem, domínio, e-mail e ambientes de staging/produção.
6. Aplicar migrations remotas, conectar dados reais ou publicar produção somente com configuração e liberação explícita do titular.
