# Funcionamento da ferramenta do zero ao uso final

Este documento explica o funcionamento completo da ferramenta desde o primeiro scraping ate o dashboard, busca de pesquisadores, chat em linguagem natural e regeneracao da base.

Ele serve como roteiro para explicar o projeto em apresentacao.

## Objetivo da ferramenta

O trabalho pede um sistema multiagente que, a partir da pagina do CNPq, consiga:

```txt
1. gerar dataset de bolsistas
2. enriquecer dados com Lattes
3. inferir sexo, UF, area, ano de doutorado, topicos e outros campos uteis
4. disponibilizar dashboard
5. exportar dados
6. responder consultas em linguagem natural
7. registrar logs das operacoes
```

Fonte inicial:

```txt
http://plsql1.cnpq.br/divulg/RESULTADO_PQ_102003.prc_comp_cmt_links?V_COD_DEMANDA=200310&V_TPO_RESULT=CURSO&V_COD_AREA_CONHEC=10300007&V_COD_CMT_ASSESSOR=CC
```

## Arquitetura geral

O projeto separa responsabilidades em camadas:

```txt
router -> service -> scraper
```

Na pratica:

```txt
app/routers/
  expoe rotas HTTP

app/services/
  le arquivos ativos, calcula metricas, executa consultas, coordena chat

app/scrapers/
  coleta CNPq, busca Lattes, baixa curriculo completo, gera inferencias e pipeline

scrape_results/
  guarda dados brutos, intermediarios e finais

logs/
  guarda logs de pipeline

uti-ia/
  frontend Next/React
```

Principio importante:

```txt
a rota HTTP nao sabe raspar site
a rota chama service
o service chama scraper ou le dados prontos
```

## Comando principal

Para rodar tudo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Para teste pequeno:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

O argumento `10` limita a quantidade de pessoas processadas. Runs limitadas nao promovem `current.json`.

## Visao macro do pipeline

```txt
Etapa 0: CNPq scholarships
  -> scrape_results/<run_cnpq>/scholarships.csv

Etapa 1: Lattes preview
  -> scrape_results/lattes_preview/<run>/lattes_profiles.csv

Etapa 2: Lattes curriculo completo
  -> scrape_results/lattes_full/<run>/lattes_full_profiles.json

Etapa 3: Inferencias
  -> scrape_results/inferences/<run>/profiles_with_inferences.json

Etapa 4: Normalizacao
  -> scrape_results/inferences/<run>/normalization_log.json

Etapa 5: Revisao sex_inferred unknown
  -> scrape_results/inferences/<run>/sex_unknown_review_log.json

Etapa 6: Promocao e artefatos de busca
  -> scrape_results/current.json
  -> scrape_results/search/profiles_search_corpus.json
  -> scrape_results/search/minimal_profiles_context.json
```

## Etapa 0: scraping da tabela CNPq

Arquivo:

```txt
app/scrapers/simple_scrape.py
```

O que faz:

```txt
1. abre a pagina do CNPq
2. salva HTML bruto
3. extrai tabelas
4. identifica a tabela dos bolsistas
5. gera scholarships.csv
```

Saidas:

```txt
scrape_results/<run_cnpq>/page.html
scrape_results/<run_cnpq>/links.json
scrape_results/<run_cnpq>/table_*.csv
scrape_results/<run_cnpq>/scholarships.csv
```

Campos de `scholarships.csv`:

```txt
name
scholarship_level
scholarship_start
scholarship_end
institution
situation
```

Por que essa etapa e deterministica:

```txt
a pagina ja tem uma tabela estruturada
nao precisa de LLM
o objetivo e preservar a fonte inicial
```

## Etapa 1: busca no Lattes preview

Arquivo:

```txt
app/scrapers/lattes_scrape.py
```

O que faz:

```txt
1. le scholarships.csv
2. pesquisa cada nome no Lattes
3. coleta candidatos do preview
4. captura nome, codigo Lattes, resumo, links, ORCID quando existir
5. tenta resolver match automaticamente
6. usa LLM para ambiguidades, se configurada
7. separa casos nao resolvidos em review_queue
```

Saidas:

```txt
scrape_results/lattes_preview/<run>/lattes_profiles.csv
scrape_results/lattes_preview/<run>/lattes_profiles.json
scrape_results/lattes_preview/<run>/review_queue.csv
scrape_results/lattes_preview/<run>/review_queue.json
scrape_results/lattes_preview/<run>/candidates.json
scrape_results/lattes_preview/<run>/llm_review.json
scrape_results/lattes_preview/<run>/summary.json
```

Como lida com ambiguidades:

```txt
matched:
  perfil foi escolhido com seguranca

ambiguous:
  existem candidatos plausiveis
  entra em review_queue se regra/LLM nao resolverem

not_found:
  nenhum candidato suficiente

technical_error:
  erro tecnico, pode ser retentado
```

