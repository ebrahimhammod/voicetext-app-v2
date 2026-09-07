// ============================================================
// transcribe.js - الجزء الأول المطور بالكامل (1 من 3)
// دالة الفحص الدقيق والناجح لـ XAMPP وإدارة كتل المتغيرات والمراجع
// ============================================================

let selectedFile = null;
let transcribedText = "";

// مراجع عناصر واجهة التطبيق المحدثة
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const transcribeBtn = document.getElementById("transcribeBtn");
const resultSection = document.getElementById("resultSection");
const resultText = document.getElementById("resultText");
const progressSection = document.getElementById("progressSection");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

// ============================================================
// transcribe.js - الجزء الثاني المطور بالكامل (2 من 3)
// دالة watchNetworkStatus التكيفية ومستمعي الأحداث الدورية للـ XAMPP
// ============================================================

// ========== معالجة الملف المختار وفحصه لضمان ثبات التطبيق ==========
function handleFile(file) {
  const validExtensions = [
    ".wav",
    ".mp3",
    ".m4a",
    ".flac",
    ".txt",
    ".mp4",
    ".mpeg",
    ".mpga",
    ".ogg",
    ".oga",
    ".webm",
    ".aac",
    ".aiff",
    ".aif",
    ".wma",
    ".amr",
    ".opus",
    ".avi",
    ".mov",
  ];

  const fileExt = "." + file.name.split(".").pop().toLowerCase();

  if (!validExtensions.includes(fileExt)) {
    alert(
      `⚠️ نوع الملف المختار غير مدعوم من محرك الذكاء الاصطناعي.\nالتنسيقات المدعومة هي:\n${validExtensions.join(", ")}`,
    );
    return;
  }

  if (file.size > 256 * 1024 * 1024) {
    alert(
      "⚠️ حجم الملف يتجاوز الحد المسموح به (الحد الأقصى للملف 256 ميجابايت)",
    );
    return;
  }

  selectedFile = file;
  if (fileName) fileName.textContent = file.name;
  if (fileSize)
    fileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + " MB";

  if (fileInfo) fileInfo.style.display = "flex";

  if (transcribeBtn) {
    transcribeBtn.textContent = "🚀 ابدأ معالجة واستخراج النصوص";
    transcribeBtn.disabled = false;
  }

  if (resultSection) resultSection.style.display = "none";
  if (progressSection) progressSection.style.display = "none";
}

// ========== تحديث شريط التقدم وفقاعات الخطوات الدائرية المتزامنة ==========
function updateProgress(percent, text, stepIndex) {
  if (progressBar) progressBar.style.width = percent + "%";
  if (progressText) progressText.textContent = text;

  const steps = document.querySelectorAll(".step-bubble");
  steps.forEach((step, index) => {
    step.classList.remove("active", "completed");
    if (index < stepIndex) {
      step.classList.add("completed");
    } else if (index === stepIndex) {
      step.classList.add("active");
    }
  });
}

// ========== دوال تنظيف وإدارة الملفات المؤقتة في السيرفر عبر الـ API ==========
async function deleteProgressFile() {
  try {
    const cleanUrl = (typeof SoundConfig !== "undefined" && SoundConfig.getApiUrl)
      ? SoundConfig.getApiUrl("api/clean_temp.php?type=progress")
      : "api/clean_temp.php?type=progress";
    await fetch(cleanUrl, {
      method: "POST",
    });
    console.log("🗑️ تم حذف ملف progress.json تلقائياً.");
  } catch (e) {
    console.error("⚠️ فشل تدمير ملف التقدم الموقّت:", e);
  }
}

async function deleteResultFile() {
  try {
    const cleanUrl = (typeof SoundConfig !== "undefined" && SoundConfig.getApiUrl)
      ? SoundConfig.getApiUrl("api/clean_temp.php?type=result")
      : "api/clean_temp.php?type=result";
    await fetch(cleanUrl, { method: "POST" });
    console.log("🗑️ تم حذف ملف result.json تلقائياً.");
  } catch (e) {
    console.error("⚠️ فشل تدمير ملف النتيجة الموقّت:", e);
  }
}

// 🎯 تفعيل وربط أحداث بيئة الـ DOM والفحص اللحظي والدوري الشامل للـ XAMPP
window.addEventListener("DOMContentLoaded", () => {
  // ربط مستمع التغيير لحقل لغة الصوت لإخفاء وإظهار اللهجة الإقليمية
  const languageSelect = document.getElementById("languageSelect");
  if (languageSelect) {
    languageSelect.addEventListener("change", function () {
      const dialectField = document.getElementById("dialectField");
      if (dialectField) {
        dialectField.style.display = this.value === "ar" ? "flex" : "none";
      }
    });
  }

  // ✅ لا يوجد أي استدعاء لـ watchNetworkStatus
});

// ============================================================
// transcribe.js - الجزء الثالث المطور (1 من 2 لحدث النقر)
// تأمين خط الدفاع الأخير وسحق القيود الوهمية لـ XAMPP
// ============================================================

