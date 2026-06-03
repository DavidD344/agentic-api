# Agentes e chamadas LLM do sistema

Este documento descreve todos os agentes conceituais do projeto, quais arquivos implementam cada agente, quais ferramentas eles usam, quais chamadas LLM existem, quais modelos sao usados por padrao e como os handoffs acontecem.

O sistema foi implementado com APIs convencionais, scripts Python, FastAPI e frontend React/Next. Os agentes nao sao apenas "personas"; cada agente corresponde a uma responsabilidade isolada do pipeline ou da aplicacao.

## Visao geral dos agentes

```txt
orchestrator_agent
  -> collector_agent
  -> lattes_preview_agent
  -> lattes_full_agent
  -> inference_agent
  -> normalization_agent
  -> sex_review_agent
  -> search_context_agent
  -> dashboard_agent
  -> profile_search_agent
  -> query_planner_agent
  -> query_answer_agent
  -> chat_title_agent
```

Os agentes principais de coleta rodam em lote. Os agentes de consulta rodam sob demanda quando o usuario usa o chat ou navega pelo dashboard/perfis.

## orchestrator_agent

Implementacao:

```txt
app/scrapers/pipeline_scrape.py
app/services/pipeline_admin_service.py
app/routers/admin_pipeline.py
```

Responsabilidade:

```txt
coordenar a execucao completa do pipeline de dados
gerar logs
decidir se uma run pode ser promovida para current.json
manter a base antiga ativa se a nova run falhar
```

Fluxo atual:

```txt
CNPq
-> preview Lattes
-> curriculo completo
-> inferencias
-> normalizacao
-> revisao de sex_inferred unknown
-> promocao do current.json
-> corpus/contexto de busca
```

Comando local:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Teste limitado:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

Rota admin:

```txt
POST /admin/pipeline/run
GET /admin/pipeline/status
```

Guardrail:

```txt
runs com limite nao promovem current.json
runs com erro/skipped/review_queue_full nao promovem current.json
se a nova run falha, a UI continua usando os dados bons anteriores
```

## collector_agent

Implementacao:

```txt
app/scrapers/simple_scrape.py
```

Responsabilidade:

```txt
raspar a tabela original do CNPq
extrair a lista base de bolsistas
salvar dados brutos e tabelas intermediarias
```

Entrada:

```txt
URL CNPq:
http://plsql1.cnpq.br/divulg/RESULTADO_PQ_102003.prc_comp_cmt_links?V_COD_DEMANDA=200310&V_TPO_RESULT=CURSO&V_COD_AREA_CONHEC=10300007&V_COD_CMT_ASSESSOR=CC
```

Saida principal:

```txt
scrape_results/<run_cnpq>/scholarships.csv
```

Campos principais:

```txt
name
scholarship_level
scholarship_start
scholarship_end
institution
situation
```

LLM:

```txt
nenhuma
```

## lattes_preview_agent

Implementacao:

```txt
app/scrapers/lattes_scrape.py
```

Responsabilidade:

```txt
buscar cada pessoa no Lattes
coletar candidatos de preview
resolver matches seguros por regra
enviar ambiguidades para revisao LLM quando necessario
gerar fila de revisao quando nao houver seguranca
```

Entrada:

```txt
scholarships.csv
```

Saidas:

```txt
scrape_results/lattes_preview/<run>/lattes_profiles.csv
scrape_results/lattes_preview/<run>/lattes_profiles.json
scrape_results/lattes_preview/<run>/review_queue.csv
scrape_results/lattes_preview/<run>/review_queue.json
scrape_results/lattes_preview/<run>/llm_review.json
scrape_results/lattes_preview/<run>/summary.json
```

Regras locais:

```txt
se ha um unico candidato com nome igual, marca como matched
se ha candidatos de nome/instituicao compativeis, tenta resolver
se ha ambiguidade real, marca como ambiguous
se nao acha candidato, marca como not_found
se ocorre falha tecnica, reprocessa casos tecnicos ate 5 vezes ao final
```

Chamada LLM:

```txt
funcao: review_ambiguous_with_llm
modelo padrao: gpt-5.4-mini
env: LATTES_LLM_MODEL
desligar: LATTES_DISABLE_LLM=1
limiar: LLM_CONFIDENCE_THRESHOLD = 0.85
```

