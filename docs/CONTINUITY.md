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
- O executável Graphify existe, mas `graphify-out/graph.json` não existe nesta raiz. Conversas e pastas locais não entram automaticamente no grafo nem no GitHub.
- Gerar um grafo cria arquivos locais em `graphify-out/`; só fazer isso depois de confirmação do usuário. Excluir `.env`, credenciais, dados de pessoas e saídas que contenham segredos.
- Após criar/revisar commits, sincronizar a branch com o repositório privado. A conexão GitHub do app reconhece o repo, mas o Git local ainda não conseguiu autenticar no remoto; não tente contornar credenciais.

## Próximo passo

1. Terminar revisão visual e de código do working tree, preservar alterações anteriores e identificar qualquer arquivo que não deva ser versionado.
2. Criar commits locais focados para os arquivos aprovados e manter este resumo atualizado.
3. Confirmar a autenticação do Git local, então enviar a branch para o repositório privado e verificar que todas as pastas esperadas aparecem no remoto.
4. Com autorização do usuário, gerar e atualizar o grafo Graphify, revisar seu conteúdo e decidir se `graphify-out/` será versionado ou só reconstruído localmente.
5. Só depois avançar com staging Supabase/Vercel e liberação de produção.
