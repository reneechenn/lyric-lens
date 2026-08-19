/**
 * All HTTP calls to the LyricLens backend live here.
 * The base URL points to the Express server running on port 3001.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

export const checkLogin = () => api.get('/auth/me').then((r) => r.data);

export const getNowPlaying = () =>
  api.get('/spotify/now-playing').then((r) => r.data);

export const fetchLyrics = (artist, title) =>
  api.get('/lyrics', { params: { artist, title } }).then((r) => r.data);

export const translateText = (text, targetLang) =>
  api.post('/translate', { text, targetLang }).then((r) => r.data);

export const logout = () => api.get('/auth/logout');
