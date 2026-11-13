import axios from "axios";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";

import { config } from "../../../../config";
import { nameValidator } from "../../../helpers/nameValidator";
import { passwordValidator } from "../../../helpers/passwordValidator";
import Background from "../../backgrounds/AuthorizationBack";
import Button from "../../buttons/button_001";
import TextInput from "../../inputs/AuthTextInput";
import Header from "../../texts/Header";
import { theme } from "../../themes/mainTheme";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [isLoading, setIsLoading] = useState(false);

  const onRegister = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username.value);
      formData.append("password", password.value);

      // Обращаемся к новому мобильному эндпоинту
      await axios.post(`${config.backendUrl}/auth/mobile/register`, formData, {
        timeout: 10000,
      });

      // Если регистрация успешна — отправляем на экран логина
      navigation.navigate("LoginScreen");
    } catch (error) {
      console.error("Ошибка регистрации:", error.message);

      let errorMsg = "Ошибка соединения с сервером";
      if (error.response?.data?.detail) {
        // FastAPI возвращает detail (например, "Пароль слишком короткий")
        errorMsg = error.response.data.detail;
      } else if (error.code === "ECONNABORTED") {
        errorMsg = "Превышено время ожидания.";
      } else if (error.message === "Network Error") {
        errorMsg = "Не удалось подключиться к серверу.";
      }

      setPassword({ ...password, error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpPressed = () => {
    const usernameError = nameValidator(username.value);
    const passwordError = passwordValidator(password.value);

    if (usernameError || passwordError) {
      setUsername({ ...username, error: usernameError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    onRegister();
  };

  return (
    <Background>
      <Header>Регистрация</Header>

      <TextInput
        label="Логин"
        returnKeyType="next"
        value={username.value}
        onChangeText={(text) => setUsername({ value: text, error: "" })}
        error={!!username.error}
        errorText={username.error}
        autoCapitalize="none"
      />

      <TextInput
        label="Пароль (мин. 6 символов)"
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
        onPress={onSignUpPressed}
        style={{ marginTop: 24 }}
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? "Регистрация..." : "Создать аккаунт"}
      </Button>

      <View style={styles.row}>
        <Text>Уже есть аккаунт? </Text>
        <TouchableOpacity onPress={() => navigation.replace("LoginScreen")}>
          <Text style={styles.link}>Войти</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
});
