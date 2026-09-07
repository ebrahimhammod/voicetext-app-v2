<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// ========== مسار ملف التخزين ==========
$cacheFile = __DIR__ . '/../uploads/system_info_cache.json';

// ========== التحقق من وجود الملف ==========
if (file_exists($cacheFile)) {
    $content = file_get_contents($cacheFile);
    $data = json_decode($content, true);

    if ($data && isset($data['ram']) && isset($data['cpu'])) {
        // ✅ البيانات موجودة → عرضها فوراً
        echo json_encode([
            'success' => true,
            'cached' => true,
            'data' => $data,
            'message' => '✅ من الملف المخزن'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// ========== إذا لم يوجد ملف ==========
// نقوم بفحص الجهاز وحفظ البيانات
require_once 'system_info.php';
$systemData = getSystemInfo();

// حفظ البيانات
file_put_contents($cacheFile, json_encode($systemData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// ✅ إرجاع البيانات مباشرة (بدون تأخير)
echo json_encode([
    'success' => true,
    'cached' => false,
    'data' => $systemData,
    'message' => '🔄 فحص جديد'
], JSON_UNESCAPED_UNICODE);
