import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Smartphone, 
  Layers, 
  RotateCw, 
  Check, 
  Sparkles,
  Info,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { BotConfig, Language, ButtonLabels } from '../../types/botConfig';
import { translations } from '../../utils/translations';

interface WebAppTabProps {
  config: BotConfig;
  onUpdateUrl: (url: string) => void;
  onUpdateButtons: (buttons: ButtonLabels) => void;
  lang: Language;
}

export const WebAppTab: React.FC<WebAppTabProps> = ({
  config,
  onUpdateUrl,
  onUpdateButtons,
  lang,
}) => {
  const t = translations[lang].webappTab;
  const [iframeKey, setIframeKey] = useState(0);

  const handleButtonChange = (key: keyof ButtonLabels, val: string) => {
    onUpdateButtons({
      ...config.buttons,
      [key]: val,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#FF8E00]" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: URL & Buttons Configuration (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Website URL */}
          <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                {t.urlLabel}
              </label>
              <a
                href={config.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#FF8E00] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{lang === 'bn' ? 'ব্রাউজারে খুলুন' : 'Open in Browser'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type="url"
                value={config.websiteUrl}
                onChange={(e) => onUpdateUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-[#FF8E00]"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              {lang === 'bn' 
                ? 'ব্যবহারকারী সকল চ্যানেলে যুক্ত হওয়ার পর এই ওয়েব লিঙ্কটি টেলিগ্রামের মধ্যে স্লাইড-আপ মিনি অ্যাপ হিসেবে উন্মুক্ত হবে।' 
                : 'This URL loads directly inside the Telegram client as a WebAppInfo slide-up mini app frame.'}
            </p>

            {/* Auto-Sync Everywhere Verification */}
            <div className="pt-3 border-t border-[#1C283E] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Zap className="w-3.5 h-3.5 fill-emerald-400/20 text-emerald-400" />
                <span>
                  {lang === 'bn' 
                    ? '⚡ এই লিংক পরিবর্তন করলে স্বয়ংক্রিয়ভাবে নিচের সব জায়গায় সক্রিয় হবে:' 
                    : '⚡ Changing this link auto-syncs across all components:'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 bg-[#0A101C] px-2.5 py-1.5 rounded-lg border border-[#1E2B40]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>{lang === 'bn' ? '🚀 /start ভেরিফাইড বাটন' : '🚀 /start Verified Button'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0A101C] px-2.5 py-1.5 rounded-lg border border-[#1E2B40]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>{lang === 'bn' ? '🤖 Gemini AI উত্তর বাটন' : '🤖 Gemini AI Replies'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0A101C] px-2.5 py-1.5 rounded-lg border border-[#1E2B40]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>{lang === 'bn' ? '📢 ব্রডকাস্ট ডিফল্ট বাটন' : '📢 Broadcast Campaigns'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0A101C] px-2.5 py-1.5 rounded-lg border border-[#1E2B40]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>{lang === 'bn' ? '📱 টেলিগ্রাম মেনু বাটন (setChatMenuButton)' : '📱 Chat Menu Button'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0A101C] px-2.5 py-1.5 rounded-lg border border-[#1E2B40]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>{lang === 'bn' ? '🖥️ টেলিগ্রাম সিমুলেটর' : '🖥️ Telegram Simulator'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0A101C] px-2.5 py-1.5 rounded-lg border border-[#1E2B40]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>{lang === 'bn' ? '📦 Python Bot এক্সপোর্ট কোড' : '📦 Python Bot Export'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Button Labels Customization */}
          <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C0FF6F]" />
              <span>{lang === 'bn' ? 'বাটনের টেক্সট ও আইকন কাস্টমাইজেশন' : 'Button Labels & Icons'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Menu Button Text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  {t.menuBtnLabel}
                </label>
                <input
                  type="text"
                  value={config.buttons.menuButtonText}
                  onChange={(e) => handleButtonChange('menuButtonText', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-white"
                />
                <span className="text-[11px] text-slate-400">
                  set_chat_menu_button(MenuButtonWebApp)
                </span>
              </div>

              {/* Verify Button Text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  {t.verifyBtnLabel}
                </label>
                <input
                  type="text"
                  value={config.buttons.verifyButtonText}
                  onChange={(e) => handleButtonChange('verifyButtonText', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-white"
                />
                <span className="text-[11px] text-slate-400">
                  callback_data="verify"
                </span>
              </div>

              {/* Verified Launch Text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  {t.launchBtnLabel}
                </label>
                <input
                  type="text"
                  value={config.buttons.verifiedLaunchText}
                  onChange={(e) => handleButtonChange('verifiedLaunchText', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-white"
                />
                <span className="text-[11px] text-slate-400">
                  InlineKeyboardButton(web_app=WebAppInfo)
                </span>
              </div>

              {/* Reply Keyboard Text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  {t.replyBtnLabel}
                </label>
                <input
                  type="text"
                  value={config.buttons.replyMenuText}
                  onChange={(e) => handleButtonChange('replyMenuText', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-white"
                />
                <span className="text-[11px] text-slate-400">
                  KeyboardButton(web_app=WebAppInfo)
                </span>
              </div>
            </div>
          </div>

          {/* Mini App Integration Tips */}
          <div className="p-4 rounded-xl bg-[#152136] border border-[#233554] text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <Info className="w-4 h-4 text-[#FF8E00]" />
              <span>{lang === 'bn' ? 'টেলিগ্রাম মিনি অ্যাপের টিপস:' : 'Telegram Mini App Integration:'}</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              {lang === 'bn'
                ? 'টেলিগ্রাম ক্লায়েন্টে মিনি অ্যাপ লোড হলে window.Telegram.WebApp অবজেক্ট সক্রিয় থাকে। এটি ব্যবহার করে আপনি ইউজারের Telegram User ID, Username, Theme প্যারামিটার রিড করতে পারবেন।'
                : 'When running inside Telegram WebApp, the window.Telegram.WebApp SDK provides the user’s Telegram ID, name, theme colors, and haptic feedback.'}
            </p>
          </div>
        </div>

        {/* Right Column: Live Mobile Mockup Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#C0FF6F]" />
              <span>{t.previewTitle}</span>
            </span>
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Reload'}</span>
            </button>
          </div>

          {/* Phone Frame */}
          <div className="mx-auto max-w-[340px] rounded-[32px] border-[5px] border-[#222E42] bg-[#0E131E] shadow-2xl overflow-hidden flex flex-col h-[520px]">
            {/* Phone Top Notch Bar */}
            <div className="bg-[#121A28] px-4 py-2 flex items-center justify-between text-[11px] text-slate-300 border-b border-[#1E2B40]">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#C0FF6F]"></span>
                <span className="font-semibold truncate">{config.buttons.menuButtonText}</span>
              </div>
              <span className="text-[10px] text-slate-400">Mini App</span>
            </div>

            {/* Iframe or WebApp representation */}
            <div className="flex-1 bg-slate-900 relative overflow-hidden">
              {config.websiteUrl ? (
                <iframe
                  key={iframeKey}
                  src={config.websiteUrl}
                  title="Telegram WebApp Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="h-full flex items-center justify-center p-6 text-center text-slate-500 text-xs">
                  {lang === 'bn' ? 'কোনো URL কনফিগার করা নেই' : 'No WebApp URL configured'}
                </div>
              )}
            </div>

            {/* Phone Bottom Bar */}
            <div className="bg-[#121A28] p-2 text-center border-t border-[#1E2B40]">
              <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
