import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuran } from "@/lib/quran-context";
import { useTheme } from "@/lib/theme-context";
import { getArabicNumber } from "@/lib/quran-api";

export default function BookmarksScreen() {
  const { isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark } = useQuran();

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  if (bookmarks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background, paddingTop: insets.top + webTopInset }]}>
        <Ionicons name="bookmark-outline" size={56} color="#8C7563" />
        <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
          No Bookmarks Yet
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Save your favorite ayahs to find them here
        </Text>
      </View>
    );
  }

  const renderBookmark = ({ item }) => (
    <View style={[styles.bookmarkCard, { backgroundColor: theme.border }]}>
      <View style={styles.bookmarkHeader}>
        <View style={styles.surahBadge}>
          <Text style={styles.surahBadgeText}>
            {item.surahEnglishName} :{getArabicNumber(item.numberInSurah)}
          </Text>
        </View>
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

<View style={{direction: "rtl"}}>
        <Text style={[styles.bookmarkArabic, { color: theme.arabicText }]}>{item.arabicText}</Text>

</View>
      <View style={styles.divider} />
      <Text style={[styles.translationDaily, { color: theme.translationText }]}>{item.translationText}</Text>
      <Text style={[styles.surahRef, { color: theme.textSecondary }]}>
        Surah {item.surahEnglishName} - Ayah{" "}No.{" "}
        {item.numberInSurah}
      </Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: "/surah/[id]",
            params: { id: item?.surahNumber?.toString(), ayah: item.numberInSurah },
          });
        }}
        style={({ pressed }) => [
          styles.goToSurah,
          { borderColor: theme.tint, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.goToSurahText, { color: theme.text }]}>Go to Surah</Text>
        <Ionicons name="chevron-forward" size={14} color={theme.text} />
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item?.ayahNumber?.toString()}
        renderItem={renderBookmark}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + webTopInset + 16, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>Bookmarks</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {bookmarks.length} saved {bookmarks.length === 1 ? "ayah" : "ayahs"}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  listHeader: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  bookmarkCard: {
    borderRadius: 16,
    padding: 18,
  },
  bookmarkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  bookmarkArabic: {
    fontSize: 24,
    lineHeight: 44,
    textAlign: "justify",
    fontFamily: "Amiri_400Regular",
    marginBottom: 12,
    color: "#030303",
    writingDirection: "rtl"
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
  surahBadge: {
    backgroundColor: "rgba(228,210,201,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  surahBadgeText: {
    color: "#e4d2c9",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(64,67,63,0.15)",
    marginBottom: 16,
  },
  translationDaily: {
    fontSize: 15,
    lineHeight: 24,
    color: "#40433f",
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    textAlign: "justify",
  },
  surahRef: {
    fontSize: 12,
    color: "#706c67",
    fontFamily: "Inter_400Regular",
    marginBottom: 16
  },
});
