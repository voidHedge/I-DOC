import { PaperProvider } from "react-native-paper";
import AppNavigation from "./src/components/navigation/AppNavigation";
import { theme } from "./src/components/themes/mainTheme";

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AppNavigation />
    </PaperProvider>
  );
}