Prompt resumido:

```txt
Voce resolve ambiguidade de perfis Lattes.
Use nome, instituicao, links externos e resumo do perfil.
O nivel da bolsa CNPq e contexto auxiliar, nao uma exigencia.
Nao trate ausencia da bolsa no preview como falta de evidencia.
Se nome, instituicao esperada e area forem fortemente compativeis, pode marcar matched.
Se houver duvida real, responda ambiguous.
Retorne apenas JSON com status, lattes_code, confidence e reason.
```

Handoff:

```txt
collector_agent -> lattes_preview_agent
scholarships.csv -> lattes_profiles.csv/json
```

## lattes_full_agent

Implementacao:

```txt
app/scrapers/lattes_scrape.py
```

Responsabilidade:

```txt
abrir o curriculo Lattes completo dos perfis resolvidos
extrair HTML, texto limpo e dados estruturados
salvar arquivos brutos por pessoa para auditoria
```

Entrada:

```txt
lattes_profiles.csv
```

Saidas:

```txt
scrape_results/lattes_full/<run>/lattes_full_profiles.csv
scrape_results/lattes_full/<run>/lattes_full_profiles.json
scrape_results/lattes_full/<run>/review_queue_full.csv
scrape_results/lattes_full/<run>/review_queue_full.json
scrape_results/lattes_full/<run>/summary.json
scrape_results/lattes_full/<run>/raw/<lattes_code_nome>/full_cv.html
scrape_results/lattes_full/<run>/raw/<lattes_code_nome>/full_cv.txt
scrape_results/lattes_full/<run>/raw/<lattes_code_nome>/full_profile.json
```

LLM:

```txt
nenhuma
```

Guardrail:

```txt
falhas no curriculo completo entram em review_queue_full
se review_queue_full tiver itens, a pipeline nao promove current.json
```

## inference_agent

Implementacao:

```txt
app/scrapers/inference_scrape.py
```

Responsabilidade:

```txt
transformar o curriculo completo em dados semanticamente consultaveis
criar campos para dashboard, busca, filtros e chat
validar regras locais com LLM
gerar resumos e tags por pessoa
registrar custos aproximados por caracteres/tokens
```

Entrada:

```txt
lattes_full_profiles.json
```

Saidas:

```txt
scrape_results/inferences/<run>/profiles_with_inferences.csv
scrape_results/inferences/<run>/profiles_with_inferences.json
scrape_results/inferences/<run>/inference_review_queue.csv
scrape_results/inferences/<run>/inference_review_queue.json
scrape_results/inferences/<run>/inference_llm.json
scrape_results/inferences/<run>/summary.json
```

Campos por regra local:

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

Campos por LLM:

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

Chamada LLM principal:

```txt
funcao: apply_llm_semantics
modelo padrao: gpt-5-nano
env: INFERENCES_LLM_MODEL
modo padrao: split
env modo: INFERENCES_LLM_MODE
desligar: INFERENCES_DISABLE_LLM=1
limitar teste: INFERENCES_LLM_LIMIT=<n>
timeout: INFERENCES_OPENAI_TIMEOUT_SECONDS
```

Modo split:

```txt
1 chamada para rule_validation
1 chamada para semantic_generation:research
1 chamada para semantic_generation:career
1 chamada para semantic_generation:experience_outputs
1 chamada para semantic_generation:dashboard_qa
```

Modo single:

```txt
1 chamada por pessoa
valida regras e gera todos os campos semantic_profile de uma vez
mais barato em overhead, mas mais arriscado para timeout e erro de JSON
```

Reparo automatico:

```txt
funcao: repair_failed_llm_decisions
modelo padrao: gpt-5.4-mini
env: INFERENCES_REPAIR_LLM_MODEL
desligar: INFERENCES_DISABLE_REPAIR=1
```

Prompt de validacao de regra:

```txt
Voce valida inferencias feitas por regras locais.
Use somente os dados fornecidos.
Repita o value se a regra estiver correta ou corrija com evidencia forte.
Se houver duvida, use unknown/null e needs_review=true.
Para sex_inferred, use principalmente o nome completo.
Nao mantenha unknown apenas porque falta marcador textual.
Retorne JSON com fields, value, confidence, reason e needs_review.
```

Prompt de geracao semantica:

