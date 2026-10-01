import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  ExternalLink, 
  Radio, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Users
} from 'lucide-react';
import { Language } from '../types/botConfig';

interface LiveBotStatusProps {
  lang: Language;
}

interface RunnerState {
  ok: boolean;
  isRunning: boolean;
  tokenPrefix: string;
  stats: { starts: number; verifies: number; broadcasts: number; errors: number };
  logs: Array<{ id: string; time: string; type: string; message: string }>;
  botUsername: string;
  botName: string;
}

export const LiveBotStatus: React.FC<LiveBotStatusProps> = ({ lang }) => {
  const [state, setState] = useState<RunnerState | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bot-runner/status');
      const data = await res.json();
      setState(data);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    if (!state) return;
    setIsToggling(true);
    try {
      const res = await fetch('/api/bot-runner/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !state.isRunning }),
      });
      const data = await res.json();
      setState((prev) => prev ? { ...prev, isRunning: data.isRunning } : null);
    } catch {}
    setIsToggling(false);
  };

  if (!state) return null;

  return (
    <div className="rounded-xl border border-[#222E45] bg-[#121927] overflow-hidden shadow-lg">
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Live Indicator & Bot Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF8E00] to-[#C0FF6F] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#121927] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#C0FF6F]" />
              </div>
            </div>
            {state.isRunning && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#C0FF6F] rounded-full border-2 border-[#121927] animate-pulse"></span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white truncate">
                {state.botName || 'Photo Cash 📸💸'}
              </span>
              <a
                href={`https://t.me/${state.botUsername || 'PhotoCash12_bot'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#C0FF6F] bg-[#172535] px-2 py-0.5 rounded border border-[#263C54] hover:underline inline-flex items-center gap-1"
              >
                <span>@{state.botUsername || 'PhotoCash12_bot'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  state.isRunning
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {state.isRunning ? (lang === 'bn' ? '🟢 লাইভ সক্রিয় (Live Online)' : '🟢 Live Online') : (lang === 'bn' ? '🔴 বন্ধ (Stopped)' : '🔴 Stopped')}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {lang === 'bn'
                ? `লাইভ অ্যাক্টিভিটি: ${state.stats.starts} টি /start মেসেজ হ্যান্ডেল করা হয়েছে`
                : `Live Telegram listener active: handled ${state.stats.starts} /start commands`}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <a
            href={`https://t.me/${state.botUsername || 'PhotoCash12_bot'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-[#FF8E00] text-slate-950 font-bold text-xs hover:bg-[#ffa02b] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>{lang === 'bn' ? 'টেলিগ্রামে টেস্ট করুন' : 'Test Live in Telegram'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="px-3 py-1.5 rounded-lg bg-[#182337] border border-[#2A3B57] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {state.isRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-[#C0FF6F]" />}
            <span>{state.isRunning ? (lang === 'bn' ? 'পজ' : 'Pause') : (lang === 'bn' ? 'রান' : 'Run')}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-lg bg-[#182337] border border-[#2A3B57] text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
          >
            {isExpanded ? (lang === 'bn' ? 'লগ লুকান' : 'Hide Logs') : (lang === 'bn' ? 'লাইভ লগ' : 'View Logs')}
          </button>
        </div>
      </div>

      {/* Collapsible Live Telegram Logs Stream */}
      {isExpanded && (
        <div className="border-t border-[#1C273C] bg-[#0A0E17] p-3 font-mono text-[11px] space-y-1.5 max-h-56 overflow-y-auto">
          <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between font-sans text-xs">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#C0FF6F]" />
              <span>Real-Time Telegram Event Stream</span>
            </span>
            <span className="text-[10px] text-slate-500">Auto-polling every 3s</span>
          </div>

          {state.logs.length === 0 ? (
            <div className="text-slate-500 py-3 text-center">No events yet. Open bot in Telegram and send /start</div>
          ) : (
            state.logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'user'
                      ? 'text-[#C0FF6F]'
                      : log.type === 'verify'
                      ? 'text-[#FF8E00]'
                      : log.type === 'error'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
