# Processo detalhado de scraping, enriquecimento e inferencias

Este documento registra o estado atual do pipeline de dados do projeto. A ideia e deixar claro o que ja existe, por que foi feito assim, quais arquivos sao gerados, quais chaves aparecem em cada saida e como esses dados vao alimentar rotas, dashboard e chat depois.

Nenhuma chave de API deve ser documentada aqui. Variaveis como `OPENAI_API_KEY` devem ficar apenas no `.env`.

## Objetivo do pipeline

O trabalho pede gerar um dataset de bolsistas com base no link do CNPq e enriquecer esse dataset com informacoes vindas do Lattes e, futuramente, Google Scholar.

Campos obrigatorios do trabalho:

```txt
nome
sexo
instituicao
UF
nivel da bolsa
area de atuacao
ano de conclusao do doutorado
URL Lattes
Google Scholar
```

O pipeline atual cobre:

```txt
nome
instituicao
nivel da bolsa
inicio/fim da bolsa
situacao da bolsa
UF inferida
regiao inferida
Lattes preview
Lattes completo
foto do Lattes
ORCID quando aparece
ano de doutorado
sexo/genero inferido de forma conservadora
area principal
areas secundarias
topicos de pesquisa
metodos/tecnicas
dominios de aplicacao
experiencias relevantes
resumos e tags para dashboard/chat
fila de revisao
logs
```

Ainda pendente ou em standby:

```txt
Google Scholar
embeddings/vector search
rotas de consulta dos dados enriquecidos
chat em linguagem natural
dashboard/exportacao PDF/CSV
parser estruturado mais profundo de secoes do curriculo completo
```

## Principio de arquitetura

O scraping foi separado como feature isolada. A direcao esperada no backend e:

```txt
router -> service -> scraper
```

Hoje os scrapers ainda sao executaveis por CLI porque estamos validando dados e qualidade primeiro. Depois, a API deve chamar services que chamam essas mesmas funcoes.

Arquivos principais:

```txt
app/scrapers/simple_scrape.py
app/scrapers/lattes_scrape.py
app/scrapers/inference_scrape.py
app/scrapers/pipeline_scrape.py
app/main.py
```

Pastas principais de saida:

```txt
scrape_results/
logs/
docs/
```

## Visao geral do fluxo

Fluxo completo atual:

```txt
0. CNPq scholarships
   -> scrape_results/<run_cnpq>/scholarships.csv

1. Lattes preview/match
   -> scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
   -> scrape_results/lattes_preview/<run_preview>/review_queue.csv

2. Lattes curriculo completo
   -> scrape_results/lattes_full/<run_full>/lattes_full_profiles.json
   -> scrape_results/lattes_full/<run_full>/raw/<pessoa>/full_cv.txt

3. Inferencias
   -> scrape_results/inferences/<run_inference>/profiles_with_inferences.json
   -> scrape_results/inferences/<run_inference>/inference_review_queue.csv

4. Manifest ativo
   -> scrape_results/current.json

5. Logs
   -> logs/pipeline_<timestamp>.log
```

O comando unico do pipeline roda tudo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Teste limitado:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

Runs limitadas nao promovem `scrape_results/current.json`.

## Ambiente

Dependencias:

```txt
uv
Python do projeto
Chromium instalado no sistema
Playwright
BeautifulSoup
python-dotenv
openai SDK, quando LLM for usada
```

Instalacao:

```bash
uv sync
```

Uso recomendado do `uv`:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run ...
```

Motivo: evita problemas de permissao/cache do `uv` em alguns ambientes.

Variaveis importantes no `.env`:

```txt
OPENAI_API_KEY=...
LATTES_LLM_MODEL=gpt-5.4-mini
LATTES_DISABLE_LLM=1

INFERENCES_LLM_MODEL=gpt-5-nano
INFERENCES_LLM_MODE=split
INFERENCES_REPAIR_LLM_MODEL=gpt-5.4-mini
INFERENCES_DISABLE_LLM=1
INFERENCES_LLM_LIMIT=10
INFERENCES_OPENAI_TIMEOUT_SECONDS=45
INFERENCES_RULE_TEXT_MAX_CHARS=6000
INFERENCES_SEMANTIC_TEXT_MAX_CHARS=6000
INFERENCES_EVIDENCE_SNIPPETS_MAX=14
INFERENCES_EVIDENCE_SNIPPETS_PER_KIND=2
INFERENCES_EVIDENCE_SNIPPET_CHARS=650
```

Observacoes:

```txt
LATTES_* controla revisao LLM do match do Lattes preview.
INFERENCES_* controla a LLM das inferencias semanticas.
INFERENCES_LLM_LIMIT limita quantas pessoas recebem LLM na etapa de inferencia.
Runs com INFERENCES_LLM_LIMIT nao atualizam current.json.
```

## Etapa 0: CNPq scholarships

Arquivo:

```txt
app/scrapers/simple_scrape.py
```

Comando:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/simple_scrape.py
```

