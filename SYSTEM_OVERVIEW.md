# Visão geral do sistema multiagente

Este documento registra o estado atual do projeto e deve ser usado como referência curta para apresentação, manutenção e handoff para frontend.

## Objetivo

O sistema coleta, enriquece e disponibiliza dados de bolsistas PQ de Ciência da Computação a partir de uma tabela pública do CNPq e de currículos Lattes.

Requisitos cobertos:

```txt
RF01: gerar dataset com nome, sexo, instituição, UF, nível da bolsa, área de atuação,
      ano de doutorado, URL e dados úteis de perfil
RF02: disponibilizar dashboard
RF03: permitir exportação CSV
RF04: interface de consulta por linguagem natural
RF05: gerar logs das operações
```

## Arquitetura

O desenho principal separa scraping, regra de negócio, API e frontend:

```txt
scrapers -> services -> routers -> frontend
```

Para o chat, o desenho é multiagente:

```txt
usuário
  -> agente planejador
  -> ferramenta local ou file_search
  -> agente redator/validador
  -> resposta
```

## Dataset ativo

Fonte atual em `scrape_results/current.json`:

```txt
pipeline_run_dir: scrape_results/pipeline/20260526_210837
cnpq_run_dir: scrape_results/20260526_210837
preview_run_dir: scrape_results/lattes_preview/20260526_210838
active_full_run: scrape_results/lattes_full/20260526_212601
inference_run_dir: scrape_results/inferences/20260527_174328
profiles_with_inferences_json: scrape_results/inferences/20260527_174328/profiles_with_inferences.json
```

Resumo atual:

```txt
total_profiles: 480
sex_inferred:
  male: 397
  female: 83

institution_region:
  Sudeste: 266
  Nordeste: 106
  Sul: 82
  Centro-Oeste: 15
  Norte: 11

scholarship_category:
  PQ-C: 169
  PQ-2: 162
  PQ-1: 113
  unknown: 36
```

Observação: `scholarship_category=unknown` ocorre porque existem níveis como `PQ-A`, `PQ-B` e `PQ-SR`. Eles não foram agregados em `PQ-1/PQ-2/PQ-C` para evitar classificação arbitrária.

## Etapas do pipeline

### 1. Coleta CNPq

Script:

```txt
app/scrapers/simple_scrape.py
```

Responsabilidade:

```txt
coletar a tabela pública do CNPq
extrair name, scholarship_level, scholarship_start, scholarship_end, institution, situation
salvar resultados em scrape_results/<timestamp>/
```

Essa etapa não usa LLM.

### 2. Preview Lattes

Script:

```txt
app/scrapers/lattes_scrape.py
```

Responsabilidade:

```txt
buscar cada pessoa no Lattes
lidar com paginação
coletar candidatos
resolver matches seguros por nome/instituição
mandar ambiguidades para revisão LLM, se configurada
gerar lattes_profiles.csv/json e review_queue.csv/json
```

Modelo configurável:

```txt
LATTES_LLM_MODEL=gpt-5.4-mini
LATTES_DISABLE_LLM=0
```

Uso da LLM:

```txt
apenas nos casos ambíguos
recebe nome esperado, instituição esperada, bolsa como contexto, candidatos Lattes e resumos públicos
não exige que o preview comprove bolsa CNPq
```

### 3. Currículo Lattes completo

Script:

```txt
app/scrapers/lattes_scrape.py
```

Responsabilidade:

```txt
usar lattes_profiles resolvidos
baixar página completa do currículo
extrair HTML, texto cru, resumo, seções, links e foto quando disponível
salvar raw/ por pessoa
gerar lattes_full_profiles.csv/json
```

Essa etapa não usa LLM por padrão.

### 4. Inferências semânticas

Script:

```txt
app/scrapers/inference_scrape.py
```

Responsabilidade:

```txt
gerar campos úteis para dashboard, busca e chat
validar regras locais
criar áreas, tópicos, métodos, domínio de aplicação, senioridade e resumo curto
salvar profiles_with_inferences.csv/json
salvar inference_llm.json e summary.json
```

Configuração documentada:

