import React, { useState } from 'react';
import { 
  Radio, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  ShieldAlert, 
  HelpCircle,
  Copy,
  AlertCircle,
  Globe
} from 'lucide-react';
import { Channel, Language } from '../../types/botConfig';
import { translations } from '../../utils/translations';

interface ChannelsTabProps {
  channels: Channel[];
  onUpdateChannels: (channels: Channel[]) => void;
  lang: Language;
  botToken?: string;
}

export const ChannelsTab: React.FC<ChannelsTabProps> = ({
  channels,
  onUpdateChannels,
  lang,
  botToken,
}) => {
  const t = translations[lang].channels;

  // State for Add / Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [testResult, setTestResult] = useState<{ id: string; msg: string; success: boolean } | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setName(`🔗 Channel ${channels.length + 1}`);
    setUsername('');
    setUrl('');
    setFormError('');
    setIsEditing(true);
  };

  const openEditModal = (ch: Channel) => {
    setEditingId(ch.id);
    setName(ch.name);
    setUsername(ch.username);
    setUrl(ch.url);
    setFormError('');
    setIsEditing(true);
  };

  // Helper: auto extract username from Telegram URL
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (!username || username === '') {
      const match = value.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/);
      if (match && match[1] && !match[1].startsWith('+') && match[1] !== 'joinchat') {
        setUsername(match[1]);
      }
    }
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(lang === 'bn' ? 'চ্যানেলের নাম দিন' : 'Please provide channel name');
      return;
    }
    if (!username.trim()) {
      setFormError(lang === 'bn' ? 'চ্যানেলের ইউজারনেম দিন (যেমন: MyChannel)' : 'Please provide channel username');
      return;
    }
    if (!url.trim()) {
      setFormError(lang === 'bn' ? 'চ্যানেলের লিংক দিন' : 'Please provide channel URL');
      return;
    }

    // Clean username (strip @ or spaces)
    const cleanUsername = username.trim().replace(/^@/, '');
    const cleanUrl = url.trim();

    if (editingId) {
      // Edit
      const updated = channels.map((c) =>
        c.id === editingId
          ? { ...c, name: name.trim(), username: cleanUsername, url: cleanUrl }
          : c
      );
      onUpdateChannels(updated);
    } else {
      // Add
      const newChannel: Channel = {
        id: `ch-${Date.now()}`,
        name: name.trim(),
        username: cleanUsername,
        url: cleanUrl,
      };
      onUpdateChannels([...channels, newChannel]);
    }

    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.deleteConfirm)) {
      onUpdateChannels(channels.filter((c) => c.id !== id));
    }
  };

  const moveChannel = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= channels.length) return;

    const list = [...channels];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    onUpdateChannels(list);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#C0FF6F]" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-lg bg-[#C0FF6F] text-slate-950 font-bold text-xs hover:bg-[#d0ff88] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t.addBtn}</span>
        </button>
      </div>

      {/* Admin Privilege Notice Callout */}
      <div className="p-4 rounded-xl bg-[#152033] border border-[#233554] flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-white">
            {lang === 'bn' ? '⚠️ বটের অ্যাডমিন অধিকার নিশ্চিত করুন:' : '⚠️ Ensure Bot Admin Status:'}
          </p>
          <p className="leading-relaxed">
            {t.botAdminNotice}
          </p>
          <p className="text-slate-400 text-[11px] pt-0.5">
            {lang === 'bn'
              ? 'চ্যানেল সেটিংস > Administrators > Add Administrator > আপনার বটের ইউজারনেম সার্চ করে অ্যাডমিন হিসেবে যোগ করুন।'
              : 'Channel Settings > Administrators > Add Administrator > Search your bot username and grant member info access.'}
          </p>
        </div>
      </div>

      {/* Channels Table / Cards List */}
      <div className="rounded-xl bg-[#121927] border border-[#222E45] overflow-hidden">
        {channels.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium">{t.noChannels}</p>
            <button
              onClick={openAddModal}
              className="mt-3 px-3 py-1.5 rounded-lg bg-[#FF8E00] text-slate-950 text-xs font-bold hover:bg-[#ffa02b]"
            >
              {t.addBtn}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#1D273B]">
            {channels.map((channel, index) => (
              <div
                key={channel.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#162032] transition-colors"
              >
                {/* Left: Channel Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1D2A40] text-[#C0FF6F] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {channel.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E2C44] text-[#C0FF6F] border border-[#2B3E60]">
                        @{channel.username.replace(/^@/, '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <a
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#FF8E00] truncate max-w-xs sm:max-w-md inline-flex items-center gap-1"
                      >
                        <span className="truncate">{channel.url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
                  {/* Reorder Buttons */}
                  <button
                    onClick={() => moveChannel(index, 'up')}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-1.5 rounded bg-[#1A2438] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveChannel(index, 'down')}
                    disabled={index === channels.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded bg-[#1A2438] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Open in Telegram */}
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded bg-[#1A2438] text-slate-300 hover:text-white hover:bg-[#23314B] text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>{lang === 'bn' ? 'চ্যানেল লিংক' : 'Visit'}</span>
                    <ExternalLink className="w-3 h-3 text-[#FF8E00]" />
                  </a>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(channel)}
                    className="px-2.5 py-1.5 rounded bg-[#1E2E48] text-[#FF8E00] hover:bg-[#283D60] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(channel.id)}
                    className="p-1.5 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 text-xs transition-colors cursor-pointer"
                    title="Delete channel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Channel Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[#121927] border border-[#283955] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2B40] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#C0FF6F]" />
                <span>
                  {editingId 
                    ? (lang === 'bn' ? 'চ্যানেল তথ্য সম্পাদনা করুন' : 'Edit Channel')
                    : (lang === 'bn' ? 'নতুন চ্যানেল যোগ করুন' : 'Add Required Channel')}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveChannel} className="space-y-4 text-xs">
              {/* Channel Name */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200">
                  {t.channelName} <span className="text-[#FF8E00]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 🔗 Main Channel, 💰 Payment Proofs"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-[#C0FF6F]"
                />
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'বটের ইনলাইন বাটনে এই নামটি প্রদর্শিত হবে।' : 'This text appears on the Telegram inline button.'}
                </span>
              </div>

              {/* Channel URL */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200">
                  {t.channelUrl} <span className="text-[#FF8E00]">*</span>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="e.g. https://t.me/Click2Cash_Site"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-[#C0FF6F]"
                />
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'চ্যানেলের পাবলিক বা প্রাইভেট ইনভাইট লিংক পেস্ট করুন।' : 'Public or private Telegram invite link.'}
                </span>
              </div>

              {/* Channel Username */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200">
                  {t.channelUsername} <span className="text-[#FF8E00]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                    placeholder="Click2Cash_Site"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-[#C0FF6F]"
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'টেলিগ্রাম API তে মেম্বারশিপ চেক করার জন্য @username ব্যবহৃত হয়।' : 'Used by get_chat_member(chat_id="@username") to verify membership.'}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1E2B40]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-[#182335] text-slate-300 hover:text-white font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C0FF6F] text-slate-950 font-bold hover:bg-[#d0ff88] transition-colors cursor-pointer shadow-md"
                >
                  {editingId ? (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Update Channel') : (lang === 'bn' ? 'যোগ করুন' : 'Add Channel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
