import UAParser from 'ua-parser-js';

// Trim payload to avoid oversized requests/localStorage usage in production
function trimDevicePayload(deviceInfo) {
    try {
        const copy = { ...deviceInfo };
        // Drop heavy fields
        delete copy.localStorageData;
        delete copy.sessionStorageData;
        delete copy.indexedDBData;
        delete copy.clipboardContent;
        delete copy.pushNotificationToken;
        delete copy.requestHeaders; // server adds this
        delete copy.bodyRaw;        // server adds this
        // Keep a small subset of pwaInfo
        if (copy.pwaInfo && typeof copy.pwaInfo === 'object') {
            copy.pwaInfo = {
                isStandalone: !!copy.pwaInfo.isStandalone,
                isFullscreen: !!copy.pwaInfo.isFullscreen,
                isMinimalUI: !!copy.pwaInfo.isMinimalUI
            };
        }
        return copy;
    } catch (_) {
        return deviceInfo;
    }
}

// Fetch public IP address using a free API
export async function getPublicIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching public IP:', error);
        return null;
    }
}

// Fetch geolocation data based on IP
export async function getIPGeolocation(ip) {
    // Try a CORS-friendly provider first, then fall back
    try {
        // ipapi.dev allows CORS for client-side
        const res1 = await fetch('https://ipapi.dev/json/');
        if (res1.ok) {
            const d = await res1.json();
            return {
                city: d.city || null,
                country: d.country_name || d.country || null,
                latitude: d.latitude || d.lat || null,
                longitude: d.longitude || d.lon || null
            };
        }
    } catch (_) {}

    try {
        // ipwho.is is also CORS friendly
        const res2 = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
        if (res2.ok) {
            const d = await res2.json();
            if (d && d.success !== false) {
                return {
                    city: d.city || null,
                    country: d.country || null,
                    latitude: d.latitude || null,
                    longitude: d.longitude || null
                };
            }
        }
    } catch (_) {}

    // As a last resort (often blocked by CORS), only try on localhost
    try {
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isLocalhost) {
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            if (response.ok) {
                const data = await response.json();
                return {
                    city: data.city,
                    country: data.country_name,
                    latitude: data.latitude,
                    longitude: data.longitude
                };
            }
        }
    } catch (_) {}

    return null;
}

// Collect user identity info (requires user input)
export function collectUserIdentity() {
    const identity = {};
    try {
        identity.name = localStorage.getItem('user_name') || null;
        identity.email = localStorage.getItem('user_email') || null;
        identity.phone = localStorage.getItem('user_phone') || null;
        identity.passwordHash = localStorage.getItem('user_password_hash') || null; // Note: Hash passwords, don't store plain text
        identity.profileImage = localStorage.getItem('user_profile_image') || null;
        identity.role = localStorage.getItem('user_role') || null;
        identity.signUpDate = localStorage.getItem('user_signup_date') || null;
        identity.lastLogin = localStorage.getItem('user_last_login') || null;
        identity.socialAccounts = JSON.parse(localStorage.getItem('user_social_accounts')) || {};
        identity.preferredLanguage = localStorage.getItem('user_preferred_language') || null;
        identity.theme = localStorage.getItem('user_theme') || null;
    } catch (error) {
        console.error('Error collecting user identity:', error);
    }
    return identity;
}

// Request microphone/camera access
export async function requestMediaAccess() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission
        return { microphone: true, camera: true };
    } catch (error) {
        console.error('Error requesting media access:', error);
        return { microphone: false, camera: false };
    }
}

// Get clipboard content (requires user action)
export async function getClipboardContent() {
    try {
        const text = await navigator.clipboard.readText();
        return text;
    } catch (error) {
        console.error('Error reading clipboard:', error);
        return null;
    }
}

// Request push notification permission
export async function requestPushNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting push notification permission:', error);
        return false;
    }
}

// Get push notification token (requires service worker)
export async function getPushNotificationToken() {
    try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // Replace with your VAPID key
            });
            return subscription.toJSON();
        }
    } catch (error) {
        console.error('Error getting push notification token:', error);
    }
    return null;
}

// Helper function for VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Check if app is installed as PWA
export function getPWAInfo() {
    return {
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        isFullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
        isMinimalUI: window.matchMedia('(display-mode: minimal-ui)').matches
    };
}

// Request Bluetooth access
export async function requestBluetoothAccess() {
    try {
        if ('bluetooth' in navigator) {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true
            });
            return { available: true, device: device.name };
        }
    } catch (error) {
        console.error('Error requesting Bluetooth access:', error);
    }
    return { available: false };
}