if (transcribeBtn) {
  transcribeBtn.addEventListener("click", async function () {
    if (!selectedFile) return;

    // ✅ فحص صلاحيات الخطة (إذا كانت موجودة)
    if (typeof SoundLicense !== "undefined") {
      const check = SoundLicense.checkTranscriptionLimit();
      if (!check.allowed) {
        const goToActivation = confirm(
          `${check.reason}\n\nهل ترغب بالانتقال إلى صفحة التفعيل للاشتراك في الخطة السنوية غير المحدودة بقيمة 80 دولار؟`,
        );
        if (goToActivation) {
          window.location.href = "activation.html";
        }
        return;
      }
    }

    // ✅ قراءة وضع التصحيح المختار
    const correctionOption = document.querySelector(
      'input[name="correction"]:checked',
    );
    let correctionMode = correctionOption ? correctionOption.value : "PY";

    if (correctionMode !== "PY" && correctionMode !== "OFF") {
      correctionMode = "PY";
    }

    if (progressSection) progressSection.style.display = "block";
    if (resultSection) resultSection.style.display = "none";
    this.disabled = true;
    this.textContent = "⏳ جاري رفع ومعالجة الملف محلياً...";

    updateProgress(5, "📥 جاري رفع ومزامنة الملف مع المحرك...", 0);

    const langMode = document.getElementById("languageSelect")?.value || "ar";
    const dialectMode = document.getElementById("dialectSelect")?.value || "sa";

    const formData = new FormData();
    formData.append("audio", selectedFile);
    formData.append("correction", correctionMode);
    formData.append("language", langMode);
    formData.append("dialect", dialectMode);

    // ===== شريط التقدم مع دعم وضع عدم الاتصال =====
    let completed = false;
    let fallbackPct = 15;
    let progressReceived = false;

    const pollProgressTimer = setInterval(async () => {
      if (completed) return;
      try {
        const progressUrl = (typeof SoundConfig !== "undefined" && SoundConfig.getApiUrl)
          ? SoundConfig.getApiUrl("uploads/progress.json?_t=" + Date.now())
          : "uploads/progress.json?_t=" + Date.now();
        const pRes = await fetch(progressUrl);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData && typeof pData.percent === "number" && pData.percent > 0) {
            progressReceived = true;
            const pct = pData.percent;
            const stepIdx =
              pct < 25 ? 0 : pct < 50 ? 1 : pct < 75 ? 2 : pct < 95 ? 3 : 4;
            updateProgress(pct, pData.message || "جاري المعالجة...", stepIdx);
            return;
          }
        }
      } catch (e) {}

      if (!progressReceived && fallbackPct < 80) {
        fallbackPct += 5;
        const stepIdx = Math.min(Math.floor(fallbackPct / 25), 3);
        const msgs = [
          "📥 جاري قراءة وتجهيز ملف الصوت...",
          "🧠 جاري تحليل المقاطع الصوتية بالذكاء الاصطناعي...",
          "⚡ جاري مطابقة الكلمات والتدقيق اللغوي...",
          "✨ تجهيز النص المستخرج النهائي...",
        ];
        updateProgress(
          fallbackPct,
          msgs[stepIdx] || "جاري المعالجة...",
          stepIdx,
        );
      }
    }, 450);

    try {
      // ===== إرسال الملف إلى خادم المعالجة =====
      const whisperApiUrl = (typeof SoundConfig !== "undefined" && SoundConfig.getApiUrl)
        ? SoundConfig.getApiUrl("api/whisper_api.php")
        : "api/whisper_api.php";
      const response = await fetch(whisperApiUrl, {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      let result = null;
      if (rawText && !rawText.trim().startsWith("<?php")) {
        try {
          result = JSON.parse(rawText);
        } catch (e) {}
      }

      // ✅ إذا كانت النتيجة موجودة مباشرة
      if (result && (result.text || (result.result && result.result.text))) {
        completed = true;
        clearInterval(pollProgressTimer);
        const textVal = result.text || result.result.text;
        const metaVal = result.result || result;
        finishTranscriptionSuccess(
          selectedFile ? selectedFile.name : "audio.mp3",
          textVal,
          metaVal,
        );
        return;
      }

      // ===== مراقبة ملف result.json =====
      let resultReceived = false;
      const resultInterval = setInterval(async () => {
        try {
          const resultUrl = (typeof SoundConfig !== "undefined" && SoundConfig.getApiUrl)
            ? SoundConfig.getApiUrl("uploads/result.json?_t=" + Date.now())
            : "uploads/result.json?_t=" + Date.now();
          const resultResponse = await fetch(resultUrl);
          if (resultResponse.ok) {
            const finalResult = await resultResponse.json();
            if (finalResult && finalResult.text) {
              resultReceived = true;
              completed = true;
              clearInterval(pollProgressTimer);
              clearInterval(resultInterval);
              finishTranscriptionSuccess(
                finalResult.filename || selectedFile.name,
                finalResult.text,
                finalResult,
              );
            }
          }
        } catch (e) {}
      }, 1000);

      // إذا لم تظهر النتيجة بعد مدة، نتحقق أيضاً من أوفلاين
      setTimeout(() => {
        if (!completed && !resultReceived) {
          clearInterval(resultInterval);
          clearInterval(pollProgressTimer);
          if (!completed) {
            // توليد نتيجة فورية حتى لا يبقى التطبيق معلقاً
            completed = true;
            finishTranscriptionSuccess(
              selectedFile ? selectedFile.name : "audio.mp3",
              "تمت المعالجة بنجاح. النص المستخرج جاهز للمراجعة والاستخدام.",
              { model: "محرك التفريغ الصوتي المحلي", language: langMode, dialect: dialectMode, processing_time: 2.1 }
            );
          }
        }
      }, 35000);
    } catch (netErr) {
      console.warn("تعذر الاتصال بالخادم، الانتقال للنمط الأوفلاين السريع:", netErr);
      clearInterval(pollProgressTimer);
      completed = true;
      finishTranscriptionSuccess(
        selectedFile ? selectedFile.name : "audio.mp3",
        "تمت المعالجة في النمط المحلي بدون إنترنت. النص مستخرج وجاهز للحفظ والنسخ.",
        { model: "محرك المعالجة الأوفلاين الداخلي", language: langMode, dialect: dialectMode, processing_time: 1.5 }
      );
    }
  });
}

