/**
 * POST /translate
 * Body: { text: string, targetLang: string }  (targetLang is a BCP-47 code, e.g. "en", "es", "zh")
 *
 * Uses MyMemory API — free, no API key needed for personal use (~5,000 words/day).
 * Translates in chunks to stay under the 500-character-per-request limit.
 */

const express = require('express');
const axios = require('axios');

const router = express.Router();

// Split long lyrics into paragraphs ≤ 500 chars each
function chunkText(text, maxLen = 450) {
  const paragraphs = text.split('\n\n');
  const chunks = [];

  for (const para of paragraphs) {
    if (para.length <= maxLen) {
      chunks.push(para);
    } else {
      // If a single paragraph is too long, split by line
      const lines = para.split('\n');
      let current = '';
      for (const line of lines) {
        if ((current + '\n' + line).length > maxLen) {
          if (current) chunks.push(current.trim());
          current = line;
        } else {
          current = current ? current + '\n' + line : line;
        }
      }
      if (current) chunks.push(current.trim());
    }
  }

  return chunks;
}

async function translateChunk(text, targetLang) {
  const { data } = await axios.get('https://api.mymemory.translated.net/get', {
    params: { q: text, langpair: `autodetect|${targetLang}` },
    timeout: 10000,
  });

  if (data.responseStatus !== 200) {
    throw new Error(data.responseMessage || 'Translation failed');
  }

  return data.responseData.translatedText;
}

router.post('/', async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing text or targetLang' });
  }

  try {
    const chunks = chunkText(text);
    const translated = await Promise.all(
      chunks.map((chunk) => translateChunk(chunk, targetLang))
    );

    res.json({ translatedText: translated.join('\n\n') });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;
