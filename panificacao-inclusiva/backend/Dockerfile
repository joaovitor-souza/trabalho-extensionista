# ------------------------------------------------------------------------------
# Multi-stage Dockerfile para o Backend FastAPI
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS builder

WORKDIR /app

# Instala dependências de build essenciais para pacotes C/C++ se necessário
RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

WORKDIR /app

# Copia pacotes python instalados do builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copia o código da aplicação
COPY app ./app

# Cria diretório de uploads local e diretório para banco persistente
RUN mkdir -p /app/uploads /app/data

EXPOSE 8123

# Executa Uvicorn na porta 8123 (ou configurável via PORT)
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8123"]
