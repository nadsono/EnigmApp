# Mapeamento do domínio e contratos de dados

> **Estado:** revisão local em 2026-11-04. Este documento orienta a integração; não é uma migration aprovada e não autoriza acesso a banco remoto.

## Fontes avaliadas

- **Domínio de produto:** `src/domain/types.ts`, regras de `src/domain/ledger.ts` e fluxos de `src/context/EnigmaContext.tsx` na raiz canônica.
- **Referência de UI:** código Antigravity reconciliado por comparação de arquivos. A pasta antiga não tem metadados Git, então não há commit de origem para fixar.
- **Candidato Supabase:** worktree `codex/supabase-integration`, com commit-base `152589e` e alterações locais ainda não commitadas na revisão. Suas migrations e adaptadores são material de análise, não autoridade final.
- **Referências legadas, sem autoridade para execução:** `database/`, `drizzle/` e `supabase/migrations/20261028…` da pasta antiga Antigravity; `src/db/schema.ts` e `src/database/migrations.ts` da raiz canônica.

Não foi verificada a existência de schema aplicado em projeto remoto. Nenhuma migration foi executada.

## Direção operacional

O contexto atual do produto é de casas internacionais e ativos digitais. Para novos fluxos, recomenda-se substituir o cadastro operacional centrado em bancos por uma entidade de custódia que possa representar corretora ou carteira custodial/autocustodial, vinculada a um ou mais ativos e redes. O fluxo de bancos não deve ser reaproveitado como se endereço de carteira, rede e moeda fossem campos equivalentes a uma conta bancária.

Se houver histórico bancário que precise ser preservado, mantê-lo como dado legado consultável até uma decisão de migração. Não criar novos registros bancários nos fluxos cripto. A natureza internacional de uma casa não presume autorização regulatória; qualquer classificação regulatória precisa ter fonte e data de revisão próprias.

## Mapeamento por entidade

