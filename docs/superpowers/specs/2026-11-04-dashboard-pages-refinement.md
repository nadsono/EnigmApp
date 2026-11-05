# Navegação contínua e páginas completas por rolagem

## Objetivo

Fazer cada subtela dos grupos com várias abas ocupar uma seção legível de rolagem contínua, com navegação que acompanha a seção visível. Expandir resumos e gráficos com dados já existentes, mantendo a identidade e os fluxos da interface Antigravity.

## Evidência e contexto

- O usuário esclareceu que queria uma sequência vertical, com uma tela completa por rolagem e separadores entre telas; Resumo e Performance não deveriam virar páginas isoladas.
- `ScrollspyScreenGroup` já implementa âncoras, rolagem suave, atualização da aba ativa e separadores. Hoje só o grupo Financeiro usa esse componente; Visão Geral e Performance são renderizadas isoladamente.
- `SidebarNav` define quatro grupos com várias subtelas: Visão Geral (2), Caixa & Saques (4), Parcerias & Contas (2) e Financeiro & Equipe (2 para não operadores). Entradas tem uma única subtela.
- O preview antigo roda da pasta de Estudo em `0.0.0.0:3001`; a raiz Produção usa `127.0.0.1:3002` e porta HMR `24679`. O `vite.config.ts` da raiz contém instrução para preservar o comportamento de file watching; ele não deve ser alterado.
- O monitor de referência desta sessão mede 1562 × 1155 px. O produto continua usando dados sintéticos.

## Direção

- Usar rolagem contínua para os grupos com várias subtelas: Visão Geral/Performance, Caixa & Saques, Parcerias & Contas e Financeiro/Equipe. Manter o filtro por papel, inclusive a restrição de Equipe para operadores.
- Manter Entradas como tela própria, pois o grupo tem uma subtela. Não transformar a aplicação inteira em uma página única.
- Cada seção deve ter altura mínima próxima à área útil sob o cabeçalho fixo e crescer quando o conteúdo exigir; nunca cortar formulários, tabelas ou controles para caber artificialmente em um viewport.
- Resumo Geral e Minha Performance devem distribuir os blocos existentes pelo espaço vertical disponível, sem ampliar valores nem criar dados para ocupar a tela.
- Cliques nas subtelas e nos separadores devem levar à seção correspondente; a rolagem manual deve manter a subtela ativa sincronizada.
- Dar mais respiro e usar gráficos/resumos somente quando derivarem de dados disponíveis. Preservar estados vazios claros e não criar resultados fictícios para preencher espaço.
- Preservar paleta verde/navy e neutros. Não introduzir Kanban sem um fluxo real de etapas nem alterar `vite.config.ts`.
- Manter o servidor Antigravity da pasta de Estudo em 3001. O preview da raiz Produção usa 3002; a porta HTTP e a porta HMR precisam permanecer distintas.

## Critérios de aceite

- Cada grupo com várias subtelas percorre suas seções em uma página contínua; a subtela ativa acompanha cliques e rolagem.
- As seções usam o monitor de referência com boa hierarquia e espaçamento, crescem quando necessário e não cortam conteúdo nem geram rolagem horizontal.
- As telas mantêm dados, formulários, tabelas e permissões atuais. Gráficos usam somente métricas derivadas da demonstração.
- O servidor antigo de Estudo continua intacto em 3001; Produção responde separadamente em 3002 e usa HMR em 24679 sem interferir no Vite antigo.
- Nenhum dado real, migration remota, publicação ou alteração na pasta antiga é introduzido.
