import sys
import json
import base64
import tempfile
import os
import subprocess
import socket
import asyncio
import re
import wave

# ============================================================
# 1. دوال مساعدة: تقسيم النصوص الطويلة ودمج الصوتيات
# ============================================================
def split_text(text, max_length=250):
    """تقسيم النص الطويل إلى أجزاء عند علامات الترقيم"""
    text = text.strip()
    if not text:
        return []
    
    sentences = re.split(r'([.،,\n؟!؛]+)', text)
    parts = []
    current_part = ""
    
    for item in sentences:
        if not item:
            continue
        if len(current_part) + len(item) <= max_length:
            current_part += item
        else:
            if current_part.strip():
                parts.append(current_part.strip())
            if len(item) > max_length:
                words = item.split(' ')
                sub_part = ""
                for w in words:
                    if len(sub_part) + len(w) + 1 <= max_length:
                        sub_part += (" " if sub_part else "") + w
                    else:
                        if sub_part.strip():
                            parts.append(sub_part.strip())
                        sub_part = w
                current_part = sub_part
            else:
                current_part = item
                
    if current_part.strip():
        parts.append(current_part.strip())
        
    return parts if parts else [text]
def combine_wav_files(file_list, output_path):
    """دمج ملفات WAV بأمان وسرعة باستخدام مكتبة wave"""
    if not file_list:
        return False
    try:
        data = []
        params = None
        for f in file_list:
            if os.path.exists(f) and os.path.getsize(f) > 44:
                with wave.open(f, 'rb') as w:
                    if not params:
                        params = w.getparams()
                    data.append(w.readframes(w.getnframes()))
        
        if not data or not params:
            return False
            
        with wave.open(output_path, 'wb') as output_wav:
            output_wav.setparams(params)
            for d in data:
                output_wav.writeframes(d)
        return True
    except Exception as e:
        print(f"Error combining wav: {e}", file=sys.stderr)
        return False

def is_connected():
    """فحص الاتصال بالإنترنت"""
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=2)
        return True
    except OSError:
        return False
# ============================================================
# 2. قراءة المدخلات القادمة من PHP
# ============================================================
try:
    if not sys.stdin.isatty():
        input_data = sys.stdin.read()
        params = json.loads(input_data)
        text = params.get('text', '').strip()
        voice = params.get('voice', 'ar-SA-ZariyahNeural')
        speed = float(params.get('speed', 1.0))
        pitch = int(params.get('pitch', 0))
        mode = params.get('mode', 'online')
    else:
        text = sys.argv[1] if len(sys.argv) > 1 else ""
        voice = sys.argv[2] if len(sys.argv) > 2 else "ar-SA-ZariyahNeural"
        speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
        pitch = int(sys.argv[4]) if len(sys.argv) > 4 else 0
        mode = sys.argv[5] if len(sys.argv) > 5 else "online"
except Exception as e:
    print(json.dumps({'error': f'فشل في قراءة المدخلات: {str(e)}'}))
    sys.exit(1)

if not text:
    print(json.dumps({'error': 'النص فارغ'}))
    sys.exit(1)

# ============================================================
# 3. محرك Online: edge-tts (جودة سحابية فائقة)
# ============================================================
async def generate_edge_audio():
    try:
        import edge_tts
        text_parts = split_text(text, 350)
        combined_audio = b""
        
        rate_str = f"{'+' if speed >= 1 else ''}{int((speed - 1) * 100)}%"
        pitch_str = f"{'+' if pitch >= 0 else ''}{pitch}Hz"

        for part in text_parts:
            if not part.strip():
                continue
            communicate = edge_tts.Communicate(part, voice, rate=rate_str, pitch=pitch_str)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    combined_audio += chunk["data"]
        
        if not combined_audio:
            raise Exception("لم يتم توليد أي صوت من edge-tts")
            
        audio_b64 = base64.b64encode(combined_audio).decode('utf-8')
        print(json.dumps({'audio': audio_b64, 'engine': 'edge-tts', 'mode': 'online', 'voice': voice}))
    except Exception as e:
        generate_piper_audio()


