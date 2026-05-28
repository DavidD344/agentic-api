# Scraping Workflow

Este projeto usa um fluxo em duas grandes fases para o Lattes:

1. Gerar o preview e descobrir o `lattes_code`.
2. Revisar casos problemáticos e baixar o currículo completo usando `lattes_code`.

O princípio do fluxo é simples: primeiro coletamos uma base confiável e pequena, depois enriquecemos por etapas. Cada etapa produz arquivos próprios e pode ser reexecutada sem destruir as anteriores.

## Ambiente

Pré-requisitos:

```txt
uv
Python compatível com o pyproject.toml
Chromium instalado no sistema
```

Instale as dependências do projeto:

```bash
uv sync
```

O projeto usa `python-dotenv`, então variáveis em `.env` são carregadas pelo scraper. Para habilitar a revisão por LLM:

```txt
OPENAI_API_KEY=sua-chave
LATTES_LLM_MODEL=gpt-5.4-mini
```

Para garantir que a LLM não seja chamada:

```txt
LATTES_DISABLE_LLM=1
```

Se o cache padrão do `uv` der problema de permissão, use o prefixo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run ...
```

Nos exemplos abaixo usamos esse prefixo para deixar o comando mais robusto.

## Execução em duas etapas

Antes do Lattes, gere a base CNPq:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/simple_scrape.py
```

Saída:

```txt
scrape_results/<run_cnpq>/scholarships.csv
```

### Etapa 1: preview/match Lattes

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv
```

Essa etapa:

```txt
1. pesquisa cada nome no Lattes
2. percorre paginação de resultados
3. baixa previews dos candidatos
4. decide matched, ambiguous, not_found ou error
5. faz retries técnicos
6. tenta LLM nos ambiguous, se OPENAI_API_KEY existir
7. salva arquivos auditáveis do run
```

Saídas principais:

```txt
scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
scrape_results/lattes_preview/<run_preview>/review_queue.csv
scrape_results/lattes_preview/<run_preview>/llm_review.json
scrape_results/lattes_preview/<run_preview>/summary.json
```

Teste pequeno:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv 10
```

### Etapa 2: currículo completo

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
```

Essa etapa:

```txt
1. lê lattes_profiles.csv
2. baixa currículo completo só de match_status=matched com lattes_code
3. extrai identidade, foto, resumo, seções e metadados
4. salva CSV/JSON agregado leve
5. salva HTML, TXT e JSON detalhado por pessoa
6. manda casos não processados para review_queue_full
```

Saídas principais:

```txt
scrape_results/lattes_full/<run_full>/lattes_full_profiles.csv
scrape_results/lattes_full/<run_full>/lattes_full_profiles.json
scrape_results/lattes_full/<run_full>/review_queue_full.csv
scrape_results/lattes_full/<run_full>/summary.json
scrape_results/lattes_full/<run_full>/raw/<lattes_code_nome>/full_profile.json
scrape_results/lattes_full/<run_full>/raw/<lattes_code_nome>/full_cv.html
scrape_results/lattes_full/<run_full>/raw/<lattes_code_nome>/full_cv.txt
```

Teste pequeno:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv 10
```

### Etapa 3: inferências

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py full scrape_results/lattes_full/<run_full>/lattes_full_profiles.json
```

Ou, para usar o run ativo em `scrape_results/current.json` e registrar as saídas no próprio manifest:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py current
```

Essa etapa:

```txt
1. lê lattes_full_profiles.json
2. infere campos derivados por regras locais
3. usa LLM barata/configurável para validar campos de regra e gerar campos semânticos, se OPENAI_API_KEY existir
4. salva uma fila de revisão para inferências de baixa confiança
5. salva CSV/JSON enriquecido com rastreabilidade
```

Saídas principais:

```txt
scrape_results/inferences/<run_inference>/profiles_with_inferences.csv
scrape_results/inferences/<run_inference>/profiles_with_inferences.json
scrape_results/inferences/<run_inference>/inference_review_queue.csv
scrape_results/inferences/<run_inference>/inference_llm.json
scrape_results/inferences/<run_inference>/summary.json
```