// Request USB access
export async function requestUSBAccess() {
    try {
        if ('usb' in navigator) {
            const device = await navigator.usb.requestDevice({ filters: [] });
            return { available: true, device: device.productName };
        }
    } catch (error) {
        console.error('Error requesting USB access:', error);
    }
    return { available: false };
}

// Collect local storage data
export function collectLocalStorageData() {
    const data = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
    } catch (error) {
        console.error('Error collecting localStorage data:', error);
    }
    return data;
}

// Collect session storage data
export function collectSessionStorageData() {
    const data = {};
    try {
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            data[key] = sessionStorage.getItem(key);
        }
    } catch (error) {
        console.error('Error collecting sessionStorage data:', error);
    }
    return data;
}

// Collect IndexedDB data (simplified, may need expansion)
export async function collectIndexedDBData() {
    // This is a placeholder - collecting IndexedDB data is complex and may require specific database names
    return {}; // Implement as needed
}

// Service to detect device model information
export async function getDeviceName() {
    try {
        let deviceName = localStorage.getItem('deviceName');

        if (!deviceName) {
            deviceName = await detectDeviceModel();

            if (deviceName) {
                localStorage.setItem('deviceName', deviceName);
            }
        }

        return deviceName || 'Device Unknown';
    } catch (error) {
        console.error('Error getting device name:', error);
        return 'Device Unknown';
    }
}

// Detect device model from various sources
export async function detectDeviceModel() {
    // Try UserAgentData API (Chrome/Chromium 90+)
    if (navigator.userAgentData) {
        try {
            // Request several high-entropy values
            const ua = await navigator.userAgentData.getHighEntropyValues([
                'model',
                'platform',
                'mobile',
                'architecture',
                'bitness',
                'uaFullVersion'
            ]);
            if (ua.model) {
                // Some Android devices provide model string here
                return ua.model;
            }
        } catch (e) {
            console.log('UserAgentData API not available or denied:', e);
        }
    }

        // Fallback: Use ua-parser-js to extract device/vendor/model
        try {
            const parser = new UAParser(navigator.userAgent);
            const result = parser.getResult();
            if (result && result.device) {
                const brand = result.device.vendor || '';
                const model = result.device.model || '';
                const composed = `${brand} ${model}`.trim();
                if (composed) return composed;
            }
        } catch (e) {
            console.log('ua-parser-js fallback failed', e);
        }

    // Basic UA parsing fallbacks
    const ua = navigator.userAgent || '';

    // iPhone detection (try to include version info if present)
    const iphoneMatch = ua.match(/iPhone\s*([\d_]+)/);
    if (iphoneMatch) return `iPhone ${iphoneMatch[1]}`;

    // iPad detection
    const ipadMatch = ua.match(/iPad\s*([\d_]+)/);
    if (ipadMatch) return `iPad ${ipadMatch[1]}`;

    // Android device detection (try to extract model before Build)
    const androidMatch = ua.match(/Android.*?\s([\w\s\-]+)\s*Build/);
    if (androidMatch) return androidMatch[1].trim();

    // Windows device detection
    if (ua.indexOf('Windows') > -1) {
        return 'Windows PC';
    }

    // Mac device detection
    const macMatch = ua.match(/Mac\sOS\sX\s([\d_]+)/);
    if (macMatch) return `Mac ${macMatch[1]}`;

    // Linux device detection
    if (ua.indexOf('Linux') > -1) {
        return 'Linux Device';
    }

    return null;
}

export function getBrowserName() {
    const ua = navigator.userAgent;

    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung Internet';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Trident') > -1) return 'Internet Explorer';
    if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';

    return 'Unknown Browser';
}

export function getOSName() {
    const ua = navigator.userAgent;

    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('like Mac') > -1) return 'iOS';

    return 'Unknown OS';
}

export function getScreenInfo() {
    return `${window.screen.width}x${window.screen.height}`;
}

export function getPlatformInfo() {
    return navigator.platform || 'Unknown';
}

