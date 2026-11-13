import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AuthContext } from "../../api/authContext";
import { NetworkProvider } from "../networkConnectionCheck/NetworkContext";
import { theme } from "../themes/mainTheme";
import AuthNavigation from "./AuthNavigation";
import MainNavigation from "./MainNavigation";

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Ищем НАШ токен
        const dataToken = await AsyncStorage.getItem("token");
        setIsAuth(dataToken !== null);
      } catch (e) {
        console.error("Ошибка чтения токена", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NetworkProvider>
      <AuthContext.Provider value={{ isAuth, setIsAuth }}>
        <NavigationContainer>
          <Stack.Navigator>
            {isAuth ? (
              <Stack.Screen
                name="MainNav"
                component={MainNavigation}
                options={{ headerShown: false }}
              />
            ) : (
              <Stack.Screen
                name="AuthNav"
                component={AuthNavigation}
                options={{ headerShown: false }}
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    </NetworkProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
  },
});
