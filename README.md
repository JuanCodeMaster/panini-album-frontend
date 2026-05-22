# Panini Album · Frontend

App Ionic 8 + Angular 19 standalone para gestionar el álbum Panini **Figuritas del Mundial 2026**.

## Stack
- Ionic 8 · Angular 19 standalone (signals + computed)
- Capacitor 8 (Android + iOS)
- SCSS · Anton · Manrope · JetBrains Mono
- Paleta Mundial Red `#E30613` + navy `#0A1A3D` + gold `#D4AF37`

## Requisitos
- Node 20+
- npm
- Backend corriendo en `http://localhost:8081` (ver `environments/environment.ts`)
- Para builds nativos: Android Studio (Android) / macOS + Xcode (iOS)

## Arrancar web

```bash
npm install
ionic serve            # http://localhost:8100
```

## Build producción

```bash
npx ng build --configuration=production
# Salida: www/
```

## Compilar móvil (Capacitor)

```bash
npx ng build --configuration=production
npx cap sync

# Android (Android Studio):
npx cap open android

# iOS (Xcode):
npx cap open ios
```

### Regenerar iconos / splash

```bash
node resources/generate-png.mjs              # SVG → PNG
npx @capacitor/assets generate --android --ios
npx cap sync
```

## Configurar el backend

Edita `src/environments/environment.ts` (dev) y `environment.prod.ts` (prod) con la URL pública del API.
