import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import "react-native-gesture-handler";

import Ionicons from "@expo/vector-icons/Ionicons";
import ParentComponent from "../networkConnectionCheck/Network";
import ProfileScreen from "../screens/main/ProfileScreen";
import ScanScreen from "../screens/main/ScanScreen";
import { theme } from "../themes/mainTheme";

const Tab = createBottomTabNavigator();

export default function MainNavigation() {
  return (
    <ParentComponent>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: "gray",
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Сканирование"
          component={ScanScreen}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "scan" : "scan-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Настройки"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </ParentComponent>
  );
}
