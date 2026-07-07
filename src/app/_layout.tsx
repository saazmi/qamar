// Root layout. SPEC §5. Theme, fonts, providers, migrations bootstrapped here.

import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
