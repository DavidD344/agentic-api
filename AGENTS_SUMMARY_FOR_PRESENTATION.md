# Resumo dos agentes para apresentação

Este arquivo resume quantos agentes existem no sistema, qual o papel de cada um e quais modelos LLM são usados.

## Visão geral

O sistema possui **15 agentes/processos principais**.

Nem todos usam LLM. No projeto, agente significa um componente com responsabilidade clara dentro do fluxo. Alguns agentes são determinísticos, alguns fazem scraping, e outros usam modelos de linguagem.

Resumo:

```txt
Agentes/processos totais: 15
Agentes com LLM: 6
Scrapers/processos sem LLM: 6
Agentes analíticos/backend sem LLM: 3
```

## Tabela de agentes

| # | Agente | Usa LLM? | Modelo padrão | Papel |
|---:|---|---|---|---|
| 1 | `orchestrator_agent` | Não | - | Coordena a pipeline, chama as etapas na ordem certa, registra logs e só promove a base se a execução for válida. |
| 2 | `collector_scraper` | Não | - | Coleta a tabela oficial do CNPq e gera a lista base de bolsistas com nome, instituição, bolsa, datas e situação. |
| 3 | `lattes_preview_agent` | Às vezes | `gpt-5.4-mini` quando ambíguo | Busca candidatos no Lattes e tenta encontrar o currículo correto. Se houver ambiguidade, chama LLM revisora. |
| 4 | `lattes_review_llm` | Sim | `gpt-5.4-mini` | Revisa ambiguidades do Lattes. Escolhe apenas entre candidatos já encontrados e só aceita quando há confiança suficiente. |
| 5 | `lattes_full_scraper` | Não | - | Usa o `lattes_code` resolvido para baixar o currículo completo e salvar HTML, texto e JSON estruturado. |
| 6 | `inference_agent` | Sim | `gpt-5-nano`; reparo com `gpt-5.4-mini` | Gera campos úteis para análise: área principal, tópicos, métodos, resumo, tags, senioridade e contexto para perguntas. |
| 7 | `normalization_process` | Não | - | Normaliza rótulos e campos finais, como UF, região, instituição e categorias. |
| 8 | `sex_review_agent` | Sim | `gpt-5.4-nano` | Revisa casos em que `sex_inferred` ficou desconhecido. É usado apenas como inferência estatística, não como dado oficial. |
| 9 | `search_context_agent` | Não | - | Gera o corpus compacto de busca, o contexto mínimo dos perfis e prepara o Vector Store opcional. |
| 10 | `dashboard_agent` | Não | - | Calcula métricas agregadas para o dashboard a partir da base ativa. |
| 11 | `profile_search_agent` | Não | - | Permite listar, filtrar, buscar e exportar pesquisadores. |
| 12 | `query_planner_agent` | Sim | `gpt-5.4-mini` | Primeiro agente do chat. Não responde ao usuário; decide quais dados e ferramentas o segundo agente precisa. |
| 13 | `backend_tools` | Não | - | Executa ferramentas controladas: consulta estruturada, busca por tópico, métricas e File Search/Vector Store. |
| 14 | `query_answer_agent` | Sim | `gpt-5.4-mini` | Segundo agente do chat. Recebe o pacote de contexto, valida resultados e escreve a resposta final. |
| 15 | `chat_title_agent` | Sim | `gpt-5.4-nano` | Gera um título curto para cada conversa do chat. |

## Agentes que usam LLM

### 1. `lattes_review_llm`

Modelo:

```txt
gpt-5.4-mini
```

Papel:

```txt
Resolve ambiguidades na busca Lattes.
Não cria candidatos novos.
Só escolhe entre candidatos já coletados.
```

### 2. `inference_agent`

Modelo principal:

```txt
gpt-5-nano
```

Modelo de reparo:

```txt
gpt-5.4-mini
```

Papel:

```txt
Transforma o currículo completo em campos perguntáveis e visualizáveis:
área, tópicos, métodos, experiência, resumo, tags e contexto de QA.
```

### 3. `sex_review_agent`

Modelo:

```txt
gpt-5.4-nano
```

Papel:

```txt
Revisa casos de sexo inferido desconhecido.
É um apoio estatístico para gráficos, não uma confirmação documental.
```

### 4. `query_planner_agent`

Modelo:

```txt
gpt-5.4-mini
```

Papel:

```txt
Entende a pergunta do usuário e decide a estratégia:
consulta local, busca por tópico, dashboard metrics ou Vector Store.
```

### 5. `query_answer_agent`

Modelo:

```txt
gpt-5.4-mini
```

Papel:

```txt
Recebe os dados preparados pelo planner/backend,
valida resultados e redige a resposta final.
```

### 6. `chat_title_agent`

Modelo:

```txt
gpt-5.4-nano
```

Papel:

```txt
Gera um título curto e legível para a conversa.
```

## Resposta curta se o professor perguntar

```txt
Nós modelamos 15 agentes/processos principais.
Nem todos são LLMs: alguns são scrapers, alguns são serviços determinísticos e outros são agentes com modelo.

Os agentes com LLM são 6:
1. revisão de ambiguidade Lattes;
2. inferências semânticas;
3. revisão de sexo desconhecido;
4. planner do chat;
5. answer agent do chat;
6. gerador de título do chat.

Os demais agentes fazem coleta, normalização, métricas, busca, orquestração e preparação do contexto.
```

## Frase para apresentação

```txt
A ideia foi usar LLM só onde havia decisão semântica.
Coleta, contagem, normalização e métricas ficam em código determinístico.
Assim o sistema é mais barato, auditável e fácil de defender.
```

