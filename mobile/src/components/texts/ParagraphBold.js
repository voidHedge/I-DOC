import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { theme } from "../themes/mainTheme";

export default function ParagraphBold(props) {
  return <Text style={styles.text} {...props} />;
}

const styles = StyleSheet.create({
  text: {
    color: theme.colors.onSurface,
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "left",
    flexWrap: "wrap",
    maxWidth: 160,
  },
});
