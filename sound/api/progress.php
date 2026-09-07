<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Access-Control-Allow-Origin: *');

$progressFile = __DIR__ . '/../uploads/progress.json';

// إرسال التحديثات كل ثانية
while (true) {
    if (file_exists($progressFile)) {
        $content = file_get_contents($progressFile);
        $data = json_decode($content, true);

        if ($data) {
            echo "data: " . json_encode($data) . "\n\n";
            ob_flush();
            flush();

            // إذا اكتمل التقدم، أنهي الاتصال
            if (isset($data['percent']) && $data['percent'] >= 100) {
                break;
            }
        }
    }

    sleep(1);
}
