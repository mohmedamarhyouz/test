# Device Information App - React Version

A modern React application that detects device model information and stores it in Firebase Firestore cloud database.

## 🎯 Features

- **React Frontend** - Built with Vite for fast development and production builds
- **Comprehensive Device Detection** - Detects device model, OS, browser, screen, CPU architecture, battery, connection, geolocation, and session analytics
- **Firebase Firestore** - Cloud database for storing device information with rich metadata
- **Express Backend** - RESTful API with IP geolocation enrichment
- **Admin Dashboard** - Separate React app to view, filter, and manage device records
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Real-time Updates** - Instant data synchronization to cloud database

## 📁 Project Structure

```
D-N/
├── src/                        # Main React app (device detector)
│   ├── components/
│   │   ├── DeviceInfo.jsx      # Main device info component
│   │   └── DeviceInfo.css      # Component styles
│   ├── services/
│   │   └── deviceService.js    # Device detection and API calls
│   ├── App.jsx                 # Root React component
│   ├── App.css                 # App styles
│   ├── index.jsx               # React entry point
│   └── index.css               # Global styles
├── dashboard/                  # Admin dashboard (separate React app)
│   ├── src/
│   │   ├── App.jsx             # Dashboard component
│   │   ├── DeviceDetails.jsx   # Details modal
│   │   ├── styles.css          # Dashboard styles
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── public/
│   └── index.html              # HTML template
├── server.js                   # Express backend server
├── vite.config.js              # Vite configuration
├── netlify.toml                # Netlify deployment config
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

## 🚀 Deployment

### Frontend (Netlify)

1. **Connect your GitHub repository to Netlify**:
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize
   - Choose the `D-N` repository

2. **Configure build settings** (should auto-detect from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set environment variables in Netlify**:
   - Go to Site settings → Build & deploy → Environment
   - Add: `VITE_API_URL=https://your-backend-url.com` (where your backend is deployed)

4. **Deploy**: Push to main branch on GitHub, Netlify will automatically deploy

### Backend (Express + Firestore)

Deploy to Heroku, Railway, Render, or similar:

1. **Heroku example**:
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

2. **Set environment variables on your hosting platform**:
   - FIREBASE_PROJECT_ID
   - FIREBASE_PRIVATE_KEY
   - FIREBASE_CLIENT_EMAIL
   - etc. (from your `.env` file)

3. **Backend will be accessible at**: `https://your-app-name.herokuapp.com`

4. **Update frontend**: Set `VITE_API_URL` to your backend URL in Netlify environment variables

### Dashboard (Netlify)

Deploy the dashboard separately:

1. Go to Netlify, create a new site
2. Build command: `cd dashboard && npm run build`
3. Publish directory: `dashboard/dist`
4. Add same `VITE_API_URL` environment variable

## 🌐 Accessing the App

- **Frontend**: https://your-netlify-site.netlify.app
- **Dashboard**: https://your-dashboard-site.netlify.app
- **Backend API**: https://your-backend-url.com/api/devices
- **Firebase Console**: https://console.firebase.google.com

## 🐛 Troubleshooting

### Netlify 404 Error
- Make sure `netlify.toml` exists with correct `publish = "dist"`
- Verify build command is `npm run build`
- Check build logs for errors

### API not connecting on Netlify
- Ensure `VITE_API_URL` is set in Netlify environment variables
- Verify backend URL is correct and accessible
- Check CORS settings on your backend (should allow your Netlify domain)

### Port Already in Use (Local)
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
- Verify Firestore rules allow reads/writes

### Build Fails
- Clear node_modules: `rm -r node_modules && rm -r dashboard/node_modules`
- Reinstall: `npm install && cd dashboard && npm install && cd ..`
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
