import React, { useState, useEffect, useCallback, useRef } from 'react';
import { checkLogin, getNowPlaying, fetchLyrics, translateText, logout } from './api';
import LANGUAGES from './LANGUAGES';
import './App.css';

const POLL_INTERVAL_MS = 10_000; // check now-playing every 10 seconds

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [track, setTrack] = useState(null);       // current Spotify track
  const [lyrics, setLyrics] = useState('');        // original lyrics
  const [translated, setTranslated] = useState(''); // translated lyrics
  const [targetLang, setTargetLang] = useState('en');
  const [status, setStatus] = useState('idle');    // idle | loading | translating | error
  const [errorMsg, setErrorMsg] = useState('');

  // Keep a ref so the poll callback can check whether the track changed
  const lastTrackIdRef = useRef(null);

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    checkLogin().then(({ loggedIn }) => setLoggedIn(loggedIn));
  }, []);

  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/login';
  };

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    setTrack(null);
    setLyrics('');
    setTranslated('');
  };

  // ── Fetch lyrics + translate whenever track or language changes ───────────

  const loadLyricsAndTranslate = useCallback(async (trackData) => {
    setStatus('loading');
    setLyrics('');
    setTranslated('');
    setErrorMsg('');

    try {
      const { found, lyrics: rawLyrics } = await fetchLyrics(
        trackData.artist,
        trackData.title
      );

      if (!found || !rawLyrics) {
        setStatus('error');
        setErrorMsg("Lyrics not found for this song.");
        return;
      }

      setLyrics(rawLyrics);
      setStatus('translating');

      const { translatedText } = await translateText(rawLyrics, targetLang);
      setTranslated(translatedText);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Something went wrong. Check the console for details.');
    }
  }, [targetLang]);

  // ── Poll Spotify for the now-playing track ────────────────────────────────

  const pollNowPlaying = useCallback(async () => {
    try {
      const data = await getNowPlaying();

      if (!data.playing) {
        setTrack(null);
        return;
      }

      // Only reload lyrics if the song changed
      if (data.id !== lastTrackIdRef.current) {
        lastTrackIdRef.current = data.id;
        setTrack(data);
        await loadLyricsAndTranslate(data);
      }
    } catch {
      // Silently ignore poll errors (e.g. brief network blip)
    }
  }, [loadLyricsAndTranslate]);

  useEffect(() => {
    if (!loggedIn) return;

    pollNowPlaying();
    const interval = setInterval(pollNowPlaying, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loggedIn, pollNowPlaying]);

  // Re-translate when the user picks a different language (without re-fetching lyrics)
  useEffect(() => {
    if (!lyrics) return;
    setStatus('translating');
    setTranslated('');
    translateText(lyrics, targetLang)
      .then(({ translatedText }) => {
        setTranslated(translatedText);
        setStatus('idle');
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Translation failed.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLang]); // intentionally only re-runs when language changes

  // ── Render ────────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return (
      <div className="splash">
        <div className="splash-card">
          <h1>🎵 LyricLens</h1>
          <p>Translate any song you're listening to on Spotify — instantly.</p>
          <button className="btn-spotify" onClick={handleLogin}>
            Connect with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">🎵 LyricLens</span>
        <div className="header-right">
          <label htmlFor="lang-select">Translate to:</label>
          <select
            id="lang-select"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button className="btn-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="main">
        {!track && (
          <div className="empty-state">
            <p>▶ Play a song on Spotify and it will appear here automatically.</p>
          </div>
        )}

        {track && (
          <>
            <div className="now-playing">
              {track.albumArt && (
                <img src={track.albumArt} alt="Album art" className="album-art" />
              )}
              <div className="track-info">
                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="track-title"
                >
                  {track.title}
                </a>
                <span className="track-artist">{track.artist}</span>
                <span className="track-album">{track.album}</span>
              </div>
            </div>

            {status === 'loading' && (
              <p className="status-msg">Fetching lyrics…</p>
            )}
            {status === 'translating' && (
              <p className="status-msg">Translating…</p>
            )}
            {status === 'error' && (
              <p className="status-msg error">{errorMsg}</p>
            )}

            {lyrics && translated && (
              <div className="lyrics-grid">
                <div className="lyrics-col">
                  <h2>Original</h2>
                  <pre>{lyrics}</pre>
                </div>
                <div className="lyrics-col">
                  <h2>
                    {LANGUAGES.find((l) => l.code === targetLang)?.label ??
                      targetLang}
                  </h2>
                  <pre>{translated}</pre>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