Configuração da LLM:

```txt
INFERENCES_LLM_MODEL=gpt-5-nano
INFERENCES_LLM_MODE=split
INFERENCES_DISABLE_LLM=1
INFERENCES_LLM_LIMIT=10
INFERENCES_OPENAI_TIMEOUT_SECONDS=45
INFERENCES_RULE_TEXT_MAX_CHARS=6000
INFERENCES_SEMANTIC_TEXT_MAX_CHARS=6000
INFERENCES_EVIDENCE_SNIPPETS_MAX=14
INFERENCES_EVIDENCE_SNIPPETS_PER_KIND=2
INFERENCES_EVIDENCE_SNIPPET_CHARS=650
```

Runs com `INFERENCES_LLM_LIMIT` são amostras de teste e não promovem `scrape_results/current.json`.

Na rodada atual, o maior resumo público estruturado tem menos de `6000` caracteres, então esse padrão envia o resumo inteiro para a LLM. O currículo completo cru pode passar de centenas de milhares de caracteres; por isso ele não é enviado inteiro. Na fase `semantic_generation:experience_outputs`, o código também lê o `raw_text_path` e adiciona `evidence_snippets` com trechos relevantes sobre experiência internacional, patente/software, gestão, editoria/eventos e indústria.

A LLM roda em duas chamadas menores por pessoa:
Na prática, a segunda parte é dividida em grupos menores para reduzir saída e timeout:

```txt
1. rule_validation
   valida/corrige apenas campos calculados por regra local
   usa INFERENCES_RULE_TEXT_MAX_CHARS
   usa evidence_snippets como evidência prioritária

2. semantic_generation:research
   gera área, tópicos, métodos e domínios

3. semantic_generation:career
   gera estágio, cargo e senioridade

4. semantic_generation:experience_outputs
   gera experiências, gestão, editoria, patentes e foco de produção
   usa evidence_snippets extraídos do currículo completo cru

5. semantic_generation:dashboard_qa
   gera resumo curto, bullets, palavras-chave, tags, sugestões e contexto de QA

As fases semantic_generation usam:
   usa INFERENCES_SEMANTIC_TEXT_MAX_CHARS
```

Modo alternativo:

```txt
INFERENCES_LLM_MODE=single
```

Nesse modo, a LLM valida regras e gera todos os campos em uma chamada por pessoa. E mais rapido, mas concentra o risco de JSON malformado, timeout ou campo esquecido.

Reparo automático:

```txt
INFERENCES_REPAIR_LLM_MODEL=gpt-5.4-mini
```

Depois das inferências, chamadas com erro são tentadas novamente com o modelo de reparo. Para consertar uma run existente sem rodar tudo de novo:

```bash
INFERENCES_OPENAI_TIMEOUT_SECONDS=120 env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py repair-errors scrape_results/inferences/<run> --update-current
```

Se o reparo zerar `llm_errors`, o `current.json` é atualizado.

Estimativa simples de tokens:

```txt
tokens_estimados ~= caracteres_do_prompt / 4
```

O `summary.json` e o `inference_llm.json` registram `prompt_chars` e `prompt_tokens_estimate` por chamada para acompanhar custo.

Cada inferência é salva com:

```txt
value
confidence
source
reason
needs_review
```

Quando a LLM confirma uma regra local, o campo fica com `source=rule+llm_validated`. Quando ela corrige uma regra local, fica com `source=llm_corrected_rule`.

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

Detalhe das regras locais:

```txt
institution_state_uf
  origem: institution do CNPq/Lattes full
  regra: tabela local INSTITUTION_UF
  validação LLM: sim

institution_region
  origem: institution_state_uf
  regra: tabela local REGION_BY_UF
  validação LLM: sim

scholarship_category
  origem: scholarship_level do CNPq
  regra: prefixo do nível, como PQ-1, PQ-2, PQ-C
  validação LLM: sim

scholarship_level_rank
  origem: scholarship_category
  regra: PQ-1=1, PQ-2=2, PQ-C=3
  validação LLM: sim

doctorate_year
  origem: summary do Lattes
  regra: regex procura ano em trecho de doutorado/PhD
  validação LLM: sim

years_since_doctorate
  origem: doctorate_year
  regra: ano atual - doctorate_year
  validação LLM: sim

profile_language
  origem: summary do Lattes
  regra: marcadores simples de português/inglês
  validação LLM: sim

sex_inferred
  origem: summary/name/lattes_name
  regra: evidência textual como professor/professora, pesquisador/pesquisadora, doutor/doutora
  validação LLM: sim
  observação: campo sensível, sempre tratado como inferência e revisável
```

Campos semânticos por LLM:

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

Detalhe dos campos só por LLM:

```txt
main_research_area
  principal área de pesquisa em taxonomia curta

secondary_research_areas
  áreas secundárias

research_topics
  tópicos perguntáveis para filtros e consulta natural

methods_and_techniques
  métodos, técnicas, tecnologias e abordagens

application_domains
  domínios de aplicação, como saúde, educação, energia ou indústria

career_stage
  estágio de carreira: early, mid, senior, very_senior, emeritus_or_retired, unknown

academic_rank
  cargo acadêmico inferido, como professor_titular, associado ou adjunto

seniority_level
  senioridade resumida: junior, mid, senior, very_senior, unknown

has_international_experience
  booleano para experiência internacional

international_countries
  países estrangeiros citados

has_industry_experience
  booleano para experiência em empresa, P&D privado ou consultoria

industry_organizations
  organizações privadas ou industriais citadas

has_management_experience
  booleano para coordenação, direção, chefia, pró-reitoria, presidência ou gestão

management_roles
  papéis de gestão citados

has_editorial_or_event_experience
  booleano para editoria, comitês, eventos ou sociedades científicas

has_patents_or_software_outputs
  booleano para patente, software, produto tecnológico ou registro similar

publication_or_output_focus
  foco de produção citado, como periódicos, conferências, livros, patentes ou software

profile_summary_short
  resumo curto em uma frase para cards e relatórios

profile_summary_bullets
  até 4 bullets para cards, relatórios e revisão

search_keywords
  palavras-chave normalizadas para busca

dashboard_tags
  tags para filtros e agrupamentos

chart_suggestions
  sugestões de agrupamentos/gráficos

data_quality_notes
  alertas de dados incompletos, ambíguos ou pobres

qa_context
  texto compacto para responder perguntas sobre a pessoa
```

Prompt usado na etapa de inferências:

Validação das regras locais:

```txt
Você valida inferências feitas por regras locais para um dataset acadêmico.
Use somente os dados fornecidos. Não invente fatos.
Para cada campo permitido, repita o value se a regra estiver correta ou corrija se houver evidência forte.
Se houver dúvida, use unknown/null e needs_review=true.
Cada campo deve ter value, confidence, reason e needs_review.
Mantenha cada reason curta, com no máximo 14 palavras.

Responda apenas JSON válido neste formato:
{"fields":{"field_id":{"value":...,"confidence":0.0,"reason":"...","needs_review":false}}}

Campos permitidos:
<schema gerado por RULE_FIELD_DEFINITIONS>

Inferências por regra:
<semantic_profile calculado por regras locais>

Dados do perfil:
<name, lattes_name, institution, scholarship_level, summary_excerpt>
```

Geração semântica:

