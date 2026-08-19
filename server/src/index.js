require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRouter = require('./routes/auth');
const spotifyRouter = require('./routes/spotify');
const lyricsRouter = require('./routes/lyrics');
const translateRouter = require('./routes/translate');

const app = express();
const PORT = process.env.PORT || 3001;

const CLIENT_URL = process.env.CLIENT_URL || null;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
if (CLIENT_URL) ALLOWED_ORIGINS.push(CLIENT_URL.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/$/, '');
    if (ALLOWED_ORIGINS.includes(clean)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.set('trust proxy', 1);

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60, // 1 hour
  },
}));

app.use('/auth', authRouter);
app.use('/spotify', spotifyRouter);
app.use('/lyrics', lyricsRouter);
app.use('/translate', translateRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`LyricLens server running on http://localhost:${PORT}`);
});
