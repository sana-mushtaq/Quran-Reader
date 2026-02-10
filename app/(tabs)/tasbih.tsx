import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  useColorScheme,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useTasbih, DHIKR_PHRASES, DhikrPhrase } from "@/lib/tasbih-context";

function DhikrCard({ item, isSelected, onPress, theme, isDark }: {
  item: DhikrPhrase;
  isSelected: boolean;
  onPress: () => void;
  theme: typeof Colors.light;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dhikrOption,
        {
          backgroundColor: isSelected
            ? isDark ? "rgba(46,170,138,0.2)" : "rgba(13,92,77,0.1)"
            : theme.card,
          borderColor: isSelected ? theme.tint : theme.border,
        },
      ]}
    >
      <Text style={[styles.dhikrOptionArabic, { color: isSelected ? theme.tint : theme.text }]}>
        {item.arabic}
      </Text>
      <Text style={[styles.dhikrOptionTranslit, { color: isSelected ? theme.tint : theme.textSecondary }]}>
        {item.transliteration}
      </Text>
      <Text style={[styles.dhikrOptionTarget, { color: theme.textSecondary }]}>
        Target: {item.target}
      </Text>
    </Pressable>
  );
}

export default function TasbihScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { currentDhikr, setCurrentDhikr, count, sets, totalCount, dailyCount, increment, reset } = useTasbih();
  const [showPicker, setShowPicker] = useState(false);

  const scale = useSharedValue(1);
  const counterScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCounterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(0.92, { duration: 80 }),
      withSpring(1, { duration: 200 })
    );
    counterScale.value = withSequence(
      withSpring(1.15, { duration: 100 }),
      withSpring(1, { duration: 250 })
    );
    increment();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    reset();
  };

  const progress = count / currentDhikr.target;
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              Tasbih Counter
            </Text>
            <Text style={[styles.setInfo, { color: theme.textSecondary }]}>
              Set: {sets + 1}  |  Target: {currentDhikr.target}
            </Text>
          </View>
          <Pressable onPress={() => setShowPicker(true)} hitSlop={8}>
            <Ionicons name="list" size={24} color={theme.tint} />
          </Pressable>
        </View>

        <View style={styles.dhikrDisplay}>
          <Text style={[styles.arabicText, { color: theme.accent }]}>
            {currentDhikr.arabic}
          </Text>
          <Text style={[styles.transliteration, { color: theme.textSecondary }]}>
            {currentDhikr.transliteration}
          </Text>
          <Text style={[styles.translation, { color: theme.textSecondary }]}>
            {currentDhikr.translation}
          </Text>
        </View>

        <View style={styles.counterSection}>
          <Animated.View style={animatedCounterStyle}>
            <Text style={[styles.counterText, { color: theme.accent }]}>
              {count.toString().padStart(3, "0")}
            </Text>
          </Animated.View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? "#1E3A30" : "#E5DDD0" }]}>
              <LinearGradient
                colors={["#C8A951", "#E8D98E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` }]}
              />
            </View>
          </View>
        </View>

        <Animated.View style={[styles.tapButtonContainer, animatedButtonStyle]}>
          <Pressable onPress={handleTap} style={styles.tapButtonWrapper}>
            <LinearGradient
              colors={isDark ? ["#1A4035", "#0F2B23"] : ["#0D5C4D", "#095040"]}
              style={styles.tapButton}
            >
              <View style={styles.tapButtonInner}>
                <LinearGradient
                  colors={["#C8A951", "#B89840"]}
                  style={styles.tapButtonGlow}
                >
                  <Ionicons name="finger-print" size={36} color="#fff" />
                </LinearGradient>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.tint }]}>{dailyCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.accent }]}>{sets}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sets</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.tint }]}>{totalCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
          </View>
        </View>

        <Pressable
          onPress={handleReset}
          style={[styles.resetButton, { borderColor: theme.border }]}
        >
          <Ionicons name="refresh" size={18} color={theme.textSecondary} />
          <Text style={[styles.resetText, { color: theme.textSecondary }]}>Reset Counter</Text>
        </Pressable>
      </View>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
                Select Dhikr
              </Text>
              <Pressable onPress={() => setShowPicker(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={DHIKR_PHRASES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DhikrCard
                  item={item}
                  isSelected={currentDhikr.id === item.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentDhikr(item);
                    setShowPicker(false);
                  }}
                  theme={theme}
                  isDark={isDark}
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 24, letterSpacing: -0.5 },
  setInfo: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  dhikrDisplay: { alignItems: "center", marginTop: 16, marginBottom: 8 },
  arabicText: {
    fontSize: 32,
    fontFamily: "Amiri_700Bold",
    textAlign: "center",
    lineHeight: 56,
  },
  transliteration: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  translation: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "center" },
  counterSection: { alignItems: "center", marginTop: 8 },
  counterText: {
    fontSize: 64,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 4,
  },
  progressBarContainer: { width: "70%", marginTop: 8 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  tapButtonContainer: { alignItems: "center", marginTop: 20 },
  tapButtonWrapper: { borderRadius: 60 },
  tapButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  tapButtonInner: { justifyContent: "center", alignItems: "center" },
  tapButtonGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_600SemiBold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  resetText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: { fontSize: 20 },
  dhikrOption: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  dhikrOptionArabic: {
    fontSize: 22,
    fontFamily: "Amiri_700Bold",
    textAlign: "right",
    marginBottom: 6,
  },
  dhikrOptionTranslit: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dhikrOptionTarget: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
});