```txt
Você gera inferências semânticas estruturadas para um sistema multiagente de consulta, dashboard e relatórios sobre bolsistas CNPq de Computação.
Use somente os dados fornecidos. Não invente fatos.
Use principalmente summary_excerpt para inferir área, tópicos, métodos, experiência, resumos, palavras-chave e contexto de QA.
Quando não houver evidência suficiente, use null, lista vazia ou unknown com baixa confiança.
Você deve retornar TODOS os campos permitidos. Não retorne apenas campos preenchidos.
Cada campo deve ter value, confidence, reason e needs_review.
Mantenha cada reason curta, com no máximo 14 palavras.

Responda apenas JSON válido neste formato:
{"fields":{"field_id":{"value":...,"confidence":0.0,"reason":"...","needs_review":false}}}

Campos permitidos:
<schema gerado por LLM_FIELD_DEFINITIONS>

Inferências já validadas:
<semantic_profile após validação de regras>

Dados do perfil:
<name, lattes_name, institution, scholarship_level, lattes_url, orcid, summary, sections_available>
```

`sex_inferred` não é dado oficial do Lattes. Ele é um campo derivado para análise estatística e deve sempre ser exibido/consumido como inferência.

## Execução em comando único

Para uso futuro no backend, quando um botão do frontend precisar iniciar a coleta inteira, use:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Esse comando roda:

```txt
1. app/scrapers/simple_scrape.py
2. enrich-scholarships com o scholarships.csv gerado
3. enrich-full com o lattes_profiles.csv gerado
```

Para testar pequeno:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

O argumento numérico é opcional. Quando informado, limita quantas pessoas entram nas etapas Lattes. Sem argumento, roda a base completa.

Saída de controle:

```txt
scrape_results/pipeline/<run_pipeline>/pipeline_summary.json
```

Log da execução:

```txt
logs/pipeline_<data_hora>.log
```

O resumo aponta para o run CNPq, o run de preview, o run final com currículo completo e o log. É o arquivo mais simples para um backend ler depois que o processo terminar.

Quando a execução é completa, ou seja, sem argumento de limite, e o run final não tem `error`, `skipped` nem `review_queue_full`, o pipeline promove o resultado para ativo:

```txt
scrape_results/current.json
```

Esse arquivo é o contrato mais simples para a UI/API consumir. Ele aponta para:

```txt
active_full_run
scholarships_csv
lattes_profiles_csv
lattes_full_profiles_csv
lattes_full_profiles_json
summary_json
log_path
```

Se a execução falhar ou deixar casos para revisão, o `current.json` não é trocado. Assim um botão de "regenerar dados" não quebra a visualização atual.

Runs com limite, como `pipeline_scrape.py 10`, são apenas testes e também não atualizam `current.json`.

### Conferindo o run ativo

Depois de rodar o pipeline completo, veja o ponteiro ativo:

```bash
cat scrape_results/current.json
```

Para abrir diretamente o `summary.json` do run ativo:

```bash
cat "$(python - <<'PY'
import json
from pathlib import Path

current = json.loads(Path("scrape_results/current.json").read_text())
print(current["summary_json"])
PY
)"
```

O esperado para uma execução completa saudável:

```txt
matched: 480
skipped: 0
error: 0
```

Para conferir os arquivos que a API/UI deve consumir:

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

## Visão do pipeline

```txt
CNPq scholarships
    -> scholarships.csv
    -> Lattes preview
    -> lattes_profiles.csv
    -> LLM review dos ambiguous, se OPENAI_API_KEY existir
    -> review_queue.csv
    -> review_resolved.csv
    -> resolve-review
    -> lattes_profiles_resolved.csv
    -> Lattes full CV
    -> lattes_full_profiles.csv
    -> Inferências
    -> profiles_with_inferences.csv
```

Por que não fazer tudo em um comando só?

Porque existem casos que exigem julgamento. Homônimos são comuns no Lattes. Se o script escolhe a pessoa errada, a base fica contaminada. Então o processo para a decisão incerta em `review_queue.csv` e deixa a correção explícita em `review_resolved.csv`.

## Tipos de arquivo

### `summary.json`

Resumo da execução. Serve para saber rapidamente se o run foi bom.

Exemplo:

```json
{
  "total": 480,
  "matched": 479,
  "not_found": 0,
  "ambiguous": 1,
  "error": 0,
  "llm_review_attempts": 4,
  "llm_review_matched": 3
}
```

