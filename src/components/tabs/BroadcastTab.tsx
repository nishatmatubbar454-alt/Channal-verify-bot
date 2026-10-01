import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bold, 
  Italic, 
  Code, 
  ExternalLink, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Clock,
  Radio,
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  Camera
} from 'lucide-react';
import { BotConfig, Language } from '../../types/botConfig';
import { translations } from '../../utils/translations';
import { 
  TelegramUser, 
  BroadcastRecord, 
  saveBroadcastRecord, 
  fetchBroadcastRecords, 
  markUserBlocked 
} from '../../services/firebase';

interface BroadcastTabProps {
  config: BotConfig;
  lang: Language;
  users: TelegramUser[];
  onRefreshUsers: () => void;
}

export const BroadcastTab: React.FC<BroadcastTabProps> = ({
  config,
  lang,
  users,
  onRefreshUsers,
}) => {
  // Campaign form state
  const [broadcastNumber, setBroadcastNumber] = useState(125);
  const [broadcastText, setBroadcastText] = useState(
    lang === 'bn'
      ? '📢 <b>নতুন আপডেট এসেছে!</b>\n\nআমাদের আর্নিং সিস্টেমে নতুন অফার ও রিওয়ার্ডস চালু হয়েছে। এখনই চেক করুন এবং বোনাস বুঝে নিন! 🎁'
      : '📢 <b>New Announcement!</b>\n\nNew tasks and rewards have been added to our Mini App. Check it out now! 🎁'
  );
  const [hasButton, setHasButton] = useState(true);
  const [buttonText, setButtonText] = useState(config.buttons.menuButtonText || '🌐 Open Mini App');
  const [buttonUrl, setButtonUrl] = useState(config.websiteUrl);

  // Synchronize buttonUrl immediately whenever config.websiteUrl changes anywhere
  useEffect(() => {
    if (config.websiteUrl) {
      setButtonUrl(config.websiteUrl);
    }
  }, [config.websiteUrl]);

  // Gallery Photo state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoInfo, setPhotoInfo] = useState<{ name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audience
  const [targetAudience, setTargetAudience] = useState<'active_only' | 'all'>('active_only');

  // Broadcast execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    blocked: 0,
  });

  // History records
  const [history, setHistory] = useState<BroadcastRecord[]>([]);

  // Abort / pause ref
  const abortRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);

  useEffect(() => {
    fetchBroadcastRecords().then((records) => {
      setHistory(records);
      if (records.length > 0) {
        setBroadcastNumber(Math.max(...records.map((r) => r.broadcast_number || 100)) + 1);
      }
    });
  }, []);

  // Handle Photo selection from gallery
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন' : 'Please select an image file');
      return;
    }
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;
    setPhotoInfo({ name: file.name, size: sizeStr });

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setPhotoDataUrl(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePhotoRemove = () => {
    setPhotoDataUrl(null);
    setPhotoInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter target users
  const getEligibleUsers = (): TelegramUser[] => {
    if (targetAudience === 'active_only') {
      return users.filter((u) => u.status === 'Active' && u.broadcast_status !== 'blocked');
    }
    return users;
  };

  const eligibleUsers = getEligibleUsers();

  const handleStartBroadcast = async () => {
    if (!config.botToken) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে প্রথমে বট টোকেন দিন' : 'Please configure bot token first');
      return;
    }

    if (eligibleUsers.length === 0) {
      alert(lang === 'bn' ? 'ব্রডকাস্ট পাঠানোর মতো কোনো ইউজার ডাটাবেজে নেই' : 'No eligible users in database');
      return;
    }

    abortRef.current = false;
    pauseRef.current = false;
    setIsRunning(true);
    setIsPaused(false);

    const total = eligibleUsers.length;
    let sent = 0;
    let failed = 0;
    let blocked = 0;

    setStats({ total, sent: 0, failed: 0, blocked: 0 });
    setCurrentProgress(0);

    const campaignId = `bc-${Date.now()}`;
    const campaignName = `Broadcast #${broadcastNumber}`;

    // Inline button markup if enabled
    let replyMarkup: any = null;
    if (hasButton && buttonText.trim() && buttonUrl.trim()) {
      const cleanUrl = buttonUrl.trim();
      const isHttps = cleanUrl.startsWith('https://');
      replyMarkup = {
        inline_keyboard: [
          [
            isHttps
              ? { text: buttonText.trim(), web_app: { url: cleanUrl } }
              : { text: buttonText.trim(), url: cleanUrl }
          ],
        ],
      };
    }

    // Process in batches of 15 to respect Telegram rate limits
    const batchSize = 15;
    for (let i = 0; i < total; i += batchSize) {
      if (abortRef.current) break;

      while (pauseRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (abortRef.current) break;
      }
      if (abortRef.current) break;

      const batch = eligibleUsers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (user) => {
          try {
            const payload: any = {
              token: config.botToken,
              chat_id: user.chat_id,
              text: broadcastText,
              reply_markup: replyMarkup,
            };

            // If photo attached from gallery
            if (photoDataUrl) {
              payload.photo = photoDataUrl;
              payload.caption = broadcastText;
            }

            const res = await fetch('/api/telegram-send-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.ok) {
              sent++;
            } else {
              // Check if user blocked the bot (Error 403)
              if (
                data.error_code === 403 ||
                (data.description && data.description.toLowerCase().includes('bot was blocked'))
              ) {
                blocked++;
                await markUserBlocked(user.chat_id);
              } else {
                failed++;
              }
            }
          } catch {
            failed++;
          }
        })
      );

      const processed = Math.min(i + batchSize, total);
      const pct = Math.round((processed / total) * 100);
      setCurrentProgress(pct);
      setStats({ total, sent, failed, blocked });

      // Delay 100ms between batches to strictly honor Telegram's 30 msg/sec limit
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsRunning(false);
    onRefreshUsers();

    // Save campaign record in Firebase
    const finalRecord: BroadcastRecord = {
      id: campaignId,
      broadcast_number: broadcastNumber,
      name: campaignName,
      text: broadcastText,
      button_text: hasButton ? buttonText : undefined,
      button_url: hasButton ? buttonUrl : undefined,
      total_users: total,
      sent,
      failed,
      blocked,
      progress: 100,
      status: abortRef.current ? 'Stopped' : 'Completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    await saveBroadcastRecord(finalRecord);
    setHistory((prev) => [finalRecord, ...prev]);
    setBroadcastNumber((prev) => prev + 1);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      pauseRef.current = false;
      setIsPaused(false);
    } else {
      pauseRef.current = true;
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
  };

  const insertTag = (openTag: string, closeTag: string) => {
    setBroadcastText((prev) => `${prev}${openTag}text${closeTag}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Send className="w-5 h-5 text-[#FF8E00]" />
            <span>{lang === 'bn' ? 'টেলিগ্রাম ব্রডকাস্ট সিস্টেম' : 'Telegram Mass Broadcast System'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {lang === 'bn'
              ? 'ডাটাবেজে সংরক্ষিত ইউজারদের chat_id-তে একসাথে ব্যাচ আকারে বার্তা পাঠান।'
              : 'Send batch announcements to Telegram subscribers with rate limit & block tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#C0FF6F] bg-[#14221A] border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{eligibleUsers.length} {lang === 'bn' ? 'জন টার্গেট ইউজার' : 'Target Subscribers'}</span>
          </span>
        </div>
      </div>

      {/* Live Broadcast Progress Card (Visible when running or completed) */}
      {(isRunning || stats.total > 0) && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121927] border-2 border-[#FF8E00]/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                📢 Broadcast #{broadcastNumber}
              </span>
              {isRunning && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF8E00]/20 text-[#FF8E00] animate-pulse">
                  {isPaused ? 'Paused' : 'Sending in Batches...'}
                </span>
              )}
            </div>

            {isRunning && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePauseResume}
                  className="px-3 py-1.5 rounded-lg bg-[#182337] border border-[#263753] text-slate-200 text-xs font-semibold flex items-center gap-1 hover:bg-[#202E48] cursor-pointer"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-[#C0FF6F]" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={handleStop}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-900/50 cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Progress:</span>
              <span className="text-[#C0FF6F] font-mono">{currentProgress}%</span>
            </div>
            <div className="w-full h-3 bg-[#0A0E17] rounded-full overflow-hidden p-0.5 border border-[#1E2B40]">
              <div 
                className="h-full bg-gradient-to-r from-[#FF8E00] to-[#C0FF6F] rounded-full transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>

          {/* User's Exact Requested Metrics Output */}
          <div className="p-4 rounded-xl bg-[#0A0E17] border border-[#1C273C] font-mono text-xs sm:text-sm space-y-1.5">
            <div className="text-slate-300 font-bold mb-1 font-sans">
              📢 Broadcast #{broadcastNumber}
            </div>
            <div className="text-slate-300">
              Total users: <strong className="text-white">{stats.total.toLocaleString()}</strong>
            </div>
            <div className="text-emerald-400">
              ✅ Sent: <strong>{stats.sent.toLocaleString()}</strong>
            </div>
            <div className="text-rose-400">
              ❌ Failed: <strong>{stats.failed.toLocaleString()}</strong>
            </div>
            <div className="text-amber-400">
              🚫 Blocked: <strong>{stats.blocked.toLocaleString()}</strong>
            </div>
            <div className="text-slate-400 pt-1">
              Progress: <strong className="text-[#C0FF6F]">{currentProgress}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left (7 Cols), Live Preview Right (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Composer Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-4">
            {/* Broadcast Number & Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Broadcast Identifier
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">#</span>
                  <input
                    type="number"
                    value={broadcastNumber}
                    onChange={(e) => setBroadcastNumber(Number(e.target.value) || 1)}
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === 'bn' ? 'টার্গেট প্রাপক' : 'Target Audience'}
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-xs text-white"
                >
                  <option value="active_only">
                    {lang === 'bn' ? `শুধু সক্রিয় ইউজার (${users.filter(u => u.status === 'Active').length})` : `Active Users Only (${users.filter(u => u.status === 'Active').length})`}
                  </option>
                  <option value="all">
                    {lang === 'bn' ? `সকল ইউজার (${users.length})` : `All Users (${users.length})`}
                  </option>
                </select>
              </div>
            </div>

            {/* Gallery Photo Upload Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'bn' ? 'গ্যালারির ফটো আপলোড (ঐচ্ছিক)' : 'Gallery Photo Attachment (Optional)'}</span>
                </label>
                {photoDataUrl && (
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {photoInfo?.size}
                  </span>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handlePhotoSelect} 
                className="hidden" 
              />

              {!photoDataUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-cyan-400 bg-cyan-950/20' 
                      : 'border-[#263753] hover:border-cyan-500/50 bg-[#0E1420]/60 hover:bg-[#0E1420]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {lang === 'bn' ? '📷 গ্যালারি থেকে ফটো নির্বাচন করুন' : '📷 Choose Photo from Gallery'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'bn' 
                      ? 'ক্লিক করুন বা ড্র্যাগ করে ফটো এখানে ছাড়ুন (PNG, JPG, WEBP)' 
                      : 'Click to browse or drag & drop image here (PNG, JPG, WEBP)'}
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-cyan-500/40 bg-[#0E1420] p-3 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#263753] bg-black/40 flex-shrink-0">
                      <img src={photoDataUrl} alt="Upload preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate font-mono">
                        {photoInfo?.name || 'photo.jpg'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
                          {photoInfo?.size}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-medium">
                          <Check className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'সংযুক্ত করা হয়েছে' : 'Ready'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-[#182337] border border-[#2B3E5E] text-xs font-medium text-slate-200 hover:text-white hover:bg-[#202E46] transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePhotoRemove}
                      className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
                      title={lang === 'bn' ? 'ছবি সরান' : 'Remove photo'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  {lang === 'bn' ? 'বার্তার বিষয়বস্তু (HTML Supported)' : 'Message Content (Telegram HTML)'}
                </label>
                <span className="text-[11px] text-slate-400">
                  {broadcastText.length} chars
                </span>
              </div>

              {/* Tag Toolbar */}
              <div className="flex items-center gap-1.5 p-1.5 bg-[#0E1420] border border-[#1E2B40] rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => insertTag('<b>', '</b>')}
                  className="p-1 rounded hover:bg-[#1C273C] text-slate-300 font-bold"
                >
                  &lt;b&gt;
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('<i>', '</i>')}
                  className="p-1 rounded hover:bg-[#1C273C] text-slate-300 italic"
                >
                  &lt;i&gt;
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('<code>', '</code>')}
                  className="p-1 rounded hover:bg-[#1C273C] text-slate-300 font-mono"
                >
                  &lt;code&gt;
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('<a href="...">', '</a>')}
                  className="p-1 rounded hover:bg-[#1C273C] text-slate-300"
                >
                  &lt;a&gt;
                </button>
                <span className="text-slate-600">|</span>
                {['📢', '🎁', '🚀', '💰', '🔥', '✅'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setBroadcastText((p) => p + em)}
                    className="p-1 rounded hover:bg-[#1C273C]"
                  >
                    {em}
                  </button>
                ))}
              </div>

              <textarea
                rows={6}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="w-full p-3.5 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-slate-100 font-mono leading-relaxed focus:outline-hidden focus:border-[#FF8E00]"
                placeholder="Write your broadcast message..."
              />
            </div>

            {/* Optional CTA Button */}
            <div className="p-3.5 rounded-lg bg-[#0E1420] border border-[#1E2B40] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasButton}
                    onChange={(e) => setHasButton(e.target.checked)}
                    className="rounded accent-[#FF8E00]"
                  />
                  <span>{lang === 'bn' ? 'ইনলাইন বাটন যুক্ত করুন' : 'Attach Inline CTA Button'}</span>
                </label>
              </div>

              {hasButton && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Button Text</label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="e.g. 🌐 Open App"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#141C2B] border border-[#222E42] text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Button URL</label>
                    <input
                      type="url"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-lg bg-[#141C2B] border border-[#222E42] text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dispatch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartBroadcast}
                disabled={isRunning || eligibleUsers.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF8E00] to-[#ffa439] text-slate-950 font-bold text-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF8E00]/20 cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isRunning 
                    ? (lang === 'bn' ? 'ব্রডকাস্ট চলমান রয়েছে...' : 'Sending Broadcast...') 
                    : (lang === 'bn' ? `📢 Broadcast #${broadcastNumber} পাঠান (${eligibleUsers.length} জন গ্রাহক)` : `Send Broadcast #${broadcastNumber} (${eligibleUsers.length} Users)`)}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Chat Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C0FF6F]" />
            <span>{lang === 'bn' ? 'গ্রাহকের স্ক্রিনে লাইভ প্রিভিউ' : 'Live Subscriber Inbox Preview'}</span>
          </h3>

          <div className="rounded-2xl border border-[#222E45] bg-[#0E1420] p-4 tg-bg-pattern min-h-[380px] flex flex-col justify-end">
            <div className="space-y-2 max-w-[95%]">
              <div className="telegram-bubble-in p-4 shadow-lg border border-[#2b3952]/40 relative text-xs sm:text-sm">
                <div className="text-[12px] font-bold text-[#FF8E00] mb-2 flex items-center justify-between">
                  <span>{config.botInfo?.first_name || 'Broadcast Bot'}</span>
                  <span className="text-[9px] text-slate-400 font-normal">bot</span>
                </div>

                {/* Render attached gallery photo if present */}
                {photoDataUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-[#2b3952]/60 bg-black/50">
                    <img 
                      src={photoDataUrl} 
                      alt="Broadcast attachment" 
                      className="w-full h-auto max-h-60 object-cover" 
                    />
                  </div>
                )}

                <div 
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: broadcastText.replace(/\n/g, '<br/>') }}
                />

                <div className="text-right text-[10px] text-slate-400 mt-2">
                  Just now
                </div>
              </div>

              {hasButton && buttonText && (
                <div className="pt-1">
                  <a
                    href={buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 rounded-lg bg-[#283854]/95 text-center text-xs font-bold text-white shadow-xs hover:bg-[#324566] transition-colors"
                  >
                    {buttonText}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      {history.length > 0 && (
        <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C0FF6F]" />
            <span>{lang === 'bn' ? 'পূর্ববর্তী ব্রডকাস্ট ক্যাম্পেইন হিস্ট্রি' : 'Broadcast Campaigns History'}</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0E1420] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2B40]">
                <tr>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Total Users</th>
                  <th className="py-2.5 px-3">✅ Sent</th>
                  <th className="py-2.5 px-3">❌ Failed</th>
                  <th className="py-2.5 px-3">🚫 Blocked</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D273B]">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#162032]">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {rec.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {rec.total_users.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      {rec.sent.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-rose-400">
                      {rec.failed.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">
                      {rec.blocked.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === 'Completed' ? 'bg-emerald-950/60 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(rec.started_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
