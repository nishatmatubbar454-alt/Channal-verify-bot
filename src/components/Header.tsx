import React, { useState } from 'react';
import { 
  Bot, 
  Download, 
  Save, 
  RotateCcw, 
  ExternalLink,
  Square,
  Play
} from 'lucide-react';
import { BotConfig, Language } from '../types/botConfig';
import { translations } from '../utils/translations';
import { downloadProjectZip } from '../utils/zipExporter';

interface HeaderProps {
  config: BotConfig;
  lang: Language;
  setLang: (lang: Language) => void;
  onSave: () => void;
  onReset: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isValidToken: boolean | null;
  isRunning?: boolean;
  onToggleRunning?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  lang,
  setLang,
  onSave,
  onReset,
  hasUnsavedChanges,
  isSaving,
  isValidToken,
  isRunning = true,
  onToggleRunning,
}) => {
  const t = translations[lang];
  const botUsername = config.botInfo?.username || 'PhotoCash12_bot';
  const botName = config.botInfo?.first_name || 'Photo Cash';

  return (
    <header className="border-b border-[#1A2538] bg-[#0A0F1A]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-3">
        {/* Left: Bot Logo, Badge & Username (Matches Screenshot) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0D1527] rounded-[14px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#60A5FA]" />
              </div>
            </div>
            {/* Live Green Status Dot on bottom-right corner of avatar */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0A0F1A] ${
                isRunning ? 'bg-[#10B981] animate-pulse' : 'bg-rose-500'
              }`}
              title={isRunning ? 'Bot is Live' : 'Bot is Stopped'}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {botName}
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-950/60 text-sky-400 border border-sky-500/30 font-semibold">
                v2.5
              </span>
            </div>
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#38BDF8] hover:text-[#7dd3fc] inline-flex items-center gap-1 mt-0.5 hover:underline"
            >
              <span>@{botUsername}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* Right: Actions matching screenshot */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* 1. Bot Toggle: "■ বট বন্ধ" / "▶ বট চালু" (Matches Screenshot) */}
          <button
            onClick={onToggleRunning}
            type="button"
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-[#2D101E] border border-rose-800/60 text-rose-300 hover:bg-[#3D1429]'
                : 'bg-[#102D1E] border border-emerald-800/60 text-emerald-300 hover:bg-[#143D29]'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
                <span>{lang === 'bn' ? 'বট বন্ধ' : 'Stop Bot'}</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                <span>{lang === 'bn' ? 'বট চালু' : 'Start Bot'}</span>
              </>
            )}
          </button>

          {/* 2. Open Telegram Bot Link: [↗] */}
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            title={lang === 'bn' ? 'টেলিগ্রামে বট খুলুন' : 'Open in Telegram'}
            className="p-2 sm:p-2.5 rounded-xl bg-[#131D30] border border-[#22314C] text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* 3. Export Project ZIP: [↓] */}
          <button
            onClick={() => downloadProjectZip(config)}
            title={lang === 'bn' ? 'প্রোজেক্ট কোড ডাউনলোড করুন' : 'Export Project ZIP'}
            className="p-2 sm:p-2.5 rounded-xl bg-[#131D30] border border-[#22314C] text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Save Button (Prominent when unsaved changes exist) */}
          {hasUnsavedChanges && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-[#FF8E00] text-slate-950 hover:bg-[#ffa02b] shadow-md shadow-[#FF8E00]/25 flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSaving ? '...' : (lang === 'bn' ? 'সেভ করুন *' : 'Save *')}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="hidden md:flex items-center bg-[#131D30] border border-[#22314C] rounded-xl p-0.5 text-xs font-medium">
            <button
              onClick={() => setLang('bn')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                lang === 'bn' ? 'bg-[#FF8E00] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                lang === 'en' ? 'bg-[#FF8E00] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

