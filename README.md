# Agentic API

Projeto em Python para coletar, normalizar e enriquecer dados de bolsistas do CNPq com informações públicas do Currículo Lattes.

O foco atual do projeto é o pipeline de scraping. A API FastAPI existe como base para a aplicação, mas a coleta ainda está sendo desenvolvida e validada primeiro por comandos locais. Isso deixa o scraping mais fácil de testar, repetir e auditar antes de virar endpoint.

## Objetivo

A fonte inicial é uma tabela pública do CNPq com bolsistas PQ de Ciência da Computação. Essa tabela já traz dados bem estruturados:

```txt
name
scholarship_level
scholarship_start
scholarship_end
institution
situation
```

Depois disso, o projeto busca cada pessoa no Lattes para descobrir o currículo correto e, em uma segunda etapa, baixar o currículo completo.

O resultado esperado é uma base enriquecida que pode ser revisada por humanos ou por agentes antes de ser usada em análises, resumos, embeddings, banco de dados ou interface web.

## Por que o scraping está separado

Scraping costuma ser instável: páginas mudam, servidores falham, há homônimos, timeouts, bloqueios e diferenças pequenas no HTML. Por isso a coleta foi mantida como uma feature isolada, com arquivos próprios em:

```txt
app/scrapers/
```

Hoje os scripts principais são:

```txt
app/scrapers/simple_scrape.py
app/scrapers/lattes_scrape.py
app/scrapers/scholar_scrape.py
```

Essa separação evita misturar regra HTTP da API com detalhes de navegador, HTML e parsing. Quando a API for expor isso, a rota deve chamar um serviço; ela não deve saber clicar em página, parsear HTML ou decidir match de Lattes.

O desenho desejado para API é:

```txt
router -> service -> scraper
```

O scraper sabe coletar. O service sabe coordenar regras de negócio. O router só expõe HTTP.

## Por que salvar cada execução em uma pasta com data

Cada scraping gera uma pasta nova em:

```txt
scrape_results/
```

ou, no caso do Lattes, separado por etapa:

```txt
scrape_results/lattes_preview/
scrape_results/lattes_full/
```

Exemplo:

```txt
scrape_results/lattes_preview/20260526_210838/
scrape_results/lattes_full/20260526_212601/
```

Isso é proposital. Scraping precisa ser reprodutível e auditável. Se uma execução deu resultado diferente da anterior, conseguimos comparar:

```txt
summary.json
lattes_profiles.csv
review_queue.csv
raw/
```

Também evitamos sobrescrever dados bons com uma execução ruim. Cada run vira um snapshot.

## Por que o Lattes tem etapas separadas

O Lattes não é uma tabela simples. Primeiro precisamos descobrir qual currículo pertence à pessoa. Só depois vale baixar o currículo completo.

Por isso o fluxo é dividido em:

```txt
1. preview
2. revisão automática por LLM, quando configurada
3. revisão manual/opcional
4. currículo completo
```

## Rodando o ambiente

Pré-requisitos:

```txt
uv
Python compatível com o pyproject.toml
Chromium instalado no sistema
```

No Arch/Manjaro, o Chromium normalmente vem de:

```bash
sudo pacman -S chromium
```

Instale/sincronize as dependências do projeto:

```bash
uv sync
```

O scraper carrega variáveis do arquivo `.env` automaticamente. Para a revisão por LLM, configure:

```txt
OPENAI_API_KEY=sua-chave
LATTES_LLM_MODEL=gpt-5.4-mini
```

Se quiser rodar sem LLM:

```txt
LATTES_DISABLE_LLM=1
```

Se o `uv` reclamar de permissão/cache, rode os comandos com:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run ...
```

Esse prefixo só muda onde o `uv` guarda cache; ele não muda a lógica do scraping.

## Rodando as duas etapas

## API de dashboard

A API expõe métricas agregadas da base ativa apontada por `scrape_results/current.json`.

Suba o servidor:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload
```

Rota:

```txt
GET /dashboard/metrics
```

Ela lê:

```txt
scrape_results/current.json
profiles_with_inferences_json
inference_summary_json
```

