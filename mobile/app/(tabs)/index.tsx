import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧬 Learning DNA</Text>

      <Text style={styles.subtitle}>
        Your Adaptive AI Study Companion
      </Text>

      <Text style={styles.description}>
        The mobile application has been successfully initialized.
      </Text>

      <Text style={styles.description}>
        Learning DNA is ready for development.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
  },

  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
});