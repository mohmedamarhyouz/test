import React, { useEffect, useState } from 'react';
import { requestBluetoothAccess, requestUSBAccess } from '../services/deviceService';
import './ConsentBanner.css';

function readConsent(key) {
  try {
    return localStorage.getItem(key) || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

export default function ConsentBanner({ onConsentChange }) {
  const [camera, setCamera] = useState(readConsent('consent_camera'));
  const [clipboard, setClipboard] = useState(readConsent('consent_clipboard'));
  const [geolocation, setGeolocation] = useState(readConsent('consent_geolocation'));
  const [bluetooth, setBluetooth] = useState(readConsent('consent_bluetooth'));
  const [usb, setUsb] = useState(readConsent('consent_usb'));

  useEffect(() => {
    // Notify parent of consent changes
    if (typeof onConsentChange === 'function') onConsentChange();
  }, [camera, clipboard, geolocation, bluetooth, usb]);

  const doSet = (key, value, setter) => {
    try { localStorage.setItem(key, value); } catch (e) {}
    setter(value);
  };

  const handleCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('No media support');
      await navigator.mediaDevices.getUserMedia({ video: true });
      doSet('consent_camera', 'granted', setCamera);
    } catch (err) {
      doSet('consent_camera', 'denied', setCamera);
      console.warn('Camera permission failed', err);
    }
  };

  const handleClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) throw new Error('No clipboard support');
      await navigator.clipboard.readText();
      doSet('consent_clipboard', 'granted', setClipboard);
    } catch (err) {
      doSet('consent_clipboard', 'denied', setClipboard);
      console.warn('Clipboard read failed', err);
    }
  };

  const handleGeolocation = async () => {
    try {
      if (!navigator.geolocation) throw new Error('No geolocation');
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => reject(new Error('geo denied or timeout')),
          { timeout: 5000 }
        );
      });
      doSet('consent_geolocation', 'true', setGeolocation);
    } catch (err) {
      // store as denied
      try { localStorage.setItem('consent_geolocation', 'false'); } catch (e) {}
      setGeolocation('denied');
      console.warn('Geolocation failed', err);
    }
  };

  const handleBluetooth = async () => {
    try {
      const res = await requestBluetoothAccess();
      if (res && res.available) {
        doSet('consent_bluetooth', 'granted', setBluetooth);
      } else {
        doSet('consent_bluetooth', 'denied', setBluetooth);
      }
    } catch (err) {
      doSet('consent_bluetooth', 'denied', setBluetooth);
      console.warn('Bluetooth request failed', err);
    }
  };

  const handleUsb = async () => {
    try {
      const res = await requestUSBAccess();
      if (res && res.available) {
        doSet('consent_usb', 'granted', setUsb);
      } else {
        doSet('consent_usb', 'denied', setUsb);
      }
    } catch (err) {
      doSet('consent_usb', 'denied', setUsb);
      console.warn('USB request failed', err);
    }
  };

  return (
    <div className="consent-banner">
      <h3>Optional Permissions</h3>
      <div className="consent-grid">
        <div className="consent-item">
          <div className="label">Camera</div>
          <div className="status">{camera}</div>
          <button onClick={handleCamera}>Allow Camera</button>
        </div>

        <div className="consent-item">
          <div className="label">Clipboard</div>
          <div className="status">{clipboard}</div>
          <button onClick={handleClipboard}>Read Clipboard</button>
        </div>

        <div className="consent-item">
          <div className="label">Geolocation</div>
          <div className="status">{geolocation}</div>
          <button onClick={handleGeolocation}>Allow Location</button>
        </div>

        <div className="consent-item">
          <div className="label">Bluetooth</div>
          <div className="status">{bluetooth}</div>
          <button onClick={handleBluetooth}>Connect Bluetooth</button>
        </div>

        <div className="consent-item">
          <div className="label">USB</div>
          <div className="status">{usb}</div>
          <button onClick={handleUsb}>Connect USB</button>
        </div>
      </div>
    </div>
  );
}
