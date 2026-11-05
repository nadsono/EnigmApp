# Enigma — briefing de UX, personalização e preparação para lançamento

Data: 5 de novembro de 2026.

Status: aprovado pelo usuário em 5 de novembro de 2026 para implementação local. Publicação e alterações remotas continuam sujeitas à liberação prevista no projeto.

## Origem e interpretação

O usuário gosta da aplicação atual e quer ampliá-la com escolhas de aparência e um fluxo mais adaptável à operação. As referências visuais são material para melhorar hierarquia, gráficos e interação, preservando as qualidades existentes. A marca pública é Enigma.

O usuário confirmou que Capital sugerido significa o valor destinado à próxima entrada. Banca total, saldo disponível e valor de uma entrada têm finalidades diferentes.

Foram consultados a análise do Surebet Engine, o procedimento reutilizável e amostras de quadros já extraídos da gravação. O vídeo inteiro não foi reanalisado nesta rodada. Valores, saldos, identidades e credenciais reais da gravação não devem ser transportados para dados de demonstração.

### Evidências no projeto atual

| Ponto | Estado encontrado | Consequência para a proposta |
| --- | --- | --- |
| Aparência | Há paletas por casa em src/domain/uiTheme.ts e muitas cores fixas nos componentes; não foi encontrado um gerenciador global claro/escuro/sistema | Criar um sistema de temas consistente, incluindo gráficos e estados de formulário |
| Capital de entrada | src/screens/EntradasScreen.tsx inicia o campo com 5.000,00 e oferece atalhos fixos de 1.000, 2.500 e 5.000 | Transformar valores de conveniência em preferências configuráveis, com sugestão explicável |
| Status das pernas | Uma coluna de 295 px contém todos os botões de resultado; a tabela permite rolagem horizontal | Adaptar o controle e a composição do formulário à largura disponível |
| Redes cripto | Saques possui poucas opções fixas; fichas e guias presumem BEP20/ERC20; Polygon já aparece em alguns campos livres | Usar catálogo compartilhado de ativos, redes e destinos, com compatibilidade explícita |
| Contas financeiras | O tipo BankAccount ainda reutiliza phoneDevice para rede e pixKey para endereço | Planejar contratos próprios antes de persistir esse modelo no Supabase |
| Marca | Topo e login usam Enigma, enquanto títulos e metadados ainda usam Enigma Gestão e outros complementos | Unificar a apresentação pública como Enigma |
| Dashboards | Há um painel inicial de resultado e capital; a revisão registrou divergência entre data de criação e liquidação e semântica inadequada em pontos SVG | Corrigir a base e ampliar interações de forma consistente |

### Fontes da operação

- Gravação: C:\Users\Baroli\OneDrive\Videos\Gravações de Tela\Gravando 2026-11-05-Operação Duplo.mp4.
- Análise: C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Second Brain\04 - Projetos\Surebet_Engine\docs\2026-11-05-estudo-da-operacao.md.
- Procedimento: C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Second Brain\05 - Conhecimento\Surebet\Operação de surebet — procedimento e registro.md.
- Estudo completo: C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Second Brain\05 - Conhecimento\Surebet\Estudo da operação — sessão de 04 e 05-11-2026.md.

O estudo mostra respostas de casas em momentos diferentes, alterações de preço, cálculo entre moedas e rejeição por saldo insuficiente. A amostra de aproximadamente 02h00 também mostra um seletor com várias redes. São evidências do fluxo observado naquela sessão, sem afirmar suporte atual de qualquer serviço.

## Prompt proposto para orientar o trabalho após aprovação

Atue no projeto Enigma como responsável por produto, UX e implementação. Evolua a aplicação existente para atender operações individuais e equipes, com aparência configurável, dados financeiros compreensíveis e controles que se adaptem ao espaço disponível.

Use o visual atual como ponto de partida. As referências de Planna, Flowra, Orbit e Strapp devem orientar hierarquia, densidade, interação e detalhamento. Preserve a utilidade dos fluxos existentes e a continuidade do trabalho.

### 1. Nome e identidade

Use Enigma como nome público em login, navegação, título do navegador, metadados e mensagens. O ponto da assinatura ENIGMA. pode continuar como recurso gráfico. Textos como Capital Desk, Grupo ou Gestão devem aparecer somente quando forem uma descrição útil, sem compor obrigatoriamente o nome.

Reúna as cores, tipografia, bordas, superfícies, foco e estados em uma base visual compartilhada. Harmonize o cabeçalho verde com o restante da interface, evitando a mistura involuntária de verdes e azuis estruturais.

### 2. Aparência e personalização

Inclua em Configurações uma área Aparência, disponível a todos os usuários:

- Tema do sistema, claro e escuro. A proposta inicial é Sistema como padrão, acompanhando mudanças do sistema operacional quando não houver escolha manual.
- Densidade confortável e compacta, mantendo textos e alvos de interação legíveis.
- Cores das casas em intensidade discreta ou com maior associação à marca, com possibilidade de voltar ao padrão.
- Prévia e restauração das preferências.

