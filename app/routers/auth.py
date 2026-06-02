import base64
import json
import time

from fastapi import APIRouter, HTTPException

from app.models.auth import LoginRequest


router = APIRouter(tags=["auth"])

ADMIN_EMAIL = "admin@admin.com"
ADMIN_PASSWORD = "admin"
ADMIN_USER_ID = "admin"
ADMIN_NAME = "Administrador"
ADMIN_ROLE = "DOCTOR"


def base64url_json(data: dict) -> str:
    raw = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def create_demo_token() -> str:
    now = int(time.time())
    header = {
        "alg": "none",
        "typ": "JWT",
    }
    payload = {
        "sub": ADMIN_USER_ID,
        "email": ADMIN_EMAIL,
        "name": ADMIN_NAME,
        "role": ADMIN_ROLE,
        "iat": now,
        "exp": now + 60 * 60 * 24 * 7,
    }

    return f"{base64url_json(header)}.{base64url_json(payload)}."


@router.post("/login")
async def login(request: LoginRequest):
    email = request.email.strip().casefold()

    if email != ADMIN_EMAIL or request.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    return {
        "id": ADMIN_USER_ID,
        "name": ADMIN_NAME,
        "token": create_demo_token(),
        "role": ADMIN_ROLE,
        "email": ADMIN_EMAIL,
    }

