# 🎵 LyricLens

Auto-translate any song you're listening to on Spotify into a language of your choice — side-by-side with the original lyrics.

## Setup

### 1. Get a free Spotify Developer App

1. Go to <https://developer.spotify.com/dashboard>
2. Click **Create app**
3. Set the **Redirect URI** to `http://localhost:3001/auth/callback`
4. Copy your **Client ID** and **Client Secret**

### 2. Configure the backend

```bash
cd server
cp .env.example .env
# Open .env and paste your Spotify Client ID and Secret
```

### 3. Install & run the backend

```bash
cd server
npm install
npm run dev     # starts on http://localhost:3001
```

### 4. Install & run the frontend

```bash
cd client
npm install
npm start       # starts on http://localhost:3000
```

### 5. Open the app

Visit <http://localhost:3000>, click **Connect with Spotify**, and start playing a song!

## Architecture

```
client/ (React, port 3000)
  src/
    App.js          ← main UI: login, now-playing, lyrics display
    api.js          ← all HTTP calls to the backend
    LANGUAGES.js    ← list of supported translation languages
    App.css         ← dark-theme styles

server/ (Node/Express, port 3001)
  src/
    index.js        ← Express app setup
    routes/
      auth.js       ← Spotify OAuth login/callback/refresh
      spotify.js    ← /now-playing endpoint
      lyrics.js     ← fetches lyrics from lyrics.ovh
      translate.js  ← translates text via MyMemory API
```

## APIs used (all free)

| Service | Purpose | Key required? |
|---|---|---|
| Spotify Web API | Currently playing track | Yes (free dev account) |
| lyrics.ovh | Fetch lyrics by artist + title | No |
| MyMemory | Translate text | No (5,000 words/day free) |
