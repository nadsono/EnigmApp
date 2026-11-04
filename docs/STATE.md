# Estado do projeto — 4 nov 2026

## Marco atual

- A consolidação foi aprovada: uma pasta de produção compartilhada, mantendo o produto Antigravity e integrando futuramente a fundação Supabase do Codex.
- Pasta canônica: `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção)`.
- Projeto de origem Antigravity permanece em `Enigma Gestão (Estudo)` e não deve ser alterado pelo Codex durante a cópia.
- A worktree Codex/Supabase possui alterações locais ainda não revisadas; preservar intacta até o mapeamento.
- Na última inspeção, Antigravity reportava uma tarefa ativa e dez mensagens seriais em fila na pasta antiga. A nova raiz não deve ser aberta como segundo escritor até a fila concluir e as diferenças serem reconciliadas.

## Snapshot e limites

- Snapshot inicial copiado de: `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Estudo)\Google IA Studio\enigma-gestão-GoogleIAStudio-v1`.
- Foram excluídos dependências/builds/caches, arquivos `.env*`, diretórios de esquema/migrations Antigravity (`database`, `drizzle`, `supabase`) e cópias versionadas. A pasta original permanece intacta.
- `firebase-applet-config.json` é configuração client-side preexistente; não é segredo de servidor, mas aponta para integração externa e requer decisão antes de homologação.
- Código de API/servidor do snapshot ainda requer revisão de autenticação/autorização antes de ser exposto online. A consolidação não o torna seguro para produção.
- Supabase ainda não foi conectado ou aplicado remotamente.

## Próximo passo

Conferir a origem e o inventário do snapshot, inicializar Git na pasta canônica e revisar o baseline. Depois, aguardar e reconciliar cada alteração concluída na fila Antigravity antes de abrir esta raiz nela. Em seguida, mapear domínio e autorização da UI para a fundação Supabase preservada no Codex.

## Pendências de produto/lançamento

1. Reconciliar os prompts ainda em fila no Antigravity.
2. Auditar rotas do servidor, fallback de saúde com dados fictícios, credenciais e conteúdo exportado.
3. Formalizar os estados de corretoras/carteiras, redes, moedas, taxa/FX e autorização de destinos.
4. Revisar contratos, migrations, RLS, cofres, rotação/recuperação, autenticação e onboarding do primeiro administrador.
5. Preparar homologação sintética, observabilidade, backup/restore, domínio e e-mail; produção exige configuração e liberação do titular.
