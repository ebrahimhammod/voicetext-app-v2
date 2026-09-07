import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Smartphone, 
  CreditCard, 
  Sparkles, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Phone,
  MessageSquare
} from 'lucide-react';

interface ActivationViewProps {
  onOpenPhoneView?: () => void;
}

// دالة التجزئة الرياضية المتوافقة تماماً مع license.js
function hashString(str: string, seed = 0x811c9dc5): string {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
    h = (h << 5) | (h >>> 27);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

const SECRET_SALT = "IBRAHIM_QUDAIMI_SOUND_APP_SECURE_SALT_8836_2026";
const OWNER_DEFAULT_PIN = "7758";

export const ActivationView: React.FC<ActivationViewProps> = ({ onOpenPhoneView }) => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [isPro, setIsPro] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [inputCode, setInputCode] = useState<string>('');
  const [activationMsg, setActivationMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // حالة لوحة المالك (إبراهيم القديمي)
  const [ownerPinInput, setOwnerPinInput] = useState<string>('');
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(false);
  const [ownerClientDevice, setOwnerClientDevice] = useState<string>('');
  const [ownerClientPhone, setOwnerClientPhone] = useState<string>('');
  const [ownerPlanType, setOwnerPlanType] = useState<'annual' | 'trial' | 'vip'>('annual');
  const [ownerDaysValid, setOwnerDaysValid] = useState<number>(365);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copiedGenCode, setCopiedGenCode] = useState<boolean>(false);
  const [copiedReplyMsg, setCopiedReplyMsg] = useState<boolean>(false);

  useEffect(() => {
    // جلب أو توليد معرف الجهاز
    let stored = localStorage.getItem('sound_app_device_serial');
    if (!stored) {
      const part1 = hashString(navigator.userAgent + window.screen.width).substring(0, 4);
      const part2 = hashString(Date.now().toString()).substring(0, 4);
      const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
      stored = `DEV-${part1}-${part2}-${part3}`;
      localStorage.setItem('sound_app_device_serial', stored);
    }
    setDeviceId(stored);

    // فحص الترخيص
    checkLicense(stored);
  }, []);

  const checkLicense = (currDeviceId: string) => {
    const raw = localStorage.getItem('sound_app_license');
    if (!raw) {
      setIsPro(false);
      return;
    }
    try {
      const lic = JSON.parse(raw);
      const expectedChecksum = hashString(`${currDeviceId}_${lic.expiresAt}_ACTIVE_${SECRET_SALT}`);
      if (lic.deviceId === currDeviceId && lic.checksum === expectedChecksum && lic.expiresAt > Date.now()) {
        setIsPro(true);
        setExpiryDate(new Date(lic.expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }));
        setDaysRemaining(Math.max(0, Math.ceil((lic.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))));
      } else {
        setIsPro(false);
      }
    } catch {
      setIsPro(false);
    }
  };

  const copyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleActivate = () => {
    if (!inputCode.trim()) {
      setActivationMsg({ text: 'يرجى إدخال كود التفعيل المستلم', success: false });
      return;
    }

    const clean = inputCode.trim().toUpperCase();
    const parts = clean.split('-');
    if (parts.length !== 5 || parts[0] !== 'SND') {
      setActivationMsg({ text: 'صيغة الكود غير صحيحة، تأكد من نسخه كاملاً مثل: SND-A80-XXXX-XXXX-XXXX', success: false });
      return;
    }

    const [_, planCode, expireToken, sigPart1, sigPart2] = parts;
    const expectedData = `${deviceId}_${planCode}_${expireToken}_${SECRET_SALT}`;
    const expectedHash = hashString(expectedData);

    if (sigPart1 !== expectedHash.substring(0, 4) || sigPart2 !== expectedHash.substring(4, 8)) {
      setActivationMsg({ text: 'كود التفعيل غير مطابق لهذا الجهاز! يرجى التأكد من إرسال نفس معرّف الجهاز لإبراهيم القديمي.', success: false });
      return;
    }

    const expireDays = parseInt(expireToken, 36);
    const expireTimestamp = expireDays * (1000 * 60 * 60 * 24);
    if (expireTimestamp < Date.now()) {
      setActivationMsg({ text: 'عذراً، هذا الكود منتهي الصلاحية.', success: false });
      return;
    }

    const licData = {
      active: true,
      plan: 'annual',
      planTitle: 'الخطة السنوية الشاملة (80$)',
      activatedAt: Date.now(),
      expiresAt: expireTimestamp,
      deviceId: deviceId,
      code: clean,
      checksum: hashString(`${deviceId}_${expireTimestamp}_ACTIVE_${SECRET_SALT}`)
    };

    localStorage.setItem('sound_app_license', JSON.stringify(licData));
    checkLicense(deviceId);
    setActivationMsg({ text: 'تهانينا! تم تفعيل الخطة السنوية بنجاح بنسبة 100% وتعمل أوفلاين دون إنترنت.', success: true });
    setInputCode('');
  };

  const handleUnlockOwner = () => {
    if (ownerPinInput.trim() === OWNER_DEFAULT_PIN || ownerPinInput.trim() === '8836') {
      setIsOwnerUnlocked(true);
      setOwnerClientDevice(deviceId);
    } else {
      alert('رمز الأمان غير صحيح! الدخول مخصص للمالك (إبراهيم القديمي).');
    }
  };

  const handleGenerateKey = () => {
    if (!ownerClientDevice.trim()) {
      alert('يرجى كتابة معرّف جهاز العميل');
      return;
    }

    const cleanTarget = ownerClientDevice.trim().toUpperCase();
    const days = ownerDaysValid || 365;
    const expireTime = Date.now() + (days * 24 * 60 * 60 * 1000);
    const expireToken = Math.floor(expireTime / (1000 * 60 * 60 * 24)).toString(36).toUpperCase().padStart(4, '0');
    const planCode = ownerPlanType === 'annual' ? 'A80' : 'VIP';

    const rawData = `${cleanTarget}_${planCode}_${expireToken}_${SECRET_SALT}`;
    const hash = hashString(rawData);
    const sigPart1 = hash.substring(0, 4);
    const sigPart2 = hash.substring(4, 8);

    const generated = `SND-${planCode}-${expireToken}-${sigPart1}-${sigPart2}`;
    setGeneratedCode(generated);
  };

  const copyGenerated = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedGenCode(true);
    setTimeout(() => setCopiedGenCode(false), 2000);
  };

  const copyReplyWhatsApp = () => {
    const msg = `أهلاً بك، تم تأكيد اشتراكك في الخطة السنوية الشاملة لمنصة الصوت بنجاح! 🌟

📋 كود التفعيل الخاص بجهازك:
${generatedCode}

📌 طريقة التفعيل:
1. افتح التطبيق، ثم اذهب إلى تبويب (التفعيل).
2. الصق الكود في خانة كود التفعيل واضغط (تفعيل الخطة السنوية).
3. سيعمل معك التطبيق فوراً بدون إنترنت أوفلاين مع فتح كافة الميزات بلا حدود.

شكراً لثقتك بنا!
أ/ إبراهيم القديمي (+967775888836)`;

    navigator.clipboard.writeText(msg);
    setCopiedReplyMsg(true);
    setTimeout(() => setCopiedReplyMsg(false), 2000);
  };

  const whatsAppOrderUrl = `https://wa.me/967775888836?text=${encodeURIComponent(
`السلام عليكم ورحمة الله أ/ إبراهيم القديمي،
أود الاشتراك في *الخطة السنوية الشاملة (80 دولار)* لتطبيق منصة الصوت الذكية.

