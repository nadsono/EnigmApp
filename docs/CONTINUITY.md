# Enigma — ponto único de continuidade

Atualizado em 5 nov 2026. Leia este resumo primeiro; depois abra só a referência necessária.

## Fonte oficial

- Código e decisões: `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção)`.
- Git local: branch `codex/server-hardening`.
- GitHub pretendido: `nadsono/EnigmApp` (privado). O endereço `origin` foi configurado neste checkout. A consulta ao GitHub mostrou repositório vazio (`size: 0`); nenhum arquivo foi enviado ainda.
- Índice no Second Brain: `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Second Brain\04 - Projetos\Enigma\Enigma — Registro do Projeto.md`. É um resumo com referências, não uma segunda cópia do código.
- O projeto de Produção ainda não aparece na lista de projetos salvos do Codex. A ferramenta disponível lista projetos, mas não oferece cadastro de uma pasta arbitrária.
- Esta pasta tem trabalho anterior versionado localmente e alterações novas ainda não commitadas. Não confundir com `Downloads\enigma---gestão-de-contas-e-capital`, com a pasta de Estudo, ou com árvores antigas do Antigravity.

## Como retomar sem reler conversas inteiras

1. Leia `AGENTS.md`, `PROJECT_CONTEXT.md` e este arquivo.
2. Leia somente a seção mais recente de `docs/STATE.md` e os arquivos citados nela.
3. Consulte `GLOSSARY.md` para termos do domínio e `docs/data-mapping.md` antes de mexer em contratos de persistência.
4. Registre decisões duráveis e o próximo passo aqui/ em `docs/STATE.md` ao fechar uma mudança grande. Faça checkpoint Git depois da revisão; não versionar segredos.
5. Use o histórico dos chats apenas para recuperar contexto que ainda não foi consolidado nestes arquivos.

## Produto e decisões duráveis

- Nome público: **Enigma**. Dados de demonstração devem ser sintéticos e identificáveis como demonstração.
- A base visual existente deve ser preservada e evoluída; não criar um “modo Supabase”. O sistema deve continuar demonstrável sem backend.
- Capital sugerido significa orçamento da próxima entrada. Pode ser manual ou automático e sempre editável; o cálculo não representa saldo global nem envia apostas/transações.
- Ativos, corretoras, redes, taxas e conversões precisam ser configuráveis por usuário/equipe. Não fixar BEP20/ERC20, não presumir compatibilidade de rede e nunca enviar transações.
- Dados de destino e credenciais exigem autorização, confirmação e histórico auditável. Não armazenar chaves privadas.
- Supabase e Vercel são etapas futuras de produção. Não aplicar migrations remotas nem publicar sem aprovação explícita.

## Entrega local em andamento — 5 nov 2026

- Plano aprovado: `docs/superpowers/plans/2026-11-05-enigma-ux-configuravel.md`; especificação: `docs/superpowers/specs/2026-11-05-enigma-alinhamento-ux-e-personalizacao.md`.
- Implementação local abrange preferências visuais, distribuição adaptativa de entradas, catálogo configurável de redes cripto e relatórios por data de liquidação.
- Revalidação em 5 nov: `npm run build`, `npm run lint` e 55 testes de domínio passaram. O build ainda avisa sobre `__dirname` no Vite e um chunk de 897 kB. A checagem de viewport menor não concluiu: a automação do Chrome expirou duas vezes; não declarar responsividade final verificada.
- Preview local da Produção foi aberto em `http://127.0.0.1:3002`; não assumir que porta/processo ainda esteja ativo sem verificar.
- A revisão no Antigravity ainda não começou: o briefing está em `docs/handoffs/2026-11-05-antigravity-review.md`, mas a janela minimizada impediu enviar a tarefa.
- As mudanças descritas continuam no working tree; revisar e separar os arquivos antes de criar commits. Nenhum `push` ocorreu.

## Segundo cérebro e grafo

- Os documentos técnicos desta raiz são a memória operacional compartilhada entre Codex e Antigravity quando ambos abrem esta mesma raiz; a nota no Second Brain aponta para eles.
- Grafo local criado em `graphify-out/` com extração `--code-only`: 66 arquivos de código, 556 nós, 1.642 ligações, 21 comunidades e 0 tokens de LLM. Documentos e imagens ficaram fora para reduzir custo; leia `docs/CONTINUITY.md`/Second Brain para decisões.
- O parser Graphify marcou `src/screens/ParceriasScreen.tsx` como extração parcial (erro de sintaxe do parser, linha 366); build e TypeScript passaram. Nove arquivos de teste/configuração não geraram símbolos. A folha `tokens.css` foi corretamente ignorada como potencialmente sensível.
- Use `graphify explain "EntradasScreen.tsx"` ou `graphify path "A" "B"` para consultas; rode `graphify update .` após alterações relevantes no código. A extração semântica com LLM não está habilitada por padrão.
- O checkout está na branch `codex/server-hardening`, rastreando `origin/codex/server-hardening`. Os commits `f233fbc`, `134ee58` e `b62f007` já foram enviados ao repositório privado `nadsono/EnigmApp`; o grafo, relatório, visualização e manifesto estão versionados.

## Próximo passo

1. Retomar QA visual responsiva quando o Chrome estiver disponível; não marcar larguras menores como verificadas até medir overflow em viewport reduzido.
2. Depois avançar com staging Supabase/Vercel, mantendo autenticação, isolamento, segurança e autorização de publicação como gates.
