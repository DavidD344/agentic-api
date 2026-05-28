# Rotas da API para o frontend

Este documento descreve as rotas HTTP existentes hoje na API, o formato das respostas e a ideia de uso de cada campo no frontend.

Base local comum:

```txt
http://localhost:8000
```

Se a porta `8000` estiver ocupada, a API pode ser rodada em outra porta, por exemplo:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload --port 8001
```

Nesse caso, a base vira:

```txt
http://localhost:8001
```

## GET /

Rota de saúde da API e estado geral dos dados ativos.

### Ideia

Essa rota serve para o frontend verificar se a API está viva, se existe dataset ativo e se algum scraping parece estar rodando no momento.

Ela é boa para:

```txt
tela inicial
status do sistema
botao "recarregar dados" habilitado/desabilitado
aviso de scraping em andamento
debug rapido no navegador
```

### Request

```http
GET /
```

Não recebe body.

### Response

```json
{
  "status": "ok",
  "service": "Agentic API",
  "current_data_available": true,
  "current_data_path": "scrape_results/current.json",
  "scraping_running": false,
  "active_data": {},
  "active_summary": {}
}
```

### Campos

| Campo | Tipo | Descrição | Uso no front |
|---|---:|---|---|
| `status` | string | Estado básico da API. Hoje retorna `ok` quando a rota respondeu. | Mostrar badge de API online. |
| `service` | string | Nome do serviço. | Identificação em tela técnica ou debug. |
| `current_data_available` | boolean | Indica se `scrape_results/current.json` existe. | Se `false`, mostrar que ainda não há dataset pronto. |
| `current_data_path` | string | Caminho local do arquivo que aponta para os dados ativos. | Debug/admin. |
| `scraping_running` | boolean | Tenta detectar se algum script de scraping está rodando no sistema. | Mostrar status "coletando dados". |
| `active_data` | object/null | Conteúdo de `scrape_results/current.json`. Aponta para os arquivos ativos da última run válida. | Mostrar data da run ativa e caminhos usados. |
| `active_summary` | object/null | Summary da run ativa, quando disponível. | Mostrar resumo técnico da coleta/inferência. |

### Campos comuns dentro de `active_data`

`active_data` depende da última pipeline finalizada, mas normalmente inclui caminhos como:

| Campo | Tipo | Descrição |
|---|---:|---|
| `scholarships_run_dir` | string | Pasta da coleta da tabela CNPq. |
| `scholarships_csv` | string | CSV com dados originais da bolsa. |
| `lattes_preview_run_dir` | string | Pasta da etapa de busca/preview Lattes. |
| `lattes_profiles_csv` | string | CSV com perfis Lattes encontrados na etapa preview. |
| `lattes_profiles_json` | string | JSON com perfis Lattes encontrados na etapa preview. |
| `lattes_full_run_dir` | string | Pasta da etapa de currículo Lattes completo. |
| `lattes_full_profiles_csv` | string | CSV com currículos completos processados. |
| `lattes_full_profiles_json` | string | JSON com currículos completos processados. |
| `inference_run_dir` | string | Pasta da etapa de inferências semânticas. |
| `profiles_with_inferences_csv` | string | CSV final com dados enriquecidos e inferências. |
| `profiles_with_inferences_json` | string | JSON final com dados enriquecidos e inferências. É a fonte principal para dashboard/chat. |
| `inference_review_queue_csv` | string | CSV com campos que precisam revisão. |
| `inference_summary_json` | string | Resumo técnico da etapa de inferências. |

## GET /dashboard/metrics

Rota principal para alimentar o dashboard.

### Ideia

Essa rota lê o dataset ativo em `scrape_results/current.json`, carrega `profiles_with_inferences_json` e devolve métricas já agregadas para o front montar gráficos sem precisar recalcular tudo no navegador.

Ela foi feita para:

```txt
cards gerais
graficos de distribuição
graficos de qualidade do dataset
graficos para análise de bolsas
graficos de área, instituição, UF, região e perfil acadêmico
graficos cruzados para avaliação de concentração e diversidade
```

### Request

```http
GET /dashboard/metrics
```

Não recebe body.

### Possíveis erros

| Status | Quando acontece |
|---:|---|
| `404` | Quando `scrape_results/current.json` não existe ou não aponta para o JSON final de inferências. |

### Response geral

```json
{
  "dataset": {},
  "quality": {},
  "distributions": {},
  "experience_flags": {},
  "top_terms": {},
  "analysis": {}
}
```

## Bloco `dataset`

Resumo geral do dataset ativo.

```json
{
  "total_profiles": 480,
  "needs_review": 401,
  "profiles_with_review_flags": 401,
  "review_rate": 0.8354,
  "current": {}
}
```

| Campo | Tipo | Descrição | Uso no front |
|---|---:|---|---|
| `total_profiles` | number | Total de pessoas no dataset ativo. | Card "Total de bolsistas". |
| `needs_review` | number | Quantidade de pessoas com pelo menos um campo marcado como revisão. | Card/alerta de qualidade. |
| `profiles_with_review_flags` | number | Mesmo valor de `needs_review`, mantido com nome mais explícito. | Card/alerta de qualidade. |
| `review_rate` | number | Fração do dataset com alguma revisão pendente. | Indicador percentual de qualidade. |
| `current` | object | Conteúdo de `scrape_results/current.json`. | Mostrar run ativa/data/caminhos em área admin. |

Observação importante: `needs_review` alto não significa que os dados estão inutilizáveis. Significa que a LLM marcou algum campo como incerto, sensível ou pouco comprovado. O front pode mostrar isso como "campos a revisar", não como "erro".

## Bloco `quality`

Métricas técnicas da etapa de inferência.

```json
{
  "llm_errors": 0,
  "llm_repair_attempts": 8,
  "llm_repair_successes": 8,
  "token_estimates": {}
}
```

| Campo | Tipo | Descrição | Uso no front |
|---|---:|---|---|
| `llm_errors` | number/null | Quantidade final de erros de LLM não resolvidos. | Card "Erros pendentes". |
| `llm_repair_attempts` | number/null | Quantas correções automáticas foram tentadas com modelo melhor. | Área admin/log. |
| `llm_repair_successes` | number/null | Quantas correções automáticas deram certo. | Área admin/log. |
| `token_estimates` | object/null | Estimativas/contagens de tokens da etapa de inferência. | Debug de custo. |

## Bloco `distributions`

Distribuições simples para gráficos diretos.

Cada lista de distribuição segue o formato:

```json
[
  {
    "label": "USP",
    "count": 52
  }
]
```

### Campos disponíveis

| Campo | Tipo | Gráfico recomendado | Ideia |
|---|---:|---|---|
| `scholarship_levels` | array | Barras | Distribuição por nível bruto da bolsa, ex: `PQ-1A`, `PQ-2`, `PQ-C`. |
| `scholarship_categories` | array | Barras ou donut | Categoria normalizada da bolsa, boa para leitura agregada. |
| `institutions` | array | Barras horizontais | Instituições com mais bolsistas. |
| `institution_ufs` | array | Mapa ou barras | Distribuição por UF. |
| `institution_regions` | array | Barras/donut | Distribuição regional. |
| `sex` | array | Donut/barras | Distribuição inferida de sexo/gênero operacional. |
| `main_research_areas` | array | Barras horizontais | Áreas principais de pesquisa. |
| `career_stages` | array | Barras/donut | Estágio de carreira inferido. |
| `academic_ranks` | array | Barras | Cargo/título acadêmico inferido quando aparece no currículo. |
| `seniority` | array | Barras/donut | Senioridade inferida. |
| `doctorate_years` | object | Histograma | Distribuição por ano/faixa de doutorado. |

### `doctorate_years`

```json
{
  "buckets": {
    "before_1990": 12,
    "1990_1999": 80,
    "2000_2009": 170,
    "2010_2019": 200,
    "2020_plus": 5,
    "unknown": 13
  },
  "min": 1984,
  "max": 2023
}
```

| Campo | Tipo | Descrição |
|---|---:|---|
| `buckets` | object | Contagem por faixa de ano de doutorado. |
| `min` | number/null | Ano de doutorado mais antigo encontrado. |
| `max` | number/null | Ano de doutorado mais recente encontrado. |

## Bloco `experience_flags`

Flags booleanas inferidas a partir do Lattes completo.

Cada campo segue o formato:

```json
{
  "true": 120,
  "false": 300,
  "unknown": 60
}
```

### Campos disponíveis

| Campo | Tipo | Gráfico recomendado | Ideia |
|---|---:|---|---|
| `international_experience` | object | Barras empilhadas | Pessoas com sinais de experiência internacional. |
| `industry_experience` | object | Barras empilhadas | Pessoas com sinais de atuação com indústria/empresa. |
| `management_experience` | object | Barras empilhadas | Pessoas com coordenação, gestão, chefia, direção etc. |
| `editorial_or_event_experience` | object | Barras empilhadas | Pessoas com atuação editorial ou organização de eventos. |
| `patents_or_software_outputs` | object | Barras empilhadas | Pessoas com patentes, softwares ou produção tecnológica. |

## Bloco `top_terms`

Termos agregados para explorar temas e assuntos.

Cada lista segue:

```json
[
  {
    "label": "inteligencia artificial",
    "count": 44
  }
]
```

| Campo | Tipo | Gráfico recomendado | Ideia |
|---|---:|---|---|
| `research_topics` | array | Barras horizontais ou nuvem de termos | Tópicos de pesquisa mais frequentes. |
| `methods_and_techniques` | array | Barras horizontais | Métodos/técnicas usados pelos pesquisadores. |
| `application_domains` | array | Barras horizontais | Domínios de aplicação: saúde, educação, robótica etc. |
| `dashboard_tags` | array | Chips/filtros/nuvem | Tags prontas para filtros rápidos do dashboard. |

## Bloco `analysis`

Bloco pensado para a visão do professor avaliando bolsas, projetos, concentração institucional e temas de pesquisa.

Ele reorganiza dados que já existem em outros blocos, mas com nomes mais voltados para as telas do dashboard.

## `analysis.recommended_cards`

Cards principais recomendados para o topo do dashboard.

```json
{
  "total_profiles": 480,
  "institutions_count": 80,
  "ufs_count": 24,
  "main_areas_count": 30,
  "profiles_with_review_flags": 401,
  "llm_errors": 0
}
```

| Campo | Ideia |
|---|---|
| `total_profiles` | Total de bolsistas no dataset. |
| `institutions_count` | Quantidade de instituições representadas. |
| `ufs_count` | Quantidade de UFs representadas. |
| `main_areas_count` | Quantidade de áreas principais detectadas. |
| `profiles_with_review_flags` | Quantidade de perfis com algo a revisar. |
| `llm_errors` | Erros finais de LLM, idealmente `0`. |

## `analysis.grant_distribution`

Distribuição das bolsas.

| Campo | Gráfico recomendado | Pergunta que responde |
|---|---|---|
| `by_level` | Barras | Quais níveis de bolsa aparecem mais? |
| `by_category` | Barras/donut | Como as bolsas se distribuem em categorias agregadas? |
| `by_institution_top_20` | Barras horizontais | Quais instituições concentram mais bolsas? |
| `by_region` | Barras/donut | Como as bolsas se distribuem por região? |
| `by_uf` | Mapa/barras | Como as bolsas se distribuem por UF? |

## `analysis.research_landscape`

Mapa de temas de pesquisa.

| Campo | Gráfico recomendado | Pergunta que responde |
|---|---|---|
| `main_areas_top_30` | Barras horizontais | Quais áreas dominam o conjunto? |
| `research_topics_top_40` | Barras/nuvem | Quais tópicos aparecem mais? |
| `methods_top_40` | Barras | Quais métodos/técnicas são mais comuns? |
| `application_domains_top_30` | Barras | Em quais domínios as pesquisas são aplicadas? |

## `analysis.career_and_diversity`

Perfil acadêmico e diversidade.

| Campo | Gráfico recomendado | Pergunta que responde |
|---|---|---|
| `doctorate_years` | Histograma | O grupo é mais sênior ou recente? |
| `career_stages` | Barras/donut | Qual estágio de carreira predomina? |
| `seniority` | Barras/donut | Como está a senioridade geral? |
| `sex` | Barras/donut | Qual a distribuição inferida de sexo/gênero operacional? |

## `analysis.impact_and_leadership`

Sinais de impacto, liderança e atuação fora da produção puramente acadêmica.

| Campo | Gráfico recomendado | Pergunta que responde |
|---|---|---|
| `international_experience` | Barras true/false/unknown | Quantos têm experiência internacional? |
| `industry_experience` | Barras true/false/unknown | Quantos têm conexão com indústria? |
| `management_experience` | Barras true/false/unknown | Quantos têm perfil de gestão/liderança? |
| `editorial_or_event_experience` | Barras true/false/unknown | Quantos atuam em eventos/editoria? |
| `patents_or_software_outputs` | Barras true/false/unknown | Quantos têm produção tecnológica? |

## `analysis.cross_charts`

Gráficos cruzados para análises mais úteis.

Cada item é uma lista no formato:

```json
[
  {
    "label": "Inteligencia Artificial",
    "total": 42,
    "values": {
      "PQ-2": 25,
      "PQ-1D": 10,
      "PQ-1C": 7
    }
  }
]
```

### Campos disponíveis

| Campo | Gráfico recomendado | Pergunta que responde |
|---|---|---|
| `area_by_scholarship_category` | Barras empilhadas | Quais áreas concentram quais categorias de bolsa? |
| `institution_by_main_area_top_20` | Barras empilhadas | Quais instituições concentram quais áreas? |
| `sex_by_scholarship_category` | Barras empilhadas | Existe diferença de distribuição por sexo inferido e categoria da bolsa? |
| `sex_by_main_area_top_30` | Barras empilhadas | Como sexo inferido se distribui por área? |
| `scholarship_category_by_doctorate_age` | Barras empilhadas | Bolsas mais altas estão concentradas em pessoas com doutorado mais antigo? |
| `region_by_scholarship_category` | Barras empilhadas | Como categoria de bolsa varia por região? |

## Sugestão de telas do front

### Tela 1: Status

Use:

```txt
GET /
```

Componentes:

```txt
API online/offline
dataset ativo
scraping em andamento
última run ativa
erros técnicos
```

### Tela 2: Dashboard geral

Use:

```txt
GET /dashboard/metrics
```

Componentes:

```txt
cards de recommended_cards
distribuição por bolsa
distribuição por instituição
distribuição por UF/região
distribuição por sexo inferido
histograma de doutorado
```

### Tela 3: Análise para avaliação de projetos/bolsas

Use:

```txt
GET /dashboard/metrics
```

Componentes:

```txt
area_by_scholarship_category
institution_by_main_area_top_20
scholarship_category_by_doctorate_age
region_by_scholarship_category
research_topics_top_40
application_domains_top_30
```

### Tela 4: Qualidade dos dados

Use:

```txt
GET /
GET /dashboard/metrics
```

Componentes:

```txt
needs_review
review_rate
llm_errors
llm_repair_attempts
llm_repair_successes
paths da run ativa
```

## Observações para o frontend

1. A rota `/dashboard/metrics` já devolve dados agregados. O front não precisa carregar o JSON completo com todas as pessoas para montar os gráficos principais.
2. Para barras horizontais, usar `label` no eixo Y e `count` no eixo X.
3. Para gráficos cruzados, usar `label` como grupo principal e `values` como séries empilhadas.
4. Campos com `unknown` devem ser exibidos, mas com cor neutra.
5. Campos de revisão não devem bloquear o dashboard. Eles servem para transparência da qualidade.
6. A API ainda não possui rota pública para listar pessoas individualmente. Por enquanto, o dashboard trabalha só com agregações.

## Rotas de chat com File Search

As rotas abaixo implementam a base para RF04: consulta em linguagem natural.

A ideia é separar:

```txt
dataset estruturado -> dashboard
corpus de busca -> File Search / perguntas abertas
sessões e mensagens -> histórico do chat
```

O chat não envia o JSON de 5.4 MB a cada pergunta. O fluxo correto é:

```txt
1. gerar corpus local de busca
2. subir/indexar esse corpus uma vez no Vector Store da OpenAI
3. criar uma sessão de chat
4. enviar perguntas usando session_id + vector_store_id salvo
```

## POST /chat/corpus/rebuild

Gera novamente o arquivo local usado para busca semântica.

### Ideia

Transforma `profiles_with_inferences.json` em um `.json` menor e mais focado para perguntas.

Esse comando não chama OpenAI e não gera custo de LLM. Ele só cria arquivo local.

### Request

```http
POST /chat/corpus/rebuild
```

Não recebe body.

### Response

```json
{
  "created_at": "2026-05-28T13:54:54",
  "source_profiles_json": "scrape_results/inferences/20260527_174328/profiles_with_inferences.json",
  "corpus_path": "scrape_results/search/profiles_search_corpus.json",
  "records_count": 480,
  "bytes": 2254302,
  "sha256": "...",
  "fields": []
}
```

### Campos

| Campo | Tipo | Descrição |
|---|---:|---|
| `created_at` | string | Data/hora em que o corpus foi gerado. |
| `source_profiles_json` | string | JSON final de inferências usado como fonte. |
| `corpus_path` | string | Arquivo `.json` gerado para busca. |
| `records_count` | number | Quantidade de pessoas no corpus. |
| `bytes` | number | Tamanho do corpus em bytes. |
| `sha256` | string | Hash do corpus. Usado para saber se precisa subir de novo. |
| `fields` | array | Campos semânticos incluídos no corpus. |

## GET /chat/corpus

Retorna metadados do corpus local já gerado.

### Request

```http
GET /chat/corpus
```

### Possíveis erros

| Status | Quando acontece |
|---:|---|
| `404` | Quando o corpus ainda não foi gerado. |

## POST /chat/vector-store/sync

Cria ou reutiliza o Vector Store da OpenAI e sobe o corpus local.

### Ideia

Essa é a rota que prepara a base de conhecimento para o chat. Ela pode gerar custo de storage/indexação na OpenAI, então deve ser chamada por ação administrativa, não a cada pergunta.

### Request

```http
POST /chat/vector-store/sync
Content-Type: application/json

