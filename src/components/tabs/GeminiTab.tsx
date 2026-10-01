import React, { useState } from 'react';
import { 
  Sparkles, 
  KeyRound, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Bot, 
  Sliders, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { GeminiConfig, Language } from '../../types/botConfig';

interface GeminiTabProps {
  gemini: GeminiConfig;
  websiteUrl: string;
  onUpdateGemini: (gemini: GeminiConfig) => void;
  lang: Language;
}

export const GeminiTab: React.FC<GeminiTabProps> = ({
  gemini,
  websiteUrl,
  onUpdateGemini,
  lang,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [testInput, setTestInput] = useState('ফটো আপলোড করে কিভাবে ইনকাম করব?');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestChat = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    setTestError(null);
    setTestOutput(null);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testInput.trim(),
          apiKey: gemini.apiKey,
          systemInstruction: gemini.systemInstruction,
          maxChars: gemini.maxChars || 300,
        }),
      });

      const data = await res.json();
      if (data.ok && data.text) {
        setTestOutput(data.text);
      } else {
        setTestError(data.error || 'Failed to generate response');
      }
    } catch (e: any) {
      setTestError(e.message || 'Network error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C0FF6F]" />
          <span>{lang === 'bn' ? 'Gemini AI চ্যাটবট কনফিগারেশন' : 'Gemini AI Assistant Configuration'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {lang === 'bn'
            ? 'ইউজার মেসেজ দিলে চ্যানেল ভেরিফাই করে Gemini AI স্বয়ংক্রিয়ভাবে Photo Cash ফটো-আপলোড ইনকাম, উইথড্র ও রেফার নিয়ে উত্তর দিবে (সাধারণ প্রশ্ন ১২০ অক্ষর, বিস্তারিত সর্বোচ্চ ৩০০ অক্ষর)।'
            : 'Enforces channel verification first, replies using Gemini AI (120-300 chars, no raw links) with Mini App button.'}
        </p>
      </div>

      {/* Verification Rule Notice Callout */}
      <div className="p-4 rounded-xl bg-[#142232] border border-[#233A52] flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-[#C0FF6F] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200 space-y-1">
          <p className="font-bold text-white">
            {lang === 'bn' ? '🔒 চ্যানেল ভেরিফিকেশন, নো-লিঙ্ক ও এআই সিকিউরিটি রুল:' : '🔒 Channel Verification & AI Security Rules:'}
          </p>
          <p className="leading-relaxed text-slate-300">
            {lang === 'bn'
              ? 'ইউজার বটে যেকোনো মেসেজ পাঠালে সিস্টেম প্রথমে চ্যানেল ভেরিফিকেশন যাচাই করবে। জয়েন না থাকলে চ্যাটের সব মেসেজ ডিলিট হয়ে যাবে এবং মিনি অ্যাপ বা এআই লক থাকবে। জয়েন থাকলে এআই উত্তরে কখনোই সরাসরি কোনো লিঙ্ক দিবে না (শুধুমাত্র নিচের বাটন দিয়ে মিনি অ্যাপে পাঠাবে) এবং সাধারণ উত্তরে ১২০ অক্ষর, বিস্তারিত ব্যাখ্যায় সর্বোচ্চ ৩০০ অক্ষরের মধ্যে উত্তর দিবে।'
              : 'The bot checks channel membership first on every message. Unverified users get chat cleared and blocked. AI replies never contain raw links and adhere to 120-300 char limits.'}
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-4">
            {/* Gemini API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#FF8E00]" />
                  <span>Gemini AI API Key</span>
                </label>
                <span className="text-[10px] text-[#C0FF6F] font-mono">Google GenAI Active</span>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={gemini.apiKey}
                  onChange={(e) => onUpdateGemini({ ...gemini, apiKey: e.target.value })}
                  placeholder="Enter Gemini API Key..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-[#C0FF6F]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model & Max Length */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  {lang === 'bn' ? 'এআই মডেল (Model)' : 'AI Model'}
                </label>
                <input
                  type="text"
                  value={gemini.model || 'gemini-3.8-flash'}
                  onChange={(e) => onUpdateGemini({ ...gemini, model: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-xs font-mono text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'সর্বোচ্চ অক্ষরের সীমা' : 'Max Character Limit'}</span>
                  <span className="text-[#FF8E00] font-mono">{gemini.maxChars || 120} chars</span>
                </label>
                <input
                  type="number"
                  min={30}
                  max={500}
                  value={gemini.maxChars || 120}
                  onChange={(e) => onUpdateGemini({ ...gemini, maxChars: Number(e.target.value) || 120 })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Mini App Button Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                {lang === 'bn' ? 'এআই উত্তরের নিচের বাটন টেক্সট' : 'Attached Mini App Button Text'}
              </label>
              <input
                type="text"
                value={gemini.aiButtonText || '🌐 Mini App খুলুন'}
                onChange={(e) => onUpdateGemini({ ...gemini, aiButtonText: e.target.value })}
                placeholder="e.g. 🌐 Mini App খুলুন"
                className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-xs text-white"
              />
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? `লিংক: ${websiteUrl}` : `Target: ${websiteUrl}`}
              </span>
            </div>

            {/* System Persona / Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  {lang === 'bn' ? 'এআই নির্দেশিকা ও পারসোনা (System Prompt)' : 'System Persona & Prompt'}
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Photo Cash Persona</span>
              </div>
              <textarea
                rows={5}
                value={gemini.systemInstruction}
                onChange={(e) => onUpdateGemini({ ...gemini, systemInstruction: e.target.value })}
                className="w-full p-3 rounded-lg bg-[#0E1420] border border-[#263753] text-xs text-slate-100 font-mono leading-relaxed focus:outline-hidden focus:border-[#C0FF6F]"
              />
              <span className="text-[11px] text-slate-400 leading-relaxed block">
                {lang === 'bn' 
                  ? 'ইউজার যেকোনো কথা বললে এআই উত্তর দিবে Photo Cash ইনকাম প্ল্যাটফর্ম ও ছবি আপলোড নিয়ে এবং ১২০ অক্ষরের মধ্যে সীমাবদ্ধ থাকবে।'
                  : 'Instructs Gemini to answer any query while relating back to Photo Cash earning within 120 characters.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live AI Test Playground (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#C0FF6F]" />
                <span>{lang === 'bn' ? 'লাইভ এআই টেস্ট চ্যাট' : 'Live AI Test Chat'}</span>
              </span>
              <span className="text-[10px] text-slate-400">Real Gemini API</span>
            </h3>

            {/* Test Input */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">
                {lang === 'bn' ? 'ইউজার যে প্রশ্ন করবে:' : 'User Question:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-[#C0FF6F]"
                />
                <button
                  type="button"
                  onClick={handleTestChat}
                  disabled={isTesting || !testInput.trim()}
                  className="px-3 py-2 rounded-lg bg-[#C0FF6F] text-slate-950 font-bold text-xs hover:bg-[#d0ff88] disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? '...' : (lang === 'bn' ? 'টেস্ট' : 'Test')}</span>
                </button>
              </div>

              {/* Sample quick prompts */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'আমি কি কাজ করব?',
                  'টাকা কিভাবে তুলব?',
                  'কত টাকা ইনকাম হবে?',
                  'হ্যালো কেমন আছেন?'
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => { setTestInput(q); }}
                    className="px-2 py-0.5 rounded bg-[#162030] hover:bg-[#1E2C44] text-[10px] text-slate-300 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {testError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            {/* Live Rendered Telegram Chat Bubble Preview */}
            <div className="pt-2 border-t border-[#1C273C]">
              <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center justify-between">
                <span>{lang === 'bn' ? 'টেলিগ্রাম চ্যাট প্রিভিউ' : 'Telegram Preview'}</span>
                {testOutput && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    testOutput.length <= (gemini.maxChars || 120) 
                      ? 'bg-emerald-500/20 text-[#C0FF6F]' 
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {testOutput.length} / {gemini.maxChars || 120} chars
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-[#222E45] bg-[#0E1420] p-4 tg-bg-pattern min-h-[200px] flex flex-col justify-end space-y-2">
                {/* AI Bubble */}
                <div className="telegram-bubble-in p-3.5 shadow-md border border-[#2b3952]/40 relative text-xs">
                  <div className="text-[11px] font-bold text-[#FF8E00] mb-1 flex items-center justify-between">
                    <span>Photo Cash 📸💸</span>
                    <span className="text-[9px] text-slate-400 font-normal">bot</span>
                  </div>

                  <p className="leading-relaxed text-slate-100">
                    {testOutput || (lang === 'bn' ? 'Photo Cash-এ ছবি আপলোড করে সহজে আয় ও টাকা তুলুন। বিস্তারিত জানতে আজই ওয়েবসাইটে আসুন!' : 'Earn money by uploading photos on Photo Cash! Open the mini app to learn more.')}
                  </p>

                  <div className="text-right text-[9px] text-slate-400 mt-1.5">
                    Just now
                  </div>
                </div>

                {/* Attached Mini App Button */}
                <div>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded-lg bg-[#283854]/95 text-center text-xs font-bold text-[#C0FF6F] shadow-xs hover:bg-[#324566] transition-colors border border-emerald-500/30"
                  >
                    {gemini.aiButtonText || '🌐 Mini App খুলুন'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
