# ADR 0006: Autenticação hardcoded para demonstração

Status: aceito temporariamente

## Contexto

O frontend reaproveitado já espera fluxo de login com token. Para a apresentação, não há necessidade de autenticação real com cadastro, banco ou refresh token.

## Decisão

Criar rota:

```txt
POST /login
```

com credenciais hardcoded:

```txt
admin@admin.com
admin
```

A resposta segue o contrato esperado pelo frontend e retorna um JWT demo decodável.

## Justificativa

Permite usar o frontend existente sem trazer o backend antigo nem implementar autenticação completa.

## Consequências

Vantagens:

- integração rápida;
- suficiente para demo local;
- mantém foco no dataset, dashboard e agentes.

Limitações:

- não é autenticação segura;
- não deve ir para produção;
- qualquer proteção real precisa ser implementada depois.

