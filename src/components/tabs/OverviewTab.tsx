import React, { useState } from 'react';
import { 
  Users, 
  Radio, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert,
  Database,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { BotConfig, Language, ActiveTab } from '../../types/botConfig';
import { TelegramUser } from '../../services/firebase';
import { BroadcastTab } from './BroadcastTab';

interface OverviewTabProps {
  config: BotConfig;
  lang: Language;
  setActiveTab: (tab: ActiveTab) => void;
  isValidToken: boolean | null;
  users: TelegramUser[];
  onRefreshUsers: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  config,
  lang,
  setActiveTab,
  isValidToken,
  users,
  onRefreshUsers,
}) => {
  // Real calculations based ONLY on genuine database users
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(
    (u) => u.status === 'Active' || u.broadcast_status === 'allowed'
  ).length;
  const blockedUsersCount = users.filter(
    (u) => u.status === 'Blocked' || u.broadcast_status === 'blocked'
  ).length;

  return (
    <div className="space-y-4">
      {/* 4 Compact, Beautiful Stat Cards (2 columns on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: মোট বট ইউজার (Real Database Count) */}
        <div className="rounded-xl border border-[#1A2944] bg-[#0D1526]/90 p-3 sm:p-3.5 shadow-md hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-slate-300 truncate">
              {lang === 'bn' ? 'মোট বট ইউজার' : 'Total Bot Users'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0F263D] border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
              {totalUsersCount}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-400 truncate">
            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
            <span>{lang === 'bn' ? 'Firebase ক্লাউড' : 'Firebase Cloud'}</span>
          </div>
        </div>

        {/* Card 2: আজ সক্রিয় ইউজার (Real Active Users) */}
        <div className="rounded-xl border border-[#1A2944] bg-[#0D1526]/90 p-3 sm:p-3.5 shadow-md hover:border-indigo-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-slate-300 truncate">
              {lang === 'bn' ? 'সক্রিয় ইউজার' : 'Active Users'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#181D3D] border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
              {activeUsersCount}
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-indigo-300/80 font-medium truncate">
            {lang === 'bn' ? 'ব্রডকাস্ট গ্রহণকারী' : 'Ready to receive'}
          </div>
        </div>

        {/* Card 3: ব্লকড / আনসাবস্ক্রাইব (Real Blocked Count) */}
        <div className="rounded-xl border border-[#1A2944] bg-[#0D1526]/90 p-3 sm:p-3.5 shadow-md hover:border-rose-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-slate-300 truncate">
              {lang === 'bn' ? 'ব্লকড ইউজার' : 'Blocked Users'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2D121B] border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
              {blockedUsersCount}
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            {blockedUsersCount === 0 
              ? (lang === 'bn' ? 'কোনো ব্লক নেই' : 'No blocks') 
              : (lang === 'bn' ? 'আনসাবস্ক্রাইব' : 'Unsubscribed')}
          </div>
        </div>

        {/* Card 4: রেসপন্স মোড (AI Engine) */}
        <div className="rounded-xl border border-[#1A2944] bg-[#0D1526]/90 p-3 sm:p-3.5 shadow-md hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-slate-300 truncate">
              {lang === 'bn' ? 'রেসপন্স মোড' : 'Response Mode'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#26153B] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <span className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
              <span>🤖 Gemini AI</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-slate-400 truncate">
              {lang === 'bn' ? 'স্মার্ট উত্তর' : 'Smart Replies'}
            </span>
            <button
              onClick={() => setActiveTab('ai')}
              className="text-[#38BDF8] hover:text-[#7dd3fc] font-bold cursor-pointer hover:underline flex items-center gap-0.5"
            >
              <span>{lang === 'bn' ? 'সুইচ' : 'Switch'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Slim Real User Database Quick Indicator */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0B1220] p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">
                {lang === 'bn' ? 'টেলিগ্রাম ব্রডকাস্ট ডাটাবেজ:' : 'Telegram Broadcast DB:'}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                {totalUsersCount} {lang === 'bn' ? 'জন ইউজার' : 'users'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
              <span>
                {users.length > 0 
                  ? users.map(u => u.username ? `@${u.username}` : (u.first_name || u.chat_id)).slice(0, 3).join(', ') + (users.length > 3 ? ` ও আরও ${users.length - 3} জন` : '')
                  : (lang === 'bn' ? 'বটে নতুন ইউজার মেসেজ দিলেই এখানে যুক্ত হবে' : 'Users join upon messaging the bot')}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('users')}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#141F32] border border-[#233552] text-xs font-semibold text-sky-300 hover:text-white hover:bg-[#1B2942] transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          <span>{lang === 'bn' ? 'সব ইউজার দেখুন' : 'View All Users'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Slim Active Mini App Link Status Bar */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0B1220] p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">
                {lang === 'bn' ? 'সক্রিয় মিনি অ্যাপ লিংক:' : 'Active Mini App URL:'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {lang === 'bn' ? 'বট ও ব্রডকাস্টে সক্রিয়' : 'Active Everywhere'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-sky-300/80 truncate mt-0.5 max-w-md sm:max-w-xl">
              {config.websiteUrl}
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('webapp')}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#182338] border border-[#2B3F60] text-xs font-semibold text-amber-300 hover:text-white hover:bg-[#20314E] transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          <span>{lang === 'bn' ? 'লিংক পরিবর্তন করুন' : 'Change Link'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Broadcast System with Gallery Photo Upload directly below */}
      <div>
        <BroadcastTab
          config={config}
          lang={lang}
          users={users}
          onRefreshUsers={onRefreshUsers}
        />
      </div>
    </div>
  );
};