URL padrao:

```txt
http://plsql1.cnpq.br/divulg/RESULTADO_PQ_102003.prc_comp_cmt_links?V_COD_DEMANDA=200310&V_TPO_RESULT=CURSO&V_COD_AREA_CONHEC=10300007&V_COD_CMT_ASSESSOR=CC
```

O que faz:

```txt
1. abre a pagina do CNPq com Playwright
2. salva HTML bruto
3. extrai texto
4. extrai links
5. extrai todas as tabelas
6. identifica a tabela de bolsas pelo formato das linhas
7. salva scholarships.csv e scholarships.json
```

Pasta gerada:

```txt
scrape_results/<YYYYMMDD_HHMMSS>/
```

Arquivos gerados:

```txt
page.html
text.txt
links.json
tables.json
table_1.csv
table_2.csv
...
scholarships.csv
scholarships.json
summary.json
```

Chaves/colunas de `scholarships.csv` e `scholarships.json`:

```txt
name
scholarship_level
scholarship_start
scholarship_end
institution
situation
```

Significado:

```txt
name
  Nome do bolsista na tabela CNPq.

scholarship_level
  Nivel da bolsa, como PQ-1A, PQ-1B, PQ-2, PQ-C.

scholarship_start
  Data de inicio da bolsa.

scholarship_end
  Data de fim da bolsa.

institution
  Sigla da instituicao na tabela CNPq.

situation
  Situacao da bolsa, como Em folha de pagamento.
```

Chaves de `summary.json` da etapa CNPq:

```txt
url
title
text_length
links_count
tables_count
scholarships_count
```

## Etapa 1: Lattes preview/match

Arquivo:

```txt
app/scrapers/lattes_scrape.py
```

Comando:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv
```

Teste limitado:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv 10
```

O que faz:

```txt
1. le scholarships.csv
2. pesquisa cada nome na busca textual do Lattes
3. percorre paginacao do Lattes quando houver
4. coleta candidatos
5. baixa preview de candidatos
6. compara nome e instituicao
7. classifica resultado como matched, ambiguous, not_found ou error
8. reprocessa erros tecnicos ate 5 vezes ao final
9. usa LLM para tentar resolver ambiguidades, se habilitada
10. salva arquivos auditaveis
```

Pasta gerada:

```txt
scrape_results/lattes_preview/<YYYYMMDD_HHMMSS>/
```

Arquivos principais:

```txt
lattes_profiles.csv
lattes_profiles.json
review_queue.csv
review_queue.json
retry_log.json
llm_review.json
summary.json
raw/
```

Colunas/chaves de `lattes_profiles.csv`:

```txt
name
institution
scholarship_level
match_status
candidates_count
review_reason
lattes_code
lattes_name
lattes_preview_url
certified_at
orcid
external_links
summary
llm_review_status
llm_review_confidence
llm_review_reason
error
```

Significado:

```txt
name
  Nome vindo do CNPq.

institution
  Instituicao vinda do CNPq.

scholarship_level
  Nivel da bolsa vindo do CNPq.

match_status
  Estado do match no Lattes.
  Valores comuns:
    matched
    ambiguous
    not_found
    error

candidates_count
  Numero de candidatos encontrados na busca textual.

review_reason
  Explicacao legivel do motivo do status.

lattes_code
  Codigo interno usado pela busca textual do Lattes.
  Exemplo de formato: K4781560E7.
  Serve para abrir preview/detalhe no sistema de busca.

lattes_name
  Nome encontrado no Lattes.

lattes_preview_url
  URL da tela preview do Lattes.

certified_at
  Data de certificacao/atualizacao exibida no preview, quando disponivel.

orcid
  ORCID quando aparece em links do preview.

external_links
  Lista JSON de links que aparecem no preview.
  Nao e apenas ORCID; pode conter outras URLs.

summary
  Resumo publico do preview.

llm_review_status
  Decisao da LLM para ambiguidades, quando usada.

llm_review_confidence
  Confianca da decisao da LLM.

llm_review_reason
  Motivo textual da decisao da LLM.

error
  Erro tecnico, se houver.
```

`review_queue.csv` contem os perfis que nao ficaram `matched`.

Chaves de `summary.json` da etapa preview:

```txt
source_csv
total
matched
not_found
ambiguous
error
technical_error_retries
retry_attempts
llm_review_attempts
llm_review_matched
```

LLM nesta etapa:

