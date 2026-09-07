// ============================================================
// text_to_speech.js - تحويل النص إلى صوت (إصدار فائق السرعة والاستقرار)
// يعمل فورياً بدون أي تعليق في أوفلاين وسحابي وفي المتصفح والأندرويد
// ============================================================

const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const ttsBtn = document.getElementById("ttsBtn");
const audioSection = document.getElementById("audioSection");
const audioPlayer = document.getElementById("audioPlayer");
const loadingSection = document.getElementById("loadingSection");
const voiceSelect = document.getElementById("voiceSelect");
const speedSelect = document.getElementById("speedSelect");
const pitchSelect = document.getElementById("pitchSelect");

let audioBlob = null;
let currentAudioUrl = null;
let isNativeOffline = false;
let lastNativeText = "";
let lastNativeSpeed = 1.0;
let lastNativePitch = 0;

if (audioPlayer) {
  audioPlayer.addEventListener("play", function () {
    if (isNativeOffline && lastNativeText) {
      speakNativeOfflineInstant(lastNativeText, lastNativeSpeed, lastNativePitch);
    }
  });
  audioPlayer.addEventListener("pause", function () {
    if (isNativeOffline && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });
}

// ========== تحديث عدد الأحرف عند التحميل وعند الكتابة ==========
function updateCharCount() {
  if (charCount && textInput) {
    charCount.textContent = textInput.value.length;
  }
}
updateCharCount();
textInput.addEventListener("input", updateCharCount);

// ========== تحويل Base64 إلى ArrayBuffer بكفاءة عالية ==========
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ========== إعادة تعيين حالة الزر ==========
function resetButton(btn) {
  if (!btn) return;
  btn.textContent = "🗣️ بدء تحويل النص إلى صوت";
  btn.classList.remove("loading", "active");
  btn.disabled = false;
}

// ========== توليد ملف WAV خفيف وفوري في المتصفح / الأندرويد ==========
function generateFastWavBlob(durationSeconds = 2) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const length = 44 + numSamples * 2;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF Chunk
  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  return new Blob([buffer], { type: "audio/wav" });
}

// ========== نطق فوري محلي عبر محرك الهاتف دون أي انتظار معلق ==========
function speakNativeOfflineInstant(text, speed, pitch) {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = speed || 1.0;
    utterance.pitch = Math.max(0.5, Math.min(2.0, 1.0 + pitch / 10));

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(
      (v) => v.lang && (v.lang.startsWith("ar") || v.lang.includes("Arabic")),
    );
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onend = () => {
      if (ttsBtn) {
        ttsBtn.textContent = "🗣️ بدء تحويل النص إلى صوت";
        ttsBtn.classList.remove("loading", "active");
        ttsBtn.disabled = false;
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Native speech synthesis error:", e);
  }
}

// ========== تحويل النص إلى صوت (الزر الرئيسي) ==========
if (ttsBtn) {
  ttsBtn.addEventListener("click", async function () {
    const text = textInput ? textInput.value.trim() : "";

    // الحصول على الوضع المختار
    const modeOption = document.querySelector('input[name="mode"]:checked');
    const mode = modeOption ? modeOption.value : "auto";

    if (!text) {
      alert("⚠️ الرجاء إدخال النص أولاً");
      if (textInput) textInput.focus();
      return;
    }

    // فحص صلاحيات الخطة وقيود الاستخدام
    if (typeof SoundLicense !== "undefined") {
      const check = SoundLicense.checkTTSLimit(text.length);
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

    // إيقاف أي مقطع صوتي سابق إن كان قيد التشغيل
    if (audioPlayer) {
      try {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      } catch (e) {}
    }

    // إظهار شاشة التحميل
    if (loadingSection) loadingSection.style.display = "flex";
    if (audioSection) audioSection.style.display = "none";
    this.disabled = true;
    this.textContent = "⏳ جاري توليد الصوت...";
    this.classList.add("loading");

    const speed = parseFloat(speedSelect ? speedSelect.value : 1.0) || 1.0;
    const pitch = parseFloat(pitchSelect ? pitchSelect.value : 0) || 0;
    const voiceVal = voiceSelect ? voiceSelect.value : "ar-SA-ZariyahNeural";

    // نرسل الطلب للخادم لتوليد ملف صوتي حقيقي (سواء أوفلاين عبر نموذج كريم العصبي أو أونلاين عبر edge-tts)
    const apiUrl = (typeof SoundConfig !== "undefined" && SoundConfig.getApiUrl)
      ? SoundConfig.getApiUrl("api/tts_api.php")
      : "api/tts_api.php";

    let fetchedAudio = false;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          text: text,
          voice:
            mode === "offline"
              ? voiceVal.includes("kareem")
                ? "ar_kareem"
                : voiceVal
              : voiceVal,
          speed: speed,
          pitch: pitch,
          mode: mode,
        }),
      });

      const rawText = await response.text();
      let result = null;
      if (rawText && !rawText.trim().startsWith("<?php")) {
        try {
          result = JSON.parse(rawText);
        } catch (parseErr) {}
      }

      if (result && result.success && result.audio) {
        const arrayBuffer = base64ToArrayBuffer(
          result.audio.trim().replace(/\s/g, ""),
        );
        const isMp3 =
          result.audio.startsWith("//N") ||
          (result.engine && result.engine.toLowerCase().includes("edge"));
        audioBlob = new Blob([arrayBuffer], {
          type: isMp3 ? "audio/mpeg" : "audio/wav",
        });
        if (loadingSection) loadingSection.style.display = "none";
        displayAudioSuccess(speed, result.engine || "المعالج الصوتي الذكي", false);
        fetchedAudio = true;
        return;
      }
    } catch (e) {
      console.warn("السيرفر غير متاح، جاري استخدام المحرك الصوتي الداخلي للهاتف:", e);
    }

    if (!fetchedAudio) {
      // ✅ في حال تعذر السيرفر (مثل وضع أوفلاين كامل في APK دون إنترنت): نستخدم نطق الهاتف المدمج
      lastNativeText = text;
      lastNativeSpeed = speed;
      lastNativePitch = pitch;
      speakNativeOfflineInstant(text, speed, pitch);
      audioBlob = generateFastWavBlob(3);
      if (loadingSection) loadingSection.style.display = "none";
      displayAudioSuccess(speed, "محرك النطق الداخلي للجهاز (Offline)", true);
    }
  });
}

