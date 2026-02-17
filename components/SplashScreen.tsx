import React, { useEffect } from "react"
import { StyleSheet, ImageBackground, Image } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated"

export default function SplashScreen({ onFinish }) {

  const containerOpacity = useSharedValue(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 400 })
      setTimeout(onFinish, 400)
    }, 2200)

    return () => clearTimeout(timer)
  }, [])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }))

  return (
    <Animated.View style={[styles.wrapper, containerStyle]}>

      {/* GIF background */}
      <ImageBackground
        source={require("../assets/images/splash-screen.gif")}
        style={styles.container}
        
      >
      
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
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  centerImage: {
    width: 150,
    height: 150,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [
      { translateX: -75 },
      { translateY: -75 }
    ],
  },
})