```txt
Objetivo:
  Resolver casos ambiguos do preview do Lattes.

Modelo:
  LATTES_LLM_MODEL, se definido.

Desligar:
  LATTES_DISABLE_LLM=1.

Regra importante:
  A LLM nao deve exigir que o preview mencione a bolsa CNPq.
  Ela deve decidir pelo conjunto nome + instituicao + resumo + candidatos.
```

## Revisao manual do preview

Quando `review_queue.csv` contem casos, podemos criar um `review_resolved.csv` com escolhas manuais.

Comando:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py resolve-review scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv scrape_results/review_resolved.csv
```

Ideia:

```txt
1. lattes_profiles.csv tem a base original.
2. review_resolved.csv informa correcoes manuais.
3. o comando gera lattes_profiles_resolved.csv.
4. casos nao resolvidos continuam em review_queue_remaining.csv.
```

Importante:

```txt
Nao e obrigatorio resolver tudo antes de continuar.
Casos nao resolvidos nao devem quebrar o fluxo.
Eles ficam como skipped/review depois.
```

## Etapa 2: Lattes curriculo completo

Arquivo:

```txt
app/scrapers/lattes_scrape.py
```

Comando:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
```

Ou usando um arquivo resolvido:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_resolved>/lattes_profiles_resolved.csv
```

Teste limitado:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv 10
```

O que faz:

```txt
1. le lattes_profiles.csv
2. processa apenas pessoas com match_status=matched e lattes_code
3. abre o curriculo completo
4. extrai HTML completo
5. extrai texto completo
6. extrai metadados principais
7. salva um JSON detalhado por pessoa
8. salva um CSV/JSON agregado mais leve
9. coloca casos sem match em review_queue_full
```

Pasta gerada:

```txt
scrape_results/lattes_full/<YYYYMMDD_HHMMSS>/
```

Arquivos principais:

```txt
lattes_full_profiles.csv
lattes_full_profiles.json
review_queue_full.csv
review_queue_full.json
summary.json
raw/<lattes_code_nome>/full_profile.json
raw/<lattes_code_nome>/full_cv.html
raw/<lattes_code_nome>/full_cv.txt
```

Colunas/chaves de `lattes_full_profiles.csv` e `lattes_full_profiles.json`:

```txt
name
institution
scholarship_level
match_status
lattes_code
lattes_name
public_lattes_id
lattes_url
photo_url
last_updated
orcid
summary
full_cv_text_length
looks_like_full_cv
blocked_or_invalid
sections_count
detail_json_path
raw_html_path
raw_text_path
error
sections_available
```

Significado:

```txt
name
  Nome vindo do CNPq.

institution
  Instituicao vinda do CNPq.

scholarship_level
  Nivel da bolsa vindo do CNPq.

match_status
  Estado do processamento do curriculo completo.
  Valores comuns:
    matched
    skipped
    error

lattes_code
  Codigo interno do Lattes vindo da etapa preview.

lattes_name
  Nome encontrado no Lattes.

public_lattes_id
  ID publico usado na URL http://lattes.cnpq.br/<id>.

lattes_url
  URL publica do curriculo Lattes.

photo_url
  URL da foto do Lattes, quando disponivel.

last_updated
  Data de ultima atualizacao do curriculo.

orcid
  ORCID quando encontrado.

summary
  Resumo publico estruturado do Lattes.
  Atualmente e o principal texto enviado para a etapa de inferencias.

full_cv_text_length
  Tamanho do texto completo bruto.

looks_like_full_cv
  Booleano indicando se a pagina parece um curriculo completo valido.

blocked_or_invalid
  Booleano indicando bloqueio/pagina invalida.

sections_count
  Numero de secoes detectadas.

detail_json_path
  Caminho para raw/<pessoa>/full_profile.json.

raw_html_path
  Caminho para raw/<pessoa>/full_cv.html.

raw_text_path
  Caminho para raw/<pessoa>/full_cv.txt.

error
  Erro tecnico, se houver.

sections_available
  Lista de secoes encontradas no curriculo.
```

Exemplos de `sections_available`:

```txt
AreasAtuacao
AtuacaoProfissional
Bancas
Citacoes
Endereco
Eventos
FormacaoAcademicaPosDoutorado
FormacaoAcademicaTitulacao
Identificacao
Orientacoes
PatentesRegistros
ProducaoBibliografica
ProjetosPesquisa
```

Chaves de `summary.json` da etapa full:

```txt
source_csv
total
matched
skipped
error
```

## Etapa 3: inferencias

Arquivo:

```txt
app/scrapers/inference_scrape.py
```

Comando com arquivo explicito:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py full scrape_results/lattes_full/<run_full>/lattes_full_profiles.json
```

Comando usando o run ativo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py current
```

Teste limitado:

```bash
INFERENCES_LLM_LIMIT=3 env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py current
```

O que faz:

