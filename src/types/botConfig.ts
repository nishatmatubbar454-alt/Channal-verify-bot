export interface Channel {
  id: string;
  name: string;
  username: string;
  url: string;
}

export interface BotMessages {
  msgJoinFirst: string;
  msgVerified: string;
  msgNotJoined: string;
  msgCheckError: string;
}

export interface ButtonLabels {
  menuButtonText: string;
  verifyButtonText: string;
  verifiedLaunchText: string;
  replyMenuText: string;
}

export interface BotInfo {
  id?: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  systemInstruction: string;
  maxChars: number;
  aiButtonText: string;
}

export interface BotConfig {
  botToken: string;
  channels: Channel[];
  websiteUrl: string;
  messages: BotMessages;
  buttons: ButtonLabels;
  botInfo?: BotInfo | null;
  gemini: GeminiConfig;
}

export type ActiveTab = 
  | 'overview' 
  | 'token' 
  | 'channels' 
  | 'webapp' 
  | 'messages' 
  | 'ai'
  | 'users'
  | 'broadcast'
  | 'simulator' 
  | 'code';

export type Language = 'bn' | 'en';
