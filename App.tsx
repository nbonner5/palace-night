import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PalaceGame } from './src/ui/PalaceGame';
import { colors } from './src/ui/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.tableDark }}>
      <StatusBar style="light" />
      <PalaceGame />
    </SafeAreaProvider>
  );
}
