# Enigma Gestão: base única de produção — desenho

## Intenção

Consolidar o desenvolvimento em uma única pasta Git fora de `Enigma Gestão (Estudo)`. A interface e os fluxos visuais/interativos do Antigravity continuam definindo o produto. O trabalho de Supabase do Codex é a fundação técnica de persistência, autenticação, autorização e proteção de segredos a ser acoplada ao mesmo produto; não representa outra aplicação nem uma experiência visual separada.

## Decisões do usuário

- Criar o novo projeto em `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção)`.
- Preservar visual e funcionalidades desenvolvidos no Antigravity.
- Preparar o banco/servidor e, posteriormente, tratar os erros de integração.
- Manter dados fictícios até haver implantação segura.
- Compartilhar entre Codex e Antigravity o contexto e as regras persistentes do produto.
- Avançar na direção de publicação online, sem tratar o projeto como pronto para usuários reais antes dos controles de produção.

## Abordagens

1. **Antigravity como base única, com integração seletiva dos contratos e proteções Supabase do Codex (recomendada):** preserva a interface mais completa e incorpora autenticação, isolamento e cofres como implementação interna da mesma aplicação. Exige adaptar modelos e fluxos, pois as duas bases têm esquemas e regras divergentes.
2. **Codex/Supabase como base visual e funcional:** facilita preservar o trabalho de banco, mas substitui a interface atual por um subconjunto de telas conectadas e perde fluxos do Antigravity. Não atende à prioridade visual e funcional declarada.
3. **Manter as duas aplicações e sincronizar contexto manualmente:** evita uma integração inicial, mas conserva duas cópias distantes, filas e decisões divergentes. Não atende ao pedido de uma única pasta.

## Escopo

- Usar a aplicação Antigravity como origem de navegação, telas, identidade visual e fluxos de demonstração.
- Criar uma só raiz de trabalho em `Enigma Gestão (Produção)`, versionada em Git e aberta pelo Codex e pelo Antigravity.
- Preservar o histórico pendente da worktree Codex, sem assumir que alterações não commitadas pertencem à última versão integrada.
- Auditar e integrar seletivamente o trabalho Codex de Auth, organizações, contratos, comandos, migrations, Edge Functions e cofres. Usar somente o histórico de migrations Codex após revisão; não combinar migrations homônimas incompatíveis da referência Antigravity.
- Manter a interface Antigravity visualmente intacta durante a integração; os componentes conectados existentes no Codex servem como referência de estados e segurança, não como substituição visual.
- Separar a experiência demo com dados sintéticos da persistência conectada internamente, sem apresentar “modo Supabase” como produto distinto.
- Criar contexto versionado comum: `AGENTS.md`, regras em `.agents/rules/`, skills em `.agents/skills/` e documentos de produto, domínio, decisões, arquitetura e operação.
- Concluir a fila atual do Antigravity ou reconciliá-la prompt a prompt antes de portar suas mudanças. Na última inspeção da IDE, uma tarefa estava ativa em EstoqueScreen.tsx e seis mensagens permaneciam na fila serial; a pasta antiga segue como workspace até reconciliar tudo.
- Preparar hospedagem/lançamento, mas deixar publicação de produção, configuração de contas externas e uso de dados reais condicionados aos controles, credenciais e validações que somente o titular pode fornecer/aprovar.

## Não objetivos

- Não substituir telas e experiência atual por uma nova interface Codex.
- Não misturar os esquemas Supabase de duas aplicações independentes.
- Não mover, apagar ou sobrescrever as pastas antigas antes de verificar a cópia consolidada; mantê-las como recuperação.
- Não copiar `.env.local`, credenciais, chaves privadas, dados de titulares ou builds/caches para o novo projeto.
- Não aplicar migrations em uma instância remota nem publicar em produção sem ambiente e credenciais aprovados.
- Não considerar o demo local, com dados fictícios, apropriado para guardar credenciais reais.

## Estado e restrições conhecidas