# ============================================================
# 4. محرك Offline: Piper TTS (صوت كريم الطبيعي)
# ============================================================
# ============================================================
# 4. محرك Offline: Piper TTS (صوت كريم الطبيعي المباشر في الذاكرة)
# ============================================================
# ============================================================
# 4. محرك Offline: Piper TTS (صوت كريم الطبيعي - ضبط القنوات بدقة)
# ============================================================
# ============================================================
# 4. محرك Offline: Piper TTS (الأكيد والمجرب)
# ============================================================
def generate_piper_audio():
    try:
        # ✅ استخدام المسار النسبي داخل التطبيق
        import os
        import sys
        
        # ✅ الحصول على المسار الحالي للمشروع
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "piper_voices", "ar_JO-kareem-medium.onnx")
        config_path = os.path.join(base_dir, "piper_voices", "ar_JO-kareem-medium.onnx.json")

        if not os.path.exists(model_path) or not os.path.exists(config_path):
            raise Exception("ملفات الصوت غير موجودة في piper_voices")

        piper_bin = os.path.join(base_dir, "piper_bin", "piper")
        if not os.path.exists(piper_bin):
            piper_bin = "piper"

        text_parts = split_text(text, 250)
        temp_files = []

        # ✅ مجلد العمل هو نفس مجلد المشروع
        work_dir = base_dir

        for part in text_parts:
            if not part.strip():
                continue

            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
                temp_path = tmp.name

            cmd = [
                piper_bin,
                "--model", model_path,
                "--config", config_path,
                "--output_file", temp_path
            ]

            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                cwd=work_dir,
                env=os.environ.copy()
            )
            stdout, stderr = process.communicate(input=part)

            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 100:
                temp_files.append(temp_path)
            else:
                if stderr:
                    print(f"Piper error on part: {stderr}", file=sys.stderr)

        if not temp_files:
            raise Exception("لم يتم توليد أي مقطع صوتي صالح من Piper")

        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as final_tmp:
            final_path = final_tmp.name

        if len(temp_files) == 1:
            with open(temp_files[0], 'rb') as f:
                audio_bytes = f.read()
        else:
            combine_wav_files(temp_files, final_path)
            with open(final_path, 'rb') as f:
                audio_bytes = f.read()

        for f in temp_files:
            try: os.remove(f)
            except: pass
        try: os.remove(final_path)
        except: pass

        if not audio_bytes or len(audio_bytes) <= 44:
            raise Exception("البيانات الصوتية الناتجة فارغة")

        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(json.dumps({
            'audio': audio_b64,
            'engine': 'Piper AI (Kareem Neural)',
            'mode': 'offline',
            'voice': 'ar_kareem'
        }))

    except Exception as e:
        print(json.dumps({'error': f'فشل Piper: {str(e)}'}))
        sys.exit(1)
# ============================================================
# 5. محرك Offline 2: eSpeak NG (القارئ الآلي الاحتياطي)
# ============================================================
def generate_espeak_audio():
    try:
        import os
        import tempfile
        import subprocess
        import base64
        import json
        
        print("💻 استخدام eSpeak NG (محلي)", file=sys.stderr)
        
        # ✅ استخدام المسار النسبي داخل التطبيق
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # ✅ محاولة العثور على eSpeak NG في عدة أماكن
        espeak_paths = [
            os.path.join(base_dir, "bin", "espeak-ng.exe"),  # داخل مجلد التطبيق
            os.path.join(base_dir, "espeak-ng", "espeak-ng.exe"),
            os.path.join(base_dir, "espeak-ng.exe"),
            "espeak-ng",  # إذا كان في PATH
            "espeak",
        ]
        
        espeak_bin = None
        for p in espeak_paths:
            if os.path.exists(p) or p in ["espeak-ng", "espeak"]:
                espeak_bin = p
                break
                
        if not espeak_bin:
            print(json.dumps({'error': 'لم يتم العثور على محرك صوتي محلي (eSpeak NG)'}))
            return

        text_parts = split_text(text, 200)
        temp_files = []
        
        espeak_speed = max(80, min(350, int(speed * 160)))
        espeak_pitch = max(0, min(99, int((pitch * 3) + 50)))
        
        for part in text_parts:
            if not part.strip():
                continue
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
                temp_path = tmp.name
            
            cmd = [
                espeak_bin,
                "-v", "ar",
                "-s", str(espeak_speed),
                "-p", str(espeak_pitch),
                "-w", temp_path,
                part
            ]
            
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
            
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 44:
                temp_files.append(temp_path)
            else:
                if os.path.exists(temp_path):
                    try: os.remove(temp_path)
                    except: pass

        if not temp_files:
            raise Exception("لم يتم توليد ملفات صوتية صالحة من eSpeak")

        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as final_tmp:
            final_path = final_tmp.name

        if len(temp_files) == 1:
            with open(temp_files[0], 'rb') as f:
                audio_bytes = f.read()
        else:
            combine_wav_files(temp_files, final_path)
            with open(final_path, 'rb') as f:
                audio_bytes = f.read()

        for f in temp_files:
            try: os.remove(f)
            except: pass
        try: os.remove(final_path)
        except: pass

        if not audio_bytes or len(audio_bytes) <= 44:
            raise Exception("البيانات الصوتية الناتجة فارغة")

        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(json.dumps({
            'audio': audio_b64,
            'engine': 'eSpeak NG',
            'mode': 'offline',
            'voice': 'ar'
        }))

    except Exception as err:
        print(json.dumps({'error': f'فشل محرك الأوفلاين: {str(err)}'}))
# ============================================================
# 6. اختيار المحرك المناسب
# ============================================================
def generate_offline_audio():
    # الأولوية دائماً لـ Piper إذا تم تثبيته، وإلا التبديل لـ eSpeak
    generate_piper_audio()

if mode == 'offline':
    generate_piper_audio()
elif mode == 'online':
    asyncio.run(generate_edge_audio())
else:  # auto
    if is_connected():
        asyncio.run(generate_edge_audio())
    else:
        generate_piper_audio()