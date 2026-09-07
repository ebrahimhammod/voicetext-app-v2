<?php
// ضبط الذاكرة والوقت لمعالجة النصوص الطويلة جداً
@ini_set('memory_limit', '256M');
@ini_set('max_execution_time', 120);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['text']) || empty(trim($data['text']))) {
    echo json_encode([
        'success' => false,
        'message' => 'لم يتم إرسال النص المراد تحويله'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$text = trim($data['text']);
$voice = $data['voice'] ?? 'ar-SA-ZariyahNeural';
$speed = floatval($data['speed'] ?? 1.0);
$pitch = intval($data['pitch'] ?? 0);
$mode = $data['mode'] ?? 'online';

// ============================================================
// ✅ إنشاء ملف مؤقت
// ============================================================
$temp_file = tempnam(sys_get_temp_dir(), 'tts_') . '.mp3';

// ============================================================
// ✅ المحاولة 1: استخدام gTTS (يعمل مع Online)
// ============================================================
if ($mode === 'online' || $mode === 'auto') {
    try {
        // ✅ استخدام gTTS عبر Python (أمر واحد)
        $python_code = "from gtts import gTTS; import sys; tts = gTTS('" . addslashes($text) . "', lang='ar', slow=False); tts.save('" . addslashes($temp_file) . "')";
        $cmd = "python -c \"$python_code\" 2>&1";
        exec($cmd, $output, $return_code);

        if (file_exists($temp_file) && filesize($temp_file) > 1000) {
            $audio_data = base64_encode(file_get_contents($temp_file));
            unlink($temp_file);

            echo json_encode([
                'success' => true,
                'audio' => $audio_data,
                'engine' => 'gTTS (Online)',
                'mode' => 'online'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    } catch (Exception $e) {
        // ✅ فشل gTTS، ننتقل إلى الطريقة التالية
    }
}

// ============================================================
// ✅ المحاولة 2: استخدام eSpeak NG (يعمل Offline)
// ============================================================
if ($mode === 'offline' || $mode === 'auto') {
    try {
        $temp_file_wav = str_replace('.mp3', '.wav', $temp_file);

        // ✅ محاولة العثور على eSpeak NG
        $espeak_paths = [
            'C:\Program Files\eSpeak NG\espeak-ng.exe',
            'C:\Program Files (x86)\eSpeak NG\espeak-ng.exe',
            'espeak-ng',
            'espeak'
        ];

        $espeak_bin = null;
        foreach ($espeak_paths as $path) {
            if (file_exists($path) || $path === 'espeak-ng' || $path === 'espeak') {
                $espeak_bin = $path;
                break;
            }
        }

        if ($espeak_bin) {
            $espeak_speed = max(80, min(350, intval($speed * 160)));
            $espeak_pitch = max(0, min(99, intval(($pitch * 3) + 50)));

            $cmd = "\"$espeak_bin\" -v ar -s $espeak_speed -p $espeak_pitch -w \"$temp_file_wav\" \"$text\" 2>&1";
            exec($cmd, $output, $return_code);

            if (file_exists($temp_file_wav) && filesize($temp_file_wav) > 1000) {
                $audio_data = base64_encode(file_get_contents($temp_file_wav));
                unlink($temp_file_wav);

                echo json_encode([
                    'success' => true,
                    'audio' => $audio_data,
                    'engine' => 'eSpeak NG (Offline)',
                    'mode' => 'offline'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    } catch (Exception $e) {
        // ✅ فشل eSpeak NG
    }
}

// ============================================================
// ✅ المحاولة 3: استخدام Piper TTS (إذا كان مثبتاً)
// ============================================================
if ($mode === 'offline' || $mode === 'auto') {
    try {
        $base_dir = dirname(__DIR__);
        $model_path = $base_dir . '/piper_voices/ar_JO-kareem-medium.onnx';
        $config_path = $base_dir . '/piper_voices/ar_JO-kareem-medium.onnx.json';

        if (file_exists($model_path) && file_exists($config_path)) {
            $python_code = "
import sys
import json
import base64
import tempfile
import os
from piper import PiperVoice

model_path = '$model_path'
config_path = '$config_path'

voice = PiperVoice.load(model_path, config_path=config_path)

text = '" . addslashes($text) . "'
temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
temp_path = temp_file.name
temp_file.close()

voice.synth_to_file(text, temp_path)

with open(temp_path, 'rb') as f:
    audio_bytes = f.read()
os.remove(temp_path)

audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
print(json.dumps({'audio': audio_b64, 'engine': 'Piper AI', 'mode': 'offline'}))
";

            $cmd = "python -c \"$python_code\" 2>&1";
            exec($cmd, $output, $return_code);
            $output = implode("\n", $output);

            $json_start = strpos($output, '{');
            $json_end = strrpos($output, '}');

            if ($json_start !== false && $json_end !== false) {
                $clean_json = substr($output, $json_start, $json_end - $json_start + 1);
                $result = json_decode($clean_json, true);

                if ($result && isset($result['audio'])) {
                    echo json_encode([
                        'success' => true,
                        'audio' => $result['audio'],
                        'engine' => 'Piper AI (Offline)',
                        'mode' => 'offline'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }
        }
    } catch (Exception $e) {
        // ✅ فشل Piper
    }
}

// ============================================================
// ✅ إذا فشل كل شيء
// ============================================================
echo json_encode([
    'success' => false,
    'message' => 'فشل في تحويل النص إلى صوت. تأكد من تثبيت gTTS أو eSpeak NG.',
    'debug' => 'All methods failed'
], JSON_UNESCAPED_UNICODE);
