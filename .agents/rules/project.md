# Regras compartilhadas para agentes

## Produto
- Preserve a estrutura funcional de Antigravity, incluindo navegação e rotinas operacionais.
- Não criar uma segunda experiência visual sob o rótulo Supabase.
- Toda amostra de dado deve estar identificada como sintética.

## Segurança
- Nunca registrar, exportar ou exibir segredo sem autorização e necessidade operacional.
- Não armazenar chaves privadas de carteiras.
- Alteração de endereço/rede/destino exige confirmação explícita, autorização e trilha de auditoria.
- A API, funções de servidor e banco devem negar por padrão e validar autorização no servidor.

## Colaboração e alterações
- Esta pasta é a raiz única de trabalho.
- Um escritor por conjunto de arquivos de cada vez; registrar decisões e próximo passo em `docs/STATE.md`.
- Migrations e contratos Supabase entram somente após revisão de compatibilidade com o domínio Antigravity.
- Preservar licenças e atribuições de ferramentas e skills de terceiros.