```txt
1. le lattes_full_profiles.json
2. cria semantic_profile por pessoa
3. gera campos por regra local
4. chama LLM para validar/corrigir regras locais
5. chama LLM para gerar campos semanticos
6. salva CSV/JSON enriquecido
7. salva fila de revisao de campos com baixa confianca
8. salva log detalhado das chamadas LLM
9. se for run completo valido, pode atualizar current.json
```

Pasta gerada:

```txt
scrape_results/inferences/<YYYYMMDD_HHMMSS>/
```

Arquivos principais:

```txt
profiles_with_inferences.csv
profiles_with_inferences.json
inference_review_queue.csv
inference_review_queue.json
inference_llm.json
summary.json
```

## Estrutura de `semantic_profile`

Cada campo de inferencia dentro de `semantic_profile` tem o mesmo envelope:

```json
{
  "value": "...",
  "confidence": 0.9,
  "source": "llm",
  "reason": "Motivo curto da inferencia.",
  "needs_review": false
}
```

Significado:

```txt
value
  Valor inferido.

confidence
  Confianca de 0 a 1.

source
  Origem do campo.

reason
  Explicacao curta.

needs_review
  true quando o campo precisa revisao humana ou tem baixa confianca.
```

Valores comuns de `source`:

```txt
rule
  Gerado por regra local, sem validacao LLM.

rule:lattes_text
  Gerado por regra local olhando texto do Lattes.

rule+llm_validated
  Regra local confirmada pela LLM.

llm_corrected_rule
  Regra local corrigida pela LLM.

llm
  Gerado diretamente pela LLM.
```

## Campos base mantidos em `profiles_with_inferences`

Antes do `semantic_profile`, cada pessoa mantem campos base:

```txt
name
institution
scholarship_level
lattes_code
lattes_name
lattes_url
photo_url
```

No JSON, a linha tambem preserva varios campos vindos de `lattes_full_profiles.json`, como:

```txt
match_status
public_lattes_id
last_updated
orcid
summary
full_cv_text_length
looks_like_full_cv
blocked_or_invalid
sections_count
detail_json_path
raw_html_path
raw_text_path
error
sections_available
semantic_profile
```

## Campos de inferencia por regra local

Campos:

```txt
institution_state_uf
institution_region
scholarship_category
scholarship_level_rank
doctorate_year
years_since_doctorate
profile_language
sex_inferred
```

Detalhes:

```txt
institution_state_uf
  Origem:
    institution
  Como gera:
    tabela local INSTITUTION_UF.
  LLM:
    valida/corrige na fase rule_validation.

institution_region
  Origem:
    institution_state_uf
  Como gera:
    tabela local REGION_BY_UF.
  Valores:
    Norte
    Nordeste
    Centro-Oeste
    Sudeste
    Sul
    unknown
  LLM:
    valida/corrige.

scholarship_category
  Origem:
    scholarship_level
  Como gera:
    prefixo do nivel da bolsa.
  Valores:
    PQ-1
    PQ-2
    PQ-C
    unknown

scholarship_level_rank
  Origem:
    scholarship_category
  Como gera:
    PQ-1 -> 1
    PQ-2 -> 2
    PQ-C -> 3

doctorate_year
  Origem:
    summary
  Como gera:
    regex procurando doutorado/PhD e ano.
  LLM:
    valida/corrige usando o resumo inteiro.

years_since_doctorate
  Origem:
    doctorate_year
  Como gera:
    ano atual - doctorate_year.

profile_language
  Origem:
    summary
  Como gera:
    marcadores simples PT/EN.
  Valores:
    pt
    en
    mixed
    unknown

sex_inferred
  Origem:
    summary/name/lattes_name
  Como gera:
    marcadores textuais como professor/professora, pesquisador/pesquisadora,
    doutor/doutora, graduado/graduada.
  Valores:
    male
    female
    unknown
  Observacao:
    campo sensivel e aproximado, usado para estatistica. Deve aceitar unknown.
```

## Campos semanticos gerados por LLM

Campos:

```txt
main_research_area
secondary_research_areas
research_topics
methods_and_techniques
application_domains
career_stage
academic_rank
seniority_level
has_international_experience
international_countries
has_industry_experience
industry_organizations
has_management_experience
management_roles
has_editorial_or_event_experience
has_patents_or_software_outputs
publication_or_output_focus
profile_summary_short
profile_summary_bullets
search_keywords
dashboard_tags
chart_suggestions
data_quality_notes
qa_context
```

Detalhes:

```txt
main_research_area
  Area principal curta.
  Exemplos:
    artificial_intelligence
    software_engineering
    databases
    optimization
    operations_research

secondary_research_areas
  Lista de areas secundarias.

research_topics
  Lista de topicos perguntaveis.
  Exemplo:
    robotics
    machine_learning
    software_testing
    quantum_computing

methods_and_techniques
  Lista de metodos, tecnicas e tecnologias.

application_domains
  Lista de dominios de aplicacao.
  Exemplo:
    health
    education
    energy
    telecommunications

career_stage
  Estagio de carreira.
  Valores:
    early
    mid
    senior
    very_senior
    emeritus_or_retired
    unknown

academic_rank
  Cargo academico inferido.
  Exemplos:
    professor_titular
    professor_associado
    professor_adjunto

seniority_level
  Senioridade resumida.
  Valores:
    junior
    mid
    senior
    very_senior
    unknown

has_international_experience
  Booleano indicando experiencia internacional academica/profissional.

international_countries
  Lista de paises citados.

has_industry_experience
  Booleano indicando experiencia em empresa, industria, P&D privado ou consultoria.

industry_organizations
  Lista de organizacoes industriais/privadas citadas.

has_management_experience
  Booleano indicando coordenacao, direcao, chefia, pro-reitoria, presidencia etc.

management_roles
  Lista de papeis de gestao.

has_editorial_or_event_experience
  Booleano indicando editoria, revisao, comites, eventos, sociedades cientificas.

has_patents_or_software_outputs
  Booleano indicando patente, programa de computador, software registrado ou produto tecnologico.

publication_or_output_focus
  Lista com foco de producao.
  Exemplos:
    journals
    conferences
    books
    patents
    software_outputs
    editorial_work

profile_summary_short
  Resumo curto de uma frase para cards/dashboard.

profile_summary_bullets
  Lista com ate 4 bullets curtos.

search_keywords
  Palavras-chave normalizadas para busca local e chat.

dashboard_tags
  Tags curtas para filtros/agrupamentos.

chart_suggestions
  Sugestoes de graficos onde o perfil pode aparecer.

data_quality_notes
  Alertas sobre dado incompleto, ambiguo ou incerto.

qa_context
  Texto compacto otimizado para responder perguntas sobre a pessoa.
```

## Grupos de chamada da LLM na inferencia

Para reduzir timeout e respostas gigantes, a inferencia usa 5 chamadas por pessoa:

```txt
1. rule_validation
2. semantic_generation:research
3. semantic_generation:career
4. semantic_generation:experience_outputs
5. semantic_generation:dashboard_qa
```

### `rule_validation`

Valida/corrige apenas campos por regra:

```txt
institution_state_uf
institution_region
scholarship_category
scholarship_level_rank
doctorate_year
years_since_doctorate
profile_language
sex_inferred
```

Payload enviado:

```txt
name
lattes_name
institution
scholarship_level
summary_excerpt
```

`summary_excerpt` usa `INFERENCES_RULE_TEXT_MAX_CHARS`.

### `semantic_generation:research`

Gera:

```txt
main_research_area
secondary_research_areas
research_topics
methods_and_techniques
application_domains
```

Payload enviado:

```txt
name
lattes_name
institution
scholarship_level
lattes_url
orcid
summary_excerpt
sections_available
inferencias ja validadas
```

### `semantic_generation:career`

Gera:

```txt
career_stage
academic_rank
seniority_level
```

Payload semelhante ao grupo `research`.

### `semantic_generation:experience_outputs`

Gera:

```txt
has_international_experience
international_countries
has_industry_experience
industry_organizations
has_management_experience
management_roles
has_editorial_or_event_experience
has_patents_or_software_outputs
publication_or_output_focus
```

Payload inclui:

```txt
summary_excerpt
sections_available
evidence_snippets
```

Esta e a unica fase que usa `evidence_snippets` do curriculo completo cru.

### `semantic_generation:dashboard_qa`

Gera:

```txt
profile_summary_short
profile_summary_bullets
search_keywords
dashboard_tags
chart_suggestions
data_quality_notes
qa_context
```

Esses campos sao importantes para:

```txt
dashboard
filtros
busca textual local
chat
relatorios
```

### Modo `single`

Tambem existe o modo:

```txt
INFERENCES_LLM_MODE=single
```

Nesse modo, a LLM tenta validar regras locais e gerar todos os campos semanticos em uma unica chamada por pessoa.

Trade-off:

```txt
vantagem:
  reduz de 5 chamadas por pessoa para 1 chamada por pessoa
  deve ser muito mais rapido em lote

risco:
  resposta JSON maior
  maior chance de campo esquecido
  maior chance de JSON malformado
  se a chamada falha, perde todas as inferencias LLM daquela pessoa
```

O modo padrao continua sendo:

```txt
INFERENCES_LLM_MODE=split
```

### Reparo automatico de erros LLM

Se uma chamada da etapa de inferencia falhar, o pipeline tenta reparar somente aquele caso com:

```txt
INFERENCES_REPAIR_LLM_MODEL=gpt-5.4-mini
```