{
  "force_upload": false
}
```

### Campos do body

| Campo | Tipo | Descrição |
|---|---:|---|
| `force_upload` | boolean | Se `false`, reutiliza o Vector Store quando o hash do corpus não mudou. Se `true`, sobe o arquivo novamente. |

### Response

```json
{
  "updated_at": "2026-05-28T14:00:00",
  "vector_store_id": "vs_...",
  "openai_file_id": "file_...",
  "corpus_path": "scrape_results/search/profiles_search_corpus.json",
  "corpus_sha256": "...",
  "corpus_records_count": 480,
  "status": "completed",
  "last_error": null,
  "reused": false
}
```

### Campos

| Campo | Tipo | Descrição |
|---|---:|---|
| `updated_at` | string | Data/hora da sincronização. |
| `vector_store_id` | string | ID da base vetorial na OpenAI. Esse ID é usado nas perguntas. |
| `openai_file_id` | string | ID do arquivo enviado para OpenAI. |
| `corpus_path` | string | Corpus local enviado. |
| `corpus_sha256` | string | Hash do corpus enviado. |
| `corpus_records_count` | number | Quantidade de pessoas no corpus. |
| `status` | string | Status da indexação do arquivo. O ideal é `completed`. |
| `last_error` | object/null | Erro retornado pela OpenAI, se houver. |
| `reused` | boolean | `true` quando não precisou reenviar o arquivo. |

## GET /chat/vector-store

Retorna os metadados do Vector Store salvo localmente.

### Request

```http
GET /chat/vector-store
```

### Possíveis erros

| Status | Quando acontece |
|---:|---|
| `404` | Quando `/chat/vector-store/sync` ainda não foi executado. |

## POST /chat/sessions

Cria uma nova conversa.

### Ideia

Cada conversa tem seu próprio histórico. Isso permite o professor abrir várias conversas diferentes e continuar depois.

### Request

```http
POST /chat/sessions
Content-Type: application/json

