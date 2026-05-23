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

### Aviso si sincronizas iOS desde Windows

`npx cap sync ios` en Windows genera `ios/App/CapApp-SPM/Package.swift`
con paths estilo `..\..\..\node_modules\...` (con backslashes) y Xcode
no los entiende. Si haces sync desde Windows tenés que reemplazar los `\`
por `/` en ese archivo antes de pasarlo al Mac.

En Mac no pasa: ahí se generan con `/` y funciona directo.

### Pasos completos en un Mac para iOS (cuando consigas uno)

El proyecto iOS ya está sincronizado en `ios/App/` con icono Mundial Mark,
permisos `NSAppTransportSecurity` (HTTP local), bundle id `com.panini.mundial2026`
y `appName: Figuritas del Mundial`. Sólo necesitás:

1. **Instalar requisitos en el Mac**
   ```bash
   # Xcode desde la App Store (gratis)
   # Cocoapods:
   sudo gem install cocoapods
   # Node 20+ desde nodejs.org o brew
   ```
2. **Clonar el repo**
   ```bash
   git clone https://github.com/JuanCodeMaster/panini-album-frontend.git
   cd panini-album-frontend
   npm install
   ```
3. **Build web + sync + pods**
   ```bash
   npx ng build --configuration=production
   npx cap sync ios
   cd ios/App && pod install && cd ../..
   ```
4. **Abrir en Xcode**
   ```bash
   npx cap open ios
   ```
5. **Firmar con tu Apple ID (gratis)**
   - En Xcode: panel izquierdo → click "App" → tab "Signing & Capabilities"
   - "Team" → "Add an account..." → ingresar tu Apple ID
   - Xcode crea un certificado de desarrollador personal automático
6. **Conectar el iPhone por USB**, seleccionarlo en el dropdown de dispositivos (arriba) y hacer **Cmd+R** o "Run".
7. La primera vez en el iPhone: Settings → General → VPN y administración de dispositivos → confiar en tu Apple ID.
8. La app caduca cada 7 días con Apple ID gratuita. Reabrir y hacer Run otra vez para extender.

### Regenerar iconos / splash

```bash
node resources/generate-png.mjs              # SVG → PNG
npx @capacitor/assets generate --android --ios
npx cap sync
```

## Configurar el backend

Edita `src/environments/environment.ts` (dev) y `environment.prod.ts` (prod) con la URL pública del API.
