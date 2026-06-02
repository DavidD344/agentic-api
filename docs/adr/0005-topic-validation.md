# ADR 0005: Validação de tópicos pela LLM final

Status: aceito

## Contexto

Filtros por tópico podem gerar falsos positivos. Exemplo:

```txt
eletrônica
```

Pode aparecer como área real de atuação, mas também em expressões incidentais como:

```txt
votação eletrônica
```

## Decisão

Quando a consulta estruturada usa `op=topic`, o backend trata os resultados como candidatos amplos.

O agente final deve validar os candidatos antes de apresentar contagem final.

## Justificativa

Contagem textual pura pode superestimar resultados. A validação pela LLM permite considerar contexto, resumo, área principal, tópicos e domínio de aplicação.

## Consequências

Vantagens:

- reduz falsos positivos;
- melhora respostas para perguntas temáticas;
- permite explicar o critério de validação.

Limitações:

- contagem final passa a depender de julgamento da LLM;
- pode variar em casos ambíguos;
- candidatos muito numerosos podem exigir truncamento.

## Regra

Por padrão, tema significa atuação atual, área de pesquisa, tópicos, métodos ou domínio de aplicação. Formação acadêmica, menção histórica ou uso incidental não contam, salvo quando a pergunta pedir explicitamente isso.

