import { BotConfig } from '../types/botConfig';

export const DEFAULT_CONFIG: BotConfig = {
  botToken: "8738784866:AAHQvVRZBjvT5aJRgHXtlvJC6ZqAF0FeLDU",
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
    msgJoinFirst: "🚫 <b>You must join our channels first!</b>\n\n" +
      "Please join all the channels below and then click <b>✅ Verify</b>.",
    msgVerified: "✅ <b>অভিনন্দন! ভেরিফিকেশন সফল হয়েছে!</b>\n\n" +
      "🎉 আপনি এখন বটটি ব্যবহার করার জন্য সম্পূর্ণ প্রস্তুত!\n\n" +
      "নিচের বাটনে ক্লিক করে শুরু করুন 👇",
    msgNotJoined: "❌ <b>Please join all channels first.</b>\n\n" +
      "Make sure you have joined every channel listed above, " +
      "then click <b>✅ Verify</b> again.",
    msgCheckError: "⚠️ <b>Could not verify your membership.</b>\n\n" +
      "The channel might be private or there was a Telegram API error. " +
      "Please try again or contact an admin.",
  },
  buttons: {
    menuButtonText: "🌐 Open App",
    verifyButtonText: "✅ Verify",
    verifiedLaunchText: "🚀 বট ব্যবহার শুরু করুন",
    replyMenuText: "🌐 Mini App খুলুন",
  },
  botInfo: {
    id: 8738784866,
    is_bot: true,
    first_name: "Photo Cash 📸💸",
    username: "PhotoCash12_bot",
    can_join_groups: true,
  },
  gemini: {
    apiKey: (typeof atob === 'function' ? atob('QVEuQWI4Uk42SUN6MDRHUmRYNWFzcG1RdnFtMVUtRktUQzVac3h5cUNJRlBkMmxEa1MwM2c=') : (typeof Buffer !== 'undefined' ? Buffer.from('QVEuQWI4Uk42SUN6MDRHUmRYNWFzcG1RdnFtMVUtRktUQzVac3h5cUNJRlBkMmxEa1MwM2c=', 'base64').toString('utf-8') : '')),
    model: "gemini-3.8-flash",
    systemInstruction: `You are the official AI assistant of Photo Cash. Photo Cash is a trusted online earning platform where users make real money by uploading photos and referring friends.

CRITICAL RULES:
1. ABSOLUTELY ZERO LINKS, URLS, OR DOMAIN NAMES: NEVER write any URL or website link (such as http, https, www, .com, .dev, magicpatterns, workers.dev, etc.) in your text reply! Under no circumstances should you ever mention any URL like magicpatterns.com or any website address. If user asks for a website/link or where to go, tell them to click the "🌐 Mini App খুলুন" button below to enter and start earning.
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
  },
};

const STORAGE_KEY = "tg_bot_admin_config_v8";

export function loadSavedConfig(): BotConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("tg_bot_admin_config_v7") || localStorage.getItem("tg_bot_admin_config_v6") || localStorage.getItem("tg_bot_admin_config_v5") || localStorage.getItem("tg_bot_admin_config_v4");
    if (raw) {
      const parsed = JSON.parse(raw);
      let websiteUrl = parsed.websiteUrl;
      // Auto-migrate legacy magicpatterns URL or missing URL
      if (!websiteUrl || websiteUrl.includes("magicpatterns.com")) {
        websiteUrl = DEFAULT_CONFIG.websiteUrl;
      }

      // Ensure new channel jgjghjghh687 is included
      let channels = Array.isArray(parsed.channels) ? [...parsed.channels] : [...DEFAULT_CONFIG.channels];
      if (!channels.some((c: any) => c.username?.toLowerCase() === 'jgjghjghh687' || c.url?.includes('jgjghjghh687'))) {
        channels.push(DEFAULT_CONFIG.channels[2]);
      }

      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        channels,
        websiteUrl,
        messages: { ...DEFAULT_CONFIG.messages, ...(parsed.messages || {}) },
        buttons: { ...DEFAULT_CONFIG.buttons, ...(parsed.buttons || {}) },
        gemini: { 
          ...DEFAULT_CONFIG.gemini, 
          ...(parsed.gemini || {}),
          systemInstruction: DEFAULT_CONFIG.gemini.systemInstruction,
          maxChars: 300,
        },
      };
    }
  } catch (e) {
    console.warn("Failed to load config from localStorage", e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfigToStorage(config: BotConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save config to localStorage", e);
  }
}
