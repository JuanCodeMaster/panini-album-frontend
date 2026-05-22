import { Capacitor } from '@capacitor/core';

// ──────────────────────────────────────────────────────────────────────
// CONFIG DEV
// ──────────────────────────────────────────────────────────────────────
// En web (`ionic serve`) puedes seguir usando localhost si tienes el
// backend corriendo en tu PC.
// En nativo (Capacitor Android / iOS) apuntamos directo al backend en
// Railway — así no dependes de tu IP LAN ni del firewall del PC.
// ──────────────────────────────────────────────────────────────────────
const WEB_API_URL = 'http://localhost:8081/api';
const RAILWAY_API_URL = 'https://panini-album-backend-production.up.railway.app/api';

const isNative = Capacitor.isNativePlatform();

export const environment = {
  production: false,
  apiUrl: isNative ? RAILWAY_API_URL : WEB_API_URL,
};
