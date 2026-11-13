import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { theme } from "../themes/mainTheme";

export default function Header(props) {
  return <Text style={styles.header} {...props} />;
}

const styles = StyleSheet.create({
  header: {
    fontSize: 21,
    color: theme.colors.onSurface,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 0,
    marginBottom: 12,
  },
});
