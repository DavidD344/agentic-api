# Dataset Contract

Este documento define o contrato atual do dataset usado pela API, dashboard e futuro chat. Ele separa quais campos devem existir para toda pessoa, quais campos podem ser `null`/`unknown`, quais campos sao gerados por regra e quais sao inferidos pela LLM.

Arquivo principal consumido pela aplicacao:

```txt
scrape_results/current.json
  -> profiles_with_inferences_json
```

No estado atual, o arquivo ativo e:

```txt
scrape_results/inferences/20260527_174328/profiles_with_inferences.json
```

## Regra geral

Cada pessoa no JSON representa um bolsista. O objeto tem:

```txt
campos base
campos do Lattes full
semantic_profile
```

O `semantic_profile` e um objeto com campos inferidos. Cada campo dentro dele usa este envelope:

```json
{
  "value": "...",
  "confidence": 0.9,
  "source": "llm",
  "reason": "Motivo curto.",
  "needs_review": false
}
```

Significado:

```txt
value
  Valor do campo.

confidence
  Numero de 0 a 1.

source
  Origem do campo.

reason
  Explicacao curta.

needs_review
  true quando o campo merece revisao humana/agente.
```

Valores conhecidos de `source`:

```txt
rule
rule:lattes_text
rule+llm_validated
llm_corrected_rule
llm
```

## Nivel de obrigatoriedade

Neste documento usamos:

```txt
required
  Deve existir em toda pessoa. Pode ser string vazia apenas se a fonte original falhar.

required_nullable
  Deve existir em toda pessoa, mas value pode ser null ou unknown.

optional
  Pode faltar ou estar vazio sem quebrar API/dashboard/chat.

derived
  Deve existir dentro de semantic_profile, mas pode ter value unknown/null.
```

## Campos base obrigatorios

Estes campos ficam na raiz de cada pessoa.

| Campo | Tipo | Obrigatoriedade | Origem | Uso |
|---|---:|---|---|---|
| `name` | string | required | CNPq | dashboard, perfil, chat, busca |
| `institution` | string | required | CNPq | dashboard, filtros, chat |
| `scholarship_level` | string | required | CNPq | dashboard, filtros |
| `lattes_code` | string | required | Lattes preview | identificador tecnico, detalhe |
| `lattes_name` | string | required | Lattes preview/full | validacao, perfil |
| `lattes_url` | string | required | Lattes full | link externo |
| `photo_url` | string/null | optional | Lattes full | cards/perfil |

Observacoes:

```txt
name e o nome da tabela do CNPq.
lattes_name e o nome encontrado no Lattes.
Normalmente eles devem ser iguais ou muito parecidos.
lattes_code e codigo tecnico interno da busca textual.
lattes_url e a URL publica mais importante para exibir ao usuario.
```

## Campos adicionais do Lattes full

Ficam na raiz de cada pessoa e ajudam auditoria, debug, perfil detalhado e reprocessamento.

| Campo | Tipo | Obrigatoriedade | Origem | Uso |
|---|---:|---|---|---|
| `match_status` | string | required | pipeline | auditoria |
| `public_lattes_id` | string/null | optional | Lattes full | URL publica |
| `last_updated` | string/null | optional | Lattes full | qualidade dos dados |
| `orcid` | string/null | optional | Lattes full/preview | perfil |
| `summary` | string | required_nullable | Lattes full | LLM, perfil, chat |
| `full_cv_text_length` | integer | required_nullable | Lattes full | auditoria |
| `looks_like_full_cv` | boolean | required_nullable | parser | auditoria |
| `blocked_or_invalid` | boolean | required_nullable | parser | auditoria |
| `sections_count` | integer | required_nullable | parser | auditoria |
| `detail_json_path` | string | optional | pipeline | debug/reprocessamento |
| `raw_html_path` | string | optional | pipeline | debug/reprocessamento |
| `raw_text_path` | string | optional | pipeline | snippets/reprocessamento |
| `error` | string/null | optional | pipeline | auditoria |
| `sections_available` | list[string] | optional | parser | debug/qualidade |

## Campos inferidos por regra local

Todos ficam em `semantic_profile`.

Esses campos sao gerados primeiro por codigo e podem ser validados/corrigidos pela LLM.

