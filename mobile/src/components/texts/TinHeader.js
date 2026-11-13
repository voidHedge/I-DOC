import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { theme } from "../themes/mainTheme";

export default function TinHeader(props) {
  return <Text style={styles.header} {...props} />;
}

const styles = StyleSheet.create({
  header: {
    fontSize: 21,
    color: theme.colors.onSurface,
    textAlign: "center",
    paddingVertical: 25,
  },
});
