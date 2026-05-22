import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.panini.mundial2026',
  appName: 'Figuritas del Mundial',
  webDir: 'www',
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'always',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
