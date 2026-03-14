import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gimmeidea.app',
  appName: 'Gimme Idea',
  webDir: 'www',
  server: {
    url: 'https://www.gimmeidea.com',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'www.gimmeidea.com',
      'gimmeidea.com',
      '*.supabase.co',
      '*.supabase.in'
    ]
  },
  plugins: {
    StatusBar: {
      overlay: false
    }
  }
};

export default config;
