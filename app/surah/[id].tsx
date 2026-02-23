import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Platform,
  useWindowDimensions,
  ScrollView,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import Colors from "@/constants/colors";
import { fetchSurahArabic, fetchSurahTranslation, fetchSurahs, AyahEdition, getArabicNumber, getLocalAudioUri } from "@/lib/quran-api";
import { useQuran, AudioTrack } from "@/lib/quran-context";
import { useDownload } from "@/lib/download-context";

function RadialGradientBg({ width, height }: { width: number; height: number }) {
  const radius = Math.max(width, height) * 0.2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="tl" cx="0" cy="0" rx={radius} ry={radius} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#051c16" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="tr" cx={width} cy="0" rx={radius} ry={radius} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#051c16" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="bl" cx="0" cy={height} rx={radius} ry={radius} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#051c16" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="br" cx={width} cy={height} rx={radius} ry={radius} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#051c16" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="#000000" />
        <Rect x="0" y="0" width={width / 2} height={height / 2} fill="url(#tl)" />
        <Rect x={width / 2} y="0" width={width / 2} height={height / 2} fill="url(#tr)" />
        <Rect x="0" y={height / 2} width={width / 2} height={height / 2} fill="url(#bl)" />
        <Rect x={width / 2} y={height / 2} width={width / 2} height={height / 2} fill="url(#br)" />
      </Svg>
    </View>
  );
}

