import React from 'react'

function formatCreatedAt(device) {
  const t = device && (device.createdAt || device.timestamp)
  if (!t) return '—'
  if (t && typeof t === 'object' && (t._seconds || t._seconds === 0)) {
    try {
      const ms = Number(t._seconds) * 1000 + Math.floor((t._nanoseconds || 0) / 1e6)
      const dtFs = new Date(ms)
      if (!isNaN(dtFs.getTime())) return dtFs.toISOString()
    } catch (e) {}
  }
  const dt = new Date(t)
  if (!isNaN(dt.getTime())) return dt.toISOString()
  return String(t)
}


export default function DeviceDetails({ device, onClose }) {
  if (!device) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Device Details — {device.id}</h3>
          <button className="close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          <section>
            <h4>Summary</h4>
            <table className="summary">
              <tbody>
                <tr><th>Device</th><td>{device.deviceName || device.userAgent || '—'}</td></tr>
                <tr><th>OS</th><td>{device.osName || '—'}</td></tr>
                <tr><th>Browser</th><td>{device.browserName || '—'}</td></tr>
                <tr><th>IP</th><td className="mono">{device.clientIp || '—'}</td></tr>
                <tr><th>Location</th><td>{device.ipGeo ? `${device.ipGeo.city || ''}${device.ipGeo.city ? ', ' : ''}${device.ipGeo.country || ''}` : '—'}</td></tr>
                <tr><th>Session</th><td className="mono">{device.session?.sessionId || '—'}</td></tr>
                <tr><th>Time</th><td>{formatCreatedAt(device)}</td></tr>
              </tbody>
            </table>
          </section>

          {device.publicIP && (
            <section>
              <h4>Network Information</h4>
              <table className="summary">
                <tbody>
                  <tr><th>Public IP</th><td className="mono">{device.publicIP}</td></tr>
                  <tr><th>IP Geolocation</th><td>{device.ipGeolocation ? `${device.ipGeolocation.city || ''}, ${device.ipGeolocation.country || ''} (${device.ipGeolocation.latitude || ''}, ${device.ipGeolocation.longitude || ''})` : '—'}</td></tr>
                  <tr><th>Connection</th><td>{device.connection ? `${device.connection.effectiveType || ''} (${device.connection.downlink || ''} Mbps)` : '—'}</td></tr>
                </tbody>
              </table>
            </section>
          )}

          {device.userIdentity && (
            <section>
              <h4>User Identity</h4>
              <table className="summary">
                <tbody>
                  <tr><th>Name</th><td>{device.userIdentity.name || '—'}</td></tr>
                  <tr><th>Email</th><td>{device.userIdentity.email || '—'}</td></tr>
                  <tr><th>Phone</th><td>{device.userIdentity.phone || '—'}</td></tr>
                  <tr><th>Role</th><td>{device.userIdentity.role || '—'}</td></tr>
                  <tr><th>Preferred Language</th><td>{device.userIdentity.preferredLanguage || '—'}</td></tr>
                  <tr><th>Theme</th><td>{device.userIdentity.theme || '—'}</td></tr>
                  <tr><th>Sign Up Date</th><td>{device.userIdentity.signUpDate || '—'}</td></tr>
                  <tr><th>Last Login</th><td>{device.userIdentity.lastLogin || '—'}</td></tr>
                </tbody>
              </table>
            </section>
          )}

          {device.mediaAccess && (
            <section>
              <h4>Media Access</h4>
              <table className="summary">
                <tbody>
                  <tr><th>Microphone</th><td>{device.mediaAccess.microphone ? 'Granted' : 'Denied'}</td></tr>
                  <tr><th>Camera</th><td>{device.mediaAccess.camera ? 'Granted' : 'Denied'}</td></tr>
                </tbody>
              </table>
            </section>
          )}

          {device.pwaInfo && (
            <section>
              <h4>PWA Information</h4>
              <table className="summary">
                <tbody>
                  <tr><th>Standalone</th><td>{device.pwaInfo.isStandalone ? 'Yes' : 'No'}</td></tr>
                  <tr><th>Fullscreen</th><td>{device.pwaInfo.isFullscreen ? 'Yes' : 'No'}</td></tr>
                  <tr><th>Minimal UI</th><td>{device.pwaInfo.isMinimalUI ? 'Yes' : 'No'}</td></tr>
                </tbody>
              </table>
            </section>
          )}

          {device.localStorageData && Object.keys(device.localStorageData).length > 0 && (
            <section>
              <h4>Local Storage Data</h4>
              <pre className="json">{JSON.stringify(device.localStorageData, null, 2)}</pre>
            </section>
          )}

          {device.sessionStorageData && Object.keys(device.sessionStorageData).length > 0 && (
            <section>
              <h4>Session Storage Data</h4>
              <pre className="json">{JSON.stringify(device.sessionStorageData, null, 2)}</pre>
            </section>
          )}

          <section>
            <h4>Full JSON</h4>
            <pre className="json">{JSON.stringify(device, null, 2)}</pre>
          </section>
        </div>

        <footer>
          <button onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  )
}
