import React, { useState, useEffect } from 'react';
import {
    collectDeviceData,
    saveDeviceToDatabase
} from '../services/deviceService';
import './DeviceInfo.css';

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

    useEffect(() => {
        initializeDeviceInfo();
    }, []);

    const initializeDeviceInfo = async () => {
        try {
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

            // Save to database
            setSaveStatus('Saving to database...');
            try {
                await saveDeviceToDatabase(deviceData);
                setSaveStatus('✓ Saved to Firebase Firestore');
                setTimeout(() => setSaveStatus(''), 3000);
            } catch (dbError) {
                setSaveStatus('⚠ Saved to local storage (database unavailable)');
                console.error('Database save error:', dbError);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error initializing device info:', err);
            setError('Failed to detect device information');
            setLoading(false);
        }
    };

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
            <h1>📱 Your Device Information</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="info-section">
                <div className="info-label">Device Name</div>
                <div className="device-name">{deviceInfo.deviceName}</div>
            </div>

            {saveStatus && <div className="save-status">{saveStatus}</div>}

            <div className="device-info">
                <div className="info-item">
                    <label>Operating System:</label>
                    <value>{deviceInfo.osName}</value>
                </div>
                <div className="info-item">
                    <label>Browser:</label>
                    <value>{deviceInfo.browserName}</value>
                </div>
                <div className="info-item">
                    <label>Screen Resolution:</label>
                    <value>{deviceInfo.screenResolution}</value>
                </div>
                <div className="info-item">
                    <label>Platform:</label>
                    <value>{deviceInfo.platformInfo}</value>
                </div>
            </div>

            <button className="refresh-btn" onClick={initializeDeviceInfo}>
                🔄 Refresh Information
            </button>
        </div>
    );
}

export default DeviceInfo;
