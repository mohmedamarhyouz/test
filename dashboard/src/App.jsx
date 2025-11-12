import React, { useEffect, useState } from 'react'
import DeviceDetails from './DeviceDetails'

export default function App() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  async function fetchDevices() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/devices')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setDevices(data || [])
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    const id = setInterval(fetchDevices, 10_000) // refresh every 10s
    return () => clearInterval(id)
  }, [])

  // Safe formatter for timestamps coming from the backend which may be
  // ISO strings, numeric epochs, or missing/invalid values.
  function formatTimestamp(record) {
    const t = record && (record.createdAt || record.timestamp)
    if (!t) return '—'

    // Firestore Timestamp object (serverTimestamp) -> { _seconds, _nanoseconds }
    if (t && typeof t === 'object' && (t._seconds || t._seconds === 0)) {
      try {
        const ms = Number(t._seconds) * 1000 + Math.floor((t._nanoseconds || 0) / 1e6)
        const dtFs = new Date(ms)
        if (!isNaN(dtFs.getTime())) return dtFs.toISOString()
      } catch (e) {}
    }

    // Try Date constructor (handles ISO strings and numeric values)
    const dt = new Date(t)
    if (!isNaN(dt.getTime())) return dt.toISOString()

    // If it's a numeric string, try converting
    const n = Number(t)
    if (!isNaN(n)) {
      const dt2 = new Date(n)
      if (!isNaN(dt2.getTime())) return dt2.toISOString()
    }

    // Fallback to showing raw value
    return String(t)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this device record?')) return
    try {
      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await fetchDevices()
    } catch (err) {
      alert('Delete error: ' + (err.message || err))
    }
  }

  return (
    <div className="wrap">
      <header>
        <h1>Device Dashboard</h1>
        <p>Shows device records saved to your Firestore database.</p>
      </header>

      {loading && <div className="status">Loading...</div>}
      {error && <div className="status error">Error: {error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Device</th>
                <th>OS</th>
                <th>Browser</th>
                <th>IP</th>
                <th>Time (UTC)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>No records</td>
                </tr>
              )}

              {devices.map((d) => (
                <tr key={d.id}>
                  <td className="id">{d.id}</td>
                  <td className="mono">{d.deviceName || d.userAgent || '—'}</td>
                  <td>{d.osName || '—'}</td>
                  <td>{d.browserName || '—'}</td>
                  <td className="mono">{d.clientIp || '—'}</td>
                  <td>{formatTimestamp(d)}</td>
                  <td>
                    <button onClick={() => setSelected(d)}>View</button>
                    <button className="btn-danger" onClick={() => handleDelete(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer>
        <small>Refresh interval: 10s • Backend: http://localhost:5000</small>
      </footer>
      {selected && <DeviceDetails device={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
import React, { useEffect, useState } from 'react'
import DeviceDetails from './DeviceDetails'

const API_BASE = import.meta.env.VITE_API_URL || ''
const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path)

export default function App() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  async function fetchDevices() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/devices'))
      if (!res.ok) throw new Error(`Failed to fetch (HTTP ${res.status})`)
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('application/json')) {
        const text = await res.text()
        throw new Error(`Expected JSON but got: ${text.slice(0,120)}`)
      }
      const data = await res.json()
      setDevices(data || [])
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    const id = setInterval(fetchDevices, 10_000)
    return () => clearInterval(id)
  }, [])

  function formatTimestamp(record) {
    const t = record && (record.createdAt || record.timestamp)
    if (!t) return '-'

    if (t && typeof t === 'object' && (t._seconds || t._seconds === 0)) {
      try {
        const ms = Number(t._seconds) * 1000 + Math.floor((t._nanoseconds || 0) / 1e6)
        const dtFs = new Date(ms)
        if (!isNaN(dtFs.getTime())) return dtFs.toISOString()
      } catch (e) {}
    }

    const dt = new Date(t)
    if (!isNaN(dt.getTime())) return dt.toISOString()

    const n = Number(t)
    if (!isNaN(n)) {
      const dt2 = new Date(n)
      if (!isNaN(dt2.getTime())) return dt2.toISOString()
    }
    return String(t)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this device record?')) return
    try {
      const res = await fetch(apiUrl(`/api/devices/${id}`), { method: 'DELETE' })
      if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status})`)
      await fetchDevices()
    } catch (err) {
      alert('Delete error: ' + (err.message || err))
    }
  }

  return (
    <div className="wrap">
      <header>
        <h1>Device Dashboard</h1>
        <p>Shows device records saved to your Firestore database.</p>
      </header>

      {loading && <div className="status">Loading...</div>}
      {error && <div className="status error">Error: {error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Device</th>
                <th>OS</th>
                <th>Browser</th>
                <th>IP</th>
                <th>Time (UTC)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>No records</td>
                </tr>
              )}

              {devices.map((d) => (
                <tr key={d.id}>
                  <td className="id">{d.id}</td>
                  <td className="mono">{d.deviceName || d.userAgent || '-'}</td>
                  <td>{d.osName || '-'}</td>
                  <td>{d.browserName || '-'}</td>
                  <td className="mono">{d.clientIp || '-'}</td>
                  <td>{formatTimestamp(d)}</td>
                  <td>
                    <button onClick={() => setSelected(d)}>View</button>
                    <button className="btn-danger" onClick={() => handleDelete(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer>
        <small>Refresh interval: 10s • Backend: {API_BASE || 'same-origin /api'}</small>
      </footer>
      {selected && <DeviceDetails device={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
