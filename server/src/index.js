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

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true in production with HTTPS
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
