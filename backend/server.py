"""Minimal read API for normalized posts and worker health."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from repository import PostRepository

ROOT = Path(__file__).resolve().parent.parent
repository = PostRepository()
VALID_SOURCES = {"telegram", "reddit", "youtube", "rss", "x", "demo"}


def derived_status(raw: dict) -> dict:
    now = datetime.now(timezone.utc)
    sources = raw.get("sources", {})
    for source in sources.values():
        if source.get("lastSuccessAt"):
            try:
                age = (now - datetime.fromisoformat(source["lastSuccessAt"])).total_seconds()
                source["state"] = "LIVE" if age <= max(90, source.get("expectedIntervalSeconds", 30) * 3) else "STALE"
            except ValueError:
                source["state"] = "ERROR"
    states = [item.get("state") for item in sources.values()]
    overall = "LIVE" if "LIVE" in states else ("ERROR" if "ERROR" in states else "STALE")
    return {"state": overall, "checkedAt": now.isoformat(), "sources": sources}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict | list) -> None:
        payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self._send(200, {"ok": True, "service": "sociax-ingestion-api"})
        elif parsed.path == "/api/ingestion/status":
            self._send(200, derived_status(repository.status()))
        elif parsed.path == "/api/posts":
            source = parse_qs(parsed.query).get("source", [None])[0]
            if source and source not in VALID_SOURCES:
                self._send(400, {"error": f"Unsupported source: {source}"})
            else:
                self._send(200, repository.list_posts(source))
        else:
            self._send(404, {"error": "Not found"})

    def log_message(self, format: str, *args: object) -> None:
        print(f"[API] {format % args}")


if __name__ == "__main__":
    print("[API] SociaX API listening at http://127.0.0.1:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
