import React, { useEffect } from "react"
import { StyleSheet, Text, View, Dimensions } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"

const { width, height } = Dimensions.get("window")

function GeometricPattern({ delay, size, top, left, rotation }) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.5)
  const rotate = useSharedValue(0)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.12, { duration: 800 }))
    scale.value = withDelay(delay, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }))
    rotate.value = withDelay(delay, withTiming(rotation, { duration: 1200, easing: Easing.out(Easing.cubic) }))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }))

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
          borderWidth: 1.5,
          borderColor: "#C8A951",
          borderRadius: size * 0.1,
        },
        style,
      ]}
    />
  )
}

function StarPattern({ delay, size, top, left }) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.15, { duration: 600 }))
    scale.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <View style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        borderWidth: 1,
        borderColor: "#C8A951",
        borderRadius: size / 2,
      }} />
      <View style={{
        position: "absolute",
        top: size * 0.15, left: size * 0.15,
        width: size * 0.7, height: size * 0.7,
        borderWidth: 1,
        borderColor: "#C8A951",
        borderRadius: size * 0.35,
      }} />
    </Animated.View>
  )
}

export default function SplashScreen({ onFinish }) {
  const containerOpacity = useSharedValue(1)
  const outerRingScale = useSharedValue(0.6)
  const outerRingOpacity = useSharedValue(0)
  const innerRingScale = useSharedValue(0.4)
  const innerRingOpacity = useSharedValue(0)
  const titleOpacity = useSharedValue(0)
  const titleScale = useSharedValue(0.85)
  const subtitleOpacity = useSharedValue(0)
  const subtitleTranslateY = useSharedValue(15)
  const ornamentOpacity = useSharedValue(0)
  const glowOpacity = useSharedValue(0)
  const bottomTextOpacity = useSharedValue(0)
  const bottomTextTranslateY = useSharedValue(20)

  useEffect(() => {
    outerRingOpacity.value = withTiming(1, { duration: 800 })
    outerRingScale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })

    innerRingOpacity.value = withDelay(200, withTiming(1, { duration: 800 }))
    innerRingScale.value = withDelay(200, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }))

    glowOpacity.value = withDelay(300, withTiming(0.4, { duration: 1000 }))

    titleOpacity.value = withDelay(500, withTiming(1, { duration: 700 }))
    titleScale.value = withDelay(500, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }))

    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 600 }))
    subtitleTranslateY.value = withDelay(800, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }))

    ornamentOpacity.value = withDelay(600, withTiming(0.6, { duration: 800 }))

    bottomTextOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }))
    bottomTextTranslateY.value = withDelay(1000, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }))

    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 500 })
      setTimeout(onFinish, 500)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }))

  const outerRingStyle = useAnimatedStyle(() => ({
    opacity: outerRingOpacity.value,
    transform: [{ scale: outerRingScale.value }],
  }))

  const innerRingStyle = useAnimatedStyle(() => ({
    opacity: innerRingOpacity.value,
    transform: [{ scale: innerRingScale.value }],
  }))

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }))

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }))

  const ornamentStyle = useAnimatedStyle(() => ({
    opacity: ornamentOpacity.value,
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const bottomTextStyle = useAnimatedStyle(() => ({
    opacity: bottomTextOpacity.value,
    transform: [{ translateY: bottomTextTranslateY.value }],
  }))

  const ringSize = Math.min(width * 0.7, 300)

  return (
    <Animated.View style={[styles.wrapper, containerStyle]}>
      <LinearGradient
        colors={["#061210", "#0A1A17", "#0F2B23", "#0A1A17", "#061210"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <GeometricPattern delay={100} size={80} top={height * 0.08} left={width * 0.1} rotation={45} />
        <GeometricPattern delay={200} size={60} top={height * 0.12} left={width * 0.7} rotation={30} />
        <GeometricPattern delay={300} size={50} top={height * 0.75} left={width * 0.15} rotation={60} />
        <GeometricPattern delay={400} size={70} top={height * 0.8} left={width * 0.65} rotation={15} />

        <StarPattern delay={150} size={40} top={height * 0.18} left={width * 0.45} />
        <StarPattern delay={350} size={35} top={height * 0.7} left={width * 0.8} />
        <StarPattern delay={250} size={30} top={height * 0.65} left={width * 0.05} />

        <Animated.View style={[styles.glowCircle, glowStyle, { width: ringSize * 1.6, height: ringSize * 1.6 }]} />

        <View style={styles.centerContent}>
          <Animated.View style={[styles.outerRing, outerRingStyle, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
            <View style={styles.outerRingCorner1} />
            <View style={styles.outerRingCorner2} />
            <View style={styles.outerRingCorner3} />
            <View style={styles.outerRingCorner4} />
          </Animated.View>

          <Animated.View style={[styles.innerRing, innerRingStyle, { width: ringSize * 0.82, height: ringSize * 0.82, borderRadius: ringSize * 0.41 }]} />

          <View style={styles.titleContainer}>
            <Animated.View style={[styles.ornamentLine, ornamentStyle]}>
              <View style={styles.ornamentDot} />
              <View style={styles.ornamentBar} />
              <View style={styles.ornamentDiamond} />
              <View style={styles.ornamentBar} />
              <View style={styles.ornamentDot} />
            </Animated.View>

            <Animated.Text style={[styles.arabicTitle, titleStyle]}>
              القرآن الكريم
            </Animated.Text>

            <Animated.View style={[styles.ornamentLine, ornamentStyle]}>
              <View style={styles.ornamentDot} />
              <View style={styles.ornamentBar} />
              <View style={styles.ornamentDiamond} />
              <View style={styles.ornamentBar} />
              <View style={styles.ornamentDot} />
            </Animated.View>

            <Animated.Text style={[styles.subtitle, subtitleStyle]}>
              The Noble Quran
            </Animated.Text>
          </View>
        </View>

        <Animated.View style={[styles.bottomSection, bottomTextStyle]}>
          <Text style={styles.bismillah}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </Text>
          <Text style={styles.bottomEnglish}>
            In the name of Allah, the Most Gracious, the Most Merciful
          </Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  glowCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(13, 92, 77, 0.15)",
  },
  outerRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#C8A951",
  },
  outerRingCorner1: {
    position: "absolute",
    top: -4,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    backgroundColor: "#C8A951",
    borderRadius: 4,
  },
  outerRingCorner2: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    backgroundColor: "#C8A951",
    borderRadius: 4,
  },
  outerRingCorner3: {
    position: "absolute",
    left: -4,
    top: "50%",
    marginTop: -4,
    width: 8,
    height: 8,
    backgroundColor: "#C8A951",
    borderRadius: 4,
  },
  outerRingCorner4: {
    position: "absolute",
    right: -4,
    top: "50%",
    marginTop: -4,
    width: 8,
    height: 8,
    backgroundColor: "#C8A951",
    borderRadius: 4,
  },
  innerRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(200, 169, 81, 0.4)",
  },
  titleContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  arabicTitle: {
    fontSize: 44,
    color: "#C8A951",
    fontFamily: "Amiri_700Bold",
    textAlign: "center",
    textShadowColor: "rgba(200, 169, 81, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(232, 224, 212, 0.7)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 8,
  },
  ornamentLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ornamentDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#C8A951",
  },
  ornamentBar: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(200, 169, 81, 0.5)",
  },
  ornamentDiamond: {
    width: 8,
    height: 8,
    backgroundColor: "#C8A951",
    transform: [{ rotate: "45deg" }],
  },
  bottomSection: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  bismillah: {
    fontSize: 22,
    color: "rgba(200, 169, 81, 0.6)",
    fontFamily: "Amiri_400Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  bottomEnglish: {
    fontSize: 12,
    color: "rgba(232, 224, 212, 0.4)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 1,
  },
})
