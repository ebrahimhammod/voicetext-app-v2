import React from 'react';
import { ActiveTab } from '../types';
import { 
  Mic, 
  Volume2, 
  FolderCode, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  Upload, 
  Zap, 
  FileText, 
  Smartphone,
  ShieldCheck,
  Languages
} from 'lucide-react';

interface HomeDashboardProps {
  onNavigate: (tab: ActiveTab) => void;
  savedCount: number;
  filesCount: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  savedCount,
  filesCount,
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-blue-900/50">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>بيئة تحويل وتطوير احترافية جاهزة</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            مرحباً بك! حولنا مشروعك إلى تطبيق حديث متكامل وسريع
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            تم تجهيز التطبيق ليجمع صفحات مشروعك الثلاث (الصفحة الرئيسية، وتفريغ الصوت إلى نص، وتحويل النص إلى صوت) بالإضافة إلى لوحة استيراد وفحص ملفاتك الأصلية (<span className="text-blue-300 font-mono">HTML, PHP, JS, Python</span>) لدمجها وتحويلها لتطبيق هاتف وحاسوب مباشر.
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              id="cta-stt"
              onClick={() => onNavigate('stt')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <Mic className="w-4 h-4" />
              <span>ابدأ تفريغ الصوت</span>
              <ArrowLeft className="w-4 h-4 mr-1" />
            </button>

            <button
              id="cta-tts"
              onClick={() => onNavigate('tts')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Volume2 className="w-4 h-4" />
              <span>تحويل النص إلى صوت</span>
            </button>

            <button
              id="cta-importer"
              onClick={() => onNavigate('importer')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <FolderCode className="w-4 h-4 text-emerald-400" />
              <span>رفع كود مشروعك القديم ({filesCount} ملفات)</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid and Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Main Core Modules Cards (3 Columns) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Speech to Text */}
        <div 
          id="card-module-stt"
          onClick={() => onNavigate('stt')}
          className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">تفريغ الصوت إلى نص (STT)</h2>
              <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                مباشر وملفات
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              تسجيل حي من الميكروفون مع موجة صوتية بصرية، أو رفع ملفات صوتية (MP3 / WAV / WebM) وتفريغها بجميع اللهجات العربية مع علامات الترقيم.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>التعرف اللحظي التلقائي عبر المتصفح والـ AI</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>تصدير النصوص (TXT، Word، ترجمة SRT)</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-[-4px] transition-transform">
            <span>فتح صفحة التفريغ</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </div>
        </div>

        {/* Module 2: Text to Speech */}
        <div 
          id="card-module-tts"
          onClick={() => onNavigate('tts')}
          className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Volume2 className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">تحويل النص إلى صوت (TTS)</h2>
              <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200">
                أصوات طبيعية
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              تحويل أي نص عربي أو إنجليزي إلى كلام منطوق مع تحكم كامل بالسرعة، النبرة، والمستوى، مع إمكانية تنزيل الملف الصوتي فورياً.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>مكتبة أصوات عربية وعالمية متعددة</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>مشغل صوت متطور وتصدير ملفات Audio</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center text-indigo-600 font-bold text-sm group-hover:translate-x-[-4px] transition-transform">
            <span>فتح صفحة نطق النصوص</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </div>
        </div>

        {/* Module 3: Project Importer */}
        <div 
          id="card-module-importer"
          onClick={() => onNavigate('importer')}
          className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FolderCode className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">مستورد ملفات مشروعك</h2>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                HTML / PHP / PY / JS
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              المكان المخصص لرفع أو لصق أكواد مشروعك الحالي. نقوم بفحص الأكواد، دمج الوظائف في الواجهة الحديثة وتطويرها مباشرة.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>محرر كود ومعاينة مباشرة للملفات المرفوعة</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>تحليل الأكواد ومعرفة الدوال والـ APIs المستخدمة</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center text-emerald-600 font-bold text-sm group-hover:translate-x-[-4px] transition-transform">
            <span>رفع ومعاينة الملفات</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </div>
        </div>
      </section>

      {/* How it turns into a native app (عشان نحوله الى تطبيق مباشرتنا) */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Smartphone className="w-4 h-4" />
              <span>جاهزية التحويل لتطبيق هاتف ومكتبي (PWA Native)</span>
            </div>
            <h3 className="text-xl font-bold">كيف نقوم بتحويل هذا المشروع إلى تطبيق مثبت؟</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              التطبيق مبني بمعايير Progressive Web App (PWA) الحديثة ومزود بـ Manifest وأيقونات مدمجة. يمكنك تثبيته مباشرة كأيقونة تطبيق على هاتف Android أو iPhone أو الحاسوب، أو تصديره عبر حزمة Capacitor / Cordova ليصبح تطبيق APK أو iOS على المتاجر.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => onNavigate('importer')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>أضف ملفات مشروعك القديم</span>
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>سجل العمليات ({savedCount})</span>
            </button>
          </div>
        </div>

        {/* Feature badges row */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-blue-400 font-extrabold text-lg mb-0.5">100%</div>
            <div className="text-xs text-slate-400">دعم اللغة العربية واللهجات</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-indigo-400 font-extrabold text-lg mb-0.5">فوري</div>
            <div className="text-xs text-slate-400">تسجيل وتفريغ لحظي</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-emerald-400 font-extrabold text-lg mb-0.5">MP3 & WAV</div>
            <div className="text-xs text-slate-400">تصدير الصوت والنص</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-amber-400 font-extrabold text-lg mb-0.5">آمن ومحلي</div>
            <div className="text-xs text-slate-400">معالجة فورية وتشفير</div>
          </div>
        </div>
      </section>
    </div>
  );
};