### `raw/`

Guarda HTML e texto bruto. É útil para depuração, auditoria e criação de novos parsers.

### `review_queue.csv`

Fila de casos que precisam de revisão. Não é erro do pipeline; é o mecanismo de segurança contra match errado.

### `llm_review.json`

Log da revisão automática por LLM. Se `OPENAI_API_KEY` não estiver configurada, o arquivo registra que a etapa foi pulada. Se a LLM tentar resolver casos, o arquivo registra decisões, confiança, motivo e status final.

### `review_resolved.csv`

Arquivo criado depois da revisão manual ou por agente. Ele informa ao pipeline qual candidato foi escolhido.

### `lattes_profiles_resolved.csv`

Base final do preview após aplicar as correções. É esse arquivo que deve ir para o currículo completo.

## 1. Scraping da tabela CNPq

Roda a coleta da tabela de bolsistas:

```bash
uv run python app/scrapers/simple_scrape.py
```

Saída esperada:

```txt
scrape_results/<data_hora>/scholarships.csv
```

Esse CSV é a base principal, com:

```txt
name
scholarship_level
scholarship_start
scholarship_end
institution
situation
```

## 2. Lattes preview

Roda a busca no Lattes para cada pessoa do `scholarships.csv`:

```bash
uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv
```

Para testar poucas linhas:

```bash
uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv 10
```

Saídas:

```txt
scrape_results/lattes_preview/<data_hora>/lattes_profiles.csv
scrape_results/lattes_preview/<data_hora>/review_queue.csv
scrape_results/lattes_preview/<data_hora>/retry_log.json
scrape_results/lattes_preview/<data_hora>/llm_review.json
scrape_results/lattes_preview/<data_hora>/summary.json
scrape_results/lattes_preview/<data_hora>/raw/
```

Status possíveis:

```txt
matched    pronto para o currículo completo
ambiguous  mais de um candidato possível
not_found  nenhum candidato encontrado
error      erro técnico, mesmo após retry
```

Como o match é decidido:

```txt
1. busca o nome no Lattes
2. se há paginação no resultado, coleta as páginas antes de decidir
3. junta os candidatos e remove duplicatas
4. baixa o preview dos candidatos encontrados
5. decide matched, ambiguous, not_found ou error
```

O scraper não assume que a primeira página contém todos os candidatos. Quando o Lattes informa paginação, ele navega pelas páginas de resultado, junta os candidatos e remove duplicatas antes de buscar os previews.

Para auditoria, quando há paginação ele salva:

```txt
raw/<nome>/search_pages.json
raw/<nome>/search_result.html
raw/<nome>/search_result_page_2.html
raw/<nome>/search_result_page_3.html
...
raw/<nome>/candidates.json
```

Isso importa principalmente nos casos `ambiguous`, porque a pessoa correta pode aparecer em uma página posterior.

Em runs anteriores, essa mudança reduziu casos ambíguos porque alguns nomes só ficaram resolvíveis depois que o scraper passou a olhar páginas posteriores e comparar instituição/área antes de decidir.

Depois dessa coleta paginada, a decisão continua conservadora:

```txt
1. se existe um único candidato com nome igual, marca matched
2. se há mais de um candidato, tenta usar instituição como evidência
3. se ainda houver dúvida, marca ambiguous
4. se não achar ninguém, marca not_found
5. se a página/navegador falhar, marca error e tenta retry técnico
```

## 3. Revisão automática por LLM

Depois do scraping e dos retries técnicos, o script tenta revisar os casos `ambiguous` com uma LLM, mas somente se existir:

```bash
OPENAI_API_KEY
```

O modelo padrão pode ser configurado por:

```bash
LATTES_LLM_MODEL=gpt-5.4-mini
```

Para desligar a etapa mesmo com chave configurada:

```bash
LATTES_DISABLE_LLM=1
```

A LLM recebe um payload com:

