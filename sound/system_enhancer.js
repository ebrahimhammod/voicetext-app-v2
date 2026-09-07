// ============================================================
// system_enhancer.js - تحسين معلومات الجهاز من المتصفح
// ============================================================

async function enhanceSystemInfo() {
  try {
    // 1. الحصول على معلومات المتصفح
    const browserInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency || "غير معروف",
      deviceMemory: navigator.deviceMemory
        ? `${navigator.deviceMemory} GB`
        : "غير معروف",
      screenResolution: `${window.screen.width} x ${window.screen.height}`,
      colorDepth: `${window.screen.colorDepth} bit`,
      touchSupport: "ontouchstart" in window ? "مدعوم" : "غير مدعوم",
    };

    // 2. الحصول على معلومات البطارية (إن وجدت)
    let batteryInfo = "غير مدعوم";
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        batteryInfo = `${Math.round(battery.level * 100)}% (${battery.charging ? "جاري الشحن" : "لا يشحن"})`;
      } catch (e) {
        batteryInfo = "خطأ في جلب البيانات";
      }
    }

    // 3. الحصول على معلومات GPU (إن وجدت)
    let gpuInfo = "غير معروف";
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {
      gpuInfo = "غير مدعوم";
    }

    // 4. تخزين المعلومات في عناصر الواجهة (إن وجدت)
    const elements = {
      browser: document.getElementById("browserInfo"),
      battery: document.getElementById("batteryInfo"),
      gpu: document.getElementById("gpuInfo"),
      screen: document.getElementById("screenInfo"),
    };

    if (elements.browser) {
      elements.browser.textContent = `${browserInfo.userAgent.split(" ").slice(0, 3).join(" ")}`;
    }
    if (elements.battery) {
      elements.battery.textContent = batteryInfo;
    }
    if (elements.gpu) {
      elements.gpu.textContent = gpuInfo;
    }
    if (elements.screen) {
      elements.screen.textContent = `${browserInfo.screenResolution} (${browserInfo.colorDepth})`;
    }

    // 5. إرجاع المعلومات لاستخدامها في مكان آخر
    return {
      browser: browserInfo,
      battery: batteryInfo,
      gpu: gpuInfo,
    };
  } catch (error) {
    console.error("❌ خطأ في تحسين معلومات الجهاز:", error);
    return null;
  }
}

// ========== تشغيل التحسين عند تحميل الصفحة ==========
document.addEventListener("DOMContentLoaded", async function () {
  await enhanceSystemInfo();
});
