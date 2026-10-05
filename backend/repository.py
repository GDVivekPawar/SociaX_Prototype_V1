"""Small JSON persistence boundary; replace this class with PostgreSQL later."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
POSTS_FILE = DATA_DIR / "posts.json"
STATUS_FILE = DATA_DIR / "ingestion_status.json"
_lock = Lock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class PostRepository:
    """JSON-file implementation of the post and ingestion-status repository."""

    def _read_json(self, path: Path, default: Any) -> Any:
        if not path.exists():
            return default
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return default

    def _write_json(self, path: Path, value: Any) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        temp = path.with_suffix(".tmp")
        temp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(path)

    def upsert_posts(self, posts: list[dict[str, Any]]) -> int:
        """Deduplicate using source + sourcePostId and return newly inserted count."""
        with _lock:
            stored = self._read_json(POSTS_FILE, [])
            by_key = {(p["source"], str(p["sourcePostId"])): p for p in stored}
            inserted = 0
            for post in posts:
                key = (post["source"], str(post["sourcePostId"]))
                if key not in by_key:
                    inserted += 1
                by_key[key] = post
            self._write_json(POSTS_FILE, list(by_key.values()))
            return inserted

    def replace_source_posts(self, source: str, posts: list[dict[str, Any]]) -> int:
        """Refresh a deterministic simulation stream without retaining obsolete scenarios."""
        with _lock:
            stored = [post for post in self._read_json(POSTS_FILE, []) if post.get("source") != source]
            self._write_json(POSTS_FILE, [*stored, *posts])
            return len(posts)

    def list_posts(self, source: str | None = None) -> list[dict[str, Any]]:
        posts = self._read_json(POSTS_FILE, [])
        if source:
            posts = [post for post in posts if post.get("source") == source]
        return sorted(posts, key=lambda post: post.get("sourceTimestamp", ""))

    def update_source_status(self, source: str, state: str, **details: Any) -> None:
        with _lock:
            status = self._read_json(STATUS_FILE, {"sources": {}})
            status.setdefault("sources", {})[source] = {
                "state": state,
                "updatedAt": now_iso(),
                **details,
            }
            self._write_json(STATUS_FILE, status)

    def status(self) -> dict[str, Any]:
        status = self._read_json(STATUS_FILE, {"sources": {}})
        status.setdefault("sources", {})
        return status
