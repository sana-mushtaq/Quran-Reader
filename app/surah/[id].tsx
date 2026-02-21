import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { fetchSurahArabic, fetchSurahTranslation, fetchSurahs, getArabicNumber, getLocalAudioUri } from "@/lib/quran-api";
import { useQuran } from "@/lib/quran-context";
import { useDownload } from "@/lib/download-context";

export default function SurahDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const {
    isBookmarked, toggleBookmark,
    playQueue, pauseAudio, resumeAudio, stopAudio,
    skipNext, skipPrev,
    isPlaying, currentTrackId, isLoading,
    currentAyahInSurah, totalTracksInQueue, queueIndex,
  } = useQuran();
  const { surahStatus, downloadSurah } = useDownload();

  const scrollRef = useRef(null);

  const [ayahs, setAyahs] = useState([]);
  const [surahName, setSurahName] = useState("");
  const [surahArabicName, setSurahArabicName] = useState("");
  const [surahEnglishName, setSurahEnglishName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState(null);

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

  const handleAyahTap = useCallback((ayah) => {
    setSelectedAyah((prev) => (prev === ayah.numberInSurah ? null : ayah.numberInSurah));
  }, []);

  let isThisSurahPlaying = currentTrackId?.startsWith(`${surahNumber}_`) ?? false;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const bookMaxWidth = Math.min(width - 32, 680);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background, paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top + webTopInset,
          },
        ]}
      >
        {/* Back button fixed at top-left */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
      
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.actionBtn,
              { backgroundColor: isDark ? "rgba(46,170,138,0.12)" : "rgba(13,92,77,0.08)", opacity: pressed ? 0.7 : 1 },
          ]}
        >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
        <Text style={[styles.actionBtnText, { color: theme.text }]}>Back</Text>
        
        </Pressable>

        {/* Error content stays centered */}
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          Could not load this surah
        </Text>
      
        <Pressable
          onPress={loadSurah}
          style={({ pressed }) => [
            styles.retryButton,
            {
              backgroundColor: theme.tint,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const bookBg = isDark ? "#1A2E27" : "#FFFEF9";
  const bookBorder = isDark ? "#2A4A3D" : "#E0D5C0";
  const bookShadow = isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.08)";
  const pageFold = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const ornamentColor = isDark ? "rgba(200,169,81,0.25)" : "rgba(200,169,81,0.4)";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
        <Pressable
          onPress={() => { stopAudio(); router.back(); }}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
            {surahEnglishName}
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

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={{
          alignItems: "center",
          paddingBottom: isThisSurahPlaying ? 180 : 120,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.bookContainer,
          {
            backgroundColor: bookBg,
            borderColor: bookBorder,
            maxWidth: bookMaxWidth,
            ...(Platform.OS === "web"
              ? { boxShadow: `0px 4px 24px ${bookShadow}` }
              : { shadowColor: bookShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 }),
          },
        ]}>
          <View style={[styles.bookSpine, { backgroundColor: pageFold }]} />

          <View style={[styles.bookOrnamentTop, { borderBottomColor: ornamentColor }]} />

          <View style={styles.bookHeader}>
            <Text style={[styles.bookSurahArabic, { color: isDark ? "#fff" : "#fff" }]}>
              {surahArabicName}
            </Text>
          
          </View>

          {surahNumber !== 9 ? (
            <View style={styles.bismillahContainer}>
              <Text style={[styles.bismillahText, { color: isDark ? "#fff" : "#fff" }]}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={isThisSurahPlaying ? handlePauseResume : handlePlayFromStart}
            style={({ pressed }) => [
              styles.playButton,
              {
                backgroundColor: isThisSurahPlaying
                  ? isDark ? "rgba(46,170,138,0.12)" : "rgba(13,92,77,0.06)"
                  : theme.tint,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={isPlaying && isThisSurahPlaying ? "pause" : "play"}
              size={16}
              color={isThisSurahPlaying ? theme.tint : "#fff"}
            />
            <Text style={[
              styles.playButtonText,
              { color: isThisSurahPlaying ? theme.tint : "#fff" },
            ]}>
              {isPlaying && isThisSurahPlaying ? "Pause" : "Play Surah"}
            </Text>
          </Pressable>

          <View style={[styles.bookOrnamentDivider, { borderBottomColor: ornamentColor }]} />

          <View style={styles.ayahsContent}>
            {ayahs.map((ayah, index) => {
              const trackId = `${surahNumber}_${ayah.numberInSurah}`;
              const isThisPlaying = currentTrackId === trackId && isPlaying;
              const isThisLoading = currentTrackId === trackId && isLoading;
              const isSelected = selectedAyah === ayah.numberInSurah;
              const hasAudio = !!(ayah.localAudio || ayah.audio);

              return (
                <View key={ayah.number}>
                  <Pressable
                    onPress={() => handleAyahTap(ayah)}
                    style={[
                      styles.ayahBlock,
                      isThisPlaying && {
                        backgroundColor: isDark ? "rgba(46,170,138,0.08)" : "rgba(13,92,77,0.04)",
                        borderRadius: 12,
                        marginHorizontal: -8,
                        paddingHorizontal: 8,
                      },
                    ]}
                  >
                    <View style={styles.ayahArabicRow}>

                         <View style={[styles.ayahActions, { borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
                        {hasAudio ? (
                          <Pressable
                            onPress={() => handlePlayFromHere(ayah)}
                            style={({ pressed }) => [
                              styles.actionBtn,
                              { backgroundColor: isDark ? "rgba(46,170,138,0.12)" : "rgba(13,92,77,0.08)", opacity: pressed ? 0.7 : 1 },
                            ]}
                          >
                            {isThisLoading ? (
                              <ActivityIndicator size="small" color={theme.tint} />
                            ) : (
                              <Ionicons
                                name={isThisPlaying ? "volume-high" : "play"}
                                size={16}
                                color={theme.tint}
                              />
                            )}
                       
                          </Pressable>
                        ) : null}
                        <Pressable
                          onPress={() => handleBookmark(ayah)}
                          style={({ pressed }) => [
                            styles.actionBtn,
                              { backgroundColor: isDark ? "rgba(46,170,138,0.12)" : "rgba(13,92,77,0.08)", opacity: pressed ? 0.7 : 1 },
                          ]}
                        >
                          <Ionicons
                            name={isBookmarked(ayah.number) ? "bookmark" : "bookmark-outline"}
                            size={16}
                            color={theme.tint}
                          />
                       
                        </Pressable>
                      </View>

                      <Text style={[styles.ayahArabic, { color: isDark ? theme.arabicText : "#1A1A1A" }]}>
                        {ayah.arabicText}
                        <Text style={[styles.verseMarker, { color: isDark ? "#fff" : "fff" }]}>
                          {" ﴿"}{getArabicNumber(ayah.numberInSurah)}{"﴾ "}
                        </Text>
                      </Text>
                    </View>

                    <Text style={[styles.ayahTranslation, { color: theme.translationText  }]}>
                      {ayah.numberInSurah}. {ayah.translationText}
                    </Text>

                  </Pressable>

                  {index < ayahs.length - 1 ? (
                    <View style={[styles.ayahDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]} />
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={[styles.bookOrnamentBottom, { borderTopColor: ornamentColor }]} />

          <View style={styles.bookFooter}>
            <Text style={[styles.bookFooterText, { color: isDark ? theme.textSecondary : "#9A8B70" }]}>
              Surah {surahEnglishName} — {surahArabicName}
            </Text>
          </View>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  bookContainer: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
    elevation: 8,
    position: "relative",
  },
  bookSpine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  bookOrnamentTop: {
    borderBottomWidth: 2,
    marginHorizontal: 20,
    marginTop: 16,
  },
  bookOrnamentDivider: {
    borderBottomWidth: 1,
    marginHorizontal: 32,
    marginBottom: 8,
  },
  bookOrnamentBottom: {
    borderTopWidth: 2,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  bookHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 0,
    paddingHorizontal: 24,
  },
  bookSurahArabic: {
    fontSize: 36,
    fontFamily: "Amiri_700Bold",
    marginBottom: 6,
  },
  bookSurahEnglish: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
    letterSpacing: 1,
  },
  bookSurahMeaning: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  bismillahContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    alignSelf: "center",
  },
  bismillahLine: {
    flex: 1,
    height: 1,
  },
  bismillahText: {
    fontSize: 24,
    fontFamily: "Amiri_400Regular",
    textAlign: "center",
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginHorizontal: 32,
    marginBottom: 16,
  },
  playButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  ayahsContent: {
    paddingHorizontal: 24,
  },
  ayahBlock: {
    paddingVertical: 16,
  },
  ayahArabicRow: {
    marginBottom: 10,
  },
  ayahArabic: {
    fontSize: 26,
    lineHeight: 50,
    textAlign: "right",
    fontFamily: "Amiri_400Regular",
    writingDirection: "rtl",
  },
  verseMarker: {
    fontSize: 18,
    fontFamily: "Amiri_700Bold",
  },
  ayahTranslation: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
  },
  ayahActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingBottom: 12,
    alignSelf: "flex-end",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  ayahDivider: {
    height: 1,
    marginHorizontal: 8,
  },
  bookFooter: {
    alignItems: "center",
    paddingBottom: 20,
  },
  bookFooterText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
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
    backBtn: {
    position: "absolute",
    top: 30,
    left: 30,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
}
});
