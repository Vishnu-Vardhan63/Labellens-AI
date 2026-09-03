import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.labellens.app',
  appName: 'Label Lens AI',
  webDir: 'dist',
  server: {
    // For development, point to your dev server
    // androidScheme: 'https',
  },
  plugins: {
    Camera: {
      // Permissions will be configured in Android manifest
    },
  },
};

export default config;
