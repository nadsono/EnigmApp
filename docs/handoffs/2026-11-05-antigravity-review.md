# Antigravity — revisão independente da entrega local

Autorização do usuário: aproveitar Antigravity acoplado ao projeto para dividir trabalho e uso de tokens. O plano de UX foi aprovado. Esta tarefa é revisão, não implementação.

Raiz única: C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção).

Leia AGENTS.md. A pasta Estudo é referência antiga e não deve ser alterada.

O Codex está integrando mudanças nessa raiz. Para evitar colisões:
- Leia somente os arquivos listados abaixo e suas dependências diretas necessárias.
- Não edite src, configuração, Git, dependências nem dados.
- Não abra credenciais, arquivos .env, dados pessoais, banco remoto ou serviços de apostas.
- Grave somente docs/reviews/2026-11-05-antigravity-ux-review.md.

Revisar:
1. src/domain/operationCapital.ts, operationCapital.test.ts, src/hooks/useOperationPreferences.ts e src/screens/EntradasScreen.tsx.
2. src/context/AppearanceContext.tsx, src/domain/uiTheme.ts e src/components/AppearanceSettings.tsx.

Foco: recálculo só de rascunhos pendentes em automático; edição manual e registros salvos preservados; soma de pernas compartilhando conta não ultrapassa saldo; USDT base não convertido duas vezes; isolamento das preferências por usuário; armazenamento indisponível não gera promessa de persistência.

Contexto: os saldos do ledger atual são USDT base; accountCurrency é apresentação. A sugestão é orçamento da próxima entrada. Modo manual é padrão. Os dados do demo são sintéticos. A integração Supabase não faz parte desta revisão.

Relatório de até 50 linhas: achados confirmados com severidade, arquivo/linha, condição que reproduz e correção recomendada. Distinguir dúvidas de defeitos. Se não houver achados, dizer isso com limites da inspeção. Não executar suíte repetidamente; a integração já passou em tsc, vite build e 50 testes puros. Leitura estática suficiente nesta tarefa.

Ao concluir, informar que o relatório está salvo. O Codex fará as correções e commits.