export default function SurahDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const {
    isBookmarked, toggleBookmark,
    playQueue, pauseAudio, resumeAudio, stopAudio,
    skipNext, skipPrev,
    isPlaying, currentTrackId, isLoading,
    currentAyahInSurah, totalTracksInQueue, queueIndex,
  } = useQuran();
  const { surahStatus, downloadSurah } = useDownload();

  const flatListRef = useRef(null);
  const bookFlatListRef = useRef(null);

  const [viewMode, setViewMode] = useState("original");
  const [ayahs, setAyahs] = useState([]);
  const [surahName, setSurahName] = useState("");
  const [surahArabicName, setSurahArabicName] = useState("");
  const [surahEnglishName, setSurahEnglishName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bookPageIndex, setBookPageIndex] = useState(0);

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

  const isThisSurahPlaying = currentTrackId?.startsWith(`${surahNumber}_`) ?? false;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const topBarHeight = insets.top + 20 + 12;
  const toggleRowHeight = 10 + 34;
  const pageContentPaddingTop = 20;
  const pageContentPaddingBottom = 10;
  const bookPageAvailableHeight = screenHeight - topBarHeight - toggleRowHeight - pageContentPaddingTop - pageContentPaddingBottom - (Platform.OS === "web" ? 67 : 0);

  const bookPages = useMemo(() => {
    if (ayahs.length === 0) return [];
    const textWidth = screenWidth - 20 * 2;
    const charsPerLine = Math.max(1, Math.floor(textWidth / 6));
    const lineHeight = 65;
    const footerHeight = 48;
    const availableHeight = bookPageAvailableHeight - footerHeight;

    const pages: any[][] = [];
    let currentPage: any[] = [];
    let totalChars = 0;
    let hasBismillah = false;

    for (let i = 0; i < ayahs.length; i++) {
      const ayahText = `${ayahs[i].arabicText} ﴿${getArabicNumber(ayahs[i].numberInSurah)}﴾ `;
      const newTotalChars = totalChars + ayahText.length;

      let bismillahHeight = 0;
      if (pages.length === 0 && !hasBismillah && surahNumber !== 9) {
        bismillahHeight = 65 + 14;
        hasBismillah = true;
      }

      const totalLines = Math.max(1, Math.ceil(newTotalChars / charsPerLine));
      const textHeight = totalLines * lineHeight + bismillahHeight;

      if (currentPage.length > 0 && textHeight > availableHeight) {
        pages.push(currentPage);
        currentPage = [ayahs[i]];
        totalChars = ayahText.length;
      } else {
        currentPage.push(ayahs[i]);
        totalChars = newTotalChars;
      }
    }
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    return pages;
  }, [ayahs, bookPageAvailableHeight, screenWidth, surahNumber]);

  const findPageForAyah = useCallback((ayahNumberInSurah) => {
    for (let i = 0; i < bookPages.length; i++) {
      if (bookPages[i].some((a) => a.numberInSurah === ayahNumberInSurah)) {
        return i;
      }
    }
    return 0;
  }, [bookPages]);

  useEffect(() => {
    if (viewMode === "book" && currentAyahInSurah && isThisSurahPlaying) {
      const targetPage = findPageForAyah(currentAyahInSurah);
      if (targetPage !== bookPageIndex) {
        setBookPageIndex(targetPage);
        bookFlatListRef.current?.scrollToIndex({
          index: targetPage,
          animated: true,
        });
      }
    }
  }, [currentAyahInSurah, viewMode, isThisSurahPlaying, findPageForAyah, bookPageIndex]);

  const handleBookPlayFromPage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isThisSurahPlaying && isPlaying) {
      await pauseAudio();
      return;
    }
    if (isThisSurahPlaying && !isPlaying) {
      await resumeAudio();
      return;
    }
    const tracks = buildTracks();
    if (tracks.length === 0) return;

    const currentPageAyahs = bookPages[bookPageIndex];
    if (!currentPageAyahs || currentPageAyahs.length === 0) {
      await playQueue(tracks, 0);
      return;
    }
    const firstAyahOnPage = currentPageAyahs[0].numberInSurah;
    const startIdx = tracks.findIndex((t) => t.ayahNumberInSurah === firstAyahOnPage);
    await playQueue(tracks, startIdx >= 0 ? startIdx : 0);
  }, [buildTracks, playQueue, bookPages, bookPageIndex, isThisSurahPlaying, isPlaying, pauseAudio, resumeAudio]);

  const goToNextPage = useCallback(() => {
    if (bookPageIndex < bookPages.length - 1) {
      const next = bookPageIndex + 1;
      bookFlatListRef.current?.scrollToIndex({ index: next, animated: true });
      setBookPageIndex(next);
    }
  }, [bookPageIndex, bookPages.length]);

  const goToPrevPage = useCallback(() => {
    if (bookPageIndex > 0) {
      const prev = bookPageIndex - 1;
      bookFlatListRef.current?.scrollToIndex({ index: prev, animated: true });
      setBookPageIndex(prev);
    }
  }, [bookPageIndex]);

  const swipeThreshold = 50;
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -swipeThreshold) {
        goToPrevPage();
      } else if (gestureState.dx > swipeThreshold) {
        goToNextPage();
      }
    },
  }), [goToNextPage, goToPrevPage]);

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
      <View
        style={[
          styles.centered,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top + webTopInset,
          },
        ]}
      >
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

  const toggleBar = (
    <View style={styles.toggleContainer}>
      <Pressable
        onPress={() => setViewMode("original")}
        style={[
          styles.toggleBtn,
          viewMode === "original" && { backgroundColor: theme.tint },
        ]}
      >
        <Ionicons
          name="list-outline"
          size={16}
          color={viewMode === "original" ? "#fff" : theme.textSecondary}
        />
        <Text
          style={[
            styles.toggleText,
            { color: viewMode === "original" ? "#fff" : theme.textSecondary },
          ]}
        >
          List
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setViewMode("book")}
        style={[
          styles.toggleBtn,
          viewMode === "book" && { backgroundColor: theme.tint },
        ]}
      >
        <Ionicons
          name="book-outline"
          size={16}
          color={viewMode === "book" ? "#fff" : theme.textSecondary}
        />
        <Text
          style={[
            styles.toggleText,
            { color: viewMode === "book" ? "#fff" : theme.textSecondary },
          ]}
        >
          Book
        </Text>
      </Pressable>
    </View>
  );

  if (viewMode === "book") {
    return (
      <View style={[styles.container, { backgroundColor: "#000000" }]}>
        <RadialGradientBg width={screenWidth} height={screenHeight} />
        <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
          <Pressable
            onPress={() => { stopAudio(); router.back(); }}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.topBarCenter}>
            <Text style={[styles.topBarTitle, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
              Surah {surahEnglishName}
            </Text>
          </View>
          <View style={styles.topBarRight}>
            <Pressable
              onPress={handleBookPlayFromPage}
              hitSlop={12}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              {isLoading && isThisSurahPlaying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name={isPlaying && isThisSurahPlaying ? "pause" : "play"}
                  size={22}
                  color="#fff"
                />
              )}
            </Pressable>
          </View>
        </View>

        <View style={[styles.toggleRow, { borderBottomColor: "rgba(255,255,255,0.1)" }]}>
          {toggleBar}
        </View>

        <FlatList
          ref={bookFlatListRef}
          data={bookPages}
          horizontal
          inverted
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => `page_${index}`}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              bookFlatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            }, 200);
          }}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            setBookPageIndex(idx);
          }}
          renderItem={({ item: pageAyahs, index: pageIdx }) => (
            <View style={[styles.bookPage, { width: screenWidth }]} {...panResponder.panHandlers}>
              <View style={styles.bookPageContent}>
                {pageIdx === 0 && surahNumber !== 9 ? (
                  <Text style={styles.bookBismillah}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </Text>
                ) : null}
                <Text style={styles.bookArabicText}>
                  {pageAyahs.map((ayah) => {
                    const trackId = `${surahNumber}_${ayah.numberInSurah}`;
                    const isActive = currentTrackId === trackId && isPlaying;
                    return (
                      <Text key={ayah.number}>
                        <Text style={isActive ? styles.bookArabicTextActive : undefined}>
                          {ayah.arabicText}
                        </Text>
                        <Text style={styles.bookVerseMarker}> {"("}{getArabicNumber(ayah.numberInSurah)}{")"} </Text>
                      </Text>
                    );
                  })}
                </Text>
              </View>
              <View style={styles.bookPageFooter}>
                <Text style={styles.bookPageNumber}>
                  {pageIdx + 1} / {bookPages.length}
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    );
  }

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

      <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
        {toggleBar}
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
  toggleRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 3,
    alignSelf: "center",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
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
  backBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  bookTopBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  bookPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  bookTopBarCenter: {
    flex: 1,
  },
  bookTopBarTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  bookTopBarSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Amiri_400Regular",
    marginTop: 1,
  },
  bookPage: {
    flex: 1,
    justifyContent: "space-between",
  },
  bookPageContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    overflow: "hidden",
  },
  bookBismillah: {
    fontSize: 24,
    fontFamily: "Amiri_700Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 65,
  },
  bookAyahBlock: {
    marginBottom: 8,
  },
  bookArabicText: {
    fontSize: 24,
    lineHeight: 65,
    textAlign: "justify",
    fontFamily: "Amiri_400Regular",
    color: "rgba(255,255,255,0.92)",
  },
  bookArabicTextActive: {
    color: "#C8A951",
  },
  bookVerseMarker: {
    fontSize: 18,
    color: "rgba(200,169,81,0.7)",
    fontFamily: "Amiri_400Regular",
  },
  bookPageFooter: {
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  bookNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
  },
  bookNavBtnDisabled: {
    opacity: 0.25,
  },
  bookNavBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  bookPageNumber: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