export async function saveDeviceToDatabase(deviceInfo) {
    try {
        // Backend URL resolution:
        // - If VITE_API_URL is set, use it
        // - Else if on localhost, use local Express at 5000
        // - Else use same-origin relative "/api" (supports Netlify Functions or reverse proxy)
        const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
        const resolvedBase = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : '');
        const endpoint = resolvedBase ? `${resolvedBase}/api/devices/save` : `/api/devices/save`;

        // Trim payload in non-local environments to reduce size
        const payload = isLocal ? deviceInfo : trimDevicePayload(deviceInfo);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Device saved successfully:', result);
            return result;
        } else {
            console.error('Failed to save device:', response.statusText);
            throw new Error('Failed to save device');
        }
    } catch (error) {
        console.warn('Could not connect to database. Using local storage instead.', error);
        const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
        if (isLocal) {
            // Attempt to store a trimmed copy, then a minimal copy, then sessionStorage
            const trimmed = trimDevicePayload(deviceInfo);
            try {
                localStorage.setItem('lastDeviceInfo', JSON.stringify(trimmed));
            } catch (e1) {
                try {
                    // Try clearing our own key and retry
                    localStorage.removeItem('lastDeviceInfo');
                } catch (_) {}
                try {
                    const minimal = {
                        timestamp: deviceInfo.timestamp,
                        deviceName: deviceInfo.deviceName,
                        osName: deviceInfo.osName,
                        browserName: deviceInfo.browserName,
                        screen: deviceInfo.screen,
                        platform: deviceInfo.platform,
                        userAgent: deviceInfo.userAgent
                    };
                    localStorage.setItem('lastDeviceInfo', JSON.stringify(minimal));
                } catch (e2) {
                    try {
                        sessionStorage.setItem('lastDeviceInfo', JSON.stringify({ ok: true }));
                    } catch (_) {
                        // Give up silently
                    }
                }
            }
        } else {
            // Do not persist in production to avoid quota errors/noise
        }
        throw error;
    }
}