{
  "title": "Perguntas sobre robótica"
}
```

### Response

```json
{
  "id": "uuid",
  "title": "Perguntas sobre robótica",
  "created_at": "2026-05-28T14:10:00",
  "updated_at": "2026-05-28T14:10:00",
  "messages": []
}
```

## GET /chat/sessions

Lista conversas existentes.

### Request

```http
GET /chat/sessions
```

### Response

```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Perguntas sobre robótica",
      "created_at": "2026-05-28T14:10:00",
      "updated_at": "2026-05-28T14:20:00",
      "messages_count": 4
    }
  ]
}
```

## GET /chat/sessions/{session_id}

Retorna uma conversa completa com todas as mensagens.

### Request

```http
GET /chat/sessions/{session_id}
```

### Possíveis erros

| Status | Quando acontece |
|---:|---|
| `404` | Quando a conversa não existe. |

## POST /chat/sessions/{session_id}/ask

Envia uma pergunta para uma conversa existente.

### Ideia

Essa rota:

```txt
1. salva a pergunta do usuário no histórico
2. envia a pergunta + últimas mensagens para a OpenAI
3. usa File Search com o vector_store_id salvo
4. salva a resposta no histórico
5. devolve resposta e metadados
```

### Request

```http
POST /chat/sessions/{session_id}/ask
Content-Type: application/json

