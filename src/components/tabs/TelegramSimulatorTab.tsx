import React, { useState } from 'react';
import { 
  Smartphone, 
  Monitor, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Radio, 
  ExternalLink,
  Bot,
  User,
  Sparkles,
  Layers
} from 'lucide-react';
import { BotConfig, Language } from '../../types/botConfig';
import { translations } from '../../utils/translations';
import { MiniAppModal } from '../MiniAppModal';

interface TelegramSimulatorTabProps {
  config: BotConfig;
  lang: Language;
  onUserStart?: (chat_id: number, username: string, first_name: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  type?: 'start' | 'join_first' | 'verified' | 'not_joined' | 'menu_pointer' | 'menu_command';
  hasInlineButtons?: boolean;
  inlineType?: 'channels' | 'verified_launch';
  hasReplyMarkup?: boolean;
}

export const TelegramSimulatorTab: React.FC<TelegramSimulatorTabProps> = ({
  config,
  lang,
  onUserStart,
}) => {
  const t = translations[lang].simulator;

  // View mode: mobile or desktop
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  // Mini App sheet state
  const [miniAppOpen, setMiniAppOpen] = useState(false);

  // Channels user has simulated joining
  const [joinedChannelIds, setJoinedChannelIds] = useState<Set<string>>(new Set());

  // Chat conversation history
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'user',
      text: '/start',
      time: '10:00 AM',
      type: 'start',
    },
    {
      id: 'msg-2',
      sender: 'bot',
      text: config.messages.msgJoinFirst,
      time: '10:00 AM',
      type: 'join_first',
      hasInlineButtons: true,
      inlineType: 'channels',
    },
  ]);

  // Persistent reply keyboard visible after verification
  const [showReplyKeyboard, setShowReplyKeyboard] = useState(false);
  const [userInput, setUserInput] = useState('');

  const restartChat = () => {
    setJoinedChannelIds(new Set());
    setShowReplyKeyboard(false);

    if (onUserStart) {
      onUserStart(712894562, 'simulator_user', 'Simulator User');
    }

    setChatHistory([
      {
        id: `msg-${Date.now()}-1`,
        sender: 'user',
        text: '/start',
        time: '10:00 AM',
        type: 'start',
      },
      {
        id: `msg-${Date.now()}-2`,
        sender: 'bot',
        text: config.messages.msgJoinFirst,
        time: '10:00 AM',
        type: 'join_first',
        hasInlineButtons: true,
        inlineType: 'channels',
      },
    ]);
  };

  const toggleChannelJoin = (channelId: string) => {
    setJoinedChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const simulateJoinAll = () => {
    setJoinedChannelIds(new Set(config.channels.map((c) => c.id)));
  };

  const simulateLeaveAll = () => {
    setJoinedChannelIds(new Set());
  };

  // Handle clicking "✅ Verify" button
  const handleVerifyClick = () => {
    const allJoined = config.channels.every((c) => joinedChannelIds.has(c.id));
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (allJoined) {
      // All channels verified: clear chat history and show verified welcome with Mini App launch
      setChatHistory([
        {
          id: `verify-msg-${Date.now()}`,
          sender: 'bot',
          text: config.messages.msgVerified,
          time: nowTime,
          type: 'verified',
          hasInlineButtons: true,
          inlineType: 'verified_launch',
        },
      ]);
      setShowReplyKeyboard(true);
    } else {
      // Not joined all: clear chat messages and prompt channels
      setChatHistory([
        {
          id: `not-joined-${Date.now()}`,
          sender: 'bot',
          text: config.messages.msgNotJoined,
          time: nowTime,
          type: 'not_joined',
          hasInlineButtons: true,
          inlineType: 'channels',
        },
      ]);
    }
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const text = userInput.trim();
    setUserInput('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (text === '/start') {
      restartChat();
      return;
    }

    if (text === '/menu') {
      setChatHistory((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: 'user', text, time: nowTime },
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lang === 'bn' ? '👇 নিচের বাটন থেকে নির্বাচন করুন:' : '👇 Choose an option below:',
          time: nowTime,
          hasReplyMarkup: true,
        },
      ]);
      setShowReplyKeyboard(true);
      return;
    }

    // Check if user has joined all required channels
    const allJoined = config.channels.every((c) => joinedChannelIds.has(c.id));

    if (!allJoined) {
      // User has NOT joined channels: wipe previous chat messages & prompt to join channels (Mini App blocked)
      setChatHistory([
        {
          id: `bot-block-${Date.now()}`,
          sender: 'bot',
          text: config.messages.msgJoinFirst,
          time: nowTime,
          type: 'join_first',
          hasInlineButtons: true,
          inlineType: 'channels',
        },
      ]);
      return;
    }

    // User HAS verified channels: call Gemini AI
    const tempBotId = `ai-bot-${Date.now()}`;
    setChatHistory((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text, time: nowTime },
      {
        id: tempBotId,
        sender: 'bot',
        text: '<i>Typing...</i>',
        time: nowTime,
      },
    ]);

    // Fetch real Gemini response
    fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        apiKey: config.gemini?.apiKey,
        systemInstruction: config.gemini?.systemInstruction,
        maxChars: config.gemini?.maxChars || 300,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const aiText = data.text || 'Photo Cash-এ ছবি আপলোড করে ইনকাম করুন! বিস্তারিত জানতে নিচে মিনি অ্যাপ ওপেন করুন।';
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === tempBotId
              ? {
                  ...msg,
                  text: aiText,
                  hasInlineButtons: true,
                  inlineType: 'verified_launch',
                }
              : msg
          )
        );
      })
      .catch(() => {
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === tempBotId
              ? {
                  ...msg,
                  text: 'Photo Cash-এ ফটো আপলোড করে ইনকাম করুন! বিস্তারিত জানতে নিচে ক্লিক করুন।',
                  hasInlineButtons: true,
                  inlineType: 'verified_launch',
                }
              : msg
          )
        );
      });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#C0FF6F]" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Viewport switch and reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#151D2C] border border-[#222E42] rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'mobile' ? 'bg-[#FF8E00] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'desktop' ? 'bg-[#FF8E00] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={restartChat}
            className="px-3 py-1.5 rounded-lg bg-[#182337] border border-[#263753] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FF8E00]" />
            <span>{t.restartBtn}</span>
          </button>
        </div>
      </div>

      {/* Simulator Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Simulation Control Box (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF8E00]" />
              <span>{lang === 'bn' ? 'সিমুলেশন কন্ট্রোল ও চ্যানেল স্ট্যাটাস' : 'Simulation Channel States'}</span>
            </h3>

            <p className="text-xs text-slate-300">
              {t.toggleJoinTip}
            </p>

            {/* Quick Bulk Simulation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={simulateJoinAll}
                className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 text-xs font-medium transition-colors cursor-pointer"
              >
                {t.simulateJoinAll}
              </button>
              <button
                onClick={simulateLeaveAll}
                className="flex-1 py-1.5 px-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 text-xs font-medium transition-colors cursor-pointer"
              >
                {t.simulateLeaveAll}
              </button>
            </div>

            {/* Channels Checklist */}
            <div className="space-y-2 pt-1">
              {config.channels.map((channel) => {
                const isJoined = joinedChannelIds.has(channel.id);
                return (
                  <div
                    key={channel.id}
                    onClick={() => toggleChannelJoin(channel.id)}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isJoined
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-[#162030] border-[#22314A] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isJoined ? (
                        <CheckCircle2 className="w-4 h-4 text-[#C0FF6F] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{channel.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{channel.username}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isJoined ? 'bg-emerald-500/20 text-[#C0FF6F]' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isJoined ? t.joined : t.notJoined}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-[#1C273C]">
              {lang === 'bn'
                ? 'টিপস: উপরের যেকোনো চ্যানেলে ক্লিক করে জয়েন/আনজয়েন টগল করুন, এরপর ডানের চ্যাটে "✅ Verify" বাটনে ক্লিক করে ফলাফল দেখুন!'
                : 'Tip: Toggle channels above, then click "✅ Verify" inside the chat frame to test real logic flow.'}
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Telegram Client Frame (8 Cols) */}
        <div className="lg:col-span-8 flex justify-center">
          <div
            className={`w-full relative rounded-[32px] border-[6px] border-[#1D273B] bg-[#0E1420] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              viewMode === 'mobile' ? 'max-w-[420px] h-[640px]' : 'max-w-2xl h-[640px]'
            }`}
          >
            {/* Telegram Header */}
            <div className="bg-[#182337] px-4 py-3 flex items-center justify-between border-b border-[#233554] flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF8E00] to-[#C0FF6F] p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-[#182337] rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {config.botInfo?.first_name ? config.botInfo.first_name[0] : 'B'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{config.botInfo?.first_name || 'Click2Cash Bot'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">bot</span>
                  </div>
                  <div className="text-[10px] text-[#C0FF6F]">online</div>
                </div>
              </div>

              {/* Bot username info */}
              <div className="text-[11px] font-mono text-slate-400">
                @{config.botInfo?.username || 'Click2Cash_Robot'}
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 tg-bg-pattern relative">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 shadow-md relative text-xs sm:text-sm ${
                      msg.sender === 'user' ? 'telegram-bubble-out' : 'telegram-bubble-in border border-[#2b3952]/40'
                    }`}
                  >
                    {/* Render message HTML content */}
                    <div
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                    />
                    <div className="text-right text-[9px] text-slate-300/70 mt-1">
                      {msg.time}
                    </div>
                  </div>

                  {/* Inline Buttons attached to Bot Message */}
                  {msg.hasInlineButtons && (
                    <div className="w-[85%] mt-1.5 space-y-1.5">
                      {msg.inlineType === 'channels' && (
                        <>
                          {config.channels.map((ch) => {
                            const isJoined = joinedChannelIds.has(ch.id);
                            return (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() => toggleChannelJoin(ch.id)}
                                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs transition-colors cursor-pointer ${
                                  isJoined
                                    ? 'bg-[#1C3224] text-[#C0FF6F] border border-emerald-500/40'
                                    : 'bg-[#22314B] text-slate-100 hover:bg-[#2B3E60]'
                                }`}
                              >
                                <span>{ch.name}</span>
                                {isJoined ? (
                                  <span className="text-[10px] text-[#C0FF6F] font-bold">✓ Joined</span>
                                ) : (
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </button>
                            );
                          })}

                          {/* Inline Verify Button */}
                          <button
                            type="button"
                            onClick={handleVerifyClick}
                            className="w-full py-2 px-3 rounded-lg bg-[#FF8E00] text-slate-950 font-bold text-xs hover:bg-[#ffa02b] shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>{config.buttons.verifyButtonText}</span>
                          </button>
                        </>
                      )}

                      {/* Verified Launch Inline Button */}
                      {msg.inlineType === 'verified_launch' && (
                        <button
                          type="button"
                          onClick={() => setMiniAppOpen(true)}
                          className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#FF8E00] to-[#ffa33a] text-slate-950 font-bold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer animate-bounce"
                        >
                          <span>{config.buttons.verifiedLaunchText}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Persistent Reply Keyboard (Appears when verified or on /menu) */}
            {showReplyKeyboard && (
              <div className="bg-[#152033] border-t border-[#233554] p-2 flex-shrink-0 animate-in slide-in-from-bottom duration-200">
                <button
                  type="button"
                  onClick={() => setMiniAppOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#23334F] hover:bg-[#2B4063] text-[#C0FF6F] font-bold text-xs border border-[#324970] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{config.buttons.replyMenuText}</span>
                </button>
              </div>
            )}

            {/* Bottom Permanent Telegram Menu Button & Input Bar */}
            <div className="bg-[#121A28] border-t border-[#1E2B40] p-2 flex items-center gap-2 flex-shrink-0">
              {/* Permanent Menu Button */}
              <button
                type="button"
                onClick={() => setMiniAppOpen(true)}
                className="px-3 py-2 rounded-lg bg-[#1B2940] hover:bg-[#243756] text-[#FF8E00] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#293E63]"
                title="Permanent Telegram Chat Menu Button"
              >
                <span>{config.buttons.menuButtonText}</span>
              </button>

              {/* Message Input form */}
              <form onSubmit={handleSendCustomMessage} className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type a message or /start..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#0A0E17] border border-[#222E42] text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#FF8E00]"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-[#FF8E00] text-slate-950 hover:bg-[#ffa02b] transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Slide-Up Mini App Bottom Sheet Modal */}
            <MiniAppModal
              isOpen={miniAppOpen}
              onClose={() => setMiniAppOpen(false)}
              url={config.websiteUrl}
              title={config.buttons.menuButtonText}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