E retorna blocos prontos para dashboard:

```txt
dataset
quality
distributions
experience_flags
top_terms
```

Métricas incluídas:

```txt
total_profiles
needs_review
review_rate
llm_errors
bolsas por nível/categoria
instituições
UFs e regiões
sexo inferido
áreas principais
estágio de carreira
ano de doutorado
experiência internacional
indústria
gestão
editoria/eventos
patentes/software
tópicos, métodos, domínios e tags mais frequentes
```

Primeiro colete a tabela do CNPq:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/simple_scrape.py
```

Isso gera:

```txt
scrape_results/<run_cnpq>/scholarships.csv
```

### Etapa 1: preview Lattes

Use o `scholarships.csv` gerado na etapa anterior:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv
```

Essa etapa busca candidatos no Lattes, resolve matches seguros, tenta LLM nos ambíguos quando configurada, e gera:

```txt
scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
scrape_results/lattes_preview/<run_preview>/review_queue.csv
scrape_results/lattes_preview/<run_preview>/summary.json
```

Para testar pequeno:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv 10
```

### Etapa 2: currículo completo

Use o `lattes_profiles.csv` do preview. O comando só baixa currículos de linhas com `match_status=matched` e `lattes_code` preenchido:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
```

Essa etapa gera:

```txt
scrape_results/lattes_full/<run_full>/lattes_full_profiles.csv
scrape_results/lattes_full/<run_full>/lattes_full_profiles.json
scrape_results/lattes_full/<run_full>/review_queue_full.csv
scrape_results/lattes_full/<run_full>/summary.json
scrape_results/lattes_full/<run_full>/raw/<lattes_code_nome>/full_profile.json
scrape_results/lattes_full/<run_full>/raw/<lattes_code_nome>/full_cv.html
scrape_results/lattes_full/<run_full>/raw/<lattes_code_nome>/full_cv.txt
```

Para testar pequeno:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv 10
```

### Etapa 3: inferências

As inferências ficam separadas dos dados coletados. Elas criam um `semantic_profile` por pessoa para alimentar dashboard, filtros, relatórios e consultas em linguagem natural.

O modelo padrão da LLM é barato e configurável:

```txt
INFERENCES_LLM_MODEL=gpt-5-nano
```

Para desligar LLM nessa etapa:

```txt
INFERENCES_DISABLE_LLM=1
```

Para testar custo com poucas pessoas:

```txt
INFERENCES_LLM_MODE=split
INFERENCES_LLM_LIMIT=10
INFERENCES_OPENAI_TIMEOUT_SECONDS=45
INFERENCES_RULE_TEXT_MAX_CHARS=6000
INFERENCES_SEMANTIC_TEXT_MAX_CHARS=6000
INFERENCES_EVIDENCE_SNIPPETS_MAX=14
INFERENCES_EVIDENCE_SNIPPETS_PER_KIND=2
INFERENCES_EVIDENCE_SNIPPET_CHARS=650
```

Runs com `INFERENCES_LLM_LIMIT` são amostras de teste e não promovem `scrape_results/current.json`.

O limite padrão de `6000` caracteres cobre o resumo público inteiro dos 480 currículos da rodada atual. O currículo completo cru é muito maior, então a inferência não envia tudo para a LLM. Ela envia o resumo inteiro e, apenas na fase `semantic_generation:experience_outputs`, adiciona `evidence_snippets` extraídos do currículo completo para termos como `patente`, `software`, `coordenação`, `editor`, `revisor`, `pós-doutorado` e indústria.

A LLM roda em duas chamadas menores por pessoa:

```txt
rule_validation -> valida/corrige regras locais
semantic_generation:research -> áreas, tópicos, métodos e domínios
semantic_generation:career -> estágio, cargo e senioridade
semantic_generation:experience_outputs -> experiências, gestão, editoria e produção
semantic_generation:dashboard_qa -> resumo, palavras-chave, tags, gráficos e QA
```

Tambem existe o modo experimental:

```txt
INFERENCES_LLM_MODE=single
```

Nesse modo, a LLM tenta validar regras e gerar todos os campos em uma chamada por pessoa. E mais rapido, mas aumenta risco de JSON grande, campo esquecido ou erro concentrado.

Se uma chamada de inferência falhar, o script tenta reparar automaticamente só aquele caso com:

```txt
INFERENCES_REPAIR_LLM_MODEL=gpt-5.4-mini
```

Para reparar uma run existente sem reprocessar todo mundo:

```bash
INFERENCES_OPENAI_TIMEOUT_SECONDS=120 env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py repair-errors scrape_results/inferences/<run> --update-current
```

Se o reparo zerar `llm_errors`, o `current.json` é atualizado.

O sistema estima tokens como `caracteres_do_prompt / 4` e registra isso em `summary.json` e `inference_llm.json`.

Use o JSON do currículo completo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py full scrape_results/lattes_full/<run_full>/lattes_full_profiles.json
```