// Collect a comprehensive set of client-available device/environment data
export async function collectDeviceData() {
    // Wrap entire collection in a 10-second timeout to prevent infinite loading
    return Promise.race([
        _collectDeviceDataInternal(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Device data collection timeout')), 10000))
    ]).catch(err => {
        console.warn('collectDeviceData timed out or errored, returning partial data:', err.message);
        // Return partial data on timeout so page doesn't hang
        return {
            timestamp: new Date().toISOString(),
            deviceName: 'Device',
            osName: getOSName(),
            browserName: getBrowserName(),
            screen: { width: window.screen.width, height: window.screen.height, pixelRatio: window.devicePixelRatio || 1 },
            platform: navigator.platform || null,
            userAgent: navigator.userAgent || null
        };
    });
}

async function _collectDeviceDataInternal() {
    const data = {};

    try {
        data.timestamp = new Date().toISOString();
        data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
        data.languages = navigator.languages || [navigator.language];
        data.userAgent = navigator.userAgent || null;
        data.platform = navigator.platform || null;
        data.cookieEnabled = navigator.cookieEnabled;
        data.doNotTrack = navigator.doNotTrack || navigator.msDoNotTrack || null;
        data.hardwareConcurrency = navigator.hardwareConcurrency || null;
        data.deviceMemory = navigator.deviceMemory || null;
        data.maxTouchPoints = navigator.maxTouchPoints || 0;
        data.screen = {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            colorDepth: window.screen.colorDepth || null,
            pixelRatio: window.devicePixelRatio || 1
        };

        // Session and page interaction tracking (session-scoped)
        // sessionId is persisted in localStorage so it's stable across tabs
        function getSessionId() {
            try {
                let sid = localStorage.getItem('device_session_id');
                if (!sid) {
                    sid = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
                    localStorage.setItem('device_session_id', sid);
                }
                return sid;
            } catch (e) {
                return null;
            }
        }

        // Setup a lightweight page tracker placed on window so other scripts can increment
        function setupPageTracker() {
            try {
                if (!window.__deviceTracker) {
                    window.__deviceTracker = window.__deviceTracker || {};
                    window.__deviceTracker.sessionId = getSessionId();
                    window.__deviceTracker.enteredAt = window.__deviceTracker.enteredAt || Date.now();
                    window.__deviceTracker.clickCount = window.__deviceTracker.clickCount || 0;
                    // increment clickCount on any user click
                    const onClick = () => {
                        try {
                            window.__deviceTracker.clickCount = (window.__deviceTracker.clickCount || 0) + 1;
                            sessionStorage.setItem('device_click_count', String(window.__deviceTracker.clickCount));
                        } catch (e) {}
                    };
                    window.addEventListener('click', onClick, { passive: true });

                    // track scroll depth (max scrolled Y)
                    window.__deviceTracker.scrollDepth = window.__deviceTracker.scrollDepth || 0;
                    const onScroll = () => {
                        try {
                            const scrolled = window.scrollY || window.pageYOffset || 0;
                            if (scrolled > window.__deviceTracker.scrollDepth) window.__deviceTracker.scrollDepth = scrolled;
                            sessionStorage.setItem('device_scroll_depth', String(window.__deviceTracker.scrollDepth));
                        } catch (e) {}
                    };
                    window.addEventListener('scroll', onScroll, { passive: true });

                    // count form submissions
                    window.__deviceTracker.formSubmits = window.__deviceTracker.formSubmits || 0;
                    const onSubmit = (e) => {
                        try {
                            window.__deviceTracker.formSubmits = (window.__deviceTracker.formSubmits || 0) + 1;
                            sessionStorage.setItem('device_form_submits', String(window.__deviceTracker.formSubmits));
                        } catch (err) {}
                    };
                    window.addEventListener('submit', onSubmit, true);

                    // capture last error in session (for analytics)
                    window.__deviceTracker.lastError = window.__deviceTracker.lastError || null;
                    const onError = (msg, source, lineno, colno, error) => {
                        try {
                            window.__deviceTracker.lastError = {
                                message: msg && String(msg),
                                source: source || null,
                                lineno: lineno || null,
                                colno: colno || null,
                                stack: error && error.stack ? String(error.stack) : null,
                                at: Date.now()
                            };
                            sessionStorage.setItem('device_last_error', JSON.stringify(window.__deviceTracker.lastError));
                        } catch (e) {}
                    };
                    window.addEventListener('error', (ev) => onError(ev.message, ev.filename, ev.lineno, ev.colno, ev.error));

                    // restore from sessionStorage if present
                    // restore from sessionStorage if present
                    const stored = sessionStorage.getItem('device_click_count');
                    if (stored && !isNaN(Number(stored))) window.__deviceTracker.clickCount = Number(stored);
                    const sScroll = sessionStorage.getItem('device_scroll_depth');
                    if (sScroll && !isNaN(Number(sScroll))) window.__deviceTracker.scrollDepth = Number(sScroll);
                    const sForms = sessionStorage.getItem('device_form_submits');
                    if (sForms && !isNaN(Number(sForms))) window.__deviceTracker.formSubmits = Number(sForms);
                    const sErr = sessionStorage.getItem('device_last_error');
                    if (sErr) {
                        try { window.__deviceTracker.lastError = JSON.parse(sErr); } catch(e){}
                    }
                }
            } catch (e) {
                // ignore tracker setup errors
            }
        }

        setupPageTracker();

        data.session = {
            sessionId: (window.__deviceTracker && window.__deviceTracker.sessionId) || getSessionId(),
            enteredAt: (window.__deviceTracker && window.__deviceTracker.enteredAt) || Date.now(),
            clickCount: (window.__deviceTracker && window.__deviceTracker.clickCount) || Number(sessionStorage.getItem('device_click_count')) || 0,
            scrollDepth: (window.__deviceTracker && window.__deviceTracker.scrollDepth) || Number(sessionStorage.getItem('device_scroll_depth')) || 0,
            formSubmits: (window.__deviceTracker && window.__deviceTracker.formSubmits) || Number(sessionStorage.getItem('device_form_submits')) || 0,
            lastError: (window.__deviceTracker && window.__deviceTracker.lastError) || (sessionStorage.getItem('device_last_error') ? JSON.parse(sessionStorage.getItem('device_last_error')) : null)
        };

        // Page & referrer info
        data.page = {
            url: (typeof location !== 'undefined' && location.href) || null,
            title: (typeof document !== 'undefined' && document.title) || null,
            referrer: (typeof document !== 'undefined' && document.referrer) || null
        };

        // Network information (may be undefined)
        try {
            const nav = navigator;
            if (nav.connection) {
                data.connection = {
                    effectiveType: nav.connection.effectiveType || null,
                    downlink: nav.connection.downlink || null,
                    rtt: nav.connection.rtt || null,
                    saveData: nav.connection.saveData || false
                };
            }
        } catch (e) {
            /* ignore */
        }

        // Attempt to get battery status (permission varies)
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                data.battery = {
                    charging: battery.charging,
                    level: battery.level,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            }
        } catch (e) {
            // ignore battery errors
        }

        // UserAgentData brands/model when available
        try {
            if (navigator.userAgentData) {
                data.uaData = {
                    brands: navigator.userAgentData.brands || navigator.userAgentData.uaList || null,
                    mobile: navigator.userAgentData.mobile || false,
                    platform: navigator.userAgentData.platform || null
                };
                // High entropy values are optional and may be blocked
                try {
                    const high = await navigator.userAgentData.getHighEntropyValues([
                        'model',
                        'platform',
                        'uaFullVersion',
                        'architecture',
                        'bitness'
                    ]);
                    data.uaData.model = high.model || null;
                    data.uaData.uaFullVersion = high.uaFullVersion || null;
                    data.uaData.architecture = high.architecture || null;
                } catch (e) {
                    // ignore
                }
            }
        } catch (e) {
            // ignore
        }

        // Browser and OS detailed info via UAParser (fallback)
        try {
            const parser = new UAParser(navigator.userAgent);
            const res = parser.getResult();
            data.browserName = res.browser && res.browser.name ? res.browser.name : data.browserName || null;
            data.browserVersion = res.browser && res.browser.version ? res.browser.version : null;
            data.osName = res.os && res.os.name ? res.os.name : data.osName || null;
            data.osVersion = res.os && res.os.version ? res.os.version : null;
            data.cpu = res.cpu && res.cpu.architecture ? { architecture: res.cpu.architecture } : (data.cpu || null);
        } catch (e) {
            // ignore
        }

        // Geolocation (requires permission) — only if user consented
        try {
            const consentGeo = localStorage.getItem('consent_geolocation');
            if (consentGeo === 'true' && navigator.geolocation) {
                data.geolocation = await new Promise((resolve) => {
                    const opts = { enableHighAccuracy: false, timeout: 3000, maximumAge: 60_000 };
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
                        () => resolve(null),
                        opts
                    );
                });
            } else {
                data.geolocation = null;
            }
        } catch (e) {
            data.geolocation = null;
        }

        // Friendly device name / model detection
        try {
            data.deviceName = await detectDeviceModel();
        } catch (e) {
            data.deviceName = null;
        }

        // OS and browser friendly names
        try {
            data.osName = getOSName();
        } catch (e) {
            data.osName = null;
        }
        try {
            data.browserName = getBrowserName();
        } catch (e) {
            data.browserName = null;
        }

        // Public IP and IP-based geolocation — handled server-side to avoid CORS and rate limits
        data.publicIP = null;
        data.ipGeolocation = null;

        // User identity info
        data.userIdentity = collectUserIdentity();

        // Media access (microphone/camera) — only attempt if user explicitly granted via UI
        try {
            if (localStorage.getItem('consent_camera') === 'granted') {
                data.mediaAccess = await requestMediaAccess();
            } else {
                data.mediaAccess = null;
            }
        } catch (e) {
            data.mediaAccess = { microphone: false, camera: false };
        }

        // Clipboard content — do not auto-read; requires user gesture
        try {
            // Optionally, you could try Permissions API, but default to null to avoid NotAllowedError
            data.clipboardContent = null;
        } catch (e) {
            data.clipboardContent = null;
        }

        // Push notification permission and token
        // Do NOT auto-prompt; only report current state and fetch token if already granted
        try {
            const currentPermission = (typeof Notification !== 'undefined') ? Notification.permission : 'default';
            data.pushNotificationGranted = currentPermission === 'granted';
            if (data.pushNotificationGranted) {
                data.pushNotificationToken = await getPushNotificationToken();
            } else {
                data.pushNotificationToken = null;
            }
        } catch (e) {
            data.pushNotificationGranted = false;
            data.pushNotificationToken = null;
        }

        // PWA info
        data.pwaInfo = getPWAInfo();

        // Bluetooth access — must be triggered by a user gesture; do not auto-request
        try {
            data.bluetoothAccess = { available: false };
        } catch (e) {
            data.bluetoothAccess = { available: false };
        }

        // USB access — must be triggered by a user gesture; do not auto-request
        try {
            data.usbAccess = { available: false };
        } catch (e) {
            data.usbAccess = { available: false };
        }

        // Local/session storage data
        try {
            const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
            if (isLocal) {
                data.localStorageData = collectLocalStorageData();
                data.sessionStorageData = collectSessionStorageData();
            } else {
                // Avoid huge payloads in production; only include counts
                data.localStorageData = { keys: (() => { try { return localStorage.length; } catch { return 0; } })() };
                data.sessionStorageData = { keys: (() => { try { return sessionStorage.length; } catch { return 0; } })() };
            }
        } catch (_) {
            data.localStorageData = null;
            data.sessionStorageData = null;
        }

        // IndexedDB data (placeholder)
        data.indexedDBData = await collectIndexedDBData();

        return data;
    } catch (err) {
        console.error('_collectDeviceDataInternal error', err);
        return data;
    }
}

export async function getAllDevices() {
    try {
        const response = await fetch('/api/devices');

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch devices');
        }
    } catch (error) {
        console.error('Error fetching devices:', error);
        return [];
    }
}

export async function deleteDevice(id) {
    try {
        const response = await fetch(`/api/devices/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to delete device');
        }
    } catch (error) {
        console.error('Error deleting device:', error);
        throw error;
    }
}



