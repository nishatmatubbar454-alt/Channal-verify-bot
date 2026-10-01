/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BotConfig, ActiveTab, Language, Channel, BotMessages, ButtonLabels, GeminiConfig } from './types/botConfig';
import { DEFAULT_CONFIG, loadSavedConfig, saveConfigToStorage } from './utils/defaultConfig';
import { translations } from './utils/translations';
import { 
  TelegramUser, 
  subscribeToUsers, 
  saveOrUpdateUser, 
  fetchAllUsers,
  getInitialDemoUsers,
  firebaseConfig 
} from './services/firebase';
import { Header } from './components/Header';
import { TabsNav } from './components/TabsNav';
import { LiveBotStatus } from './components/LiveBotStatus';
import { OverviewTab } from './components/tabs/OverviewTab';
import { BotTokenTab } from './components/tabs/BotTokenTab';
import { ChannelsTab } from './components/tabs/ChannelsTab';
import { WebAppTab } from './components/tabs/WebAppTab';
import { MessagesTab } from './components/tabs/MessagesTab';
import { GeminiTab } from './components/tabs/GeminiTab';
import { UsersTab } from './components/tabs/UsersTab';
import { BroadcastTab } from './components/tabs/BroadcastTab';
import { TelegramSimulatorTab } from './components/tabs/TelegramSimulatorTab';
import { CodeExportTab } from './components/tabs/CodeExportTab';
import { CheckCircle2, AlertCircle, Database } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<BotConfig>(() => loadSavedConfig());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [lang, setLang] = useState<Language>('bn');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isBotRunning, setIsBotRunning] = useState<boolean>(true);

  // Firebase users state
  const [users, setUsers] = useState<TelegramUser[]>([]);

  // Check bot runner status
  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const res = await fetch('/api/bot-runner/status');
        const data = await res.json();
        if (typeof data.isRunning === 'boolean') {
          setIsBotRunning(data.isRunning);
        }
      } catch {}
    };
    checkBotStatus();
    const interval = setInterval(checkBotStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBotRunning = async () => {
    try {
      const res = await fetch('/api/bot-runner/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !isBotRunning }),
      });
      const data = await res.json();
      setIsBotRunning(data.isRunning);
      showToast(data.isRunning 
        ? (lang === 'bn' ? '🟢 বট চালু করা হয়েছে' : 'Bot started') 
        : (lang === 'bn' ? '🔴 বট বন্ধ করা হয়েছে' : 'Bot stopped')
      );
    } catch {}
  };

  // Subscribe to Firebase Realtime Database and sync backend runner
  useEffect(() => {
    // Initial sync to server runner
    fetch('/api/bot-runner/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(() => {});

    // Fetch real users immediately from backend/firebase
    fetch('/api/telegram-users')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);
        }
      })
      .catch(() => {});

    const unsubscribe = subscribeToUsers((firebaseUsers) => {
      setUsers(firebaseUsers);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    saveConfigToStorage(config);
    try {
      await fetch('/api/bot-runner/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch {}
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      showToast(translations[lang].saveSuccess);
    }, 300);
  };

  // Reset to default
  const handleReset = () => {
    if (confirm(translations[lang].resetConfirm)) {
      setConfig(DEFAULT_CONFIG);
      saveConfigToStorage(DEFAULT_CONFIG);
      setHasUnsavedChanges(false);
      showToast(lang === 'bn' ? 'ডিফল্ট সেটিংস লোড করা হয়েছে' : 'Default settings restored');
    }
  };

  // Verify Telegram Bot Token
  const handleVerifyToken = async (token: string) => {
    try {
      const res = await fetch(`/api/telegram-verify?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (data.ok && data.result) {
        setIsValidToken(true);
        const botInfo = {
          id: data.result.id,
          is_bot: data.result.is_bot,
          first_name: data.result.first_name,
          username: data.result.username,
          can_join_groups: data.result.can_join_groups,
          can_read_all_group_messages: data.result.can_read_all_group_messages,
          supports_inline_queries: data.result.supports_inline_queries,
        };

        const updatedConfig = {
          ...config,
          botToken: token,
          botInfo,
        };
        setConfig(updatedConfig);
        setHasUnsavedChanges(true);

        return {
          success: true,
          data: botInfo,
        };
      } else {
        setIsValidToken(false);
        return {
          success: false,
          error: data.description || 'Invalid Bot Token. Check @BotFather.',
        };
      }
    } catch (err: any) {
      setIsValidToken(false);
      return {
        success: false,
        error: err?.message || 'Connection error. Ensure internet connection.',
      };
    }
  };

  // User database handlers
  const handleAddUser = async (newUser: TelegramUser) => {
    await saveOrUpdateUser(newUser);
    const all = await fetchAllUsers();
    setUsers(all);
    showToast(lang === 'bn' ? 'ইউজার সফলভাবে ডাটাবেজে যুক্ত হয়েছে' : 'User saved to Firebase database');
  };

  const handleToggleUserStatus = async (chat_id: string | number, currentStatus: 'Active' | 'Blocked') => {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    const targetUser = users.find((u) => String(u.chat_id) === String(chat_id));
    if (targetUser) {
      const updated: TelegramUser = {
        ...targetUser,
        status: newStatus,
        broadcast_status: newStatus === 'Active' ? 'allowed' : 'blocked',
        last_seen: new Date().toISOString(),
      };
      await saveOrUpdateUser(updated);
      const all = await fetchAllUsers();
      setUsers(all);
    }
  };

  const handleDeleteUser = async (chat_id: string | number) => {
    const updated = users.filter((u) => String(u.chat_id) !== String(chat_id));
    setUsers(updated);
    try {
      localStorage.setItem("tg_bot_firebase_users_cache", JSON.stringify(updated));
    } catch {}
    showToast(lang === 'bn' ? 'ইউজার মুছে ফেলা হয়েছে' : 'User deleted');
  };

  const handleSeedDemoUsers = async () => {
    const demo = getInitialDemoUsers();
    for (const u of demo) {
      await saveOrUpdateUser(u);
    }
    const all = await fetchAllUsers();
    setUsers(all);
    showToast(lang === 'bn' ? 'স্যাম্পল ইউজার ডাটা লোড করা হয়েছে' : 'Sample users loaded into Firebase');
  };

  const refreshUsersList = async () => {
    const all = await fetchAllUsers();
    setUsers(all);
  };

  // Called when user simulates /start in Simulator
  const handleSimulateUserStart = async (chat_id: number, username: string, first_name: string) => {
    const userRecord: TelegramUser = {
      chat_id,
      username,
      first_name,
      last_seen: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      status: 'Active',
      language: lang,
      broadcast_status: 'allowed',
    };
    await saveOrUpdateUser(userRecord);
    refreshUsersList();
  };

  // Update token
  const onChangeToken = (token: string) => {
    setConfig((prev) => ({ ...prev, botToken: token }));
    setHasUnsavedChanges(true);
  };

  // Update channels
  const onUpdateChannels = (channels: Channel[]) => {
    setConfig((prev) => ({ ...prev, channels }));
    setHasUnsavedChanges(true);
  };

  // Update Web App URL & instantly synchronize everywhere
  const onUpdateUrl = (websiteUrl: string) => {
    setConfig((prev) => {
      const updated = { ...prev, websiteUrl };
      saveConfigToStorage(updated);
      // Immediately notify backend bot runner so Telegram buttons & AI replies update in real-time
      fetch('/api/bot-runner/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Update Buttons
  const onUpdateButtons = (buttons: ButtonLabels) => {
    setConfig((prev) => ({ ...prev, buttons }));
    setHasUnsavedChanges(true);
  };

  // Update Messages
  const onUpdateMessages = (messages: BotMessages) => {
    setConfig((prev) => ({ ...prev, messages }));
    setHasUnsavedChanges(true);
  };

  // Update Gemini AI
  const onUpdateGemini = (gemini: GeminiConfig) => {
    setConfig((prev) => ({ ...prev, gemini }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col selection:bg-[#FF8E00]/30 selection:text-[#C0FF6F]">
      {/* Top Header */}
      <Header
        config={config}
        lang={lang}
        setLang={setLang}
        onSave={handleSave}
        onReset={handleReset}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isValidToken={isValidToken}
        isRunning={isBotRunning}
        onToggleRunning={handleToggleBotRunning}
      />

      {/* Tabs Navigation */}
      <TabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        channelsCount={config.channels.length}
        usersCount={users.length}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab
            config={config}
            lang={lang}
            setActiveTab={setActiveTab}
            isValidToken={isValidToken}
            users={users}
            onRefreshUsers={refreshUsersList}
          />
        )}

        {activeTab === 'token' && (
          <BotTokenTab
            config={config}
            onChangeToken={onChangeToken}
            lang={lang}
            onVerifyToken={handleVerifyToken}
            isValidToken={isValidToken}
          />
        )}

        {activeTab === 'channels' && (
          <ChannelsTab
            channels={config.channels}
            onUpdateChannels={onUpdateChannels}
            lang={lang}
            botToken={config.botToken}
          />
        )}

        {activeTab === 'webapp' && (
          <WebAppTab
            config={config}
            onUpdateUrl={onUpdateUrl}
            onUpdateButtons={onUpdateButtons}
            lang={lang}
          />
        )}

        {activeTab === 'messages' && (
          <MessagesTab
            messages={config.messages}
            onUpdateMessages={onUpdateMessages}
            lang={lang}
          />
        )}

        {activeTab === 'ai' && (
          <GeminiTab
            gemini={config.gemini}
            websiteUrl={config.websiteUrl}
            onUpdateGemini={onUpdateGemini}
            lang={lang}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onAddUser={handleAddUser}
            onToggleUserStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
            onSeedDemoUsers={handleSeedDemoUsers}
            lang={lang}
            onRefresh={refreshUsersList}
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastTab
            config={config}
            lang={lang}
            users={users}
            onRefreshUsers={refreshUsersList}
          />
        )}

        {activeTab === 'simulator' && (
          <TelegramSimulatorTab
            config={config}
            lang={lang}
            onUserStart={handleSimulateUserStart}
          />
        )}

        {activeTab === 'code' && (
          <CodeExportTab
            config={config}
            lang={lang}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#152336] border border-[#2B4060] text-white shadow-2xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C0FF6F] flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#192233] bg-[#0A0D14] py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF8E00]"></span>
            <span>Telegram Bot Admin Panel & Manager</span>
            <span className="text-slate-600">·</span>
            <span className="text-[#C0FF6F] flex items-center gap-1 font-mono">
              <Database className="w-3 h-3 text-[#FF8E00]" />
              Firebase RTDB: channel-varyfay
            </span>
          </div>
          <div>
            <span>{lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল সেন্টার' : 'Telegram WebApp & Bot Admin Center'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
