// ============================================================
// config.js - الجسر الذكي الموحد للربط بين الأوفلاين والأونلاين والـ APK
// ============================================================

(function (global) {
  "use strict";

  // الرابط السحابي المعتمد للمشروع (يعمل عالمياً عند توفر الإنترنت)
  const CLOUD_API_BASE = "https://ais-pre-kr7u52bnxuwb72vjr76rov-388914932977.europe-west2.run.app/sound/";

  // التحقق هل التطبيق يعمل داخل بيئة أندرويد APK (Capacitor / Cordova / File)
  function isNativeApkEnvironment() {
    const isCapacitor = typeof window.Capacitor !== "undefined";
    const isFileScheme = window.location.protocol === "file:" || window.location.protocol === "capacitor:" || window.location.hostname === "localhost" && window.location.port === "";
    const isAndroidUA = /Android/i.test(navigator.userAgent);
    return isCapacitor || (isAndroidUA && isFileScheme);
  }

  // الحصول على رابط API الصحيح ديناميكياً
  function getSoundApiUrl(endpoint) {
    endpoint = endpoint.replace(/^\/+/, "");

    // في بيئة السيرفر المباشر (المتصفح عبر الويب)
    if (window.location.protocol.startsWith("http") && !window.location.hostname.includes("localhost")) {
      // نحن على موقع ويب حقيقي، نستخدم المسار النسبي أو السحابي
      const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
      return basePath + endpoint;
    }

    // في بيئة الـ APK أندرويد
    if (isNativeApkEnvironment()) {
      // إذا كان الجهاز متصلاً بالإنترنت نستخدم السيرفر السحابي
      if (navigator.onLine) {
        return CLOUD_API_BASE + endpoint;
      }
      // إذا كان أوفلاين، نرجع المسار المحلي
      return endpoint;
    }

    // افتراضي للمتصفح المحلي
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
    return basePath + endpoint;
  }

  global.SoundConfig = {
    CLOUD_API_BASE: CLOUD_API_BASE,
    isNativeApk: isNativeApkEnvironment,
    getApiUrl: getSoundApiUrl,
  };

  // إتاحة الدالة عالمياً
  global.getSoundApiUrl = getSoundApiUrl;

})(typeof window !== "undefined" ? window : this);
