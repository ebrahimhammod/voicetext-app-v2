// ============================================================
// system.js - فحص الجهاز وعرض المعلومات (نسخة متوافقة مع APK)
// ============================================================

let systemCheckDone = false;

// مراجع معلومات الجهاز
const ramInfo = document.getElementById("ramInfo");
const cpuInfo = document.getElementById("cpuInfo");
const deviceInfo = document.getElementById("deviceInfo");
const modelName = document.getElementById("modelName");
const modelDesc = document.getElementById("modelDesc");
const modelIcon = document.getElementById("modelIcon");
const browserInfo = document.getElementById("browserInfo");
const batteryInfo = document.getElementById("batteryInfo");
const gpuInfo = document.getElementById("gpuInfo");

// ============================================================
// 🔥 فحص الجهاز مباشرة عبر JavaScript (متوافق مع Android)
// ============================================================
function checkSystem() {
  if (systemCheckDone) return;

  try {
    console.log("🔍 جاري استرجاع معلومات الجهاز...");

    // ✅ معلومات المعالج (CPU)
    let cpu = "غير معروف";
    let cores = "غير معروف";
    if (navigator.hardwareConcurrency) {
      cores = navigator.hardwareConcurrency;
      cpu = cores + " أنوية";
    } else if (navigator.userAgent.match(/Android/i)) {
      cpu = "Android (ARM)";
    } else {
      cpu = "غير معروف";
    }

    // ✅ معلومات الذاكرة (RAM)
    let ram = "غير معروف";
    if (navigator.deviceMemory) {
      ram = navigator.deviceMemory + " GB";
    } else {
      ram = "غير معروف";
    }

    // ✅ نوع الجهاز
    const ua = navigator.userAgent;
    let deviceType = "غير معروف";
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
      deviceType = "📱 هاتف / جهاز لوحي";
    } else {
      deviceType = "💻 كمبيوتر / لابتوب";
    }

    // ✅ المتصفح
    let browser = "غير معروف";
    if (ua.includes("Android")) {
      browser = "Android WebView";
    } else if (ua.includes("Chrome")) {
      browser = "Google Chrome";
    } else if (ua.includes("Firefox")) {
      browser = "Mozilla Firefox";
    } else {
      browser = ua.substring(0, 60);
    }

    // ✅ كرت الشاشة (GPU)
    let gpu = "غير معروف";
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {
      gpu = "غير معروف";
    }

    // ✅ اختيار النموذج المناسب
    let selectedModel = "base";
    let powerLevel = "افتراضي";
    if (ram !== "غير معروف") {
      const ramValue = parseFloat(ram);
      if (ramValue >= 8) {
        selectedModel = "medium";
        powerLevel = "قوي";
      } else if (ramValue >= 4) {
        selectedModel = "small";
        powerLevel = "متوسط";
      } else {
        selectedModel = "base";
        powerLevel = "أساسي";
      }
    }

    // ✅ عرض البيانات
    displaySystemInfo({
      ram: ram,
      cpu: cpu,
      cores: cores,
      device_type: deviceType,
      selected_model: selectedModel,
      power_level: powerLevel,
      browser: browser,
      gpu: gpu,
      last_check: new Date().toLocaleString("ar-EG"),
    });

    systemCheckDone = true;

    // ✅ جلب البطارية (إذا كانت مدعومة)
    if (navigator.getBattery) {
      navigator
        .getBattery()
        .then(function (battery) {
          const level = Math.round(battery.level * 100);
          const charging = battery.charging ? " (جاري الشحن)" : " (لا يشحن)";
          if (batteryInfo) {
            batteryInfo.textContent = level + "%" + charging;
          }
        })
        .catch(function () {
          if (batteryInfo) {
            batteryInfo.textContent = "غير معروف";
          }
        });
    } else {
      if (batteryInfo) {
        batteryInfo.textContent = "غير معروف (API غير مدعوم)";
      }
    }
  } catch (error) {
    console.error("❌ خطأ في فحص الجهاز:", error);
    // عرض رسائل خطأ في الواجهة
    if (ramInfo) ramInfo.textContent = "⚠️ خطأ";
    if (cpuInfo) cpuInfo.textContent = "⚠️ خطأ";
    if (deviceInfo) deviceInfo.textContent = "⚠️ خطأ";
    if (modelIcon) modelIcon.textContent = "⚠️";
    if (modelName) modelName.textContent = "خطأ";
    if (modelDesc) modelDesc.textContent = "⚠️ تعذر قراءة معلومات الجهاز";
  }
}

// ========== عرض معلومات الجهاز ==========
function displaySystemInfo(data) {
  console.log("📊 عرض البيانات:", data);

  if (ramInfo) ramInfo.textContent = data.ram;
  if (cpuInfo) cpuInfo.textContent = data.cpu + " (" + data.cores + " أنوية)";
  if (deviceInfo) deviceInfo.textContent = data.device_type;
  if (browserInfo) browserInfo.textContent = data.browser;
  if (gpuInfo) gpuInfo.textContent = data.gpu;

  const models = {
    base: { name: "Base", icon: "🔴", desc: "سريع - للأجهزة المحدودة" },
    small: {
      name: "Small",
      icon: "🟡",
      desc: "متوسط - توازن بين السرعة والدقة",
    },
    medium: { name: "Medium", icon: "🟢", desc: "دقيق - للأجهزة القوية" },
    large: { name: "Large", icon: "🟣", desc: "فائق الدقة - للأجهزة الخارقة" },
  };

  const model = models[data.selected_model] || models["base"];
  if (modelIcon) modelIcon.textContent = model.icon;
  if (modelName) modelName.textContent = model.name;
  if (modelDesc)
    modelDesc.textContent = model.desc + " (جهازك " + data.power_level + ")";

  const lastCheckElement = document.getElementById("lastCheck");
  if (lastCheckElement) {
    lastCheckElement.textContent = "🕐 آخر تحديث: " + data.last_check;
  }
}

// ============================================================
// 🚀 تشغيل فحص الجهاز تلقائياً عند تحميل الصفحة
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  if (ramInfo) ramInfo.textContent = "⏳ جاري...";
  if (cpuInfo) cpuInfo.textContent = "⏳ جاري...";
  if (deviceInfo) deviceInfo.textContent = "⏳ جاري...";
  if (modelName) modelName.textContent = "⏳ جاري التحميل...";
  if (modelDesc) modelDesc.textContent = "⏳ جاري تحليل جهازك...";

  // تأخير بسيط لضمان تحميل العناصر
  setTimeout(checkSystem, 500);
});
