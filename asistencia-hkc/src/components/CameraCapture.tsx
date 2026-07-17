import { useRef, useState } from "react";
import {
  View,
  Button,
  Text,
  Image,
  StyleSheet,
} from "react-native";

import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";

import { savePhoto } from "../services/cameraService";

export default function CameraCapture() {

  const [permission, requestPermission] =
    useCameraPermissions();

  const [photoUri, setPhotoUri] =
    useState<string | null>(null);

  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Cargando permisos...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>
          Se necesita acceso a la cámara
        </Text>

        <Button
          title="Permitir cámara"
          onPress={requestPermission}
        />
      </View>
    );
  }

  async function capturePhoto() {

    try {

      if (!cameraRef.current) {
        console.log("CameraRef vacío");
        return;
      }

      const photo =
        await cameraRef.current.takePictureAsync();

      console.log("Foto temporal:");

      console.log(photo.uri);

      const savedPhoto =
        await savePhoto(photo.uri);

      console.log("Foto guardada:");

      console.log(savedPhoto);

      setPhotoUri(savedPhoto.uri);

    } catch (error) {

      console.error(error);

    }

  }

  return (
    <View style={styles.container}>

      {!photoUri ? (

        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        />

      ) : (

        <Image
          source={{ uri: photoUri }}
          style={styles.preview}
        />

      )}

      <View style={styles.buttonContainer}>

        <Button
          title="Capturar"
          onPress={capturePhoto}
        />

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  camera: {
    flex: 1,
  },

  preview: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },

  buttonContainer: {
    padding: 20,
  },

});