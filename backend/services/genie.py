import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

DATABRICKS_HOST = os.getenv("DATABRICKS_HOST", "").rstrip("/")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN", "")
GENIE_SPACE_ID = os.getenv("GENIE_SPACE_ID", "").strip()

HEADERS = {
    "Authorization": f"Bearer {DATABRICKS_TOKEN}",
    "Content-Type": "application/json",
}

BASE_URL = f"{DATABRICKS_HOST}/api/2.0/genie/spaces/{GENIE_SPACE_ID}"

POLL_INTERVAL = 2
POLL_TIMEOUT = 300


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


def ask_genie(question: str, conversation_id: str | None) -> tuple[str, str]:
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
    answer = extract_response_text(final)

    return answer, conversation_id