import React from 'react';
import { 
  Radio, 
  Send,
  Users,
  Sparkles,
  Settings,
  KeyRound,
  Globe,
  MessageSquareCode,
  Smartphone,
  FileCode2
} from 'lucide-react';
import { ActiveTab, Language } from '../types/botConfig';

interface TabsNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  channelsCount: number;
  usersCount?: number;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  setActiveTab,
  lang,
  channelsCount,
  usersCount = 0,
}) => {
  // Primary 3 tabs matching user's screenshot
  const primaryTabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'overview',
      label: lang === 'bn' ? 'ওভারভিউ' : 'Overview',
      icon: <Radio className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'broadcast',
      label: lang === 'bn' ? 'ব্রডকাস্ট ইঞ্জিন' : 'Broadcast Engine',
      icon: <Send className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'users',
      label: lang === 'bn' ? 'ইউজার ডাটাবেজ' : 'User Database',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      badge: usersCount > 0 ? usersCount : undefined,
    },
    {
      id: 'ai',
      label: lang === 'bn' ? 'Gemini AI' : 'Gemini AI',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    },
  ];

  // Secondary configuration tabs
  const configTabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'channels',
      label: lang === 'bn' ? 'চ্যানেল লিংক' : 'Channels',
      icon: <Radio className="w-3.5 h-3.5 text-amber-400" />,
      badge: channelsCount,
    },
    {
      id: 'token',
      label: lang === 'bn' ? 'বট টোকেন' : 'Bot Token',
      icon: <KeyRound className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      id: 'webapp',
      label: lang === 'bn' ? 'মিনি অ্যাপ' : 'Mini App',
      icon: <Globe className="w-3.5 h-3.5 text-sky-400" />,
    },
    {
      id: 'simulator',
      label: lang === 'bn' ? 'সিমুলেটর' : 'Simulator',
      icon: <Smartphone className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'code',
      label: lang === 'bn' ? 'পাইথন কোড' : 'Python Export',
      icon: <FileCode2 className="w-3.5 h-3.5 text-slate-400" />,
    },
  ];

  return (
    <div className="border-b border-[#1A2538] bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-2.5 overflow-x-auto scrollbar-none">
          {/* Main Screenshot Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0" aria-label="Main Tabs">
            {primaryTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#0F2236] text-[#38BDF8] border border-[#1E4566] shadow-md shadow-sky-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-[#121A2B]'
                  }`}
                >
                  <span className={isActive ? 'text-[#38BDF8]' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30'
                          : 'bg-[#162032] text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Config Pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pl-3 border-l border-[#1A2538]">
            <span className="text-[11px] text-slate-500 font-medium hidden lg:inline mr-1">
              {lang === 'bn' ? 'সেটিংস:' : 'Config:'}
            </span>
            {configTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#182337] text-white border border-[#2B3E5E]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#111726]'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#182337] text-amber-400 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
