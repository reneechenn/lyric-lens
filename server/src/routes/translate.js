/**
 * POST /translate
 * Body: { text: string, targetLang: string }
 *
 * Uses Google Translate's free public endpoint.
 * No API key required, no daily quota for reasonable usage.
 */

const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing text or targetLang' });
  }

  try {
    const { data } = await axios.get(
      'https://translate.googleapis.com/translate_a/single',
      {
        params: {
          client: 'gtx',
          sl: 'auto',
          tl: targetLang,
          dt: 't',
          q: text,
        },
        timeout: 15000,
      }
    );

    // Response is a nested array — extract all translated segments
    const translatedText = data[0]
      .filter(Boolean)
      .map((segment) => segment[0])
      .join('');

    res.json({ translatedText });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;
