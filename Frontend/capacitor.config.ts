import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.markpt.app',
  appName: 'MARK PT',
  webDir: 'out',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#4F8CFF',
    },
  },
};

export default config;