Isso evita rodar as 480 pessoas de novo quando apenas algumas respostas vierem com JSON malformado ou timeout.

Para reparar uma run existente:

```bash
INFERENCES_OPENAI_TIMEOUT_SECONDS=120 env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py repair-errors scrape_results/inferences/<run> --update-current
```

Se todos os erros forem corrigidos, `llm_errors` fica `0` e o `current.json` pode ser atualizado para apontar para a run reparada.

## O que e enviado para a LLM

O curriculo completo cru nao e enviado inteiro.

Motivo:

```txt
O raw_text_path pode ter centenas de milhares de caracteres.
Na rodada atual:
  mediana aproximada: 179k chars
  maximo aproximado: 827k chars
```

Em vez disso:

```txt
1. Enviamos o resumo publico inteiro do Lattes.
2. O limite padrao e 6000 chars.
3. Na rodada atual, o maior resumo publico tinha menos de 6000 chars.
4. Para experience_outputs, adicionamos snippets extraidos do raw_text_path.
```

Exemplo de payload normal:

```json
{
  "name": "Nome da pessoa",
  "lattes_name": "Nome no Lattes",
  "institution": "UFRJ",
  "scholarship_level": "PQ-C",
  "lattes_url": "http://lattes.cnpq.br/...",
  "orcid": "https://orcid.org/...",
  "summary_excerpt": "Resumo publico inteiro do Lattes...",
  "sections_available": ["AreasAtuacao", "PatentesRegistros"]
}
```

Exemplo de snippet:

```json
{
  "kind": "patent_or_software",
  "matched_text": "patente",
  "snippet": "Trecho do curriculo completo contendo a evidencia de patente..."
}
```

Tipos atuais de snippets:

```txt
doctorate
postdoc_or_international
patent_or_software
management
editorial_or_event
industry
research_area
sex_marker
```

Observacao:

```txt
Os snippets existem para reduzir risco de esquecer informacao importante escondida
no curriculo completo, sem precisar mandar o curriculo inteiro para a LLM.
```

## Arquivo `profiles_with_inferences.csv`

O CSV achatado gera colunas no formato:

```txt
<field_id>_value
<field_id>_confidence
<field_id>_source
<field_id>_needs_review
<field_id>_reason
```

Para cada campo de inferencia.

Exemplo:

```txt
main_research_area_value
main_research_area_confidence
main_research_area_source
main_research_area_needs_review
main_research_area_reason
```

Isso facilita abrir em planilha, mas para API/chat o JSON e melhor.

## Arquivo `profiles_with_inferences.json`

Esse e o arquivo mais importante para API/chat.

Estrutura por pessoa:

```json
{
  "name": "...",
  "institution": "...",
  "scholarship_level": "...",
  "lattes_code": "...",
  "lattes_name": "...",
  "public_lattes_id": "...",
  "lattes_url": "...",
  "photo_url": "...",
  "summary": "...",
  "raw_text_path": "...",
  "sections_available": [],
  "semantic_profile": {
    "main_research_area": {
      "value": "...",
      "confidence": 0.9,
      "source": "llm",
      "reason": "...",
      "needs_review": false
    }
  }
}
```

## Arquivo `inference_review_queue`

Arquivos:

```txt
inference_review_queue.csv
inference_review_queue.json
```

Entram nessa fila pessoas que possuem pelo menos um campo em `semantic_profile` com:

```txt
needs_review=true
```

Motivos comuns:

```txt
sexo/genero desconhecido
ano de doutorado nao encontrado
instituicao sem UF mapeada
campo sensivel com baixa confianca
ausencia de evidencia para industria/patente/software
dados ambiguos no resumo
```

Importante:

```txt
Essa fila nao precisa bloquear o sistema.
Ela serve para revisao humana posterior ou por agente.
```

## Arquivo `inference_llm.json`

Registra detalhes da LLM na etapa de inferencia.

Chaves principais:

```txt
enabled
reason
model
rule_field_ids
semantic_field_ids
semantic_field_groups
rule_text_max_chars
semantic_text_max_chars
evidence_snippets_max
evidence_snippets_per_kind
evidence_snippet_chars
token_char_ratio
decisions
```

Cada item de `decisions` pode conter:

```txt
phase
name
prompt_chars
prompt_tokens_estimate
accepted_fields
validated_rule_fields
corrected_rule_fields
missing_fields
error
raw_output
```

Uso:

```txt
auditar custo
auditar erros
ver se campos foram aceitos
ver quais regras a LLM corrigiu
debugar JSON malformado
```

Estimativa de tokens:

```txt
prompt_tokens_estimate ~= prompt_chars / 4
```

## Arquivo `summary.json` da inferencia

Chaves:

