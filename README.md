# Device Information App - React Version

A modern React application that detects device model information and stores it in Firebase Firestore cloud database.

## 🎯 Features

- **React Frontend** - Built with Vite for fast development and production builds
- **Device Detection** - Automatically detects device model, OS, browser, and screen resolution
- **Firebase Firestore** - Cloud database for storing device information
- **Express Backend** - RESTful API for database operations
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Real-time Updates** - Instant data synchronization to cloud database

## 📁 Project Structure

```
D-N/
├── src/
│   ├── components/
│   │   ├── DeviceInfo.jsx      # Main device info component
│   │   └── DeviceInfo.css      # Component styles
│   ├── services/
│   │   └── deviceService.js    # Device detection and API calls
│   ├── App.jsx                 # Root React component
│   ├── App.css                 # App styles
│   ├── index.jsx               # React entry point
│   └── index.css               # Global styles
├── public/
│   └── index.html              # HTML template
├── server.js                   # Express backend server
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies and scripts
├── .env                        # Firebase credentials (create from .env.example)
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js v14 or higher
- npm or yarn
- Firebase account with Firestore database

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure Firebase credentials** in `.env`:
```
FIREBASE_PROJECT_ID=vite-1c96c
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
PORT=5000
```

3. **Build React app**:
```bash
npm run build
```

### Running the Application

**Production mode**:
```bash
npm start
```

**Development mode** (with hot reload):
```bash
npm run dev
```

This will:
- Start the Express server on `http://localhost:5000`
- Start the Vite dev server on `http://localhost:3000` (for development)

## 📡 API Endpoints

- `POST /api/devices/save` - Save device information
- `GET /api/devices` - Get all stored devices
- `GET /api/devices/count` - Get total device count
- `GET /api/devices/search/:name` - Search devices by name
- `DELETE /api/devices/:id` - Delete a device record

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with hot reload |
| `npm run server` | Start Express server only |
| `npm run client` | Start Vite dev server only |
| `npm run build` | Build React app for production |
| `npm run preview` | Preview production build |

## 📊 Database Schema

Each device record in Firestore contains:

```json
{
  "deviceName": "iPhone 14 Pro",
  "osName": "iOS",
  "browserName": "Safari",
  "screenResolution": "1290x2796",
  "platform": "MacIntel",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-11-12T10:30:45.000Z",
  "createdAt": "2024-11-12T10:30:45.000Z"
}
```

## 🎨 UI Components

### DeviceInfo Component

Main component that:
- Detects device information
- Displays the detected data
- Saves data to Firebase
- Shows loading and status messages
- Provides refresh functionality

## 🔐 Security

For production, update Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /devices/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🌐 Accessing the App

Once running:

1. **Local Access**: `http://localhost:5000`
2. **Firebase Console**: https://console.firebase.google.com/project/vite-1c96c/firestore

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000
# Kill the process
taskkill /PID <PID> /F
```

### Firebase Connection Error
- Check `.env` file has correct credentials
- Verify Firebase project ID matches
- Check internet connection

### Build Fails
- Clear node_modules: `rm -r node_modules`
- Reinstall: `npm install`
- Rebuild: `npm run build`

## 📦 Tech Stack

- **Frontend**: React 18.2.0 + Vite 5.0
- **Backend**: Express 4.18.2
- **Database**: Firebase Firestore
- **Build Tool**: Vite
- **Development**: Nodemon, Concurrently

## 📝 Notes

- Device information persists in browser localStorage
- First visit creates a unique device ID
- Data is sent to Firebase Firestore for permanent storage
- Fallback to localStorage if database is unavailable

## 🤝 Support

For issues or questions:
1. Check the console for error messages
2. Verify Firebase credentials in `.env`
3. Check network tab in browser dev tools
4. Review server logs in terminal

## 📄 License

ISC
