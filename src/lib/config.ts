// Where the app finds Fair Central. Override with EXPO_PUBLIC_* variables
// (eas.json build profiles or a local .env) to point at a test copy.
export const APP_ID = process.env.EXPO_PUBLIC_FAIR_CENTRAL_APP_ID || '6a8508ae5f73ce34d7d46108';
export const API_URL = (process.env.EXPO_PUBLIC_FAIR_CENTRAL_API_URL || 'https://base44.app').replace(/\/$/, '');
// The Fair Central website, for links that open in the browser.
export const WEB_URL = (process.env.EXPO_PUBLIC_FAIR_CENTRAL_WEB_URL || `https://${APP_ID}.base44.app`).replace(/\/$/, '');