LLM nessa etapa:

```txt
modelo padrao: gpt-5.4-mini
env: LATTES_LLM_MODEL
desligar: LATTES_DISABLE_LLM=1
```

Por que usar LLM aqui:

```txt
alguns nomes retornam mais de um candidato
nome igual nao basta
instituicao, area e resumo ajudam a decidir
a LLM atua como revisor de ambiguidade, nao como fonte de dados nova
```

## Etapa 2: curriculo Lattes completo

Arquivo:

```txt
app/scrapers/lattes_scrape.py
```

O que faz:

```txt
1. recebe lattes_profiles.csv
2. abre curriculo completo de cada matched
3. salva HTML bruto
4. salva texto limpo
5. extrai dados estruturados principais
6. gera CSV e JSON para proxima etapa
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

Por que salvar HTML e TXT:

```txt
auditoria
debug
reprocessamento sem raspar tudo de novo
explicacao de onde vieram inferencias
```

LLM nessa etapa:

```txt
nenhuma
```

## Etapa 3: inferencias semanticas

Arquivo:

```txt
app/scrapers/inference_scrape.py
```

O que faz:

```txt
1. le lattes_full_profiles.json
2. cria inferencias por regra
3. chama LLM para validar regras
4. chama LLM para gerar campos semanticos
5. repara erros de LLM com modelo mais forte, se necessario
6. salva CSV, JSON, review_queue e logs
```

Campos base preservados:

```txt
name
institution
scholarship_level
lattes_code
lattes_name
lattes_url
photo_url
orcid
summary
```

Campos por regra:

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

Formato de cada inferencia:

```json
{
  "value": "valor inferido",
  "confidence": 0.85,
  "source": "rule|llm|llm_validated_rule|llm_corrected_rule",
  "needs_review": false,
  "reason": "motivo curto"
}
```

Modelos:

```txt
modelo principal padrao: gpt-5-nano
env: INFERENCES_LLM_MODEL

modelo de reparo padrao: gpt-5.4-mini
env: INFERENCES_REPAIR_LLM_MODEL
```

Modo padrao:

```txt
INFERENCES_LLM_MODE=split
```

No modo split, por pessoa:

```txt
1 chamada rule_validation
1 chamada semantic_generation:research
1 chamada semantic_generation:career
1 chamada semantic_generation:experience_outputs
1 chamada semantic_generation:dashboard_qa
```

Por que nao mandar o curriculo inteiro:

```txt
curriculos sao grandes
isso encarece e aumenta timeout
o pipeline manda resumo, trechos relevantes e evidence snippets
o resultado vira campos consultaveis e baratos para dashboard/chat
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

## Etapa 4: normalizacao

Arquivo:

```txt
app/scrapers/normalize_inferences.py
```

O que faz:

```txt
corrige variacoes previsiveis da LLM
normaliza regioes em portugues
preenche UF/regiao unknown usando mapa deterministico de instituicoes
```

Exemplos:

```txt
Northeast -> Nordeste
North -> Norte
Southeast -> Sudeste
USP -> SP -> Sudeste
UFRJ -> RJ -> Sudeste
```

Saida:

```txt
scrape_results/inferences/<run>/normalization_log.json
```

LLM:

```txt
nenhuma
```

## Etapa 5: revisao de sex_inferred unknown

Arquivo:

```txt
app/scrapers/review_unknown_sex.py
```

O que faz:

```txt
pega somente perfis com sex_inferred=unknown
envia lotes para LLM
usa nome completo, lattes_name e resumo
aplica male/female se confianca passar do limiar
mantem unknown em caso ambiguo
```

Modelo:

```txt
padrao: gpt-5.4-nano
env: SEX_REVIEW_MODEL
```

Saida:

```txt
scrape_results/inferences/<run>/sex_unknown_review_log.json
```

Observacao:

```txt
sex_inferred e campo inferido, nao dado oficial.
serve para estatisticas agregadas no dashboard.
```

## Etapa 6: promocao da base ativa

Arquivo:

```txt
scrape_results/current.json
```

O `current.json` e o ponteiro oficial da base ativa.

Exemplo de conteudo:

```json
{
  "pipeline_run_dir": "scrape_results/pipeline/<run>",
  "cnpq_run_dir": "scrape_results/<run_cnpq>",
  "preview_run_dir": "scrape_results/lattes_preview/<run>",
  "active_full_run": "scrape_results/lattes_full/<run>",
  "inference_run_dir": "scrape_results/inferences/<run>",
  "profiles_with_inferences_json": "scrape_results/inferences/<run>/profiles_with_inferences.json",
  "profiles_search_corpus_json": "scrape_results/search/profiles_search_corpus.json",
  "minimal_profiles_context_json": "scrape_results/search/minimal_profiles_context.json"
}
```

