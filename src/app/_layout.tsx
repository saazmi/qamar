// Root layout. SPEC §5, §16.3. Loads fonts, wraps in theme, mounts router, hosts undo toast.

import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_700Bold,
} from '@expo-google-fonts/noto-naskh-arabic';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UndoToastHost } from '@components/primitives/UndoToast';
import { light } from '@theme/colors';

export default function RootLayout() {
  const [fontsLoaded] = useInter({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_700Bold,
    Amiri_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: light.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: light.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: light.bg } }} />
      <UndoToastHost />
    </GestureHandlerRootView>
  );
}
