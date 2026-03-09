import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PalaceGame } from './src/ui/PalaceGame';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <PalaceGame />
    </SafeAreaProvider>
  );
}
