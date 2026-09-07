<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$upload_dir = dirname(__DIR__) . '/uploads/';

$progress_file = $upload_dir . 'progress.json';
$result_file = $upload_dir . 'result.json';

// حذف الملفات فيزيائياً من جذورها داخل الاستضافة
if (file_exists($progress_file)) {
    @unlink($progress_file);
}
if (file_exists($result_file)) {
    @unlink($result_file);
}

echo json_encode(['success' => true, 'message' => 'تم تنظيف مجلد uploads تلقائياً']);
exit;
