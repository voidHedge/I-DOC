import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ParentComponent from "../networkConnectionCheck/Network";
import LoginScreen from "../screens/authorization/LoginScreen";
import RegisterScreen from "../screens/authorization/RegisterScreen";
import StartScreen from "../screens/authorization/StartScreen";

const Stack = createNativeStackNavigator();

// Навигация между экранами Авторизации

const AuthNavigation = () => {
  return (
    <ParentComponent>
      {/* Приложение стартует с экрана приветствия */}
      <Stack.Navigator initialRouteName="StartScreen">
        <Stack.Screen
          name="StartScreen"
          component={StartScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </ParentComponent>
  );
};

export default AuthNavigation;