Por que usar manifest:

```txt
as runs antigas continuam salvas
a UI sempre sabe qual base usar
se uma nova run falha, a base antiga continua ativa
fica facil auditar data e origem dos dados
```

## Etapa 7: corpus de busca e contexto minimo

Arquivos:

```txt
app/services/search_corpus_service.py
app/services/minimal_profiles_context_service.py
```

Saidas:

```txt
scrape_results/search/profiles_search_corpus.json
scrape_results/search/profiles_search_corpus_metadata.json
scrape_results/search/minimal_profiles_context.json
scrape_results/search/minimal_profiles_context.txt
```

`profiles_search_corpus.json`:

```txt
arquivo rico por pessoa
inclui semantic_profile compacto
inclui search_text com resumo, topicos, metodos, experiencias e qa_context
usado para File Search e consultas semanticas
```

`minimal_profiles_context.txt`:

```txt
arquivo bem compacto
uma linha por pessoa
nome, primeiro nome, sexo inferido, instituicao, bolsa, categoria, UF, regiao
enviado ao planner e ao agente final do chat
```

## Vector store e File Search

Arquivos:

```txt
app/services/openai_vector_store_service.py
scrape_results/search/vector_store.json
```

O que acontece:

```txt
1. gera profiles_search_corpus.json
2. faz upload do arquivo para OpenAI
3. cria/usa vector store
4. salva vector_store_id em vector_store.json
5. em perguntas futuras, envia apenas vector_store_id
```

Por que nao enviar arquivo inteiro em toda pergunta:

```txt
fica caro
pode estourar limite de contexto/tokens
nao e bom para contagens exatas
```

Papel correto do File Search:

```txt
perguntas abertas
busca semantica
exploracao por area, resumo, temas e experiencia
```

Para contagens exatas:

```txt
usa structured_query local no backend
```

## API backend

Arquivo principal:

```txt
app/main.py
```

Rotas principais:

```txt
GET /
POST /auth/login
GET /dashboard/metrics
GET /profiles
GET /profiles/{profile_id}
GET /profiles/export.csv
POST /session
GET /session
GET /session/{session_id}/messages
POST /session/{session_id}/message
POST /admin/pipeline/run
GET /admin/pipeline/status
```

## Dashboard

Backend:

```txt
app/services/dashboard_service.py
app/routers/dashboard.py
```

Frontend:

```txt
uti-ia/src/screens/dashboard/Dashboard.tsx
```

Fonte:

```txt
scrape_results/current.json
-> profiles_with_inferences.json
```

Graficos atuais:

```txt
cards gerais: bolsistas, instituicoes, estados, sexo inferido
grafico dinamico com rankings/filtros
sexo inferido por nivel de bolsa
ano de doutorado por faixa
senioridade inferida
regiao por nivel de bolsa
tempo desde doutorado por nivel de bolsa
concentracao institucional
area por nivel de bolsa
```

Por que metricas no backend:

```txt
evita recalcular no frontend
da dados prontos para graficos
permite reaproveitar metricas no chat
```

## Tela de pesquisadores

Backend:

```txt
app/services/profile_service.py
app/routers/profiles.py
```

Frontend:

```txt
uti-ia/src/screens/profiles/Profiles.tsx
```

Funcionalidades:

```txt
listagem com foto
busca por nome, area, topico e texto
filtros por instituicao, bolsa, sexo e regiao
paginacao
link para Lattes
export CSV
```

Busca:

```txt
normaliza acentos
normaliza underscores
integer programming encontra integer_programming
programacao inteira encontra topicos relacionados
robotica e robotics sao tratados como aliases
```

## Chat em linguagem natural

Arquivos:

```txt
app/services/chat_service.py
app/services/chat_storage_service.py
app/routers/legacy_session.py
uti-ia/src/screens/chat/Chat.tsx
```

Fluxo de uma pergunta:

```txt
1. usuario manda pergunta no frontend
2. backend salva mensagem do usuario
3. query_planner_agent recebe pergunta + contexto agregado + contexto minimo
4. planner retorna JSON dizendo quais ferramentas usar
5. backend executa structured_query quando necessario
6. backend prepara file_search quando necessario
7. query_answer_agent recebe plano + resultados + historico
8. query_answer_agent valida candidatos tematicos e redige resposta final
9. backend salva resposta e metadata
10. frontend mostra resposta
```

Primeira LLM:

```txt
query_planner_agent
modelo padrao: gpt-5.4-mini
env: CHAT_PLANNER_MODEL
saida: JSON de plano
```

Segunda LLM:

