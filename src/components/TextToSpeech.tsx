import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Mic, 
  Languages, 
  Sliders, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  isSpeechSynthesisSupported, 
  downloadTextFile, 
  base64ToAudioUrl 
} from '../utils/audioUtils';
import { TranscriptionRecord } from '../types';

interface TextToSpeechProps {
  initialText?: string;
  onSaveRecord: (record: TranscriptionRecord) => void;
  onSendToStt: (text: string) => void;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({
  initialText = '',
  onSaveRecord,
  onSendToStt,
}) => {
  const [text, setText] = useState(initialText);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [engine, setEngine] = useState<'browser' | 'ai'>('ai');
  const [aiVoice, setAiVoice] = useState<string>('ar-SA-ZariyahNeural');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser voices
  useEffect(() => {
    if (!isSpeechSynthesisSupported()) {
      setEngine('ai');
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setBrowserVoices(voices);

      // Prioritize Arabic voice if available
      const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
      if (arabicVoice) {
        setSelectedVoice(arabicVoice.name);
      } else if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0].name);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync initialText prop
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  // Handle Play with Browser Engine
  const speakWithBrowser = () => {
    if (!text.trim()) {
      setErrorMessage('يرجى كتابة أو لصق نص لنطقه أولاً.');
      return;
    }

    if (!isSpeechSynthesisSupported()) {
      speakWithAI();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const chosenVoice = browserVoices.find((v) => v.name === selectedVoice);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setErrorMessage(null);
      setStatusMessage('جاري القراءة الصوتية الآن...');
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setStatusMessage(null);
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
      // Fallback to AI if browser speech failed
      setStatusMessage('فشل محرك المتصفح، جاري التحويل لمحرك الذكاء الاصطناعي...');
      speakWithAI();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Handle Play with AI TTS (Edge Neural online + Piper Kareem offline)
  const speakWithAI = async () => {
    if (!text.trim()) {
      setErrorMessage('يرجى كتابة نص لتوليد الصوت.');
      return;
    }

    // إذا مفيش نص كتير (تحت 2 حرف) نوقف
    if (isPlaying) {
      // إيقاف التشغيل
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setStatusMessage(null);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setStatusMessage('جاري توليد الصوت بالذكاء الاصطناعي...');

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: aiVoice,
        }),
      });

      const data = await res.json();
      // يقبل audioBase64 أو audio (للاتساق)
      const b64 = data.audioBase64 || data.audio;
      if (b64) {
        // Piper بيرجع wav، Edge بيرجع mp3
        const mime = (data.engine && data.engine.includes('Piper')) ? 'audio/wav' : 'audio/mp3';
        const audioUrl = base64ToAudioUrl(b64, mime);
        setGeneratedAudioUrl(audioUrl);

        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          // شغل الصوت تلقائياً بعد التحميل
          try {
            await audioRef.current.play();
            setIsPlaying(true);
            setStatusMessage(`✅ جاري التشغيل: ${data.engine || 'AI'}`);
          } catch (playErr) {
            console.warn('Auto-play blocked, user must click play:', playErr);
            setStatusMessage('✅ تم توليد الصوت. اضغط زر ▶️ للاستماع.');
            setIsPlaying(false);
          }
        }
      } else if (data.fallbackToBrowser) {
        setErrorMessage(data.error || 'تعذر توليد الصوت. جرب صوت المتصفح.');
      } else {
        setErrorMessage(data.error || 'تعذر توليد الصوت');
      }
    } catch (err: any) {
      console.error('AI TTS error:', err);
      setErrorMessage('حدث خطأ أثناء الاتصال بالسيرفر. تأكد من تشغيله.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      if (engine === 'browser' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setStatusMessage(null);
    } else {
      if (engine === 'ai') {
        speakWithAI();
      } else {
        speakWithBrowser();
      }
    }
  };

  // Sample texts for quick testing
  const sampleTexts = [
    {
      title: 'ترحيب بالمشروع',
      text: 'أهلاً بكم في تطبيق تحويل الصوت إلى نص وتفريغ التسجيلات بدقة متناهية، وتحويل النصوص إلى صوت طبيعي ومعبر.',
    },
    {
      title: 'خبر تقني',
      text: 'أحدثت تقنيات الذكاء الاصطناعي ثورة هائلة في التعرف على الكلام ومعالجة اللغات الطبيعية بدقة غير مسبوقة.',
    },
    {
      title: 'حكمة عربية',
      text: 'لسان الفتى نصفٌ ونصفٌ فؤاده، فلم يبقَ إلا صورة اللحم والدمِ.',
    },
  ];

  // Save to history
  const handleSave = () => {
    if (!text.trim()) return;
    const record: TranscriptionRecord = {
      id: Date.now().toString(),
      type: 'tts',
      title: text.slice(0, 40) + '...',
      content: text,
      timestamp: new Date().toLocaleDateString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      audioUrl: generatedAudioUrl || undefined,
      wordCount: text.trim().split(/\s+/).length,
    };
    onSaveRecord(record);
    setStatusMessage('تم حفظ النص في السجل بنجاح!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden Audio element for AI TTS */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          setStatusMessage('✅ انتهى التشغيل');
        }}
        onError={() => {
          setIsPlaying(false);
          setErrorMessage('فشل تشغيل الملف الصوتي. جرب صوت آخر.');
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          if (audioRef.current && !audioRef.current.ended) {
            setIsPlaying(false);
          }
        }}
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Volume2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">تحويل النص إلى صوت (Text-to-Speech)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            اكتب أو الصق أي نص ليتم قراءته ونطقه بأصوات نقية وطبيعية مع خيارات تصدير ملف الصوت.
          </p>
        </div>