| Conceito | Modelo atual da aplicação | Candidato Supabase observado | Gap ou regra de integração |
|---|---|---|---|
| Organização | `UserProfile.companyId`; não existe associação explícita de vários membros a uma organização no estado da UI. | `organizations` e `organization_members`, com papel e status por vínculo. | Usar `organization_id` como limite de cada registro empresarial e validar membership ativa no servidor e RLS. Não confiar em `companyId` enviado pelo navegador. |
| Identidade e autorização | `UserProfile` tem `admin`, `operador` e `socio`; a autenticação demonstrativa é local. | Identidade em Supabase Auth e papel em `organization_members` (`admin`, `operator`, `manager`). | Não mapear `socio` automaticamente para `manager` nem assumir que equivale a `aprovador`. Definir matriz de ações, aprovação e atribuição antes de migrar contas. Senhas/hash não pertencem ao perfil. |
| Titular e parceria | `Partnership` mistura dados pessoais do titular, estado operacional, operador, custos de criação, pagamentos e histórico de atribuições. | `partnerships` contém campos operacionais básicos e associação a `organization_id`. | O candidato não cobre todo o cadastro atual, histórico de atribuições ou campos pessoais. Separar acesso a CPF, nascimento, endereço e contatos; armazenar apenas o necessário. A ficha demo permite endereço opcional no cadastro direto e mantém observações apenas operacionais. |
| Casa e grupo de clones | `HouseCatalogItem` contém nome, grupo, categoria, verificação, stake mínima e prazo de saque. | `house_accounts.platform` identifica a plataforma como texto; não há catálogo equivalente no núcleo observado. | Manter catálogo de casas e grupo de clones distintos de conta e corretora. Rollover, requisitos de verificação e restrições devem ser versionados por casa e data, sem inferir validade regulatória. |
| Conta de casa | `HouseAccount` liga parceria e casa, guarda status operacional, login, saldo, moeda opcional e notas. | `house_accounts` guarda dados operacionais; credencial é candidata a vault restrito. | Não migrar `passwordSecret` como texto. Separar segredo, saldo e estado operacional; `pronta`, `em_uso`, `aguardando_saque` e `aguardando_deposito` não se convertem diretamente em `active`, `limited` ou `blocked`. |
| Corretora/carteira e ativo | `BankAccount` e `BankCatalogItem` representam bancos; ainda não há domínio completo para corretora, carteira, ativo e rede. | `custody_accounts` diferencia banco, corretora, autocustódia e casa; `account_assets` associa moeda e rede. | Para novos fluxos cripto, usar custódia + ativo + rede, sem tratar ticker como identificador suficiente. USDT em Ethereum e USDT em BNB Smart Chain são posições distintas. Revisar a lista fechada de redes e a precisão decimal suportada antes de adotar o schema. |
| Destino de recebimento | `pixWithdrawals` e `pixPayments` são campos textuais genéricos dentro da parceria; `withdrawalNetwork` é opcional na ficha demo. | Destinos cifrados e versionados em migration complementar do candidato; eventos de alteração registram histórico. | Substituir os campos genéricos por destinos tipados, associados a ativo/rede, separados entre depósito e retirada. A tela demo exige autorização, confirmação explícita e registra os nomes dos campos alterados sem gravar valores no histórico; a heurística de endereço cripto serve apenas para orientar a rede e não valida endereço. Essas proteções locais não são uma barreira de segurança de servidor. Nunca coletar chave privada ou frase-semente. |
| Entrada e pernas | `BetEntry` contém modo rápido/detalhado, operação, estados de resultado e conciliação; `BetLeg` contém casa, conta, odd, stake, resultado e retorno. | `entries` e `entry_legs` mantêm operação e pernas; a perna candidata pode registrar ativo e snapshot de cotação. | Preservar o fluxo rápido como rascunho incompleto até detalhamento; não inventar resultado. Mapear `parcial` versus `half_green`/`half_red` explicitamente. A moeda do stake/retorno precisa ser inequívoca por ativo. |
| Depósito e transferência | `DepositTransfer` exige `originBankId` e mistura depósito em casa com transferência entre bancos. | Há movimentos de razão e comandos financeiros; não foi identificada entidade de depósito/transferência equivalente no núcleo revisado. | Modelar origem, destino, ativo, rede, taxa e confirmação sem reutilizar campos bancários. Distinguir transferência solicitada, enviada, confirmada, devolvida e em conciliação. |
| Saque | `Withdrawal` usa `destinationBankId`, `amount`, uma tarifa e estados de casa/banco. | `withdrawals` usa ativo de origem/destino, custódia, versão do destino, taxa de corretora, taxa de rede, spread e snapshot de cotação. | O candidato se aproxima do fluxo cripto, mas não cobre exatamente `em_transito` e `devolvido_casa`; definir transições e estorno sem apagar o histórico. Diferenciar taxa estimada da taxa efetivamente cobrada. |
| Custos | `CostRecord` guarda valor, categoria, data e referências, mas não guarda moeda nem snapshot de conversão. | `costs` guarda valor e código de moeda. | Incluir moeda do lançamento; quando houver conversão, guardar par, taxa, fonte e horário. Relatórios não devem recalcular o passado com cotação atual. |
| Razão financeiro | `LedgerMovement` registra tipo, origem/destino, valor, conta, autoria e estado; ainda usa `bankAccountId`. | `ledger_movements` é append-only e vincula movimentos a ativos e comandos por organização. | O razão deve ser a fonte de histórico financeiro. Correções por estorno/novo movimento, não edição ou zeragem de saldo. Confirmar quais projeções de saldo são derivadas e reconciliáveis. |
| Conciliação | `ReconciliationDivergence` compara saldo esperado e observado e guarda classificação e histórico. | `reconciliation_divergences` está presente no candidato. | Preservar autor, horário, origem do saldo observado e ativo/rede da comparação; conciliação não é o mesmo que apurar uma aposta. |
| Segredos e auditoria | O modelo demo inclui campos opcionais de senha e `CredentialAccessLog`; dados são locais e sintéticos. | Vault separado para credenciais e destinos, com funções de acesso e reautenticação no servidor. | Produção deve usar Auth gerenciado, cifragem no servidor, autorização em cada leitura/alteração, auditoria sem plaintext e política testada de rotação/recuperação. O modo demo não pode migrar silenciosamente para conectado. |

## Estados que não são equivalentes

| Domínio atual | Candidato ou destino conceitual | Tratamento |
|---|---|---|
| `estoque`, `ativa`, `fila`, `arquivada` da parceria | `stock`, `active`, `queued`, `archived` | Correspondência aproximada; preservar histórico e validar se `fila` significa fila de atendimento ou de atribuição. |
| `pronta`, `verificar`, `em_uso`, `limitada`, `aguardando_saque`, `aguardando_deposito`, `em_conferencia` da conta | `active`, `limited`, `under_review`, `blocked` | Não comprimir em um único status. Separar disponibilidade, risco/restrição e tarefa operacional pendente. |
| `pendente`, `green`, `red`, `void`, `cashout`, `parcial` da perna | `pending`, `green`, `red`, `half_green`, `half_red`, `void`, `cashout` | Definir regra explícita para resultado parcial; não converter automaticamente sem informação sobre fração liquidada. |
| `solicitado`, `concluido_casa`, `em_transito`, `recebido_banco`, `devolvido_casa` do saque | `requested`, `completed_at_house`, `received`, `cancelled` | `em_transito` e devolução após envio precisam de estados próprios e movimentos compensatórios, não de cancelamento simples. |
| `USDT`, `EUR`, `BRL` como moeda de conta de casa | Código de ativo + rede | O mesmo ativo em redes distintas deve manter saldos e destinos separados. Valores BRL/EUR sem rede são off-chain. |

