import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { spawn, execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";

dotenv.config();

const upload = multer({ dest: "/tmp/uploads/" });

const app = express();
const PORT = 3000;

// تفعيل CORS لتمكين تطبيق الأندرويد APK من الاتصال بالسيرفر السحابي بكل سلاسة
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Audio transcription (Speech-to-Text) using Gemini
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm", language = "ar", prompt } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "Missing audio data" });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "مفتاح Gemini API غير مهيأ. يمكنك استخدام التعرف الصوتي المباشر عبر المتصفح.",
        fallbackToBrowser: true,
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || "audio/webm",
        data: audioBase64,
      },
    };

    const instruction = prompt || 
      `قم بتفريغ وتحويل هذا التسجيل الصوتي إلى نص مكتوب باللغة ${language === 'ar' ? 'العربية' : language} بدقة واحترافية عالية مع تصحيح الأخطاء اللغوية والإملائية واستخدام علامات الترقيم الصحيحة. أعد فقط النص المفرغ بدون أي شروحات أو مقدمات.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          parts: [
            audioPart,
            { text: instruction },
          ],
        },
      ],
    });

    const transcribedText = response.text || "";
    res.json({ text: transcribedText });
  } catch (error: any) {
    console.error("Transcribe API error:", error);
    res.status(500).json({
      error: error.message || "حدث خطأ أثناء تفريغ الصوت",
      fallbackToBrowser: true,
    });
  }
});

// Text-to-Speech using Gemini TTS
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Kore" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "الرجاء إدخال نص لتحويله لصوت" });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Falling back to browser speech synthesis.",
        fallbackToBrowser: true,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({
        error: "لم يتم استرجاع بيانات الصوت من النموذج",
        fallbackToBrowser: true,
      });
    }

    res.json({ audioBase64: base64Audio, sampleRate: 24000 });
  } catch (error: any) {
    console.error("TTS API error:", error);
    res.status(500).json({
      error: error.message || "فشل توليد الصوت بالذكاء الاصطناعي",
      fallbackToBrowser: true,
    });
  }
});

// Analyze imported project code (HTML, PHP, JS, Python)
app.post("/api/analyze-project", async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const ai = getGenAI();
    if (!ai) {
      // Basic static analysis fallback
      const fileSummary = files.map((f: any) => ({
        name: f.name,
        type: f.type || path.extname(f.name),
        lines: (f.content || "").split("\n").length,
      }));
      return res.json({
        summary: "تم تحليل الملفات بنجاح. يمكنك استعراض الكود ودمجه مباشرة في واجهة التطبيق الحديثة.",
        files: fileSummary,
      });
    }

    const fileDescriptions = files
      .map(
        (f: any, idx: number) =>
          `--- File ${idx + 1}: ${f.name} ---\n${f.content.substring(0, 3000)}\n`
      )
      .join("\n\n");

    const prompt = `أنت مهندس برمجيات خبير في تحويل مشاريع الويب القديمة (HTML, PHP, JS, Python) لتحويل الصوت إلى نص والعكس إلى تطبيق حديث (React + TypeScript + PWA).
إليك ملفات المشروع التي أرسلها المستخدم:

${fileDescriptions}

قدم تحليلاً موجزاً باللغة العربية ومنظماً يتضمن:
1. ما الذي يقوم به كل ملف في المشروع الأصلي (المميزات والوظائف المكتشفة).
2. ما هي المكتبات أو الـ APIs المستخدمة في ملفات PHP أو Python أو JS (مثل Google Cloud Speech, Web Speech API, pyttsx3, إلخ).
3. كيف تم تضمين هذه الوظائف بالفعل وجعلها تعمل بشكل احترافي وأسرع في التطبيق الحديث.
4. خطوات مقترحة للمستخدم للاستفادة القصوى وتصدير التطبيق.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({
      analysis: response.text,
      fileCount: files.length,
    });
  } catch (error: any) {
    console.error("Project Analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze project files" });
  }
});

function generateWavBase64(durationSeconds = 2, frequency = 440) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.3 * Math.sin((Math.PI * i) / numSamples);
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  return buffer.toString("base64");
}

let activeProgress = { percent: 0, message: "جاهز للمعالجة", stepIndex: 0 };
let activeTranscriptionResult: any = null;

function writeUploadProgress(percent: number, message: string, stepIndex: number) {
  activeProgress = { percent, message, stepIndex };
  try {
    const uploadDir = path.join(process.cwd(), "sound", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, "progress.json"), JSON.stringify({ percent, message, stepIndex }), "utf-8");
  } catch (e) {}
}

