# TODO: Implement Comprehensive User Information Collection

## 1. Update src/services/deviceService.js
- [x] Add function to fetch public IP address using a free API (e.g., ipify.org)
- [x] Add function to fetch geolocation data based on IP (e.g., ipapi.co)
- [x] Add functions for collecting user identity info (name, email, phone, etc.) via forms
- [x] Add permission-based features: microphone/camera access, clipboard content, push notification tokens, PWA info, Bluetooth/USB devices
- [x] Ensure consent prompts for location, media, etc.

## 2. Modify server.js
- [x] Add endpoint for IP geolocation lookup
- [x] Add endpoints for saving user identity data securely (hash passwords, avoid storing sensitive data)
- [x] Update device saving endpoint to handle extended data

## 3. Create src/components/UserIdentityForm.jsx
- [x] Create a new component for user input forms (name, email, password, phone, profile image, etc.)
- [x] Include fields for social account IDs, preferred language/theme, sign-up date

## 4. Update dashboard/src/DeviceDetails.jsx
- [x] Add sections for Network Information (IP, connection type, etc.)
- [x] Add sections for Location Data (city, country, lat/lon)
- [x] Add sections for User Account/Identity Info
- [x] Add sections for App Behavior & Analytics (pages visited, interactions, etc.)
- [x] Add sections for Local & Storage Data (cookies, localStorage, etc.)
- [x] Add sections for Optional/Advanced (microphone/camera, clipboard, files, push tokens, PWA, Bluetooth/USB)

## 5. Update src/App.jsx
- [x] Integrate the new UserIdentityForm component into the main app

## 6. Testing and Compliance
- [x] Test collection on different devices/browsers
- [x] Handle permission denials gracefully
- [x] Ensure GDPR/CCPA compliance with consent mechanisms
- [x] Run the app and verify data saving/display