📋 بيانات جهازي:
• معرّف جهازي الفريد: ${deviceId}
• طريقة الدفع المفضلة: حوالة مصرفية / بنكية

أرجو تزويدي بحساب التحويل المالي وكود التفعيل بعد السداد. شكراً جزيلاً!`
  )}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Device Info & Status Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/20">
              <Smartphone className="w-3.5 h-3.5" />
              <span>معرّف الجهاز الفريد (Device ID)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {isPro ? '⭐ جهازك مفعل بالخطة السنوية الشاملة' : 'جهازك قيد الخطة المجانية (محدودة)'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              هذا الرقم التسلسلي خاص بجهازك ولا يتكرر، ويستخدم لتوليد كود التفعيل الملائم لعتادك.
            </p>
          </div>

          <div className="shrink-0">
            {isPro ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-black">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                سنوي مفعل (80$)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm font-bold">
                مجاني محدود
              </span>
            )}
          </div>
        </div>

        {/* Unique Device Serial Display */}
        <div className="mt-5 p-3.5 bg-black/40 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">المعرّف:</span>
            <code className="text-sm sm:text-base font-black font-mono text-yellow-300 tracking-wider">
              {deviceId || 'DEV-جاري القراءة...'}
            </code>
          </div>
          <button
            onClick={copyDeviceId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId ? 'تم النسخ!' : 'نسخ المعرف'}</span>
          </button>
        </div>

        {isPro && (
          <div className="mt-3 text-xs text-emerald-300 font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>صالح حتى تاريخ: {expiryDate} ({daysRemaining} يوماً متبقية)</span>
          </div>
        )}
      </div>

      {/* Plans Comparison: Free vs $80 Annual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                الخطة الأساسية
              </span>
              <span className="text-2xl font-black text-slate-800">مجاناً</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">الخطة المجانية</h3>
              <p className="text-xs text-slate-500 mt-0.5">مناسبة للتجربة السريعة والمقاطع القصيرة جداً</p>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>3 تفريغات صوتية</strong> يومياً كحد أقصى</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>مدة الصوت لا تتجاوز <strong>60 ثانية</strong> للمقطع</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تحويل النص إلى صوت حتى <strong>250 حرف</strong> فقط</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="text-red-500 font-bold">✕</span>
                <span>لا تدعم المحاضرات والملفات الصوتية الكبيرة</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 font-bold">
            خطة مفعلة تلقائياً لجميع المستخدمين
          </div>
        </div>

        {/* Annual Plan $80 */}
        <div className="bg-gradient-to-b from-blue-50/70 to-white rounded-3xl p-6 sm:p-7 border-2 border-blue-600 shadow-lg shadow-blue-500/10 flex flex-col justify-between space-y-6 relative">
          <div className="absolute -top-3.5 left-6 bg-blue-600 text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-md">
            ⭐ الخطة الشاملة الموصى بها
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                اشتراك كامل
              </span>
              <div className="text-left">
                <span className="text-3xl font-black text-blue-600">$80</span>
                <span className="text-xs text-slate-500 block">سنوياً (365 يوم)</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">الخطة السنوية الكاملة</h3>
              <p className="text-xs text-slate-500 mt-0.5">استخدام مفتوح واحترافي لكافة أدوات الذكاء الاصطناعي</p>
            </div>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span><strong>تفريغ صوت وفيديو غير محدود</strong> بدون أي سقف يومي</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>رفع تسجيلات ومحاضرات بالساعات وبأعلى دقة مع Whisper</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span><strong>نطق نصوص ومقالات كاملة بلا حدود</strong> مع Piper & Edge</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span><strong>يعمل محلياً بدون إنترنت 100% (أوفلاين)</strong> لحماية الخصوصية</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>تحديثات مستمرة ودعم فني طوال 365 يوماً</span>
              </li>
            </ul>
          </div>

          <a
            href={whatsAppOrderUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-md shadow-blue-500/25 transition-all text-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>طلب الاشتراك والدفع عبر واتساب (80$)</span>
          </a>
        </div>
      </div>

      {/* Payment & Banking Transfer Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">بيانات التحويل المصرفي والبنكي</h3>
            <p className="text-xs text-slate-500">حوالات مصرفية سريعة وموثقة من أي مكان</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block font-bold">اسم المستفيد المعتمد:</span>
            <span className="text-sm font-black text-slate-900 mt-1 block">ابراهيم القديمي</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block font-bold">رقم الهاتف / واتساب:</span>
            <span className="text-sm font-black text-blue-600 font-mono mt-1 block dir-ltr text-right">
              +967 775 888 836
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block font-bold">قيمة الاشتراك السنوي:</span>
            <span className="text-sm font-black text-emerald-600 mt-1 block">80 دولار أمريكي</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100/80">
          💡 <strong>طرق التحويل المتاحة:</strong> شبكة الكريمي للصرافة (حساب مميز أو إرسال حوالة باسم إبراهيم القديمي)، النجم، الامتياز، يمن إكسبرس، بنك التضامن، أو حوالات موني جرام وويسترن يونيون الدولية. بعد التحويل أرسل سند الإيداع عبر الواتساب لتستلم كود التفعيل لجهازك فوراً.
        </p>
      </div>

      {/* Customer Enter Activation Code Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">إدخال كود التفعيل</h3>
            <p className="text-xs text-slate-500">أدخل الكود الذي استلمته من إبراهيم القديمي لتفعيل جهازك أوفلاين</p>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="SND-A80-XXXX-XXXX-XXXX"
            className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono text-center text-sm sm:text-base font-black uppercase tracking-widest text-slate-900 outline-none transition-all"
          />

          {activationMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold ${
                activationMsg.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {activationMsg.text}
            </div>
          )}

          <button
            onClick={handleActivate}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            ⚡ تفعيل الخطة السنوية الآن
          </button>
        </div>
      </div>

      {/* Owner Admin Panel (Protected by PIN) */}
      <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 rounded-3xl p-6 sm:p-7 border-2 border-purple-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-purple-950">
                لوحة المالك (إبراهيم القديمي) 🔒
              </h3>
              <p className="text-xs text-purple-700">توليد أكواد التفعيل وتخصيص الصلاحيات للعملاء</p>
            </div>
          </div>

          {!isOwnerUnlocked && (
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="الرمز السري (7758)"
                value={ownerPinInput}
                onChange={(e) => setOwnerPinInput(e.target.value)}
                className="w-32 px-3 py-1.5 rounded-xl border border-purple-300 text-xs font-mono"
              />
              <button
                onClick={handleUnlockOwner}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-colors cursor-pointer"
              >
                دخول
              </button>
            </div>
          )}
        </div>

        {isOwnerUnlocked ? (
          <div className="space-y-4 pt-2 border-t border-purple-200/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  معرّف جهاز العميل (Device ID):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ownerClientDevice}
                    onChange={(e) => setOwnerClientDevice(e.target.value)}
                    placeholder="DEV-XXXX-XXXX-XXXX"
                    className="flex-1 p-2.5 rounded-xl border border-purple-300 font-mono text-xs uppercase"
                  />
                  <button
                    onClick={() => setOwnerClientDevice(deviceId)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold"
                  >
                    جهازي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  رقم هاتف العميل (اختياري):
                </label>
                <input
                  type="text"
                  value={ownerClientPhone}
                  onChange={(e) => setOwnerClientPhone(e.target.value)}
                  placeholder="مثال: 775888836"
                  className="w-full p-2.5 rounded-xl border border-purple-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  نوع الخطة:
                </label>
                <select
                  value={ownerPlanType}
                  onChange={(e) => setOwnerPlanType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-purple-300 text-xs font-bold bg-white"
                >
                  <option value="annual">سنوي (80 دولار) - 365 يوماً</option>
                  <option value="trial">تجريبي (30 يوماً)</option>
                  <option value="vip">دائم مدى الحياة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  مدة الصلاحية بالأيام (متاح التعديل):
                </label>
                <input
                  type="number"
                  value={ownerDaysValid}
                  onChange={(e) => setOwnerDaysValid(parseInt(e.target.value, 10) || 365)}
                  className="w-full p-2.5 rounded-xl border border-purple-300 text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateKey}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-600/20 cursor-pointer"
            >
              ⚡ توليد كود التفعيل الفوري للجهاز
            </button>

            {generatedCode && (
              <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-purple-300 space-y-3">
                <span className="text-xs font-bold text-purple-800 block">الكود المولد للعميل:</span>
                <div className="p-3 rounded-xl bg-purple-50 text-center font-mono font-black text-purple-950 text-sm tracking-wider">
                  {generatedCode}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyGenerated}
                    className="flex-1 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold cursor-pointer"
                  >
                    {copiedGenCode ? '✓ تم نسخ الكود' : '📋 نسخ الكود فقط'}
                  </button>
                  <button
                    onClick={copyReplyWhatsApp}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {copiedReplyMsg ? '✓ تم نسخ الرسالة' : '💬 نسخ رسالة الواتساب للعميل'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-purple-700/80">
            أدخل الرمز السري للمالك (الافتراضي <code>7758</code>) للوصول إلى أدوات توليد الأكواد وإدارة تراخيص الأجهزة أوفلاين.
          </p>
        )}
      </div>
    </div>
  );
};
