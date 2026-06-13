import os
import time
import json
import requests
from dotenv import load_dotenv

load_dotenv()

DATABRICKS_HOST      = os.getenv("DATABRICKS_HOST", "").rstrip("/")
DATABRICKS_TOKEN     = os.getenv("DATABRICKS_TOKEN", "")
GENIE_SPACE_ID       = os.getenv("GENIE_SPACE_ID", "").strip()
DATABRICKS_WAREHOUSE = os.getenv("DATABRICKS_WAREHOUSE_ID", "").strip()

HEADERS = {
    "Authorization": f"Bearer {DATABRICKS_TOKEN}",
    "Content-Type": "application/json",
}

BASE_URL     = f"{DATABRICKS_HOST}/api/2.0/genie/spaces/{GENIE_SPACE_ID}"
SQL_BASE_URL = f"{DATABRICKS_HOST}/api/2.0/sql/statements"

POLL_INTERVAL = 2
POLL_TIMEOUT  = 300


# ──────────────────────────────────────────────
# Genie: conversa
# ──────────────────────────────────────────────

def start_conversation(question: str) -> dict:
    url = f"{BASE_URL}/start-conversation"
    response = requests.post(url, headers=HEADERS, json={"content": question})
    response.raise_for_status()
    return response.json()


def send_message(conversation_id: str, question: str) -> dict:
    url = f"{BASE_URL}/conversations/{conversation_id}/messages"
    response = requests.post(url, headers=HEADERS, json={"content": question})
    response.raise_for_status()
    return response.json()


def poll_message(conversation_id: str, message_id: str) -> dict:
    url = f"{BASE_URL}/conversations/{conversation_id}/messages/{message_id}"
    elapsed = 0

    while elapsed < POLL_TIMEOUT:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        if data.get("status") in ("COMPLETED", "FAILED", "CANCELLED"):
            return data

        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL

    raise TimeoutError(f"Resposta nao recebida em {POLL_TIMEOUT} segundos.")


# ──────────────────────────────────────────────
# Extração de texto e SQL dos attachments
# ──────────────────────────────────────────────

def extract_response_text(message_data: dict) -> str:
    if message_data.get("status") == "FAILED":
        error = message_data.get("error") or "Erro desconhecido"
        return f"Erro: {error}"

    attachments = message_data.get("attachments") or []

    for attachment in attachments:
        text_block = attachment.get("text")
        if text_block:
            content = text_block.get("content", "")
            if content:
                return content

    return "Sem conteudo na resposta."


def extract_query_sql(message_data: dict) -> str | None:
    """Extrai a SQL gerada pelo Genie no attachment 'query', se existir."""
    attachments = message_data.get("attachments") or []

    for attachment in attachments:
        query_block = attachment.get("query")
        if query_block:
            sql = query_block.get("query", "").strip()
            if sql:
                return sql

    return None


# ──────────────────────────────────────────────
# SQL Statement API — executa query e retorna linhas
# ──────────────────────────────────────────────

def run_sql(sql: str, limit: int = 50) -> list[dict]:
    """Executa uma SQL via Databricks Statement API e retorna lista de dicts."""
    if not DATABRICKS_WAREHOUSE:
        raise ValueError(
            "DATABRICKS_WAREHOUSE_ID nao configurado no .env. "
            "Necessario para o modo grafico."
        )

    # Limita resultado para nao sobrecarregar o front
    bounded_sql = f"SELECT * FROM ({sql.rstrip(';').strip()}) AS _q LIMIT {limit}"

    payload = {
        "statement": bounded_sql,
        "warehouse_id": DATABRICKS_WAREHOUSE,
        "wait_timeout": "30s",  # aguarda sincrono ate 30s
        "on_wait_timeout": "CANCEL",
    }

    response = requests.post(SQL_BASE_URL, headers=HEADERS, json=payload)
    response.raise_for_status()
    data = response.json()

    # Aguarda conclusao se ainda estiver pendente
    statement_id = data.get("statement_id")
    status = data.get("status", {}).get("state")

    elapsed = 0
    while status in ("PENDING", "RUNNING") and elapsed < POLL_TIMEOUT:
        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL
        r = requests.get(f"{SQL_BASE_URL}/{statement_id}", headers=HEADERS)
        r.raise_for_status()
        data = r.json()
        status = data.get("status", {}).get("state")

    if status != "SUCCEEDED":
        error = data.get("status", {}).get("error", {}).get("message", "Erro desconhecido")
        raise RuntimeError(f"SQL falhou ({status}): {error}")

    # Monta lista de dicts a partir de columns + data_array
    result = data.get("result", {})
    schema = data.get("manifest", {}).get("schema", {}).get("columns", [])
    columns = [col["name"] for col in schema]
    rows = result.get("data_array") or []

    return [dict(zip(columns, row)) for row in rows]


def rows_to_chart_json(rows: list[dict]) -> str:
    """
    Converte linhas tabulares em JSON para o front renderizar com Recharts.

    Heuristica:
    - Primeira coluna string/date = 'name'
    - Demais colunas numéricas = métricas
    - chartType: pie se uma metrica + <= 10 linhas, bar caso contrário
    """
    if not rows:
        return json.dumps({"chartType": "bar", "data": []})

    keys = list(rows[0].keys())

    # Identifica coluna de categoria (primeira nao-numerica)
    name_key = keys[0]
    metric_keys = [k for k in keys[1:] if k != name_key]

    # Converte valores numericos
    data = []
    for row in rows:
        entry: dict = {"name": str(row.get(name_key, ""))}
        for mk in metric_keys:
            raw = row.get(mk)
            try:
                entry[mk] = float(raw) if raw is not None else 0
            except (ValueError, TypeError):
                entry[mk] = 0
        data.append(entry)

    # Escolhe tipo de grafico
    if len(metric_keys) == 1 and len(data) <= 10:
        chart_type = "pie"
    elif len(metric_keys) > 1:
        chart_type = "bar"
    else:
        chart_type = "bar"

    return json.dumps({"chartType": chart_type, "data": data}, ensure_ascii=False)


# ──────────────────────────────────────────────
# Ponto de entrada principal
# ──────────────────────────────────────────────

def ask_genie(
    question: str,
    conversation_id: str | None,
    mode: str = "normal",
) -> tuple[str, str]:
    """
    Envia pergunta ao Genie e retorna (resposta, conversation_id).
    Quando mode='chart', extrai a SQL gerada e executa para obter dados tabulares.
    """
    if conversation_id is None:
        result = start_conversation(question)
        conversation_id = result.get("conversation_id") or result.get("id")
        msg = result.get("message", result)
    else:
        msg = send_message(conversation_id, question)

    message_id = msg.get("id")
    if not message_id:
        raise ValueError("Nao foi possivel obter o message_id da resposta.")

    final = poll_message(conversation_id, message_id)

    if mode == "chart":
        sql = extract_query_sql(final)
        if sql:
            rows = run_sql(sql)
            answer = rows_to_chart_json(rows)
        else:
            # Fallback: sem SQL disponivel, retorna texto normal
            answer = extract_response_text(final)
    else:
        answer = extract_response_text(final)

    return answer, conversation_id