Ou use o run ativo em `scrape_results/current.json` e atualize o manifest ativo com os caminhos das inferências:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py current
```

Essa etapa gera:

```txt
scrape_results/inferences/<run_inference>/profiles_with_inferences.csv
scrape_results/inferences/<run_inference>/profiles_with_inferences.json
scrape_results/inferences/<run_inference>/inference_review_queue.csv
scrape_results/inferences/<run_inference>/inference_llm.json
scrape_results/inferences/<run_inference>/summary.json
```

O CSV traz cada inferência em colunas com:

```txt
<campo>_value
<campo>_confidence
<campo>_source
<campo>_needs_review
<campo>_reason
```

Exemplos de campos: `institution_state_uf`, `institution_region`, `doctorate_year`, `sex_inferred`, `main_research_area`, `research_topics`, `career_stage`, `has_international_experience`, `has_industry_experience`, `has_management_experience`, `profile_summary_short`, `search_keywords`, `dashboard_tags` e `qa_context`.

Quando a LLM confirma uma regra local, o campo fica com `source=rule+llm_validated`. Quando ela corrige uma regra local, fica com `source=llm_corrected_rule`.

Resumo das origens:

```txt
Regras locais validadas pela LLM:
institution_state_uf, institution_region, scholarship_category,
scholarship_level_rank, doctorate_year, years_since_doctorate,
profile_language, sex_inferred

Campos gerados pela LLM:
main_research_area, secondary_research_areas, research_topics,
methods_and_techniques, application_domains, career_stage,
academic_rank, seniority_level, has_international_experience,
international_countries, has_industry_experience, industry_organizations,
has_management_experience, management_roles,
has_editorial_or_event_experience, has_patents_or_software_outputs,
publication_or_output_focus, profile_summary_short,
profile_summary_bullets, search_keywords, dashboard_tags,
chart_suggestions, data_quality_notes, qa_context
```

O prompt completo da etapa está documentado em `docs/scraping.md`.

## Rodando tudo em um comando

Para uso no backend ou em um botão do frontend, existe um comando orquestrador que roda tudo em sequência:

```txt
CNPq -> preview Lattes -> currículo completo -> inferências
```

Comando completo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Teste pequeno:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

O número opcional limita a quantidade de pessoas processadas no Lattes. Sem número, roda a base inteira.

Esse comando gera um resumo do pipeline em:

```txt
scrape_results/pipeline/<run_pipeline>/pipeline_summary.json
```

E também grava um log da execução em:

```txt
logs/pipeline_<data_hora>.log
```

Esse arquivo aponta para:

```txt
scholarships.csv
lattes_profiles.csv
lattes_full_profiles.csv
lattes_full_profiles.json
profiles_with_inferences.csv
profiles_with_inferences.json
inference_review_queue_csv
review_queue_full.csv
summary.json
log_path
```

Quando o pipeline roda sem limite e termina sem `error`, sem `skipped` e sem `review_queue_full`, ele promove automaticamente o novo run para ativo em:

```txt
scrape_results/current.json
```

A UI deve ler esse arquivo para descobrir quais dados estão ativos. Se uma nova execução falhar, o `current.json` não é trocado, então os dados bons anteriores continuam valendo.

Runs com limite, como `pipeline_scrape.py 10`, são tratados como teste e não atualizam `current.json`.

Depois de rodar o pipeline completo, confira qual run está ativo:

```bash
cat scrape_results/current.json
```

Para abrir o `summary.json` do run ativo:

```bash
cat "$(python - <<'PY'
import json
from pathlib import Path

