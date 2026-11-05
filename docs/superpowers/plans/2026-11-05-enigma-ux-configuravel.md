# Enigma UX configurável — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or independent parallel implementers to implement this plan task-by-task. Track completion here.

**Goal:** entregar personalização local de aparência, entradas adaptáveis, redes configuráveis e uma base coerente de relatórios antes da persistência Supabase.

**Architecture:** manter React e a raiz de Produção ativa; preferências individuais ficam em providers/hooks com armazenamento local. Cálculos e catálogos recebem módulos puros. Configuração local é distinta de consulta externa; nenhum campo é apresentado como saldo/cotação em tempo real sem fonte.

**Tech Stack:** React 19, TypeScript, Tailwind 4, SVG, Node test runner já usado pelo projeto.

**Spec:** docs/superpowers/specs/2026-11-05-enigma-alinhamento-ux-e-personalizacao.md — aprovado pelo usuário; capital é orçamento da próxima entrada.

## Global Constraints

- A marca pública é Enigma.
- A raiz canônica é Enigma Gestão (Produção).
- Use dados sintéticos identificados para a demonstração.
- Preserve stakes já aceitas, registros concluídos e conversões históricas.
- Personalização não deve conceder acesso a dados ou ações fora das permissões.
- Preserve autorização, confirmação explícita e histórico para alterações de destino.
- Um escritor por conjunto de arquivos; preservar alterações anteriores e revisar o diff antes de versionar.
- Não publicar nem executar migrations remotas neste marco local.

## Review Focus

- Preferências de um usuário não vazam para outro; Sistema acompanha mudanças do SO.
- Temas preservam contraste em formulários, menus, gráficos e estados financeiros.
- Sugestão de capital considera moeda, saldo ausente/zero e reservas sem dedução dupla; edição manual e histórico são respeitados.
- Criação e liquidação em meses diferentes não desaparecem do relatório de liquidação nem alteram o saldo atual com o filtro.
- Rede personalizada persiste sem ser substituída por um default; escolha de rede não comprova compatibilidade nem executa transferência.

## Task 1 — Aparência individual e base de temas

Files: criar src/context/AppearanceContext.tsx, src/components/AppearanceSettings.tsx e src/styles/appearance.css; integrar em src/App.tsx, src/screens/ConfiguracoesScreen.tsx, src/index.css e src/domain/uiTheme.ts.

Interfaces: useAppearance retorna preferences { theme: system|light|dark, density: comfortable|compact, houseColors: discreet|brand }, resolvedTheme, setPreferences(patch), resetPreferences(). Provider fica dentro de EnigmaProvider e usa identidade autenticada.

- [ ] Implementar persistência por usuário, fallback e reação ao SO.
- [ ] Oferecer controles em Configurações para todos os papéis.
- [ ] Mapear explicitamente superfícies/cores existentes para tokens de tema sem filtro invert; respeitar cores semânticas e casas.
- [ ] Verificar alternância, persistência, troca de usuário e legibilidade visual.

## Task 2 — Entradas adaptáveis e capital da próxima entrada

Files: src/screens/EntradasScreen.tsx; criar src/domain/operationCapital.ts e hook/componente de preferências se necessário.

Interfaces: módulo puro calcula sugestão a partir de contas/pernas/moedas/cotações e limite opcional; retornar valor e justificativa/pendências. Preferências por usuário para manual/automático e atalhos. Sem alterar saldos/ações financeiras no provider.

- [ ] Remover pressuposto de capital fixo e resultados antecipados.
- [ ] Menu de resultado em largura estreita, atalhos em largura ampla e ações alcançáveis.
- [ ] Atualizar somente rascunhos em automático; preservar entrada em edição e valor manual.
- [ ] Cobrir limites de saldo, zero, moeda, arredondamento, conta repetida e mudança de contexto com testes puros significativos.

## Task 3 — Catálogo local de redes

Files: criar src/domain/cryptoNetworks.ts, hook/catalog manager; editar src/screens/SaquesScreen.tsx, src/screens/ParceriasScreen.tsx, src/components/CatalogManagerPanel.tsx e textos em src/domain/versionPresets.ts. Root integra imports nas Configurações após Task 1.

- [ ] Catálogo extensível com Ethereum, BNB Smart Chain, Polygon, Avalanche, Arbitrum, Optimism e Tron separados.
- [ ] Cadastrar/ativar redes e preservar valores legados/desconhecidos.
- [ ] Seletor por operação e textos neutros, sem default silencioso BEP20.
- [ ] Guardar metadados da rota escolhida nos registros locais através de campos opcionais compatíveis; root coordena mudanças em types/context.
- [ ] Preservar confirmação/auditoria existente em alteração de destino.

## Task 4 — Relatórios, marca e qualidade integrada

Files: src/context/EnigmaContext.tsx, src/components/dashboard/OperationalAnalytics.tsx, src/screens/VisaoGeralScreen.tsx, src/domain/reporting.ts; index.html, metadata.json, cópia pública em SidebarNav/Login; erros TypeScript conhecidos.

- [ ] Separar dados de saldo atual dos dados por período e usar liquidação para resultado realizado.
- [ ] Corrigir tooltip/foco/SVG e permitir abrir operação a partir do gráfico; nenhum resultado arbitrário em falta de data.
- [ ] Unificar marca pública, revisar repetições e densidade sem apagar contexto.
- [ ] Compilar e checar tipos; testes puros focados; inspecionar temas e entradas no browser.
- [ ] Revisar diffs e registrar commits focados, mantendo alterações não relacionadas fora.

## Próximos marcos após esta entrega

- Expandir dashboards por grupo, identidade das casas com fontes verificadas e preferências de visualização.
- Contratos explícitos de contas/ativos/destinos, execução por perna e câmbio; mapa para migrations Supabase.
- Auth/persistência/autorização em staging e preparação Vercel após configuração e liberação.

## Decisões de execução

- Reutilizar branch codex/server-hardening e pasta canônica, pois é a raiz do preview ativo e o usuário pediu continuidade nessa pasta.
- Guardar cópias locais anteriores dos arquivos tocados em .git/enigma-checkpoints; não transformar alterações antigas não revisadas em um commit geral.
- Trabalhos independentes podem ocorrer em paralelo; integração, checagens e Git ficam com o agente principal.
