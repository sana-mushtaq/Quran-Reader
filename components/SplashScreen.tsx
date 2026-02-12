import React, { useEffect } from "react"
import { StyleSheet, Text, View, ImageBackground, Dimensions, Image } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated"

const { width, height } = Dimensions.get("window")

export default function SplashScreen({ onFinish }) {
  
  const titleOpacity = useSharedValue(0)
  const titleTranslateY = useSharedValue(20)
  const containerOpacity = useSharedValue(1)

  useEffect(() => {
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }))
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }))

    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 400 }, () => {})
      setTimeout(onFinish, 400)
    }, 100000000)

    return () => clearTimeout(timer)
  }, [])

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }))

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }))
return (
  <Animated.View style={[styles.wrapper, containerStyle]}>
    <ImageBackground
      source={require("../assets/images/bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Soft color overlay */}
      <View style={styles.overlay} />

      {/* Center Image */}
      <View style={styles.centerImageWrapper}>
        <Image
          source={require("../assets/images/quran-text.svg")}
          style={styles.centerImage}
          resizeMode="contain"
        />
      </View>
    </ImageBackground>
  </Animated.View>
)

}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  container: {
    width: "100%",
    height: "100%", // ensures full screen
    justifyContent: "center",
    alignItems: "center",
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
   // Wrapper keeps the image perfectly centered
  centerImageWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [
      { translateX: -75 },
      { translateY: -75 }
    ]
  },

  // Adjust size as needed
  centerImage: {
    width: 150,
    height: 150
  },
  overlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(10, 26, 23, 0.5)" // dark green tint
}

})
