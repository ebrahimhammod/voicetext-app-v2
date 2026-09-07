import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Play, 
  Square, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  Volume2, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  FileAudio,
  Languages,
  Clock
} from 'lucide-react';
import { 
  getSpeechRecognitionClass, 
  isSpeechRecognitionSupported, 
  blobToBase64, 
  downloadTextFile, 
  downloadAudioBlob,
  ARABIC_LANGUAGES 
} from '../utils/audioUtils';
import { TranscriptionRecord } from '../types';

interface SpeechToTextProps {
  onSaveRecord: (record: TranscriptionRecord) => void;
  onSendToTts: (text: string) => void;
}

export const SpeechToText: React.FC<SpeechToTextProps> = ({
  onSaveRecord,
  onSendToTts,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimText, setInterimText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ar-SA');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionClass();
    if (SpeechRecognition) {
      // HTTPS check — Web Speech API requires secure context (HTTPS or localhost)
      const isSecure = typeof window !== 'undefined' &&
        (window.isSecureContext ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.protocol === 'https:');

      if (!isSecure) {
        setErrorMessage('⚠️ التعرف الصوتي اللحظي يحتاج HTTPS أو localhost. يمكنك رفع ملف صوتي بدلاً من ذلك.');
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsRecording(true);
        setStatusMessage('جاري الاستماع إليك... تحدث الآن بوضوح');
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += transcriptChunk + ' ';
          } else {
            currentInterim += transcriptChunk;
          }
        }

        if (finalStr) {
          setTranscription((prev) => (prev ? prev.trim() + ' ' + finalStr.trim() : finalStr.trim()));
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('تم رفض إذن الوصول إلى الميكروفون. يرجى تفعيله من إعدادات المتصفح (أيقونة القفل في شريط العنوان).');
        } else if (event.error === 'no-speech') {
          setErrorMessage('لم يتم اكتشاف صوت. تأكد من التحدث بوضوح قرب الميكروفون.');
        } else if (event.error === 'network') {
          setErrorMessage('فشل الاتصال بخدمة التعرف الصوتي. تأكد من اتصال الإنترنت أو ارفع ملف صوتي بدلاً من ذلك.');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('تعذر فتح الميكروفون. تأكد من توصيله وعدم استخدامه من تطبيق آخر.');
        } else {
          setErrorMessage(`خطأ في التعرف الصوتي: ${event.error}. جرب رفع ملف صوتي.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    } else {
      setErrorMessage('⚠️ متصفحك لا يدعم التعرف الصوتي اللحظي. استخدم Chrome أو Edge، أو ارفع ملف صوتي.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [selectedLanguage]);

  // Start recording
  const startRecording = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    audioChunksRef.current = [];

    try {
      // 1. Get user media for audio recording backup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      // 2. Start Speech Recognition
      if (recognitionRef.current) {
        recognitionRef.current.lang = selectedLanguage;
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition already started or error:', e);
        }
      }

      setIsRecording(true);
      setRecordingDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setErrorMessage('تعذر فتح الميكروفون. يرجى التأكد من توصيل الميكروفون وإعطاء الإذن.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setStatusMessage('اكتمل التسجيل.');
  };

  // Handle uploaded audio file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('حجم الملف كبير جداً (الحد الأقصى 25 ميجابايت).');
      return;
    }

    setErrorMessage(null);
    setStatusMessage(`جاري قراءة الملف "${file.name}" وتفريغه بدقة...`);
    setIsProcessing(true);
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));

    try {
      const base64Data = await blobToBase64(file);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: file.type || 'audio/mp3',
          language: selectedLanguage,
        }),
      });

      const data = await res.json();
      if (data.text) {
        setTranscription((prev) => (prev ? prev + '\n' + data.text : data.text));
        const engineName = data.engine || 'المحرك';
        setStatusMessage(`✅ تم التفريغ بنجاح عبر: ${engineName}`);
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      console.error('File transcription error:', err);
      setErrorMessage('فشل في تفريغ الملف الصوتي. يرجى المحاولة مجدداً.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Transcribe the recorded blob using Gemini AI for ultimate accuracy
  const enhanceWithAI = async () => {
    if (!audioBlob) {
      setErrorMessage('لا يوجد تسجيل صوتي متاح للتحسين.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('جاري إعادة تدقيق وتحسين النص بالذكاء الاصطناعي...');
    setErrorMessage(null);

    try {
      const base64Data = await blobToBase64(audioBlob);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: audioBlob.type || 'audio/webm',
          language: selectedLanguage,
          prompt: `قم بتفريغ وتدقيق هذا التسجيل الصوتي بدقة باللغة العربية مع مراعاة علامات الترقيم وتصحيح الكلمات غير الواضحة. أعد فقط النص المفرغ.`,
        }),
      });

      const data = await res.json();
      if (data.text) {
        setTranscription(data.text);
        const engineName = data.engine || 'الذكاء الاصطناعي';
        setStatusMessage(`✅ تم التحسين والتفريغ بنجاح عبر: ${engineName}`);
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage('حدث خطأ أثناء الاتصال بنموذج الذكاء الاصطناعي.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save record to local state / history
  const handleSave = () => {
    if (!transcription.trim()) return;
    const record: TranscriptionRecord = {
      id: Date.now().toString(),
      type: 'stt',
      title: transcription.slice(0, 40) + '...',
      content: transcription,
      timestamp: new Date().toLocaleDateString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      language: selectedLanguage,
      duration: recordingDuration,
      wordCount: transcription.trim().split(/\s+/).length,
    };
    onSaveRecord(record);
    setStatusMessage('تم حفظ النص في السجل بنجاح!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Word & Character count
  const wordCount = transcription.trim() ? transcription.trim().split(/\s+/).length : 0;
  const charCount = transcription.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Mic className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">تفريغ الصوت إلى نص (Speech-to-Text)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            تحدث مباشرة عبر الميكروفون أو ارفع ملفاً صوتياً لتحويله إلى نص عربي فصيح أو لهجات بدقة فائقة.
          </p>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-slate-400" />
          <select
            id="stt-language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isRecording}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {ARABIC_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recording & Control Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        {/* Status / Live Waveform */}
        <div className="h-20 flex items-center justify-center mb-4">
          {isRecording ? (
            <div className="flex items-center gap-1.5 h-12">
              {[40, 70, 90, 60, 100, 75, 45, 80, 95, 55, 85, 65, 90, 40].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-blue-600 rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.max(12, height * (0.4 + Math.random() * 0.6))}%`,
                    animation: 'wave 1s ease-in-out infinite',
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>اضغط على الميكروفون للبدء في التسجيل الفوري أو ارفع ملفاً صوتياً</span>
            </div>
          )}
        </div>

        {/* Big Record Button */}
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            id="stt-record-btn"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
              isRecording
                ? 'bg-rose-600 text-white ring-8 ring-rose-100 shadow-rose-600/30'
                : 'bg-blue-600 text-white ring-8 ring-blue-50 shadow-blue-600/25 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <Square className="w-8 h-8 fill-current" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Duration Counter */}
          <div className="font-mono text-lg font-bold text-slate-700">
            {formatTime(recordingDuration)}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {isRecording ? 'جاري التسجيل... اضغط للإيقاف' : 'انقر للتحدث عبر الميكروفون'}
          </div>
        </div>

        {/* Audio File Upload Alternative */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            id="audio-upload-input"
          />
          <button
            id="stt-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>رفع ملف صوتي (MP3 / WAV / WebM)</span>
          </button>

          {audioUrl && !isRecording && (
            <div className="flex items-center gap-2">
              <audio src={audioUrl} controls className="h-9 max-w-xs rounded-lg" />
              <button
                id="stt-enhance-ai-btn"
                onClick={enhanceWithAI}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                title="إعادة تدقيق وتفريغ الملف عبر نموذج الذكاء الاصطناعي"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>تدقيق بالـ AI</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications & Error messages */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Transcription Output Editor Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 text-base">النص المفرغ</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              {wordCount} كلمة | {charCount} حرف
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="stt-copy-btn"
              onClick={handleCopy}
              disabled={!transcription}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-50 transition-colors"
              title="نسخ النص"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
            </button>

            <button
              id="stt-save-btn"
              onClick={handleSave}
              disabled={!transcription.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <span>حفظ في السجل</span>
            </button>

            <button
              id="stt-download-btn"
              onClick={() => downloadTextFile('transcription.txt', transcription)}
              disabled={!transcription}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل TXT</span>
            </button>

            <button
              id="stt-send-to-tts"
              onClick={() => onSendToTts(transcription)}
              disabled={!transcription}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold disabled:opacity-50 transition-colors"
              title="نقل النص المفرغ لصفحة تحويل النص إلى صوت"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>نطق النص (TTS)</span>
            </button>

            <button
              id="stt-clear-btn"
              onClick={() => {
                setTranscription('');
                setInterimText('');
              }}
              disabled={!transcription && !interimText}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
              title="مسح النص"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md transition-all">
          <textarea
            id="stt-textarea"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="سيظهر النص المفرغ هنا مباشرة أثناء حديثك أو عند رفع ملف صوتي..."
            className="w-full min-h-[180px] max-h-[360px] bg-transparent border-0 resize-y text-slate-800 text-base leading-loose focus:outline-none focus:ring-0 placeholder:text-slate-400"
            dir="auto"
            style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
            spellCheck={false}
          />
          {interimText && (
            <div className="text-blue-600 text-sm font-medium italic mt-2 animate-pulse">
              ... {interimText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
