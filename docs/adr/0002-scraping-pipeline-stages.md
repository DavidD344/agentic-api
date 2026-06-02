# ADR 0002: Pipeline de scraping em etapas

Status: aceito

## Contexto

A coleta envolve fontes com níveis diferentes de estrutura:

- CNPq: tabela relativamente estruturada;
- Lattes preview: busca e identificação de currículo;
- Lattes completo: página rica e mais custosa;
- inferências: campos semânticos úteis para dashboard e chat.

## Decisão

Separar o scraping em etapas:

```txt
CNPq scholarships
-> Lattes preview
-> Lattes completo
-> inferências
-> promoção para current.json
```

Cada etapa gera uma pasta timestampada e artefatos próprios.

## Justificativa

Separar as etapas reduz acoplamento, facilita teste incremental e permite revisar ambiguidades antes de baixar/enriquecer tudo.

Também torna possível executar apenas uma parte do pipeline quando necessário.

## Consequências

Vantagens:

- maior auditabilidade;
- fácil depuração;
- possibilidade de retry técnico;
- revisão manual/agente em pontos específicos.

Limitações:

- mais arquivos e pastas;
- mais comandos e documentação;
- necessidade de `current.json` para apontar a versão ativa.

