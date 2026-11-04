# Origem do snapshot

- Origem: C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Estudo)\Google IA Studio\enigma-gestão-GoogleIAStudio-v1
- Destino canônico: C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção)
- Cópia registrada em: 2026-11-04 18:00 -03:00
- Arquivos versionados após reconciliação inicial: 102
- Tamanho aproximado: 1,82 MiB
- Origem mantida intacta.

## Excluído deliberadamente

- node_modules, .git, dist, build, coverage, .vite e .cache: dependências ou artefatos gerados.
- .aistudio e versions: metadados internos e cópias históricas da ferramenta.
- database, drizzle e supabase na raiz: migrations e schemas Antigravity mantidos na origem para revisão; não devem competir com a história Supabase do Codex. Os módulos de aplicação em src/database foram copiados porque a UI os importa.
- Arquivos .env, chaves privadas, certificados e contas de serviço.

## Incluído

- Interface, estilos, telas, contexto, seeds sintéticos, API/servidor e manifests/lockfiles da aplicação.
- Skills Enigma UI/UX e ui-taste existentes, além de uma cópia revisada de tirar-cara-de-ia com sua licença MIT.
- Documentos de consolidação e regras compartilhadas criados na pasta canônica.

## Aviso de concorrência

A origem Antigravity pode continuar recebendo a fila de prompts já iniciada. Este snapshot é um ponto no tempo; comparar mudanças após a fila terminar e portar somente alterações revisadas, arquivo a arquivo.


