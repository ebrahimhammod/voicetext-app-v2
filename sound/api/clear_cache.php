<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$cacheFile = __DIR__ . '/../uploads/system_info_cache.json';

if (file_exists($cacheFile)) {
    unlink($cacheFile);
    echo json_encode([
        'success' => true,
        'message' => '✅ تم حذف الملف المؤقت'
    ]);
} else {
    echo json_encode([
        'success' => true,
        'message' => 'ℹ️ لا يوجد ملف لحذفه'
    ]);
}
