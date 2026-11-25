import { Platform } from 'react-native';

export const colors = {
  navy: '#14284B',
  navySoft: '#24406E',
  gold: '#C8A24A',
  goldSoft: '#F6EFD9',
  bg: '#F4F5F8',
  card: '#FFFFFF',
  line: '#E3E6EC',
  text: '#14284B',
  muted: '#5A6478',
  faint: '#8A93A6',
  green: '#1F7A4D',
  greenSoft: '#E4F3EB',
  red: '#B42318',
  redSoft: '#FDECEA',
  amber: '#B54708',
  amberSoft: '#FEF3E2',
  blue: '#1D5FB4',
  blueSoft: '#E6EEF9',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const font = {
  heading: Platform.select({ ios: 'System', default: 'sans-serif' }),
};
