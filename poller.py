"""Continuous SociaX ingestion worker for Telegram and the explicit demo source."""

import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from telethon import TelegramClient

from backend.adapters import DemoAdapter, TelegramAdapter
from backend.repository import PostRepository

load_dotenv()
ROOT = Path(__file__).resolve().parent
API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")
CHANNELS = [item.strip() for item in os.getenv("TELEGRAM_CHANNELS", "").split(",") if item.strip()]
INTERVAL = int(os.getenv("FETCH_INTERVAL_SECONDS", "30"))
repository = PostRepository()


def configured_telegram() -> tuple[bool, str | None]:
    if not API_ID or not API_HASH or not CHANNELS:
        return False, "Telegram credentials or TELEGRAM_CHANNELS are missing"
    if not (ROOT / "telegram_session.session").exists():
        return False, "telegram_session.session is missing; run login.py"
    return True, None


async def ingest(adapter, expected_interval: int) -> None:
    try:
        posts = await adapter.fetch()
        inserted = repository.replace_source_posts(adapter.source, posts) if adapter.source == "demo" else repository.upsert_posts(posts)
        repository.update_source_status(
            adapter.source, "LIVE", lastSuccessAt=datetime.now(timezone.utc).isoformat(),
            expectedIntervalSeconds=expected_interval, fetched=len(posts), inserted=inserted,
        )
        print(f"[INGEST] {adapter.source}: fetched={len(posts)} inserted={inserted}")
    except Exception as exc:
        repository.update_source_status(adapter.source, "ERROR", error=str(exc), expectedIntervalSeconds=expected_interval)
        print(f"[INGEST ERROR] {adapter.source}: {exc}", file=sys.stderr)


async def main() -> None:
    print(f"[INGEST] Starting worker; interval={INTERVAL}s")
    enabled, reason = configured_telegram()
    client = None
    if enabled:
        client = TelegramClient(str(ROOT / "telegram_session"), int(API_ID), API_HASH)
        await client.connect()
        if not await client.is_user_authorized():
            reason = "Telegram session is not authorized; run login.py"
            enabled = False
            await client.disconnect()
            client = None
    if not enabled:
        repository.update_source_status("telegram", "ERROR", error=reason, expectedIntervalSeconds=INTERVAL)
        print(f"[INGEST ERROR] telegram: {reason}", file=sys.stderr)

    try:
        while True:
            tasks = [ingest(DemoAdapter(), INTERVAL)]
            if client:
                tasks.append(ingest(TelegramAdapter(client, CHANNELS), INTERVAL))
            await asyncio.gather(*tasks)
            await asyncio.sleep(INTERVAL)
    finally:
        if client and client.is_connected():
            await client.disconnect()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("[INGEST] Stopped")