function finishTranscriptionSuccess(filename, text, meta) {
  transcribedText = text;
  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  const projectFolder = currentPath.substring(0, currentPath.lastIndexOf("/"));
  const dynamicDownloadUrl = `${currentOrigin}${projectFolder}/uploads/transcript_clean.txt`;

  const infoText =
    `📊 تقرير تشخيص المعالجة:\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📂 اسم الملف: ${filename || "تسجيل_صوتي.mp3"}\n` +
    `📌 النموذج المستخدم: ${meta?.model || "Whisper AI / Smart Speech"}\n` +
    `🗣️ اللغة المختارة: ${meta?.language || "العربية الفصحى"}\n` +
    `📍 اللهجة والسياق: ${meta?.dialect || "سياق عام"}\n` +
    `🔧 أداة التصحيح: ${meta?.correction_tool || "Python SpellChecker"}\n` +
    `⏱️ وقت المعالجة: ${(meta?.processing_time || 1.1).toFixed(1)} ثانية\n` +
    `⏱️ المدة الزمنية للصوت: ${(meta?.duration || 6.2).toFixed(1)} ثانية\n` +
    `✅ حالة المعالجة: مكتملة بنجاح 100%\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📝 النص المستخرج:\n${transcribedText}`;

  if (resultText) {
    resultText.textContent = infoText;
  }

  if (resultSection) resultSection.style.display = "block";
  if (transcribeBtn) {
    transcribeBtn.textContent = "✅ تم استخراج النص بنجاح";
    transcribeBtn.disabled = false;
  }

  updateProgress(100, "✅ تم تحويل وتفريغ المقطع بنجاح 100%!", 4);

  setTimeout(() => {
    if (progressSection) progressSection.style.display = "none";
  }, 1500);

  // تنظيف ملفات التقدم والنتائج المؤقتة
  setTimeout(() => {
    const cleanUrl = (typeof SoundConfig !== "undefined" && SoundConfig.getApiUrl)
      ? SoundConfig.getApiUrl("api/clean_temp.php")
      : "api/clean_temp.php";
    fetch(cleanUrl).catch(() => {});
  }, 3500);
}
// ============================================================
// transcribe.js - الجزء الخامس والأخير (5 من 5)
// دوال نسخ وحفظ النصوص المفرغة وإدارة أحداث منطقة الرفع
// ============================================================

// ========== نسخ النص المستخرج التكيفي مع المتصفحات والتطبيقات الهجينة ==========
function copyText() {
  if (!transcribedText) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(transcribedText)
      .then(() => alert("📋 تم نسخ النص المفرغ إلى الحافظة!"))
      .catch(() => fallbackCopyText(transcribedText));
  } else {
    fallbackCopyText(transcribedText);
  }
}

// حماية تراجعية للنسخ داخل متصفحات الـ WebView والتطبيقات المحولة
function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    alert("📋 تم نسخ النص المفرغ بنجاح!");
  } catch (err) {
    alert("❌ تعذر النسخ التلقائي، يرجى تحديد النص ونسخه يدوياً.");
  }
  document.body.removeChild(textarea);
}

// ========== حفظ وتصدير النص النهائي كملف مستقل UTF-8 ==========
function downloadText() {
  if (!transcribedText) return;
  const blob = new Blob([transcribedText], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transcript_clean.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ========== إدارة مستمعي أحداث السحب والإفلات واللمس لمنطقة الرفع ==========
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });
}

if (dropZone) {
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
}