```txt
Voce gera inferencias semanticas estruturadas para sistema multiagente.
Use somente os dados fornecidos.
Use summary_excerpt para area, topicos, metodos, experiencias, resumos e QA.
Use evidence_snippets como evidencia prioritaria para patentes, gestao, editoria,
internacional, industria, doutorado e marcadores textuais.
Retorne todos os campos permitidos do grupo.
Cada campo tem value, confidence, reason e needs_review.
```

Guardrail:

```txt
quando falta evidencia, usar unknown/null/lista vazia
todo campo tem confidence e needs_review
inference_review_queue separa pessoas com baixa confianca ou ambiguidade
inference_llm.json registra modelo, fase, prompt_chars e prompt_tokens_estimate
```

## normalization_agent

Implementacao:

```txt
app/scrapers/normalize_inferences.py
```

Responsabilidade:

```txt
corrigir variacoes previsiveis depois da LLM
padronizar regioes em portugues
preencher UF/regiao por mapeamento deterministico de instituicao
registrar normalization_log.json
```

Exemplos:

```txt
Northeast -> Nordeste
Southeast -> Sudeste
South -> Sul
unknown UF de USP -> SP
unknown regiao de UF SP -> Sudeste
```

LLM:

```txt
nenhuma
```

## sex_review_agent

Implementacao:

```txt
app/scrapers/review_unknown_sex.py
```

Responsabilidade:

```txt
revisar somente os casos em que sex_inferred permaneceu unknown
usar nome completo, lattes_name e resumo publico
aplicar decisao quando confianca passa do limiar
salvar sex_unknown_review_log.json
```

Chamada LLM:

```txt
modelo padrao: gpt-5.4-nano
env: SEX_REVIEW_MODEL
batch padrao: 25 perfis por chamada
env: SEX_REVIEW_BATCH_SIZE
limiar padrao: 0.68
env: SEX_REVIEW_MIN_APPLY_CONFIDENCE
timeout: OPENAI_TIMEOUT_SECONDS
```

Prompt resumido:

```txt
Voce revisa somente sex_inferred unknown.
Objetivo: inferir male, female ou unknown para estatistica agregada.
Use principalmente nome completo, lattes_name e resumo publico.
So retorne unknown se for quase impossivel inferir, ambiguo ou houver conflito.
Marcadores professor/professora, doutor/doutora etc. tem prioridade.
Retorne JSON com items, index, sex_inferred, confidence e reason.
```

Observacao etica:

```txt
sex_inferred nao e dado oficial nem declaracao da pessoa.
E uma inferencia operacional para estatisticas agregadas e deve ser exibida como inferida.
```

## search_context_agent

Implementacao:

```txt
app/services/search_corpus_service.py
app/services/minimal_profiles_context_service.py
app/services/openai_vector_store_service.py
```

Responsabilidade:

```txt
gerar corpus local para busca e File Search
gerar contexto minimo enviado nas chamadas de chat
sincronizar arquivo com vector store da OpenAI quando usado
```

Artefatos:

```txt
scrape_results/search/profiles_search_corpus.json
scrape_results/search/profiles_search_corpus_metadata.json
scrape_results/search/minimal_profiles_context.json
scrape_results/search/minimal_profiles_context.txt
scrape_results/search/vector_store.json
```

LLM:

```txt
nenhuma na construcao dos arquivos
file_search e usado depois pelo query_answer_agent
```

## dashboard_agent

Implementacao:

```txt
app/services/dashboard_service.py
app/routers/dashboard.py
uti-ia/src/screens/dashboard/Dashboard.tsx
```

Responsabilidade:

```txt
calcular metricas deterministicas da base ativa
entregar dados prontos para graficos
evitar que o frontend ou a LLM recalcule distribuicoes basicas
```

Rota:

```txt
GET /dashboard/metrics
```

Exemplos de metricas:

```txt
total de perfis
instituicoes
UFs/estados
regioes
sexo inferido
niveis de bolsa
areas principais
topicos frequentes
cruzamentos por bolsa, regiao, sexo, doutorado
```

LLM:

```txt
nenhuma
```

## profile_search_agent

Implementacao:

```txt
app/services/profile_service.py
app/routers/profiles.py
uti-ia/src/screens/profiles/Profiles.tsx
```

Responsabilidade:

