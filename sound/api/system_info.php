<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

function getSystemInfo()
{
    // متغيرات افتراضية
    $ram_gb = 0;
    $cpu = 'غير معروف';
    $cores = 0;
    $device_type = 'كمبيوتر مكتبي';

    // تحديد نظام التشغيل
    $os = strtoupper(substr(PHP_OS, 0, 3));

    // ===== WINDOWS =====
    if ($os === 'WIN') {
        // 1. جلب الرام (بـ WMIC)
        $ram_bytes = shell_exec('wmic computersystem get TotalPhysicalMemory -value 2>nul');
        if ($ram_bytes) {
            preg_match('/\d+/', $ram_bytes, $matches);
            if (!empty($matches)) {
                $ram_gb = round($matches[0] / (1024 ** 3), 1);
            }
        }

        // 2. جلب اسم المعالج (بـ WMIC)
        $cpu_name = shell_exec('wmic cpu get Name -value 2>nul');
        if ($cpu_name) {
            preg_match('/Name=(.+)/', $cpu_name, $matches);
            if (!empty($matches[1])) {
                $cpu = trim($matches[1]);
            }
        }

        // 3. جلب عدد الأنوية (بـ WMIC)
        $cores = (int) shell_exec('wmic cpu get NumberOfCores -value 2>nul');

        // 4. جلب نوع الجهاز (بـ WMIC و PowerShell)
        $device_type = detectDeviceTypeWindows();
    }
    // ===== LINUX / MAC =====
    else {
        // الرام
        $ram_bytes = file_get_contents('/proc/meminfo');
        if ($ram_bytes) {
            preg_match('/MemTotal:\s+(\d+)/', $ram_bytes, $matches);
            if (!empty($matches)) {
                $ram_gb = round($matches[1] / 1024 / 1024, 1);
            }
        }
        // المعالج
        $cpu = trim(shell_exec('cat /proc/cpuinfo | grep "model name" | head -1 | cut -d ":" -f2'));
        // الأنوية
        $cores = (int) shell_exec('nproc');
        // نوع الجهاز
        $device_type = detectDeviceTypeLinux();
    }

    // إصلاح القيم الافتراضية في حال فشل الجلب
    if ($ram_gb === 0) $ram_gb = 4.0;
    if ($cores === 0) $cores = 2;
    if (empty($cpu) || $cpu === 'غير معروف') $cpu = 'Intel Core i5 (تقديري)';

    // ===================== اختيار النموذج المناسب =====================
    $cpu_lower = strtolower($cpu);
    $is_old_cpu = false;

    // معايير كشف المعالج القديم بدقة
    if ($cores < 4) $is_old_cpu = true;
    if (strpos($cpu_lower, 'i3') !== false) $is_old_cpu = true;
    if (preg_match('/i5-[2-3]\d{3}/', $cpu_lower)) $is_old_cpu = true;
    if (strpos($cpu_lower, 'pentium') !== false || strpos($cpu_lower, 'celeron') !== false) $is_old_cpu = true;
    if (strpos($cpu_lower, 'athlon') !== false) $is_old_cpu = true;

    // معالجات حديثة
    if (preg_match('/i5-[4-9]\d{3}/', $cpu_lower) || preg_match('/i7-\d{4}/', $cpu_lower) || preg_match('/i9-\d{4}/', $cpu_lower)) $is_old_cpu = false;
    if (strpos($cpu_lower, 'ryzen') !== false) $is_old_cpu = false;

    $power_level = '';
    $selected_model = 'base';

    if ($ram_gb >= 8 && $cores >= 6 && !$is_old_cpu) {
        $selected_model = 'large';
        $power_level = 'خارق 🚀 (نموذج فائق الدقة)';
    } elseif ($ram_gb >= 6 && $cores >= 4 && !$is_old_cpu) {
        $selected_model = 'medium';
        $power_level = 'قوي 💪 (نموذج دقيق)';
    } elseif ($ram_gb >= 4 && $cores >= 2) {
        $selected_model = $is_old_cpu ? 'base' : 'small';
        $power_level = $is_old_cpu ? 'محدود ⚡ (معالج قديم → نموذج سريع)' : 'متوسط ⚖️ (نموذج متوازن)';
    } else {
        $selected_model = 'base';
        $power_level = 'ضعيف ⚠️ (نموذج أساسي)';
    }

    // إرجاع النتيجة النهائية
    return [
        'success' => true,
        'ram' => $ram_gb,
        'cpu' => $cpu,
        'cores' => $cores,
        'device_type' => $device_type,
        'selected_model' => $selected_model,
        'power_level' => $power_level,
        'is_old_cpu' => $is_old_cpu,
        'last_check' => date('Y-m-d H:i:s'),
        'os' => PHP_OS
    ];
}

// ===================== دوال كشف نوع الجهاز =====================
function detectDeviceTypeWindows()
{
    // 1. استخدام WMIC
    $model = shell_exec('wmic computersystem get Model -value 2>nul');
    if ($model) {
        preg_match('/Model=(.+)/', $model, $matches);
        if (!empty($matches[1])) {
            $model = trim($matches[1]);
        }
    }

    $laptopKeywords = ['laptop', 'notebook', 'book', 'tab', 'flex', 'probook', 'elitebook', 'thinkpad', 'ideapad', 'yoga', 'spectre', 'envy', 'pavilion', 'inspiron', 'latitude', 'precision', 'vostro', 'xps', 'zenbook', 'vivobook', 'rog', 'predator', 'nitro', 'swift', 'aspire', 'surface'];
    $desktopKeywords = ['desktop', 'tower', 'workstation', 'optiplex', 'precision tower'];

    $modelLower = strtolower($model);
    foreach ($laptopKeywords as $keyword) {
        if (strpos($modelLower, $keyword) !== false) return 'لاب توب 💻';
    }
    foreach ($desktopKeywords as $keyword) {
        if (strpos($modelLower, $keyword) !== false) return 'كمبيوتر مكتبي 🖥️';
    }

    // 2. استخدام ChassisTypes (PowerShell)
    $chassis = shell_exec('powershell -Command "Get-WmiObject -Class Win32_SystemEnclosure | Select-Object -ExpandProperty ChassisTypes" 2>nul');
    if ($chassis) {
        $chassis = (int) trim($chassis);
        if (in_array($chassis, [8, 9, 10, 11, 12, 14, 18, 21, 31, 32])) return 'لاب توب 💻';
        if (in_array($chassis, [3, 4, 5, 6, 7, 15, 16])) return 'كمبيوتر مكتبي 🖥️';
    }

    // 3. فحص البطارية
    $battery = shell_exec('wmic path Win32_Battery get Name -value 2>nul');
    if ($battery && stripos($battery, 'Name') !== false) return 'لاب توب 💻';

    return 'كمبيوتر مكتبي 🖥️ (غير مؤكد)';
}

function detectDeviceTypeLinux()
{
    // يمكن إضافة كود للكشف على Linux/Mac حسب الحاجة
    return 'سيرفر / كمبيوتر';
}

echo json_encode(getSystemInfo(), JSON_UNESCAPED_UNICODE);
