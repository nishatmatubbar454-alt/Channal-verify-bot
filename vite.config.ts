import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'user' | 'verify' | 'error' | 'success';
  message: string;
}

function telegramApiPlugin(): Plugin {
  // Live Bot Runner Dynamic Config
  let runtimeConfig = {
    token: "8738784866:AAHQvVRZBjvT5aJRgHXtlvJC6ZqAF0FeLDU",
    channels: [
      {
        id: "ch-1",
        name: "🔗 Main Channel",
        username: "Click2Cash_Site",
        url: "https://t.me/Click2Cash_Site",
      },
      {
        id: "ch-2",
        name: "🔗 Payment Channel",
        username: "Earning_Money_Lob",
        url: "https://t.me/Earning_Money_Lob",
      },
      {
        id: "ch-3",
        name: "🔗 Official Channel 3",
        username: "jgjghjghh687",
        url: "https://t.me/jgjghjghh687",
      },
    ],
    websiteUrl: "https://photocash.ziniyaapu7.workers.dev",
    messages: {
      msgJoinFirst: "🚫 <b>You must join our channels first!</b>\n\nPlease join all the channels below and then click <b>✅ Verify</b>.",
      msgVerified: "✅ <b>অভিনন্দন! ভেরিফিকেশন সফল হয়েছে!</b>\n\n🎉 আপনি এখন বটটি ব্যবহার করার জন্য সম্পূর্ণ প্রস্তুত!\n\nনিচের বাটনে ক্লিক করে শুরু করুন 👇",
      msgNotJoined: "❌ <b>Please join all channels first.</b>\n\nMake sure you have joined every channel listed above, then click <b>✅ Verify</b> again.",
      msgCheckError: "⚠️ <b>Could not verify your membership.</b>\n\nThe channel might be private or there was a Telegram API error. Please try again or contact an admin.",
    },
    buttons: {
      menuButtonText: "🌐 Open App",
      verifyButtonText: "✅ Verify",
      verifiedLaunchText: "🚀 বট ব্যবহার শুরু করুন",
      replyMenuText: "🌐 Mini App খুলুন",
    },
    gemini: {
      apiKey: Buffer.from('QVEuQWI4Uk42SUN6MDRHUmRYNWFzcG1RdnFtMVUtRktUQzVac3h5cUNJRlBkMmxEa1MwM2c=', 'base64').toString('utf-8'),
      model: "gemini-3.8-flash",
      systemInstruction: `You are the official AI assistant of Photo Cash. Photo Cash is a trusted online earning platform where users make real money by uploading photos and referring friends.

CRITICAL RULES:
1. NO RAW LINKS OR URLS: NEVER write any URL or website link (such as http, https, .com, .dev, www) in your text reply! If user asks for a website/link or where to go, tell them to click the "🌐 Mini App খুলুন" button below to enter and start earning.
2. LENGTH RULE:
   - For standard questions, greetings, or short chat: keep it short, crisp, around 100-120 characters.
   - For detailed questions, rules, guidelines, how to withdraw, how to refer, or delay queries: provide a complete, clear explanation up to 300 characters strictly! Never exceed 300 characters.
3. LANGUAGE: Always respond helpfully, politely, and respectfully in Bengali (বাংলা).

OFFICIAL KNOWLEDGE BASE (Use these exact facts):
• ফটো আপলোড করে ইনকাম: ওয়েবসাইটে/মিনি অ্যাপে ফটো আপলোড করে ইনকাম করা যায়।
• সবচেয়ে সহজ আয়: বন্ধুদের আমন্ত্রণ জানানো (রেফার করা) এখানে সবচেয়ে সহজভাবে বেশি আয় করার উপায়।
• উইথড্র মেথড: বিকাশ (bKash), নগদ (Nagad) এবং বাইনান্স (Binance)।
• উইথড্র সময়: টাকা উত্তোলনের রিকোয়েস্ট করার ১ থেকে ২ দিন (২৪-৪৮ ঘণ্টা) সময় লাগে।
• প্রথমবার উইথড্র শর্ত: প্রথমবার উইথড্র করতে অন্তত ১৫ টি রেফার লাগবে।
• পেমেন্ট পেতে দেরি হলে: বলবেন যে আপনার বিকাশ/নগদ নাম্বার অথবা বাইনান্স এড্রেস ঠিক দিয়েছেন কিনা চেক করুন; পেমেন্ট ১০০% পাবেন। এই ওয়েবসাইট দীর্ঘ ৫ বছর যাবত বিশ্বস্ততার সাথে কাজ করছে।
• উইথড্র করার নিয়ম: ওয়ালেট (Wallet) পেজে গিয়ে 'ক্যাশআউট' বাটনে চাপ দিলেই পেমেন্ট সিস্টেমগুলো চলে আসবে, সেখান থেকে পেমেন্ট রিকোয়েস্ট করতে পারবেন।
• রেফার করার নিয়ম: এখান থেকে রেফার লিংকটি কপি করে বন্ধুদের আমন্ত্রণ জানান। তারা লিংকে ক্লিক করে একাউন্ট তৈরি করলেই আপনি রেফার বোনাস পেয়ে যাবেন।`,
      maxChars: 300,
      aiButtonText: "🌐 Mini App খুলুন",
    }
  };

  let botPollingActive = true;
  let currentToken = runtimeConfig.token;
  let lastUpdateId = 0;
  const logs: LogEntry[] = [];
  let stats = { starts: 0, verifies: 0, broadcasts: 0, errors: 0 };
  let isLoopRunning = false;

  const addLog = (type: LogEntry['type'], message: string) => {
    const time = new Date().toLocaleTimeString();
    logs.unshift({ id: `log-${Date.now()}-${Math.random()}`, time, type, message });
    if (logs.length > 100) logs.pop();
    console.log(`[Telegram Live Bot] [${time}] [${type.toUpperCase()}] ${message}`);
  };

  const syncUserToFirebase = async (user: any) => {
    if (!user || !user.id) return;
    const nowIso = new Date().toISOString();
    const payload = {
      chat_id: user.id,
      username: user.username || '',
      first_name: user.first_name || '',
      last_seen: nowIso,
      status: 'Active',
      language: user.language_code || 'bn',
      broadcast_status: 'allowed',
    };

    try {
      await fetch(`https://channel-varyfay-default-rtdb.firebaseio.com/users/${user.id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      addLog('success', `💾 Saved user @${user.username || user.id} (ID: ${user.id}) to Firebase Realtime Database!`);
    } catch (e: any) {
      addLog('error', `Firebase sync warning: ${e.message}`);
    }
  };

  const cleanAllLinksAndUrls = (text: string): string => {
    if (!text) return '';
    let cleaned = text
      // 1. Remove markdown links [Label](url) -> keep Label
      .replace(/\[([^\]]*)\]\([^)]*\)/gi, '$1')
      // 2. Remove html tags <a href="...">...</a> -> keep inner text
      .replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1')
      // 3. Remove magicpatterns links and references completely
      .replace(/https?:\/\/(?:www\.)?magicpatterns\.com[^\s)\]]*/gi, '')
      .replace(/(?:www\.)?magicpatterns\.com[^\s)\]]*/gi, '')
      .replace(/magicpatterns[^\s)\]]*/gi, '')
      // 4. Remove any http/https/ftp links
      .replace(/https?:\/\/[^\s)\]]+/gi, '')
      // 5. Remove www. links
      .replace(/www\.[^\s)\]]+/gi, '')
      // 6. Remove telegram t.me or telegram.me links
      .replace(/\b(?:t\.me|telegram\.me|telegram\.dog)\/[^\s)\]]+/gi, '')
      // 7. Remove any domain like photocash.ziniyaapu7.workers.dev or *.workers.dev or any domain name
      .replace(/\b[a-zA-Z0-9-.]+\.(?:workers\.dev|pages\.dev|web\.app|com|dev|net|org|xyz|io|app|site|online|me|co|info|biz|live|top)\b(?:\/[^\s)\]]*)?/gi, '')
      .replace(/photocash\.ziniyaapu7\.workers\.dev/gi, '')
      .replace(/ziniyaapu7\.workers\.dev/gi, '')
      .replace(/workers\.dev/gi, '')
      // 8. Remove phrases like "আজই যোগ দিন:", "আজই যোগ দিন", "লিংক:", "ওয়েবসাইট লিংক:"
      .replace(/আজই\s*যোগ\s*দিন\s*[:ঃ-]?\s*/gi, '')
      .replace(/(?:ওয়েবসাইট\s*লিংক|ওয়েবসাইট\s*লিংক|সাইট\s*লিংক|ওয়েবসাইটের\s*লিংক|ওয়েবসাইটের\s*লিংক|লিংক|website\s*link|website\s*url|url)\s*[:ঃ-]?\s*/gi, '')
      // 9. Remove leftover empty brackets or parentheses
      .replace(/\(\s*\)/g, '')
      .replace(/\[\s*\]/g, '')
      // 10. Normalize multiple spaces
      .replace(/[ \t]+/g, ' ')
      .trim();

    // FINAL SAFETY CHECK: If ANY url or domain remains in the text, replace completely!
    if (/https?:\/\/|www\.|\.com|\.dev|\.org|\.net|magicpatterns|workers\.dev/i.test(cleaned)) {
      return "Photo Cash-এ ছবি আপলোড ও বন্ধুদের রেফার করে সহজে ইনকাম করুন! কাজ শুরু করতে নিচে দেওয়া '🌐 Mini App খুলুন' বাটনে ক্লিক করুন।";
    }

    return cleaned;
  };

  const generateGeminiReply = async (
    userMessage: string,
    customKey?: string,
    customPrompt?: string,
    maxLen = 300
  ): Promise<string> => {
    const apiKey = customKey || runtimeConfig.gemini?.apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const systemInstruction = customPrompt || runtimeConfig.gemini?.systemInstruction ||
      `You are the official AI assistant of Photo Cash. Photo Cash is a trusted online earning platform where users make real money by uploading photos and referring friends.

CRITICAL RULES:
1. ABSOLUTELY ZERO LINKS, URLS, OR DOMAIN NAMES: NEVER write any website link, URL, domain, or internet address (no http, https, www, .com, .dev, workers.dev, t.me, etc.) in your answer! Even if user explicitly begs for a link or asks where to click, NEVER output any link. Tell them: "কাজ শুরু করতে নিচে দেওয়া '🌐 Mini App খুলুন' বাটনে ক্লিক করুন।" with ZERO links.
2. LENGTH RULE:
   - For standard questions, greetings, or short chat: keep it short, crisp, around 100-120 characters.
   - For detailed questions, rules, guidelines, how to withdraw, how to refer, or delay queries: provide a complete, clear explanation up to 300 characters strictly! Never exceed 300 characters.
3. LANGUAGE: Always respond helpfully, politely, and respectfully in Bengali (বাংলা).

OFFICIAL KNOWLEDGE BASE (Use these exact facts):
• ফটো আপলোড করে ইনকাম: ওয়েবসাইটে/মিনি অ্যাপে ফটো আপলোড করে ইনকাম করা যায়।
• সবচেয়ে সহজ আয়: বন্ধুদের আমন্ত্রণ জানানো (রেফার করা) এখানে সবচেয়ে সহজভাবে বেশি আয় করার উপায়।
• উইথড্র মেথড: বিকাশ (bKash), নগদ (Nagad) এবং বাইনান্স (Binance)।
• উইথড্র সময়: টাকা উত্তোলনের রিকোয়েস্ট করার ১ থেকে ২ দিন (২৪-৪৮ ঘণ্টা) সময় লাগে।
• প্রথমবার উইথড্র শর্ত: প্রথমবার উইথড্র করতে অন্তত ১৫ টি রেফার লাগবে।
• পেমেন্ট পেতে দেরি হলে: বলবেন যে আপনার বিকাশ/নগদ নাম্বার অথবা বাইনান্স এড্রেস ঠিক দিয়েছেন কিনা চেক করুন; পেমেন্ট ১০০% পাবেন। এই ওয়েবসাইট দীর্ঘ ৫ বছর যাবত বিশ্বস্ততার সাথে কাজ করছে।
• উইথড্র করার নিয়ম: ওয়ালেট (Wallet) পেজে গিয়ে 'ক্যাশআউট' বাটনে চাপ দিলেই পেমেন্ট সিস্টেমগুলো চলে আসবে, সেখান থেকে পেমেন্ট রিকোয়েস্ট করতে পারবেন।
• রেফার করার নিয়ম: এখান থেকে রেফার লিংকটি কপি করে বন্ধুদের আমন্ত্রণ জানান। তারা লিংকে ক্লিক করে একাউন্ট তৈরি করলেই আপনি রেফার বোনাস পেয়ে যাবেন।`;

    // Dynamic length: if user asks for details/how-to/withdraw/delay/rules -> up to 300 chars, else ~120 chars
    const lowerMsg = userMessage.toLowerCase();
    const isDetailQuery = /উইথড্র|উইথড্রো|ক্যাশ|টাকা|পেমেন্ট|দেরি|দেরী|রেফার|আমন্ত্রণ|নিয়ম|নিয়ম|কিভাবে|কীভাবে|কি ভাবে|কী ভাবে|বিকাশ|নগদ|বাইনান্স|ওয়ালেট|ওয়ালেট|বিস্তারিত|কবে|কেন|withdraw|payment|refer|rules|cashout|delay|how/i.test(lowerMsg) || userMessage.trim().length > 25;
    const targetMaxLen = isDetailQuery ? 300 : 120;

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let generatedText = '';

    for (const model of modelsToTry) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents: userMessage,
          config: {
            systemInstruction,
            temperature: 0.6,
          }
        });

        if (response.text && response.text.trim()) {
          generatedText = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`[Gemini] model ${model} attempt warning:`, err?.message || err);
      }
    }

    // Smart fallback if AI quota or error occurs
    let reply = generatedText;
    if (!reply) {
      if (/উইথড্র|উইথড্রো|ক্যাশ|টাকা|পেমেন্ট|বিকাশ|নগদ|বাইনান্স/i.test(lowerMsg)) {
        reply = "বিকাশ, নগদ ও বাইনান্সে ১-২ দিনে পেমেন্ট পাবেন (প্রথমবার ১৫টি রেফার লাগে)। ওয়ালেট পেজে ক্যাশআউটে রিকোয়েস্ট করুন।";
      } else if (/দেরি|দেরী|দেরিতে|পায়নি|পাইনি/i.test(lowerMsg)) {
        reply = "আপনার বিকাশ/নগদ নাম্বার বা বাইনান্স এড্রেস সঠিক দিয়েছেন কিনা চেক করুন। পেমেন্ট ১০০% পাবেন, সাইটটি ৫ বছর ধরে বিশ্বস্ত!";
      } else if (/রেফার|আমন্ত্রণ|বোনাস/i.test(lowerMsg)) {
        reply = "মিনি অ্যাপ থেকে রেফার লিংক কপি করে বন্ধুদের আমন্ত্রণ জানান। তারা একাউন্ট করলেই বোনাস পাবেন! এখানে সবচেয়ে সহজে ইনকাম রেফারেই।";
      } else if (/ফটো|ছবি|কাজ|ইনকাম|আয়|টাকা/i.test(lowerMsg)) {
        reply = "Photo Cash-এ ফটো আপলোড করে ও বন্ধুদের রেফার করে সহজে আয় করুন! কাজ শুরু করতে নিচে Mini App-এ ক্লিক করুন।";
      } else {
        reply = "Photo Cash-এ ছবি আপলোড ও রেফারে ইনকাম করুন! বিস্তারিত জানতে ও কাজ শুরু করতে নিচের Mini App বাটনে চাপুন।";
      }
    }

    // Strict Rule: Remove ANY raw URLs or website domains from text completely
    reply = cleanAllLinksAndUrls(reply);

    // Strict Character Limit Enforcer
    if (reply.length > targetMaxLen) {
      reply = reply.slice(0, targetMaxLen - 1) + '…';
    }
    return cleanAllLinksAndUrls(reply);
  };

  // Track sent bot message IDs for complete chat cleanup
  const botSentMessagesMap = new Map<number | string, Set<number>>();
  const lastBotPromptIdMap = new Map<number | string, number>();
  const processedMessageIds = new Set<string>();
  const chatProcessingLocks = new Map<number | string, boolean>();

  const recordBotMessage = (chatId: number | string, messageId?: number) => {
    if (!messageId) return;
    if (!botSentMessagesMap.has(chatId)) {
      botSentMessagesMap.set(chatId, new Set<number>());
    }
    botSentMessagesMap.get(chatId)!.add(messageId);
    lastBotPromptIdMap.set(chatId, messageId);
  };

  const deletePreviousBotMessages = async (botToken: string, chatId: number | string, incomingMsgId?: number) => {
    const idsToDelete = new Set<number>();

    // 1. All tracked bot sent message IDs
    if (botSentMessagesMap.has(chatId)) {
      botSentMessagesMap.get(chatId)!.forEach(id => idsToDelete.add(id));
      botSentMessagesMap.get(chatId)!.clear();
    }
    if (lastBotPromptIdMap.has(chatId)) {
      idsToDelete.add(lastBotPromptIdMap.get(chatId)!);
      lastBotPromptIdMap.delete(chatId);
    }

    // 2. Also sweep backwards 100 message IDs from incomingMsgId to delete ANY old bot or error messages
    if (incomingMsgId) {
      idsToDelete.add(incomingMsgId);
      for (let offset = 1; offset <= 100; offset++) {
        if (incomingMsgId - offset > 0) {
          idsToDelete.add(incomingMsgId - offset);
        }
      }
    }

    const idList = Array.from(idsToDelete);
    if (idList.length === 0) return;

    // Use Telegram batch deleteMessages API for fast instant deletion of up to 100 messages at once
    for (let i = 0; i < idList.length; i += 100) {
      const chunk = idList.slice(i, i + 100);
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_ids: chunk }),
        });
      } catch {}
    }
  };

  const handleUpdate = async (update: any) => {
    const token = currentToken;

    // Helper to generate join inline keyboard from current channels
    const getJoinInlineKeyboard = () => {
      const rows: any[] = [];
      for (const ch of runtimeConfig.channels) {
        rows.push([{ text: ch.name, url: ch.url }]);
      }
      rows.push([{ text: runtimeConfig.buttons?.verifyButtonText || '✅ Verify', callback_data: 'verify' }]);
      return { inline_keyboard: rows };
    };

    // Helper to check user membership in all channels
    const checkAllChannels = async (userId: number): Promise<boolean> => {
      if (!runtimeConfig.channels || runtimeConfig.channels.length === 0) return true;
      for (const ch of runtimeConfig.channels) {
        const cleanUsername = ch.username.replace(/^@/, '').trim();
        try {
          const chRes = await fetch(
            `https://api.telegram.org/bot${token}/getChatMember?chat_id=@${cleanUsername}&user_id=${userId}`
          );
          const chData = await chRes.json();
          if (chData.ok && chData.result) {
            const status = chData.result.status;
            if (!['creator', 'administrator', 'member'].includes(status)) {
              return false;
            }
          } else {
            return false;
          }
        } catch {
          return false;
        }
      }
      return true;
    };

    // 1. Message received (ANY message / command / text)
    if (update.message) {
      const text = (update.message.text || '').trim();
      const user = update.message.from;
      const chatId = update.message.chat.id;
      const incomingMsgId = update.message.message_id;

      if (!user) return;

      // Prevent duplicate processing of the exact same message
      const msgKey = `${chatId}:${incomingMsgId}`;
      if (processedMessageIds.has(msgKey)) return;
      processedMessageIds.add(msgKey);
      if (processedMessageIds.size > 2000) {
        const arr = Array.from(processedMessageIds);
        arr.slice(0, 1000).forEach(k => processedMessageIds.delete(k));
      }

      // Check per-chat lock so 1 incoming message produces exactly 1 response
      if (chatProcessingLocks.get(chatId)) {
        return;
      }
      chatProcessingLocks.set(chatId, true);

      try {
        // Always sync/update user to Firebase
        await syncUserToFirebase(user);

        // STEP 1: Verify channel membership first on ANY incoming message
        const allJoined = await checkAllChannels(user.id);

        // If user has NOT joined all channels:
        // Delete previous bot messages so ONLY 1 single join prompt message remains!
        if (!allJoined) {
          addLog('user', `🚫 User @${user.username || user.id} sent "${text.slice(0, 30)}" - Channels NOT joined! Deleting old bot messages to keep exactly 1 prompt...`);

          // Delete all previous bot prompt messages
          await deletePreviousBotMessages(token, chatId, incomingMsgId);

          const welcomeText = runtimeConfig.messages?.msgJoinFirst ||
            '🚫 <b>You must join our channels first!</b>\n\n' +
            'Please join all the channels below and then click <b>✅ Verify</b>.';

          try {
            const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: welcomeText,
                parse_mode: 'HTML',
                reply_markup: getJoinInlineKeyboard(),
              }),
            });
            const sendData = await sendRes.json();
            if (sendData.ok && sendData.result?.message_id) {
              recordBotMessage(chatId, sendData.result.message_id);
            }
          } catch (err: any) {
            addLog('error', `Failed to send join channels: ${err.message}`);
          }
          return;
        }

        // If user HAS joined all channels:
        // If /start command:
        if (text.startsWith('/start')) {
          stats.starts++;
          addLog('user', `👤 Verified User @${user.username || user.id} sent /start`);

          // Ensure bottom chat menu button is default (NO bottom bar Open App button)
          try {
            await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                menu_button: { type: 'default' },
              }),
            });
          } catch {}

          // Delete prior bot messages to keep chat clean
          await deletePreviousBotMessages(token, chatId, incomingMsgId);

          const verifiedText = runtimeConfig.messages?.msgVerified ||
            '✅ <b>অভিনন্দন! ভেরিফিকেশন সফল হয়েছে!</b>\n\n' +
            '🎉 আপনি এখন Photo Cash AI-এর সাথে সরাসরি কথা বলতে পারবেন এবং ছবি আপলোড করে ইনকাম শুরু করতে পারবেন!\n\n' +
            'যেকোনো প্রশ্ন লিখে পাঠান অথবা নিচে ক্লিক করুন 👇';

          const verifiedMarkup = {
            inline_keyboard: [
              [
                {
                  text: runtimeConfig.buttons?.verifiedLaunchText || '🚀 বট ব্যবহার শুরু করুন',
                  web_app: {
                    url: runtimeConfig.websiteUrl,
                  },
                },
              ],
            ],
          };

          try {
            const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: cleanAllLinksAndUrls(verifiedText),
                parse_mode: 'HTML',
                reply_markup: verifiedMarkup,
              }),
            });
            const sendData = await sendRes.json();
            if (sendData.ok && sendData.result?.message_id) {
              recordBotMessage(chatId, sendData.result.message_id);
            }
          } catch (err: any) {
            addLog('error', `Failed to send verified message: ${err.message}`);
          }
          return;
        }

        // For ANY other message from verified user:
        // Send typing action & generate Gemini AI response (EXACTLY 1 REPLY) + Mini App button
        addLog('user', `💬 Verified User @${user.username || user.id} asked: "${text.slice(0, 30)}" -> Generating Gemini response...`);

        try {
          await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
          });
        } catch {}

        const rawAiReply = await generateGeminiReply(text, undefined, undefined, runtimeConfig.gemini?.maxChars || 300);
        const aiReply = cleanAllLinksAndUrls(rawAiReply);
        addLog('success', `🤖 AI Replied (${aiReply.length} chars): "${aiReply}"`);

        const aiMarkup = {
          inline_keyboard: [
            [
              {
                text: runtimeConfig.gemini?.aiButtonText || '🌐 Mini App খুলুন',
                web_app: {
                  url: runtimeConfig.websiteUrl,
                },
              },
            ],
          ],
        };

        try {
          const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: aiReply,
              reply_markup: aiMarkup,
            }),
          });
          const sendData = await sendRes.json();
          if (sendData.ok && sendData.result?.message_id) {
            recordBotMessage(chatId, sendData.result.message_id);
          }
        } catch (err: any) {
          addLog('error', `Failed to send AI message: ${err.message}`);
        }
      } finally {
        chatProcessingLocks.delete(chatId);
      }
    }

    // 2. Callback Query: verify
    if (update.callback_query) {
      const cb = update.callback_query;
      const user = cb.from;
      const message = cb.message;
      const chatId = message ? message.chat.id : user.id;

      // Always sync user to Firebase on verify click
      await syncUserToFirebase(user);

      if (cb.data === 'verify') {
        stats.verifies++;
        addLog('verify', `🔍 User @${user.username || user.id} clicked ✅ Verify - checking memberships...`);

        // Check required channels
        const allJoined = await checkAllChannels(user.id);

        if (allJoined) {
          addLog('success', `🎉 User @${user.username || user.id} verified successfully! Unlocking Mini App.`);

          // Answer callback with popup
          try {
            await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query_id: cb.id,
                text: '✅ অভিনন্দন! ভেরিফিকেশন সফল হয়েছে!',
              }),
            });
          } catch {}

          // Delete the join prompt message (and any other prior bot messages)
          await deletePreviousBotMessages(token, chatId, message ? message.message_id : undefined);

          // Send MSG_VERIFIED with Mini App Launch Button
          const verifiedText = runtimeConfig.messages?.msgVerified ||
            '✅ <b>অভিনন্দন! ভেরিফিকেশন সফল হয়েছে!</b>\n\n' +
            '🎉 আপনি এখন বটটি ব্যবহার করার জন্য সম্পূর্ণ প্রস্তুত!\n\n' +
            'নিচের বাটনে ক্লিক করে শুরু করুন 👇';

          const verifiedMarkup = {
            inline_keyboard: [
              [
                {
                  text: runtimeConfig.buttons?.verifiedLaunchText || '🚀 বট ব্যবহার শুরু করুন',
                  web_app: {
                    url: runtimeConfig.websiteUrl,
                  },
                },
              ],
            ],
          };

          try {
            // Ensure bottom chat menu button is default (NO bottom bar Open App button)
            try {
              await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  menu_button: { type: 'default' },
                }),
              });
            } catch {}

            const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: cleanAllLinksAndUrls(verifiedText),
                parse_mode: 'HTML',
                reply_markup: verifiedMarkup,
              }),
            });
            const sendData = await sendRes.json();
            if (sendData.ok && sendData.result?.message_id) {
              recordBotMessage(chatId, sendData.result.message_id);
            }
          } catch (e: any) {
            addLog('error', `Failed to send verified message: ${e.message}`);
          }
        } else {
          addLog('info', `⚠️ User @${user.username || user.id} has not joined all channels yet.`);

          // Answer callback with popup alert ONLY! DO NOT send a new message so chat remains clean with 1 message!
          try {
            await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query_id: cb.id,
                text: '❌ আপনি এখনও সব চ্যানেলে জয়েন করেননি! ৩টি চ্যানেলেই জয়েন করে আবার Verify বাটনে চাপুন।',
                show_alert: true,
              }),
            });
          } catch {}
        }
      } else {
        try {
          await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: cb.id }),
          });
        } catch {}
      }
    }
  };

  // Background Telegram Long Polling Loop
  const startPollingLoop = async () => {
    if (isLoopRunning) return;
    isLoopRunning = true;
    addLog('info', `🚀 Live Telegram Bot Poller started for token: ${currentToken.slice(0, 10)}...`);

    // First delete webhook to make polling work
    try {
      await fetch(`https://api.telegram.org/bot${currentToken}/deleteWebhook?drop_pending_updates=false`);
    } catch {}

    // Reset ChatMenuButton globally to default so Telegram bottom bar has no web_app button
    try {
      await fetch(`https://api.telegram.org/bot${currentToken}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu_button: { type: 'default' } }),
      });
    } catch {}

    while (botPollingActive) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${currentToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`
        );
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            await handleUpdate(update);
          }
        } else if (!data.ok) {
          if (data.error_code === 409) {
            // Other instance polling; wait quietly
            await new Promise((r) => setTimeout(r, 6000));
            continue;
          }
          stats.errors++;
          addLog('error', `Telegram getUpdates: ${data.description || 'Error'}`);
          await new Promise((r) => setTimeout(r, 4000));
        }
      } catch (err: any) {
        // Network or timeout
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    isLoopRunning = false;
    addLog('info', '🛑 Live Telegram Bot Poller stopped.');
  };

  const registerMiddlewares = (server: any) => {
    // 1. Verify Bot Token
    server.middlewares.use('/api/telegram-verify', async (req: any, res: any) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (!token) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Token is required' }));
          return;
        }

        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
          const data = await tgRes.json();
          res.statusCode = tgRes.ok ? 200 : 400;
          res.end(JSON.stringify(data));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: err?.message || 'Network error fetching Telegram API' }));
        }
      });

      // 2. Send Telegram Message
      server.middlewares.use('/api/telegram-send-message', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            let params: any = {};
            if (req.method === 'POST' && body) {
              try {
                params = JSON.parse(body);
              } catch {
                params = {};
              }
            } else {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              params = {
                token: url.searchParams.get('token'),
                chat_id: url.searchParams.get('chat_id'),
                text: url.searchParams.get('text'),
              };
            }

            const { token, chat_id, text, caption, photo, reply_markup } = params;
            const messageText = text || caption || '';

            if (!token || !chat_id || (!messageText && !photo)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: 'token, chat_id, and text or photo are required' }));
              return;
            }

            // Case A: Send Photo (from gallery base64 or URL)
            if (photo) {
              // Base64 image uploaded from gallery
              if (typeof photo === 'string' && photo.startsWith('data:image/')) {
                const matches = photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches) {
                  const mimeType = matches[1];
                  const buffer = Buffer.from(matches[2], 'base64');
                  const blob = new Blob([buffer], { type: mimeType });
                  const formData = new FormData();
                  formData.append('chat_id', String(chat_id));
                  formData.append('photo', blob, 'broadcast_photo.jpg');
                  if (messageText) {
                    formData.append('caption', messageText);
                    formData.append('parse_mode', 'HTML');
                  }
                  if (reply_markup) {
                    formData.append('reply_markup', typeof reply_markup === 'string' ? reply_markup : JSON.stringify(reply_markup));
                  }

                  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                    method: 'POST',
                    body: formData,
                  });
                  const data = await tgRes.json();
                  res.statusCode = tgRes.ok ? 200 : (data.error_code || 400);
                  res.end(JSON.stringify(data));
                  return;
                }
              }

              // Direct image URL
              const photoPayload: any = {
                chat_id,
                photo,
                parse_mode: 'HTML',
              };
              if (messageText) photoPayload.caption = messageText;
              if (reply_markup) photoPayload.reply_markup = reply_markup;

              const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(photoPayload),
              });
              const data = await tgRes.json();
              res.statusCode = tgRes.ok ? 200 : (data.error_code || 400);
              res.end(JSON.stringify(data));
              return;
            }

            // Case B: Normal text message
            const payload: any = {
              chat_id,
              text: messageText,
              parse_mode: 'HTML',
            };
            if (reply_markup) {
              payload.reply_markup = reply_markup;
            }

            const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const data = await tgRes.json();
            res.statusCode = tgRes.ok ? 200 : (data.error_code || 400);
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: err?.message || 'Error sending Telegram message' }));
          }
        });
      });

      // 2b. Explicit Send Photo Endpoint
      server.middlewares.use('/api/telegram-send-photo', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const params = body ? JSON.parse(body) : {};
            const { token, chat_id, photo, caption, reply_markup } = params;

            if (!token || !chat_id || !photo) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: 'token, chat_id, and photo are required' }));
              return;
            }

            if (typeof photo === 'string' && photo.startsWith('data:image/')) {
              const matches = photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches) {
                const mimeType = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const blob = new Blob([buffer], { type: mimeType });
                const formData = new FormData();
                formData.append('chat_id', String(chat_id));
                formData.append('photo', blob, 'broadcast_photo.jpg');
                if (caption) {
                  formData.append('caption', caption);
                  formData.append('parse_mode', 'HTML');
                }
                if (reply_markup) {
                  formData.append('reply_markup', typeof reply_markup === 'string' ? reply_markup : JSON.stringify(reply_markup));
                }

                const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                  method: 'POST',
                  body: formData,
                });
                const data = await tgRes.json();
                res.statusCode = tgRes.ok ? 200 : (data.error_code || 400);
                res.end(JSON.stringify(data));
                return;
              }
            }

            const photoPayload: any = { chat_id, photo, parse_mode: 'HTML' };
            if (caption) photoPayload.caption = caption;
            if (reply_markup) photoPayload.reply_markup = reply_markup;

            const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(photoPayload),
            });
            const data = await tgRes.json();
            res.statusCode = tgRes.ok ? 200 : (data.error_code || 400);
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: err?.message || 'Error sending Telegram photo' }));
          }
        });
      });

      // 3. Bot Runner Status & Live Logs
      server.middlewares.use('/api/bot-runner/status', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        res.end(
          JSON.stringify({
            ok: true,
            isRunning: botPollingActive,
            tokenPrefix: currentToken.slice(0, 10),
            stats,
            logs: logs.slice(0, 40),
            botUsername: 'PhotoCash12_bot',
            botName: 'Photo Cash 📸💸',
          })
        );
      });

      // 4. Toggle Bot Runner
      server.middlewares.use('/api/bot-runner/toggle', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            if (parsed.token) {
              currentToken = parsed.token;
            }
            if (typeof parsed.active === 'boolean') {
              botPollingActive = parsed.active;
              if (botPollingActive && !isLoopRunning) {
                setTimeout(startPollingLoop, 200);
              }
            }
            res.end(JSON.stringify({ ok: true, isRunning: botPollingActive }));
          } catch {
            res.end(JSON.stringify({ ok: false }));
          }
        });
      });

      // 4b. Fetch Real Telegram Users directly from Firebase RTDB
      server.middlewares.use('/api/telegram-users', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        try {
          const fbRes = await fetch('https://channel-varyfay-default-rtdb.firebaseio.com/users.json');
          const data = await fbRes.json();
          const DEMO_IDS = new Set([569842104, 612847193, 593847291, 649281745, 582910471]);
          const usersList = data ? Object.values(data).filter((u: any) => !DEMO_IDS.has(Number(u.chat_id))) : [];
          res.end(JSON.stringify({ ok: true, users: usersList }));
        } catch (e: any) {
          res.end(JSON.stringify({ ok: false, error: e?.message || 'Error', users: [] }));
        }
      });

      // 5. Gemini AI Chat API
      server.middlewares.use('/api/gemini/chat', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const message = parsed.message || 'কীভাবে ইনকাম করব?';
            const apiKey = parsed.apiKey;
            const systemInstruction = parsed.systemInstruction;
            const maxChars = parsed.maxChars || 300;

            const text = cleanAllLinksAndUrls(await generateGeminiReply(message, apiKey, systemInstruction, maxChars));
            res.end(JSON.stringify({ ok: true, text }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
      });

      // 6. Bot Runtime Config Sync
      server.middlewares.use('/api/bot-runner/config', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed.botToken && parsed.botToken !== currentToken) {
                currentToken = parsed.botToken;
                runtimeConfig.token = parsed.botToken;
                lastUpdateId = 0;
                addLog('info', `🔄 Bot token updated to: ${currentToken.slice(0, 10)}...`);
              }
              if (Array.isArray(parsed.channels)) {
                runtimeConfig.channels = parsed.channels;
                addLog('info', `📋 Channels updated: ${parsed.channels.length} channels configured`);
              }
              if (parsed.websiteUrl && parsed.websiteUrl !== runtimeConfig.websiteUrl) {
                runtimeConfig.websiteUrl = parsed.websiteUrl;
                addLog('success', `🌐 Mini App URL updated everywhere to: ${parsed.websiteUrl}`);

                // Update Telegram setChatMenuButton globally so bottom button reflects new link
                if (currentToken) {
                  fetch(`https://api.telegram.org/bot${currentToken}/setChatMenuButton`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      menu_button: {
                        type: 'web_app',
                        text: runtimeConfig.buttons?.menuButtonText || '🌐 Open App',
                        web_app: {
                          url: runtimeConfig.websiteUrl,
                        },
                      },
                    }),
                  }).catch(() => {});
                }
              }
              if (parsed.messages) {
                runtimeConfig.messages = { ...runtimeConfig.messages, ...parsed.messages };
              }
              if (parsed.buttons) {
                runtimeConfig.buttons = { ...runtimeConfig.buttons, ...parsed.buttons };
              }
              if (parsed.gemini) {
                if (parsed.gemini.systemInstruction) {
                  parsed.gemini.systemInstruction = cleanAllLinksAndUrls(parsed.gemini.systemInstruction);
                }
                runtimeConfig.gemini = { ...runtimeConfig.gemini, ...parsed.gemini };
              }
              res.end(JSON.stringify({ ok: true, config: runtimeConfig }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        res.end(JSON.stringify({ ok: true, config: runtimeConfig }));
      });
  };

  return {
    name: 'telegram-api-proxy',
    configureServer(server: any) {
      if (!isLoopRunning) {
        setTimeout(startPollingLoop, 500);
      }
      registerMiddlewares(server);
    },
    configurePreviewServer(server: any) {
      if (!isLoopRunning) {
        setTimeout(startPollingLoop, 500);
      }
      registerMiddlewares(server);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), telegramApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 10000,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