```txt
nome esperado
instituição esperada
nível da bolsa, apenas como contexto auxiliar
candidatos encontrados
summary de cada candidato
links externos de cada candidato
lattes_code de cada candidato
```

O nível da bolsa não precisa aparecer no preview do Lattes para a LLM aceitar um candidato. Se nome, instituição e área acadêmica forem fortemente compatíveis, isso pode ser evidência suficiente. Essa regra evita rejeitar perfis corretos só porque o resumo público não menciona a bolsa CNPq.

Ela deve responder JSON com:

```json
{
  "status": "matched",
  "lattes_code": "K0000000X0",
  "confidence": 0.92,
  "reason": "Resumo e vínculo institucional batem com a instituição esperada."
}
```

O script só aceita a decisão se:

```txt
status=matched
lattes_code existe nos candidatos
confidence >= 0.85
```

Se qualquer uma dessas condições falhar, o registro continua `ambiguous`. Isso é intencional: a LLM ajuda, mas não pode forçar um match fraco.

Se a chave não existir, se a chamada falhar, ou se o modelo responder malformado, o run continua normalmente e os casos seguem para `review_queue.csv`.

Para rodar apenas a revisão por LLM em um run já existente, sem refazer scraping:

```bash
uv run python app/scrapers/lattes_scrape.py llm-review-profiles scrape_results/lattes_preview/<run_preview>/lattes_profiles.json
```

Isso cria um novo run com `lattes_profiles.csv`, `review_queue.csv`, `summary.json` e `llm_review.json`.

## 4. Revisão manual ou por agente

Abra:

```txt
review_queue.csv
```

Crie um arquivo chamado, por exemplo:

```txt
review_resolved.csv
```

Formato recomendado:

```csv
name,institution,resolved_status,lattes_code,lattes_name,notes
Nome da Pessoa,INSTITUICAO,matched,K0000000X0,Nome no Lattes,Escolhido por evidência de instituição e área
```

Campos mínimos:

```txt
name
institution
resolved_status
lattes_code
```

Use:

```txt
resolved_status=matched
```

quando encontrou o currículo certo.

Para manter alguém fora do enriquecimento completo:

```txt
resolved_status=ambiguous
resolved_status=not_found
```

## 5. Merge da revisão

Depois de criar `review_resolved.csv`, rode:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py resolve-review scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv review_resolved.csv
```

Saídas:

```txt
scrape_results/lattes_preview/<data_hora>/lattes_profiles_resolved.csv
scrape_results/lattes_preview/<data_hora>/review_queue_remaining.csv
scrape_results/lattes_preview/<data_hora>/resolved_applied.json
scrape_results/lattes_preview/<data_hora>/summary.json
```

Use `lattes_profiles_resolved.csv` na próxima etapa se você fez revisão manual. Se não fez revisão manual, pode usar diretamente o `lattes_profiles.csv` do preview.

Esse comando não pesquisa no Lattes. Ele só combina:

```txt
lattes_profiles.csv + review_resolved.csv
```

e gera uma versão nova com as correções aplicadas.

## 6. Lattes completo

Roda o currículo completo apenas para linhas com:

```txt
match_status=matched
lattes_code preenchido
```

Comando:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
```

