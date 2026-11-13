import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { Surface } from "react-native-paper";

import { AuthContext } from "../../../api/authContext";
import Background from "../../backgrounds/AuthorizationBack";
import Button from "../../buttons/button_001";
import Header from "../../texts/Header";
import SmallText from "../../texts/SmallText";
import TinHeader from "../../texts/TinHeader";
import { theme } from "../../themes/mainTheme";

export default function ProfileScreen() {
  const { setIsAuth } = useContext(AuthContext);
  const imgDir = FileSystem.documentDirectory + "images/";

  const logOutHandler = async () => {
    try {
      // 1. Удаляем JWT-токен
      await AsyncStorage.removeItem("token");

      // 2. Очищаем старые ключи (на всякий случай, чтобы почистить память)
      await AsyncStorage.removeItem("mob_hash");
      await AsyncStorage.removeItem("int_login");
      await AsyncStorage.removeItem("service_id");
      await AsyncStorage.removeItem("int_key");

      // 3. Удаляем локальные картинки паспортов (если остались)
      const dirInfo = await FileSystem.getInfoAsync(imgDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(imgDir, { idempotent: true });
      }

      // 4. Выкидываем на экран логина
      setIsAuth(false);
    } catch (e) {
      console.error("Ошибка при выходе:", e);
    }
  };

  return (
    <Background>
      <TinHeader>Профиль</TinHeader>

      <View style={styles.container}>
        <Surface
          style={[styles.surface, { backgroundColor: theme.colors.surface }]}
        >
          <Header>Личный кабинет</Header>

          <View style={styles.infoBox}>
            <SmallText>Статус:</SmallText>
            <SmallText style={{ fontWeight: "bold", color: "green" }}>
              Авторизован
            </SmallText>
          </View>

          <View style={styles.infoBox}>
            <SmallText>Доступ:</SmallText>
            <SmallText style={{ fontWeight: "bold" }}>
              Сканирование документов
            </SmallText>
          </View>

          <SmallText
            style={{ textAlign: "center", marginTop: 20, marginBottom: 20 }}
          >
            Здесь вы можете управлять своей сессией. Данные паспортов не
            сохраняются на устройстве.
          </SmallText>

          <Button
            style={{ marginTop: 20 }}
            mode="elevated"
            onPress={logOutHandler}
          >
            Выйти из аккаунта
          </Button>
        </Surface>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  surface: {
    borderRadius: 25,
    width: "100%",
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
});
