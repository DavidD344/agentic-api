#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$REPO_DIR/frontend"
DEMO_DIR="$REPO_DIR/.demo"
NGROK_CONFIG="$DEMO_DIR/ngrok.yml"
DEFAULT_NGROK_CONFIG="${HOME}/.config/ngrok/ngrok.yml"
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
NGROK_API="http://127.0.0.1:4040/api/tunnels"

BACKEND_PID=""
FRONTEND_PID=""
NGROK_PID=""

cleanup() {
  echo
  echo "Encerrando demo..."
  if [ -n "$NGROK_PID" ]; then kill "$NGROK_PID" 2>/dev/null || true; fi
  if [ -n "$FRONTEND_PID" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  if [ -n "$BACKEND_PID" ]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Comando nao encontrado: $1"
    echo "Instale esse comando e rode o atalho de novo."
    exit 1
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local tries="${3:-60}"

  echo "Aguardando $label..."
  for _ in $(seq 1 "$tries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$label pronto."
      return 0
    fi
    sleep 1
  done

  echo "Nao consegui acessar $label em $url"
  return 1
}

get_tunnel_url() {
  local name="$1"
  curl -fsS "$NGROK_API" \
    | jq -r --arg name "$name" '.tunnels[] | select(.name == $name) | .public_url' \
    | head -n 1
}

copy_to_clipboard() {
  local text="$1"

  if command -v wl-copy >/dev/null 2>&1; then
    printf "%s" "$text" | wl-copy
    echo "Link copiado para a area de transferencia."
  elif command -v xclip >/dev/null 2>&1; then
    printf "%s" "$text" | xclip -selection clipboard
    echo "Link copiado para a area de transferencia."
  elif command -v xsel >/dev/null 2>&1; then
    printf "%s" "$text" | xsel --clipboard --input
    echo "Link copiado para a area de transferencia."
  fi
}

trap cleanup EXIT INT TERM

cd "$REPO_DIR"

require_command curl
require_command jq
require_command ngrok
require_command npm
require_command uv

if [ ! -f "$DEFAULT_NGROK_CONFIG" ] || ! grep -q "authtoken:" "$DEFAULT_NGROK_CONFIG"; then
  echo "Token do ngrok ainda nao configurado."
  echo "Cole o authtoken do painel do ngrok. Ele sera salvo em ~/.config/ngrok/ngrok.yml"
  read -rsp "NGROK_AUTHTOKEN: " NGROK_AUTHTOKEN
  echo
  if [ -z "$NGROK_AUTHTOKEN" ]; then
    echo "Token vazio. Abrindo cancelado."
    exit 1
  fi
  ngrok config add-authtoken "$NGROK_AUTHTOKEN"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Dependencias do frontend nao encontradas. Rodando npm install..."
  (cd "$FRONTEND_DIR" && npm install)
fi

echo "Subindo backend em http://localhost:${BACKEND_PORT} ..."
UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload --port "$BACKEND_PORT" > "$DEMO_DIR/backend.log" 2>&1 &
BACKEND_PID="$!"
wait_for_url "http://127.0.0.1:${BACKEND_PORT}/" "backend"

echo "Subindo ngrok para frontend e backend..."
ngrok start --config "$DEFAULT_NGROK_CONFIG" --config "$NGROK_CONFIG" --all --log "$DEMO_DIR/ngrok.log" > /dev/null 2>&1 &
NGROK_PID="$!"
wait_for_url "$NGROK_API" "ngrok"

BACKEND_PUBLIC_URL=""
FRONTEND_PUBLIC_URL=""
for _ in $(seq 1 30); do
  BACKEND_PUBLIC_URL="$(get_tunnel_url backend || true)"
  FRONTEND_PUBLIC_URL="$(get_tunnel_url frontend || true)"
  if [ -n "$BACKEND_PUBLIC_URL" ] && [ -n "$FRONTEND_PUBLIC_URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$BACKEND_PUBLIC_URL" ] || [ -z "$FRONTEND_PUBLIC_URL" ]; then
  echo "Nao consegui descobrir as URLs publicas do ngrok."
  echo "Veja o log em $DEMO_DIR/ngrok.log"
  exit 1
fi

touch "$FRONTEND_DIR/.env"
if grep -q "^NEXT_PUBLIC_API_URL=" "$FRONTEND_DIR/.env"; then
  sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=${BACKEND_PUBLIC_URL}|" "$FRONTEND_DIR/.env"
else
  printf "\nNEXT_PUBLIC_API_URL=%s\n" "$BACKEND_PUBLIC_URL" >> "$FRONTEND_DIR/.env"
fi

echo "Backend publico:  $BACKEND_PUBLIC_URL"
echo "Frontend publico: $FRONTEND_PUBLIC_URL"
echo
echo "Subindo frontend em http://localhost:${FRONTEND_PORT} ..."
(cd "$FRONTEND_DIR" && npm run dev -- --port "$FRONTEND_PORT") > "$DEMO_DIR/frontend.log" 2>&1 &
FRONTEND_PID="$!"
wait_for_url "http://127.0.0.1:${FRONTEND_PORT}/" "frontend"

copy_to_clipboard "$FRONTEND_PUBLIC_URL"

echo
echo "============================================================"
echo "LINK PARA MANDAR AO PROFESSOR:"
echo "$FRONTEND_PUBLIC_URL"
echo "============================================================"
echo
echo "Backend publico usado pelo front:"
echo "$BACKEND_PUBLIC_URL"
echo
echo "Deixe esta janela aberta durante a apresentacao."
echo "Para encerrar tudo, aperte Ctrl+C."

wait
