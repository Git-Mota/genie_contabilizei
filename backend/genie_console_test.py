"""
Utilitario de teste via console.
Reutiliza a mesma logica do backend (services/genie.py).

Como usar:
    cd backend
    python genie_console_test.py
"""

import sys
import os

# Permite rodar direto da pasta backend sem instalar o pacote
sys.path.insert(0, os.path.dirname(__file__))

from services.genie import ask_genie, DATABRICKS_HOST, GENIE_SPACE_ID


def run_console():
    print("=" * 55)
    print("  Databricks Genie - Teste via Console")
    print("=" * 55)
    print(f"  Workspace : {DATABRICKS_HOST}")
    print(f"  Space ID  : {GENIE_SPACE_ID}")
    print("=" * 55)
    print("  Comandos: 'nova' = nova conversa | 'sair' = encerrar")
    print("=" * 55)
    print()

    conversation_id = None

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
            print("[Nova conversa iniciada]\n")
            continue

        try:
            print("Aguardando resposta...", flush=True)
            answer, conversation_id = ask_genie(question, conversation_id)
            print(f"\nGenie: {answer}\n")
            print("-" * 55)
        except Exception as e:
            print(f"\n[ERRO] {e}\n")


if __name__ == "__main__":
    run_console()
