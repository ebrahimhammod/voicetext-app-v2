import os
import subprocess
import sys

base_dir = os.path.dirname(os.path.abspath(__file__))

possible_models = [
    os.path.join(base_dir, "piper_voices", "ar_JO-kareem-medium.onnx"),
    os.path.join(base_dir, "ar_JO-kareem-medium.onnx"),
]
possible_configs = [
    os.path.join(base_dir, "piper_voices", "ar_JO-kareem-medium.onnx.json"),
    os.path.join(base_dir, "ar_JO-kareem-medium.onnx.json"),
]

model_path = next((p for p in possible_models if os.path.exists(p)), possible_models[0])
config_path = next((p for p in possible_configs if os.path.exists(p)), possible_configs[0])
output_wav = os.path.join(base_dir, "test_output.wav")

text = "مرحباً بكم في منصة الصوت الذكية، تم تشغيل نموذج كريم بدون إنترنت وبأعلى دقة."

print(f"1. فحص مسار النموذج: {model_path}")
if not os.path.exists(model_path):
    print("⚠️ تنبيه: ملف ar_JO-kareem-medium.onnx (60MB) غير موجود في هذا المسار. يرجى التأكد من نسخه لمجلد piper_voices.")
else:
    print("✅ تم العثور على ملف النموذج بنجاح!")

print("2. جاري تشغيل Piper عبر بايثون...")

# تشغيل piper وتمرير النص بترميز utf-8
python_exe = sys.executable or "python3"

cmd = [
    python_exe, "-m", "piper",
    "--model", model_path,
    "--config", config_path,
    "--output_file", output_wav
]

try:
    process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', cwd=base_dir)
    stdout, stderr = process.communicate(input=text)

    if os.path.exists(output_wav):
        size = os.path.getsize(output_wav)
        print(f"📊 حجم الملف الصوتي: {size} بايت")
        if size > 1000:
            print(f"🎉 تم توليد الصوت بنجاح حقيقي! يمكنك تشغيل الملف الآن: {output_wav}")
        else:
            print(f"⚠️ الملف لا زال صغيراً، تفاصيل stderr: {stderr}")
    else:
        print(f"❌ لم يتم إنشاء الملف، الخطأ: {stderr}")
except Exception as e:
    print(f"❌ خطأ أثناء التشغيل: {e}")