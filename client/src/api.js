import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: API_URL });

// ── Token management via localStorage ──────────────────────────────

export function saveTokens({ access_token, refresh_token, expires_in }) {
  localStorage.setItem('sp_access_token', access_token);
  localStorage.setItem('sp_refresh_token', refresh_token);
  localStorage.setItem('sp_expires_at', String(Date.now() + Number(expires_in) * 1000));
}

export function getAccessToken() {
  return localStorage.getItem('sp_access_token');
}

export function isLoggedIn() {
  return !!getAccessToken();
}

export function clearTokens() {
  localStorage.removeItem('sp_access_token');
  localStorage.removeItem('sp_refresh_token');
  localStorage.removeItem('sp_expires_at');
}

export function getLoginUrl() {
  return `${API_URL}/auth/login`;
}

// ── Spotify API calls (direct, using the stored token) ─────────────

function spotifyHeaders() {
  return { Authorization: `Bearer ${getAccessToken()}` };
}

export async function getNowPlaying() {
  const { data, status } = await axios.get(
    'https://api.spotify.com/v1/me/player/currently-playing',
    { headers: spotifyHeaders(), validateStatus: (s) => s < 500 }
  );

  if (status === 204 || !data || !data.item) {
    return { playing: false };
  }

  const track = data.item;
  return {
    playing: true,
    isPlaying: data.is_playing,
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    albumArt: track.album.images[0]?.url ?? null,
    progressMs: data.progress_ms,
    durationMs: track.duration_ms,
    spotifyUrl: track.external_urls.spotify,
  };
}

// ── Playback controls ───────────────────────────────────────────────

export async function setPlayback(action) {
  const headers = spotifyHeaders();
  const base = 'https://api.spotify.com/v1/me/player';
  const opts = { headers, validateStatus: (s) => s < 500 };

  switch (action) {
    case 'play':  return axios.put(`${base}/play`, {}, opts);
    case 'pause': return axios.put(`${base}/pause`, {}, opts);
    case 'next':  return axios.post(`${base}/next`, {}, opts);
    case 'prev':  return axios.post(`${base}/previous`, {}, opts);
    default: break;
  }
}

// ── Lyrics & translation (go through our backend) ──────────────────

export const fetchLyrics = (artist, title) =>
  api.get('/lyrics', { params: { artist, title } }).then((r) => r.data);

export const translateText = (text, targetLang) =>
  api.post('/translate', { text, targetLang }).then((r) => r.data);