```txt
INFERENCES_LLM_MODEL=gpt-5-nano
INFERENCES_LLM_MODE=split
INFERENCES_REPAIR_LLM_MODEL=gpt-5.4-mini
INFERENCES_RULE_TEXT_MAX_CHARS=6000
INFERENCES_SEMANTIC_TEXT_MAX_CHARS=6000
INFERENCES_EVIDENCE_SNIPPETS_MAX=14
INFERENCES_EVIDENCE_SNIPPETS_PER_KIND=2
INFERENCES_EVIDENCE_SNIPPET_CHARS=650
```

Campos de regra local:

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

Campos gerados/validados por LLM:

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

### 5. Normalizações pós-run

Scripts:

```txt
app/scrapers/normalize_inferences.py
app/scrapers/review_unknown_sex.py
```

Normalizações já aplicadas na base atual:

```txt
regiões em inglês -> português
instituições sem UF mapeada -> UF/região
sex_inferred unknown -> revisão por nome completo + Lattes
```

Política atual de `sex_inferred`:

```txt
campo inferido para estatística e dashboard, não confirmação documental
usa nome completo, lattes_name e marcadores textuais do Lattes
unknown só permanece se for quase impossível inferir, ambíguo ou conflitante
```

Rodada atual:

```txt
male: 397
female: 83
unknown: 0
```

### 6. Contexto de busca e chat

Arquivos:

```txt
scrape_results/search/minimal_profiles_context.json
scrape_results/search/minimal_profiles_context.txt
scrape_results/search/profiles_search_corpus.json
scrape_results/search/profiles_search_corpus_metadata.json
scrape_results/search/vector_store.json
```

Tamanhos atuais:

```txt
minimal_profiles_context.txt: 38.132 caracteres
profiles_search_corpus.json: 2.564.398 caracteres
```

`minimal_profiles_context` contém uma linha compacta por pessoa:

```txt
name
first_name
sex_inferred
institution
scholarship_level
scholarship_category
institution_state_uf
institution_region
```

Regra de uso da bolsa:

```txt
scholarship_level é o nível real da bolsa e deve ser usado por padrão no front e nas respostas da LLM.
scholarship_category é apenas uma agregação para perguntas como PQ-1 vs PQ-2.
```

`profiles_search_corpus.json` é o corpus enriquecido para busca semântica e File Search.

## Agentes

### collector_agent

Implementação:

```txt
app/scrapers/simple_scrape.py
```

Função:

```txt
coletar tabela CNPq
gerar scholarships.csv
```

LLM:

```txt
não usa
```

### lattes_preview_agent

Implementação:

```txt
app/scrapers/lattes_scrape.py
```

Função:

```txt
buscar currículo Lattes correto
resolver nome/instituição
lidar com paginação e duplicidade
```

LLM:

```txt
modelo: LATTES_LLM_MODEL, atual gpt-5.4-mini quando habilitado
uso: apenas ambiguidades
```

### lattes_full_agent

Implementação:

```txt
app/scrapers/lattes_scrape.py
```

Função:

```txt
baixar currículo completo
extrair HTML, texto, seções, foto e links
```

LLM:

```txt
não usa
```

### inference_agent

Implementação:

```txt
app/scrapers/inference_scrape.py
```

Função:

```txt
transformar dados brutos em campos consultáveis
gerar área principal, tópicos, métodos, domínio, resumo e tags
validar regras locais
```

LLM:

```txt
modelo principal: INFERENCES_LLM_MODEL, documentado como gpt-5-nano
modelo de reparo: INFERENCES_REPAIR_LLM_MODEL, documentado como gpt-5.4-mini
modo: split
```

### normalization_agent

Implementação:

```txt
app/scrapers/normalize_inferences.py
app/scrapers/review_unknown_sex.py
```

Função:

```txt
corrigir normalizações pós-run
revisar sex_inferred unknown
salvar logs auditáveis
```

LLM:

```txt
review_unknown_sex usa SEX_REVIEW_MODEL
rodadas recentes usaram gpt-5.4-nano e gpt-5.4-mini
```

### dashboard_agent

Implementação:

```txt
app/services/dashboard_service.py
app/routers/dashboard.py
```

Função:

```txt
calcular métricas, distribuições, rankings e cruzamentos
alimentar dashboard e contexto do chat
```

