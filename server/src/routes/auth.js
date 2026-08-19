/**
 * Spotify OAuth 2.0 flow
 *
 * GET /auth/login    → redirects user to Spotify authorization page
 * GET /auth/callback → Spotify calls this back with a code; we exchange it for tokens
 * GET /auth/logout   → clears the session
 * GET /auth/me       → returns current login status
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  CLIENT_URL = 'http://localhost:3000',
} = process.env;

const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
].join(' ');

// Step 1: redirect user to Spotify's login page
router.get('/login', (_req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: SPOTIFY_REDIRECT_URI,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Step 2: Spotify redirects here with ?code=...
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${CLIENT_URL}?error=${error}`);
  }

  try {
    const credentials = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const { data } = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Store tokens in the server session (never expose client_secret to browser)
    req.session.accessToken = data.access_token;
    req.session.refreshToken = data.refresh_token;
    req.session.expiresAt = Date.now() + data.expires_in * 1000;

    res.redirect(CLIENT_URL);
  } catch (err) {
    console.error('Auth callback error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}?error=auth_failed`);
  }
});

// Silently refresh the access token when it's about to expire
async function refreshAccessToken(req) {
  const credentials = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: req.session.refreshToken,
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  req.session.accessToken = data.access_token;
  req.session.expiresAt = Date.now() + data.expires_in * 1000;
  return data.access_token;
}

// Middleware: attach a valid access token to req.spotifyToken
async function requireSpotifyAuth(req, res, next) {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  // Refresh if token expires within 60 seconds
  if (Date.now() > req.session.expiresAt - 60_000) {
    try {
      await refreshAccessToken(req);
    } catch {
      return res.status(401).json({ error: 'Token refresh failed, please log in again' });
    }
  }

  req.spotifyToken = req.session.accessToken;
  next();
}

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ loggedIn: !!req.session.accessToken });
});

module.exports = router;
module.exports.requireSpotifyAuth = requireSpotifyAuth;
