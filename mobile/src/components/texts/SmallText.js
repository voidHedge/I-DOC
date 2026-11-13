import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { theme } from "../themes/mainTheme";

export default function SmallText(props) {
  return <Text style={styles.text} {...props} />;
}

const styles = StyleSheet.create({
  text: {
    color: theme.colors.secondary,
    fontSize: 13,
    textAlign: "center",
  },
});
