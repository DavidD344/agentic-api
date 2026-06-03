# Estrutura para Miro: sistema multiagente

Este arquivo é um guia sucinto para montar o fluxograma no Miro. Ele separa claramente:

```txt
Agente:
  componente com responsabilidade decisória, coordenação, inferência, planejamento ou resposta.

Scraper/processo determinístico:
  componente que coleta, transforma ou calcula dados por regra/código, sem decidir semanticamente sozinho.

LLM:
  chamada de modelo usada dentro de um agente específico.
```

## Legenda visual

Use uma cor por tipo de caixa:

```txt
Fonte externa: cinza
Scraper/processo determinístico: azul claro
Agente: azul escuro
LLM: roxo
Arquivo/base: amarelo
Backend/API: verde
Frontend/usuário: laranja
Guardrail/log: vermelho claro
```

## Fluxo principal para desenhar

Desenhe em 5 faixas horizontais:

```txt
1. Fontes
2. Coleta e enriquecimento
3. Base ativa
4. Backend e agentes de consulta
5. Frontend
```

## Caixas do fluxo

### 1. Fontes

```txt
Página CNPq
Tabela oficial de bolsistas e bolsas.
```

```txt
Currículo Lattes
Fonte curricular complementar.
```

```txt
Google Scholar
Fonte opcional futura.
Não é etapa obrigatória do MVP.
```

### 2. Coleta e enriquecimento

```txt
Orchestrator Agent
Coordena a pipeline e promove a base ativa.
```

```txt
Collector Scraper
Extrai a tabela CNPq.
Sem LLM.
```

```txt
Lattes Preview Scraper
Encontra o lattes_code.
```

```txt
LLM: Revisão Lattes
Só em ambiguidades.
Modelo: gpt-5.4-mini.
```

```txt
Lattes Full Scraper
Baixa o currículo completo.
Sem LLM.
```

```txt
Inference Agent
Gera campos derivados e semânticos.
Usa regras locais + LLM.
```

```txt
LLM: Inferências
Modelo principal: gpt-5-nano.
Reparo: gpt-5.4-mini.
```

```txt
Normalization Process
Normaliza UF, região, rótulos e campos finais.
```

```txt
Sex Review Agent
Revisa sex_inferred unknown.
Modelo: gpt-5.4-nano.
```

### 3. Base ativa

```txt
Artefatos da run
HTML, TXT, CSV, JSON, summaries, review queues e logs.
```

```txt
profiles_with_inferences
Dataset final enriquecido.
```

```txt
current.json
Manifesto que aponta para a base ativa.
```

```txt
Search Corpus
Corpus compacto para busca e chat.
```

```txt
Vector Store
File Search opcional para busca semântica.
Não usado para contagens exatas.
```

### 4. Backend e agentes de consulta

```txt
FastAPI Backend
Expõe rotas e lê current.json.
```

```txt
Dashboard Agent
Calcula métricas.
GET /dashboard/metrics.
```

```txt
Profile Search Agent
Lista, filtra e exporta perfis.
GET /profiles.
```

```txt
Query Planner Agent
Agente 1 do chat.
Não responde ao usuário.
Escolhe dados/ferramentas para o Agente 2.
Modelo: gpt-5.4-mini.
```

```txt
Backend Tools
Consulta estruturada, busca por tópico,
dashboard metrics e File Search.
```

```txt
Context Package
Pacote enviado ao Agente 2:
contagens, candidatos, métricas,
histórico e/ou trechos do Vector Store.
```

```txt
Query Answer Agent
Agente 2 do chat.
Valida contexto e redige resposta final.
Modelo: gpt-5.4-mini.
```

```txt
Chat Title Agent
Gera título curto da conversa.
Modelo: gpt-5.4-nano.
```

### 5. Frontend

```txt
Frontend Next/React
Interface web.
```

```txt
Dashboard
Gráficos e métricas.
```

```txt
Busca de Pesquisadores
Lista com filtros e perfis.
```