{
  "question": "Quais pesquisadores trabalham com robótica?",
  "max_num_results": 8
}
```

### Campos do body

| Campo | Tipo | Descrição |
|---|---:|---|
| `question` | string | Pergunta do usuário. |
| `max_num_results` | number | Quantidade máxima de trechos recuperados pelo File Search. Aceita de `1` a `20`. |

### Response

```json
{
  "session_id": "uuid",
  "answer": "Resposta do modelo...",
  "message": {},
  "metadata": {
    "model": "gpt-5.4-mini",
    "vector_store_id": "vs_...",
    "max_num_results": 8,
    "response_id": "resp_...",
    "annotations": []
  }
}
```

### Campos

| Campo | Tipo | Descrição |
|---|---:|---|
| `session_id` | string | Conversa usada. |
| `answer` | string | Resposta final do modelo. |
| `message` | object | Mensagem salva no histórico local. |
| `metadata.model` | string | Modelo usado no chat. Padrão atual: `gpt-5.4-mini`. Pode ser alterado por `CHAT_MODEL`. |
| `metadata.vector_store_id` | string | Vector Store consultado. |
| `metadata.max_num_results` | number | Limite de trechos recuperados. |
| `metadata.response_id` | string | ID da resposta na OpenAI. |
| `metadata.annotations` | array | Anotações/citações retornadas pela API, quando existirem. |

### Possíveis erros

| Status | Quando acontece |
|---:|---|
| `404` | Quando a conversa não existe. |
| `404` | Quando o Vector Store ainda não foi configurado. |

## Fluxo recomendado para o front

### Setup administrativo

Executar uma vez depois de gerar/atualizar o dataset:

```txt
POST /chat/corpus/rebuild
POST /chat/vector-store/sync
```

### Uso normal do professor

```txt
POST /chat/sessions
GET /chat/sessions
GET /chat/sessions/{session_id}
POST /chat/sessions/{session_id}/ask
```

### Quando o dataset for regenerado

```txt
POST /chat/corpus/rebuild
POST /chat/vector-store/sync
```

Se o hash do corpus não mudou, `/chat/vector-store/sync` reutiliza o Vector Store existente.
