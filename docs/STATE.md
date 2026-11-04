# Estado do projeto — 4 nov 2026

## Marco atual

- A consolidação foi aprovada: uma pasta de produção compartilhada, mantendo o produto Antigravity e integrando futuramente a fundação Supabase do Codex.
- Pasta canônica: C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção).
- Snapshot inicial do Antigravity contém 102 arquivos versionados, 1,82 MiB, importados no commit 7cf559bcf8ebfd5ba411f6b38620d2e44f9a70fd. A documentação de consolidação foi registrada depois na branch main.
- Pastas de origem não foram editadas nem apagadas. A worktree Codex/Supabase permanece com alterações locais não commitadas e deve ser preservada.
- Antigravity continua ativo na pasta antiga, trabalhando na ficha da parceria; na última leitura, o agente estava consultando EnigmaContext.tsx. Resta um prompt na fila, sobre transições de botões acionadas ao rolar a página. Não abrir esta raiz como segundo escritor até finalizar e reconciliar.
- A branch `codex/server-hardening` contém o commit de hardening `af96a65`; as mudanças do seletor horizontal em EntradasScreen.tsx estão em andamento nessa mesma branch.

## O que foi preparado

- Contexto e regras comuns para agentes: AGENTS.md, PROJECT_CONTEXT.md e .agents/rules/project.md.
- Skills Enigma UI/UX, ui-taste e tirar-cara-de-ia versionadas; licenças/atribuições preservadas.
- Design de consolidação, decisão arquitetural, plano de workspace, plano UI/demo, plano Supabase/lançamento e auditoria visual base registrados em docs.
- A auditoria visual em src contou 44 arquivos e 29.213 linhas. O resultado mais expressivo foi 2.640 hex fixos (heurística; requer revisão por tela). O estilo existente usa verde/navy, quase não usa sombras, degradês ou cartões arredondados, então não pede um remake integral.

## Limites atuais

- O snapshot mantém a UI, telas, contexto, seeds sintéticos, servidor/API, manifests e lockfiles. Foram excluídos caches, arquivos .env*, chaves/certificados, cópias de ferramenta e migrations/schemas Antigravity da raiz. Os módulos de aplicação em src/database foram preservados porque a UI importa esses repositórios; o helper migrations.ts é legado e não constitui a história Supabase ativa.
- firebase-applet-config.json permaneceu por ser configuração de cliente importada diretamente pela aplicação; verificar projeto e restrições antes de homologar.
- `server.ts` agora responde HTTP 503 em todas as rotas `/api` até autenticação, autorização, validação e handlers auditáveis existirem; o servidor de desenvolvimento escuta apenas em `127.0.0.1`.
- `src/lib/supabase.ts` não sincroniza usuários ou catálogo pelo navegador e não envia senha. O status de saúde fica offline quando o backend não está configurado ou indisponível.
- O gerador de SQL em `src/database/migrations.ts` foi ajustado para não criar coluna de senha/hash no perfil e não exportar senha, hash, nem senha padrão. O seed é explicitamente sintético e não serve para bootstrap de produção.
- Seeds locais ainda contêm credenciais fictícias para o login de demonstração. Isso é exclusivamente modo local; o fluxo de Auth real ainda precisa ser integrado antes de qualquer uso com pessoas ou dados reais.
- Não conectamos banco remoto, não aplicamos migrations remotas e não publicamos a aplicação.
- O servidor local do Antigravity segue ativo; não foi iniciado ou interrompido pelo Codex.

## Próximo passo

Enquanto a fila serial segue no Antigravity, concluir apenas revisões locais que não mexem na UI nem na pasta de origem. Depois reconciliar cada alteração visual aprovada na raiz canônica e iniciar a integração de Auth e persistência com mapeamento explícito de domínio, RLS e trilha de auditoria.

## Pendências de produto/lançamento

1. Reconciliar o prompt de transições que resta na fila após finalizar a tarefa ativa.
2. Concluir hardening dos serviços e substituir login local de demonstração por Supabase Auth antes de uso com pessoas ou dados reais.
3. Formalizar corretoras, carteiras, redes, taxas, unidade de saldo, origem/data da cotação e fluxo de autorização de destino.
4. Revisar contratos/migrations, RLS, cofres, step-up, rotação/recuperação, bootstrap e convite.
5. Preparar homologação com dados fictícios, observabilidade e backup/restore; separar chaves/instâncias de homologação e produção.
6. A publicação real depende de configuração do titular e autorização explícita de liberação.

