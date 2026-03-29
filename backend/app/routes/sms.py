from fastapi import APIRouter
from app.schemas.sms import SendSmsRequest
import logging
import httpx
import os
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

router = APIRouter()

# Load env variables so it picks up the .env file changes
load_dotenv()

@router.post("/api/sms/send")
async def send_sms(payload: SendSmsRequest):
    # Fetch dynamically so hot-reloads catch the env file changes
    telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()

    # Log original mock string to terminal as visualization
    print(f"\n{'='*50}\n[SMS OUTBOUND] To: {payload.phone}\nMessage: {payload.message}\n{'='*50}\n", flush=True)
    logger.info(f"SMS visually dispatched to {payload.phone}")

    # Forward the message to Telegram if credentials exist
    if telegram_bot_token and telegram_chat_id:
        url = f"https://api.telegram.org/bot{telegram_bot_token}/sendMessage"
        telegram_message = f"📱 **Message for {payload.phone}:**\n\n{payload.message}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json={
                        "chat_id": telegram_chat_id,
                        "text": telegram_message,
                        "parse_mode": "Markdown"
                    },
                    timeout=10.0
                )
            if response.status_code != 200:
                logger.error(f"Failed to send to Telegram: {response.text}")
                print(f"Telegram API Error: {response.text}") # Debug print
        except Exception as e:
            logger.error(f"Telegram dispatch error: {e}")
            print(f"Telegram Request Exception: {e}") # Debug print
    else:
        print("Waiting to send Telegram message: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment.")

    return {"status": "success", "message": "SMS processed"}
