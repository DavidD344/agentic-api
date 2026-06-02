# ADR 0003: Chat com File Search e consulta estruturada

Status: aceito

## Contexto

O sistema precisa responder perguntas em linguagem natural sobre o dataset.

Inicialmente foi considerado enviar o corpus inteiro para a LLM, mas isso estoura limite de contexto e é caro. File Search resolve perguntas semânticas, mas não garante contagens globais exatas.

## Decisão

Usar arquitetura híbrida:

```txt
perguntas semânticas -> OpenAI File Search / Vector Store
perguntas quantitativas -> consulta estruturada no JSON local
```

O corpus de busca é enviado uma vez ao Vector Store. Em cada pergunta, o chat usa o `vector_store_id` em vez de reenviar o arquivo inteiro.

## Justificativa

File Search é adequado para recuperar perfis relacionados a temas, áreas e descrições.

Consultas estruturadas são mais confiáveis para perguntas como:

```txt
quantas pessoas são da USP?
quantas pessoas por região?
quantas pessoas da USP são PQ-1?
```

## Consequências

Vantagens:

- menor custo por pergunta;
- evita estouro de contexto;
- melhora precisão de contagens;
- preserva capacidade semântica do chat.

Limitações:

- exige roteamento de pergunta;
- algumas perguntas mistas precisam validação da LLM;
- o Vector Store precisa ser sincronizado quando a base muda.

