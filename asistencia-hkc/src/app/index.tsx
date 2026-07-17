import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        HKC Attendance
      </Text>

      <Text style={styles.subtitle}>
        Sistema de asistencia
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("../proyecto")}
      >
        <Text style={styles.buttonText}>
          Iniciar
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    marginBottom: 40,
  },

  button: {
    backgroundColor: "#0057B8",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});