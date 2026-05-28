# Scraping Decisions

Este arquivo registra as decisões do scraping em formato leve. Ele não é um ADR formal ainda, mas já guarda o contexto, a decisão e a justificativa para virar ADR depois.

## 1. Scraping como feature isolada

Status: aceito

Decisão:

Manter scraping em `app/scrapers/`, separado de routers, services e modelos HTTP.

Motivo:

Scraping tem acoplamento forte com HTML externo, navegador, timeouts e heurísticas de matching. Se isso ficar dentro de rota HTTP, a API passa a conhecer detalhes de site externo e fica difícil testar.

Consequência:

O código pode evoluir para:

```txt
router -> service -> scraper
```

sem reescrever a coleta. O scraper segue testável por linha de comando, e a API pode ser adicionada depois com menos risco.

## 2. Rodar primeiro por CLI, não por endpoint

Status: aceito

Decisão:

Validar o pipeline por comandos locais antes de expor endpoint.

Motivo:

O scraping ainda está em fase exploratória. Rodar por CLI permite:

- testar uma pessoa;
- testar dez linhas;
- rodar lote completo;
- salvar artefatos intermediários;
- repetir sem depender de frontend;
- depurar HTML bruto.

Consequência:

A API ainda não é a interface principal do scraping. Isso é temporário e intencional.

## 3. Cada execução cria uma pasta timestampada

Status: aceito

Decisão:

Salvar cada run em:

```txt
scrape_results/<timestamp>/
scrape_results/lattes_preview/<timestamp>/
scrape_results/lattes_full/<timestamp>/
```

Motivo:

Scraping não é determinístico. O site pode responder diferente, falhar em horários específicos ou mudar HTML. Se sobrescrevermos arquivos, perdemos histórico e capacidade de comparação.

Consequência:

O diretório de resultados cresce, mas cada execução fica auditável. Depois podemos criar política de limpeza ou promover apenas runs validados para uma área `data/curated/`.

## 4. Separar CNPq scholarships de Lattes

Status: aceito

Decisão:

Usar `simple_scrape.py` para coletar a tabela CNPq e `lattes_scrape.py` para enriquecer com Lattes.

Motivo:

A tabela CNPq já é relativamente estruturada. O Lattes exige busca, matching, revisão e currículo completo. Misturar os dois deixaria um script único grande e mais difícil de depurar.

Consequência:

O CSV `scholarships.csv` vira a fronteira entre a fonte CNPq e o enriquecimento Lattes.

## 5. Lattes em duas etapas: preview e completo

Status: aceito

Decisão:

Primeiro buscar preview para descobrir `lattes_code`. Só depois baixar currículo completo.

Motivo:

Baixar currículo completo antes de confirmar identidade aumenta risco de dado errado e desperdiça tempo. O preview é suficiente para classificar boa parte dos casos:

```txt
matched
ambiguous
not_found
error
```

Consequência:

O processo tem mais uma etapa, mas é mais seguro. O currículo completo só roda para registros com match confiável.

## 6. Preferir revisão a falso positivo

Status: aceito

Decisão:

Quando houver mais de um candidato e a instituição não resolver com segurança, marcar como `ambiguous`.

Motivo:

Um currículo errado contamina a base. Um caso ambíguo pode ser resolvido depois por humano ou agente. Para este projeto, falso positivo é pior do que falso negativo.

Consequência:

Alguns registros exigem revisão manual. Isso é esperado e desejável.

## 7. `review_queue.csv` como contrato de revisão

Status: aceito

Decisão:

Gerar `review_queue.csv` com os casos que não ficaram `matched`.

Motivo:

CSV é simples de abrir, versionar, editar e passar para um agente. Ele também funciona bem como fronteira entre automação e revisão.

Consequência:

A revisão pode ser feita manualmente em planilha ou por um agente que leia `review_queue.csv` e escreva `review_resolved.csv`.

## 8. Merge separado da revisão

Status: aceito

Decisão:

Criar comando separado:

```bash
uv run python app/scrapers/lattes_scrape.py resolve-review <lattes_profiles.csv> <review_resolved.csv>
```

Motivo:

O preview não deve parar esperando decisão humana. Ele roda tudo que consegue, gera fila de revisão e termina. A revisão acontece depois, em outro momento.

Consequência:

O fluxo fica em comandos separados:

```txt
preview -> review_resolved.csv -> resolve-review -> enrich-full
```

## 9. Retry automático só para erro técnico

Status: aceito

Decisão:

Reexecutar automaticamente casos com `match_status=error`, até 5 vezes.

Motivo:

Erro técnico costuma ser instabilidade temporária do site ou do navegador. Já `ambiguous` e `not_found` são problemas semânticos e não devem ser resolvidos com retry cego.

