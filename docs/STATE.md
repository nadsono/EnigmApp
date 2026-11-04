# Estado do projeto — 4 nov 2026

## Marco atual

- A consolidação foi aprovada: uma pasta de produção compartilhada, mantendo o produto Antigravity e integrando futuramente a fundação Supabase do Codex.
- Pasta canônica: C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção).
- Snapshot inicial do Antigravity contém 102 arquivos versionados, 1,82 MiB, commit 7cf559bcf8ebfd5ba411f6b38620d2e44f9a70fd, branch main limpa.
- Pastas de origem não foram editadas nem apagadas. A worktree Codex/Supabase permanece com alterações locais não commitadas e deve ser preservada.
- Antigravity está ativo na pasta antiga, em uma tarefa de responsividade/zoom alto, com 6 prompts ainda na fila serial. Não abrir esta raiz como segundo escritor até finalizar e reconciliar.

## O que foi preparado

- Contexto e regras comuns para agentes: AGENTS.md, PROJECT_CONTEXT.md e .agents/rules/project.md.
- Skills Enigma UI/UX, ui-taste e tirar-cara-de-ia versionadas; licenças/atribuições preservadas.
- Design de consolidação, decisão arquitetural, plano de workspace, plano UI/demo, plano Supabase/lançamento e auditoria visual base registrados em docs.
- A auditoria visual em src contou 44 arquivos e 29.213 linhas. O resultado mais expressivo foi 2.640 hex fixos (heurística; requer revisão por tela). O estilo existente usa verde/navy, quase não usa sombras, degradês ou cartões arredondados, então não pede um remake integral.

## Limites atuais

- O snapshot mantém a UI, telas, contexto, seeds sintéticos, servidor/API, manifests e lockfiles. Foram excluídos caches, arquivos .env*, chaves/certificados, cópias de ferramenta e migrations/schemas Antigravity da raiz. Os módulos de aplicação em src/database foram preservados porque a UI importa esses repositórios; o helper migrations.ts é legado e não constitui a história Supabase ativa.
- firebase-applet-config.json permaneceu por ser configuração de cliente importada diretamente pela aplicação; verificar projeto e restrições antes de homologar.
- server.ts contém rotas sem autenticação/autorização e respostas de saúde com estatísticas fictícias se a base falhar. Ainda não é seguro para exposição online.
- src/lib/supabase.ts envia password_plain_fallback em sincronização. Bloquear conexão real até substituir e revisar a implementação.
- Não conectamos banco remoto, não aplicamos migrations remotas e não publicamos a aplicação.
- O servidor local do Antigravity segue ativo; não foi iniciado ou interrompido pelo Codex.

## Próximo passo

Aguardar o fim da fila serial no Antigravity e reconciliar cada alteração aprovada, sem sobrescrever a base nova. Depois abrir a pasta canônica na IDE e iniciar o hardening local dos endpoints/fallbacks e o mapeamento de domínio para os contratos/migrations Supabase Codex.

## Pendências de produto/lançamento

1. Reconciliar os 6 prompts ainda em fila após finalizar o prompt ativo.
2. Remover autenticação ausente e fallbacks falsos da API; nunca enviar/salvar senha em texto plano.
3. Formalizar corretoras, carteiras, redes, taxas, unidade de saldo, origem/data da cotação e fluxo de autorização de destino.
4. Revisar contratos/migrations, RLS, cofres, step-up, rotação/recuperação, bootstrap e convite.
5. Preparar homologação com dados fictícios, observabilidade e backup/restore; separar chaves/instâncias de homologação e produção.
6. A publicação real depende de configuração do titular e autorização explícita de liberação.

