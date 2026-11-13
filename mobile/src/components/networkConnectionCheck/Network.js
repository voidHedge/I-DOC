import NetInfo from "@react-native-community/netinfo";
import { useContext, useEffect, useState } from "react";
import { View } from "react-native";
import { NetworkContext } from "./NetworkContext";
import NoInternet from "./NoInternet";

const ParentComponent = ({ children }) => {
  const [isOffline, setOfflineStatus] = useState(false);
  const { setIsConnected } = useContext(NetworkContext);

  useEffect(() => {
    const removeNetInfoSubscription = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable);
      setOfflineStatus(offline);
      setIsConnected(!offline);
    });
    return () => removeNetInfoSubscription();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {isOffline && <NoInternet />}
      {children}
    </View>
  );
};

export default ParentComponent;