```txt
Chat
Consulta em linguagem natural.
```

```txt
Usuário / Professor
Usa dashboard, busca e chat.
```

## Conexões essenciais

Use exatamente estas setas no Miro:

```txt
Página CNPq
  -> Collector Scraper
  -> scholarships.csv
  -> Lattes Preview Scraper
```

```txt
Currículo Lattes
  -> Lattes Preview Scraper / Lattes Full Scraper
```

```txt
Lattes Preview Scraper
  -> LLM: Revisão Lattes
  -> lattes_code
  -> Lattes Full Scraper
```

```txt
Lattes Full Scraper
  -> Inference Agent
  -> LLM: Inferências
  -> Normalization Process
  -> Sex Review Agent
  -> profiles_with_inferences
  -> current.json
```

```txt
profiles_with_inferences
  -> Search Corpus
  -> Vector Store
```

```txt
current.json
  -> FastAPI Backend
```

```txt
FastAPI Backend
  -> Dashboard Agent
  -> Dashboard
```

```txt
FastAPI Backend
  -> Profile Search Agent
  -> Busca de Pesquisadores
```

```txt
FastAPI Backend
  -> Query Planner Agent
  -> Backend Tools
  -> Context Package
  -> Query Answer Agent
  -> Chat
```

```txt
Vector Store
  -> Backend Tools
```

```txt
Chat Title Agent
  -> Chat
```

```txt
Frontend Next/React
  -> Dashboard
  -> Busca de Pesquisadores
  -> Chat
```

```txt
Usuário / Professor
  -> Frontend Next/React
```

## Tabela de chamadas LLM

Use esta tabela como apoio no slide ou em uma lateral do Miro:

| Agente | Chamada LLM | Quando ocorre | Modelo padrão |
|---|---|---|---|
| Lattes Preview | Revisão de ambiguidade | Só quando há múltiplos candidatos plausíveis | `gpt-5.4-mini` |
| Inference Agent | Validação de regras | Valida/corrige UF, região, sexo, doutorado etc. | `gpt-5-nano` |
| Inference Agent | Geração semântica | Área, tópicos, métodos, domínios, carreira, resumo e tags | `gpt-5-nano` |
| Inference Agent | Reparo | Só em erro, timeout ou JSON inválido | `gpt-5.4-mini` |
| Sex Review Agent | Revisão de sexo unknown | Só quando `sex_inferred` ficou unknown | `gpt-5.4-nano` |
| Query Planner Agent | Planejamento da pergunta | Toda pergunta do chat | `gpt-5.4-mini` |
| Query Answer Agent | Resposta final | Toda pergunta do chat | `gpt-5.4-mini` |
| Chat Title Agent | Título da conversa | Ao criar conversa | `gpt-5.4-nano` |

## O ponto mais importante do chat

Use esta explicação curta no Miro:

```txt
Agente 1 não responde.
Ele decide quais dados buscar.

Backend executa ferramentas:
consulta local, busca por tópico,
métricas ou Vector Store.

Agente 2 recebe o Context Package
e escreve a resposta final.
```

## Guardrails laterais

Coloque 4 caixas laterais:

```txt
Base segura
Runs com erro ou limitadas não atualizam current.json.
```

```txt
LLM controlada
LLM não executa código livre.
Só escolhe ferramentas ou candidatos permitidos.
```

```txt
Contagens exatas
Totais e filtros são calculados no JSON local.
Vector Store é só para semântica.
```

```txt
Inferências sinalizadas
Campos inferidos, como sex_inferred,
são apoio analítico, não fonte oficial.
```

## Versão mínima para apresentação

Se precisar de um diagrama ainda menor:

```txt
CNPq + Lattes
  -> Scrapers
  -> Inference Agent
  -> Base Ativa
  -> FastAPI
  -> Dashboard / Perfis / Chat
```

E destaque:

```txt
LLM entra apenas em decisões semânticas:
ambiguidade Lattes, inferências, revisão de sexo e chat.
```