        {/* Engine switcher tab */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            id="tts-engine-browser"
            onClick={() => setEngine('browser')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              engine === 'browser'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            أصوات النظام الفورية
          </button>
          <button
            id="tts-engine-ai"
            onClick={() => setEngine('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              engine === 'ai'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>محرك AI (Edge + Kareem)</span>
          </button>
        </div>
      </div>

      {/* Main Text Input Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        {/* Sample Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">أمثلة سريعة:</span>
          {sampleTexts.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setText(sample.text)}
              className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors"
            >
              {sample.title}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="relative p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-md transition-all">
          <textarea
            id="tts-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب أو الصق النص العربي أو الإنجليزي هنا ليتم نطقه فورياً وبشكل معبر..."
            className="w-full min-h-[180px] bg-transparent border-0 resize-y text-slate-800 text-base leading-loose focus:outline-none focus:ring-0 placeholder:text-slate-400"
            dir="auto"
            style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
            spellCheck={false}
          />
        </div>

        {/* Counter and Utility buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-mono">
            {text.trim() ? text.trim().split(/\s+/).length : 0} كلمة | {text.length} حرف
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>

            <button
              onClick={() => onSendToStt(text)}
              disabled={!text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold disabled:opacity-50 transition-colors"
              title="إرسال النص إلى صفحة تفريغ الصوت"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>إرسال لصفحة التفريغ</span>
            </button>

            <button
              onClick={() => setText('')}
              disabled={!text}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
              title="مسح النص"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Controls and Sound Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Voice Selector */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            {engine === 'ai' ? 'صوت الذكاء الاصطناعي (Edge + Piper)' : 'صوت المتصفح المتاح'}
          </label>

          {engine === 'ai' ? (
            <select
              id="tts-ai-voice"
              value={aiVoice}
              onChange={(e: any) => setAiVoice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <optgroup label="🌐 أصوات Microsoft Edge (Online)">
                <option value="ar-SA-ZariyahNeural">Zariyah (سعودية - أنثى)</option>
                <option value="ar-SA-HamedNeural">Hamed (سعودية - ذكر)</option>
                <option value="ar-EG-SalmaNeural">Salma (مصرية - أنثى)</option>
                <option value="ar-EG-ShakirNeural">Shakir (مصري - ذكر)</option>
                <option value="ar-AE-FatimaNeural">Fatima (إماراتية - أنثى)</option>
                <option value="ar-AE-HamdanNeural">Hamdan (إماراتي - ذكر)</option>
                <option value="ar-JO-TasnimNeural">Tasnim (أردنية - أنثى)</option>
                <option value="ar-JO-SanaNeural">Sana (أردنية - أنثى)</option>
              </optgroup>
              <optgroup label="📴 صوت أوفلاين (Piper)">
                <option value="ar_JO-kareem-medium">كريم (Piper - أوفلاين محلي)</option>
              </optgroup>
            </select>
          ) : (
            <select
              id="tts-browser-voice"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {browserVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Speed & Pitch Slider */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>سرعة النطق (Rate)</span>
            <span className="font-mono text-indigo-600">{rate.toFixed(1)}x</span>
          </div>
          <input
            id="tts-rate-slider"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />

          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
            <span>نبرة الصوت (Pitch)</span>
            <span className="font-mono text-indigo-600">{pitch.toFixed(1)}</span>
          </div>
          <input
            id="tts-pitch-slider"
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Actions & Export */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">التصدير والحفظ</div>
            <p className="text-xs text-slate-500">
              يمكنك حفظ النص المكتوب في السجل أو تنزيل ملف الصوت بعد توليده.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <button
              id="tts-save-btn"
              onClick={handleSave}
              disabled={!text.trim()}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-50 transition-colors"
            >
              حفظ النص في السجل
            </button>

            {generatedAudioUrl && (
              <a
                id="tts-download-audio-btn"
                href={generatedAudioUrl}
                download="voice-output.mp3"
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل ملف الصوت (MP3)</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Big Speak Button Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-4">
        {/* Waveform indicator when playing */}
        <div className="h-12 flex items-center justify-center">
          {isPlaying ? (
            <div className="flex items-center gap-1.5 h-8">
              {[30, 80, 50, 100, 60, 90, 40, 70, 95, 65, 85].map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-indigo-600 rounded-full"
                  style={{
                    height: `${height}%`,
                    animation: 'wave 0.8s ease-in-out infinite',
                    animationDelay: `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">جاهز للنطق وتوليد الصوت</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            id="tts-play-btn"
            onClick={togglePlay}
            disabled={isGenerating || !text.trim()}
            className={`px-8 py-3.5 rounded-2xl flex items-center gap-3 font-bold text-base shadow-xl transition-all hover:scale-105 active:scale-95 ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>جاري التوليد...</span>
              </>
            ) : isPlaying ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span>إيقاف الصوت</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>نطق النص الآن</span>
              </>
            )}
          </button>
        </div>

        {/* Notifications */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs sm:text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
