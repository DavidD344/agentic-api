# Demo com ngrok

Para a apresentacao:

1. Rode `./DEMO_STARTUP.sh`.
2. Se pedir o token do ngrok, cole o authtoken uma vez.
3. Espere aparecer `LINK PARA MANDAR AO PROFESSOR`.
4. Envie esse link e deixe a janela aberta.
5. Para encerrar tudo, aperte `Ctrl+C` nessa janela.

O script faz automaticamente:

- sobe o backend em `localhost:8001`;
- abre ngrok para backend e frontend;
- grava a URL publica do backend em `frontend/.env`;
- sobe o frontend em `localhost:3000`;
- mostra a URL publica do frontend.

Logs ficam em `.demo/backend.log`, `.demo/frontend.log` e `.demo/ngrok.log`.