As preferências de aparência são individuais. Em uma equipe, o padrão da organização pode servir como ponto inicial, mantendo a escolha pessoal. A versão local deve persistir essas preferências e permitir posterior sincronização com o perfil autenticado.

O tema deve abranger tabelas, formulários, menus, modais, gráficos, foco, erros, campos desabilitados e estados vazios. Evite inversão genérica de cores e mudança brusca de tema durante o carregamento.

Use cor junto de texto e ícone. A identidade de uma casa não deve ser confundida com vitória, erro ou aviso. Registre origem e data quando uma cor for obtida de material oficial; casas desconhecidas recebem uma aparência neutra editável. Relação de clone ou provedor não determina automaticamente a identidade visual de uma marca.

### 3. UX das entradas e dos resultados por perna

Adapte a interface à largura disponível no componente. Zoom do navegador, resolução e tamanho da janela devem produzir uma composição utilizável, sem depender de detectar o percentual de zoom.

Em áreas largas, os botões de resultado podem continuar como atalho. Em áreas estreitas, use um menu suspenso semelhante ao seletor de conta. A lista de resultados é simples; não precisa de vários níveis de submenu. O resultado escolhido deve permanecer legível ao fechar o menu.

Reorganize as pernas em blocos ou cartões quando a tabela ficar estreita. Mantenha casa, conta, moeda, odd, stake, resultado e retorno associados à perna correta. Os comandos principais devem continuar acessíveis; uma barra de ações fixa pode ser usada se não cobrir os campos.

Garanta uso por teclado, foco visível, menus sem corte e manutenção do rascunho ao navegar. Resultado deve começar pendente. A escolha de uma perna não deve atribuir automaticamente o resultado da outra.

Diferencie a execução da perna — preparada, enviada, aceita, rejeitada ou com resposta incerta — de seu resultado financeiro posterior. Use preenchimento progressivo para que a rotina rápida não exija todos os detalhes do modo completo.

O Enigma registra a operação. Um cálculo ou registro local não demonstra aceitação por uma casa. Preserve as condições efetivamente aceitas, com comprovante ou confirmação manual, quando disponíveis.

### 4. Capital que acompanhe a operação

Apresente de forma distinta:

- Banca total sob gestão.
- Saldo livre das contas selecionadas, com moeda e data da última conferência.
- Valor destinado à entrada em edição.
- Stake de cada perna e valores efetivamente aceitos.

Substitua a dependência de atalhos fixos por preferências do usuário. Ofereça modo manual e uma sugestão automática opcional para novas entradas.

A sugestão deve considerar os saldos registrados das contas selecionadas, reservas já consideradas nesses saldos, limites configurados pelo usuário, moedas, cotação usada e arredondamento. Não desconte reservas duas vezes nem trate um saldo informado localmente como saldo consultado em tempo real na casa.

Explique a origem da sugestão e quando foi calculada. Se faltarem saldo, limite ou conversão, indique o que falta. Ao digitar um valor manualmente, respeite a escolha e ofereça atualização da sugestão de forma clara.

Recalcule rascunhos em modo automático quando suas entradas mudarem. Preserve stakes já aceitas, registros concluídos e conversões históricas. Um filtro de relatório por período não deve redefinir silenciosamente o saldo atual da operação.

### 5. Gráficos e interação com propósito

Amplie os dashboards com gráficos que respondam a perguntas operacionais e permitam abrir os registros de origem:

- Visão Geral: composição do capital, evolução do resultado e pendências que exigem ação.
- Performance: resultado por período, volume investido, custos e retorno, com definições claras.
- Caixa e Saques: distribuição por etapa, tempo em trânsito, valores previstos e efetivamente recebidos.
- Parcerias e Contas: disponibilidade, situação das contas e conferências pendentes.
- Financeiro e Equipe: composição dos custos e desempenho dentro das permissões do usuário.

Ofereça filtros compreensíveis, valores ao passar o mouse ou usar teclado, legenda acionável e acesso aos dados do gráfico. Alinhe cada série à data apropriada: criação, aceitação, liquidação ou recebimento. Informe qual critério está sendo usado.

Elimine repetição de indicadores quando não acrescentar contexto. Valores iguais em Banca e Casas podem estar corretos quando todo o capital está nas casas; a composição e os rótulos precisam explicar isso, sem alterar o cálculo para produzir números diferentes.

Permita priorizar ou recolher blocos e guardar preferências de exibição. Um Kanban pode servir às filas de tarefas; movimentar um cartão que tenha efeito financeiro exige a confirmação aplicável e registro no histórico.

Use dados sintéticos identificados para a demonstração. Períodos sem dados mostram estado vazio. Quantidade de gráficos e tamanho de página devem seguir a informação disponível, evitando preencher a tela com métricas decorativas.

### 6. Operação cripto configurável

Permita cadastrar corretoras, carteiras, ativos, redes e destinos. BNB Smart Chain, Ethereum, Polygon, Avalanche e outras redes são exemplos de catálogo, sujeitos à compatibilidade declarada de cada origem e destino.

Separe os conceitos de moeda/ativo, rede, conta, endereço e padrão de token. Um mesmo ticker não identifica sozinho um ativo em todas as redes. Preserve identificadores de rede e de ativo, endereço de contrato quando aplicável e memo/tag quando exigido.

