/**
 * Audio and Speech Recognition / Synthesis Utilities
 */

// Browser Speech Recognition Check
export function getSpeechRecognitionClass(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!getSpeechRecognitionClass();
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Convert Blob to Base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 portion
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert Base64 PCM/WAV to Audio Blob URL
export function base64ToAudioUrl(base64Data: string, mimeType = 'audio/mp3'): string {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Download text file
export function downloadTextFile(filename: string, text: string) {
  const element = document.createElement('a');
  const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Download Audio Blob
export function downloadAudioBlob(blob: Blob, filename = 'voice-recording.wav') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Common Arabic Dialects for Speech-to-Text
export const ARABIC_LANGUAGES = [
  { code: 'ar-SA', name: 'العربية (المملكة العربية السعودية)' },
  { code: 'ar-EG', name: 'العربية (مصر)' },
  { code: 'ar-AE', name: 'العربية (الإمارات)' },
  { code: 'ar-KW', name: 'العربية (الكويت)' },
  { code: 'ar-QA', name: 'العربية (قطر)' },
  { code: 'ar-JO', name: 'العربية (الأردن)' },
  { code: 'ar-SY', name: 'العربية (سوريا)' },
  { code: 'ar-LB', name: 'العربية (لبنان)' },
  { code: 'ar-IQ', name: 'العربية (العراق)' },
  { code: 'ar-DZ', name: 'العربية (الجزائر)' },
  { code: 'ar-MA', name: 'العربية (المغرب)' },
  { code: 'ar-TN', name: 'العربية (تونس)' },
  { code: 'ar-YE', name: 'العربية (اليمن)' },
  { code: 'ar', name: 'العربية الفصحى العامة' },
  { code: 'en-US', name: 'الإنجليزية (English - US)' },
  { code: 'en-GB', name: 'الإنجليزية (English - UK)' },
  { code: 'fr-FR', name: 'الفرنسية (Français)' },
  { code: 'tr-TR', name: 'التركية (Türkçe)' },
];
