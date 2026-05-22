import { Capacitor } from '@capacitor/core';

// ──────────────────────────────────────────────────────────────────────
// CONFIG DEV
// ──────────────────────────────────────────────────────────────────────
// `localhost` SÓLO funciona cuando corres en `ionic serve` desde tu PC.
// Cuando instalas el APK / corres en simulador iOS o en un celular físico,
// el "localhost" del dispositivo NO es tu PC — necesitas la IP LAN.
//
// Cambia LAN_API_URL por la IP de tu PC en la misma red Wi-Fi (ipconfig
// en Windows → "Dirección IPv4"). Ejemplo: 'http://192.168.1.42:8081/api'.
// ──────────────────────────────────────────────────────────────────────
const WEB_API_URL = 'http://localhost:8081/api';
const LAN_API_URL = 'http://192.168.1.42:8081/api'; // ← ajusta a tu IP LAN

const isNative = Capacitor.isNativePlatform();

export const environment = {
  production: false,
  apiUrl: isNative ? LAN_API_URL : WEB_API_URL,
};
