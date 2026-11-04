# Visão da arquitetura observada e alvo

## Snapshot Antigravity

- `src/App.tsx`, `src/components/SidebarNav.tsx` e `src/screens/*`: navegação e experiência do produto a preservar.
- `src/domain/*`: tipos, regras de operação, cálculo, dados de demonstração e tema; avaliar por módulo antes de trocar semânticas.
- `src/context/EnigmaContext.tsx`: hoje concentra estado de UI, persistência demo, operações e regras; ponto de extração gradual de adaptadores.
- `server.ts` e `src/db/*`: servidor Express e rotas antigas de dados; revisar autorização e remover respostas que afirmem saúde/contagens inexistentes antes de expor a rede.
- `src/lib/supabase.ts`, Firebase, Drizzle e outros caminhos legados não são fonte de schema aprovada por si só.

## Alvo

Preservar a interface Antigravity e isolar acesso a dados atrás de contratos de domínio/serviços. O modo de demonstração usa seed sintético local e explícito; o backend persistente aplica o mesmo vocabulário e autorização sem alterar a navegação. A fundação Supabase do Codex será avaliada e adaptada após mapear os estados e operações reais da UI.

## Segurança e promoção

A autorização final fica no servidor e no banco com RLS. Cofres de credenciais precisam de política de acesso, step-up para leitura, rotação/recuperação e auditoria. Alterar endereço ou rede de destino exige aprovação e confirmação. Homologação e produção têm chaves, dados e projetos separados. Backup/restore precisa ser comprovado antes de dados reais.