current = json.loads(Path("scrape_results/current.json").read_text())
print(current["summary_json"])
PY
)"
```

O esperado para um run completo saudável é:

```txt
matched: 480
skipped: 0
error: 0
```

Também é útil conferir os caminhos que a API/UI vai consumir:

```bash
python - <<'PY'
import json
from pathlib import Path

current = json.loads(Path("scrape_results/current.json").read_text())
print("Run ativo:", current["active_full_run"])
print("CSV:", current["lattes_full_profiles_csv"])
print("JSON:", current["lattes_full_profiles_json"])
print("Summary:", current["summary_json"])
print("Log:", current["log_path"])
PY
```

## Rodando a API

A aplicação FastAPI fica em:

```txt
app/main.py
```

Para subir localmente:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload
```

Rota básica para verificar se a API está viva e quais dados estão ativos:

```txt
GET /
```

Teste:

```bash
curl http://localhost:8000/
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "Agentic API",
  "current_data_available": true,
  "current_data_path": "scrape_results/current.json",
  "scraping_running": false,
  "active_data": {
    "updated_at": "2026-05-26T21:47:14",
    "active_full_run": "scrape_results/lattes_full/20260526_212601",
    "lattes_full_profiles_json": "scrape_results/lattes_full/20260526_212601/lattes_full_profiles.json",
    "summary_json": "scrape_results/lattes_full/20260526_212601/summary.json",
    "log_path": "logs/pipeline_20260526_210837.log"
  },
  "active_summary": {
    "total": 480,
    "matched": 480,
    "skipped": 0,
    "error": 0
  }
}
```

### 1. Preview

O comando de preview pesquisa o nome da pessoa no Lattes e tenta escolher o currículo certo.

Ele gera:

```txt
lattes_profiles.csv
review_queue.csv
summary.json
retry_log.json
llm_review.json
raw/
```

Quando o match é confiável, a linha fica com:

```txt
match_status=matched
```

Quando há dúvida, ela vai para:

```txt
review_queue.csv
```

### 2. Revisão automática por LLM

No final do preview, o script pode tentar resolver casos `ambiguous` usando uma LLM.

Essa etapa só roda se a variável de ambiente estiver configurada:

```bash
export OPENAI_API_KEY="sua-chave"
```

Opcionalmente, o modelo pode ser escolhido por:

```bash
export LATTES_LLM_MODEL="gpt-5.4-mini"
```

Para desligar explicitamente a etapa LLM:

```bash
export LATTES_DISABLE_LLM=1
```

A LLM recebe somente os dados do caso ambíguo e os candidatos encontrados no Lattes: nome, instituição esperada, nível da bolsa como contexto auxiliar, resumo, links externos e `lattes_code`. A bolsa não precisa estar comprovada no preview do Lattes; se nome, instituição e área acadêmica baterem com força, isso pode ser suficiente.

Ela só pode promover um caso para `matched` se:

```txt
1. responder JSON válido
2. escolher um lattes_code existente na lista de candidatos
3. declarar confiança >= 0.85
```

Se não houver chave, se a chamada falhar, ou se a confiança for baixa, o caso continua `ambiguous`. Isso não gera erro no run.

O log dessa etapa fica em:

```txt
llm_review.json
```

### 3. Revisão manual

Casos ambíguos não devem ser resolvidos no chute. O script marca esses casos para revisão manual ou por agente.

Exemplos:

```txt
ambiguous
not_found
error
```

A revisão gera um arquivo manual, normalmente chamado:

```txt
review_resolved.csv
```

Depois o comando de merge cria:

```txt
lattes_profiles_resolved.csv
review_queue_remaining.csv
resolved_applied.json
summary.json
```

### 4. Currículo completo

O currículo completo só roda para linhas com:

```txt
match_status=matched
lattes_code preenchido
```

