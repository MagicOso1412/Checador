import { useEffect, useRef, type ReactNode } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

/**
 * Reemplazo seguro de la clase `animate-ping` de Tailwind/NativeWind: un anillo que se
 * expande y desvanece en bucle. Implementado con `Animated` de react-native (no con
 * className) porque las animaciones de NativeWind (`animate-*`) pueden disparar el error
 * "Couldn't find a navigation context" al usarse junto con Expo Router.
 */
export function PulsingRing({
  color,
  style,
  borderRadius,
}: {
  color: string;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          borderWidth: 2,
          borderColor: color,
          borderRadius,
          transform: [{ scale }],
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Reemplazo seguro de la clase `animate-pulse` de Tailwind/NativeWind: hace parpadear la
 * opacidad del contenido en bucle. Ver nota de `PulsingRing` sobre por qué no se usa
 * className para esto.
 */
export function PulsingOpacity({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.35, duration: 650, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return <Animated.View style={[{ opacity: anim }, style]}>{children}</Animated.View>;
}