| Campo | Tipo de `value` | Obrigatoriedade | Origem | Pode ser unknown/null? | Uso |
|---|---:|---|---|---|---|
| `institution_state_uf` | string | derived | regra local | sim | dashboard, filtros |
| `institution_region` | enum | derived | regra local | sim | dashboard |
| `scholarship_category` | enum | derived | regra local | sim | dashboard |
| `scholarship_level_rank` | integer/null | derived | regra local | sim | ordenacao/filtros |
| `doctorate_year` | integer/null | derived | regex + LLM | sim | dashboard, requisito |
| `years_since_doctorate` | integer/null | derived | regra local | sim | dashboard |
| `profile_language` | enum | derived | regra local | sim | qualidade |
| `sex_inferred` | enum | derived | texto + LLM | sim | requisito, estatistica |

### `institution_state_uf`

```txt
Tipo:
  string

Origem:
  institution

Como gera:
  tabela local de sigla de instituicao -> UF.

Exemplos:
  SP
  RJ
  PE
  unknown

Uso:
  dashboard por UF
  filtros
```

### `institution_region`

```txt
Tipo:
  enum

Valores esperados:
  Norte
  Nordeste
  Centro-Oeste
  Sudeste
  Sul
  unknown

Origem:
  institution_state_uf

Observacao:
  Valores em ingles, como Northeast, devem ser normalizados depois.
```

### `scholarship_category`

```txt
Tipo:
  enum

Valores esperados:
  PQ-1
  PQ-2
  PQ-C
  unknown

Origem:
  scholarship_level
```

### `scholarship_level_rank`

```txt
Tipo:
  integer/null

Valores:
  PQ-1 -> 1
  PQ-2 -> 2
  PQ-C -> 3
  unknown -> null
```

### `doctorate_year`

```txt
Tipo:
  integer/null

Origem:
  summary do Lattes

Como gera:
  regex procura doutorado/PhD + ano.
  LLM valida/corrige.

Uso:
  requisito do trabalho
  dashboard por periodo de formacao
```

### `years_since_doctorate`

```txt
Tipo:
  integer/null

Origem:
  doctorate_year

Como gera:
  ano atual - doctorate_year
```

### `profile_language`

```txt
Tipo:
  enum

Valores:
  pt
  en
  mixed
  unknown
```

### `sex_inferred`

```txt
Tipo:
  enum

Valores:
  male
  female
  unknown

Origem:
  marcadores textuais no Lattes, como professor/professora, pesquisador/pesquisadora,
  doutor/doutora, graduado/graduada.

Observacao:
  Campo sensivel e aproximado.
  unknown e aceitavel.
  Para relatorios, sempre deixar claro que e inferido.
```

## Campos inferidos pela LLM

Todos ficam em `semantic_profile`.

Esses campos sao gerados para tornar os dados mais faceis de consultar, agrupar e explicar no dashboard/chat.

| Campo | Tipo de `value` | Obrigatoriedade | Pode ser unknown/null? | Uso |
|---|---:|---|---|---|
| `main_research_area` | string | derived | sim | dashboard, chat, filtros |
| `secondary_research_areas` | list[string] | derived | sim/lista vazia | dashboard, chat |
| `research_topics` | list[string] | derived | sim/lista vazia | busca, chat, dashboard |
| `methods_and_techniques` | list[string] | derived | sim/lista vazia | busca, chat |
| `application_domains` | list[string] | derived | sim/lista vazia | dashboard, filtros |
| `career_stage` | enum | derived | sim | dashboard |
| `academic_rank` | string | derived | sim | dashboard, perfil |
| `seniority_level` | enum | derived | sim | dashboard |
| `has_international_experience` | boolean/null | derived | sim | dashboard |
| `international_countries` | list[string] | derived | sim/lista vazia | dashboard |
| `has_industry_experience` | boolean/null | derived | sim | dashboard |
| `industry_organizations` | list[string] | derived | sim/lista vazia | dashboard |
| `has_management_experience` | boolean/null | derived | sim | dashboard |
| `management_roles` | list[string] | derived | sim/lista vazia | perfil |
| `has_editorial_or_event_experience` | boolean/null | derived | sim | dashboard |
| `has_patents_or_software_outputs` | boolean/null | derived | sim | dashboard |
| `publication_or_output_focus` | list[string] | derived | sim/lista vazia | dashboard |
| `profile_summary_short` | string | derived | sim | cards, perfil |
| `profile_summary_bullets` | list[string] | derived | sim/lista vazia | perfil |
| `search_keywords` | list[string] | derived | sim/lista vazia | busca local |
| `dashboard_tags` | list[string] | derived | sim/lista vazia | filtros/dashboard |
| `chart_suggestions` | list[string] | derived | sim/lista vazia | dashboard |
| `data_quality_notes` | list[string] | derived | sim/lista vazia | auditoria |
| `qa_context` | string | derived | sim | chat |

