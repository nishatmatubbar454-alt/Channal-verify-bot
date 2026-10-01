import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Send,
  AlertCircle
} from 'lucide-react';
import { TelegramUser, firebaseConfig } from '../../services/firebase';
import { Language } from '../../types/botConfig';
import { translations } from '../../utils/translations';

interface UsersTabProps {
  users: TelegramUser[];
  onAddUser: (user: TelegramUser) => Promise<void>;
  onToggleUserStatus: (chat_id: string | number, currentStatus: 'Active' | 'Blocked') => Promise<void>;
  onDeleteUser: (chat_id: string | number) => Promise<void>;
  onSeedDemoUsers: () => Promise<void>;
  lang: Language;
  onRefresh: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  onAddUser,
  onToggleUserStatus,
  onDeleteUser,
  onSeedDemoUsers,
  lang,
  onRefresh,
}) => {
  const t = translations[lang].usersTab;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Blocked'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newChatId, setNewChatId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [formError, setFormError] = useState('');

  // Metrics
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'Active').length;
  const blockedCount = users.filter((u) => u.status === 'Blocked').length;

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const matchesFilter = statusFilter === 'all' || user.status === statusFilter;
    const matchesSearch = 
      String(user.chat_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatId.trim()) {
      setFormError(lang === 'bn' ? 'Chat ID আবশ্যক' : 'Chat ID is required');
      return;
    }

    const newUser: TelegramUser = {
      chat_id: Number(newChatId.trim()) || newChatId.trim(),
      username: newUsername.trim().replace(/^@/, '') || undefined,
      first_name: newFirstName.trim() || (lang === 'bn' ? 'টেলিগ্রাম ইউজার' : 'Telegram User'),
      last_seen: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      status: 'Active',
      language: lang,
      broadcast_status: 'allowed',
    };

    await onAddUser(newUser);
    setNewChatId('');
    setNewUsername('');
    setNewFirstName('');
    setShowAddModal(false);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C0FF6F]" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-[#141C2B] border border-[#222E45] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#C0FF6F] text-slate-950 font-bold text-xs hover:bg-[#d0ff88] transition-all flex items-center gap-1.5 shadow-md shadow-[#C0FF6F]/15 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t.addUserBtn}</span>
          </button>
        </div>
      </div>

      {/* Firebase Database Connection Callout */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-[#121927] border border-[#222E45] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FF8E00]/10 border border-[#FF8E00]/30 flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-[#FF8E00]" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Firebase Realtime Database:</span>
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[11px] truncate max-w-md mt-0.5">
              {firebaseConfig.databaseURL}/users/&#123;chat_id&#125;
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-[#0E1420] px-2.5 py-1 rounded-lg border border-[#1E2B40] self-start sm:self-auto">
          Project: <strong className="text-white">{firebaseConfig.projectId}</strong>
        </div>
      </div>

      {/* 3 Compact Metric Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Total Users */}
        <div className="p-3 rounded-xl bg-[#121927] border border-[#222E45]">
          <div className="text-[11px] font-medium text-slate-400 truncate mb-1">{t.totalUsers}</div>
          <div className="text-lg sm:text-2xl font-bold text-white font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate hidden sm:block">
            {lang === 'bn' ? 'সংরক্ষিত গ্রাহক' : 'Subscribers'}
          </div>
        </div>

        {/* Active Users */}
        <div className="p-3 rounded-xl bg-[#121927] border border-[#222E45]">
          <div className="text-[11px] font-medium text-[#C0FF6F] truncate mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t.activeUsers}</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-[#C0FF6F] font-mono">{activeCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate hidden sm:block">
            {lang === 'bn' ? 'ব্রডকাস্ট গ্রহণকারী' : 'Allowed targets'}
          </div>
        </div>

        {/* Blocked Users */}
        <div className="p-3 rounded-xl bg-[#121927] border border-[#222E45]">
          <div className="text-[11px] font-medium text-rose-400 truncate mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t.blockedUsers}</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-rose-400 font-mono">{blockedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate hidden sm:block">
            {lang === 'bn' ? 'আনসাবস্ক্রাইব' : 'Blocked'}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#121927] p-3 rounded-xl border border-[#222E45]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0E1420] border border-[#23314A] text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#C0FF6F]"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'Active', 'Blocked'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#FF8E00] text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white bg-[#0E1420] border border-[#23314A]'
              }`}
            >
              {filter === 'all' ? t.filterAll : (filter === 'Active' ? t.filterActive : t.filterBlocked)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-[#121927] border border-[#222E45] overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs max-w-md mx-auto">{t.noUsers}</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={onSeedDemoUsers}
                className="px-3.5 py-1.5 rounded-lg bg-[#FF8E00] text-slate-950 text-xs font-bold hover:bg-[#ffa02b] cursor-pointer"
              >
                {t.seedUsersBtn}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#182337] border border-[#263753] text-white text-xs font-semibold hover:bg-[#202E48] cursor-pointer"
              >
                {t.addUserBtn}
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0E1420] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2B40]">
                <tr>
                  <th className="py-3 px-4">{t.colChatId}</th>
                  <th className="py-3 px-4">{t.colUser}</th>
                  <th className="py-3 px-4">{t.colFirst}</th>
                  <th className="py-3 px-4">{t.colLastSeen}</th>
                  <th className="py-3 px-4">{t.colJoined}</th>
                  <th className="py-3 px-4">{t.colStatus}</th>
                  <th className="py-3 px-4">{t.colBroadcast}</th>
                  <th className="py-3 px-4 text-right">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D273B]">
                {filteredUsers.map((user) => (
                  <tr key={String(user.chat_id)} className="hover:bg-[#162032] transition-colors">
                    {/* Chat ID */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {user.chat_id}
                    </td>

                    {/* Username */}
                    <td className="py-3 px-4 font-mono text-[#C0FF6F]">
                      {user.username ? `@${user.username}` : <span className="text-slate-500 font-sans">-</span>}
                    </td>

                    {/* First Name */}
                    <td className="py-3 px-4 text-slate-200">
                      {user.first_name || '-'}
                    </td>

                    {/* Last Seen */}
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(user.last_seen)}
                    </td>

                    {/* Joined At */}
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(user.joined_at)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleUserStatus(user.chat_id, user.status)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          user.status === 'Active'
                            ? 'bg-emerald-950/60 text-[#C0FF6F] border border-emerald-500/40 hover:bg-emerald-900/60'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900/60'
                        }`}
                        title="Click to toggle status"
                      >
                        {user.status === 'Active' ? (
                          <CheckCircle2 className="w-3 h-3 text-[#C0FF6F]" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        <span>{user.status}</span>
                      </button>
                    </td>

                    {/* Broadcast status */}
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold ${user.broadcast_status === 'allowed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {user.broadcast_status === 'allowed' ? '✅ Allowed' : '🚫 Blocked'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteUser(user.chat_id)}
                        className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#121927] border border-[#283955] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2B40] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#C0FF6F]" />
                <span>{lang === 'bn' ? 'নতুন ইউজার যোগ করুন' : 'Add Telegram User'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-200">
                  Telegram Chat ID <span className="text-[#FF8E00]">*</span>
                </label>
                <input
                  type="text"
                  value={newChatId}
                  onChange={(e) => setNewChatId(e.target.value)}
                  placeholder="e.g. 569842104"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-[#C0FF6F]"
                />
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'ইউজারের নিউমেরিক আইডি (@userinfobot থেকে পাওয়া যায়)' : 'Numeric user chat_id (e.g. from @userinfobot)'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">
                  Username (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. john_doe"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-[#C0FF6F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">
                  First Name
                </label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E1420] border border-[#263753] text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-[#C0FF6F]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E2B40]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#182335] text-slate-300 hover:text-white font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#C0FF6F] text-slate-950 font-bold hover:bg-[#d0ff88] transition-colors cursor-pointer shadow-md"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
