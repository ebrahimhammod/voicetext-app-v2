import { ProjectFileItem } from '../types';

export const INITIAL_PROJECT_FILES: ProjectFileItem[] = [
  {
    id: 'sample-index-html',
    name: 'index.html',
    type: 'html',
    size: 1420,
    detectedFeatures: ['الصفحة الرئيسية للمشروع القديم', 'روابط الانتقال بين الصفحات'],
    content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>مشروع تحويل الصوت إلى نص والعكس</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>مرحباً بكم في مشروع الصوت والنص</h1>
    <p>اختر الخدمة التي تريد استخدامها:</p>
    <div class="nav-cards">
      <a href="speech_to_text.html" class="card">
        <h2>🎤 تفريغ الصوت إلى نص</h2>
        <p>تحدث عبر المايكروفون ليتم تحويل صوتك إلى نص مكتوب فوراً.</p>
      </a>
      <a href="text_to_speech.html" class="card">
        <h2>🔊 تحويل النص إلى صوت</h2>
        <p>اكتب أي نص واستمع إليه بصوت واضح ونقي.</p>
      </a>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'sample-stt-html',
    name: 'speech_to_text.html',
    type: 'html',
    size: 2150,
    detectedFeatures: ['تفريغ الصوت بالمتصفح (Web Speech API)', 'تسجيل الميكروفون (MediaRecorder)'],
    content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تفريغ الصوت إلى نص</title>
</head>
<body>
  <div class="app">
    <h2>تفريغ الصوت إلى نص المكتوب</h2>
    <button id="start-record">بدء التسجيل 🎙️</button>
    <button id="stop-record">إيقاف</button>
    <textarea id="result" placeholder="النص المفرغ سيظهر هنا..."></textarea>
    <form action="transcribe_server.php" method="POST" enctype="multipart/form-data">
      <input type="file" name="audio_file" accept="audio/*">
      <button type="submit">رفع ملف صوتي للمعالجة</button>
    </form>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
  },
  {
    id: 'sample-tts-html',
    name: 'text_to_speech.html',
    type: 'html',
    size: 1890,
    detectedFeatures: ['نطق النصوص بالمتصفح (SpeechSynthesis)'],
    content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تحويل النص إلى صوت</title>
</head>
<body>
  <div class="app">
    <h2>تحويل النص إلى كلام صوتي</h2>
    <textarea id="text-input" placeholder="اكتب النص هنا..."></textarea>
    <select id="voice-select"></select>
    <button id="speak-btn">نطق النص 🔊</button>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
  },
  {
    id: 'sample-php',
    name: 'transcribe_server.php',
    type: 'php',
    size: 1680,
    detectedFeatures: ['معالجة خادم PHP للطلبات الصوتية', 'رفع ومعالجة الملفات'],
    content: `<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['audio_file'])) {
        $file = $_FILES['audio_file'];
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $targetFile = $uploadDir . basename($file['name']);
        
        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            // تشغيل سكربت بايثون لتحليل وتفريغ الصوت
            $output = shell_exec("python3 voice_processor.py " . escapeshellarg($targetFile));
            echo json_encode(["status" => "success", "transcription" => $output]);
        } else {
            echo json_encode(["status" => "error", "message" => "فشل رفع الملف"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "لم يتم استلام ملف صوتي"]);
    }
}
?>`,
  },
  {
    id: 'sample-python',
    name: 'voice_processor.py',
    type: 'py',
    size: 2100,
    detectedFeatures: ['مكتبة بايثون للتعرف الصوتي (SpeechRecognition)', 'مكتبة بايثون لتحويل النص لصوت (gTTS / pyttsx3)'],
    content: `import sys
import speech_recognition as sr
from gtts import gTTS
import os

def transcribe_audio(audio_path):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)
        try:
            # التعرف على الصوت باللغة العربية
            text = recognizer.recognize_google(audio_data, language="ar-SA")
            return text
        except sr.UnknownValueError:
            return "تعذر فهم الصوت المسجل."
        except sr.RequestError as e:
            return f"خطأ في الخدمة: {e}"

def text_to_speech_mp3(text, output_path="output.mp3"):
    tts = gTTS(text=text, lang='ar')
    tts.save(output_path)
    return output_path

if __name__ == "__main__":
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
        result = transcribe_audio(audio_file)
        print(result)
`,
  },
  {
    id: 'sample-js',
    name: 'app.js',
    type: 'js',
    size: 1950,
    detectedFeatures: ['تفريغ الصوت بالمتصفح (Web Speech API)', 'نطق النصوص بالمتصفح (SpeechSynthesis)'],
    content: `// Web Speech Recognition Logic
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
if (recognition) {
  recognition.lang = 'ar-SA';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let text = '';
    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }
    const resultBox = document.getElementById('result');
    if (resultBox) resultBox.value = text;
  };
}

// Web Speech Synthesis Logic
function speakText(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar';
    window.speechSynthesis.speak(utterance);
  }
}
`,
  },
];
