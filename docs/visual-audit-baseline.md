# Auditoria visual de referência — snapshot inicial

Auditoria estática somente de leitura, executada em 2026-11-04 na raiz canônica, sobre src (40 arquivos; 28.261 linhas). O próprio script avisa que contagem é heurística; confirmar na interface antes de mudar código.

| Sinal observado | Contagem | Leitura inicial |
|---|---:|---|
| Emoji/Unicode como ícone | 2 | Verificar se são ícones funcionais ou conteúdo.
| Sombras avulsas | 2 | Pequena presença, não pede reformulação ampla.
| Texto/contêiner centralizado | 34 | Concentração em login, entradas e saques; revisar por intenção.
| Ícones/componentes associados a bibliotecas | 8 | Uso pontual do Lucide já existente.
| Fonte genérica | 48 | Muitos resultados em seeds, presets e export/test; inspecionar só a camada de tela.
| Travessão em texto | 39 | Em geral marcador de dado ausente; preservar quando melhora leitura.
| Placeholder | 81 | Label existe em 110 campos, 88 ligados por htmlFor; revisar associação restante manualmente.
| Janela nativa alert/confirm/prompt | 0 | Sem ocorrência no snapshot.
| div/span/tr clicável | 3 | Duas ocorrências em Conferência, uma no Estoque; converter para botão apenas se forem ações.
| Alvos pequenos/campos com texto pequeno | 0 | Nenhum caso detectado pela regra heurística.
| Animações/transições | 64 | Reduzir movimento precisa ser conferido com a preferência do sistema.
| Hex fixo em código de tela | 2.640 | Principal oportunidade para tokens graduais; inclui possíveis falsos positivos em estilos, mapeamentos de marca e estados.

O produto já usa identidade verde/navy e possui pouca repetição de cartões arredondados, pílulas e degradês. A direção é aperfeiçoar clareza e consistência preservando esse caráter, sem refazer o layout todo.

A execução abaixo da auditoria pode ser repetida com: node .agents/skills/tirar-cara-de-ia/scripts/auditar.mjs src --top 5
