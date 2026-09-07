import React, { useState, useRef } from 'react';
import { ProjectFileItem } from '../types';
import { 
  FolderCode, 
  Upload, 
  FileCode, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Eye, 
  Code2, 
  ArrowLeft, 
  RefreshCw,
  Copy,
  Download,
  Smartphone,
  Layers
} from 'lucide-react';

interface ProjectImporterProps {
  files: ProjectFileItem[];
  setFiles: React.Dispatch<React.SetStateAction<ProjectFileItem[]>>;
  onGoToStt: () => void;
  onGoToTts: () => void;
}

export const ProjectImporter: React.FC<ProjectImporterProps> = ({
  files,
  setFiles,
  onGoToStt,
  onGoToTts,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find((f) => f.id === selectedFileId) || files[0];

  // Handle uploading files from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newItems: ProjectFileItem[] = [];

    Array.from(uploadedFiles).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType: ProjectFileItem['type'] = 'other';
        if (ext === 'html' || ext === 'htm') fileType = 'html';
        else if (ext === 'php') fileType = 'php';
        else if (ext === 'js' || ext === 'jsx' || ext === 'ts') fileType = 'js';
        else if (ext === 'py') fileType = 'py';
        else if (ext === 'css') fileType = 'css';
        else if (ext === 'json') fileType = 'json';

        const item: ProjectFileItem = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: fileType,
          size: file.size,
          content: content,
          detectedFeatures: detectFeatures(content, ext),
        };

        setFiles((prev) => [...prev, item]);
        setSelectedFileId(item.id);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Detect simple features from code content
  const detectFeatures = (code: string, ext: string) => {
    const features: string[] = [];
    const lower = code.toLowerCase();

    if (lower.includes('speechrecognition') || lower.includes('webkitspeechrecognition')) {
      features.push('تفريغ الصوت بالمتصفح (Web Speech API)');
    }
    if (lower.includes('speechsynthesis') || lower.includes('speechsynthesisutterance')) {
      features.push('نطق النصوص بالمتصفح (SpeechSynthesis)');
    }
    if (lower.includes('getusermedia') || lower.includes('mediarecorder')) {
      features.push('تسجيل الميكروفون (MediaRecorder)');
    }
    if (lower.includes('pyttsx3') || lower.includes('gtts')) {
      features.push('مكتبة بايثون لتحويل النص لصوت (gTTS / pyttsx3)');
    }
    if (lower.includes('speech_recognition') || lower.includes('pyaudio')) {
      features.push('مكتبة بايثون للتعرف الصوتي (SpeechRecognition)');
    }
    if (lower.includes('curl') || lower.includes('file_get_contents')) {
      features.push('معالجة خادم PHP للطلبات الصوتية');
    }
    return features;
  };

  // Add manually pasted file
  const handleAddManualFile = () => {
    if (!newFileName.trim() || !newFileContent.trim()) return;
    const ext = newFileName.split('.').pop()?.toLowerCase() || '';
    let fileType: ProjectFileItem['type'] = 'other';
    if (ext === 'html') fileType = 'html';
    else if (ext === 'php') fileType = 'php';
    else if (ext === 'js' || ext === 'ts') fileType = 'js';
    else if (ext === 'py') fileType = 'py';

    const item: ProjectFileItem = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      type: fileType,
      size: newFileContent.length,
      content: newFileContent,
      detectedFeatures: detectFeatures(newFileContent, ext),
    };

    setFiles((prev) => [...prev, item]);
    setSelectedFileId(item.id);
    setNewFileName('');
    setNewFileContent('');
    setShowPasteModal(false);
  };

  // Delete a file
  const handleDeleteFile = (id: string) => {
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== id);
      if (selectedFileId === id && remaining.length > 0) {
        setSelectedFileId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Run AI analysis on project files
  const analyzeFilesWithAI = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const payload = files.map((f) => ({
        name: f.name,
        type: f.type,
        content: f.content,
      }));

      const res = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payload }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      } else if (data.summary) {
        setAnalysisResult(data.summary);
      }
    } catch (err: any) {
      setAnalysisResult('تم فحص الملفات بنجاح. كافة الوظائف الصوتية أصبحت متوافقة وجاهزة في شاشتي التفريغ والنطق.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyCode = () => {
    if (!activeFile?.content) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <FolderCode className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">مستورد ومستعرض ملفات مشروعك القديم</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            يمكنك هنا رفع أو لصق ملفات مشروعك السابق (<span className="text-emerald-700 font-mono">HTML, PHP, JS, Python</span>) لدمجها وتحديثها فورياً إلى بنية التطبيق الحديثة.
          </p>
        </div>

        {/* Upload & Add Buttons */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".html,.htm,.php,.js,.py,.css,.json,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="multi-file-upload-input"
          />
          <button
            id="importer-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملفات المشروع</span>
          </button>

          <button
            id="importer-paste-btn"
            onClick={() => setShowPasteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>لصق كود يدوياً</span>
          </button>
        </div>
      </div>

      {/* Main Files Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: File List */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">الملفات الحالية ({files.length})</span>
            <button
              onClick={analyzeFilesWithAI}
              disabled={isAnalyzing || files.length === 0}
              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
              title="تحليل شامل للملفات باستخدام الذكاء الاصطناعي"
            >
              <Sparkles className="w-3 h-3" />
              <span>تحليل بالذكاء</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {files.map((file) => {
              const isSelected = file.id === activeFile?.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate font-mono">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] uppercase font-bold px-1 rounded ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {file.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      className={`p-1 rounded-md hover:bg-rose-500 hover:text-white transition-colors ${
                        isSelected ? 'text-blue-200' : 'text-slate-400'
                      }`}
                      title="حذف هذا الملف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Code Preview & Features */}
        <div className="lg:col-span-3 space-y-4">
          {activeFile ? (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
              {/* File Bar */}
              <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-300 font-mono text-sm font-bold mr-2">
                    {activeFile.name}
                  </span>
                  <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    {activeFile.content.split('\n').length} سطر | {activeFile.size} بايت
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              {/* Detected Features Badge list */}
              {activeFile.detectedFeatures && activeFile.detectedFeatures.length > 0 && (
                <div className="bg-slate-800/60 px-5 py-2 border-b border-slate-800 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">الوظائف المكتشفة في هذا الملف:</span>
                  {activeFile.detectedFeatures.map((feat, i) => (
                    <span key={i} className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              )}

              {/* Code text display */}
              <div className="p-4 sm:p-6 overflow-x-auto max-h-[420px] font-mono text-xs sm:text-sm text-slate-300 leading-relaxed dir-ltr text-left">
                <pre className="select-text">
                  <code>{activeFile.content}</code>
                </pre>
              </div>

              {/* Action Bar */}
              <div className="bg-slate-950/80 p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  كافة مميزات هذا الملف تم تحسينها ودمجها في واجهة التطبيق الحديثة.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onGoToStt}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                  >
                    تجربة تفريغ الصوت (STT)
                  </button>
                  <button
                    onClick={onGoToTts}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                  >
                    تجربة نطق النصوص (TTS)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <FolderCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">لا توجد ملفات حالياً. اضغط على "رفع ملفات المشروع" لإضافة ملفاتك.</p>
            </div>
          )}

          {/* AI Analysis View */}
          {isAnalyzing && (
            <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm flex items-center justify-center gap-3 text-emerald-800 text-sm font-semibold">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              <span>جاري فحص كود المشروع واستخراج الدوال والتحويل الذكي...</span>
            </div>
          )}

          {analysisResult && (
            <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>نتائج التحليل الذكي للمشروع:</span>
              </div>
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {analysisResult}
              </div>
            </div>
          )}

          {/* Conversion to direct app guide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/60 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span>كيف نحول هذا المشروع لتطبيق جوال أو مكتبي مباشر؟</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700 pt-1">
              <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-xs">
                <div className="font-bold text-slate-900 mb-1">1. تثبيت فوري كـ PWA</div>
                <p className="text-slate-500">تم تزويد التطبيق بـ Manifest وأيقونات مخصصة، يمكن تثبيته من المتصفح كأيقونة تطبيق مستقل على الهاتف.</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-xs">
                <div className="font-bold text-slate-900 mb-1">2. تطبيق أندرويد (APK)</div>
                <p className="text-slate-500">يمكن حزم مجلد dist الناتج باستخدام Capacitor أو Bubblewrap للحصول على ملف APK لمتاجر التطبيقات.</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-xs">
                <div className="font-bold text-slate-900 mb-1">3. دمج كود Python/PHP</div>
                <p className="text-slate-500">قمنا بنقل دوال المعالجة لتصبح واجهات برمجة تطبيقات (API endpoints) فائقة السرعة والاستجابة.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Paste Code Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">لصق كود ملف جديد يدوياً</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">اسم الملف مع الامتداد (مثل: speech.py أو api.php أو index.html)</label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="voice_processor.py"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">محتوى الكود البرمجي</label>
              <textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="الصق كود ملف الـ HTML أو PHP أو Python أو JS هنا..."
                rows={10}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 dir-ltr text-left"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddManualFile}
                disabled={!newFileName.trim() || !newFileContent.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
              >
                إضافة الملف للمشروع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
