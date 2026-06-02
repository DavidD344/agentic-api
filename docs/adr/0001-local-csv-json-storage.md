# ADR 0001: Armazenamento local em CSV/JSON para o MVP

Status: aceito

## Contexto

O sistema precisa gerar um dataset de bolsistas PQ com dados do CNPq, Lattes e inferências. O projeto é um MVP acadêmico com foco em demonstrar coleta, enriquecimento, dashboard, consulta por linguagem natural e logs.

## Decisão

Usar arquivos locais CSV/JSON em `scrape_results/` como armazenamento principal do MVP.

O arquivo `scrape_results/current.json` aponta para a versão ativa dos dados.

## Justificativa

CSV/JSON é simples de auditar, abrir em planilha, versionar como artefato de execução e explicar na apresentação.

Também evita introduzir um banco antes de validar a qualidade do scraping e das inferências.

## Consequências

Vantagens:

- fácil inspeção manual;
- fácil backup;
- fácil regeneração;
- compatível com export CSV;
- bom para demonstrar o pipeline.

Limitações:

- não é ideal para múltiplos usuários em produção;
- concorrência de escrita é limitada;
- sessões de chat e resultados dependem do filesystem local.

## Futuro

Migrar para SQLite/PostgreSQL quando houver necessidade de autenticação real, múltiplos usuários, histórico robusto ou deploy contínuo.

