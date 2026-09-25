# Persistência acadêmica (SQLite)

O trabalho usa **SQLite** (`DATABASE_URL=sqlite:///./padaria.db`) de propósito: um arquivo local, sem servidor, fácil de entregar e de inspecionar.

Postgres (Supabase, Railway, Neon) só vale se o disco do host **apagar o arquivo** a cada deploy. Enquanto o `padaria.db` ficar no mesmo diretório da API, não há ganho acadêmico em migrar.

## Backup

Alembic ficaria teatro neste tamanho de schema. O caminho honesto é copiar o arquivo:

```bash
cd backend
python -m app.backup
# ou: python scripts/backup_sqlite.py
```

A cópia vai para `backend/backups/padaria-AAAAMMDD-HHMMSS.db`. Também funciona um `cp padaria.db backups/padaria-manual.db`.

## Schema e senha

`create_all` cria tabelas novas; não altera as antigas. Na subida, a API adiciona `config.senha_provisoria` se a coluna faltar (SQLite). A senha em si continua no hash bcrypt da coluna física `pin_hash` — o login é usuário + senha, não PIN.

Seed inicial: `ADMIN_USUARIO_PADRAO` + `ADMIN_SENHA_PADRAO` e `senha_provisoria=true`. Depois da primeira troca em Configurações, a flag vira `false`.
