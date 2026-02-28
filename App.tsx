import { SafeAreaView, StatusBar } from 'react-native';
import GameScreen from './src/screens/GameScreen';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" />
      <GameScreen />
    </SafeAreaView>
  );
}