```txt
listar pesquisadores
permitir filtros por nome, instituicao, bolsa, sexo, regiao, UF, area e topico
fazer busca textual normalizada e similaridade simples PT/EN
exportar CSV
```

Rota:

```txt
GET /profiles
GET /profiles/{profile_id}
GET /profiles/export.csv
```

Busca:

```txt
normaliza acentos
trata _, -, / como espaco
permite integer programming encontrar integer_programming
tem aliases leves como robotica/robotics e programacao inteira/integer programming
```

LLM:

```txt
nenhuma
```

## query_planner_agent

Implementacao:

```txt
app/services/chat_service.py
```

Responsabilidade:

```txt
ler a pergunta do usuario
nao responder ao usuario final
decidir quais dados o query_answer_agent precisa receber
decidir se a resposta precisa structured_query, topic search, file_search ou fluxo hibrido
dividir perguntas compostas em subconsultas
devolver JSON com plano de ferramentas
```

Modelo:

```txt
padrao: gpt-5.4-mini
env: CHAT_PLANNER_MODEL
fallback env: CHAT_MODEL
```

Contexto recebido:

```txt
PLANNER_PROMPT
metricas agregadas vindas de /dashboard/metrics
minimal_profiles_context.txt
historico recente da conversa
pergunta atual
```

Ferramentas planejadas:

```txt
structured_query
topic_candidate_search
file_search
dashboard_metrics_context
```

Quando usa structured_query:

```txt
contagem exata
filtros
intersecoes
rankings
distribuicoes
listagem objetiva sobre os 480 registros
```

Quando usa file_search:

```txt
pergunta aberta
consulta semantica
pergunta exploratoria
pergunta que depende do texto enriquecido
necessidade de trechos recuperados do Vector Store
```

Guardrail:

```txt
responder somente JSON valido
nunca escrever codigo
se a pergunta tiver varias subperguntas, separar em queries
para temas com contagem/listagem, usar structured_query com filtro topic
```

Handoff para o segundo agente:

```txt
query_planner_agent nao entrega resposta final.
Ele entrega um plano JSON para o backend.
O backend executa as ferramentas e monta um context_package para o query_answer_agent.
```

O `context_package` pode conter:

```txt
plano do query_planner_agent
contagens calculadas localmente
listas filtradas de perfis
candidatos de busca por topico
metricas agregadas do dashboard
trechos recuperados do Vector Store via File Search
historico recente da conversa
observacoes sobre limitacoes ou necessidade de validacao
```

## structured_query_tool

Implementacao:

```txt
app/services/chat_service.py
funcao: execute_structured_plan
```

Responsabilidade:

```txt
executar filtros deterministico/localmente sobre profiles_with_inferences.json
calcular contagens, rankings e distribuicoes
retornar candidatos para validacao semantica quando houver filtro topic
```

Operadores:

```txt
equals
contains
topic
boolean
gte
lte
```

LLM:

```txt
nenhuma para executar a ferramenta
a LLM final valida candidatos quando op=topic
```

## query_answer_agent

Implementacao:

```txt
app/services/chat_service.py
```

Responsabilidade:

```txt
receber o context_package montado a partir do plano da primeira LLM
validar semanticamente candidatos tematicos
redigir a resposta final
salvar resposta e metadata no historico do chat
```

Modelo:

```txt
padrao: gpt-5.4-mini
env: CHAT_MODEL
```

Contexto recebido:

```txt
SYSTEM_PROMPT
metricas agregadas de dashboard
minimal_profiles_context.txt
historico recente
plano do query_planner_agent
resultados structured_query
file_search_plans quando houver
trechos recuperados do Vector Store quando o planner escolhe file_search
```

File Search:

```txt
usa OpenAI file_search com vector_store_id
vector store aponta para profiles_search_corpus.json
max_num_results padrao vem da chamada ask_chat, geralmente 8
e usado sob demanda, quando o query_planner_agent indica que a pergunta precisa recuperacao semantica
o resultado do File Search entra no context_package do query_answer_agent
```

Guardrails:

```txt
nao inventar dados
se structured_query retornou resultado deterministico, usar como fonte principal
se validation_required=true, matched_count e contagem ampla de candidatos, nao resposta final
validar candidatos tematicos antes de contar
descartar falso positivo incidental, como "votacao eletronica" quando pergunta for eletronica
ao citar pessoas, sempre mostrar scholarship_level
usar scholarship_category apenas quando o usuario pedir agrupamento agregado
```

