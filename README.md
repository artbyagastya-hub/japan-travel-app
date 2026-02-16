# 🇯🇵 Japan Travel Assistant

A mobile-first React PWA for navigating Japan — with AI-powered camera translation, real-time weather, expense tracking, phrasebook with audio, and a full trip planner. Built for offline-friendly use on your phone.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

| Tab | What it does |
|-----|-------------|
| 📋 **Trip** | Full itinerary timeline, flight cards, hotel taxi cards (Japanese address to show driver) |
| 📅 **Plan** | Day-by-day planner for Kyoto & Tokyo with times, tips, and map links |
| 🗣️ **Talk** | AI text/voice translation (EN↔JP) + 28-phrase phrasebook with tap-to-hear audio |
| 📷 **Lens** | Camera translator — point at menus, signs, labels and get instant AI translation |
| 🧭 **Explore** | Currency converter, konbini finder (7-Eleven/Lawson/FamilyMart), ATM finder, nearby search |
| 🌙 **Night** | Curated whiskey bars, vinyl listening bars, nightlife spots, shopping guide |
| 📍 **Places** | Kyoto & Tokyo attractions with hours, prices, tips, must-see filter |
| 🧳 **Pack** | Interactive packing checklist with persistent storage |
| 💰 **¥** | Expense tracker in JPY with category tags and USD conversion |
| 🤖 **AI** | Chat with an AI travel assistant that knows your full itinerary |
| 🆘 **SOS** | One-tap emergency calls, English helplines, emergency phrases with audio |

---

