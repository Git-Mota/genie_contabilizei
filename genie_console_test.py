"""
Teste de integração com a API do Databricks Genie via console.

Como usar:
    1. Preencha as variáveis de configuração abaixo (ou use variáveis de ambiente)
    2. Execute: python genie_console_test.py
    3. Digite suas perguntas e pressione Enter
    4. Digite 'sair' para encerrar ou 'nova' para iniciar uma nova conversa
"""

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()  # carrega as variaveis do arquivo .env

# ─────────────────────────────────────────────
# CONFIGURACAO
# ─────────────────────────────────────────────
DATABRICKS_HOST = os.getenv("DATABRICKS_HOST", "https://SEU-WORKSPACE.azuredatabricks.net")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN", "seu-token-aqui")
GENIE_SPACE_ID = os.getenv("GENIE_SPACE_ID", "seu-space-id-aqui")

# Intervalo entre tentativas de polling (segundos)
POLL_INTERVAL = 2
# Tempo maximo de espera por resposta (segundos)
POLL_TIMEOUT = 120
# ─────────────────────────────────────────────

HEADERS = {
    "Authorization": f"Bearer {DATABRICKS_TOKEN}",
    "Content-Type": "application/json",
}

BASE_URL = f"{DATABRICKS_HOST}/api/2.0/genie/spaces/{GENIE_SPACE_ID}"


def start_conversation(question: str) -> dict:
    """Inicia uma nova conversa com a primeira pergunta."""
    url = f"{BASE_URL}/start-conversation"
    response = requests.post(url, headers=HEADERS, json={"content": question})
    response.raise_for_status()
    return response.json()


def send_message(conversation_id: str, question: str) -> dict:
    """Envia uma mensagem de acompanhamento em uma conversa existente."""
    url = f"{BASE_URL}/conversations/{conversation_id}/messages"
    response = requests.post(url, headers=HEADERS, json={"content": question})
    response.raise_for_status()
    return response.json()


def poll_message(conversation_id: str, message_id: str) -> dict:
    """Faz polling ate a mensagem ser processada (status COMPLETED ou FAILED)."""
    url = f"{BASE_URL}/conversations/{conversation_id}/messages/{message_id}"
    elapsed = 0

    print("Aguardando resposta", end="", flush=True)
    while elapsed < POLL_TIMEOUT:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        status = data.get("status")

        if status in ("COMPLETED", "FAILED", "CANCELLED"):
            print()  # nova linha apos os pontos
            return data

        print(".", end="", flush=True)
        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL

    print()
    raise TimeoutError(f"Resposta nao recebida em {POLL_TIMEOUT} segundos.")


def extract_response_text(message_data: dict) -> str:
    """Extrai o texto legivel da resposta do Genie."""
    if message_data.get("status") == "FAILED":
        error = message_data.get("error") or "Erro desconhecido"
        return f"[ERRO] {error}"

    attachments = message_data.get("attachments") or []
    parts = []

    for attachment in attachments:
        # Resposta em texto
        text_block = attachment.get("text")
        if text_block:
            content = text_block.get("content", "")
            if content:
                parts.append(content)

        # Query SQL gerada (informativo)
        query_block = attachment.get("query")
        if query_block:
            description = query_block.get("description", "")
            statement = query_block.get("query", "")
            if description:
                parts.append(f"[Descricao da query] {description}")
            if statement:
                parts.append(f"[SQL gerado]\n{statement}")

    return "\n\n".join(parts) if parts else "[Sem conteudo na resposta]"


def run_console():
    """Loop principal de interacao via console."""
    print("=" * 55)
    print("  Databricks Genie - Teste de API via Console")
    print("=" * 55)
    print(f"  Workspace : {DATABRICKS_HOST}")
    print(f"  Space ID  : {GENIE_SPACE_ID}")
    print("=" * 55)
    print("  Comandos: 'nova' = nova conversa | 'sair' = encerrar")
    print("=" * 55)
    print()

    conversation_id = None
    turn = 0

    while True:
        try:
            question = input("Voce: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nEncerrando.")
            break

        if not question:
            continue

        if question.lower() == "sair":
            print("Encerrando.")
            break

        if question.lower() == "nova":
            conversation_id = None
            turn = 0
            print("[Nova conversa iniciada]\n")
            continue

        try:
            # Primeira mensagem: inicia conversa. Demais: continua a mesma conversa.
            if conversation_id is None:
                result = start_conversation(question)
                conversation_id = result.get("conversation_id") or result.get("id")
                # A resposta inicial pode vir em "message" ou direto no objeto
                msg = result.get("message", result)
            else:
                msg = send_message(conversation_id, question)

            message_id = msg.get("id")
            if not message_id:
                print("[AVISO] Nao foi possivel obter o message_id da resposta.\n")
                continue

            # Aguarda processamento
            final = poll_message(conversation_id, message_id)
            answer = extract_response_text(final)

            turn += 1
            print(f"\nGenie: {answer}\n")
            print("-" * 55)

        except requests.HTTPError as e:
            print(f"\n[HTTP ERROR] {e.response.status_code}: {e.response.text}\n")
        except TimeoutError as e:
            print(f"\n[TIMEOUT] {e}\n")
        except Exception as e:
            print(f"\n[ERRO] {e}\n")


if __name__ == "__main__":
    run_console()