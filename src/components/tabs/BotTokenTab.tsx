import React, { useState } from 'react';
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Server
} from 'lucide-react';
import { BotConfig, Language } from '../../types/botConfig';
import { translations } from '../../utils/translations';

interface BotTokenTabProps {
  config: BotConfig;
  onChangeToken: (token: string) => void;
  lang: Language;
  onVerifyToken: (token: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  isValidToken: boolean | null;
}

export const BotTokenTab: React.FC<BotTokenTabProps> = ({
  config,
  onChangeToken,
  lang,
  onVerifyToken,
  isValidToken,
}) => {
  const t = translations[lang].tokenTab;
  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTestToken = async () => {
    if (!config.botToken.trim()) return;
    setIsVerifying(true);
    setVerifyResult(null);

    const res = await onVerifyToken(config.botToken.trim());
    setVerifyResult(res);
    setIsVerifying(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#FF8E00]" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Main Token Input Card */}
      <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 sm:p-6 space-y-4">
        <label className="block text-xs font-semibold text-slate-200">
          {t.inputLabel}
        </label>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type={showToken ? 'text' : 'password'}
              value={config.botToken}
              onChange={(e) => onChangeToken(e.target.value)}
              placeholder="e.g. 7123456789:AAFoX79j..."
              className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-[#FF8E00] focus:ring-1 focus:ring-[#FF8E00] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestToken}
              disabled={isVerifying || !config.botToken.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#FF8E00] text-slate-950 font-bold text-xs hover:bg-[#ffa02b] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? translations[lang].testing : (lang === 'bn' ? 'টোকেন টেস্ট করুন' : 'Test Token API')}</span>
            </button>
          </div>
        </div>

        {/* Verification Status Card */}
        {verifyResult && (
          <div className={`p-4 rounded-lg border text-xs leading-relaxed transition-all ${
            verifyResult.success 
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
          }`}>
            <div className="flex items-start gap-2.5">
              {verifyResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#C0FF6F] flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <div className="font-bold text-white text-sm">
                  {verifyResult.success 
                    ? (lang === 'bn' ? 'টেলিগ্রাম বটের সাথে সফলভাবে সংযোগ স্থাপিত হয়েছে!' : 'Successfully Connected to Telegram Bot!')
                    : (lang === 'bn' ? 'টোকেন ভেরিফিকেশন ব্যর্থ হয়েছে' : 'Token Verification Failed')}
                </div>
                <div>
                  {verifyResult.success ? (
                    <div className="mt-2 space-y-1 text-slate-200">
                      <div><strong className="text-white">Bot Name:</strong> {verifyResult.data?.first_name}</div>
                      <div><strong className="text-white">Username:</strong> @{verifyResult.data?.username}</div>
                      <div><strong className="text-white">Bot ID:</strong> {verifyResult.data?.id}</div>
                      <div><strong className="text-white">Can Join Groups:</strong> {verifyResult.data?.can_join_groups ? 'Yes' : 'No'}</div>
                    </div>
                  ) : (
                    <div className="text-rose-300 mt-1">
                      {verifyResult.error || (lang === 'bn' ? 'টেলিগ্রাম API টোকেনটি গ্রহণ করেনি। অনুগ্রহ করে নিশ্চিত করুন টোকেনটি সঠিক।' : 'Telegram API rejected the token. Make sure it is copied correctly from @BotFather.')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Warning */}
        <div className="p-3.5 rounded-lg bg-[#162030] border border-[#23334C] flex items-start gap-3 text-xs text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            {lang === 'bn'
              ? 'নিরাপত্তা সতর্কতা: টেলিগ্রাম বট টোকেনটি আপনার গোপন কী (Secret Key)। এটি কাউকে শেয়ার করবেন না। সার্ভারে ডিপ্লয় করার সময় এটি .env ফাইলে BOT_TOKEN হিসেবে ব্যবহৃত হয়।'
              : 'Security Reminder: Keep your Telegram Bot Token secure. In production, it is passed via environment variable (BOT_TOKEN) in your .env file or server dashboard.'}
          </p>
        </div>
      </div>

      {/* Two Column Grid: Connected Details & BotFather Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Bot Card */}
        <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>{t.botDetails}</span>
            <span className="text-[11px] text-[#C0FF6F] font-mono">Telegram API v7.x</span>
          </h3>

          <div className="p-4 rounded-lg bg-[#0E1420] border border-[#1E2B40] space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#1A2538]">
              <span className="text-slate-400">{t.botName}</span>
              <span className="text-white font-semibold">{config.botInfo?.first_name || 'Verification Bot'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1A2538]">
              <span className="text-slate-400">{t.botUsername}</span>
              <span className="text-[#C0FF6F] font-semibold">@{config.botInfo?.username || 'Click2Cash_Robot'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1A2538]">
              <span className="text-slate-400">{t.botId}</span>
              <span className="text-slate-200">{config.botInfo?.id || '7128945623'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Execution Mode:</span>
              <span className="text-emerald-400 font-semibold">Long Polling (dp.start_polling)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            {lang === 'bn' 
              ? 'বটটি শুরু হলে টেলিগ্রামের সকল আপডেট (Updates) স্বয়ংক্রিয়ভাবে হ্যান্ডেল করবে এবং ড্রপ পেন্ডিং অপশন চালু থাকবে।'
              : 'The bot starts polling updates with drop_pending_updates=True enabled in aiogram 3.'}
          </div>
        </div>

        {/* Right: How to Get Token Guide */}
        <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{t.botFatherHelpTitle}</span>
            </h3>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#FF8E00] hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>@BotFather</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <ol className="space-y-2.5 text-xs text-slate-300 list-decimal pl-4">
            {t.botFatherSteps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>

          <div className="pt-2 flex items-center justify-between p-2.5 rounded-lg bg-[#162030] border border-[#22334C]">
            <span className="text-xs text-slate-300 font-mono">/newbot</span>
            <button
              onClick={() => handleCopy('/newbot')}
              className="px-2.5 py-1 rounded bg-[#202E46] hover:bg-[#2A3D5E] text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-[#C0FF6F]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
