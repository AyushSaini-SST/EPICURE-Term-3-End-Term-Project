# PantryPulse - Inventory Management App

A React application built with Vite for managing pantry inventory, recipes, and shopping lists using Firebase.

## Features

- User authentication with Firebase Auth
- Inventory tracking
- Recipe management
- Shopping list generation
- Real-time data with Firestore

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file and configure Firebase:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Firebase project credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

For deployment, ensure your hosting platform has the environment variables set:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Build the project:
```bash
npm run build
```

Deploy the `dist` folder to your hosting service (e.g., Vercel, Netlify, Firebase Hosting).

## Tech Stack

- React 18
- Vite
- Firebase (Auth, Firestore)
- Tailwind CSS (if used)
- ESLint
