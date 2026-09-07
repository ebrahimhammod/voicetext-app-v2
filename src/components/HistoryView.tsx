import React, { useState } from 'react';
import { TranscriptionRecord } from '../types';
import { 
  History, 
  Search, 
  Mic, 
  Volume2, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Calendar, 
  Play, 
  FileText 
} from 'lucide-react';
import { downloadTextFile } from '../utils/audioUtils';

interface HistoryViewProps {
  records: TranscriptionRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onSelectRecordForTts: (text: string) => void;
  onSelectRecordForStt: (text: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onDeleteRecord,
  onClearAll,
  onSelectRecordForTts,
  onSelectRecordForStt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'stt' | 'tts'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredRecords = records.filter((r) => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesSearch =
      r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <History className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">سجل العمليات والمحفوظات</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            استعرض النصوص المسجلة والمفرغة والنصوص المحولة إلى صوت بسهولة.
          </p>
        </div>

        {records.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل بالكامل</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في المحفوظات..."
            className="w-full bg-white border border-slate-300 rounded-xl pr-10 pl-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center p-1 bg-slate-200/60 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            الكل ({records.length})
          </button>
          <button
            onClick={() => setFilterType('stt')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'stt' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            تفريغ صوتي ({records.filter((r) => r.type === 'stt').length})
          </button>
          <button
            onClick={() => setFilterType('tts')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'tts' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            نطق نصوص ({records.filter((r) => r.type === 'tts').length})
          </button>
        </div>
      </div>

      {/* Records list */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-3">
          {filteredRecords.map((item) => {
            const isStt = item.type === 'stt';
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        isStt
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {isStt ? <Mic className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isStt ? 'تفريغ صوتي (STT)' : 'نطق نص (TTS)'}</span>
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.timestamp}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(item.id, item.content)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                      title="نسخ"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => downloadTextFile(`voice-text-${item.id}.txt`, item.content)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                      title="تنزيل TXT"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteRecord(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {item.content}
                </div>

                {item.audioUrl && (
                  <div className="pt-1">
                    <audio src={item.audioUrl} controls className="h-9 w-full max-w-sm rounded-lg" />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                  <span>{item.wordCount || item.content.split(/\s+/).length} كلمة</span>
                  <div className="flex items-center gap-2">
                    {isStt ? (
                      <button
                        onClick={() => onSelectRecordForTts(item.content)}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        تحويل لنطق صوتي (TTS) ←
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectRecordForStt(item.content)}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        فتح في التفريغ الصوتي (STT) ←
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-base mb-1">لا توجد سجلات محفوظة بعد</h3>
          <p className="text-slate-500 text-xs">
            قم بتسجيل وتفريغ النصوص الصوتية أو نطق النصوص لتظهر نتائجك وسجلاتك هنا تلقائياً.
          </p>
        </div>
      )}
    </div>
  );
};