Uma conta pode operar com vários ativos e destinos. A moeda usada na transferência pode ser diferente da moeda de saldo da casa; registre a conversão correspondente. Evolua os campos herdados de banco para contratos explícitos, preservando dados existentes durante a migração.

Na transferência, registre origem, destino, ativo, rede, valor bruto, taxas e suas moedas, conversão e sua origem/horário, valor líquido esperado, valor recebido e identificador da transação quando houver.

As opções dependem da operação e dos dois extremos. Permita que o usuário mantenha o cadastro de compatibilidade e a data de conferência. Compatibilidade desconhecida deve permanecer visível. Conversão ou ponte entre redes precisa ser uma etapa explícita quando utilizada; não selecione uma rota apenas por ter menor taxa.

Guias devem refletir a configuração escolhida pelo usuário e indicar quando a informação é manual. Evite instruções universais presas a uma corretora, ativo ou duas redes.

Preserve autorização, confirmação explícita e histórico para alterações de destino. Mantenha segredos protegidos e consulta/cópia autorizadas. Chaves privadas e frases de recuperação não fazem parte do cadastro.

### 7. Usuário individual e equipe

Um usuário individual deve poder configurar sua operação como titular, sem precisar criar membros fictícios. Preferências de aparência pertencem ao usuário; catálogo, regras e padrões compartilhados pertencem ao espaço de trabalho.

Torne ajustáveis casas, contas, corretoras, redes, moedas de referência, atalhos, limites pessoais, filtros e visualizações. Personalização não deve conceder acesso a dados ou ações fora das permissões.

Em equipe, respeite as responsabilidades de administrador, operador, sócio e aprovador conforme o modelo que for validado. No uso individual, a confirmação do titular e o histórico devem atender às mudanças autorizadas sem inventar uma segunda pessoa.

### 8. Ordem de entrega e preparação para lançamento

1. Validar este briefing, registrar a base atual e revisar as mudanças pendentes.
2. Corrigir as inconsistências conhecidas de datas, acessibilidade e TypeScript; consolidar marca e base de temas.
3. Melhorar o formulário de entradas e os gráficos por entregas pequenas, com demonstração de cada fluxo.
4. Definir os contratos de preferências, contas, ativos, redes, destinos e conversões antes de persistir o modelo.
5. Integrar Supabase para autenticação, persistência e autorização, preservando a experiência do produto.
6. Preparar staging na Vercel, validar o fluxo completo com dados fictícios e então realizar a liberação para usuários.

Supabase continua sendo o próximo marco de infraestrutura. Melhorias opcionais de dashboards podem seguir em entregas posteriores, sem condicionar o lançamento a um redesenho completo.

Versione os marcos com commits focados, registre decisões e o próximo passo, e revise as alterações pendentes antes de agrupá-las. A raiz canônica é Enigma Gestão (Produção). O remoto Git e os ambientes ainda precisam de configuração; não há backup remoto confirmado.

### 9. Critérios de aceitação

- Claro, escuro e Sistema funcionam em todas as áreas, com preferências preservadas.
- É possível editar e concluir uma entrada em janela estreita e nos zooms 50%, 75%, 100%, 125%, 150% e 200% no monitor de referência, sem perder os comandos principais. A redução de zoom não cria grandes espaços artificiais entre blocos.
- O resultado de uma perna continua independente das demais.
- A sugestão de capital acompanha os dados disponíveis e os limites do usuário, explica o cálculo e respeita valores manuais e aceitos.
- Os gráficos respondem aos filtros declarados e abrem registros coerentes com os totais mostrados.
- Uma operação configurada com outra rede compatível, como Polygon ou Avalanche, pode ser registrada sem textos ou defaults que a substituam por BEP20/ERC20.
- Um usuário individual consegue configurar e operar a aplicação; uma equipe respeita o acesso de cada membro.
- Destinos financeiros e credenciais continuam protegidos, com confirmação e auditoria onde aplicáveis.
- Histórico e relatórios preservam valores originais, moedas e conversões utilizadas.
- A marca pública aparece como Enigma e os fluxos de demonstração continuam utilizáveis.

## Propostas que ainda precisam de validação

1. Capital sugerido foi confirmado como orçamento da próxima entrada. A regra automática aprovada usa dados e limites configurados; não presume um percentual específico da banca.
2. Sistema como padrão de tema, densidade confortável e cores discretas foram escolhidos como proposta inicial.
3. Uma fonte automática de cotações ou saldos ainda não foi escolhida. Informações manuais precisam manter origem e horário.
4. Permanecem abertas no estudo da gravação as regras do operador para ordem de execução, resposta incerta/rejeição, equivalência de mercados e arredondamento entre moedas. Elas não devem ser inferidas da aparência das telas.
5. A relação entre marca de um sinal, domínio operado e provedor precisa de confirmação; não transformar semelhança em equivalência automática.

Próximo passo: executar o plano local em entregas verificáveis, mantendo separados os marcos de UX, contratos/persistência e liberação.
