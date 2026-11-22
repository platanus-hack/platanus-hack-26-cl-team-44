"""Normalización de los campos de entrada compartidos por las rutas HTTP."""
from __future__ import annotations


def texto(body: dict, limite: int) -> str:
    return str(body.get("texto", "")).strip()[:limite]


def historial(body: dict, limite: int = 30) -> list[str]:
    return [str(h)[:500] for h in (body.get("historial") or [])][-limite:]


def excluir(body: dict) -> list[str]:
    return [str(x)[:200] for x in (body.get("excluir") or [])][:20]


def iniciales(body: dict) -> str:
    return "".join(ch for ch in str(body.get("iniciales", "")).lower() if ch.isalnum())[:16]