LLM:

```txt
não usa
```

### query_planner_agent

Implementação:

```txt
app/services/chat_service.py
```

Função:

```txt
entender a pergunta do usuário
separar perguntas compostas em subconsultas
decidir structured_query ou file_search
gerar plano JSON controlado
```

Modelo atual:

```txt
CHAT_PLANNER_MODEL=gpt-5.4-mini
```

Contexto recebido:

```txt
prompt de planejamento
métricas do dashboard
minimal_profiles_context
até 4 mensagens recentes
pergunta atual
```

### tool_executor

Implementação:

```txt
app/services/chat_service.py
app/services/profile_service.py
app/services/dashboard_service.py
OpenAI File Search
```

Função:

```txt
executar filtros e agregações locais
contar, listar, agrupar e ranquear
buscar trechos no Vector Store quando necessário
```

LLM:

```txt
não executa código gerado por LLM
executa apenas DSL segura com campos e operadores permitidos
```

### answer_agent

Implementação:

```txt
app/services/chat_service.py
```

Função:

```txt
validar candidatos temáticos
descartar falso positivo textual
redigir resposta final em português
responder subperguntas na mesma ordem
```

Modelo atual:

```txt
CHAT_MODEL=gpt-5.4
```

Contexto recebido:

```txt
prompt de resposta final
métricas do dashboard
minimal_profiles_context
até 8 mensagens recentes
plano do query_planner_agent
resultados de structured_query
ou trechos recuperados por file_search
```

### title_agent

Implementação:

```txt
app/services/chat_service.py
app/routers/legacy_session.py
```

Função:

```txt
gerar título curto para conversa no momento em que o front cria uma nova sessão
```

Modelo atual:

```txt
CHAT_TITLE_MODEL=gpt-5.4-nano
```

Fallback:

```txt
se a chamada falhar, usa as primeiras palavras da pergunta
```

## Chat e custo

Configuração atual:

```txt
CHAT_MODEL=gpt-5.4
CHAT_PLANNER_MODEL=gpt-5.4-mini
CHAT_TITLE_MODEL=gpt-5.4-nano
CHAT_DISABLE_STRUCTURED_QUERY=0
```

Uma pergunta normal faz:

```txt
1 chamada para query_planner_agent
1 chamada para answer_agent
```

Ou seja:

```txt
1 pergunta = normalmente 2 chamadas OpenAI
5 perguntas = normalmente 10 chamadas OpenAI
```

Se for a primeira pergunta de uma conversa nova:

```txt
1 chamada title_agent
1 chamada query_planner_agent
1 chamada answer_agent
= até 3 chamadas
```

Por que perguntas abertas custam mais:

```txt
as duas LLMs recebem métricas + minimal_profiles_context
a segunda LLM usa gpt-5.4
perguntas temáticas podem enviar até CHAT_TOPIC_VALIDATION_LIMIT candidatos compactos
file_search pode adicionar custo de ferramenta e trechos recuperados
histórico recente entra no contexto
```

Contexto base atual enviado para o chat:

```txt
dashboard_metrics_context: cerca de 3.201 caracteres
minimal_profiles_context_text: cerca de 38.132 caracteres
full_agent_context: cerca de 41 mil caracteres
estimativa simples: cerca de 10 mil tokens antes de histórico e resultados
```

Essa configuração foi escolhida para estabilidade e qualidade na apresentação, não para custo mínimo.

Modo econômico futuro:

```txt
usar CHAT_MODEL=gpt-5.4-mini
usar CHAT_PLANNER_MODEL=gpt-5.4-nano
enviar minimal_profiles_context apenas quando necessário
reduzir CHAT_TOPIC_VALIDATION_LIMIT
usar respostas estruturadas locais para contagens simples
```

## Rotas principais

Saúde:

```txt
GET /
```

Autenticação demo:

```txt
POST /login
email: admin@admin.com
senha: admin
```

Dashboard:

```txt
GET /dashboard/metrics
```

Perfis:

```txt
GET /profiles
GET /profiles/{profile_id}
GET /profiles/export.csv
```

Chat moderno:

