# Supabase e preparação de lançamento — plano

> **Para agentes:** executar este plano tarefa a tarefa; nenhuma aplicação remota de schema ou liberação de produção está autorizada por este plano.

**Objetivo:** conectar a aplicação única à base Supabase com autenticação, autorização e persistência coerentes com os fluxos preservados do Antigravity e prepará-la para homologação segura.

**Arquitetura:** mapear a UI e as regras existentes para os contratos/migrations revisados na worktree Codex. Preservar demo local sintética como ambiente explícito, desacoplar o acesso aos dados do contexto de UI e manter autorização no servidor/RLS. Não fundir schemas Antigravity e Codex nem criar uma experiência “modo Supabase”.

**Tecnologias:** React, TypeScript, Supabase Auth/Postgres/RLS/Edge Functions, migrations versionadas, ferramentas de deploy a decidir após preparação local.

**Especificação:** docs/superpowers/specs/2026-11-04-enigma-producao-unificada-design.md; contexto em PROJECT_CONTEXT.md e docs/architecture/overview.md.

## Restrições globais

- Supabase é a camada de dados da mesma aplicação, sem modo visual separado.
- Manter cópia de trabalho Codex existente intacta até revisar e portar cada alteração.
- Nunca copiar valores secretos para frontend, logs, contexto, exports ou documentação.
- Não armazenar senhas em texto plano, senhas de casas como fallback em banco, nem chaves privadas de carteiras.
- Negar por padrão; aplicar tenant/organização e papel na camada de servidor e RLS.
- Alterações de credencial ou destino financeiro exigem autorização, confirmação e evento auditável.
- Homologar com dados fictícios; projeto remoto, chaves, migration remota ou produção requerem configuração e liberação do titular.

## Foco da revisão

- Usuário sem organização ativa ou membership revogada: não acessar dados de outro tenant.
- Papel operador, aprovador e administrador: conceder apenas operações do seu escopo, incluindo limites e atribuições.
- Credencial e endereço de carteira: leitura sem step-up ou troca não aprovada deve ser negada e auditada.
- Valores entre USDT/BRL e outras moedas: preservar unidade original, FX usado, horário/origem e regra de arredondamento.
- Erro de rede/backend: informar estado indisponível, nunca responder com status online ou contagens fictícias.

---

### Tarefa 1: Inventariar os artefatos Codex e diferenças do domínio

**Arquivos:** src/domain/* e src/context/EnigmaContext.tsx da base canônica; contratos, migrations, Edge Functions e documentos na worktree Codex

- [ ] Identificar contratos e migrations candidatos sem alterar a worktree de origem.
- [ ] Mapear entidades/estados: operador, aprovador, parceria, titular, casa, corretora, carteira, rede, entrada, saque, ledger, custo e câmbio.
- [ ] Mapear estados da UI aos contratos; apontar estados sem operação equivalente, sem inventar conversões automáticas.
- [ ] Confirmar migration history ativa única e listar os schemas legados que permanecerão apenas como arquivo de referência.
- [ ] Produzir tabela de mapeamento e lista de gaps em docs/data-mapping.md.

### Tarefa 2: Corrigir limites de segurança conhecidos

**Arquivos:** migrations e RPCs revisadas; Auth/Edge Functions; server.ts e src/lib/supabase.ts apenas conforme necessário

- [ ] Revisar e fechar endpoints de servidor sem autenticação/autorização antes de permitir acesso externo.
- [ ] Remover fallback que sinaliza saúde ou estatísticas simuladas como se fossem estado do banco.
- [ ] Revisar convite, onboarding e bootstrap inicial de administrador, inclusive falhas parciais.
- [ ] Exigir membership/tenant e papel nas rotas, RPCs e políticas RLS; verificar atribuição e status ativo de parceria antes de operação.
- [ ] Eliminar armazenamento/fallback de senha em texto simples e revisar exportação, logs e cópia de credenciais.
- [ ] Exigir step-up e auditoria para revelar segredo ou alterar destino; adicionar estratégia comprovada de rotação/recuperação do cofre antes de dados reais.

### Tarefa 3: Delimitar adaptadores de persistência sem mudar a UI

**Arquivos:** novos contratos/adaptadores sob src/data/ e src/services/; integração delimitada de src/context/EnigmaContext.tsx

- [ ] Definir interface de repositório consumida pelo contexto e implementações explícitas local-demo e Supabase.
- [ ] Manter seed/demo sintético local se não houver configuração; não misturar dados conectados com fallback silencioso.
- [ ] Preservar interação e estados visuais Antigravity, expondo erro/sincronização de forma discreta e compreensível.
- [ ] Cobrir CRUD e operações gradualmente, começando por módulos simples; tratar entradas, caixa, saque e conciliação como ledger/idempotência, não como update de saldo isolado.
- [ ] Documentar resolução de conflitos, idempotência, retries, estados pendentes e compensações.

### Tarefa 4: Integrar detalhes cripto e destino de transações

**Arquivos:** domínio, contratos, schema revisado, tela de Caixa/Saques/Parcerias

- [ ] Modelar corretora/carteira de custódia, moeda, rede, endereço, taxa estimada/real, valor original, câmbio aplicado, timestamp e origem do câmbio.
- [ ] Separar endereço de depósito de endereço de retirada e validar rede compatível; impedir mudança implícita de rede/endereço.
- [ ] Não depender de cotação ao vivo sem fonte e timestamp; armazenar taxa efetivamente usada para reconciliar o lançamento.
- [ ] Exigir confirmação explícita e registro de autor/aprovador antes de ativar novo destino financeiro.
- [ ] Retirar referências de “recebido no banco” dos fluxos quando a unidade for carteira/exchange, sem alterar relatórios históricos sem conversão aprovada.

### Tarefa 5: Homologação e publicação

**Arquivos:** .env.example seguro, README, configuração de deploy, documentação operacional e checklist de homologação

- [ ] Escolher hospedagem e separar projeto Supabase de staging e produção.
- [ ] Configurar secrets exclusivamente no painel/secret store do provedor; não transmitir ou versionar chaves.
- [ ] Configurar Auth invite-only, redirect URLs, SMTP, domínio e política de sessão.
- [ ] Verificar backup/restauração, logs sem dados sensíveis, alertas de erro e estratégia de rollback.
- [ ] Revisar a aplicação inteira em homologação apenas com dados sintéticos e corrigir erros observados.
- [ ] Reunir aprovação final e instruções para o titular completar chaves/contas no painel do provedor antes de publicação real.
- [ ] Não executar testes automatizados, aplicar migrations remotas ou publicar produção sem solicitação e configuração explícitas.
