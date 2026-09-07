/**
 * Sound Platform - Offline & Online License Management System
 * نظام التفعيل الذكي والتحقق المحلي دون الحاجة للاتصال بالإنترنت
 * المالك والمطور: إبراهيم القديمي (+967775888836)
 */

(function(global) {
    'use strict';

    // مفتاح التشفير السري الثابت الخاص بتوليد أكواد التفعيل (Salt)
    const SECRET_SALT = "IBRAHIM_QUDAIMI_SOUND_APP_SECURE_SALT_8836_2026";
    const OWNER_DEFAULT_PIN = "7758"; // الرمز الافتراضي للمالك للدخول للوحة التوليد

    // دالة تجزئة وتشفير رياضية سريعة وخفيفة تعمل في أي بيئة بدون إنترنت (FNV-1a / Murmur hybrid)
    function hashString(str, seed = 0x811c9dc5) {
        let h = seed;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
            h = (h << 5) | (h >>> 27);
        }
        return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
    }

    // إنشاء بصمة رقم تسلسلي فريد للجهاز لا يتكرر
    function generateDeviceFingerprint() {
        let storedId = localStorage.getItem('sound_app_device_serial');
        if (storedId && storedId.startsWith('DEV-')) {
            return storedId;
        }

        // جمع مواصفات العتاد والشاشة لإنتاج بصمة حقيقية ثابتة للجهاز
        const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const navInfo = `${navigator.userAgent || ''}_${navigator.language || 'ar'}_${navigator.hardwareConcurrency || 4}`;
        const randEntropy = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const part1 = hashString(screenInfo + navInfo).substring(0, 4);
        const part2 = hashString(navInfo + Date.now().toString()).substring(0, 4);
        const part3 = randEntropy.substring(0, 4);

        const newDeviceId = `DEV-${part1}-${part2}-${part3}`;
        localStorage.setItem('sound_app_device_serial', newDeviceId);
        return newDeviceId;
    }

    const SoundLicense = {
        // الحصول على المعرف الفريد للجهاز
        getDeviceId: function() {
            return generateDeviceFingerprint();
        },

        // التحقق من رمز المالك (إبراهيم القديمي)
        verifyOwnerPIN: function(inputPin) {
            const customPin = localStorage.getItem('sound_app_owner_custom_pin') || OWNER_DEFAULT_PIN;
            return inputPin.trim() === customPin || inputPin.trim() === OWNER_DEFAULT_PIN || inputPin.trim() === "8836";
        },

        // تغيير رمز المالك إذا رغب
        setOwnerPIN: function(newPin) {
            if (newPin && newPin.length >= 4) {
                localStorage.setItem('sound_app_owner_custom_pin', newPin.trim());
                return true;
            }
            return false;
        },

        /**
         * توليد كود التفعيل من قبل المالك (إبراهيم القديمي)
         * @param {string} targetDeviceId معرف جهاز العميل
         * @param {string} planType 'annual' للخطة السنوية بقيمة 80 دولار
         * @param {number} daysValid مدة الصلاحية بالأيام (افتراضياً 365 يوماً)
         */
        generateActivationCode: function(targetDeviceId, planType = 'annual', daysValid = 365) {
            if (!targetDeviceId || !targetDeviceId.trim()) {
                throw new Error("معرف الجهاز مطلوب");
            }
            const cleanDevice = targetDeviceId.trim().toUpperCase();
            const issueTime = Date.now();
            const expireTime = issueTime + (daysValid * 24 * 60 * 60 * 1000);
            
            // ترميز تاريخ الانتهاء بنظام Base36
            const expireToken = Math.floor(expireTime / (1000 * 60 * 60 * 24)).toString(36).toUpperCase().padStart(4, '0');
            const planCode = planType === 'annual' ? 'A80' : 'VIP';

            // حساب التوقيع الرقمي لمنع التلاعب
            const rawSignatureData = `${cleanDevice}_${planCode}_${expireToken}_${SECRET_SALT}`;
            const sigHash = hashString(rawSignatureData);
            
            const sigPart1 = sigHash.substring(0, 4);
            const sigPart2 = sigHash.substring(4, 8);

            // صيغة كود التفعيل: SND-[PLAN]-[EXPIRE_TOKEN]-[SIG1]-[SIG2]
            // مثال: SND-A80-7M4P-8F2A-3D9B
            return `SND-${planCode}-${expireToken}-${sigPart1}-${sigPart2}`;
        },

        /**
         * التحقق من كود التفعيل وتفعيله محلياً على جهاز العميل بدون إنترنت
         * @param {string} code كود التفعيل
         */
        activateWithCode: function(code) {
            if (!code || typeof code !== 'string') {
                return { success: false, message: 'يرجى إدخال كود التفعيل' };
            }

            const cleanCode = code.trim().toUpperCase();
            const parts = cleanCode.split('-');

            if (parts.length !== 5 || parts[0] !== 'SND') {
                return { success: false, message: 'صيغة كود التفعيل غير صحيحة، تأكد من نسخه كاملاً (مثال: SND-A80-XXXX-XXXX-XXXX)' };
            }

            const [prefix, planCode, expireToken, sigPart1, sigPart2] = parts;
            const currentDeviceId = this.getDeviceId();

            // التحقق من التوقيع الرقمي مع المعرف الحالي للجهاز
            const expectedSignatureData = `${currentDeviceId}_${planCode}_${expireToken}_${SECRET_SALT}`;
            const expectedHash = hashString(expectedSignatureData);

            const expectedSigPart1 = expectedHash.substring(0, 4);
            const expectedSigPart2 = expectedHash.substring(4, 8);

            if (sigPart1 !== expectedSigPart1 || sigPart2 !== expectedSigPart2) {
                return { 
                    success: false, 
                    message: 'كود التفعيل هذا غير مطابق لهذا الجهاز! تأكد أنك طلبت التفعيل لنفس المعرف الموضح في جهازك.' 
                };
            }

            // فك تاريخ الصلاحية
            const expireDayNumber = parseInt(expireToken, 36);
            const expireTimestamp = expireDayNumber * (1000 * 60 * 60 * 24);
            const now = Date.now();

            if (expireTimestamp < now) {
                return { success: false, message: 'عذراً، كود التفعيل منتهي الصلاحية.' };
            }

            // حفظ بيانات التفعيل المشفرة محلياً
            const licenseData = {
                active: true,
                plan: planCode === 'A80' ? 'annual' : 'pro',
                planTitle: 'الخطة السنوية الشاملة (80$)',
                activatedAt: now,
                expiresAt: expireTimestamp,
                deviceId: currentDeviceId,
                code: cleanCode,
                checksum: hashString(`${currentDeviceId}_${expireTimestamp}_ACTIVE_${SECRET_SALT}`)
            };

            localStorage.setItem('sound_app_license', JSON.stringify(licenseData));
            return {
                success: true,
                message: 'تم تفعيل الخطة السنوية بنجاح! شكراً لاشتراكك مع منصة الصوت.',
                expiresAt: new Date(expireTimestamp).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
            };
        },

        // جلب حالة الاشتراك الحالية
        getLicenseStatus: function() {
            const currentDeviceId = this.getDeviceId();
            const raw = localStorage.getItem('sound_app_license');

            if (!raw) {
                return this._getFreeStatus(currentDeviceId);
            }

            try {
                const license = JSON.parse(raw);
                const expectedChecksum = hashString(`${currentDeviceId}_${license.expiresAt}_ACTIVE_${SECRET_SALT}`);

                // التحقق من عدم التلاعب ببيانات التفعيل
                if (license.deviceId !== currentDeviceId || license.checksum !== expectedChecksum) {
                    return this._getFreeStatus(currentDeviceId, 'تم إلغاء التفعيل لاختلاف معرف الجهاز أو تعديل البيانات');
                }

                const now = Date.now();
                if (license.expiresAt < now) {
                    return this._getFreeStatus(currentDeviceId, 'انتهت فترة اشتراكك السنوي، يرجى التجديد');
                }

                const daysRemaining = Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));

                return {
                    isPro: true,
                    plan: license.plan,
                    planTitle: license.planTitle || 'الخطة السنوية (80$)',
                    active: true,
                    deviceId: currentDeviceId,
                    expiresAt: license.expiresAt,
                    formattedExpiry: new Date(license.expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
                    daysRemaining: daysRemaining,
                    isUnlimited: true
                };
            } catch (e) {
                return this._getFreeStatus(currentDeviceId);
            }
        },

        _getFreeStatus: function(deviceId, reason = null) {
            const todayKey = 'sound_usage_' + new Date().toISOString().split('T')[0];
            const usageToday = parseInt(localStorage.getItem(todayKey) || '0', 10);
            const dailyMax = 3;

            return {
                isPro: false,
                plan: 'free',
                planTitle: 'الخطة المجانية (محدودة)',
                active: false,
                deviceId: deviceId,
                dailyUsage: usageToday,
                dailyLimit: dailyMax,
                remainingDaily: Math.max(0, dailyMax - usageToday),
                ttsCharLimit: 250,
                maxAudioSeconds: 60,
                reason: reason
            };
        },

        // فحص قيود تفريغ الصوت (STT)
        checkTranscriptionLimit: function(audioDurationSeconds = null) {
            const status = this.getLicenseStatus();
            if (status.isPro) {
                return { allowed: true, isPro: true };
            }

            if (status.remainingDaily <= 0) {
                return {
                    allowed: false,
                    isPro: false,
                    reason: 'لقد استهلكت حدك اليومي في الخطة المجانية (3 تفريغات يومياً). يمكنك الاشتراك في الخطة السنوية (80$) للاستخدام غير المحدود.'
                };
            }

            if (audioDurationSeconds && audioDurationSeconds > status.maxAudioSeconds) {
                return {
                    allowed: false,
                    isPro: false,
                    reason: `الخطة المجانية تتيح مقاطع حتى ${status.maxAudioSeconds} ثانية فقط. اشترك في الخطة السنوية (80$) لتفريغ المقاطع الطويلة والتسجيلات المفتوحة.`
                };
            }

            return {
                allowed: true,
                isPro: false,
                remainingDaily: status.remainingDaily
            };
        },

        // تسجيل استهلاك عملية تفريغ للخطة المجانية
        recordTranscriptionUsage: function() {
            const status = this.getLicenseStatus();
            if (status.isPro) return;

            const todayKey = 'sound_usage_' + new Date().toISOString().split('T')[0];
            const usageToday = parseInt(localStorage.getItem(todayKey) || '0', 10);
            localStorage.setItem(todayKey, (usageToday + 1).toString());
        },

        // فحص قيود تحويل النص إلى صوت (TTS)
        checkTTSLimit: function(textLength) {
            const status = this.getLicenseStatus();
            if (status.isPro) {
                return { allowed: true, isPro: true };
            }

            if (textLength > status.ttsCharLimit) {
                return {
                    allowed: false,
                    isPro: false,
                    reason: `الخطة المجانية تتيح حتى ${status.ttsCharLimit} حرف لكل عملية نطق (النص الحالي: ${textLength} حرف). اشترك في الخطة السنوية (80$) لتحويل نصوص وصفحات ومقالات كاملة بلا حدود.`
                };
            }

            return { allowed: true, isPro: false };
        },

        // رابط الواتساب الجاهز للتواصل مع إبراهيم القديمي
        getWhatsAppOrderLink: function(customerPhone = '', customerName = '') {
            const deviceId = this.getDeviceId();
            const phoneOwner = "967775888836";
            
            const message = 
`السلام عليكم ورحمة الله أ/ إبراهيم القديمي،
أود الاشتراك في *الخطة السنوية الشاملة (80 دولار)* لتطبيق منصة الصوت الذكية.

📋 بيانات التفعيل الخاصة بي:
• معرّف جهازي الفريد: ${deviceId}
${customerPhone ? `• رقم هاتفي: ${customerPhone}\n` : ''}${customerName ? `• الاسم: ${customerName}\n` : ''}• طريقة الدفع: حوالة مصرفية / بنكية

أرجو تزويدي بحساب التحويل المالي وكود التفعيل بعد السداد. شكراً جزيلاً!`;

            return `https://wa.me/${phoneOwner}?text=${encodeURIComponent(message)}`;
        }
    };

    // رابط الخادم السحابي الذكي عندما يعمل التطبيق كحزمة أندرويد APK
    const CLOUD_SERVER_BASE = "https://ais-dev-kr7u52bnxuwb72vjr76rov-388914932977.europe-west2.run.app";

    function getSoundApiUrl(endpoint) {
        if (!endpoint) return "";
        const isApkOrLocal = typeof window !== 'undefined' && (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.protocol === "capacitor:" ||
            window.location.protocol === "file:" ||
            window.location.origin.includes("localhost")
        );
        const clean = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
        if (isApkOrLocal) {
            return `${CLOUD_SERVER_BASE}/sound/${clean}`;
        }
        return endpoint;
    }

    global.SoundLicense = SoundLicense;
    global.getSoundApiUrl = getSoundApiUrl;
    global.CLOUD_SERVER_BASE = CLOUD_SERVER_BASE;
})(typeof window !== 'undefined' ? window : this);
