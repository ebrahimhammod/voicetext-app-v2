import whisper
import sys
import os
import psutil
import json
import time
import threading
import subprocess
import requests     # ✅ أضف هذا السطر

# ✅ منع تداخل خيوط المعالجة باستخدام حلقة تحكم (Thread Control Flag)
is_processing = True

# ✅ التحقق الآمن والمحلي من وجود مسار صوتي داخل الملف
def check_audio_stream(file_path):
    """التحقق من وجود مسار صوتي باستخدام ffprobe لضمان عدم معالجة ملفات صامتة"""
    try:
        cmd = [
            'ffprobe', '-v', 'error', 
            '-select_streams', 'a', 
            '-show_entries', 'stream=codec_type', 
            '-of', 'default=noprint_wrappers=1:nokey=1', 
            file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return result.stdout.strip() != ''
    except Exception:
        return True # تمرير افتراضي في حال عدم توفر ffprobe لضمان عدم تجميد التطبيق

# ========== إدارة ملف التقدم الذكي ==========
base_dir = os.path.dirname(sys.argv[1]) if len(sys.argv) > 1 else '.'
if not os.path.exists(base_dir):
    os.makedirs(base_dir)
progress_file = os.path.join(base_dir, 'progress.json')

def update_progress(percent, message):
    """تحديث ملف التقدم بشكل آمن متوافق مع واجهات التطبيقات اللمسيّة"""
    try:
        with open(progress_file, 'w', encoding='utf-8') as f:
            json.dump({'percent': percent, 'message': message}, f, ensure_ascii=False)
    except Exception:
        pass

def auto_update_progress():
    """تحديث تدريجي ذكي ومحمي يتوقف فوراً عند انتهاء Whisper من التفريغ"""
    global is_processing
    steps = [
        (45, "🎤 جاري تحليل الإشارات الصوتية..."),
        (55, "🎤 جاري استخراج ميزات الصوت الذكية..."),
        (65, "📝 جاري تجميع الكلمات المكتوبة..."),
        (75, "📝 جاري مراجعة السياق الزمني..."),
        (85, "🔧 جاري تهيئة معالجات التصحيح الإملائي..."),
    ]
    for percent, message in steps:
        if not is_processing:
            break
        time.sleep(4)
        if is_processing:
            update_progress(percent, message)

# ========== فحص العتاد الذكي واختيار النموذج التكيفي ==========
# ========== فحص العتاد الشامل واختيار النموذج التكيفي المثالي ==========
def select_model():
    """
    فحص مواصفات الجهاز (لابتوب، حاسوب خارق، هاتف رائد، هاتف اقتصادي)
    واختيار النموذج الأنسب لضمان دقة خارقة دون التضحية باستقرار التطبيق أوفلاين.
    """
    try:
        # 1. قياس الذاكرة العشوائية الإجمالية (RAM) بالجيجابايت
        memory = psutil.virtual_memory()
        ram_gb = memory.total / (1024 ** 3)
        
        # 2. قياس عدد الأنوية (CPU Cores) لمعرفة قوة المعالجة
        cpu_cores = psutil.cpu_count(logical=True)
        
        # 🔥 أجهزة الحاسوب المكتبية واللابتوبات الاحترافية الخارقة (الإنتاجية القصوى)
        if ram_gb >= 32 and cpu_cores >= 12:
            return "large-v3"  # أعلى دقة لغوية ونحوية ممكنة في عالم الذكاء الاصطناعي
            
        # 🚀 الأجهزة القوية جداً والهواتف الرائدة الحديثة (أفضل موازنة للسرعة والدقة)
        elif ram_gb >= 16 and cpu_cores >= 8:
            return "large"  # سرعة فائقة جداً مع دقة قريبة من نموذج large
            
        # 💎 أجهزة الكمبيوتر والهواتف الفوق متوسطة
        elif ram_gb >= 12 and cpu_cores >= 6:
            return "medium"  # معالجة سياقية قوية وممتازة جداً للغة العربية
            
        # 🟡 الأجهزة المتوسطة واللابتوبات المكتبية العادية
        elif ram_gb >= 6 and cpu_cores >= 4:
            return "small"   # متوازن وخفيف على موارد الجهاز مع دقة جيدة
            
        # 🟢 الهواتف والأجهزة الاقتصادية أو القديمة
        elif ram_gb >= 4 and cpu_cores >= 2:
            return "base"    # حماية من الكراش والتهنيج مع سرعة معالجة مقبولة
            
        # 🚨 الأجهزة الضعيفة جداً أو الهواتف القديمة المحدودة
        else:
            return "tiny"    # أخف نموذج على الإطلاق لضمان عمل التطبيق تحت أي ظرف
            
    except Exception:
        return "base"  # حماية تراجعية مطلقة لضمان تشغيل التطبيق لو فشل الفحص

# ========== التحقق من المدخلات والملفات ==========
if len(sys.argv) < 2:
    print(json.dumps({'error': 'خطأ في النظام: لم يتم تمرير ملف صوتي للمنصة'}, ensure_ascii=False))
    sys.exit(1)

# استقبال المعاملات الخمسة الممررة من PHP بأمان كامل
audio_path = sys.argv[1]
correction_mode = sys.argv[2] if len(sys.argv) > 2 else 'PY'
language_param = sys.argv[3] if len(sys.argv) > 3 else 'ar'
dialect_param = sys.argv[4] if len(sys.argv) > 4 else 'sa'

if not os.path.exists(audio_path):
    print(json.dumps({'error': 'خطأ: الملف المختار غير موجود أو تم نقله'}, ensure_ascii=False))
    sys.exit(1)


# ========== فحص سلامة الملف الصوتي ==========
if not check_audio_stream(audio_path):
    error_msg = (
        "❌ الملف المختار لا يحتوي على مسار صوتي مسموع!\n"
        "يرجى اختيار ملف صوتي نقي أو فيديو يحتوي على صوت مصاحب ليتمكن الذكاء الاصطناعي من معالجته."
    )
    print(json.dumps({'error': error_msg}, ensure_ascii=False))
    sys.exit(1)

# ========== بدء مرحلة استدعاء النماذج ==========
# ========== بدء مرحلة استدعاء النماذج وتجهيز البنية التحتية ==========
update_progress(10, "📥 جاري استدعاء نموذج الذكاء الاصطناعي...")
model_name = select_model()

try:
    # تحميل النموذج محلياً 100% متوافق مع وضع الأوفلاين
    model = whisper.load_model(model_name)
    update_progress(35, "🎤 جاري معالجة وفحص بنية الترددات...")
    
    start_time = time.time()
    update_progress(40, "🎤 بدء عملية تفريغ الصوت وتحويله لنص...")
    
    # تفعيل خيط التحديث الذكي المحمي
    update_thread = threading.Thread(target=auto_update_progress)
    update_thread.daemon = True
    update_thread.start()
    
    # 🧠 إعداد معيار تحديد اللغة ديناميكياً لربط المتصفح بالخلفية
    whisper_language = None if language_param == 'auto' else language_param
    
    # معالجة احترافية عالية الدقة مفتوحة المدد وخالية من القيود الزمنية للأنظمة الهجينة
    result = model.transcribe(
        audio_path,
        fp16=False,
        language=whisper_language, # تمرير ديناميكي آمن لدعم العربية والإنجليزية والتلقائي
        task='transcribe',
        verbose=False,
        condition_on_previous_text=False,
        compression_ratio_threshold=2.4,
        logprob_threshold=-1.0,
        no_speech_threshold=0.5,
        temperature=0.0,
        beam_size=3
    )
    
    # إيقاف خيط التقدم التلقائي فوراً فور انتهاء المعالجة التامة لـ Whisper
    is_processing = False
    
    text = result.get("text", "").strip()
    duration = result.get('segments', [{}])[-1].get('end', 0) if result.get('segments') else 0

    # ============================================================
    # 🔧 معالجة التدقيق الإملائي المطور بالقاموس الذكي والتكيف مع اللهجات
    # ============================================================
    update_progress(90, "🔧 جاري التدقيق والتدقيق الإملائي الذكي...")

       # ============================================================
    # ⚙️ 1️⃣ القاموس المحلي المطور والمطهر للأخطاء الإملائية الحتمية
    # ============================================================
    custom_dictionary = {
        # --- تصحيحات الهوية الاستثمارية الخاصة بشركة المسار ---
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
        "استثمارية": "استثمارية",
        
        # --- تصحيحات أخطاء شائعة في المصطلحات الإدارية والتجارية ---
        "استراتجية": "إستراتيجية",
        "مسؤلية": "مسؤولية",
        "مسئولية": "مسؤولية",
        "اخصائي": "أخصائي",
        "الرخص": "الترخيص",
        "انترنيت": "إنترنت",
        "انترنت": "إنترنت",
        "اوفلاين": "أوفلاين",
        "اونلاين": "أونلاين",
        "بروفايل": "بروفايل",
        "فديو": "فيديو",
        "كومبيوتر": "كمبيوتر",

        # --- تصحيحات الحروف المتقاربة والخلط الصوتي (الضاد والظاء) ---
        "ظابط": "ضابط",
        "قرظ": "قرض",
        "ضهر": "ظهر",
        "إضهار": "إظهار",
        "الضروف": "الظروف",

        # --- أخطاء الألف المقصورة واللينة (المثبتة لغوياً) ---
        "رضى": "رضا",
        "فتا": "فتى",
        "عصى": "عصا",

        # --- أخطاء الهمزة المتطرفة الشائعة جداً في نصوص الذكاء الاصطناعي ---
        "سيء": "سيئ",
        "أسوء": "أسوأ",
        "مبادىء": "مبادئ",
        "أكفأ": "أكفأ",
        "جزءا": "جزءاً",
        "بدءا": "بدءاً"
    }


    # دمج كلمات حسب اللهجة
    #if dialect_param == 'eg':
    #    custom_dictionary.update({"عشان": "من أجل", "بأه": "أصبح", "دي": "هذه"})
    #elif dialect_param == 'ye':
    #    custom_dictionary.update({"ذحين": "الآن", "قوا": "رجاءً"})
    #elif dialect_param == 'sh':
    #    custom_dictionary.update({"هلق": "الآن", "شو": "ماذا"})
    # 📍 القاموس اللهجتي التكيفي المطور لحماية النصوص الفصيحة
    # ============================================================
    if dialect_param == 'sa':  # 🇸🇦 سعودية / خليجية
        custom_dictionary.update({
            " الحين ": " الآن ",
            " وش ": " ماذا ",
            " ليش ": " لماذا ",
            " ابي ": " أريد ",
            " عندي ": " لدي ",
            " بس ": " فقط ",
            " ايه ": " نعم ",
            " ايش ": " ماذا ",
            " دحين ": " الآن ",
            " ذي ": " هذه ",
            " هذول ": " هؤلاء "
        })

    elif dialect_param == 'eg':  # 🇪🇬 مصرية
        custom_dictionary.update({
            " عشان ": " من أجل ",
            " بأه ": " أصبح ",
            " دي ": " هذه ",
            " ده ": " هذا ",
            " اية ": " ماذا ",
            " ايه ": " ماذا ",
            " ازاي ": " كيف ",
            " أزاي ": " كيف ",
            " إزاي ": " كيف ",
            " بقة ": " إذن ",
            " كدة ": " هكذا ",
            " أه ": " نعم ",
            " مش ": " ليس ",
            " خلاص ": " انتهى ",
            " يعني ": " أي ",
            " بتاع ": " خاص بـ ",
            " بتاعة ": " خاصة بـ ",
            " بتوع ": " خاصين بـ "
        })

    elif dialect_param == 'ye':  # 🇾🇪 يمنية
        custom_dictionary.update({
            " ذحين ": " الآن ",
            " قوا ": " رجاءً ",
            " اش ": " ماذا ",
            " ايش ": " ماذا ",
            " وش ": " ماذا ",
            " بس ": " فقط ",
            " دحين ": " الآن ",
            " الحين ": " الآن ",
            " عندي ": " لدي ",
            " ابي ": " أريد ",
            " اي ": " نعم "
        })

    elif dialect_param == 'sh':  # 🇵🇸🇸🇾 شامية
        custom_dictionary.update({
            " هلق ": " الآن ",
            " هلأ ": " الآن ",
            " شو ": " ماذا ",
            " عم ": " جاري ",
            " بدي ": " أريد ",
            " بدك ": " تريد ",
            " بدو ": " يريد ",
            " بدنا ": " نريد ",
            " بدكن ": " تريدون ",
            " عنجد ": " حقاً ",
            " كتير ": " كثيراً ",
            " كمان ": " أيضاً ",
            " اي ": " نعم ",
            " منيح ": " جيد ",
            " مش ": " ليس ",
            " ليش ": " لماذا ",
            " بس ": " فقط ",
            " هون ": " هنا ",
            " هيك ": " هكذا "
        })

    elif dialect_param == 'mag':  # 🇲🇦🇩🇿🇹🇳 مغاربية
        custom_dictionary.update({
            " دابا ": " الآن ",
            " شنو ": " ماذا ",
            " علاش ": " لماذا ",
            " بزاف ": " كثيراً ",
            " مزيان ": " جيد ",
            " شوية ": " قليلاً ",
            " فاش ": " في ماذا ",
            " كيفاش ": " كيف ",
            " أشنو ": " ماذا ",
            " واش ": " هل ",
            " حنا ": " نحن ",
            " بصح ": " لكن ",
            " حاجة ": " شيء ",
            " نعس ": " نام "
        })


    
# ============================================================
# 🔧 تطبيق التصحيح حسب الوضع
# ============================================================

    if correction_mode == 'OFF' or not text:
        print("⛔ تم إيقاف التصحيح الإملائي بطلب من المستخدم")

    elif correction_mode == 'PY':
        # ✅ وضع PY: تصحيح أساسي محلي
        try:
            print("💻 تفعيل وضع PY المحلي: جاري معالجة الكلمات أوفلاين...")
            from spellchecker import SpellChecker
            spell = SpellChecker(language='ar' if language_param == 'ar' else 'en')
            
            words = text.split()
            corrected_words = []
            for word in words:
                if "." in word or "http" in word or "org" in word:
                    corrected_words.append(word)
                    continue
                corrected = spell.correction(word)
                corrected_words.append(corrected if corrected else word)
            text = " ".join(corrected_words)
            
            # تطبيق القاموس
            for wrong_word, right_word in custom_dictionary.items():
                text = text.replace(wrong_word, right_word)
            
            # تصحيحات إضافية (خارج الـ for)
            text = text.replace("المطار", "المسار")
            text = text.replace("الماء", "المضي")
            text = text.replace("بقى", "بثقة")
                
            print("✅ اكتمل التصحيح الإملائي الأساسي المحلي (PY)")
        except Exception as e:
            print(f"⚠️ خطأ في معالجة التدقيق الأساسي: {e}")
            for wrong_word, right_word in custom_dictionary.items():
                text = text.replace(wrong_word, right_word)
       # ============================================================
    # 💾 تصدير وحفظ الملفات النصية المستخرجة محلياً
    # ============================================================
    update_progress(95, "💾 jاري حفظ وتصدير النص النهائي...")
    
    output_file = os.path.join(os.path.dirname(audio_path), 'transcript_clean.txt')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(text)
    
    # ========== إعداد كتل البيانات وعرض التقارير المحدثة ==========
    result_file = os.path.join(os.path.dirname(audio_path), 'result.json')
    
    if correction_mode == 'OFF':
        correction_tool = '⛔ إيقاف التصحيح'
    elif correction_mode == 'PY':
        correction_tool = '🔤 PY (أساسي)'
    else:
        correction_tool = '🔤 PY (أساسي)'
        
    # خريطة أسماء اللهجات لتقرير الواجهة
    dialect_names = {
        'sa': '🇸🇦 خليجية / سعودية',
        'eg': '🇪🇬 مصرية',
        'ye': '🇾🇪 يمنية',
        'sh': '🇵🇸 شامية',
        'mag': '🇲🇦 مغاربية'
    }
    selected_dialect_name = dialect_names.get(dialect_param, dialect_param)
    selected_lang_name = 'العربية 🇸🇦' if language_param == 'ar' else ('الإنجليزية 🇺🇸' if language_param == 'en' else '🤖 تعرف تلقائي')
    
    # بناء الـ JSON المحدث بالشراكة مع الجافاسكريبت ليعرض كافة الإحصائيات الفوقية الجديدة
    result_data = {
        'text': text,
        'duration': round(duration, 2),
        'model': model_name,
        'processing_time': round(time.time() - start_time, 2),
        'saved_file': 'uploads/transcript_clean.txt',
        'correction_tool': correction_tool,
        'filename': os.path.basename(audio_path),
        'language': selected_lang_name,
        'dialect': selected_dialect_name
    }
    
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(result_data, f, ensure_ascii=False, indent=4)
    
    # تحديث واجهة التطبيق باكتمال المعالجة بنجاح مئة بالمئة
    update_progress(100, "✅ اكتمل استخراج النصوص بنجاح!")

    # ========== مخرجات وحدة التحكم الصامتة والبرمجية التكعيبية ==========
    print("\n" + "=" * 50)
    print("📊 تقرير تشخيص المعالجة الذكية والمحلية:")
    print("=" * 50)
    print(f"📂 اسم الملف المصاحب: {os.path.basename(audio_path)}")
    print(f"📌 حجم نموذج المعالج: {model_name}")
    print(f"🗣️ اللغة المستهدفة: {selected_lang_name}")
    print(f"📍 سياق اللهجة الإقليمية: {selected_dialect_name}")
    print(f"🔧 أداة التدقيق الإملائي: {correction_tool}")
    print(f"⏱️ زمن المعالجة الفعلي للعتاد: {time.time() - start_time:.1f} ثانية")
    print(f"⏱️ المدة الزمنية للمقطع الصوتي: {duration:.1f} ثانية")
    print(f"✅ مسار التصدير البرمجي: {output_file}")
    print("\n📝 النص النهائي المفرغ والمصحح قاموسياً:")
    print("=" * 50)
    print(text if text else "(لم يتم رصد أي كلمات منطوقة قابلة للتفريغ)")
    print("=" * 50)

    # طباعة سطر الـ JSON النهائي لتتمكن واجهة التطبيق الهجينة من قراءته وعرضه
    print(json.dumps(result_data, ensure_ascii=False))
    
    # ============================================================
    # 🗑️ إدارة حذف الملفات المؤقتة وحماية ملفات المستخدم الأصلية
    # ============================================================
    # نقوم بحذف الملف الصوتي المرفوع فقط إذا كان مخزناً داخل مجلد المرفوعات المؤقتة للتطبيق (Temp)
    # لضمان الأمان التام وعدم مسح ملفات الفيديو الأصلية التي يعالجها العميل من ملفاته الخاصة
    if os.path.exists(audio_path) and ("temp" in audio_path.lower() or "tmp" in audio_path.lower()):
        try:
            os.remove(audio_path)
            print(f"🗑️ تم تنظيف الذاكرة المؤقتة وحذف الملف بنجاح: {os.path.basename(audio_path)}")
        except Exception:
            pass
            
except Exception as e:
    # التقاط الأخطاء الكلية ومنع تجميد شاشات اللمس بإرجاع كتل الأخطاء بتنسيق JSON نظيف
    is_processing = False
    print(json.dumps({'error': f"انهيار غير متوقع في معالج العتاد: {str(e)}"}, ensure_ascii=False))
    sys.exit(1)
