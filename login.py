"""
One-time login script to create/refresh the Telegram session.
Run this ONCE interactively, then use poller.py for ongoing data fetching.
"""

from telethon.sync import TelegramClient
from dotenv import load_dotenv
import os

load_dotenv()

api_id = int(os.getenv("TELEGRAM_API_ID"))
api_hash = os.getenv("TELEGRAM_API_HASH")

client = TelegramClient("telegram_session", api_id, api_hash)
client.start()
print("Logged in — session saved.")
client.disconnect()
