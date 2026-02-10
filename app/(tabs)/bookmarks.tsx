import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useQuran } from "@/lib/quran-context";
import { getArabicNumber } from "@/lib/quran-api";

export default function BookmarksScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark } = useQuran();

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  if (bookmarks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background, paddingTop: insets.top + webTopInset }]}>
        <Ionicons name="bookmark-outline" size={56} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
          No Bookmarks Yet
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Save your favorite ayahs to find them here
        </Text>
      </View>
    );
  }

  const renderBookmark = ({ item }: { item: typeof bookmarks[0] }) => (
    <View style={[styles.bookmarkCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.bookmarkHeader}>
        <View style={styles.bookmarkBadge}>
          <Text style={[styles.bookmarkBadgeText, { color: theme.tint }]}>
            {item.surahEnglishName} : {item.numberInSurah}
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

      <Text style={[styles.bookmarkArabic, { color: theme.arabicText }]}>{item.arabicText}</Text>

      <Text style={[styles.bookmarkTranslation, { color: theme.translationText }]}>
        {item.translationText}
      </Text>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: "/surah/[id]",
            params: { id: item.surahNumber.toString() },
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
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.ayahNumber.toString()}
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
    borderWidth: 1,
    padding: 18,
  },
  bookmarkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  bookmarkBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookmarkBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  bookmarkArabic: {
    fontSize: 24,
    lineHeight: 44,
    textAlign: "right",
    fontFamily: "Amiri_400Regular",
    marginBottom: 12,
  },
  bookmarkTranslation: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  goToSurah: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  goToSurahText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
