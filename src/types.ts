export type ActiveTab = 'home' | 'stt' | 'tts' | 'importer' | 'history' | 'apk-center' | 'activation' | 'review' | 'phone-view';

export interface TranscriptionRecord {
  id: string;
  type: 'stt' | 'tts';
  title: string;
  content: string;
  timestamp: string;
  language?: string;
  audioUrl?: string;
  duration?: number;
  wordCount?: number;
}

export interface ProjectFileItem {
  id: string;
  name: string;
  type: 'html' | 'php' | 'js' | 'py' | 'css' | 'json' | 'other';
  size: number;
  content: string;
  description?: string;
  detectedFeatures?: string[];
}

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender?: 'male' | 'female';
  native?: boolean;
}

export type SttEngine = 'browser' | 'ai' | 'auto';
export type TtsEngine = 'browser' | 'ai';
