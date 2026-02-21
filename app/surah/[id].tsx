import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { fetchSurahArabic, fetchSurahTranslation, fetchSurahs, AyahEdition, getArabicNumber, getLocalAudioUri } from "@/lib/quran-api";
import { useQuran, AudioTrack } from "@/lib/quran-context";
import { useDownload } from "@/lib/download-context";

//surah detail screen

export default function SurahDetailScreen() {

  //get the surah id 
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();

  //dark
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  //check if ayah is bookmarked , playing, states
  const {
    isBookmarked, toggleBookmark,
    playQueue, pauseAudio, resumeAudio, stopAudio,
    skipNext, skipPrev,
    isPlaying, currentTrackId, isLoading,
    currentAyahInSurah, totalTracksInQueue, queueIndex,
  } = useQuran();
  const { surahStatus, downloadSurah } = useDownload();

  //list for aayah
  const flatListRef = useRef(null);

  const [ayahs, setAyahs] = useState([]);
  const [surahName, setSurahName] = useState("");
  const [surahArabicName, setSurahArabicName] = useState("");
  const [surahEnglishName, setSurahEnglishName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const surahNumber = parseInt(id || "1", 10);
  const isDownloaded = surahStatus[surahNumber] === "downloaded";
  const isDownloading = surahStatus[surahNumber] === "downloading";

  const loadSurah = async () => {
    setLoading(true);
    setError(false);
    try {
      const [arabicData, translationData] = await Promise.all([
        fetchSurahArabic(surahNumber),
        fetchSurahTranslation(surahNumber),
      ]);

      if (arabicData.length > 0 && arabicData[0].surah) {
        setSurahName(arabicData[0].surah.englishNameTranslation);
        setSurahArabicName(arabicData[0].surah.name);
        setSurahEnglishName(arabicData[0].surah.englishName);
      } else {
        const surahs = await fetchSurahs();
        const surahInfo = surahs.find((s) => s.number === surahNumber);
        if (surahInfo) {
          setSurahName(surahInfo.englishNameTranslation);
          setSurahArabicName(surahInfo.name);
          setSurahEnglishName(surahInfo.englishName);
        }
      }


      const combined = arabicData.map((a, i) => {
        const localUri = getLocalAudioUri(surahNumber, a.numberInSurah);
        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          arabicText: a.text,
          translationText: translationData[i]?.text || "",
          audio: a.audio,
          localAudio: localUri || undefined,
        };
      });

      if(surahNumber!==1) {
        combined[0].arabicText = combined[0].arabicText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ","")     
      }
      setAyahs(combined);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurah();
    return () => {
      stopAudio();
    };
  }, [surahNumber]);

  const buildTracks = useCallback(() => {
    return ayahs
      .filter((a) => a.localAudio || a.audio)
      .map((a) => ({
        id: `${surahNumber}_${a.numberInSurah}`,
        uri: a.localAudio || a.audio,
        ayahNumberInSurah: a.numberInSurah,
      }));
  }, [ayahs, surahNumber]);

  const handlePlayFromStart = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const tracks = buildTracks();
    if (tracks.length > 0) {
      await playQueue(tracks, 0);
    }
  }, [buildTracks, playQueue]);

  const handlePlayFromHere = useCallback(async (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tracks = buildTracks();
    const startIdx = tracks.findIndex((t) => t.ayahNumberInSurah === ayah.numberInSurah);
    if (startIdx >= 0) {
      await playQueue(tracks, startIdx);
    }
  }, [buildTracks, playQueue]);

  const handlePauseResume = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      isThisSurahPlaying = false
      await pauseAudio();
    } else {
      await resumeAudio();
    }
  }, [isPlaying, pauseAudio, resumeAudio]);

  const handleBookmark = useCallback(
    (ayah) => {
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

  const handleDownload = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await downloadSurah(surahNumber);
    loadSurah();
  }, [surahNumber, downloadSurah]);

  const isQueueActive = totalTracksInQueue > 1 || (totalTracksInQueue === 1 && currentTrackId !== null);
  let isThisSurahPlaying = currentTrackId?.startsWith(`${surahNumber}_`) ?? false;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const renderAyah = ({ item }) => {
    const trackId = `${surahNumber}_${item.numberInSurah}`;
    const isThisPlaying = currentTrackId === trackId && isPlaying;
    const isThisLoading = currentTrackId === trackId && isLoading;

    return (
      <AyahCard
        ayah={item}
        theme={theme}
        isDark={isDark}
        isBookmarked={isBookmarked(item.number)}
        isCurrentPlaying={isThisPlaying}
        isCurrentLoading={isThisLoading}
        onPlayFromHere={handlePlayFromHere}
        onBookmark={handleBookmark}
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background, paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background, paddingTop: insets.top + webTopInset }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Could not load this surah</Text>
        <Pressable
          onPress={loadSurah}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: theme.tint, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top  + 20 }]}>
        <Pressable
          onPress={() => { stopAudio(); router.back(); }}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
            Surah {surahEnglishName}
          </Text>
        </View>
        <View style={styles.topBarRight}>
          {Platform.OS !== "web" ? (
            <Pressable
              onPress={isDownloaded ? undefined : handleDownload}
              hitSlop={12}
              disabled={isDownloading}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={theme.tint} />
              ) : (
                <Ionicons
                  name={isDownloaded ? "checkmark-circle" : "download-outline"}
                  size={22}
                  color={isDownloaded ? theme.tint : theme.text}
                />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={ayahs}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderAyah}
        contentContainerStyle={{
          paddingBottom: isThisSurahPlaying ? 160 : 100,
          paddingHorizontal: 16,
          paddingTop: 0,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {surahNumber !== 9 ? (
              <View style={styles.bismillah}>
                <Text style={[styles.bismillahText, { color: "#fff" }]}>
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                </Text>
              </View>
            ) : null}
            <Pressable
              onPress={isThisSurahPlaying ? handlePauseResume : handlePlayFromStart}
              style={({ pressed }) => [
                styles.playAllButton,
                {
                  backgroundColor: isThisSurahPlaying
                    ? isDark ? "rgba(46,170,138,0.15)" : "rgba(13,92,77,0.08)"
                    : theme.tint,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={18}
                color={isPlaying ? theme.tint : "#fff"}
              />
              <Text style={[
                styles.playAllText,
                { color: isPlaying ? theme.tint : "#fff" },
              ]}>
                {isPlaying ? "Pause" : "Play from Start"}
              </Text>
            </Pressable>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
      />

      {isThisSurahPlaying || (currentTrackId?.startsWith(`${surahNumber}_`) && !isPlaying && currentAyahInSurah) ? (
        <View style={[
          styles.playerBar,
          {
            backgroundColor: isDark ? "#1A3A30" : "#0D5C4D",
            paddingBottom: insets.bottom + webBottomInset + 8,
          },
        ]}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerAyahText} numberOfLines={1}>
              Ayah {currentAyahInSurah} of {ayahs.length}
            </Text>
            <Text style={styles.playerSurahText} numberOfLines={1}>
              {surahEnglishName}
            </Text>
          </View>
          <View style={styles.playerControls}>
            <Pressable onPress={skipPrev} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Ionicons name="play-skip-back" size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={handlePauseResume} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={36} color="#fff" />
              )}
            </Pressable>
            <Pressable onPress={skipNext} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Ionicons name="play-skip-forward" size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={stopAudio} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginLeft: 4 })}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
        </View>
      ) : null}
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
  onPlayFromHere,
  onBookmark,
}) {
  const hasAudio = !!(ayah.localAudio || ayah.audio);

  return (
    <View style={[
      styles.ayahCard,
      {
        backgroundColor: isCurrentPlaying
          ? isDark ? "rgba(46,170,138,0.1)" : "rgba(13,92,77,0.06)"
          : theme.ayahBg,
        borderColor: isCurrentPlaying ? theme.tint : theme.border,
        borderWidth: isCurrentPlaying ? 1.5 : 1,
      },
    ]}>
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
          {hasAudio ? (
            <Pressable onPress={() => onPlayFromHere(ayah)} hitSlop={8}>
              {isCurrentLoading ? (
                <ActivityIndicator size="small" color={theme.tint} />
              ) : (
                <Ionicons
                  name={isCurrentPlaying ? "volume-high" : "play"}
                  size={isCurrentPlaying ? 20 : 18}
                  color={theme.tint}
                />
              )}
            </Pressable>
          ) : null}
          <Pressable onPress={() => onBookmark(ayah)} hitSlop={8}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isBookmarked ? theme.tint : theme.textSecondary}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
  },
  topBarRight: {
    width: 36,
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
    paddingVertical: 15,
  },
  bismillahText: {
    fontSize: 26,
    fontFamily: "Amiri_400Regular",
  },
  playAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  playAllText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  ayahCard: {
    borderRadius: 14,
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
  playerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  playerInfo: {
    flex: 1,
    marginRight: 12,
  },
  playerAyahText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  playerSurahText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