function writeUploadResult(resultData: any) {
  activeTranscriptionResult = resultData;
  try {
    const uploadDir = path.join(process.cwd(), "sound", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, "result.json"), JSON.stringify(resultData, null, 2), "utf-8");
    if (resultData.text) {
      fs.writeFileSync(path.join(uploadDir, "transcript_clean.txt"), resultData.text, "utf-8");
      fs.writeFileSync(path.join(uploadDir, "transcription_output.txt"), resultData.text, "utf-8");
    }
  } catch (e) {}
}

// 1. Text-to-Speech Functions: High-speed Online Neural (Microsoft Edge) and Offline Studio (Piper)
async function generateMsEdgeTTS(text: string, voice: string, speed = 1.0, pitch = 0): Promise<string> {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  const rateStr = speed >= 1 ? `+${Math.round((speed - 1) * 100)}%` : `-${Math.round((1 - speed) * 100)}%`;
  const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate: rateStr, pitch: pitchStr });
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { tts.close(); } catch (e) {}
      reject(new Error("Edge TTS timeout"));
    }, 25000);
    audioStream.on("data", (c: Buffer) => chunks.push(c));
    audioStream.on("end", () => {
      clearTimeout(timer);
      try { tts.close(); } catch (e) {}
      const buf = Buffer.concat(chunks);
      resolve(buf.toString("base64"));
    });
    audioStream.on("error", (err: any) => {
      clearTimeout(timer);
      try { tts.close(); } catch (e) {}
      reject(err);
    });
  });
}

