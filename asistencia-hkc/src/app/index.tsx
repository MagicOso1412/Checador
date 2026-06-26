import { useEffect } from "react";
import { View } from "react-native";

import { runMigrations } from "../database/migrations";
import { seedTrabajadores } from "../database/seeds";

import CameraCapture from "../components/CameraCapture";

export default function HomeScreen() {

  useEffect(() => {

    async function init() {

      await runMigrations();
      await seedTrabajadores();

      console.log("BD lista");

    }

    init();

  }, []);

  return (
    <View style={{ flex: 1 }}>
      <CameraCapture />
    </View>
  );
}