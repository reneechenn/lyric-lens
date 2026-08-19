/**
 * GET /spotify/now-playing
 * Returns the currently playing track on the logged-in user's Spotify.
 */

const express = require('express');
const axios = require('axios');
const { requireSpotifyAuth } = require('./auth');

const router = express.Router();

router.get('/now-playing', requireSpotifyAuth, async (req, res) => {
  try {
    const { data, status } = await axios.get(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${req.spotifyToken}` } }
    );

    // 204 = nothing is playing
    if (status === 204 || !data || !data.item) {
      return res.json({ playing: false });
    }

    const track = data.item;
    res.json({
      playing: true,
      id: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0]?.url ?? null,
      progressMs: data.progress_ms,
      durationMs: track.duration_ms,
      spotifyUrl: track.external_urls.spotify,
    });
  } catch (err) {
    console.error('now-playing error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch now playing' });
  }
});

module.exports = router;