```txt
source_json
total
semantic_fields
llm_fields
sex_counts
main_area_counts
needs_review
llm_decisions
llm_errors
token_estimates
profiles_with_inferences_csv
profiles_with_inferences_json
inference_review_queue_csv
inference_review_queue_json
```

`token_estimates`:

```txt
prompt_tokens_total
prompt_tokens_by_phase
```

## Manifest ativo: `scrape_results/current.json`

Esse arquivo aponta quais dados o backend deve usar.

Exemplo de chaves:

```txt
updated_at
pipeline_run_dir
cnpq_run_dir
preview_run_dir
active_full_run
scholarships_csv
lattes_profiles_csv
lattes_full_profiles_csv
lattes_full_profiles_json
review_queue_full_csv
summary_json
log_path
inference_run_dir
profiles_with_inferences_csv
profiles_with_inferences_json
inference_review_queue_csv
inference_summary_json
```

Observacao:

```txt
Nem todo current.json antigo tera chaves de inferencia.
Depois de uma run completa com inferencia promovida, ele passa a ter.
Runs limitadas nao promovem current.json.
```

Uso pela API:

```txt
1. API le scrape_results/current.json.
2. Descobre profiles_with_inferences_json, se existir.
3. Se nao existir, usa lattes_full_profiles_json como fallback.
4. Rotas e services usam esses caminhos ativos.
```

## Logs

O pipeline completo cria logs em:

```txt
logs/pipeline_<YYYYMMDD_HHMMSS>.log
```

Esse log registra stdout/stderr do pipeline:

```txt
Etapa 0: CNPq scholarships
Etapa 1: Lattes preview
Etapa 2: Lattes curriculo completo
Etapa 3: Inferencias
resultado final
promocao ou nao do current.json
```

O caminho do log tambem fica em:

```txt
scrape_results/current.json
scrape_results/pipeline/<run>/pipeline_summary.json
```

## Pipeline summary

Arquivo:

```txt
scrape_results/pipeline/<run>/pipeline_summary.json
```

Chaves:

```txt
limit
promoted
current_json
log_path
validation_ok
validation_reasons
cnpq_run_dir
scholarships_csv
preview_run_dir
lattes_profiles_csv
full_run_dir
lattes_full_profiles_csv
lattes_full_profiles_json
review_queue_full_csv
summary_json
inference_run_dir
profiles_with_inferences_csv
profiles_with_inferences_json
inference_review_queue_csv
inference_summary_json
active_manifest
```

Regra de promocao:

```txt
promoted=true somente quando:
  run nao tem limit
  etapa full e valida
  summary.error == 0
  summary.skipped == 0
  review_queue_full esta vazia
```

## Como o chat vai usar esses dados

O modelo nao fica treinado/alimentado permanentemente com os dados.

O backend deve funcionar assim:

```txt
1. carrega scrape_results/current.json
2. carrega profiles_with_inferences.json
3. recebe pergunta do professor
4. faz busca local no JSON
5. seleciona top N perfis relevantes
6. monta contexto pequeno
7. envia pergunta + contexto para LLM
8. responde usando apenas os dados fornecidos
```

Campos mais importantes para busca local:

```txt
name
institution
main_research_area.value
secondary_research_areas.value
research_topics.value
methods_and_techniques.value
application_domains.value
profile_summary_short.value
search_keywords.value
dashboard_tags.value
qa_context.value
```

Exemplo de pergunta:

```txt
Quem trabalha com robotica?
```

Busca local deve procurar termos relacionados em:

```txt
robotica
robotics
autonomous systems
computer vision
control
mobile robots
research_topics
search_keywords
qa_context
```

Depois a LLM recebe apenas candidatos relevantes:

```txt
Pergunta:
  Quem trabalha com robotica?

Perfis encontrados:
  1. Nome, instituicao, area, qa_context, keywords
  2. Nome, instituicao, area, qa_context, keywords
```

Beneficio:

```txt
mais barato
mais rapido
menos alucinacao
mais rastreavel
nao precisa mandar 480 curriculos completos para cada pergunta
```

## Por que resumir/inferir antes do chat

Sem inferencia:

```txt
chat teria que ler textos grandes do Lattes
busca seria ruim
custo seria alto
respostas seriam lentas
```

Com inferencia:

```txt
cada pessoa vira um perfil semantico pequeno
campos sao buscaveis
dashboard consegue agrupar
chat recebe contexto pequeno
revisao fica auditavel
```

Essa etapa e um investimento inicial para baratear e melhorar as chamadas futuras.

## Decisoes importantes tomadas ate agora

### CSV e JSON ao mesmo tempo

CSV:

```txt
bom para abrir em planilha
bom para revisao manual
bom para debug rapido
```

JSON:

```txt
melhor para API
melhor para chat
preserva listas e objetos
preserva semantic_profile
```

