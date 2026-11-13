import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useContext, useState } from "react";
import { StyleSheet } from "react-native";
import { Surface } from "react-native-paper";

import { config } from "../../../../config";
import { AuthContext } from "../../../api/authContext";
import { nameValidator } from "../../../helpers/nameValidator";
import { passwordValidator } from "../../../helpers/passwordValidator";
import Background from "../../backgrounds/AuthorizationBack";
import Button from "../../buttons/button_001";
import TextInput from "../../inputs/AuthTextInput";
import Header from "../../texts/Header";
import SmallText from "../../texts/SmallText";
import TinHeader from "../../texts/TinHeader";
import { theme } from "../../themes/mainTheme";

export default function LoginScreen({ navigation }) {
  const [login, setlogin] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { setIsAuth } = useContext(AuthContext);

  const Send = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", login.value);
      formData.append("password", password.value);

      // Обращаемся к новому мобильному эндпоинту
      const response = await axios.post(
        `${config.backendUrl}/auth/mobile/login`,
        formData,
        {
          timeout: 10000,
        },
      );

      if (response.data.access_token) {
        await AsyncStorage.setItem("token", response.data.access_token);
        setIsAuth(true);
      }
    } catch (error) {
      console.error("Ошибка логина:", error.message);

      let errorMsg = "Ошибка соединения с сервером";
      if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (error.code === "ECONNABORTED") {
        errorMsg = "Превышено время ожидания.";
      } else if (error.message === "Network Error") {
        errorMsg = "Не удалось подключиться к серверу.";
      }

      setlogin({ ...login, error: " " });
      setPassword({ ...password, error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const onLoginPressed = async () => {
    const loginError = nameValidator(login.value);
    const passwordError = passwordValidator(password.value);

    if (loginError || passwordError) {
      setlogin({ ...login, error: loginError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    Send();
  };

  return (
    <Background>
      <TinHeader>I-DOC</TinHeader>
      <Surface
        style={[styles.surface, { backgroundColor: theme.colors.surface }]}
      >
        <Header>Войдите в личный</Header>
        <Header>кабинет</Header>
        <SmallText>Введите ваш логин и пароль</SmallText>

        <TextInput
          label="Логин"
          returnKeyType="next"
          value={login.value}
          onChangeText={(text) => setlogin({ value: text, error: "" })}
          error={!!login.error}
          errorText={login.error}
          keyboardType="default"
          autoCapitalize="none"
        />

        <TextInput
          label="Пароль"
          returnKeyType="done"
          value={password.value}
          onChangeText={(text) => setPassword({ value: text, error: "" })}
          error={!!password.error}
          errorText={password.error}
          secureTextEntry
          autoCapitalize="none"
        />

        <Button
          mode="contained"
          onPress={onLoginPressed}
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? "Вход..." : "Войти"}
        </Button>
      </Surface>
    </Background>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 25,
    width: "100%",
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
  },
});
