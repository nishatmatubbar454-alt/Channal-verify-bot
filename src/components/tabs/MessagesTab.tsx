import React, { useState } from 'react';
import { 
  MessageSquareCode, 
  Bold, 
  Italic, 
  Code, 
  Underline, 
  Link as LinkIcon, 
  Smile, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { BotMessages, Language } from '../../types/botConfig';
import { translations } from '../../utils/translations';

interface MessagesTabProps {
  messages: BotMessages;
  onUpdateMessages: (messages: BotMessages) => void;
  lang: Language;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  messages,
  onUpdateMessages,
  lang,
}) => {
  const t = translations[lang].messagesTab;
  const [selectedKey, setSelectedKey] = useState<keyof BotMessages>('msgJoinFirst');

  const messageDefinitions: {
    key: keyof BotMessages;
    label: string;
    help: string;
    tag: string;
  }[] = [
    {
      key: 'msgJoinFirst',
      label: t.joinFirstLabel,
      help: t.joinFirstHelp,
      tag: 'MSG_JOIN_FIRST',
    },
    {
      key: 'msgVerified',
      label: t.verifiedLabel,
      help: t.verifiedHelp,
      tag: 'MSG_VERIFIED',
    },
    {
      key: 'msgNotJoined',
      label: t.notJoinedLabel,
      help: t.notJoinedHelp,
      tag: 'MSG_NOT_JOINED',
    },
    {
      key: 'msgCheckError',
      label: t.checkErrorLabel,
      help: t.checkErrorHelp,
      tag: 'MSG_CHECK_ERROR',
    },
  ];

  const handleTextChange = (val: string) => {
    onUpdateMessages({
      ...messages,
      [selectedKey]: val,
    });
  };

  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = messages[selectedKey];
    const selectedText = currentVal.substring(start, end) || 'text';
    const replacement = `${openTag}${selectedText}${closeTag}`;

    const updated = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    handleTextChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
    }, 50);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      handleTextChange(messages[selectedKey] + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = messages[selectedKey];
    const updated = currentVal.substring(0, start) + emoji + currentVal.substring(end);
    handleTextChange(updated);
  };

  // Convert Telegram HTML tags into safe React elements for preview
  const renderTelegramHtml = (html: string) => {
    // replace \n with <br/>
    const withBreaks = html.replace(/\n/g, '<br/>');
    return (
      <div 
        className="leading-relaxed text-sm"
        dangerouslySetInnerHTML={{ __html: withBreaks }} 
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquareCode className="w-5 h-5 text-[#C0FF6F]" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Message Selector & Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Message Template Tabs */}
          <div className="flex gap-1.5 overflow-x-auto p-1 bg-[#121927] border border-[#222E45] rounded-xl scrollbar-none">
            {messageDefinitions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedKey(item.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedKey === item.key
                    ? 'bg-[#FF8E00] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-[#182337]'
                }`}
              >
                {item.tag}
              </button>
            ))}
          </div>

          {/* Active Message Definition */}
          {(() => {
            const active = messageDefinitions.find((m) => m.key === selectedKey)!;
            return (
              <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white">{active.label}</h3>
                  <p className="text-xs text-slate-400">{active.help}</p>
                </div>

                {/* HTML & Emoji Toolbar */}
                <div className="flex items-center flex-wrap gap-1.5 p-2 bg-[#0E1420] border border-[#1E2B40] rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => insertTag('<b>', '</b>')}
                    title="Bold"
                    className="p-1.5 rounded hover:bg-[#1C273C] text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                    <span>&lt;b&gt;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('<i>', '</i>')}
                    title="Italic"
                    className="p-1.5 rounded hover:bg-[#1C273C] text-slate-300 hover:text-white transition-colors flex items-center gap-1 italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                    <span>&lt;i&gt;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('<code>', '</code>')}
                    title="Monospace Code"
                    className="p-1.5 rounded hover:bg-[#1C273C] text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-mono"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>&lt;code&gt;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('<u>', '</u>')}
                    title="Underline"
                    className="p-1.5 rounded hover:bg-[#1C273C] text-slate-300 hover:text-white transition-colors flex items-center gap-1 underline"
                  >
                    <Underline className="w-3.5 h-3.5" />
                    <span>&lt;u&gt;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('<a href="https://t.me/...">', '</a>')}
                    title="Hyperlink"
                    className="p-1.5 rounded hover:bg-[#1C273C] text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>&lt;a&gt;</span>
                  </button>

                  <div className="w-px h-4 bg-[#23314A] mx-1" />

                  {/* Emojis */}
                  <div className="flex items-center gap-1">
                    {['🚫', '✅', '❌', '⚠️', '🎉', '🚀', '👇', '💰', '🔗'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => insertEmoji(em)}
                        className="p-1 rounded hover:bg-[#1C273C] text-xs transition-colors"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  id="message-textarea"
                  rows={9}
                  value={messages[selectedKey]}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full p-4 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-slate-100 font-mono leading-relaxed focus:outline-hidden focus:border-[#C0FF6F]"
                  placeholder="Enter message template with Telegram HTML tags..."
                />

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Characters: {messages[selectedKey].length}</span>
                  <span>aiogram ParseMode.HTML supported</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Live Telegram Chat Bubble Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FF8E00]" />
            <span>{t.previewTitle}</span>
          </h3>

          <div className="rounded-2xl border border-[#222E45] bg-[#0E1420] p-4 tg-bg-pattern min-h-[380px] flex flex-col justify-end">
            {/* Telegram Inbound Message Bubble */}
            <div className="space-y-2 max-w-[95%]">
              <div className="telegram-bubble-in p-4 shadow-lg border border-[#2b3952]/40 relative">
                {/* Bot Name in Telegram Group/Chat */}
                <div className="text-[12px] font-bold text-[#C0FF6F] mb-1 flex items-center justify-between">
                  <span>Verification Bot</span>
                  <span className="text-[10px] text-slate-400 font-normal">bot</span>
                </div>

                {/* Rendered Text */}
                {renderTelegramHtml(messages[selectedKey])}

                {/* Simulated timestamp */}
                <div className="text-right text-[10px] text-slate-400 mt-2">
                  12:45 PM
                </div>
              </div>

              {/* Sample Inline Button Mockup under message if MSG_JOIN_FIRST */}
              {selectedKey === 'msgJoinFirst' && (
                <div className="space-y-1.5 pt-1">
                  <div className="p-2 rounded-lg bg-[#283854]/90 text-center text-xs font-medium text-white shadow-xs">
                    🔗 Main Channel
                  </div>
                  <div className="p-2 rounded-lg bg-[#283854]/90 text-center text-xs font-medium text-white shadow-xs">
                    🔗 Payment Channel
                  </div>
                  <div className="p-2 rounded-lg bg-[#283854]/90 text-center text-xs font-bold text-[#C0FF6F] shadow-xs">
                    ✅ Verify
                  </div>
                </div>
              )}

              {/* Sample Verified Button Mockup */}
              {selectedKey === 'msgVerified' && (
                <div className="pt-1">
                  <div className="p-2.5 rounded-lg bg-[#283854]/90 text-center text-xs font-bold text-[#FF8E00] shadow-xs flex items-center justify-center gap-1.5">
                    <span>🚀 বট ব্যবহার শুরু করুন</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
