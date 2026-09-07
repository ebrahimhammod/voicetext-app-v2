import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  Sparkles,
  Play
} from 'lucide-react';

export const ApkCenter: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<'index' | 'sound' | 'tts' | 'activation'>('index');
  const [iframeKey, setIframeKey] = useState<number>(0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getPreviewUrl = () => {
    switch (previewPage) {
      case 'sound': return '/sound/sound.html';
      case 'tts': return '/sound/text_to_speech.html';
      case 'activation': return '/sound/activation.html';
      case 'index':
      default: return '/sound/index.html';
    }
  };

  const capacitorCommands = `# 1. تثبيت أدوات Capacitor لتحويل المجلد إلى تطبيق أندرويد
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. تهيئة منصة الأندرويد في مشروعك
npx cap add android

# 3. مزامنة مجلد sound وملفات التطبيق
npx cap sync android

# 4. فتح المشروع في Android Studio لإنشاء ملف APK مباشرة
npx cap open android
# ثم من Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/20">
              <Smartphone className="w-3.5 h-3.5" />
              <span>مركز تصدير وتحزيم تطبيق الهاتف (Android APK)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              مشروعك جاهز كـ تطبيق أندرويد APK متكامل
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              تمت مراجعة جميع ملفاتك (HTML / CSS / JS / PHP / Python)، وتحديث التصميم ليطابق معايير تطبيقات الهواتف الذكية (Android Material 3) وإصلاح المسارات الثابتة لتصبح ديناميكية ومرنة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/sound/index.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <ExternalLink className="w-4 h-4" />
              فتح في تبويب جديد
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Phone Simulator + Packaging Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Android Phone Frame */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-800 text-sm">معاينة تفاعلية حية داخل هاتف أندرويد</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setPreviewPage('index')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  previewPage === 'index' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الرئيسية
              </button>
              <button
                onClick={() => setPreviewPage('sound')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  previewPage === 'sound' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                صوت لنص
              </button>
              <button
                onClick={() => setPreviewPage('tts')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  previewPage === 'tts' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                نص لصوت
              </button>
              <button
                onClick={() => setPreviewPage('activation')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  previewPage === 'activation' ? 'bg-blue-600 text-white shadow-xs' : 'text-amber-700 font-extrabold hover:bg-amber-50'
                }`}
              >
                ⚡ التفعيل (80$)
              </button>
              <button
                onClick={() => setIframeKey(k => k + 1)}
                title="إعادة تحميل المعاينة"
                className="p-1 text-slate-500 hover:text-slate-900 rounded-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Android Device Mockup Shell */}
          <div className="relative w-full max-w-[390px] aspect-[9/19] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 shadow-blue-900/10">
            {/* Top Speaker / Camera Punch Hole */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
            </div>

            {/* Screen Inner Frame */}
            <div className="w-full h-full rounded-[34px] overflow-hidden bg-white relative flex flex-col">
              <iframe
                key={iframeKey}
                src={getPreviewUrl()}
                title="تطبيق أندرويد الأصلي"
                className="w-full h-full border-0"
              />
            </div>

            {/* Bottom Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-500/40 rounded-full"></div>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            يمكنك تجربة التفاعل الكامل (الضغط والتنقل) مباشرة داخل إطار الهاتف أعلاه.
          </p>
        </div>

        {/* Right Column: Packaging Guides & Code Review */}
        <div className="lg:col-span-6 space-y-6">
          {/* Packaging Option 1: Capacitor Native APK */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    طريقة 1: بناء APK رسمي عبر Capacitor & Android Studio
                  </h3>
                  <p className="text-xs text-slate-500">
                    تم إنشاء ملف <code>capacitor.config.json</code> تلقائياً وهو جاهز للبناء
                  </p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(capacitorCommands, 'cap')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {copiedCode === 'cap' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الأوامر</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed dir-ltr text-left">
              {capacitorCommands}
            </pre>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  حزمة التطبيق
                </div>
                <div className="text-xs font-mono text-slate-600">com.creative.soundapp</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  مجلد الويب المصدّر
                </div>
                <div className="text-xs font-mono text-slate-600">/sound (WebDir)</div>
              </div>
            </div>
          </div>

          {/* Packaging Option 2: Instant PWA / TWA Install */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  طريقة 2: تثبيت مباشر على الهاتف (PWA / WebAPK)
                </h3>
                <p className="text-xs text-slate-500">
                  يعمل دون الحاجة لمتجر تطبيقات، مع دعم كامل للتشغيل أوفلاين
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                <span>تم إعداد ملف <code>manifest.json</code> بكافة تفاصيل التطبيق والاسم العربي والأيقونات.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                <span>تم إعداد <code>sw.js</code> (Service Worker) لتخزين كل الملفات محلياً وتشغيلها بدون إنترنت.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                <span>عند فتح الرابط على هاتف أندرويد عبر متصفح Chrome، سيظهر خيار <strong>"تثبيت التطبيق على الشاشة الرئيسية"</strong> كأيقونة تطبيق أصلي.</span>
              </div>
            </div>
          </div>

          {/* New: Piper ar_JO-kareem-medium.onnx (60MB) Integration Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/70 rounded-2xl p-6 border-2 border-indigo-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                ONNX
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span>تم ضبط نموذج كريم العصبي (ar_JO-kareem-medium.onnx)</span>
                  <span className="text-[11px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">60MB Offline</span>
                </h3>
                <p className="text-xs text-slate-600">
                  تمت تهيئة الكود للبحث عن ملفك الصوتي واكتشافه تلقائياً دون الحاجة لتعديل الكود
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-white p-4 rounded-xl border border-indigo-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>ملف التكوين جاهز:</strong> ملف الإعدادات <code>ar_JO-kareem-medium.onnx.json</code> متواجد ومضبوط بالكامل داخل مجلد <code>sound/piper_voices/</code>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>مكان وضع ملف الـ 60MB:</strong> ضع ملفك <code>ar_JO-kareem-medium.onnx</code> داخل مجلد <code>sound/piper_voices/</code> (أو داخل مجلد <code>sound/</code> الرئيسي مباشرة).
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>اكتشاف ديناميكي:</strong> قمنا بتحديث <code>tts_handler.py</code> و <code>test_piper.py</code> ليفحص المسارات تلقائياً على كل من Windows و Linux و Android بدون أي أخطاء.
                </p>
              </div>
            </div>
          </div>

          {/* 100% Free Lifetime APK Packaging Methods - Zero Cost / No Subscriptions */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-2xl p-6 border-2 border-emerald-300 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span>طرق مجانية مدى الحياة 100% لبناء وتجهيز APK (بدون أي دفع نهائياً)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">0$ مجاناً للأبد</span>
                </h3>
                <p className="text-xs text-slate-600">
                  لا تحتاج إطلاقاً لأي منصات مدفوعة أو اشتراكات شهرية، إليك الطرق الرسمية المفتوحة المصدر:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              {/* Option A: GitHub Actions Cloud Build */}
              <div className="bg-white p-4 rounded-xl border-2 border-emerald-400 shadow-xs space-y-2.5">
                <div className="font-black text-slate-900 text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">★</span>
                    الخيار الأسرع والأنسب: بناء APK سحابي بضغطة زر عبر GitHub Actions
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-extrabold px-2 py-0.5 rounded">0 ميجابايت تنزيل على جهازك • ملف APK حقيقي</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  قمنا بإنشاء ملف التكوين الجاهز <code>.github/workflows/build-apk.yml</code> داخل مشروعك!
                  <br />
                  <strong>كيف يعمل؟</strong>
                  <br />
                  1. ارفع المشروع إلى حساب مجاني على <strong>GitHub</strong>.
                  <br />
                  2. اذهب لتبويب <strong>Actions</strong> واضغط <strong>Run workflow</strong>.
                  <br />
                  3. خوادم مايكروسوفت السحابية القوية تقوم ببناء ملف الـ APK وتمنحك ملف <strong>SoundCreativeApp-debug.apk</strong> جاهزاً للتنزيل والتثبيت على هاتفك مباشرة بدون تنزيل أي برامج على حاسوبك وبدون أي اشتراك مدى الحياة!
                </p>
              </div>

              {/* Option B: Lightweight Local CLI Build */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                <div className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">1</span>
                    البناء المحلي الخفيف على جهازك (أقل من 200 ميجابايت بدون أندرويد ستوديو)
                  </span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 font-bold px-2 py-0.5 rounded">Terminal CLI</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  لا تحتاج لتحميل برنامج Android Studio الثقيل (4GB). فقط ثبّت حزمة جافا الخفيفة <strong>OpenJDK 17</strong> (حوالي 150MB)، ونفذ الأوامر التالية في موجه الأوامر:
                  <br />
                  <code className="bg-slate-900 text-emerald-400 px-3 py-2 rounded text-[11px] font-mono block mt-1 dir-ltr text-left">
                    npm install @capacitor/core @capacitor/cli @capacitor/android<br />
                    npx cap add android<br />
                    npx cap sync android<br />
                    cd android &amp;&amp; gradlew assembleDebug
                  </code>
                  تجد ملف الـ APK الناتج فوراً داخل: <code>android/app/build/outputs/apk/debug/app-debug.apk</code>
                </p>
              </div>

              {/* Option C: Bubblewrap CLI */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                <div className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">2</span>
                    أداة Google Bubblewrap الرسمية (أقل من 50 ميجابايت)
                  </span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 font-bold px-2 py-0.5 rounded">Google Tool</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  أداة جوجل الرسمية لبناء تطبيق APK أندرويد مستقل بشاشة كاملة:
                  <br />
                  <code className="bg-slate-900 text-slate-100 px-2.5 py-1.5 rounded text-[11px] font-mono block mt-1 dir-ltr text-left">
                    npm install -g @bubblewrap/cli &amp;&amp; bubblewrap init --manifest=sound/manifest.json &amp;&amp; bubblewrap build
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* New: Activation System & Owner Panel Guide */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-6 border border-amber-200 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  نظام التفعيل الأوفلاين والخطة السنوية (80$)
                </h3>
                <p className="text-xs text-slate-600">
                  تحقق رياضي محلي 100% دون الحاجة لسيرفر مع لوحة خاصة للمالك
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
                <div className="font-bold text-slate-900">
                  1. الخطة المجانية مقابل السنوية (80$)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  الخطة المجانية محددة بـ 3 تفريغات صوتية يومياً (حتى 60 ثانية للمقطع)، ونطق نصوص حتى 250 حرف فقط. الخطة السنوية (80$) تفتح الاستخدام الكامل اللامحدود لكافة النماذج والملفات.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
                <div className="font-bold text-slate-900">
                  2. تحويل الرسوم وطلب التفعيل عبر واتساب
                </div>
                <p className="text-slate-600 leading-relaxed">
                  يضغط العميل على زر "طلب الاشتراك عبر واتساب"، فيتم فتح شات واتساب مباشرة مع المالك <strong>ابراهيم القديمي (+967775888836)</strong> يحمل معرّف الجهاز الفريد تلقائياً.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
                <div className="font-bold text-slate-900">
                  3. لوحة تحكم المالك وتوليد الأكواد (PIN: 7758)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  من صفحة <code>activation.html</code> اضغط على زر <strong>"🔒 لوحة المالك"</strong> وأدخل الرمز السري <code>7758</code>، ثم ألصق معرف جهاز العميل لتوليد كود تفعيل مطابق يفك التشفير محلياً على هاتف العميل دون إنترنت!
                </p>
              </div>
            </div>
          </div>

          {/* Review of Enhancements Made to the User's Files */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-6 border border-blue-100 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              ملخص المراجعة والتحسينات المطبقة على مشروعك
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  تحويل التصميم إلى تجربة تطبيق أندرويد APK (وليس مجرد موقع)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  تم تضمين شريط حالة أندرويد (Status Bar)، وتحسين شريط التنقل السفلي بأزرار لمس مريحة (Material 3)، وإضافة خط Tajawal العربي الأنيق مع تأثيرات ضغط حقيقية (Haptic Touch feedback).
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  إصلاح المسارات الثابتة في Python و PHP (Path Portability)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  في ملفي <code>tts_handler.py</code> و <code>tts_api.php</code> كان مسار بايثون ومجلد النماذج مثبتاً على مسار <code>C:\Users\lenovo\...</code>. قمنا بجعل المسار ديناميكياً باستخدام <code>os.path</code> ليتم اكتشاف بايثون والنماذج تلقائياً في أي بيئة أو هاتف.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  إصلاح الأخطاء النصية وأيقونات التنقل
                </div>
                <p className="text-slate-600 leading-relaxed">
                  تم تصحيح تكرار "مرحباً بك بك" في الصفحة الرئيسية، وتصحيح رمز الرئيسية في شريط التنقل لتفادي أي أخطاء عرض CSS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
