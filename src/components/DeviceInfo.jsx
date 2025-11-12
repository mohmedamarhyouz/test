import React, { useState, useEffect, useRef } from 'react';
import {
    collectDeviceData,
    saveDeviceToDatabase
} from '../services/deviceService';
import './DeviceInfo.css';
import ConsentBanner from './ConsentBanner';

function DeviceInfo() {
    const [deviceInfo, setDeviceInfo] = useState({
        deviceName: 'Loading...',
        osName: 'Detecting...',
        browserName: 'Detecting...',
        screenResolution: 'Detecting...',
        platformInfo: 'Detecting...'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState('');

    const savingRef = useRef(false);
    const lastSaveRef = useRef(0);
    const savedOnceRef = useRef(false);
    // restore saved-once from session
    try {
        const prev = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('savedOnce') : null;
        if (prev === 'true') savedOnceRef.current = true;
    } catch {}
    const lastSigRef = useRef(typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('lastSavedSignature') || '') : '');
    const lastSigAtRef = useRef(typeof sessionStorage !== 'undefined' ? parseInt(sessionStorage.getItem('lastSavedAt') || '0', 10) : 0);

    const buildSignature = (d) => {
        try {
            // Only stable fields; exclude timestamp and dynamic permissions
            const sigObj = {
                deviceName: d.deviceName,
                osName: d.osName,
                browserName: d.browserName,
                screen: d.screen,
                platform: d.platform,
                userAgent: d.userAgent
            };
            return JSON.stringify(sigObj);
        } catch {
            return '';
        }
    };

    const initializeDeviceInfo = async (forceSave = false) => {
        if (savingRef.current) return; // prevent concurrent runs
        // allow only one auto-save per session unless forced
        if (!forceSave && savedOnceRef.current) return;
        try {
            savingRef.current = true;
            setLoading(true);
            setError(null);

            // Collect extended device data from client
            const deviceData = await collectDeviceData();

            // Update state with a few friendly fields for UI
            setDeviceInfo({
                deviceName: deviceData.deviceName || 'Unknown',
                osName: deviceData.osName || 'Unknown',
                browserName: deviceData.browserName || 'Unknown',
                screenResolution: deviceData.screen ? `${deviceData.screen.width}x${deviceData.screen.height}` : 'Unknown',
                platformInfo: deviceData.platform || 'Unknown'
            });

            // Save to database (skip if unchanged within 60s)
            const now = Date.now();
            if (now - lastSaveRef.current < 5000) {
                // throttle saves to at most once per 5s
                setLoading(false);
                savingRef.current = false;
                return;
            }
            const signature = buildSignature(deviceData);
            if (signature && signature === lastSigRef.current && (now - lastSigAtRef.current) < 60000) {
                setLoading(false);
                savingRef.current = false;
                return;
            }
            setSaveStatus('Saving to database...');
            try {
                await saveDeviceToDatabase(deviceData);
                setSaveStatus('✅ Saved to Firebase Firestore');
                setTimeout(() => setSaveStatus(''), 3000);
                lastSaveRef.current = Date.now();
                savedOnceRef.current = true;
                try { sessionStorage.setItem('savedOnce', 'true'); } catch {}
                lastSigRef.current = signature;
                lastSigAtRef.current = lastSaveRef.current;
                try {
                    sessionStorage.setItem('lastSavedSignature', signature || '');
                    sessionStorage.setItem('lastSavedAt', String(lastSigAtRef.current));
                } catch {}
            } catch (dbError) {
                setSaveStatus('⚠ Saved to local storage (database unavailable)');
                console.error('Database save error:', dbError);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error initializing device info:', err);
            setError('Failed to detect device information');
            setLoading(false);
        } finally {
            savingRef.current = false;
        }
    };

    const handleConsentChange = () => {
        // Debounce re-collection to avoid rapid duplicate saves in dev
        if (!handleConsentChange._tRef) handleConsentChange._tRef = null;
        if (handleConsentChange._tRef) clearTimeout(handleConsentChange._tRef);
        handleConsentChange._tRef = setTimeout(() => initializeDeviceInfo(true), 300);
    };

    const initRef = useRef(false);
    useEffect(() => {
        // Guard against React 18 StrictMode double-invocation in dev
        if (initRef.current) return;
        initRef.current = true;
        initializeDeviceInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div className="container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Detecting your device...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Your Device Information</h1>

            {error && <div className="error-message">{error}</div>}

            <ConsentBanner onConsentChange={handleConsentChange} />

            <div className="info-section">
                <div className="info-label">Device Name</div>
                <div className="device-name">{deviceInfo.deviceName}</div>
            </div>

            {saveStatus && <div className="save-status">{saveStatus}</div>}

            <div className="device-info">
                <div className="info-item">
                    <label>Operating System:</label>
                    <span className="value">{deviceInfo.osName}</span>
                </div>
                <div className="info-item">
                    <label>Browser:</label>
                    <span className="value">{deviceInfo.browserName}</span>
                </div>
                <div className="info-item">
                    <label>Screen Resolution:</label>
                    <span className="value">{deviceInfo.screenResolution}</span>
                </div>
                <div className="info-item">
                    <label>Platform:</label>
                    <span className="value">{deviceInfo.platformInfo}</span>
                </div>
            </div>

            <button className="refresh-btn" onClick={() => initializeDeviceInfo(true)}>
                Refresh Information
            </button>
        </div>
    );
}

export default DeviceInfo;