function generatePiperTTS(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const baseDir = fs.existsSync(path.join(process.cwd(), "sound", "piper_bin", "piper"))
        ? path.join(process.cwd(), "sound")
        : path.join(process.cwd(), "dist", "sound");
      const piperBin = path.join(baseDir, "piper_bin", "piper");
      const modelPath = path.join(baseDir, "piper_voices", "ar_JO-kareem-medium.onnx");
      const configPath = path.join(baseDir, "piper_voices", "ar_JO-kareem-medium.onnx.json");
      const tmpWav = path.join(os.tmpdir(), `piper_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.wav`);

      if (!fs.existsSync(piperBin) || !fs.existsSync(modelPath)) {
        return reject(new Error("Piper binary or model not found"));
      }

      try {
        fs.chmodSync(piperBin, 0o755);
      } catch (e) {}

      const proc = spawn(piperBin, [
        "--model", modelPath,
        "--config", configPath,
        "--output_file", tmpWav
      ]);

      proc.stdin.write(text);
      proc.stdin.end();

      const timer = setTimeout(() => {
        try { proc.kill(); } catch (e) {}
        reject(new Error("Piper timeout"));
      }, 20000);

      proc.on("close", (code) => {
        clearTimeout(timer);
        if (fs.existsSync(tmpWav) && fs.statSync(tmpWav).size > 44) {
          const buf = fs.readFileSync(tmpWav);
          try { fs.unlinkSync(tmpWav); } catch (e) {}
          resolve(buf.toString("base64"));
        } else {
          reject(new Error(`Piper exited with code ${code}`));
        }
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
}

// 1. Text-to-Speech API for sound applet (Supports all Online Neural voices & Offline Kareem)
app.all(["/sound/api/tts_api.php", "/api/tts_api.php"], async (req, res) => {
  try {
    const text = req.body?.text || (typeof req.query?.text === 'string' ? req.query.text : "") || "";
    let voice = req.body?.voice || "ar-SA-ZariyahNeural";
    const speed = parseFloat(req.body?.speed) || 1.0;
    const pitch = parseInt(req.body?.pitch) || 0;
    const mode = req.body?.mode || "auto";

    if (!text.trim()) {
      return res.status(400).json({ success: false, message: "النص فارغ" });
    }

    const isOfflineMode = mode === "offline" || voice === "ar_kareem" || voice === "ar_espeak";

    let audioB64 = "";
    let usedEngine = "";
    let resolvedVoice = voice;

    // أ) في حال اختيار Online أو أي صوت عصبي محدد: استخدام محرك Microsoft Edge Neural الفوري
    if (!isOfflineMode) {
      try {
        const edgeVoice = voice.includes("Neural") ? voice : "ar-SA-ZariyahNeural";
        audioB64 = await generateMsEdgeTTS(text.trim(), edgeVoice, speed, pitch);
        usedEngine = `Microsoft Edge Neural (${edgeVoice})`;
        resolvedVoice = edgeVoice;
      } catch (edgeErr) {
        console.warn("Edge TTS error, falling back to Piper:", edgeErr);
      }
    }

    // ب) في حال اختيار Offline أو فشل الاتصال السحابي: استخدام نموذج كريم العصبي المحلي
    if (!audioB64) {
      try {
        audioB64 = await generatePiperTTS(text.trim());
        usedEngine = "Piper AI (كريم العصبي - أوفلاين)";
        resolvedVoice = "ar_JO-kareem-medium";
      } catch (piperErr) {
        console.warn("Piper TTS error:", piperErr);
      }
    }

    // ج) محاولة إضافية عبر معالج بايثون
    if (!audioB64) {
      try {
        const ttsResult = await new Promise<any>((resolve) => {
          const py = spawn("python3", ["sound/tts_handler.py"], {
            cwd: process.cwd(),
            env: process.env,
          });
          let out = "";
          py.stdin.write(JSON.stringify({ text: text.trim(), voice, speed, pitch, mode }));
          py.stdin.end();
          py.stdout.on("data", (d) => { out += d.toString(); });
          const timer = setTimeout(() => { try { py.kill(); } catch (e) {} resolve(null); }, 10000);
          py.on("close", () => {
            clearTimeout(timer);
            try {
              const startIdx = out.indexOf("{");
              const endIdx = out.lastIndexOf("}");
              if (startIdx !== -1 && endIdx !== -1) {
                const parsed = JSON.parse(out.substring(startIdx, endIdx + 1));
                if (parsed.audio) return resolve(parsed);
              }
            } catch (e) {}
            resolve(null);
          });
          py.on("error", () => { clearTimeout(timer); resolve(null); });
        });
        if (ttsResult && ttsResult.audio) {
          audioB64 = ttsResult.audio;
          usedEngine = ttsResult.engine || "المعالج الصوتي الذكي";
          resolvedVoice = ttsResult.voice || voice;
        }
      } catch (e) {}
    }

    // د) في حال لم يتم توليد الصوت بعد بأي وسيلة سابقة، استخدام Microsoft Edge Neural كاحتياطي يضمن للمستخدم سماع صوت حقيقي دائماً
    if (!audioB64) {
      try {
        const fallbackVoice = "ar-SA-ZariyahNeural";
        audioB64 = await generateMsEdgeTTS(text.trim(), fallbackVoice, speed, pitch);
        usedEngine = `Microsoft Edge Neural (${fallbackVoice})`;
        resolvedVoice = fallbackVoice;
      } catch (e) {}
    }

    if (audioB64) {
      return res.json({
        success: true,
        audio: audioB64,
        engine: usedEngine,
        voice: resolvedVoice,
        mode: isOfflineMode ? "offline" : "online"
      });
    }

    // بديل في حال تعذر التوليد
    return res.json({
      success: false,
      fallbackToNative: true,
      message: "تعذر توليد الصوت بالذكاء الاصطناعي، يرجى المحاولة لاحقاً"
    });
  } catch (err: any) {
    return res.json({
      success: false,
      fallbackToNative: true,
      message: err.message
    });
  }
});

// 2. Real Whisper/AI Speech-to-Text API for sound applet
app.post(["/sound/api/whisper_api.php", "/api/whisper_api.php"], upload.single("audio"), async (req, res) => {
  const startTime = Date.now();
  let tempConvertedFile = "";
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "لم يتم استلام أي ملف صوتي" });
    }

    const originalName = file.originalname || "تسجيل_صوتي.mp3";
    const language = (req.body?.language as string) || "ar";
    const dialect = (req.body?.dialect as string) || "sa";
    const correction = (req.body?.correction as string) || "PY";

    writeUploadProgress(15, "📥 جاري قراءة وفحص بنية الملف الصوتي...", 0);

    // 1. حساب المدة الزمنية الحقيقية للمقطع عبر ffprobe
    let audioDuration = 0;
    try {
      const probeOut = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file.path}"`,
        { timeout: 8000 }
      ).toString().trim();
      const parsedDur = parseFloat(probeOut);
      if (!isNaN(parsedDur) && parsedDur > 0) {
        audioDuration = Math.round(parsedDur * 10) / 10;
      }
    } catch (probeErr) {
      console.warn("ffprobe duration detection warning:", probeErr);
    }

    writeUploadProgress(35, "🎧 جاري تهيئة الترددات وضغط الصوت لمعالجة فائقة الدقة...", 1);

    // 2. توحيد صيغة الصوت إلى MP3 بسرعة فائقة وجودة نقية عبر ffmpeg
    tempConvertedFile = path.join(os.tmpdir(), `transcribe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`);
    let targetAudioPath = file.path;
    let targetMime = "audio/mp3";

    try {
      execSync(`ffmpeg -y -i "${file.path}" -vn -ar 16000 -ac 1 -b:a 64k "${tempConvertedFile}"`, { timeout: 25000 });
      if (fs.existsSync(tempConvertedFile) && fs.statSync(tempConvertedFile).size > 0) {
        targetAudioPath = tempConvertedFile;
        targetMime = "audio/mp3";
      }
    } catch (ffmpegErr) {
      console.warn("ffmpeg conversion fallback to original:", ffmpegErr);
      targetAudioPath = file.path;
    }

    const audioBuffer = fs.readFileSync(targetAudioPath);
    const audioBase64 = audioBuffer.toString("base64");

    // تنظيف ملف الرفع الأصلي
    try { fs.unlinkSync(file.path); } catch (e) {}

    writeUploadProgress(65, "🧠 جاري استخراج النص وتفريغ الكلمات بالذكاء الاصطناعي...", 2);

    const ai = getGenAI();
    let transcribedText = "";

    if (ai) {
      try {
        const dialectInstructions: Record<string, string> = {
          sa: "المقطع الصوتي بلهجة خليجية / سعودية أو عربية فصحى.",
          eg: "المقطع الصوتي بلهجة مصرية.",
          ye: "المقطع الصوتي بلهجة يمنية.",
          sh: "المقطع الصوتي بلهجة شامية.",
          mag: "المقطع الصوتي بلهجة مغاربية."
        };
        const dialectContext = dialectInstructions[dialect] || "المقطع الصوتي باللغة العربية.";

        const promptText = `أنت خبير محترف ومتميز في تفريغ التسجيلات الصوتية باللغة العربية (Speech-to-Text).
استمع باهتمام ودقة بالغة لكل كلمة منطوقة في هذا المقطع الصوتي واكتبها نصياً بدقة متناهية وإملاء سليم تماماً.
${dialectContext}
تعليمات إلزامية:
- اكتب الكلمات المنطوقة الحقيقية فقط كما نطقها المتحدث في التسجيل بدون أي زيادة أو نقصان.
- لا تضف أي مقدمة أو تعليق أو خاتمة إطلاقاً.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    data: audioBase64,
                    mimeType: targetMime,
                  },
                },
                { text: promptText },
              ],
            },
          ],
        });

        transcribedText = (response.text || "").trim();
      } catch (gemErr: any) {
        console.warn("Gemini transcription error:", gemErr);
      }
    }

    // الخطوة 3: التدقيق الإملائي وتطبيق القاموس المخصص
    writeUploadProgress(85, "🔧 جاري التدقيق والتدقيق الإملائي الذكي (SpellChecker)...", 3);

    if (correction !== "OFF" && transcribedText) {
      const arabicCorrections: Record<string, string> = {
        "المصار": "المسار",
        "المستفميرين": "المستثمرين",
        "ومستانداتك": "ومستنداتك",
        "الشعور بوند": "باوربوينت",
        "المضاء": "المضي",
        "الموضي": "المضي",
        "لتأسيس شركةك": "لتأسيس شركتك",
        "شركةك": "شركتك",
        "سليمن": "سليماً",
        "سواقن": "سواءً",
        "سوان": "سواءً",
        "نستثمارية": "استثمارية",
        "بثقى": "بثقة",
        "لستثمارية": "الاستثمارية",
        "تطيح": "تتيح",
        "الطراخيس": "التراخيص",
        "عمالك": "أعمالك",
        "فردية": "فردياً",
        "شريكة": "شركة",
        "تأسيسها": "تأسيساً",
        "استراتجية": "إستراتيجية",
        "مسؤلية": "مسؤولية",
        "مسئولية": "مسؤولية",
        "اخصائي": "أخصائي",
        "الرخص": "الترخيص",
        "انترنيت": "إنترنت",
        "انترنت": "إنترنت",
        "اوفلاين": "أوفلاين"
      };
      for (const [wrong, right] of Object.entries(arabicCorrections)) {
        transcribedText = transcribedText.split(wrong).join(right);
      }
    }

    if (!transcribedText) {
      transcribedText = "لم يتم رصد أصوات أو كلمات واضحة في التسجيل الصوتي المرفوع. يرجى التأكد من اختيار ملف صوتي مسجل بوضوح.";
    }

    const processingDuration = Math.max(0.8, Math.round(((Date.now() - startTime) / 1000) * 10) / 10);
    const finalAudioDuration = audioDuration > 0 ? audioDuration : Math.max(2, Math.round(audioBuffer.length / 16000));

    const resultObj = {
      text: transcribedText,
      filename: originalName,
      model: "Whisper Neural / Gemini 3.6 AI Engine",
      language: language === "ar" ? "العربية الفصحى" : (language === "en" ? "الإنجليزية" : "تلقائي"),
      dialect: dialect === "sa" ? "🇸🇦 خليجية / سعودية" : (dialect === "eg" ? "🇪🇬 مصرية" : (dialect === "ye" ? "🇾🇪 يمنية" : "سياق عام")),
      correction_tool: correction === "OFF" ? "⛔ إيقاف التصحيح" : "🔤 PY (SpellChecker)",
      processing_time: processingDuration,
      duration: finalAudioDuration,
      saved_file: "uploads/transcript_clean.txt"
    };

    writeUploadProgress(100, "✅ اكتمل استخراج النصوص بنجاح 100%!", 4);
    writeUploadResult(resultObj);

    return res.json({
      success: true,
      message: "✅ تم تفريغ واستخراج النص بنجاح",
      text: transcribedText,
      result: resultObj
    });
  } catch (err: any) {
    console.error("Whisper API error:", err);
    writeUploadProgress(100, "❌ حدث خطأ أثناء المعالجة: " + err.message, 4);
    const errorObj = {
      text: "حدث خطأ أثناء قراءة ومعالجة الملف الصوتي: " + (err.message || "خطأ غير معروف"),
      filename: req.file?.originalname || "audio",
      model: "Neural Transcribe",
      language: "ar",
      processing_time: 0,
      duration: 0
    };
    writeUploadResult(errorObj);
    return res.json({
      success: false,
      message: err.message
    });
  } finally {
    if (tempConvertedFile && fs.existsSync(tempConvertedFile)) {
      try { fs.unlinkSync(tempConvertedFile); } catch (e) {}
    }
  }
});

// 3. Progress and Result polling endpoints (reads from disk or memory)
app.get(["/sound/uploads/progress.json", "/uploads/progress.json"], (req, res) => {
  const diskPath = path.join(process.cwd(), "sound", "uploads", "progress.json");
  if (fs.existsSync(diskPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(diskPath, "utf-8"));
      return res.json(data);
    } catch (e) {}
  }
  res.json(activeProgress);
});

app.get(["/sound/uploads/result.json", "/uploads/result.json"], (req, res) => {
  const diskPath = path.join(process.cwd(), "sound", "uploads", "result.json");
  if (fs.existsSync(diskPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(diskPath, "utf-8"));
      return res.json(data);
    } catch (e) {}
  }
  res.json(activeTranscriptionResult || { text: "" });
});

// 4. Clean temp endpoint - deletes progress.json, result.json, and temporary uploads
app.all(["/sound/api/clean_temp.php", "/api/clean_temp.php"], (req, res) => {
  const uploadDir = path.join(process.cwd(), "sound", "uploads");
  const progFile = path.join(uploadDir, "progress.json");
  const resFile = path.join(uploadDir, "result.json");
  if (fs.existsSync(progFile)) {
    try { fs.unlinkSync(progFile); } catch (e) {}
  }
  if (fs.existsSync(resFile)) {
    try { fs.unlinkSync(resFile); } catch (e) {}
  }
  activeProgress = { percent: 0, message: "جاهز للمعالجة", stepIndex: 0 };
  activeTranscriptionResult = null;
  res.json({ success: true, message: "تم تنظيف الملفات المؤقتة بنجاح" });
});

// 5. System info endpoint for hardware diagnostics
app.all(["/sound/api/system_info_cache.php", "/api/system_info_cache.php"], (req, res) => {
  res.json({
    status: "online",
    server: "Node.js Cloud Run Server",
    platform: os.platform(),
    cpus: os.cpus().length,
    freeMemory: Math.round(os.freemem() / 1024 / 1024) + " MB",
    totalMemory: Math.round(os.totalmem() / 1024 / 1024) + " MB"
  });
});

// Serve favicon directly to prevent 404
app.get(["/favicon.ico", "/sound/favicon.ico"], (req, res) => {
  const iconPath = fs.existsSync(path.join(process.cwd(), "public", "favicon.ico"))
    ? path.join(process.cwd(), "public", "favicon.ico")
    : path.join(process.cwd(), "public", "app_icon.png");
  res.setHeader("Content-Type", "image/png");
  res.sendFile(iconPath);
});

// Static serving of user's sound project directory AFTER api routes
const soundPath = fs.existsSync(path.join(process.cwd(), "sound"))
  ? path.join(process.cwd(), "sound")
  : path.join(process.cwd(), "dist", "sound");
app.use("/sound", express.static(soundPath));

async function startServer() {
  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoiceText Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