```txt
query_answer_agent
modelo padrao: gpt-5.4-mini
env: CHAT_MODEL
saida: resposta final em portugues
```

Titulo do chat:

```txt
chat_title_agent
modelo padrao: gpt-5.4-nano
env: CHAT_TITLE_MODEL
```

Ferramentas do chat:

```txt
structured_query:
  contagens, filtros, distribuicoes, rankings, listagens objetivas

file_search:
  perguntas abertas e semanticas usando vector store

dashboard metrics:
  contexto agregado enviado sempre

minimal_profiles_context:
  contexto compacto por pessoa enviado sempre
```

Exemplo:

```txt
Pergunta:
Quantas pessoas da USP trabalham com robotica?

Planner:
structured_query com institution=USP e topic=robotica

Backend:
filtra candidatos localmente

LLM final:
valida se cada candidato realmente atua em robotica
responde contagem validada e exemplos
```

## Frontend

Pasta:

```txt
uti-ia/
```

Principais telas:

```txt
/login
/dashboard
/profiles
/chat
/chat/[sessionId]
```

Navbar autenticada:

```txt
Dashboard
Pesquisadores
Chat
menu de conta/sair
```

Autenticacao atual:

```txt
POST /auth/login
email: admin@admin.com
senha: admin
```

Observacao:

```txt
autenticacao e hardcoded para demo
nao e solucao de producao
```

## Logs e auditoria

Pipeline:

```txt
logs/pipeline_<timestamp>.log
scrape_results/pipeline/<run>/pipeline_summary.json
```

Lattes preview:

```txt
llm_review.json
review_queue.csv/json
candidates.json
summary.json
```

Lattes full:

```txt
review_queue_full.csv/json
summary.json
raw/<pessoa>/full_cv.html
raw/<pessoa>/full_cv.txt
raw/<pessoa>/full_profile.json
```

Inferencias:

```txt
inference_llm.json
inference_review_queue.csv/json
summary.json
normalization_log.json
sex_unknown_review_log.json
```

Chat:

```txt
scrape_results/chat/sessions.json
metadata por resposta com modelo, plano, ferramentas e vector_store_id
```

## Dados finais usados pela aplicacao

Principal:

```txt
scrape_results/current.json
```

Dataset final:

```txt
profiles_with_inferences.json
profiles_with_inferences.csv
```

Busca/chat:

```txt
profiles_search_corpus.json
minimal_profiles_context.json
minimal_profiles_context.txt
vector_store.json
```

Dashboard:

```txt
GET /dashboard/metrics
```

Pesquisadores:

```txt
GET /profiles
```

Chat:

```txt
POST /session/{session_id}/message
```

## Como explicar a decisao de design

### Por que CSV/JSON local?

```txt
facil de auditar
facil de abrir manualmente
evita banco antes da modelagem estabilizar
bom para demonstracao
current.json resolve versionamento da base ativa
```

### Por que inferir antes do chat?

```txt
curriculo Lattes bruto e grande e irregular
perguntas do professor precisam de campos consultaveis
inferencias geram area, topicos, senioridade, experiencias e resumo compacto
isso reduz custo no chat e melhora graficos/filtros
```

### Por que duas LLMs no chat?

```txt
planner decide ferramenta certa
answer agent redige e valida
contagens ficam deterministicas no backend
perguntas semanticas usam File Search
isso evita usar LLM como calculadora cega
```

### Por que structured_query e File Search?

```txt
File Search e bom para recuperar trechos relevantes
File Search nao garante contagem exata
structured_query garante contagens, filtros e rankings
LLM final ajuda a validar temas subjetivos
```

### Por que nao usar Google Scholar agora?

```txt
Google Scholar e mais instavel para scraping
tem mais risco de bloqueio e ambiguidade
Lattes e CNPq ja cobrem os requisitos essenciais da entrega
Scholar pode ser agente futuro
```

## Checklist de apresentacao

```txt
1. mostrar fonte CNPq
2. explicar scholarships.csv
3. explicar busca Lattes preview e ambiguidades
4. explicar curriculo completo e arquivos raw
5. explicar inferencias e confidence
6. explicar current.json como base ativa
7. mostrar dashboard
8. mostrar pesquisadores com filtros
9. mostrar chat e planejamento de ferramentas
10. mostrar logs e auditabilidade
```

## Comandos uteis

Rodar API:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload
```

Rodar API em outra porta:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload --port 8001
```

Rodar pipeline completo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Rodar pipeline limitado:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

Ver base ativa:

```bash
cat scrape_results/current.json
```

Rodar frontend:

```bash
cd uti-ia
npm run dev
```

Rodar lint do frontend:

```bash
cd uti-ia
npm run lint
```

Validar sintaxe Python:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python -m compileall app
```