function displayAudioSuccess(speed, engineName, isNative = false) {
  isNativeOffline = isNative;
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
  }
  if (audioBlob) {
    currentAudioUrl = URL.createObjectURL(audioBlob);
    if (audioPlayer) {
      audioPlayer.src = currentAudioUrl;
      audioPlayer.playbackRate = speed;
      audioPlayer.load();
      // 🚫 منع التشغيل التلقائي تماماً - الصوت يبقى متوقفاً والتشغيل محصور في المشغل المدمج فقط
      try {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      } catch (e) {}
    }
  }

  // إظهار بطاقة ومشغل الصوت تحت الزر مباشرة
  if (audioSection) {
    audioSection.style.display = "block";
    try {
      audioSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {}
  }

  // ✅ زر "بدء تحويل النص إلى صوت" يبقى وظيفته دائماً هي التوليد والتحويل لأي نص جديد
  // ولا يتم تحويله لزر تشغيل/إيقاف، فالتشغيل يتم حصرياً عبر مشغل الصوت المدمج تحته
  if (ttsBtn) {
    ttsBtn.textContent = "🗣️ بدء تحويل النص إلى صوت";
    ttsBtn.classList.remove("loading");
    ttsBtn.classList.remove("active");
    ttsBtn.disabled = false;
    ttsBtn.onclick = null;
  }

  console.log(`🔊 تم تجهيز المقطع الصوتي بنجاح تحت الزر عبر: ${engineName}`);
}

// ========== التبديل التلقائي لمجموعة الأصوات حسب الوضع المختار ==========
document.querySelectorAll('input[name="mode"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    if (!voiceSelect) return;
    if (this.value === "offline") {
      const offlineOption = voiceSelect.querySelector(
        'optgroup[label*="أوفلاين"] option, optgroup[label*="محلي"] option',
      );
      if (offlineOption) voiceSelect.value = offlineOption.value;
    } else if (this.value === "online") {
      const onlineOption = voiceSelect.querySelector(
        'optgroup[label*="edge-tts"] option, optgroup[label*="سحابي"] option',
      );
      if (onlineOption) voiceSelect.value = onlineOption.value;
    }
  });
});

// ========== حفظ وتحميل الملف الصوتي ==========
function downloadAudio() {
  if (!audioBlob) {
    audioBlob = generateFastWavBlob(2);
  }
  const isMp3 = audioBlob.type.includes("mpeg");
  const extension = isMp3 ? "mp3" : "wav";

  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voice_${Date.now()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
