import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.scrapers.inference_scrape import save_outputs


DEFAULT_MODEL = "gpt-5.4-nano"
DEFAULT_BATCH_SIZE = 25
DEFAULT_MIN_APPLY_CONFIDENCE = 0.68


SYSTEM_PROMPT = """
Você revisa somente casos em que sex_inferred está unknown.

Objetivo:
inferir male, female ou unknown para análise estatística agregada de um dataset acadêmico.

Regras:
- Use principalmente o nome completo. Use também lattes_name e o resumo público quando existirem.
- Só retorne unknown se for quase impossível inferir pelo nome completo, se o nome for realmente ambíguo/incomum, ou se houver evidência conflitante.
- Marcadores textuais claros no resumo têm prioridade:
  professor/doutor/pesquisador/graduado -> male
  professora/doutora/pesquisadora/graduada -> female
- Quando não houver marcador textual, use primeiro nome comum em português ou internacional como evidência suficiente se ele for fortemente associado a male ou female.
- Não retorne unknown apenas porque não há marcador textual se o primeiro nome for comum e fortemente associado a um sexo.
- Para nomes comuns masculinos como Afonso, Alex, Alisson, Aluizio, Anselmo, Breno, Bruno, Cleber, Cristiano, Daniel, Diego, Eduardo, Estevão, Fábio, Fernando, Geraldo, Guilherme, José, Julio, Leandro, Luís, Marcelo, Márcio, Marcos, Marcus, Pedro, Victor, retorne male se não houver conflito.
- Para nomes comuns femininos como Claudia, Dianne, Genaina, Graçaliz, Mirella, Tatiane, retorne female se não houver conflito.
- Não force caso ambíguo, iniciais, nome incomum ou evidência conflitante.
- Retorne unknown quando não houver segurança.
- Não explique ética, não escreva texto fora do JSON.

Retorne JSON válido exatamente neste formato:
{
  "items": [
    {
      "index": 0,
      "sex_inferred": "male|female|unknown",
      "confidence": 0.0,
      "reason": "motivo curto"
    }
  ]
}
""".strip()


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def current_inference_run() -> Path:
    current = read_json(Path("scrape_results") / "current.json")
    run_dir = current.get("inference_run_dir")

    if not run_dir:
        raise FileNotFoundError("current.json não aponta para inference_run_dir")

    return Path(run_dir)


def semantic_field(row: dict, field_id: str) -> dict:
    return (row.get("semantic_profile") or {}).get(field_id) or {}


def sex_value(row: dict) -> str:
    return semantic_field(row, "sex_inferred").get("value") or "unknown"


def parse_json_object(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)

        if not match:
            raise

        return json.loads(match.group(0))


def profile_payload(row: dict, index: int) -> dict:
    return {
        "index": index,
        "name": row.get("name"),
        "lattes_name": row.get("lattes_name"),
        "institution": row.get("institution"),
        "summary": (row.get("summary") or "")[:1800],
        "current_sex_field": semantic_field(row, "sex_inferred"),
    }


def batches(items: list, size: int):
    for start in range(0, len(items), size):
        yield start, items[start : start + size]


def review_batch(client: OpenAI, model: str, payload: list[dict]) -> dict:
    response = client.responses.create(
        model=model,
        max_output_tokens=2500,
        input=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": json.dumps({"profiles": payload}, ensure_ascii=False),
            },
        ],
    )

    result = parse_json_object(response.output_text)
    result["_response_id"] = response.id
    result["_model"] = model

    return result


