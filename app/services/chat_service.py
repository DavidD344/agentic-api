import os

from dotenv import load_dotenv
from openai import OpenAI

from app.services.chat_storage_service import append_message, get_session
from app.services.openai_vector_store_service import require_vector_store_id


DEFAULT_CHAT_MODEL = "gpt-5.4-mini"
SYSTEM_PROMPT = """
Você é o agente de consulta do dataset de bolsistas PQ em Ciência da Computação.
Responda em português, de forma objetiva e útil para um professor analisar bolsas,
áreas de pesquisa, instituições, distribuição regional, diversidade e possíveis
colaborações.

Use a base de arquivos via file_search sempre que a pergunta depender dos dados.
Não invente dados ausentes. Quando houver incerteza, diga que a informação precisa
ser conferida ou que depende das inferências do dataset.
Quando listar pessoas, inclua nome, instituição e, quando útil, nível da bolsa.
""".strip()


def get_client() -> OpenAI:
    load_dotenv()

    return OpenAI(
        timeout=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "120")),
    )


def history_for_model(session: dict, limit: int = 8) -> list[dict]:
    messages = session.get("messages") or []
    recent = messages[-limit:]

    return [
        {
            "role": message["role"],
            "content": message["content"],
        }
        for message in recent
        if message.get("role") in {"user", "assistant"}
    ]


def response_annotations(response) -> list[dict]:
    annotations = []

    for item in getattr(response, "output", []) or []:
        for content in getattr(item, "content", []) or []:
            for annotation in getattr(content, "annotations", []) or []:
                annotations.append(annotation.model_dump() if hasattr(annotation, "model_dump") else dict(annotation))

    return annotations


def ask_chat(session_id: str, question: str, max_num_results: int = 8) -> dict:
    vector_store_id = require_vector_store_id()
    session = get_session(session_id)
    client = get_client()
    model = os.getenv("CHAT_MODEL", DEFAULT_CHAT_MODEL)

    append_message(session_id, "user", question)
    session = get_session(session_id)

    input_messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        *history_for_model(session),
    ]

    response = client.responses.create(
        model=model,
        input=input_messages,
        tools=[
            {
                "type": "file_search",
                "vector_store_ids": [vector_store_id],
                "max_num_results": max_num_results,
            }
        ],
    )

    answer = response.output_text
    metadata = {
        "model": model,
        "vector_store_id": vector_store_id,
        "max_num_results": max_num_results,
        "response_id": response.id,
        "annotations": response_annotations(response),
    }
    assistant_message = append_message(session_id, "assistant", answer, metadata)

    return {
        "session_id": session_id,
        "answer": answer,
        "message": assistant_message,
        "metadata": metadata,
    }

