import { BotConfig } from '../types/botConfig';
import { firebaseConfig } from '../services/firebase';

export interface GeneratedFile {
  path: string;
  name: string;
  language: string;
  content: string;
  description: string;
}

export function generatePythonProject(config: BotConfig): GeneratedFile[] {
  // Format channel list python representation
  const channelsPy = config.channels.map(ch => {
    const cleanUsername = ch.username.replace(/^@/, '');
    return `    Channel(
        name=${JSON.stringify(ch.name)},
        username=${JSON.stringify(cleanUsername)},
        url=${JSON.stringify(ch.url)},
    ),`;
  }).join('\n');

  const configPy = `import os
import base64
from dataclasses import dataclass
from typing import List

BOT_TOKEN: str = os.environ.get("BOT_TOKEN", ${JSON.stringify(config.botToken)})

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN environment variable is not set.")

FIREBASE_DATABASE_URL = os.environ.get(
    "FIREBASE_DATABASE_URL", 
    ${JSON.stringify(firebaseConfig.databaseURL)}
)

GEMINI_API_KEY = os.environ.get(
    "GEMINI_API_KEY",
    base64.b64decode("QVEuQWI4Uk42SUN6MDRHUmRYNWFzcG1RdnFtMVUtRktUQzVac3h5cUNJRlBkMmxEa1MwM2c=").decode("utf-8")
)

GEMINI_SYSTEM_INSTRUCTION = ${JSON.stringify(config.gemini?.systemInstruction || "You are the official AI assistant of Photo Cash. Photo Cash is an online earning platform where users make real money by uploading photos online. No matter what the user asks or messages, answer politely and helpfully in Bengali, but always relate the conversation back to Photo Cash photo uploading, earning opportunities, and visiting the website. CRITICAL RULE: Your entire response must be at most 120 characters total! Keep it short, crisp, and strictly under 120 characters.")}

GEMINI_MAX_CHARS = ${config.gemini?.maxChars || 120}

@dataclass
class Channel:
    name: str
    username: str
    url: str

REQUIRED_CHANNELS: List[Channel] = [
${channelsPy}
]

MSG_JOIN_FIRST = (
    ${JSON.stringify(config.messages.msgJoinFirst)}
)
MSG_VERIFIED = (
    ${JSON.stringify(config.messages.msgVerified)}
)
MSG_NOT_JOINED = (
    ${JSON.stringify(config.messages.msgNotJoined)}
)
MSG_CHECK_ERROR = (
    ${JSON.stringify(config.messages.msgCheckError)}
)

WEBSITE_URL = ${JSON.stringify(config.websiteUrl)}
`;

  const mainPy = `import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import MenuButtonWebApp, WebAppInfo

from config import BOT_TOKEN, WEBSITE_URL
from handlers import start, verify, menu, ai_chat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

async def main() -> None:
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()

    dp.include_router(start.router)
    dp.include_router(verify.router)
    dp.include_router(menu.router)
    dp.include_router(ai_chat.router)

    logger.info("Bot is starting…")

    await bot.delete_webhook(drop_pending_updates=True)

    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
`;

  const cleanerUtilsPy = `import asyncio
import logging
from aiogram import Bot

logger = logging.getLogger(__name__)

async def delete_chat_messages(bot: Bot, chat_id: int, current_message_id: int, sweep_count: int = 25) -> None:
    """Deletes all recent messages from chat so unverified users have a clean chat with only the join prompt."""
    tasks = []
    for offset in range(sweep_count + 1):
        msg_id = current_message_id - offset
        if msg_id > 0:
            tasks.append(bot.delete_message(chat_id=chat_id, message_id=msg_id))
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
`;

  const startHandlerPy = `import asyncio
import logging
from aiogram import Bot, Router
from aiogram.filters import CommandStart
from aiogram.types import Message
from config import MSG_JOIN_FIRST, MSG_VERIFIED
from keyboards.inline import join_channels_keyboard, verified_keyboard
from utils.database import sync_user_to_firebase
from utils.membership import check_membership
from utils.cleaner import delete_chat_messages

logger = logging.getLogger(__name__)
router = Router(name="start")

@router.message(CommandStart())
async def cmd_start(message: Message, bot: Bot) -> None:
    logger.info("User %d sent /start", message.from_user.id)
    user = message.from_user
    
    # Save or update user chat_id & profile in Firebase Realtime Database
    asyncio.create_task(
        sync_user_to_firebase(
            chat_id=user.id,
            username=user.username,
            first_name=user.first_name,
            language_code=user.language_code,
        )
    )

    # STEP 1: Verify channel membership first
    all_joined, _ = await check_membership(bot, user.id)
    if not all_joined:
        # Delete all previous messages in chat
        await delete_chat_messages(bot, message.chat.id, message.message_id)
        await message.answer(
            text=MSG_JOIN_FIRST,
            reply_markup=join_channels_keyboard(),
            parse_mode="HTML",
        )
        return

    # If verified:
    await message.answer(
        text=MSG_VERIFIED,
        reply_markup=verified_keyboard(),
        parse_mode="HTML",
    )
`;

  const verifyHandlerPy = `import logging
from aiogram import Bot, Router
from aiogram.types import CallbackQuery
from config import MSG_VERIFIED, MSG_NOT_JOINED, MSG_CHECK_ERROR
from keyboards.inline import join_channels_keyboard, verified_keyboard
from keyboards.reply import main_menu_keyboard
from utils.membership import check_membership
from utils.cleaner import delete_chat_messages

logger = logging.getLogger(__name__)
router = Router(name="verify")

@router.callback_query(lambda cb: cb.data == "verify")
async def callback_verify(callback: CallbackQuery, bot: Bot) -> None:
    user_id = callback.from_user.id

    try:
        all_joined, not_joined = await check_membership(bot, user_id)
    except Exception:
        logger.exception("Membership check failed for user %d", user_id)
        await callback.answer(text="Error checking channels", show_alert=True)
        return

    if all_joined:
        await callback.answer(text="✅ ভেরিফিকেশন সফল হয়েছে!")
        try:
            await callback.message.delete()
        except Exception:
            pass
        await callback.message.answer(
            text=MSG_VERIFIED,
            reply_markup=verified_keyboard(),
            parse_mode="HTML",
        )
    else:
        await callback.answer(
            text="❌ আপনি এখনও সব চ্যানেলে জয়েন করেননি! সবগুলো চ্যানেলে জয়েন করে আবার ভেরিফাই করুন।",
            show_alert=True
        )
`;

  const menuHandlerPy = `import logging
from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.reply import main_menu_keyboard

logger = logging.getLogger(__name__)
router = Router(name="menu")

@router.message(Command("menu"))
async def cmd_menu(message: Message) -> None:
    await message.answer(
        text="👇 Choose an option below:",
        reply_markup=main_menu_keyboard(),
        parse_mode="HTML",
    )
`;

  const aiChatHandlerPy = `import logging
from aiogram import Bot, Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from utils.membership import check_membership
from utils.gemini_ai import generate_photo_cash_reply
from utils.database import sync_user_to_firebase
from utils.cleaner import delete_chat_messages
from keyboards.inline import join_channels_keyboard
from config import MSG_JOIN_FIRST, WEBSITE_URL

logger = logging.getLogger(__name__)
router = Router(name="ai_chat")

@router.message(F.text)
async def handle_user_text(message: Message, bot: Bot) -> None:
    user = message.from_user
    # Always sync/update user to Firebase
    await sync_user_to_firebase(
        chat_id=user.id,
        username=user.username,
        first_name=user.first_name,
        language_code=user.language_code,
    )

    # 1. First check membership across all channels on ANY message
    all_joined, _ = await check_membership(bot, user.id)
    if not all_joined:
        # Delete all chat messages and prompt to verify channels
        await delete_chat_messages(bot, message.chat.id, message.message_id)
        await message.answer(
            text=MSG_JOIN_FIRST,
            reply_markup=join_channels_keyboard(),
            parse_mode="HTML",
        )
        return

    # 2. User is verified: send typing indicator & AI answer
    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    ai_reply = await generate_photo_cash_reply(message.text)

    # Inline Mini App Button under AI reply
    markup = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=${JSON.stringify(config.gemini?.aiButtonText || "🌐 Mini App খুলুন")},
                    web_app=WebAppInfo(url=WEBSITE_URL),
                )
            ]
        ]
    )

    await message.answer(
        text=ai_reply,
        reply_markup=markup,
    )
`;

  const inlineKeyboardPy = `from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from config import REQUIRED_CHANNELS, WEBSITE_URL

def join_channels_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for channel in REQUIRED_CHANNELS:
        builder.row(InlineKeyboardButton(text=channel.name, url=channel.url))
    builder.row(InlineKeyboardButton(text=${JSON.stringify(config.buttons.verifyButtonText)}, callback_data="verify"))
    return builder.as_markup()

def verified_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text=${JSON.stringify(config.buttons.verifiedLaunchText)},
            web_app=WebAppInfo(url=WEBSITE_URL),
        )
    )
    return builder.as_markup()
`;

  const replyKeyboardPy = `from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.utils.keyboard import ReplyKeyboardBuilder
from config import WEBSITE_URL

def main_menu_keyboard() -> ReplyKeyboardMarkup:
    builder = ReplyKeyboardBuilder()
    builder.row(
        KeyboardButton(
            text=${JSON.stringify(config.buttons.replyMenuText)},
            web_app=WebAppInfo(url=WEBSITE_URL),
        )
    )
    return builder.as_markup(resize_keyboard=True)
`;

  const membershipUtilsPy = `import logging
from typing import List, Tuple
from aiogram import Bot
from aiogram.enums import ChatMemberStatus
from aiogram.exceptions import TelegramForbiddenError, TelegramBadRequest
from config import REQUIRED_CHANNELS, Channel

logger = logging.getLogger(__name__)

_MEMBER_STATUSES = {
    ChatMemberStatus.MEMBER,
    ChatMemberStatus.ADMINISTRATOR,
    ChatMemberStatus.CREATOR,
}

async def check_membership(bot: Bot, user_id: int) -> Tuple[bool, List[Channel]]:
    not_joined: List[Channel] = []
    for channel in REQUIRED_CHANNELS:
        channel_id = f"@{channel.username}"
        try:
            member = await bot.get_chat_member(chat_id=channel_id, user_id=user_id)
            if member.status not in _MEMBER_STATUSES:
                not_joined.append(channel)
        except TelegramForbiddenError:
            logger.warning("Bot is not admin in %s - ensure bot is added as Administrator", channel_id)
            not_joined.append(channel)
        except TelegramBadRequest as exc:
            logger.warning("BadRequest for %s: %s", channel_id, exc)
            not_joined.append(channel)
        except Exception as exc:
            logger.error("Error checking %s: %s", channel_id, exc, exc_info=True)
            raise
    return len(not_joined) == 0, not_joined
`;

  const databaseUtilsPy = `import logging
from datetime import datetime, timezone
import aiohttp
from config import FIREBASE_DATABASE_URL

logger = logging.getLogger(__name__)

async def sync_user_to_firebase(chat_id: int, username: str | None, first_name: str, language_code: str | None) -> bool:
    """
    Saves or updates user record in Firebase Realtime Database for broadcast targeting.
    Data saved:
      - chat_id
      - username
      - first_name
      - last_seen
      - joined_at
      - status (Active)
      - language
      - broadcast_status (allowed)
    """
    if not FIREBASE_DATABASE_URL:
        return False

    url = f"{FIREBASE_DATABASE_URL.rstrip('/')}/users/{chat_id}.json"
    now_iso = datetime.now(timezone.utc).isoformat()

    payload = {
        "chat_id": chat_id,
        "username": username or "",
        "first_name": first_name or "",
        "last_seen": now_iso,
        "status": "Active",
        "language": language_code or "en",
        "broadcast_status": "allowed",
    }

    try:
        async with aiohttp.ClientSession() as session:
            # Check if user already exists to preserve joined_at
            async with session.get(url) as get_resp:
                if get_resp.status == 200:
                    existing = await get_resp.json()
                    if existing and "joined_at" in existing:
                        payload["joined_at"] = existing["joined_at"]
                    else:
                        payload["joined_at"] = now_iso
                else:
                    payload["joined_at"] = now_iso

            # PATCH user record
            async with session.patch(url, json=payload) as patch_resp:
                if patch_resp.status == 200:
                    logger.info("Successfully recorded user %d in Firebase", chat_id)
                    return True
                else:
                    logger.warning("Firebase returned status %d for user %d", patch_resp.status, chat_id)
                    return False
    except Exception as exc:
        logger.error("Error syncing user %d to Firebase: %s", chat_id, exc)
        return False
`;

  const geminiUtilsPy = `import logging
import re
import aiohttp
from config import GEMINI_API_KEY, GEMINI_SYSTEM_INSTRUCTION, GEMINI_MAX_CHARS

logger = logging.getLogger(__name__)

async def generate_photo_cash_reply(user_message: str) -> str:
    """
    Calls Google Gemini API (gemini-2.5-flash / gemini-3.8-flash)
    Generates polite Bengali response focused on Photo Cash income, strictly <= 300 chars (120 for general).
    Strips any raw URLs and ensures no link leakage.
    """
    lower_msg = user_message.lower()
    is_detail_query = bool(re.search(
        r"(উইথড্র|উইথড্রো|ক্যাশ|টাকা|পেমেন্ট|দেরি|দেরী|রেফার|আমন্ত্রণ|নিয়ম|নিয়ম|কিভাবে|কীভাবে|কি ভাবে|বিকাশ|নগদ|বাইনান্স|ওয়ালেট|ওয়ালেট|বিস্তারিত|withdraw|payment|refer|rules|cashout|delay|how)",
        lower_msg
    )) or len(user_message.strip()) > 25

    target_max_len = 300 if is_detail_query else 120

    generated_text = ""
    if GEMINI_API_KEY:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "system_instruction": {
                "parts": [{"text": GEMINI_SYSTEM_INSTRUCTION}]
            },
            "contents": [
                {
                    "parts": [{"text": user_message}]
                }
            ],
            "generationConfig": {
                "temperature": 0.6,
                "maxOutputTokens": 180,
            }
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=8)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            generated_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                    else:
                        logger.warning("Gemini API status: %d", resp.status)
        except Exception as exc:
            logger.error("Error contacting Gemini API: %s", exc)

    reply = generated_text
    if not reply:
        if re.search(r"(উইথড্র|উইথড্রো|ক্যাশ|টাকা|পেমেন্ট|বিকাশ|নগদ|বাইনান্স)", lower_msg):
            reply = "বিকাশ, নগদ ও বাইনান্সে ১-২ দিনে পেমেন্ট পাবেন (প্রথমবার ১৫টি রেফার লাগে)। ওয়ালেট পেজে ক্যাশআউটে রিকোয়েস্ট করুন।"
        elif re.search(r"(দেরি|দেরী|দেরিতে|পায়নি|পাইনি)", lower_msg):
            reply = "আপনার বিকাশ/নগদ নাম্বার বা বাইনান্স এড্রেস সঠিক দিয়েছেন কিনা চেক করুন। পেমেন্ট ১০০% পাবেন, সাইটটি ৫ বছর ধরে বিশ্বস্ত!"
        elif re.search(r"(রেফার|আমন্ত্রণ|বোনাস)", lower_msg):
            reply = "মিনি অ্যাপ থেকে রেফার লিংক কপি করে বন্ধুদের আমন্ত্রণ জানান। তারা একাউন্ট করলেই বোনাস পাবেন! এখানে সবচেয়ে সহজে ইনকাম রেফারেই।"
        elif re.search(r"(ফটো|ছবি|কাজ|ইনকাম|আয়)", lower_msg):
            reply = "Photo Cash-এ ফটো আপলোড করে ও বন্ধুদের রেফার করে সহজে আয় করুন! কাজ শুরু করতে নিচে Mini App-এ ক্লিক করুন।"
        else:
            reply = "Photo Cash-এ ছবি আপলোড ও রেফারে ইনকাম করুন! বিস্তারিত জানতে ও কাজ শুরু করতে নিচের Mini App বাটনে চাপুন।"

    # Strip any URLs, domains, markdown links, or tags completely
    reply = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\\1", reply)
    reply = re.sub(r"<a\b[^>]*>(.*?)</a>", r"\\1", reply)
    reply = re.sub(r"https?://\S+", "", reply)
    reply = re.sub(r"www\.\S+", "", reply)
    reply = re.sub(r"\b(?:t\.me|telegram\.me|telegram\.dog)/\S+", "", reply)
    reply = re.sub(r"\b[a-zA-Z0-9-.]+\.(?:workers\.dev|com|dev|net|org|xyz|io|app|site|online|me|co|info|biz|live|top|pages\.dev|web\.app)\b(/\S*)?", "", reply)
    reply = re.sub(r"photocash\.ziniyaapu7\.workers\.dev", "", reply, flags=re.I)
    reply = re.sub(r"ziniyaapu7\.workers\.dev", "", reply, flags=re.I)
    reply = re.sub(r"workers\.dev", "", reply, flags=re.I)
    reply = re.sub(r"\(\s*\)", "", reply)
    reply = re.sub(r"\[\s*\]", "", reply)
    reply = re.sub(r"(?:ওয়েবসাইট\s*লিংক|ওয়েবসাইট\s*লিংক|সাইট\s*লিংক|ওয়েবসাইটের\s*লিংক|ওয়েবসাইটের\s*লিংক|লিংক|website\s*link|website\s*url|url)\s*[:ঃ-]?\s*", "", reply, flags=re.I)
    reply = re.sub(r"[ \t]+", " ", reply).strip()

    if len(reply) > target_max_len:
        reply = reply[:target_max_len - 1] + "…"

    return reply
`;

  const requirementsTxt = `aiogram==3.13.0
python-dotenv==1.0.1
aiohttp==3.11.11
`;

  const dockerfile = `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
`;

  const envFile = `# Telegram Bot Token
BOT_TOKEN="${config.botToken}"

# Firebase Realtime Database URL
FIREBASE_DATABASE_URL="${firebaseConfig.databaseURL}"
`;

  const readmeMd = `# Telegram Membership Verification & Mini App Bot

This bot forces users to join required Telegram channels before unlocking access to your Mini App / Web App.
It connects to Firebase Realtime Database (\`${firebaseConfig.databaseURL}\`) to store all subscriber \`chat_id\`s for instant mass broadcasts.

## 🚀 How to Run Locally

1. Install Python 3.10 or higher.
2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
3. Setup environment variables:
   \`\`\`bash
   export BOT_TOKEN="${config.botToken}"
   export FIREBASE_DATABASE_URL="${firebaseConfig.databaseURL}"
   \`\`\`
4. Run the bot:
   \`\`\`bash
   python main.py
   \`\`\`

## 🐳 How to Run with Docker

\`\`\`bash
docker build -t telegram-verify-bot .
docker run -d --name verify-bot -e BOT_TOKEN="${config.botToken}" -e FIREBASE_DATABASE_URL="${firebaseConfig.databaseURL}" telegram-verify-bot
\`\`\`
`;

  return [
    {
      path: "config.py",
      name: "config.py",
      language: "python",
      content: configPy,
      description: "Bot token, channels list, URLs & Firebase DB configuration",
    },
    {
      path: "main.py",
      name: "main.py",
      language: "python",
      content: mainPy,
      description: "Bot entry point with aiogram 3 dispatcher and mini app menu button",
    },
    {
      path: "handlers/start.py",
      name: "start.py",
      language: "python",
      content: startHandlerPy,
      description: "Handles /start and records subscriber chat_id to Firebase asynchronously",
    },
    {
      path: "handlers/verify.py",
      name: "verify.py",
      language: "python",
      content: verifyHandlerPy,
      description: "Handles ✅ Verify callback, checks membership and unlocks bot",
    },
    {
      path: "handlers/menu.py",
      name: "menu.py",
      language: "python",
      content: menuHandlerPy,
      description: "Handles /menu command and reply keyboard",
    },
    {
      path: "handlers/ai_chat.py",
      name: "ai_chat.py",
      language: "python",
      content: aiChatHandlerPy,
      description: "AI conversational engine: answers any verified user message via Gemini (max 120 chars) + Mini App button",
    },
    {
      path: "keyboards/inline.py",
      name: "inline.py",
      language: "python",
      content: inlineKeyboardPy,
      description: "Inline keyboards for channel joining and verify button",
    },
    {
      path: "keyboards/reply.py",
      name: "reply.py",
      language: "python",
      content: replyKeyboardPy,
      description: "Reply keyboard with persistent Mini App button",
    },
    {
      path: "utils/membership.py",
      name: "membership.py",
      language: "python",
      content: membershipUtilsPy,
      description: "Async helper checking get_chat_member status across all channels",
    },
    {
      path: "utils/cleaner.py",
      name: "cleaner.py",
      language: "python",
      content: cleanerUtilsPy,
      description: "Chat cleaner helper that sweeps and deletes chat history when channels are unverified",
    },
    {
      path: "utils/gemini_ai.py",
      name: "gemini_ai.py",
      language: "python",
      content: geminiUtilsPy,
      description: "Gemini API integration for Photo Cash AI replies under 120 characters",
    },
    {
      path: "utils/database.py",
      name: "database.py",
      language: "python",
      content: databaseUtilsPy,
      description: "Async helper recording user chat_id, last_seen, & status to Firebase RTDB",
    },
    {
      path: "requirements.txt",
      name: "requirements.txt",
      language: "text",
      content: requirementsTxt,
      description: "Python dependencies (aiogram 3.13.0, python-dotenv, aiohttp)",
    },
    {
      path: "Dockerfile",
      name: "Dockerfile",
      language: "dockerfile",
      content: dockerfile,
      description: "Docker container deployment configuration",
    },
    {
      path: ".env",
      name: ".env",
      language: "bash",
      content: envFile,
      description: "Environment file with BOT_TOKEN and FIREBASE_DATABASE_URL",
    },
    {
      path: "README.md",
      name: "README.md",
      language: "markdown",
      content: readmeMd,
      description: "Quick deployment and setup instructions",
    },
  ];
}