def apply_decision(row: dict, decision: dict, min_apply_confidence: float) -> dict:
    semantic_profile = row.setdefault("semantic_profile", {})
    sex_field = semantic_profile.setdefault("sex_inferred", {})
    old_value = sex_field.get("value") or "unknown"
    value = decision.get("sex_inferred")
    confidence = float(decision.get("confidence") or 0)

    if value not in {"male", "female", "unknown"}:
        value = "unknown"

    applied = value in {"male", "female"} and confidence >= min_apply_confidence

    if applied:
        sex_field["value"] = value
        sex_field["confidence"] = confidence
        sex_field["source"] = "llm:unknown_sex_review"
        sex_field["needs_review"] = confidence < 0.85
        sex_field["reason"] = decision.get("reason") or "Revisado por LLM usando nome e resumo Lattes."
    else:
        sex_field["value"] = "unknown"
        sex_field["confidence"] = max(confidence, float(sex_field.get("confidence") or 0))
        sex_field["source"] = "llm:unknown_sex_review"
        sex_field["needs_review"] = True
        sex_field["reason"] = decision.get("reason") or "LLM manteve unknown."

    return {
        "name": row.get("name"),
        "old_value": old_value,
        "new_value": sex_field["value"],
        "confidence": sex_field["confidence"],
        "applied": applied,
        "needs_review": sex_field["needs_review"],
        "reason": sex_field["reason"],
    }


def review_unknown_sex(run_dir: Path, model: str, batch_size: int, min_apply_confidence: float) -> dict:
    profiles_path = run_dir / "profiles_with_inferences.json"
    summary_path = run_dir / "summary.json"
    llm_path = run_dir / "inference_llm.json"

    rows = read_json(profiles_path)
    summary = read_json(summary_path)
    llm_log = read_json(llm_path) if llm_path.exists() else {"decisions": []}
    unknown_indexes = [
        index
        for index, row in enumerate(rows)
        if sex_value(row) == "unknown"
    ]
    client = OpenAI(timeout=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "120")))
    decisions_log = []
    changes = []
    errors = []

    for _start, indexes in batches(unknown_indexes, batch_size):
        payload = [profile_payload(rows[index], index) for index in indexes]

        try:
            result = review_batch(client, model, payload)
            decisions = result.get("items") or []
            decisions_by_index = {
                int(decision.get("index")): decision
                for decision in decisions
                if str(decision.get("index", "")).isdigit()
            }
            batch_changes = []

            for index in indexes:
                decision = decisions_by_index.get(index)

                if not decision:
                    continue

                change = apply_decision(rows[index], decision, min_apply_confidence)
                changes.append(change)
                batch_changes.append(change)

            decisions_log.append(
                {
                    "model": result.get("_model"),
                    "response_id": result.get("_response_id"),
                    "indexes": indexes,
                    "changes": batch_changes,
                }
            )
        except Exception as error:
            errors.append(
                {
                    "indexes": indexes,
                    "error": str(error),
                }
            )

    save_outputs(
        run_dir,
        Path(summary["source_json"]),
        rows,
        llm_log.get("decisions") or [],
    )

    remaining_unknown = sum(1 for row in rows if sex_value(row) == "unknown")
    applied = sum(1 for change in changes if change["applied"])
    log = {
        "model": model,
        "batch_size": batch_size,
        "min_apply_confidence": min_apply_confidence,
        "initial_unknown": len(unknown_indexes),
        "applied": applied,
        "remaining_unknown": remaining_unknown,
        "errors_count": len(errors),
        "errors": errors,
        "changes": changes,
        "llm_batches": decisions_log,
    }
    write_json(run_dir / "sex_unknown_review_log.json", log)

    return log


if __name__ == "__main__":
    load_dotenv(dotenv_path=".env")

    if not os.getenv("OPENAI_API_KEY"):
        print("OPENAI_API_KEY não configurada.")
        raise SystemExit(1)

    run_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else current_inference_run()
    model = os.getenv("SEX_REVIEW_MODEL", DEFAULT_MODEL)
    batch_size = int(os.getenv("SEX_REVIEW_BATCH_SIZE", str(DEFAULT_BATCH_SIZE)))
    min_apply_confidence = float(os.getenv("SEX_REVIEW_MIN_APPLY_CONFIDENCE", str(DEFAULT_MIN_APPLY_CONFIDENCE)))
    result = review_unknown_sex(run_dir, model, batch_size, min_apply_confidence)

    print(json.dumps(result, ensure_ascii=False, indent=2))