## Invariantes antes de criar migrations

1. Toda linha operacional pertence a uma organização e suas referências respeitam o mesmo `organization_id`.
2. RLS nega por padrão; políticas consultam membership ativa e a autorização adequada ao papel. Nenhuma política de produção usa `USING (true)` como atalho.
3. Perfil do produto não armazena senha, hash ou fallback. Credencial de casa e destino financeiro ficam fora de consultas gerais e só são revelados por operação autenticada, autorizada, reautenticada e auditada.
4. Uma alteração de endereço ou rede não redireciona uma operação pendente: destino versionado, confirmação ligada à versão e aprovação explícita antes da ativação.
5. Cada valor financeiro conserva ativo, quantidade, rede quando aplicável e precisão. Conversão conserva taxa aplicada, par, fonte e horário; uma taxa atualizada não altera lançamentos históricos.
6. Escritas financeiras são idempotentes, atômicas e geram movimentos auditáveis. Repetir uma requisição não duplica efeito; corrigir usa estorno ou evento compensatório.
7. Só seeds obviamente fictícias podem popular ambientes locais/homologação. Não copiar dados das planilhas ou contas reais para autenticação, seeds, logs ou exports.
8. Ativo e destino são validados juntos: moeda/rede da origem, moeda/rede de destino, taxas e versão autorizada precisam coincidir com a intenção confirmada.

## Trilhas de schema e decisão

| Trilha | Situação observada | Decisão nesta revisão |
|---|---|---|
| `database/` e `supabase/migrations/20261028…` da antiga pasta Antigravity | Duplicadas entre si em parte, divergentes do domínio canônico e com políticas RLS permissivas no arquivo 004; incluem fallback de senha em SQL. | Manter somente para referência. Não copiar nem aplicar. |
| `drizzle/` gerado na antiga pasta | Artefato separado e sobreposto às migrations raiz; não prova que foi aplicado. | Referência histórica, sem autoridade de migration. |
| `src/db/schema.ts` e `src/db/queries.ts` | Código Drizzle legado levado ao snapshot; contém `password_hash`, `password_secret` e UID do Firebase. `upsertDbUsers` apaga outro usuário que conflite por login/e-mail e usa `sha256:default` quando falta hash; `getOrCreateUser` grava o marcador `firebase_oauth_managed`. | Não usar como schema de produção nem ligar diretamente à UI. Remover os fallbacks e substituir o upsert destrutivo por migração explícita e validada antes de qualquer integração. |
| `src/database/migrations.ts` | Prévia/exportador SQL legado; as contagens e políticas mostradas não correspondem a uma história de migration ativa. | Corrigir ou desativar como exportador antes de qualquer uso para preparar schema. |
| `codex/supabase-integration` | Candidato com migrations, RLS, RPCs e vault; `152589e` é o commit-base observado e havia alterações locais pendentes, incluindo step-up e documentação. | Revisar e portar por contrato depois deste mapeamento; não misturar com o snapshot Antigravity nem aplicar remotamente. |

## Decisões ainda pendentes

- Qual papel de produto aprova cada ação: `socio`, `manager` e `aprovador` não são intercambiáveis sem uma matriz aprovada.
- Se a aprovação de destino exige uma segunda pessoa distinta de quem solicitou, além de reautenticação e confirmação explícita.
- Lista inicial de ativos e redes aceitos, convenção de nomes (por exemplo, Ethereum/ERC-20 e BNB Smart Chain/BEP-20) e precisão decimal por ativo.
- Se saldos por corretora/carteira serão atualizados só por lançamentos manuais/importados ou por integração externa futura.
- Quais etapas representam saque concluído na casa, trânsito na rede, recebimento no destino e devolução/estorno.
- Se o histórico de bancos da demonstração deve ser mantido apenas para consulta ou transformado em ativos off-chain legados.

## Próximo passo recomendado

Revisar este mapeamento e fechar a matriz de papéis/estados e a lista de ativos/redes. Em seguida, adaptar os contratos Supabase candidatos para os fluxos Antigravity; só gerar uma trilha única de migrations depois da revisão estática de RLS, grants, RPCs, segredo/destino e regras de conciliação.