Isso evita baixar currículo da pessoa errada. É melhor deixar um caso para revisão do que enriquecer a base com um falso positivo.

## Status do último preview completo

A última execução completa do preview foi:

```txt
scrape_results/lattes_preview/20260526_194859/
```

Resumo:

```json
{
  "total": 480,
  "matched": 479,
  "not_found": 0,
  "ambiguous": 1,
  "error": 0,
  "technical_error_retries": 5,
  "retry_attempts": 0,
  "llm_review_attempts": 4,
  "llm_review_matched": 3
}
```

Ou seja: 479 pessoas já podem ir para a etapa de currículo completo, e 1 precisa de revisão.

O run `20260526_191349` usou paginação e reduziu os ambíguos de 6 para 4. Depois, o run `20260526_194859` aplicou revisão por LLM nos 4 ambíguos e resolveu 3 deles.

## Comandos principais

Coletar a tabela CNPq:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/simple_scrape.py
```

Rodar preview Lattes:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv
```

Testar preview com poucas linhas:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv 10
```

Rodar só a revisão por LLM em um run existente:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py llm-review-profiles scrape_results/lattes_preview/<run_preview>/lattes_profiles.json
```

Merge da revisão:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py resolve-review scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv review_resolved.csv
```

Rodar currículo completo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
```

Testar currículo completo com poucas linhas:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv 10
```

Rodar pipeline completo em um comando:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Testar pipeline completo com poucas linhas:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

O currículo completo gera um CSV/JSON agregado leve e um JSON detalhado por pessoa:

```txt
lattes_full_profiles.csv
lattes_full_profiles.json
raw/<lattes_code_nome>/full_profile.json
raw/<lattes_code_nome>/full_cv.html
raw/<lattes_code_nome>/full_cv.txt
```

O `full_profile.json` é o arquivo certo para acesso profundo ao currículo, com identidade, `photo_url` quando disponível, status, resumo, seções extraídas e caminhos para HTML/TXT bruto. O `photo_url` também fica no CSV/JSON agregado do currículo completo para facilitar uso posterior em interface ou revisão.

## Como revisar casos ambíguos

Abra:

```txt
scrape_results/lattes_preview/<run_preview>/review_queue.csv
```

Crie um CSV de resolução:

```csv
name,institution,resolved_status,lattes_code,lattes_name,notes
Nome da Pessoa,INSTITUICAO,matched,K0000000X0,Nome no Lattes,Escolhido por evidência de instituição e área
```

Campos importantes:

```txt
name
institution
resolved_status
lattes_code
lattes_name
notes
```

Use `resolved_status=matched` quando tiver certeza do currículo correto.

Use `resolved_status=ambiguous` ou `resolved_status=not_found` quando quiser manter o caso fora da etapa de currículo completo.

## Documentação detalhada

O passo a passo operacional fica em:

```txt
docs/scraping.md
```

As decisões e justificativas, em formato próximo de ADR, ficam em:

```txt
docs/scraping-decisions.md
```

## Dependências principais

O projeto usa:

```txt
uv
Python
Playwright
BeautifulSoup
FastAPI
```

Playwright é usado porque algumas páginas precisam de navegador real. BeautifulSoup é usado para parsing do HTML depois que a página foi carregada.

## Chaves e segredos

Nunca coloque chave de API no código, no README ou em arquivos de resultado.

Use variável de ambiente:

```bash
export OPENAI_API_KEY="sua-chave"
```

Se quiser impedir chamadas à LLM em uma execução:

```bash
export LATTES_DISABLE_LLM=1
```

Se uma chave for colada por engano em chat, commit ou arquivo local versionado, revogue a chave e gere outra.

## Cuidados

Este projeto trabalha com páginas públicas, mas ainda assim o scraping deve ser feito com cuidado:

- manter runs salvos para auditoria;
- revisar homônimos antes de enriquecer;
- não transformar erro técnico em dado válido;
- preferir falso negativo revisável a falso positivo silencioso;
- preservar HTML bruto em `raw/` quando possível;
- registrar contagens em `summary.json`.