## chat_title_agent

Implementacao:

```txt
app/services/chat_service.py
funcao: generate_chat_title
```

Responsabilidade:

```txt
gerar titulo curto para nova sessao de chat
usar fallback local quando nao ha API key ou ocorre erro
```

Modelo:

```txt
padrao: gpt-5.4-nano
env: CHAT_TITLE_MODEL
```

Prompt resumido:

```txt
Voce gera titulos curtos para conversas em portugues.
Responda so o titulo, sem aspas, sem ponto final, com no maximo 6 palavras.
```

## report_agent

Estado atual:

```txt
parcial no frontend/backend
dashboard ja expoe dados exportaveis
GET /profiles/export.csv exporta perfis
exportacao PDF/CSV do dashboard ainda pode evoluir
```

Responsabilidade planejada:

```txt
gerar relatorios a partir de filtros
exportar CSV/PDF
aproveitar metricas deterministicas e respostas do chat
```

LLM:

```txt
nenhuma obrigatoria hoje
futuro: pode usar LLM para resumo narrativo de relatorio
```

## scholarResearch_agent

Estado atual:

```txt
nao integrado ao pipeline oficial
houve experimentos com app/scrapers/scholar_scrape.py
decidimos priorizar Lattes + CNPq + inferencias
```

Motivo:

```txt
Google Scholar tem maior risco de bloqueio, ambiguidades e scraping instavel
para a entrega atual, Lattes cobre melhor ano de doutorado, area, URL e curriculo
```

## Modelos por etapa

```txt
lattes_preview_agent:
  LATTES_LLM_MODEL ou gpt-5.4-mini

inference_agent:
  INFERENCES_LLM_MODEL ou LATTES_LLM_MODEL ou gpt-5-nano

inference_repair:
  INFERENCES_REPAIR_LLM_MODEL ou gpt-5.4-mini

sex_review_agent:
  SEX_REVIEW_MODEL ou gpt-5.4-nano

query_planner_agent:
  CHAT_PLANNER_MODEL ou CHAT_MODEL ou gpt-5.4-mini

query_answer_agent:
  CHAT_MODEL ou gpt-5.4-mini

chat_title_agent:
  CHAT_TITLE_MODEL ou gpt-5.4-nano
```

## Handoffs principais

```txt
collector_agent
  scholarships.csv
  -> lattes_preview_agent

lattes_preview_agent
  lattes_profiles.csv/json
  -> lattes_full_agent

lattes_full_agent
  lattes_full_profiles.json
  -> inference_agent

inference_agent
  profiles_with_inferences.json
  -> normalization_agent

normalization_agent
  profiles_with_inferences.json normalizado
  -> sex_review_agent

sex_review_agent
  profiles_with_inferences.json revisado
  -> orchestrator_agent

orchestrator_agent
  current.json
  -> dashboard_agent, profile_search_agent, search_context_agent

search_context_agent
  profiles_search_corpus.json + vector_store_id
  -> query_answer_agent

query_planner_agent
  plano JSON
  -> structured_query_tool e query_answer_agent

query_answer_agent
  resposta + metadata
  -> chat_storage_service
```

## Guardrails globais

```txt
rotas HTTP nao fazem scraping diretamente
scraping fica em app/scrapers
services coordenam leitura, metricas e regras
routers apenas expoem API
current.json e o ponteiro da base ativa
run nova so substitui current.json se estiver valida
dados inferidos sempre carregam confidence, source, reason e needs_review
sexo e inferido, nao confirmado
busca tematica usa validacao semantica antes de resposta final
respostas do chat devem diferenciar scholarship_level de scholarship_category
logs e summaries sao mantidos para auditoria
```

## Onde auditar chamadas LLM

```txt
scrape_results/lattes_preview/<run>/llm_review.json
scrape_results/inferences/<run>/inference_llm.json
scrape_results/inferences/<run>/summary.json
scrape_results/inferences/<run>/sex_unknown_review_log.json
scrape_results/chat/sessions.json
```

No chat, cada resposta salva metadata com:

```txt
model
planner_model
planner_response_id
plan
tool_results
file_search_plans
context_mode
vector_store_id
max_num_results
response_id
annotations
```
