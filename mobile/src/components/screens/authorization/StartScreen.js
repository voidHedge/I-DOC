import Background from "../../backgrounds/AuthorizationBack";
import Button from "../../buttons/button_001";
import Header from "../../texts/Header";
import Paragraph from "../../texts/Paragraph";

export default function StartScreen({ navigation }) {
  return (
    <Background>
      <Header>Добро пожаловать!</Header>
      <Paragraph>
        Для продолжения работы войдите или зарегистрируйтесь
      </Paragraph>

      <Button
        mode="contained"
        onPress={() => navigation.navigate("LoginScreen")}
      >
        Вход
      </Button>

      <Button
        mode="elevated"
        onPress={() => navigation.navigate("RegisterScreen")}
      >
        Создать аккаунт
      </Button>
    </Background>
  );
}
