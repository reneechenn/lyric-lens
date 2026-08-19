/**
 * GET /lyrics?artist=<name>&title=<title>
 * Tries multiple free lyrics APIs in order until one returns results.
 */

const express = require('express');
const axios = require('axios');

const router = express.Router();

function cleanLyrics(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Source 1: lyrics.ovh
async function tryLyricsOvh(artist, title) {
  try {
    const { data } = await axios.get(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      { timeout: 8000 }
    );
    if (data.lyrics) return cleanLyrics(data.lyrics);
  } catch { /* not found or timeout */ }
  return null;
}

// Source 2: lrclib.net (returns synced and plain lyrics)
async function tryLrclib(artist, title) {
  try {
    const { data } = await axios.get('https://lrclib.net/api/search', {
      params: { artist_name: artist, track_name: title },
      timeout: 8000,
    });
    if (data && data.length > 0) {
      const match = data[0];
      const lyrics = match.plainLyrics || match.syncedLyrics;
      if (lyrics) {
        // syncedLyrics has timestamps like [00:12.34] — strip them
        const cleaned = lyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s?/g, '');
        return cleanLyrics(cleaned);
      }
    }
  } catch { /* not found or timeout */ }
  return null;
}

// Source 3: lrclib.net direct get (exact match)
async function tryLrclibDirect(artist, title) {
  try {
    const { data } = await axios.get('https://lrclib.net/api/get', {
      params: { artist_name: artist, track_name: title },
      timeout: 8000,
    });
    if (data) {
      const lyrics = data.plainLyrics || data.syncedLyrics;
      if (lyrics) {
        const cleaned = lyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s?/g, '');
        return cleanLyrics(cleaned);
      }
    }
  } catch { /* not found or timeout */ }
  return null;
}

router.get('/', async (req, res) => {
  const { artist, title } = req.query;

  if (!artist || !title) {
    return res.status(400).json({ error: 'Missing artist or title query params' });
  }

  try {
    // Try each source in order
    const lyrics =
      await tryLrclibDirect(artist, title) ||
      await tryLrclib(artist, title) ||
      await tryLyricsOvh(artist, title);

    if (!lyrics) {
      return res.json({ found: false, lyrics: null });
    }

    res.json({ found: true, lyrics });
  } catch (err) {
    console.error('Lyrics fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

module.exports = router;
