import {
  ImageBackground,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { theme } from "../themes/mainTheme";

export default function Background({ children }) {
  return (
    <ImageBackground
      source={require("../../../assets/login_bg.jpg")}
      resizeMode="cover"
      style={styles.background}
    >
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {children}
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    padding: 10,
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
});
