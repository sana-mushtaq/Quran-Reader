import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { fetchSurahArabic, fetchSurahTranslation, AyahEdition, getArabicNumber } from "@/lib/quran-api";
import { useQuran } from "@/lib/quran-context";

interface CombinedAyah {
  number: number;
  numberInSurah: number;
  arabicText: string;
  translationText: string;
  audio?: string;
}

export default function SurahDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { isBookmarked, toggleBookmark, playAudio, pauseAudio, isPlaying, currentAudio, isLoading } = useQuran();

  const surahNumber = parseInt(id || "1", 10);

  const { ayahs, surahName, surahArabicName, surahEnglishName } = useMemo(() => {
    const arabicData = fetchSurahArabic(surahNumber);
    const translationData = fetchSurahTranslation(surahNumber);

    const name = arabicData.length > 0 && arabicData[0].surah
      ? arabicData[0].surah.englishNameTranslation : "";
    const arabicName = arabicData.length > 0 && arabicData[0].surah
      ? arabicData[0].surah.name : "";
    const englishName = arabicData.length > 0 && arabicData[0].surah
      ? arabicData[0].surah.englishName : "";

    const combined: CombinedAyah[] = arabicData.map((a, i) => ({
      number: a.number,
      numberInSurah: a.numberInSurah,
      arabicText: a.text,
      translationText: translationData[i]?.text || "",
      audio: a.audio,
    }));

    return { ayahs: combined, surahName: name, surahArabicName: arabicName, surahEnglishName: englishName };
  }, [surahNumber]);

  const handlePlay = useCallback(
    async (audioUrl: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isPlaying && currentAudio === audioUrl) {
        await pauseAudio();
      } else {
        await playAudio(audioUrl);
      }
    },
    [isPlaying, currentAudio, playAudio, pauseAudio]
  );

  const handleBookmark = useCallback(
    (ayah: CombinedAyah) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleBookmark({
        ayahNumber: ayah.number,
        surahNumber,
        surahName: surahArabicName,
        surahEnglishName,
        arabicText: ayah.arabicText,
        translationText: ayah.translationText,
        numberInSurah: ayah.numberInSurah,
      });
    },
    [surahNumber, surahArabicName, surahEnglishName, toggleBookmark]
  );

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const renderAyah = ({ item }: { item: CombinedAyah }) => (
    <AyahCard
      ayah={item}
      theme={theme}
      isDark={isDark}
      isBookmarked={isBookmarked(item.number)}
      isCurrentPlaying={isPlaying && currentAudio === item.audio}
      isCurrentLoading={isLoading && currentAudio === item.audio}
      onPlay={handlePlay}
      onBookmark={handleBookmark}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
            {surahEnglishName}
          </Text>
          <Text style={[styles.topBarSubtitle, { color: theme.textSecondary }]}>{surahName}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={ayahs}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderAyah}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          surahNumber !== 9 ? (
            <View style={styles.bismillah}>
              <Text style={[styles.bismillahText, { color: theme.tint }]}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
      />
    </View>
  );
}

function AyahCard({
  ayah,
  theme,
  isDark,
  isBookmarked,
  isCurrentPlaying,
  isCurrentLoading,
  onPlay,
  onBookmark,
}: {
  ayah: CombinedAyah;
  theme: typeof Colors.light;
  isDark: boolean;
  isBookmarked: boolean;
  isCurrentPlaying: boolean;
  isCurrentLoading: boolean;
  onPlay: (url: string) => void;
  onBookmark: (ayah: CombinedAyah) => void;
}) {
  return (
    <View style={[styles.ayahCard, { backgroundColor: theme.ayahBg, borderColor: theme.border }]}>
      <View style={styles.ayahHeader}>
        <View
          style={[
            styles.verseNumBadge,
            { backgroundColor: isDark ? "rgba(46,170,138,0.12)" : "rgba(13,92,77,0.08)" },
          ]}
        >
          <Text style={[styles.verseNumText, { color: theme.verseNumber }]}>{ayah.numberInSurah}</Text>
        </View>
        <View style={styles.ayahActions}>
          {ayah.audio ? (
            <Pressable onPress={() => onPlay(ayah.audio!)} hitSlop={8}>
              {isCurrentLoading ? (
                <ActivityIndicator size="small" color={theme.tint} />
              ) : (
                <Ionicons
                  name={isCurrentPlaying ? "pause-circle" : "play-circle"}
                  size={26}
                  color={theme.tint}
                />
              )}
            </Pressable>
          ) : null}
          <Pressable onPress={() => onBookmark(ayah)} hitSlop={8}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isBookmarked ? theme.accent : theme.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.ayahArabic, { color: theme.arabicText }]}>{ayah.arabicText}</Text>

      <Text style={[styles.ayahTranslation, { color: theme.translationText }]}>{ayah.translationText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 17,
  },
  topBarSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  bismillah: {
    alignItems: "center",
    paddingVertical: 24,
  },
  bismillahText: {
    fontSize: 26,
    fontFamily: "Amiri_400Regular",
  },
  ayahCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  ayahHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  verseNumBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  verseNumText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  ayahActions: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  ayahArabic: {
    fontSize: 24,
    lineHeight: 46,
    textAlign: "right",
    fontFamily: "Amiri_400Regular",
    marginBottom: 12,
  },
  ayahTranslation: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
});