- Antigravity está em `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Estudo)\Google IA Studio\enigma-gestão-GoogleIAStudio-v1`, sem Git, com uma tarefa ativa em `EstoqueScreen.tsx` e seis prompts em fila automática. Novas mensagens são processadas em série; o retrato pode mudar até a reconciliação.
- A base principal Codex está em `...\enigma---gestão-de-contas-e-capital (1)`. A worktree `...\.worktrees\supabase-integration` tem o commit `152589e` e alterações locais pendentes em Auth, cofres, funções Edge, seed e documentação. Essas alterações devem ser preservadas e revisadas; não há uma base limpa para sobrescrita.
- O código Antigravity concentra UI, sessão, cálculos e persistência local em `src/context/EnigmaContext.tsx`. As telas que devem ser preservadas incluem `src/App.tsx`, `src/components/SidebarNav.tsx`, `src/index.css`, `src/domain/uiTheme.ts` e `src/screens/*`.
- O modo conectado Codex cobre menos módulos que a referência. Estoque, Visão Geral, Minha Performance, Pendências e Configurações ainda precisam de integração; há lacunas nos contratos para completar/editar pernas de operações.
- Os contratos e migrations das bases divergem em nomes e semântica. A leitura atual identificou tabelas homônimas como `partnerships`, `house_accounts`, `withdrawals` e `ledger_movements`; só o modelo Codex deve ser considerado para o futuro banco, depois de validar a regra de negócio.
- O RPC `create_entry` permite custódia `limited` e não verifica parceria ativa/atribuída; a regra local Antigravity é mais restritiva. A autorização do servidor tem de refletir titularidade e atribuição antes de abrir esses fluxos a usuários.
- O cofre atual aceita apenas versão de chave 1. Antes de guardar segredos reais, deve existir rotação/recuperação de chaves comprovada, política de convite/conta, RLS, observabilidade e restauração testada.
- A auditoria estática não demonstrou validação Supabase em runtime, backup/restore, hospedagem/domínio, SMTP de produção ou configuração Auth para convite.

## Modelo de colaboração

- **Pasta e Git:** Codex coordena a implementação e mantém o histórico de mudanças. Antigravity deve ser reaberto na mesma pasta após a reconciliação da fila antiga; não manter uma segunda cópia editável.
- **Canal de comandos:** requisitos, prioridades, decisões de domínio e coordenação são enviados pelo usuário neste chat Codex. Antigravity pode ser usado para inspeção visual ou uma mudança de UI delimitada na mesma branch, após o trabalho serial legado ser reconciliado. Só um agente escreve no mesmo conjunto de arquivos por vez.
- **Segundo cérebro:** o contexto confiável vive em arquivos versionados do projeto, não na memória privada de uma conversa: brief, regras, skills, glossário, ADRs/decisões, estado de implementação e instruções de desenvolvimento. Ambos os agentes leem a mesma raiz.
- **Integração de código:** manter Antigravity como autoridade visual. Trazer módulos de segurança e contratos Codex em mudanças pequenas, com mapeamento explícito de campos, estados e autorização. Preservar a worktree antiga e nunca copiar segredos ou `node_modules`.
- **Publicação:** separar preparação local, homologação e produção. O primeiro deploy permitido é um preview/homologação com dados sintéticos; produção depende de ambiente, configuração, testes de segurança/fluxo e autorização de liberação.

## Critérios de sucesso

- Existe uma única pasta fora de `Enigma Gestão (Estudo)` com Git, dependências documentadas e histórico revisável, criada sem alterar as pastas-fontes.
- Antigravity e Codex conseguem ler as mesmas regras, skills e documentos ao abrir essa pasta.
- A UI e os fluxos preservados do Antigravity continuam sendo a experiência padrão; interações críticas não dependem de um “modo Supabase” visual separado.
- A preparação Supabase é integrada sem schema duplicado, credenciais expostas, fallback silencioso para dados demo, ou permissões mais amplas que a regra da aplicação.
- O plano identifica o que já pode ser feito e quais itens do titular bloqueiam homologação ou produção real.

