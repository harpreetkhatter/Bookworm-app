import { Text, View } from "react-native";
import {Image} from "expo-image";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>bookworm.</Text>
      <Link href="/(auth)">Login</Link>
      <Link href="/(auth)/signup">Signup</Link>
      
    </View>
  );
}
