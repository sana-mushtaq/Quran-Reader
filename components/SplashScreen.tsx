import React, { useEffect } from "react";
import { StyleSheet, Text, View, Image, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.6);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    iconOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    iconScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.2)) });

    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 400 }, () => {});
      setTimeout(onFinish, 400);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.wrapper, containerStyle]}>
      <LinearGradient
        colors={["#0A1A17", "#0D5C4D", "#0A1A17"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.arabicTitle}>القرآن الكريم</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 28,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  titleContainer: {
    alignItems: "center",
  },
  arabicTitle: {
    fontSize: 36,
    color: "#C8A951",
    fontFamily: "Amiri_700Bold",
    letterSpacing: 2,
  },
});
