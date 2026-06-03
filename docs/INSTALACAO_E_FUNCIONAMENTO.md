# Instalação E Funcionamento

Guia curto para rodar o projeto localmente e apresentar a aplicação.

## Pré-Requisitos

```txt
uv
Python compatível com .python-version
Node/npm
Chromium
ngrok, se quiser expor a demo publicamente
```

No Arch/Manjaro:

```bash
sudo pacman -S chromium
```

## Variáveis De Ambiente

Na raiz do projeto, configure `.env`:

```txt
OPENAI_API_KEY=sua-chave
LATTES_DISABLE_LLM=0
CHAT_MODEL=gpt-5.4
CHAT_PLANNER_MODEL=gpt-5.4-mini
CHAT_TITLE_MODEL=gpt-5.4-nano
CHAT_DISABLE_STRUCTURED_QUERY=0
```

No frontend, configure `frontend/.env`:

```txt
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Instalar Dependências

Backend:

```bash
UV_CACHE_DIR=/tmp/uv-cache uv sync
```

Frontend:

```bash
cd frontend
npm install
```

## Rodar Localmente

Backend:

```bash
UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload --port 8001
```

Frontend:

```bash
cd frontend
npm run dev -- --port 3000
```

Abra:

```txt
http://localhost:3000
```

Login de demonstração:

```txt
admin@admin.com / admin
```

## Demo Com Ngrok

Para apresentação, rode:

```bash
./DEMO_STARTUP.sh
```

O script:

- sobe backend em `localhost:8001`;
- abre ngrok para backend e frontend;
- grava a URL pública do backend em `frontend/.env`;
- sobe o frontend em `localhost:3000`;
- mostra o link público do frontend para enviar ao professor.

## Base Ativa

A aplicação usa:

```txt
scrape_results/current.json
```

Esse manifesto aponta para a execução ativa da pipeline, incluindo perfis enriquecidos, inferências e arquivos usados pelo dashboard/chat.

## Pipeline

A pipeline completa fica em:

```txt
app/scrapers/pipeline_scrape.py
```

Ela executa, em alto nível:

```txt
coleta CNPq
  -> preview Lattes
  -> currículo completo
  -> inferências
  -> normalização
  -> corpus de busca/chat
  -> promoção para current.json
```

No frontend há um botão de pipeline em Configurações, mas ele fica bloqueado para evitar execução acidental.
