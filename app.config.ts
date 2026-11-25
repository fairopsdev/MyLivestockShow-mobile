import type { ConfigContext, ExpoConfig } from 'expo/config';

// app.json holds the settings; this adds what comes from the build machine.
//  - EAS_PROJECT_ID: set by `eas init` (or put it in app.json → extra.eas.projectId)
//  - GOOGLE_SERVICES_JSON: an EAS file secret with Firebase's google-services.json,
//    needed for Android push notifications.
export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EAS_PROJECT_ID || (config.extra as any)?.eas?.projectId || undefined;
  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || config.android?.googleServicesFile,
    },
    extra: { ...config.extra, eas: { ...(config.extra as any)?.eas, projectId } },
    ...(projectId ? { updates: { url: `https://u.expo.dev/${projectId}` }, runtimeVersion: { policy: 'appVersion' } } : {}),
  };
};
