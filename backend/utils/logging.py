"""
Very small logging helper for the demo backend.
In a real deployment this is where structured logging or APM hooks would live.
"""

from datetime import datetime


def _ts() -> str:
  return datetime.now().isoformat()


def log_info(message: str) -> None:
  print(f"[info] { _ts() } {message}")


def log_warn(message: str) -> None:
  print(f"[warn] { _ts() } {message}")


