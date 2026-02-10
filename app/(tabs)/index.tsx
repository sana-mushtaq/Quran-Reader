import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { fetchRandomAyah, AyahEdition, getArabicNumber } from "@/lib/quran-api";
import { useQuran } from "@/lib/quran-context";
import {
  fetchPrayerTimes,
  getSavedLocation,
  PrayerTimings,
  PrayerLocation,
  formatTime12h,
  getNextPrayer,
  PRAYER_ICONS,
} from "@/lib/prayer-times";

const PRAYER_NAMES = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { isBookmarked, toggleBookmark, playAudio, pauseAudio, isPlaying, currentAudio, isLoading } = useQuran();

  const dailyData = fetchRandomAyah();
  const dailyArabic = dailyData.arabic;
  const dailyTranslation = dailyData.translation;

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimings | null>(null);
  const [prayerLocation, setPrayerLocation] = useState<PrayerLocation | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);

  const loadPrayerTimes = async () => {
    setPrayerLoading(true);
    try {
      const loc = await getSavedLocation();
      setPrayerLocation(loc);
      const times = await fetchPrayerTimes(loc);
      setPrayerTimes(times);
    } catch {}
    setPrayerLoading(false);
  };

  useEffect(() => {
    loadPrayerTimes();
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePlayAudio = async () => {
    if (!dailyArabic?.audio) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying && currentAudio === dailyArabic.audio) {
      await pauseAudio();
    } else {
      await playAudio(dailyArabic.audio);
    }
  };

  const handleBookmark = () => {
    if (!dailyArabic || !dailyTranslation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleBookmark({
      ayahNumber: dailyArabic.number,
      surahNumber: dailyArabic.surah?.number || 0,
      surahName: dailyArabic.surah?.name || "",
      surahEnglishName: dailyArabic.surah?.englishName || "",
      arabicText: dailyArabic.text,
      translationText: dailyTranslation.text,
      numberInSurah: dailyArabic.numberInSurah,
    });
  };

  const nextPrayer = prayerTimes ? getNextPrayer(prayerTimes) : null;
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + webTopInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>{dateStr}</Text>
        {prayerTimes ? (
          <Text style={[styles.hijriDate, { color: theme.accent }]}>
            {prayerTimes.hijriDate}
          </Text>
        ) : null}
        <Text style={[styles.greeting, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
          Assalamu Alaikum
        </Text>
      </View>

      {!prayerLoading && prayerTimes ? (
        <View style={styles.prayerSection}>
          <LinearGradient
            colors={isDark ? ["#0F2B23", "#1A4035", "#0F2B23"] : ["#0D5C4D", "#147A64", "#0D5C4D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.prayerCard}
          >
            <View style={styles.prayerHeader}>
              <View>
                <Text style={styles.prayerTitle}>Namaz Timings</Text>
                {prayerLocation ? (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.locationText}>
                      {prayerLocation.city}, {prayerLocation.country}
                    </Text>
                  </View>
                ) : null}
              </View>
              {nextPrayer ? (
                <View style={styles.nextPrayerBadge}>
                  <Text style={styles.nextPrayerLabel}>Next</Text>
                  <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
                  <Text style={styles.nextPrayerTime}>{formatTime12h(nextPrayer.time)}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.prayerGrid}>
              {PRAYER_NAMES.map((name) => {
                const time = prayerTimes[name];
                const isNext = nextPrayer?.name === name;
                return (
                  <View
                    key={name}
                    style={[
                      styles.prayerItem,
                      isNext && styles.prayerItemActive,
                    ]}
                  >
                    <Ionicons
                      name={PRAYER_ICONS[name] as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={isNext ? "#C8A951" : "rgba(255,255,255,0.7)"}
                    />
                    <Text style={[styles.prayerTime, isNext && styles.prayerTimeActive]}>
                      {formatTime12h(time)}
                    </Text>
                    <Text style={[styles.prayerName, isNext && styles.prayerNameActive]}>
                      {name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>
        </View>
      ) : prayerLoading ? (
        <View style={styles.prayerLoadingContainer}>
          <ActivityIndicator size="small" color={theme.tint} />
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
          Verse of the Day
        </Text>
      </View>

      <View>
        <LinearGradient
            colors={isDark ? ["#1A3A2E", "#0F2B23"] : ["#147A64", "#0D5C4D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dailyCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.surahBadge}>
                <Text style={styles.surahBadgeText}>
                  {dailyArabic.surah?.englishName} {getArabicNumber(dailyArabic.numberInSurah)}
                </Text>
              </View>
              <View style={styles.cardActions}>
                {dailyArabic.audio ? (
                  <Pressable onPress={handlePlayAudio} hitSlop={8}>
                    {isLoading && currentAudio === dailyArabic.audio ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons
                        name={isPlaying && currentAudio === dailyArabic.audio ? "pause" : "play"}
                        size={22}
                        color="#fff"
                      />
                    )}
                  </Pressable>
                ) : null}
                <Pressable onPress={handleBookmark} hitSlop={8}>
                  <Ionicons
                    name={isBookmarked(dailyArabic.number) ? "bookmark" : "bookmark-outline"}
                    size={20}
                    color="#fff"
                  />
                </Pressable>
              </View>
            </View>

            <Text style={styles.arabicDaily}>{dailyArabic.text}</Text>
            <View style={styles.divider} />
            <Text style={styles.translationDaily}>{dailyTranslation.text}</Text>
            <Text style={styles.surahRef}>
              Surah {dailyArabic.surah?.englishName} ({dailyArabic.surah?.englishNameTranslation}) - Ayah{" "}
              {dailyArabic.numberInSurah}
            </Text>
          </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  dateText: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  hijriDate: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  greeting: { fontSize: 26, letterSpacing: -0.5 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionTitle: { fontSize: 18, letterSpacing: -0.3 },
  prayerSection: { paddingHorizontal: 16, marginTop: 16 },
  prayerLoadingContainer: { height: 60, justifyContent: "center", alignItems: "center" },
  prayerCard: { borderRadius: 20, padding: 20 },
  prayerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  prayerTitle: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular" },
  nextPrayerBadge: {
    backgroundColor: "rgba(200,169,81,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  nextPrayerLabel: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "Inter_400Regular" },
  nextPrayerName: { color: "#C8A951", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  nextPrayerTime: { color: "#C8A951", fontSize: 11, fontFamily: "Inter_400Regular" },
  prayerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  prayerItem: {
    alignItems: "center",
    width: "16%",
    paddingVertical: 10,
    borderRadius: 12,
  },
  prayerItemActive: {
    backgroundColor: "rgba(200,169,81,0.15)",
  },
  prayerTime: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginTop: 6,
  },
  prayerTimeActive: { color: "#C8A951" },
  prayerName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  prayerNameActive: { color: "#C8A951" },
  dailyCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 24 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  surahBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  surahBadgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  cardActions: { flexDirection: "row", gap: 16, alignItems: "center" },
  arabicDaily: {
    fontSize: 28,
    lineHeight: 52,
    textAlign: "right",
    color: "#fff",
    fontFamily: "Amiri_400Regular",
    marginBottom: 16,
  },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 16 },
  translationDaily: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  surahRef: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
});
