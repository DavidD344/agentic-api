# ADR 0004: Fluxo de chat com dois agentes

Status: aceito

## Contexto

Perguntas do professor podem variar entre:

- contagens exatas;
- filtros compostos;
- busca por temas;
- explicações abertas;
- listagem de pesquisadores.

Um único prompt direto tende a errar contagens ou recuperar só exemplos.

## Decisão

Usar duas chamadas de LLM:

```txt
Agente 1: planejador
-> decide ferramenta e gera plano JSON

Backend
-> executa ferramenta segura

Agente 2: validador/redator
-> valida resultados quando necessário e escreve a resposta final
```

Configuração atual:

```txt
CHAT_PLANNER_MODEL=gpt-5.4-mini
CHAT_MODEL=gpt-5.4
CHAT_DISABLE_STRUCTURED_QUERY=0
```

## Justificativa

O agente planejador transforma linguagem natural em um plano controlado. O backend executa apenas operações permitidas, sem rodar código arbitrário gerado pela LLM.

O agente final recebe o resultado da ferramenta e responde de forma clara.

## Volume de contexto enviado

O chat não envia o arquivo completo `profiles_search_corpus.json` em toda pergunta. Na rodada atual, esse arquivo tem aproximadamente:

```txt
profiles_search_corpus.json: 2.564.904 caracteres
```

Em vez disso, as duas LLMs recebem um contexto base menor, montado pelo backend:

```txt
dashboard_metrics_context:       3.201 caracteres  (~800 tokens)
minimal_profiles_context_text:  38.210 caracteres  (~9.552 tokens)
full_agent_context:             41.413 caracteres  (~10.353 tokens)
```

A estimativa de tokens usa a regra simples `caracteres / 4`. O número real pode variar conforme o tokenizer do modelo.

### Agente 1: planejador

Recebe:

- prompt de planejamento;
- `full_agent_context`, com métricas agregadas e resumo mínimo de cada pessoa;
- até 4 mensagens recentes da conversa;
- pergunta atual do usuário.

Na prática, antes do histórico e da pergunta, a primeira LLM já recebe cerca de `41 mil caracteres`, aproximadamente `10 mil tokens`.

### Agente 2: validador/redator

Recebe:

- prompt de resposta final;
- o mesmo `full_agent_context`;
- até 8 mensagens recentes da conversa;
- plano gerado pela primeira LLM;
- resultados das ferramentas executadas pelo backend.

Quando a ferramenta é `structured_query`, o backend envia os resultados filtrados. Em perguntas de tema livre, como robótica ou eletrônica, o resultado pode incluir até `CHAT_TOPIC_VALIDATION_LIMIT` candidatos compactos para validação semântica da LLM final. O padrão atual é `120`.

Quando a ferramenta é `file_search`, a segunda LLM também pode receber trechos recuperados do Vector Store, limitados por `max_num_results`.

Por isso, a segunda chamada costuma ser mais cara: além do contexto base, ela recebe resultados de ferramenta e usa o modelo configurado em `CHAT_MODEL`, atualmente `gpt-5.4`.

## Consequências

Vantagens:

- comportamento mais explicável;
- melhor aderência ao tema multiagente;
- menor risco do modelo inventar números;
- separação entre planejamento, ferramenta e resposta.

Limitações:

- duas chamadas de LLM aumentam latência e custo;
- o planejador pode escolher a ferramenta errada;
- exige bons metadados no prompt.

## Guardrail

A LLM não executa Python livre. Ela só produz um plano JSON com campos, operadores e limites permitidos.
