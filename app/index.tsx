import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  useColorScheme,
  Platform,
  Dimensions,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import {
  getQuranPages,
  getTotalPages,
  getSurahList,
  getSurahInfo,
  getPageForSurah,
  getArabicNumber,
  QuranPage,
  SurahInfo,
} from "@/lib/quran-api";
import { useQuran } from "@/lib/quran-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { currentPage, setCurrentPage, playMultipleAudios, pauseAudio, stopAudio, isPlaying, isLoading, currentAudio } = useQuran();
  const [menuVisible, setMenuVisible] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = useMemo(() => getTotalPages(), []);
  const pages = useMemo(() => getQuranPages(), []);
  const surahList = useMemo(() => getSurahList(), []);
  const page = pages[currentPage - 1];

  const bg = isDark ? "#111111" : "#FAF7F0";
  const textColor = isDark ? "#E8E0D0" : "#1A1A1A";
  const secondaryText = isDark ? "#8A8478" : "#6B6560";
  const accentColor = isDark ? "#D4AF37" : "#8B7535";
  const dividerColor = isDark ? "#2A2520" : "#E5DDD0";
  const controlBg = isDark ? "rgba(30,26,22,0.95)" : "rgba(250,247,240,0.95)";
  const menuBg = isDark ? "#1A1714" : "#FAF7F0";
  const menuItemBg = isDark ? "#252019" : "#FFFFFF";
  const headerDecoColor = isDark ? "#3A3530" : "#D5CFC5";

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const topInset = insets.top + webTopInset;
  const bottomInset = insets.bottom + webBottomInset;

  const resetControlsTimer = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, 4000);
  }, []);

  const toggleControls = useCallback(() => {
    setControlsVisible((v) => {
      if (!v) {
        resetControlsTimer();
      }
      return !v;
    });
  }, [resetControlsTimer]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  const goToPage = useCallback(
    (p: number) => {
      if (p >= 1 && p <= totalPages) {
        setCurrentPage(p);
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [totalPages, setCurrentPage]
  );

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const handlePlayPage = useCallback(async () => {
    if (!page) return;
    if (isPlaying) {
      await stopAudio();
      return;
    }
    const urls = page.ayahs.map((a) => a.audio).filter(Boolean) as string[];
    if (urls.length > 0) {
      await playMultipleAudios(urls);
    }
  }, [page, isPlaying, stopAudio, playMultipleAudios]);

  const navigateToSurah = useCallback(
    (surahNumber: number) => {
      const pageNum = getPageForSurah(surahNumber);
      goToPage(pageNum);
      setMenuVisible(false);
    },
    [goToPage]
  );

  const currentSurahNumbers = useMemo(() => {
    if (!page) return [];
    const nums = new Set(page.ayahs.map((a) => a.surahNumber));
    return Array.from(nums);
  }, [page]);

  const currentSurahDisplay = useMemo(() => {
    if (currentSurahNumbers.length === 0) return "";
    const info = getSurahInfo(currentSurahNumbers[0]);
    return info ? info.englishName : "";
  }, [currentSurahNumbers]);

  if (!page) return <View style={[styles.container, { backgroundColor: bg }]} />;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Pressable style={styles.pageArea} onPress={toggleControls}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.pageContent,
            {
              paddingTop: topInset + 60,
              paddingBottom: bottomInset + 80,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {page.surahHeaders.map((header, idx) => {
            const info = getSurahInfo(header.surahNumber);
            if (!info) return null;
            return (
              <View key={`header-${header.surahNumber}`} style={styles.surahHeaderBlock}>
                {header.surahNumber > 1 && idx === 0 && page.ayahs[0]?.numberInSurah === 1 ? (
                  <View style={[styles.surahDivider, { borderColor: headerDecoColor }]} />
                ) : null}
                <Text style={[styles.surahHeaderArabic, { color: accentColor }]}>
                  {info.name}
                </Text>
                <Text style={[styles.surahHeaderEnglish, { color: textColor }]}>
                  {info.englishName}
                </Text>
                <Text style={[styles.surahHeaderTranslation, { color: secondaryText }]}>
                  {info.englishNameTranslation}
                </Text>
                <View style={[styles.ornamentLine, { backgroundColor: headerDecoColor }]} />
                {info.number !== 9 && page.ayahs.some((a) => a.surahNumber === info.number && a.numberInSurah === 1) ? (
                  <Text style={[styles.bismillah, { color: secondaryText }]}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </Text>
                ) : null}
              </View>
            );
          })}

          {page.ayahs.map((ayah, idx) => {
            const isCurrentlyPlaying = isPlaying && currentAudio === ayah.audio;
            return (
              <View key={ayah.globalNumber} style={styles.ayahBlock}>
                <Text style={[styles.arabicText, { color: textColor }, isCurrentlyPlaying && styles.highlightedAyah]}>
                  {ayah.arabicText}
                  <Text style={[styles.verseMarker, { color: accentColor }]}>
                    {" "}{getArabicNumber(ayah.numberInSurah)}{" "}
                  </Text>
                </Text>
                <Text style={[styles.translationText, { color: secondaryText }]}>
                  {ayah.translation}
                </Text>
                {idx < page.ayahs.length - 1 ? (
                  <View style={[styles.ayahSeparator, { backgroundColor: dividerColor }]} />
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </Pressable>

      <View style={[styles.tapZoneLeft, { top: topInset + 60, bottom: bottomInset + 80 }]}>
        <Pressable style={styles.tapZonePressable} onPress={prevPage} />
      </View>
      <View style={[styles.tapZoneRight, { top: topInset + 60, bottom: bottomInset + 80 }]}>
        <Pressable style={styles.tapZonePressable} onPress={nextPage} />
      </View>

      {controlsVisible ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.topBar,
            {
              paddingTop: topInset + 8,
              backgroundColor: controlBg,
            },
          ]}
          pointerEvents="box-none"
        >
          <Text style={[styles.topBarSurah, { color: textColor }]} numberOfLines={1}>
            {currentSurahDisplay}
          </Text>
        </Animated.View>
      ) : null}

      {controlsVisible ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.bottomBar,
            {
              paddingBottom: bottomInset + 12,
              backgroundColor: controlBg,
            },
          ]}
        >
          <Pressable
            onPress={handlePlayPage}
            style={styles.controlButton}
            hitSlop={12}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={22}
                color={accentColor}
              />
            )}
          </Pressable>

          <Text style={[styles.pageIndicator, { color: secondaryText }]}>
            {currentPage} of {totalPages}
          </Text>

          <Pressable
            onPress={() => {
              setMenuVisible(true);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.controlButton}
            hitSlop={12}
          >
            <Ionicons name="list" size={22} color={accentColor} />
          </Pressable>
        </Animated.View>
      ) : null}

      <Modal
        visible={menuVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMenuVisible(false)}
      >
        <SurahMenu
          surahList={surahList}
          currentSurahNumbers={currentSurahNumbers}
          onSelectSurah={navigateToSurah}
          onClose={() => setMenuVisible(false)}
          isDark={isDark}
          menuBg={menuBg}
          menuItemBg={menuItemBg}
          textColor={textColor}
          secondaryText={secondaryText}
          accentColor={accentColor}
          dividerColor={dividerColor}
          topInset={Platform.OS === "web" ? 20 : 0}
        />
      </Modal>
    </View>
  );
}

function SurahMenu({
  surahList,
  currentSurahNumbers,
  onSelectSurah,
  onClose,
  isDark,
  menuBg,
  menuItemBg,
  textColor,
  secondaryText,
  accentColor,
  dividerColor,
  topInset,
}: {
  surahList: SurahInfo[];
  currentSurahNumbers: number[];
  onSelectSurah: (n: number) => void;
  onClose: () => void;
  isDark: boolean;
  menuBg: string;
  menuItemBg: string;
  textColor: string;
  secondaryText: string;
  accentColor: string;
  dividerColor: string;
  topInset: number;
}) {
  const renderSurah = useCallback(
    ({ item }: { item: SurahInfo }) => {
      const isCurrent = currentSurahNumbers.includes(item.number);
      return (
        <Pressable
          onPress={() => onSelectSurah(item.number)}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: isCurrent
                ? isDark ? "rgba(212,175,55,0.1)" : "rgba(139,117,53,0.08)"
                : menuItemBg,
              opacity: pressed ? 0.7 : 1,
              borderColor: dividerColor,
            },
          ]}
        >
          <View style={[styles.menuNumber, { backgroundColor: isDark ? "#252019" : "#F0EBE0" }]}>
            <Text style={[styles.menuNumberText, { color: accentColor }]}>{item.number}</Text>
          </View>
          <View style={styles.menuTextBlock}>
            <Text style={[styles.menuEnglish, { color: textColor }]}>{item.englishName}</Text>
            <Text style={[styles.menuTranslation, { color: secondaryText }]}>
              {item.englishNameTranslation} - {item.numberOfAyahs} ayahs
            </Text>
          </View>
          <Text style={[styles.menuArabic, { color: accentColor }]}>{item.name}</Text>
        </Pressable>
      );
    },
    [currentSurahNumbers, isDark, menuItemBg, dividerColor, accentColor, textColor, secondaryText, onSelectSurah]
  );

  return (
    <View style={[styles.menuContainer, { backgroundColor: menuBg, paddingTop: topInset }]}>
      <View style={[styles.menuHeader, { borderBottomColor: dividerColor }]}>
        <Text style={[styles.menuTitle, { color: textColor }]}>Surahs</Text>
        <Pressable onPress={onClose} hitSlop={12} style={styles.menuCloseBtn}>
          <Ionicons name="close" size={24} color={secondaryText} />
        </Pressable>
      </View>
      <FlatList
        data={surahList}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderSurah}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 24,
  },
  tapZoneLeft: {
    position: "absolute",
    left: 0,
    width: 44,
  },
  tapZoneRight: {
    position: "absolute",
    right: 0,
    width: 44,
  },
  tapZonePressable: {
    flex: 1,
  },
  surahHeaderBlock: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 12,
  },
  surahDivider: {
    width: 80,
    borderTopWidth: 1,
    marginBottom: 24,
  },
  surahHeaderArabic: {
    fontSize: 32,
    fontFamily: "Amiri_700Bold",
    marginBottom: 6,
    textAlign: "center",
  },
  surahHeaderEnglish: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
    marginBottom: 2,
    textAlign: "center",
  },
  surahHeaderTranslation: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
  ornamentLine: {
    width: 48,
    height: 1,
    marginBottom: 16,
  },
  bismillah: {
    fontSize: 22,
    fontFamily: "Amiri_400Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  ayahBlock: {
    marginBottom: 4,
  },
  arabicText: {
    fontSize: 26,
    lineHeight: 52,
    textAlign: "right",
    fontFamily: "Amiri_400Regular",
    writingDirection: "rtl",
  },
  highlightedAyah: {
    opacity: 0.6,
  },
  verseMarker: {
    fontSize: 16,
    fontFamily: "Amiri_400Regular",
  },
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 8,
  },
  ayahSeparator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    marginHorizontal: 40,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  topBarSurah: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  pageIndicator: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  menuContainer: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  menuCloseBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  menuList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  menuNumber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuNumberText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  menuTextBlock: {
    flex: 1,
  },
  menuEnglish: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 1,
  },
  menuTranslation: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  menuArabic: {
    fontSize: 18,
    fontFamily: "Amiri_700Bold",
    marginLeft: 10,
  },
});