Decisao:

```txt
manter os dois por enquanto.
```

### Separar preview e full

Antes tudo ficava em `scrape_results/lattes`.

Agora:

```txt
scrape_results/lattes_preview/
scrape_results/lattes_full/
```

Motivo:

```txt
preview descobre identidade/match
full baixa curriculo completo
as duas etapas tem custos, erros e outputs diferentes
```

### Nao mandar curriculo completo inteiro para LLM

Motivo:

```txt
raw_text_path pode ser enorme
mandar tudo encarece muito
aumenta latencia
aumenta ruido
```

Decisao atual:

```txt
mandar resumo publico inteiro
mandar evidence_snippets apenas em experience_outputs
```

### Rodadas limitadas nao promovem current.json

Motivo:

```txt
evita trocar dados ativos por amostra incompleta
```

### Review nao bloqueia tudo

Motivo:

```txt
em scraping real sempre existem casos ambiguos
o sistema deve continuar funcionando
casos duvidosos ficam auditaveis
```

## Comandos uteis

Ver manifest ativo:

```bash
cat scrape_results/current.json
```

Rodar pipeline completo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Rodar pipeline limitado:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

Rodar so CNPq:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/simple_scrape.py
```

Rodar so preview:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv
```

Rodar so full:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
```

Rodar so inferencias usando current:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py current
```

Rodar inferencias em 3 pessoas:

```bash
INFERENCES_LLM_LIMIT=3 env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py current
```

Rodar API:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload
```

Outra porta:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload --port 8001
```

Health/status:

```bash
curl http://localhost:8000/
```

Validar sintaxe de scrapers:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python -m py_compile app/scrapers/simple_scrape.py app/scrapers/lattes_scrape.py app/scrapers/inference_scrape.py app/scrapers/pipeline_scrape.py
```

## Cuidados

Nao commitar:

```txt
.env com OPENAI_API_KEY
dados gigantes se nao forem necessarios
logs com informacao sensivel
```

Revisar antes de usar em dashboard final:

```txt
campos com needs_review=true
sex_inferred unknown ou baixo confidence
instituicoes sem UF mapeada
areas muito genericas
tags inconsistentes PT/EN
llm_errors > 0
```

Para rodar tudo de verdade:

```txt
1. garantir OPENAI_API_KEY no .env
2. remover INFERENCES_LLM_LIMIT
3. decidir modelo em INFERENCES_LLM_MODEL
4. rodar pipeline completo
5. verificar pipeline_summary.json
6. verificar current.json
7. verificar summary.json da inferencia
8. olhar llm_errors
9. olhar inference_review_queue
```

## Estado recomendado antes de ir para rotas

Antes de criar rotas para consumir dados:

```txt
current.json deve apontar para uma run completa
profiles_with_inferences_json deve existir no current.json
profiles_with_inferences.csv deve existir para auditoria
inference_summary_json deve ter llm_errors=0 ou erro aceitavel documentado
inference_review_queue deve existir mesmo que tenha itens
```

Rotas provaveis depois:

```txt
GET /
  status da API e do dataset ativo

GET /profiles
  lista paginada de perfis enriquecidos

GET /profiles/{lattes_code}
  detalhe de uma pessoa

GET /dashboard/summary
  agregados para dashboard

POST /chat
  pergunta em linguagem natural usando busca local + LLM

POST /pipeline/run
  futuramente dispara pipeline completo
```

## Relacao com os agentes do trabalho

Mapeamento conceitual:

```txt
collector_agent
  app/scrapers/simple_scrape.py

lattesResearch_agent
  app/scrapers/lattes_scrape.py

inference_agent
  app/scrapers/inference_scrape.py

orchestrator_agent
  app/scrapers/pipeline_scrape.py

query_agent
  futuro service de chat

report_agent
  futuro service de relatorios/exportacao

scholarResearch_agent
  futuro scraper/service do Google Scholar
```

Handoffs atuais:

```txt
CNPq scholarships.csv
  -> Lattes preview

Lattes preview lattes_profiles.csv
  -> Lattes full

Lattes full lattes_full_profiles.json
  -> Inferencias

Inferencias profiles_with_inferences.json
  -> API/dashboard/chat
```

## Proximos passos naturais

```txt
1. Rodar inferencia completa sem limite quando estiver confortavel com custo.
2. Promover current.json com profiles_with_inferences_json.
3. Criar service para carregar current.json.
4. Criar rotas GET para listar/detalhar perfis.
5. Criar agregados simples para dashboard.
6. Criar busca local para chat.
7. Chamar LLM no chat apenas com top N perfis relevantes.
8. Depois avaliar Google Scholar.
9. Depois avaliar parser estruturado mais profundo do curriculo completo.
```
