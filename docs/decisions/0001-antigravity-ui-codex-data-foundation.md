# Decisão 0001: interface Antigravity com fundação de dados Codex

- **Status:** aprovada pelo usuário em 2026-11-04.
- **Contexto:** existem dois projetos em pastas separadas. Antigravity tem UI/fluxos mais completos; Codex possui trabalho Supabase e segurança ainda pendente de revisão.
- **Decisão:** desenvolver em `Enigma Gestão (Produção)`, manter UI e fluxos Antigravity como experiência do produto e integrar seletivamente contratos, autenticação, autorização, migrations e cofres do Codex. Supabase é infraestrutura interna, sem modo visual separado.
- **Consequências:** mapear entidades e estados antes de conectar; não misturar schemas homônimos incompatíveis; preservar as pastas de origem; reconciliar a fila serial antiga; documentar contexto neste repositório.
- **Liberação:** a preparação local e homologação sintética podem avançar. Aplicação remota de migrations, dados reais e publicação de produção exigem configuração e liberação explícita.