## Enums esperados

### `career_stage`

```txt
early
mid
senior
very_senior
emeritus_or_retired
unknown
```

### `seniority_level`

```txt
junior
mid
senior
very_senior
unknown
```

### Booleanos inferidos

Campos booleanos podem ter:

```txt
true
false
null
```

`null` significa ausencia de evidencia suficiente, nao erro necessariamente.

## Campos obrigatorios para dashboard

Para o dashboard funcionar bem, cada perfil deve ter pelo menos:

```txt
name
institution
scholarship_level
lattes_url
semantic_profile.institution_state_uf
semantic_profile.institution_region
semantic_profile.scholarship_category
semantic_profile.sex_inferred
semantic_profile.main_research_area
semantic_profile.doctorate_year
semantic_profile.has_international_experience
semantic_profile.has_management_experience
semantic_profile.has_editorial_or_event_experience
semantic_profile.has_patents_or_software_outputs
```

Esses campos podem ter `unknown`/`null`, mas o envelope deve existir.

## Campos obrigatorios para chat

Para o chat funcionar bem, cada perfil deve ter:

```txt
name
institution
scholarship_level
lattes_url
semantic_profile.main_research_area
semantic_profile.secondary_research_areas
semantic_profile.research_topics
semantic_profile.methods_and_techniques
semantic_profile.application_domains
semantic_profile.search_keywords
semantic_profile.dashboard_tags
semantic_profile.qa_context
```

O backend nao deve mandar todos os 480 perfis para a LLM. Ele deve:

```txt
1. carregar profiles_with_inferences.json localmente
2. buscar/rankear perfis relevantes
3. mandar top N para a LLM
```

## Campos para cards/listagem

Recomendado:

```txt
name
institution
scholarship_level
photo_url
lattes_url
semantic_profile.main_research_area.value
semantic_profile.profile_summary_short.value
semantic_profile.dashboard_tags.value
```

## Campos para pagina de detalhe

Recomendado:

```txt
name
lattes_name
institution
scholarship_level
lattes_url
photo_url
orcid
last_updated
summary
sections_available
semantic_profile inteiro
```

## Campos que precisam normalizacao posterior

A inferencia por LLM pode gerar variacoes. Exemplos:

```txt
Northeast -> Nordeste
Professor Titular -> professor_titular
professor titular -> professor_titular
journal_articles -> journals
conference_papers -> conferences
pq-c -> PQ-C
```

Essas normalizacoes devem ser feitas por uma etapa de pos-processamento, nao manualmente em um unico arquivo.

Comando opcional atual:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/normalize_inferences.py scrape_results/inferences/<run>
```

Esse comando nao roda automaticamente na pipeline principal. Ele deve ser executado somente quando quisermos corrigir variacoes conhecidas depois da etapa de inferencia. A execucao atualiza os arquivos derivados da run informada e registra as mudancas em:

```txt
normalization_log.json
```

Exemplo real ja tratado:

```txt
institution_region.value: Northeast -> Nordeste
```

Importante: essa normalizacao atua em campos estruturados do `semantic_profile`. Ela nao altera ocorrencias legitimas dentro de textos livres, como nomes de eventos, capitulos ou organizacoes que contenham a palavra `Northeast`.

## Regra de revisao

Uma pessoa entra em `inference_review_queue` quando qualquer campo do `semantic_profile` tem:

```txt
needs_review=true
```

Isso nao significa que a pessoa esta errada. Significa que pelo menos um campo:

```txt
tem baixa confianca
e sensivel
esta ausente
foi inferido de forma fraca
merece confirmacao
```

Para dashboard, o nome recomendado e:

```txt
profiles_with_review_flags
```

em vez de `erros`.

## Contrato minimo para nao quebrar API

Um perfil valido para a API deve:

```txt
1. ser um objeto JSON
2. ter name, institution e scholarship_level
3. ter semantic_profile
4. semantic_profile deve conter todos os campos de regra e LLM
5. cada campo de semantic_profile deve ter value, confidence, source, reason, needs_review
```

Se algum campo estiver desconhecido, usar:

```txt
value = "unknown"
```

ou:

```txt
value = null
```

dependendo do tipo.
