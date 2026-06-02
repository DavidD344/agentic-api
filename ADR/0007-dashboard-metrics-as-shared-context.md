# ADR 0007: Métricas do dashboard como contexto compartilhado dos agentes

Status: aceito

## Contexto

Os agentes precisam conhecer a estrutura geral do dataset e algumas contagens globais para planejar melhor. Já existe a rota `/dashboard/metrics` com muitas informações agregadas.

## Decisão

Reutilizar os dados de `build_dashboard_metrics()` como contexto dos agentes, em vez de criar outro resumo manual separado.

Além disso, gerar uma lista compacta de perfis com:

```txt
nome
primeiro nome
sexo inferido
instituição
bolsa
categoria da bolsa
UF
região
```

## Justificativa

Evita duplicação de lógica. O mesmo conjunto de métricas alimenta dashboard e planejamento do chat.

A lista compacta ajuda os agentes a entender nomes, instituições e atributos básicos sem enviar o currículo completo.

## Consequências

Vantagens:

- contexto consistente com o dashboard;
- menor risco de divergência entre visualização e chat;
- melhora planejamento de perguntas sobre bolsa, região, sexo e instituição.

Limitações:

- adiciona tokens em toda chamada;
- se o dataset mudar, a lista compacta precisa ser regenerada;
- campos inferidos ainda carregam incertezas.