## 🚀 Quick Start (Build from Scratch)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- [Git](https://git-scm.com/) installed
- An [OpenAI API key](https://platform.openai.com/api-keys) (for AI features)

### 1. Create the project

```bash
mkdir japan-trip && cd japan-trip
npm init -y
```

### 2. Install dependencies

```bash
npm install react@18 react-dom@18
npm install -D vite@5 @vitejs/plugin-react@4
```

### 3. Create the file structure

```
japan-trip/
├── api/
│   └── translate.js          # Vercel serverless proxy for OpenAI
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon-192.png           # App icon (192×192)
│   └── icon-512.png           # App icon (512×512)
├── src/
│   ├── App.jsx                # Main app (copy from this repo)
│   └── main.jsx               # React entry point
├── index.html                 # HTML shell
├── vite.config.js             # Vite config
├── package.json
└── README.md
```

### 4. Create each file

**`vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**`index.html`** (project root, not in public/)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#1a1a2e" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>Japan Trip 2026</title>
  <link rel="manifest" href="/manifest.json" />
  <style>body { margin: 0; background: #1a1a2e; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

**`src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

**`src/App.jsx`** — Copy the full `App.jsx` file from this repo.

**`public/manifest.json`**

```json
{
  "name": "Japan Trip 2026",
  "short_name": "JP Trip",
  "description": "Your complete Japan travel companion",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

> **Note:** You'll need to create or download PNG icons at 192×192 and 512×512. A simple 🇯🇵 emoji on a `#1a1a2e` background works great. Use [favicon.io](https://favicon.io/emoji-favicons/) or any icon generator.

**`api/translate.js`** — Copy `translate.js` from this repo. This is the Vercel serverless function that proxies OpenAI requests so your API key stays secret.

### 5. Update `package.json` scripts

Make sure your `package.json` has these scripts:

```json
{
  "name": "japan-trip",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

### 6. Run locally

```bash
npm run dev
```

Open `http://localhost:5173` on your phone or browser. Most features work without an API key — AI translation, camera lens, and chat require OpenAI.

---

## 🔑 API Setup (OpenAI)

The app uses OpenAI for three features: text translation, camera translation (vision), and the AI chat assistant.

### For local development

Set your key as an environment variable:

```bash
export OPENAI_API_KEY=sk-your-key-here
```

Or create a `.env` file in the project root:

```
OPENAI_API_KEY=sk-your-key-here
```

### For production (Vercel)

Your API key is kept server-side via the included serverless function at `api/translate.js`. The browser never sees your key.

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add `OPENAI_API_KEY` with your key
3. Redeploy

### API costs

The app uses `gpt-4o-mini` for text tasks (very cheap, ~$0.15/1M tokens) and `gpt-4o` for camera vision (~$2.50/1M tokens). A typical trip would cost well under $1 in API usage.

---

## ☁️ Deploy to Production

### Option A: Vercel (Recommended)

Vercel is free, handles the serverless API proxy automatically, and gives you HTTPS + a custom domain.

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/japan-trip.git
git push -u origin main

# 2. Deploy
# Go to vercel.com → "Add New Project" → Import your repo
# Framework: Vite (auto-detected)
# Add OPENAI_API_KEY in Environment Variables
# Click Deploy
```

Your app will be live at `https://japan-trip-xxxx.vercel.app`

### Option B: Netlify

```bash
# Same GitHub push, then:
# Go to netlify.com → "Add new site" → Import from Git
# Build command: npm run build
# Publish directory: dist
# Add OPENAI_API_KEY in Environment Variables
```

> **Note:** For Netlify, move `api/translate.js` to `netlify/functions/translate.js` and adjust the fetch URL in the app accordingly.

### Option C: GitHub Pages (no AI features)

Works for the static app but serverless functions won't run, so AI translation/chat/camera won't work.

```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "vite build && gh-pages -d dist"

npm run deploy
```

---

## 📱 Install as a Phone App (PWA)

Once deployed, you can install it as a full-screen app on your phone:

### Android (Chrome)
1. Open your deployed URL in Chrome
2. Tap **⋮** (three dots) → **"Add to Home screen"**
3. It now launches full-screen like a native app

### iPhone (Safari)
1. Open your deployed URL in Safari
2. Tap **Share** (box with arrow) → **"Add to Home Screen"**
3. Works as a standalone app

---

## 🛠️ Customizing for Your Trip

The app data is all in `src/App.jsx` as plain JavaScript objects at the top of the file. You can easily edit:

| Data | What to change |
|------|---------------|
| `FLIGHTS` | Your flight numbers, times, terminals |
| `HOTELS` | Hotel names, Japanese addresses, coordinates |
| `TRIP_DATA` | Day-by-day itinerary segments |
| `DAILY_PLANS` | Detailed daily stop-by-stop plans |
| `ATTRACTIONS` | Kyoto/Tokyo sightseeing spots |
| `NIGHTLIFE` | Bar/restaurant/shopping recommendations |
| `PHRASES` | Add or remove phrasebook entries |
| `PACKING_DATA` | Packing checklist items |
| `EMERGENCY` | Emergency contact numbers |

### Changing the destination

This app is built for Japan but the architecture works for any country. To adapt:

1. Replace all data objects with your destination info
2. Update the translation prompt in `callOpenAI()` for your target language
3. Update the `speak()` function language code (e.g., `ko-KR` for Korean)
4. Swap out the currency converter rates
5. Update emergency numbers

---

## 📂 Project Structure

```
japan-trip/
├── api/
│   └── translate.js       → OpenAI proxy (Vercel serverless function)
├── public/
│   ├── manifest.json       → PWA config
│   ├── icon-192.png        → Home screen icon
│   └── icon-512.png        → Splash screen icon
├── src/
│   ├── App.jsx             → Entire app (single-file React component)
│   └── main.jsx            → React DOM mount
├── index.html              → HTML entry point
├── vite.config.js          → Vite bundler config
├── package.json            → Dependencies & scripts
└── README.md               → This file
```

The app is intentionally a single `App.jsx` file for easy portability and editing. For larger projects you'd split into components, but for a travel companion app this keeps things simple and easy to deploy.

---

## 🧰 Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool & dev server
- **OpenAI GPT-4o / GPT-4o-mini** — AI translation, vision, chat
- **Web Speech API** — Voice input & text-to-speech
- **MediaDevices API** — Camera access for live translation
- **Open-Meteo API** — Weather data (free, no key needed)
- **Google Maps links** — Navigation & nearby search
- **PWA** — Installable, full-screen mobile experience

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|---------|
| Camera not working | Make sure you're on HTTPS (required for camera access). localhost works too. |
| AI features not responding | Check that `OPENAI_API_KEY` is set in Vercel environment variables and redeploy. |
| Weather not loading | Open-Meteo is occasionally slow. The app handles this gracefully — wait a moment. |
| Speech/audio not playing | iOS requires a user tap before audio plays. Tap any phrase to trigger. |
| PWA not installable | Ensure `manifest.json` is served and both icon files exist in `/public`. |
| Fonts look wrong | The app loads Google Fonts (Noto Sans JP, Noto Serif JP). Needs internet on first load. |

---

## 📄 License

MIT — Use it, fork it, customize it for your own trip.