Para testar poucas linhas:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv 10
```

Saídas:

```txt
scrape_results/lattes_full/<data_hora>/lattes_full_profiles.csv
scrape_results/lattes_full/<data_hora>/lattes_full_profiles.json
scrape_results/lattes_full/<data_hora>/review_queue_full.csv
scrape_results/lattes_full/<data_hora>/summary.json
scrape_results/lattes_full/<data_hora>/raw/<lattes_code_nome>/full_cv.html
scrape_results/lattes_full/<data_hora>/raw/<lattes_code_nome>/full_cv.txt
scrape_results/lattes_full/<data_hora>/raw/<lattes_code_nome>/full_profile.json
```

Por que usar o `lattes_code`?

Porque o `lattes_code` é o identificador técnico que o site usa para abrir o perfil. Nome pode ter homônimo; código não.

Por que salvar HTML e TXT do currículo completo?

O HTML preserva estrutura para parser futuro. O TXT facilita inspeção rápida e busca textual.

Como fica a estrutura do enriquecimento completo:

```txt
lattes_full_profiles.csv
```

Arquivo leve para abrir em planilha e filtrar. Ele guarda identidade, status, resumo, contagem de seções e caminhos para os arquivos detalhados.

```txt
lattes_full_profiles.json
```

JSON agregado leve. Ele repete os principais campos do CSV e adiciona `sections_available`, mas não carrega o texto completo das seções.

```txt
raw/<lattes_code_nome>/full_profile.json
```

JSON detalhado por pessoa. Esse é o arquivo para acesso profundo quando precisar inspecionar um currículo. Estrutura:

```json
{
  "identity": {
    "name": "...",
    "institution": "...",
    "lattes_code": "...",
    "public_lattes_id": "...",
    "lattes_url": "...",
    "photo_url": "...",
    "orcid": "...",
    "last_updated": "..."
  },
  "status": {
    "match_status": "matched",
    "looks_like_full_cv": true,
    "blocked_or_invalid": false,
    "error": null
  },
  "summary": "...",
  "sections_text": {
    "Identificacao": "...",
    "FormacaoAcademicaTitulacao": "...",
    "AtuacaoProfissional": "...",
    "ProducaoBibliografica": "..."
  },
  "artifacts": {
    "raw_html_path": "...",
    "raw_text_path": "..."
  }
}
```

O campo `photo_url` vem da imagem pública do currículo completo, quando o Lattes fornece uma tag de foto no HTML. Ele também aparece no CSV/JSON agregado para facilitar uso em interface ou revisão.

O script não salva a URL temporária com token do currículo completo nas saídas curadas. Para acesso futuro, use `lattes_url`, `photo_url`, `full_cv.html`, `full_cv.txt` e `full_profile.json`.

## Corrigindo erros

### `error` no preview

Normalmente é instabilidade do Lattes, como:

```txt
Stale file handle
```

O script já tenta retry automático. Se continuar em `error`, você pode:

1. Pesquisar manualmente no Lattes.
2. Preencher `review_resolved.csv` com o `lattes_code`.
3. Rodar `resolve-review`.

### `ambiguous`

Compare:

```txt
name
institution
candidate_names
candidate_codes
```

Escolha o candidato com evidência mais forte: instituição, resumo, área ou página pública.

### `not_found`

Pode ser nome diferente no Lattes. Tente buscar manualmente sem acentos, abreviações ou nomes intermediários.

Se encontrar, coloque o `lattes_code` em `review_resolved.csv`.

## Fluxo recomendado na prática

1. Rode o scraping CNPq.
2. Rode o preview Lattes completo.
3. Abra o `summary.json`.
4. Se `error > 0`, veja `retry_log.json`.
5. Abra `llm_review.json` para ver se a LLM resolveu algum ambíguo.
6. Abra `review_queue.csv`.
7. Crie `review_resolved.csv` se quiser resolver algo manualmente.
8. Rode `resolve-review` se criou `review_resolved.csv`.
9. Use `lattes_profiles.csv` ou `lattes_profiles_resolved.csv` no `enrich-full`.
10. Abra `review_queue_full.csv`.
11. Só depois pense em persistir em banco.

## Comandos rápidos

Preview:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scrape_results/<run_cnpq>/scholarships.csv
```

Merge da revisão:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py resolve-review scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv review_resolved.csv
```

Currículo completo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-full scrape_results/lattes_preview/<run_preview>/lattes_profiles.csv
```

Teste de currículo completo por código:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py full-cv-code K0000000X0
```

Revisar ambíguos de um run existente com LLM:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py llm-review-profiles scrape_results/lattes_preview/<run_preview>/lattes_profiles.json
```

Pipeline completo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```
