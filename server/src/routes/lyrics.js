/**
 * GET /lyrics?artist=<name>&title=<title>
 * Fetches lyrics from lyrics.ovh (free, no API key required).
 * Falls back to a helpful "not found" message if unavailable.
 */

const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
  const { artist, title } = req.query;

  if (!artist || !title) {
    return res.status(400).json({ error: 'Missing artist or title query params' });
  }

  try {
    const encoded = {
      artist: encodeURIComponent(artist),
      title: encodeURIComponent(title),
    };

    const { data } = await axios.get(
      `https://api.lyrics.ovh/v1/${encoded.artist}/${encoded.title}`,
      { timeout: 8000 }
    );

    if (!data.lyrics) {
      return res.json({ found: false, lyrics: null });
    }

    // Clean up extra blank lines that lyrics.ovh sometimes returns
    const cleaned = data.lyrics
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    res.json({ found: true, lyrics: cleaned });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.json({ found: false, lyrics: null });
    }
    console.error('Lyrics fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

module.exports = router;
