import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  useColorScheme,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useQuran } from "@/lib/quran-context";
import { getArabicNumber } from "@/lib/quran-api";
import {
  getAllHadiths,
  getDailyHadith,
  getRandomHadith,
  getHadithFavorites,
  toggleHadithFavorite,
  Hadith,
} from "@/lib/hadith-api";

type Section = "hadith" | "bookmarks";

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark } = useQuran();
  const [activeSection, setActiveSection] = useState<Section>("hadith");
  const [hadithFavorites, setHadithFavorites] = useState<number[]>([]);
  const [expandedHadith, setExpandedHadith] = useState<number | null>(null);

  const allHadiths = getAllHadiths();
  const dailyHadith = getDailyHadith();

  useEffect(() => {
    getHadithFavorites().then(setHadithFavorites);
  }, []);

  const handleToggleHadithFav = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await toggleHadithFavorite(id);
    setHadithFavorites(updated);
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const renderHadith = useCallback(({ item }: { item: Hadith }) => {
    const isExpanded = expandedHadith === item.id;
    const isFav = hadithFavorites.includes(item.id);
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpandedHadith(isExpanded ? null : item.id);
        }}
        style={[styles.hadithCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={styles.hadithHeader}>
          <View style={[styles.hadithBadge, { backgroundColor: isDark ? "rgba(46,170,138,0.15)" : "rgba(13,92,77,0.08)" }]}>
            <Text style={[styles.hadithBadgeText, { color: theme.tint }]}>{item.id}</Text>
          </View>
          <View style={styles.hadithMeta}>
            <Text style={[styles.hadithCollection, { color: theme.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
              {item.collection}
            </Text>
            <Text style={[styles.hadithNarrator, { color: theme.textSecondary }]}>
              {item.narrator}
            </Text>
          </View>
          <Pressable onPress={() => handleToggleHadithFav(item.id)} hitSlop={8}>
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={20}
              color={isFav ? "#E85D5D" : theme.textSecondary}
            />
          </Pressable>
        </View>

        <Text
          style={[styles.hadithArabic, { color: theme.arabicText }]}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.arabic}
        </Text>
        <Text
          style={[styles.hadithEnglish, { color: theme.translationText }]}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {item.english}
        </Text>

        {!isExpanded ? (
          <Text style={[styles.readMore, { color: theme.tint }]}>Read more</Text>
        ) : null}
      </Pressable>
    );
  }, [expandedHadith, hadithFavorites, theme, isDark]);

  const renderBookmark = useCallback(({ item }: { item: typeof bookmarks[0] }) => (
    <View style={[styles.bookmarkCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.bookmarkHeader}>
        <Text style={[styles.bookmarkBadgeText, { color: theme.tint }]}>
          {item.surahEnglishName} : {item.numberInSurah}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleBookmark(item);
          }}
          hitSlop={8}
        >
          <Ionicons name="bookmark" size={20} color={theme.accent} />
        </Pressable>
      </View>
      <Text style={[styles.bookmarkArabic, { color: theme.arabicText }]}>{item.arabicText}</Text>
      <Text style={[styles.bookmarkTranslation, { color: theme.translationText }]}>
        {item.translationText}
      </Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/surah/[id]", params: { id: item.surahNumber.toString() } });
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
  ), [theme, bookmarks, toggleBookmark]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top + webTopInset + 16, paddingHorizontal: 20 }}>
        <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
          More
        </Text>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveSection("hadith")}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeSection === "hadith" ? theme.tint : theme.card,
                borderColor: activeSection === "hadith" ? theme.tint : theme.border,
              },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={16}
              color={activeSection === "hadith" ? "#fff" : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: activeSection === "hadith" ? "#fff" : theme.textSecondary },
              ]}
            >
              Hadith
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveSection("bookmarks")}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeSection === "bookmarks" ? theme.tint : theme.card,
                borderColor: activeSection === "bookmarks" ? theme.tint : theme.border,
              },
            ]}
          >
            <Ionicons
              name="bookmark-outline"
              size={16}
              color={activeSection === "bookmarks" ? "#fff" : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: activeSection === "bookmarks" ? "#fff" : theme.textSecondary },
              ]}
            >
              Bookmarks ({bookmarks.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {activeSection === "hadith" ? (
        <FlatList
          data={allHadiths}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderHadith}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <LinearGradient
              colors={isDark ? ["#1A3A2E", "#0F2B23"] : ["#147A64", "#0D5C4D"]}
              style={styles.dailyHadithCard}
            >
              <View style={styles.dailyBadge}>
                <Ionicons name="star" size={12} color="#C8A951" />
                <Text style={styles.dailyBadgeText}>Hadith of the Day</Text>
              </View>
              <Text style={styles.dailyHadithArabic}>{dailyHadith.arabic}</Text>
              <View style={styles.dailyDivider} />
              <Text style={styles.dailyHadithEnglish}>{dailyHadith.english}</Text>
              <Text style={styles.dailyHadithRef}>
                {dailyHadith.collection} - Narrated by {dailyHadith.narrator}
              </Text>
            </LinearGradient>
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      ) : bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
            No Bookmarks Yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Save your favorite ayahs to find them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.ayahNumber.toString()}
          renderItem={renderBookmark}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, letterSpacing: -0.5 },
  tabRow: { flexDirection: "row", gap: 10, marginTop: 14, marginBottom: 8 },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dailyHadithCard: { borderRadius: 20, padding: 20, marginBottom: 16, marginTop: 8 },
  dailyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(200,169,81,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  dailyBadgeText: { color: "#C8A951", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  dailyHadithArabic: {
    fontSize: 22,
    lineHeight: 40,
    textAlign: "right",
    color: "#fff",
    fontFamily: "Amiri_400Regular",
    marginBottom: 12,
  },
  dailyDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 12 },
  dailyHadithEnglish: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  dailyHadithRef: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  hadithCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  hadithHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  hadithBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  hadithBadgeText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hadithMeta: { flex: 1, marginLeft: 12 },
  hadithCollection: { fontSize: 14 },
  hadithNarrator: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  hadithArabic: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: "right",
    fontFamily: "Amiri_400Regular",
    marginBottom: 8,
  },
  hadithEnglish: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  readMore: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 20 },
  bookmarkCard: { borderRadius: 16, borderWidth: 1, padding: 18 },
  bookmarkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  bookmarkBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  bookmarkArabic: {
    fontSize: 24,
    lineHeight: 44,
    textAlign: "right",
    fontFamily: "Amiri_400Regular",
    marginBottom: 12,
  },
  bookmarkTranslation: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginBottom: 14 },
  goToSurah: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  goToSurahText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