```txt
POST /chat/corpus/rebuild
POST /chat/vector-store/sync
GET /chat/vector-store
POST /chat/sessions
GET /chat/sessions
GET /chat/sessions/{session_id}
PATCH /chat/sessions/{session_id}
DELETE /chat/sessions/{session_id}
POST /chat/sessions/{session_id}/ask
```

Chat legado usado pelo frontend atual:

```txt
POST /session
GET /session
GET /session/{session_id}/message
POST /session/{session_id}/message
```

Admin pipeline:

```txt
POST /admin/pipeline/run
GET /admin/pipeline/status
```

## Handoffs

Fluxo de dados:

```txt
collector_agent
  -> scholarships.csv
  -> lattes_preview_agent
  -> lattes_profiles.csv/json
  -> lattes_full_agent
  -> lattes_full_profiles.csv/json
  -> inference_agent
  -> profiles_with_inferences.csv/json
  -> normalization_agent
  -> search corpus + minimal context
  -> dashboard_agent + query agents
```

Fluxo do chat:

```txt
frontend
  -> legacy_session router ou chat router
  -> query_planner_agent
  -> tool_executor
  -> answer_agent
  -> histórico local da sessão
  -> frontend via stream SSE
```

## Guardrails

Scraping:

```txt
cada run salva pasta própria
raw HTML/texto são preservados para auditoria
casos ambíguos vão para review_queue
pipeline com limite não promove current.json
```

LLM:

```txt
LLM não executa Python livre
planner retorna JSON com campos e operadores permitidos
backend executa filtros em DSL segura
resposta final não deve inventar números fora dos resultados
topic search exige validação semântica
```

Dados sensíveis:

```txt
sex_inferred é inferido, não confirmado
deve ser apresentado como sexo inferido automaticamente
```

## Arquivos de auditoria

Principais:

```txt
scrape_results/current.json
scrape_results/pipeline/<run>/pipeline_summary.json
scrape_results/lattes_preview/<run>/summary.json
scrape_results/lattes_full/<run>/summary.json
scrape_results/inferences/<run>/summary.json
scrape_results/inferences/<run>/inference_llm.json
scrape_results/inferences/<run>/normalization_log.json
scrape_results/inferences/<run>/sex_unknown_review_log.json
scrape_results/search/profiles_search_corpus_metadata.json
scrape_results/search/vector_store.json
logs/pipeline_<run>.log
```

## Comandos úteis

Rodar API:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload --port 8001
```

Rodar pipeline completo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Rodar pipeline de teste com limite:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

Reconstruir contexto mínimo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/services/minimal_profiles_context_service.py
```

Observação: o pipeline completo já reconstrói esse arquivo automaticamente depois que promove um novo `current.json`. Use esse comando apenas para reprocessamento local.

Reconstruir corpus local:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python - <<'PY'
from app.services.search_corpus_service import build_search_corpus
print(build_search_corpus())
PY
```

Observação: o pipeline completo já reconstrói esse corpus automaticamente depois que promove um novo `current.json`. Use esse comando apenas para reprocessamento local.

Revisar sexo unknown de uma run:

```bash
env UV_CACHE_DIR=/tmp/uv-cache SEX_REVIEW_MODEL=gpt-5.4-mini uv run python app/scrapers/review_unknown_sex.py scrape_results/inferences/<run>
```

Observação: o pipeline completo já tenta essa revisão automaticamente quando `OPENAI_API_KEY` está configurada.

Normalizar uma run:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/normalize_inferences.py scrape_results/inferences/<run>
```

Observação: o pipeline completo já roda essa normalização automaticamente depois das inferências.

## Decisões arquiteturais relacionadas

ADRs:

```txt
ADR/0001-local-csv-json-storage.md
ADR/0002-scraping-pipeline-stages.md
ADR/0003-file-search-and-structured-query-chat.md
ADR/0004-two-agent-chat-flow.md
ADR/0005-topic-validation.md
ADR/0006-local-authentication-for-demo.md
ADR/0007-dashboard-metrics-as-shared-context.md
```

Documentos complementares:

```txt
SCRAPING.md
API_ROUTES.md
DATASET_CONTRACT.md
SCRAPING_PIPELINE_DETAILED.md
```
