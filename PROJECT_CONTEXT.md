# Enigma Gestão — contexto de produto

## Objetivo

Aplicação de operação e gestão de parcerias ligadas a apostas esportivas: contas/casas, entradas, saldos, saques, custos, conciliação, credenciais de rotina e carteiras/corretoras. O sistema organiza registros; não atesta que um serviço externo esteja autorizado ou regulamentado.

## Estado do produto

A interface de referência mais completa está no projeto Antigravity. O snapshot atual mantém os fluxos e a identidade visual existentes. A próxima fundação de dados pode usar Supabase, integrada por trás da mesma experiência. Não há “modo Supabase” como produto distinto.

## Dados e privacidade

Enquanto a aplicação estiver em desenvolvimento, use dados totalmente sintéticos. Credenciais exibidas devem ser obviamente fictícias e protegidas por autorização. Nunca persista chaves privadas de carteiras. Endereços de carteira, rede, corretora, moeda, taxa, conversão e destino de retirada são dados de alto impacto; alterações exigem confirmação explícita, autorização e histórico auditável.

## Colaboração

Codex recebe comandos, requisitos, prioridades e decisões do produto e coordena o repositório. Antigravity pode trabalhar na mesma pasta para implementação visual quando a fila antiga tiver sido reconciliada. Contexto compartilhado é este conjunto versionado de documentos; conversas paralelas não são fonte confiável até serem registradas aqui.

## Limites

Não usar informação pessoal real, credenciais de contas externas ou fundos reais no demo. Não aplicar migrations remotas ou publicar em produção sem preparação e liberação explícita. Não tratar registros ou validações do sistema como aconselhamento ou garantia de conformidade regulatória.
