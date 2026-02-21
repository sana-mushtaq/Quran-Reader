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
import { router } from "expo-router";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { isBookmarked, toggleBookmark, playSingle, pauseAudio, resumeAudio, isPlaying, currentTrackId, isLoading } = useQuran();

  const [dailyArabic, setDailyArabic] = useState<AyahEdition | null>(null);
  const [dailyTranslation, setDailyTranslation] = useState<AyahEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDailyVerse = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchRandomAyah();
      console.log(data)
      setDailyArabic(data.arabic);
      setDailyTranslation(data.translation);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyVerse();
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

    const dateStrAr = today.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dailyTrackId = dailyArabic?.audio || null;
  const isDailyPlaying = isPlaying && currentTrackId === dailyTrackId;

  const handlePlayAudio = async () => {
    if (!dailyArabic?.audio) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isDailyPlaying) {
      await pauseAudio();
    } else if (!isPlaying && currentTrackId === dailyTrackId) {
      await resumeAudio();
    } else {
      await playSingle(dailyArabic.audio);
    }
  };

  const handleBookmark = () => {
    if (!dailyArabic || !dailyTranslation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleBookmark({
      ayahNumber: dailyArabic.number,
      surahNumber: dailyArabic.surah?.number || 1,
      surahName: dailyArabic.surah?.name || "",
      surahEnglishName: dailyArabic.surah?.englishName || "",
      arabicText: dailyArabic.text,
      translationText: dailyTranslation.text,
      numberInSurah: dailyArabic.numberInSurah,
    });
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + webTopInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>

        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
          {dateStr} {' '} {dateStrAr}
        </Text>
         <Text style={[styles.greeting, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
         Assalam o Alaikum
        </Text>
        <Text style={[styles.greeting, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
          Verse of the Day
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            Could not load the daily verse
          </Text>
          <Pressable
            onPress={loadDailyVerse}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: theme.tint, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : dailyArabic && dailyTranslation ? (
        <View>
          <LinearGradient
            colors={isDark ? ["#0F2B23", "#1A4035"] : ["#0D5C4D", "#147A64"]}
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
                    {isLoading && currentTrackId === dailyTrackId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons
                        name={isDailyPlaying ? "pause" : "play"}
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
              Surah {dailyArabic.surah?.englishName} - Ayah{" "}No.{" "}
              {dailyArabic.numberInSurah}
            </Text>
          </LinearGradient>

          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              About this Surah
            </Text>
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <InfoRow
                icon="book-outline"
                label="Surah"
                value={`${dailyArabic.surah?.englishName} (${dailyArabic.surah?.name})`}
                theme={theme}
              />
              <InfoRow
                icon="layers-outline"
                label="Verses"
                value={`${dailyArabic.surah?.numberOfAyahs}`}
                theme={theme}
              />
              <InfoRow
                icon="location-outline"
                label="Revelation"
                value={dailyArabic.surah?.revelationType || ""}
                theme={theme}
              />

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/surah/[id]",
                    params: { id: dailyArabic.numberInSurah.toString() },
                  });
                }}
                style={({ pressed }) => [
                  styles.goToSurah,
                  { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.goToSurahText, { color: theme.tint }]}>Go to Surah</Text>
                <Ionicons name="chevron-forward" size={14} color={theme.tint} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={18} color={theme.tint} />
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 26,
    letterSpacing: -0.5,
  },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  dailyCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
  },
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
  surahBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  arabicDaily: {
    fontSize: 28,
    lineHeight: 52,
    textAlign: "right",
    color: "#fff",
    fontFamily: "Amiri_400Regular",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },
  translationDaily: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  surahRef: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  infoTitle: {
    fontSize: 18,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
    textAlign: "right",
    maxWidth: "55%",
  },
    goToSurah: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    width: "90%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12
  },
  goToSurahText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
