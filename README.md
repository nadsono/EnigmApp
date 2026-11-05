# Enigma Gestão — workspace compartilhado

O desenvolvimento canônico acontece nesta pasta. A experiência e a navegação preservadas vêm da aplicação Antigravity; autenticação, persistência e controles de segurança serão integrados como infraestrutura interna do mesmo produto.

## Desenvolvimento local

- Requer Node.js compatível com o `package-lock.json`.
- Instale dependências com `npm ci`.
- Inicie com `npm run dev`.
- O servidor tenta usar a porta 3001 e pode escolher a seguinte se ela já estiver ocupada.

O projeto ainda é uma demonstração com dados sintéticos. A consolidação inicial não significa que esteja pronto para usuários reais. Não configure credenciais ou dados reais neste ambiente.

## Documentação compartilhada

- `AGENTS.md`: instruções curtas para agentes que trabalham nesta raiz.
- `PROJECT_CONTEXT.md`: escopo e regras do produto.
- `docs/STATE.md`: estado atual e próximo passo.
- `docs/architecture/overview.md`: arquitetura observada e integração planejada.
- `docs/superpowers/specs/`: decisões e desenho de consolidação.
- `docs/superpowers/plans/`: planos de execução.

## Segurança e implantação

Não publique este snapshot diretamente. Antes de disponibilizar online, revisar e proteger rotas da API, autenticação, autorização, RLS, logs, gestão de segredos, backups e restauração; separar homologação e produção; configurar domínio, e-mail e chaves nos provedores; e validar fluxos com dados fictícios.