Consequência:

O script reduz falhas transitórias sem esconder incertezas reais.

## 10. Guardar HTML bruto

Status: aceito

Decisão:

Salvar HTML e texto bruto em `raw/` quando possível.

Motivo:

Quando o parser falha ou um match parece estranho, o HTML bruto permite investigar sem repetir a requisição. Isso também ajuda a criar novos parsers estruturados.

Consequência:

Os runs ficam maiores em disco, mas muito mais auditáveis.

## 11. CSV e JSON juntos

Status: aceito

Decisão:

Salvar saídas tabulares em CSV e saídas completas/estruturadas em JSON.

Motivo:

CSV é bom para inspeção e planilhas. JSON preserva listas, objetos e dados aninhados, como links externos e candidatos.

Consequência:

Algumas informações aparecem simplificadas no CSV e completas no JSON.

## 12. Playwright para navegação, BeautifulSoup para parsing

Status: aceito

Decisão:

Usar Playwright para abrir páginas e BeautifulSoup para extrair informação do HTML.

Motivo:

Playwright lida melhor com páginas que dependem de navegador real. BeautifulSoup deixa o parsing mais direto e previsível depois que o HTML já foi carregado.

Consequência:

O scraper depende de Chromium instalado, mas fica mais robusto para páginas dinâmicas.

## 13. Google Scholar em standby

Status: aceito por enquanto

Decisão:

Não priorizar Google Scholar agora.

Motivo:

O Scholar tende a bloquear automação e redirecionar para login/captcha. O Lattes é mais alinhado ao dado brasileiro e já fornece vínculo, resumo, identificador e currículo completo.

Consequência:

O enriquecimento segue primeiro pelo Lattes. Scholar pode voltar depois como fonte complementar, não como fonte principal.

## 14. Coletar paginação antes de decidir ambiguidade

Status: aceito

Decisão:

Quando o Lattes retorna resultados paginados, o scraper deve navegar pelas páginas, juntar os candidatos e remover duplicatas antes de decidir `matched` ou `ambiguous`.

Motivo:

A pessoa correta pode aparecer em uma página posterior. Se o scraper decidir usando apenas a primeira página, ele pode marcar um caso como ambíguo sem ter visto todos os candidatos relevantes.

Consequência:

O preview fica um pouco mais lento em nomes comuns, mas mais correto. No run `scrape_results/lattes_preview/20260526_191349/`, essa mudança reduziu os ambíguos de 6 para 4.

Artefatos salvos para auditoria:

```txt
raw/<nome>/search_pages.json
raw/<nome>/search_result.html
raw/<nome>/search_result_page_2.html
raw/<nome>/candidates.json
```

## 15. Usar LLM como revisão automática conservadora

Status: aceito

Decisão:

Depois do preview e dos retries técnicos, os casos `ambiguous` podem ser enviados para uma LLM, desde que `OPENAI_API_KEY` esteja configurada no ambiente.

Motivo:

Alguns casos ambíguos têm evidência textual suficiente no resumo e nos links externos para serem resolvidos automaticamente. Um humano ou uma LLM consegue perceber que o resumo cita a instituição esperada, mesmo quando a heurística simples não resolveu.

O nível da bolsa CNPq é enviado para a LLM como contexto, mas não deve ser tratado como exigência de comprovação no preview do Lattes. O preview público nem sempre menciona bolsa vigente. Se nome, instituição e área acadêmica forem fortemente compatíveis, a LLM pode marcar `matched` mesmo sem menção explícita à bolsa.

Regra de segurança:

A LLM não decide livremente. O script só aceita `matched` quando:

```txt
status=matched
lattes_code escolhido existe na lista de candidatos
confidence >= 0.85
```

Se a LLM não tiver certeza, responder JSON inválido, escolher código inexistente ou a API falhar, o caso continua `ambiguous`. Isso não quebra o run.

Consequência:

A LLM reduz trabalho manual, mas continua sendo uma etapa auxiliar. A fonte de verdade ainda é o conjunto de candidatos coletado do Lattes.

No run `scrape_results/lattes_preview/20260526_194859/`, a LLM revisou 4 casos ambíguos, resolveu 3 com confiança acima do limite e deixou 1 como `ambiguous`.

Artefato salvo:

```txt
llm_review.json
```

## 16. Próxima decisão pendente: destino final dos dados

Status: pendente

Opções:

```txt
CSV curado
SQLite
Postgres
JSONL
Parquet
API + banco
```

Critério:

Se o objetivo for análise local, CSV/Parquet pode bastar. Se o objetivo for produto/API, Postgres ou SQLite entram melhor. A decisão deve vir depois que o parser do currículo completo estabilizar.
