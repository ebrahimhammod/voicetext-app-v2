<?php
// تأمين الرؤوس البرمجية لدعم التطبيقات الهجينة ومحولات الـ WebView بدون إنترنت
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// معالجة طلبات التثبيت المسبق (Preflight OPTIONS Requests) الشائعة في التطبيقات المحولة
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ========== تهيئة المسارات الموحدة المتزامنة مع الجافاسكريبت ==========
$base_path = dirname(__DIR__); // المسار الرئيسي للمشروع
$upload_dir = $base_path . '/uploads/';
$python_script = $base_path . '/whisper_handler.py';
if (!file_exists($python_script)) {
    echo json_encode([
        'success' => false,
        'message' => '🚨 خطأ فادح في المسارات: السيرفر لا يرى ملف البايثون! المسار المحتسب هو: ' . $python_script
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!file_exists($upload_dir)) {
    echo json_encode([
        'success' => false,
        'message' => '🚨 خطأ فادح: مجلد الرفع uploads غير موجود أو لا يمكن الوصول إليه: ' . $upload_dir
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
// التأكد من وجود مجلد الرفع محلياً وإنشائه بصلاحيات قياسية آمنة
if (!file_exists($upload_dir)) {
    @mkdir($upload_dir, 0755, true);
}

// تهيئة ملفات التبادل المؤقتة لضمان تصفير شريط التقدم عند كل عملية رفع جديدة
$progress_file = $upload_dir . 'progress.json';
$result_file = $upload_dir . 'result.json';

if (file_exists($progress_file)) {
    @unlink($progress_file);
}
if (file_exists($result_file)) {
    @unlink($result_file);
}

// ========== معالجة طلب المعالجة الصوتية للذكاء الاصطناعي ==========
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // التحقق الصارم من سلامة الرفع المحلي للملف الصوتي
    if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'حدث خطأ: لم يتم استقبال الملف الصوتي بشكل صحيح في التطبيق.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $file = $_FILES['audio'];

    // قراءة متغيرات التصحيح واللغة واللهجة المحدثة في الواجهات مع وضع قيم افتراضية آمنة
    $correction_mode = $_POST['correction'] ?? 'PY';
    $language_mode = $_POST['language'] ?? 'ar';
    $dialect_mode = $_POST['dialect'] ?? 'sa';

    // حماية ذاكرة خادم الأوفلاين (256 ميجابايت كحد أقصى)
    if ($file['size'] > 256 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'حجم الملف ضخم جداً! الحد الأقصى للمعالجة المحلية هو 256 ميجابايت.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // :استخراج الامتداد وفحصه لضمان عدم تمرير ملفات خبيثة للسيرفر
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed_ext = ['wav', 'mp3', 'm4a', 'flac', 'txt', 'mp4', 'mpeg', 'mpga', 'ogg', 'oga', 'webm', 'aac', 'aiff', 'aif', 'wma', 'amr', 'opus', 'avi', 'mov'];

    if (!in_array($ext, $allowed_ext)) {
        echo json_encode(['success' => false, 'message' => 'نوع الملف غير مدعوم من محرك Whisper. التنسيقات المتاحة: ' . implode(', ', $allowed_ext)], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // توليد اسم فريد للملف وتحديد مساره الكامل مع الحفاظ على الكلمة المفتاحية temp لضمان حذفه لاحقاً من بايثون
    $filename = 'audio_temp_' . time() . '_' . uniqid() . '.' . $ext;
    $filepath = $upload_dir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode(['success' => false, 'message' => 'Fشل النظام في نقل وحفظ الملف الصوتي بالمجلد المحلي.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // إنشاء ملف تقدّم أولي لمنع جافاسكريبت من رصد خطأ 404 عند البداية
    @file_put_contents($progress_file, json_encode(['percent' => 5, 'message' => '📥 جاري رفع ومزامنة الملف مع المحرك...'], JSON_UNESCAPED_UNICODE));

    // ============================================================
    // 🤖 تشغيل محرك بايثون في الخلفية بشكل ذكي ومتوافق مع كافة الأنظمة (Cross-Platform)
    // ============================================================

    // تنظيف وتأمين كافة المتغيرات الممررة حماية للسيرفر من ثغرات حقن الأوامر (Command Injection)
    $escaped_script = escapeshellarg($python_script);
    $escaped_file = escapeshellarg($filepath);
    $escaped_mode = escapeshellarg($correction_mode);
    $escaped_lang = escapeshellarg($language_mode);
    $escaped_dialect = escapeshellarg($dialect_mode);

    // كشف نظام تشغيل السيرفر لتحديد دالة التشغيل في الخلفية المناسبة دون تجميد الواجهة والمدد الطويلة
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // نظام تشغيل ويندوز - تمرير المعاملات الخمسة المحدثة بالكامل
        $command = "start /B python $escaped_script $escaped_file $escaped_mode $escaped_lang $escaped_dialect";
        pclose(popen($command, "r"));
    } else {
        // أنظمة تشغيل لينكس وماك - تمرير المعاملات الخمسة المحدثة بالكامل
        $python_bin = 'python3';
        $command = "$python_bin $escaped_script $escaped_file $escaped_mode $escaped_lang $escaped_dialect > /dev/null 2>&1 &";
        exec($command);
    }

    // ============================================================
    // ✅ إرسال الاستجابة الفورية السريعة للتطبيق لبدء حركة شريط التقدم
    // ============================================================
    echo json_encode([
        'success' => true,
        'message' => '✅ تم استقبال الملف بنجاح، بدأت معالجة الذكاء الاصطناعي في الخلفية...',
        'file' => $filename,
        'progress_url' => 'uploads/progress.json'
    ], JSON_UNESCAPED_UNICODE);
    exit;
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'خطأ: طريقة طلب البيانات غير مدعومة من خادم التطبيق.'], JSON_UNESCAPED_UNICODE);
}
