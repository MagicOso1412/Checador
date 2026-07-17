import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function ProyectoScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Selecciona un proyecto
      </Text>

      <Pressable
        style={styles.card}
        onPress={() => router.push("../asistencia")}
      >
        <Text>Torre Norte</Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => router.push("../asistencia")}
      >
        <Text>Torre Sur</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },

  card: {
    padding: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 15,
  },
});