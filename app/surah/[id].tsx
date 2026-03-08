import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator, Platform, useWindowDimensions, ScrollView, PanResponder, InteractionManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G, Line, Circle } from "react-native-svg";
import { fetchSurahArabic, fetchSurahTranslation, fetchSurahs, AyahEdition, getArabicNumber, getLocalAudioUri } from "@/lib/quran-api";
import { useQuran, AudioTrack } from "@/lib/quran-context";
import { useDownload } from "@/lib/download-context";
import { useTheme } from "@/lib/theme-context";
import AsyncStorage from "@react-native-async-storage/async-storage"
const VIEW_MODE_KEY = "surah_view_mode"
const DEFAULT_VIEW_MODE = "original"

function safeHaptic(style = Haptics.ImpactFeedbackStyle.Medium) {
  if (Platform.OS === "web") return;
  try {
    Haptics.impactAsync(style);
  } catch (_) { }
}

function RadialGradientBg({ width, height, bgColor }: { width: number; height: number; bgColor?: string }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor || "#fef9f3" }]} pointerEvents="none" />
  );
}

const SurahBanner = React.memo(function SurahBanner({ name, width, textColor }) {
  const w = width - 32;
  const h = 56;
  const g = "#8C7563";
  const g2 = "#8C7563";
  const p = 4;
  const cx = w / 2;
  const cy = h / 2;
  const cs = 16;

  const cornerTL = `M ${p} ${p + cs} Q ${p} ${p}, ${p + cs} ${p}`;
  const cornerTR = `M ${w - p - cs} ${p} Q ${w - p} ${p}, ${w - p} ${p + cs}`;
  const cornerBR = `M ${w - p} ${h - p - cs} Q ${w - p} ${h - p}, ${w - p - cs} ${h - p}`;
  const cornerBL = `M ${p + cs} ${h - p} Q ${p} ${h - p}, ${p} ${h - p - cs}`;

  const flourishTL = `
    M ${p + cs + 4} ${p + 0.5} C ${p + cs - 2} ${p + 3}, ${p + 6} ${p + cs - 6}, ${p + 0.5} ${p + cs + 4}
    M ${p + cs + 2} ${p + 1.5} C ${p + cs - 5} ${p + 6}, ${p + 6} ${p + cs - 5}, ${p + 1.5} ${p + cs + 2}
    M ${p + 4} ${p + 4} Q ${p + 8} ${p + 10}, ${p + 14} ${p + 6}
    M ${p + 4} ${p + 4} Q ${p + 10} ${p + 8}, ${p + 6} ${p + 14}
    M ${p + 3} ${p + 8} C ${p + 6} ${p + 12}, ${p + 10} ${p + 10}, ${p + 8} ${p + 3}
  `;
  const flourishTR = `
    M ${w - p - cs - 4} ${p + 0.5} C ${w - p - cs + 2} ${p + 3}, ${w - p - 6} ${p + cs - 6}, ${w - p - 0.5} ${p + cs + 4}
    M ${w - p - cs - 2} ${p + 1.5} C ${w - p - cs + 5} ${p + 6}, ${w - p - 6} ${p + cs - 5}, ${w - p - 1.5} ${p + cs + 2}
    M ${w - p - 4} ${p + 4} Q ${w - p - 8} ${p + 10}, ${w - p - 14} ${p + 6}
    M ${w - p - 4} ${p + 4} Q ${w - p - 10} ${p + 8}, ${w - p - 6} ${p + 14}
    M ${w - p - 3} ${p + 8} C ${w - p - 6} ${p + 12}, ${w - p - 10} ${p + 10}, ${w - p - 8} ${p + 3}
  `;
  const flourishBR = `
    M ${w - p - 0.5} ${h - p - cs - 4} C ${w - p - 3} ${h - p - cs + 2}, ${w - p - cs + 6} ${h - p - 6}, ${w - p - cs - 4} ${h - p - 0.5}
    M ${w - p - 1.5} ${h - p - cs - 2} C ${w - p - 6} ${h - p - cs + 5}, ${w - p - cs + 5} ${h - p - 6}, ${w - p - cs - 2} ${h - p - 1.5}
    M ${w - p - 4} ${h - p - 4} Q ${w - p - 8} ${h - p - 10}, ${w - p - 14} ${h - p - 6}
    M ${w - p - 4} ${h - p - 4} Q ${w - p - 10} ${h - p - 8}, ${w - p - 6} ${h - p - 14}
    M ${w - p - 3} ${h - p - 8} C ${w - p - 6} ${h - p - 12}, ${w - p - 10} ${h - p - 10}, ${w - p - 8} ${h - p - 3}
  `;
  const flourishBL = `
    M ${p + 0.5} ${h - p - cs - 4} C ${p + 3} ${h - p - cs + 2}, ${p + cs - 6} ${h - p - 6}, ${p + cs + 4} ${h - p - 0.5}
    M ${p + 1.5} ${h - p - cs - 2} C ${p + 6} ${h - p - cs + 5}, ${p + cs - 5} ${h - p - 6}, ${p + cs + 2} ${h - p - 1.5}
    M ${p + 4} ${h - p - 4} Q ${p + 8} ${h - p - 10}, ${p + 14} ${h - p - 6}
    M ${p + 4} ${h - p - 4} Q ${p + 10} ${h - p - 8}, ${p + 6} ${h - p - 14}
    M ${p + 3} ${h - p - 8} C ${p + 6} ${h - p - 12}, ${p + 10} ${h - p - 10}, ${p + 8} ${h - p - 3}
  `;

  const topCenter = `
    M ${cx - 30} ${p + 0.5} C ${cx - 20} ${p + 6}, ${cx - 8} ${p + 0.5}, ${cx} ${p + 7}
    C ${cx + 8} ${p + 0.5}, ${cx + 20} ${p + 6}, ${cx + 30} ${p + 0.5}
    M ${cx - 18} ${p + 1} Q ${cx - 12} ${p + 5}, ${cx - 6} ${p + 2}
    M ${cx + 6} ${p + 2} Q ${cx + 12} ${p + 5}, ${cx + 18} ${p + 1}
    M ${cx} ${p + 1} L ${cx} ${p + 4}
    M ${cx - 3} ${p + 1.5} L ${cx - 3} ${p + 3.5}
    M ${cx + 3} ${p + 1.5} L ${cx + 3} ${p + 3.5}
  `;
  const bottomCenter = `
    M ${cx - 30} ${h - p - 0.5} C ${cx - 20} ${h - p - 6}, ${cx - 8} ${h - p - 0.5}, ${cx} ${h - p - 7}
    C ${cx + 8} ${h - p - 0.5}, ${cx + 20} ${h - p - 6}, ${cx + 30} ${h - p - 0.5}
    M ${cx - 18} ${h - p - 1} Q ${cx - 12} ${h - p - 5}, ${cx - 6} ${h - p - 2}
    M ${cx + 6} ${h - p - 2} Q ${cx + 12} ${h - p - 5}, ${cx + 18} ${h - p - 1}
    M ${cx} ${h - p - 1} L ${cx} ${h - p - 4}
    M ${cx - 3} ${h - p - 1.5} L ${cx - 3} ${h - p - 3.5}
    M ${cx + 3} ${h - p - 1.5} L ${cx + 3} ${h - p - 3.5}
  `;

  const lx = p + 1;
  const rx = w - p - 1;
  const sideL = `
    M ${lx} ${cy - 18} Q ${lx + 7} ${cy - 14}, ${lx + 10} ${cy - 10}
    Q ${lx + 12} ${cy - 6}, ${lx + 10} ${cy}
    Q ${lx + 12} ${cy + 6}, ${lx + 10} ${cy + 10}
    Q ${lx + 7} ${cy + 14}, ${lx} ${cy + 18}
    M ${lx} ${cy - 18} Q ${lx + 4} ${cy - 12}, ${lx + 6} ${cy - 8}
    Q ${lx + 8} ${cy - 4}, ${lx + 6} ${cy}
    Q ${lx + 8} ${cy + 4}, ${lx + 6} ${cy + 8}
    Q ${lx + 4} ${cy + 12}, ${lx} ${cy + 18}
    M ${lx + 3} ${cy - 14} C ${lx + 8} ${cy - 10}, ${lx + 8} ${cy - 5}, ${lx + 5} ${cy}
    C ${lx + 8} ${cy + 5}, ${lx + 8} ${cy + 10}, ${lx + 3} ${cy + 14}
    M ${lx + 10} ${cy} L ${lx + 14} ${cy}
    M ${lx + 10} ${cy - 5} L ${lx + 13} ${cy - 3}
    M ${lx + 10} ${cy + 5} L ${lx + 13} ${cy + 3}
    M ${lx + 8} ${cy - 10} Q ${lx + 14} ${cy - 8}, ${lx + 16} ${cy - 4}
    M ${lx + 8} ${cy + 10} Q ${lx + 14} ${cy + 8}, ${lx + 16} ${cy + 4}
    M ${lx} ${cy} L ${lx + 4} ${cy}
    M ${lx + 1} ${cy - 3} L ${lx + 3} ${cy - 1}
    M ${lx + 1} ${cy + 3} L ${lx + 3} ${cy + 1}
  `;
  const sideR = `
    M ${rx} ${cy - 18} Q ${rx - 7} ${cy - 14}, ${rx - 10} ${cy - 10}
    Q ${rx - 12} ${cy - 6}, ${rx - 10} ${cy}
    Q ${rx - 12} ${cy + 6}, ${rx - 10} ${cy + 10}
    Q ${rx - 7} ${cy + 14}, ${rx} ${cy + 18}
    M ${rx} ${cy - 18} Q ${rx - 4} ${cy - 12}, ${rx - 6} ${cy - 8}
    Q ${rx - 8} ${cy - 4}, ${rx - 6} ${cy}
    Q ${rx - 8} ${cy + 4}, ${rx - 6} ${cy + 8}
    Q ${rx - 4} ${cy + 12}, ${rx} ${cy + 18}
    M ${rx - 3} ${cy - 14} C ${rx - 8} ${cy - 10}, ${rx - 8} ${cy - 5}, ${rx - 5} ${cy}
    C ${rx - 8} ${cy + 5}, ${rx - 8} ${cy + 10}, ${rx - 3} ${cy + 14}
    M ${rx - 10} ${cy} L ${rx - 14} ${cy}
    M ${rx - 10} ${cy - 5} L ${rx - 13} ${cy - 3}
    M ${rx - 10} ${cy + 5} L ${rx - 13} ${cy + 3}
    M ${rx - 8} ${cy - 10} Q ${rx - 14} ${cy - 8}, ${rx - 16} ${cy - 4}
    M ${rx - 8} ${cy + 10} Q ${rx - 14} ${cy + 8}, ${rx - 16} ${cy + 4}
    M ${rx} ${cy} L ${rx - 4} ${cy}
    M ${rx - 1} ${cy - 3} L ${rx - 3} ${cy - 1}
    M ${rx - 1} ${cy + 3} L ${rx - 3} ${cy + 1}
  `;

  const sideDotsL = [
    { x: lx + 5, y: cy },
    { x: lx + 11, y: cy - 7 },
    { x: lx + 11, y: cy + 7 },
    { x: lx + 14, y: cy },
  ];
  const sideDotsR = sideDotsL.map(d => ({ x: w - d.x, y: d.y }));

  const topEdgeDots = Array.from({ length: 7 }, (_, i) => {
    const x = p + cs + 28 + i * ((w - 2 * p - 2 * cs - 56 - 60) / 6);
    return { cx: x, cy: p + 2 };
  });
  const bottomEdgeDots = topEdgeDots.map(d => ({ cx: d.cx, cy: h - p - 2 }));

  const topEdgeDotsR = Array.from({ length: 7 }, (_, i) => {
    const x = cx + 30 + 4 + i * ((w - p - cs - 28 - cx - 34) / 6);
    return { cx: x, cy: p + 2 };
  });
  const bottomEdgeDotsR = topEdgeDotsR.map(d => ({ cx: d.cx, cy: h - p - 2 }));

  return (
    <View style={{ alignItems: "center", marginVertical: 18 }}>
      <View style={{ width: w, height: h }}>
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="bannerBg" cx="50%" cy="50%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor={g} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={g} stopOpacity="0.04" />
            </RadialGradient>
          </Defs>
          <Rect x={p} y={p} width={w - p * 2} height={h - p * 2} rx={2} fill="url(#bannerBg)" stroke={g} strokeWidth={1.4} />
          <Rect x={p + 3.5} y={p + 3.5} width={w - p * 2 - 7} height={h - p * 2 - 7} rx={1} fill="none" stroke={g} strokeWidth={0.5} opacity={0.45} />

          <Path d={cornerTL} fill="none" stroke={g2} strokeWidth={2} strokeLinecap="round" />
          <Path d={cornerTR} fill="none" stroke={g2} strokeWidth={2} strokeLinecap="round" />
          <Path d={cornerBR} fill="none" stroke={g2} strokeWidth={2} strokeLinecap="round" />
          <Path d={cornerBL} fill="none" stroke={g2} strokeWidth={2} strokeLinecap="round" />

          <Path d={flourishTL} fill="none" stroke={g} strokeWidth={0.7} opacity={0.65} />
          <Path d={flourishTR} fill="none" stroke={g} strokeWidth={0.7} opacity={0.65} />
          <Path d={flourishBR} fill="none" stroke={g} strokeWidth={0.7} opacity={0.65} />
          <Path d={flourishBL} fill="none" stroke={g} strokeWidth={0.7} opacity={0.65} />

          <Path d={topCenter} fill="none" stroke={g} strokeWidth={0.7} opacity={0.6} />
          <Path d={bottomCenter} fill="none" stroke={g} strokeWidth={0.7} opacity={0.6} />
          <Path d={sideL} fill="none" stroke={g} strokeWidth={0.8} opacity={0.7} />
          <Path d={sideR} fill="none" stroke={g} strokeWidth={0.8} opacity={0.7} />

          {sideDotsL.map((d, i) => <Circle key={`sdl${i}`} cx={d.x} cy={d.y} r={1} fill={g} opacity={0.55} />)}
          {sideDotsR.map((d, i) => <Circle key={`sdr${i}`} cx={d.x} cy={d.y} r={1} fill={g} opacity={0.55} />)}

          {topEdgeDots.map((d, i) => <Circle key={`td${i}`} cx={d.cx} cy={d.cy} r={0.8} fill={g} opacity={0.4} />)}
          {bottomEdgeDots.map((d, i) => <Circle key={`bd${i}`} cx={d.cx} cy={d.cy} r={0.8} fill={g} opacity={0.4} />)}
          {topEdgeDotsR.map((d, i) => <Circle key={`tdr${i}`} cx={d.cx} cy={d.cy} r={0.8} fill={g} opacity={0.4} />)}
          {bottomEdgeDotsR.map((d, i) => <Circle key={`bdr${i}`} cx={d.cx} cy={d.cy} r={0.8} fill={g} opacity={0.4} />)}

          <Circle cx={p + 1.5} cy={p + 1.5} r={1.5} fill={g} opacity={0.7} />
          <Circle cx={w - p - 1.5} cy={p + 1.5} r={1.5} fill={g} opacity={0.7} />
          <Circle cx={w - p - 1.5} cy={h - p - 1.5} r={1.5} fill={g} opacity={0.7} />
          <Circle cx={p + 1.5} cy={h - p - 1.5} r={1.5} fill={g} opacity={0.7} />

          <Circle cx={cx} cy={p + 7.5} r={1} fill={g} opacity={0.5} />
          <Circle cx={cx} cy={h - p - 7.5} r={1} fill={g} opacity={0.5} />
        </Svg>
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 21, fontFamily: "ScheherazadeNew_700Bold", color: textColor || "#030303", textAlign: "center", lineHeight: 34, letterSpacing: 1 }}>
            {name}
          </Text>
        </View>
      </View>
    </View>
  );
})

const MushafAyahSpan = React.memo(function MushafAyahSpan({
  ayah,
  isActive,
  isBookmarked,
  isSelected,
  activeStyle,
}) {
  return (
    <Text
      dataSet={{ ayahNumber: String(ayah.number) }}
      style={[
        isActive && (activeStyle || styles.mushafTextActive),
        isBookmarked && styles.mushafTextBookmarked,
        isSelected && styles.mushafTextSelected,
      ]}
    >
      {ayah.arabicText}
      <Text style={styles.mushafVerseMarker}>
        {" "}﴿{getArabicNumber(ayah.numberInSurah)}﴾{" "}
      </Text>
    </Text>
  );
}, (prev, next) => {
  return (
    prev.isActive === next.isActive &&
    prev.isBookmarked === next.isBookmarked &&
    prev.isSelected === next.isSelected &&
    prev.activeStyle === next.activeStyle
  );
});

const MushafAyahsTextBlock = React.memo(function MushafAyahsTextBlock({
  ayahs, surahNumber, currentTrackId, isPlaying, bookmarkedSet, selectedAyahNumber,
  textColor, activeStyle,
}) {
  return (
    <Text style={[styles.mushafArabicText, textColor && { color: textColor }]}>
      {ayahs.map((ayah) => {
        const trackId = `${surahNumber}_${ayah.numberInSurah}`;
        return (
          <MushafAyahSpan
            key={ayah.number}
            ayah={ayah}
            isActive={currentTrackId === trackId && isPlaying}
            isBookmarked={bookmarkedSet.has(ayah.number)}
            isSelected={selectedAyahNumber === ayah.number}
            activeStyle={activeStyle}
          />
        );
      })}
    </Text>
  );
}, (prev, next) => {
  if (prev.ayahs !== next.ayahs) return false;
  if (prev.isPlaying !== next.isPlaying) return false;
  if (prev.bookmarkedSet !== next.bookmarkedSet) return false;
  if (prev.selectedAyahNumber !== next.selectedAyahNumber) return false;
  if (prev.textColor !== next.textColor) return false;
  if (prev.activeStyle !== next.activeStyle) return false;
  const prevHasTrack = prev.currentTrackId?.startsWith(`${prev.surahNumber}_`);
  const nextHasTrack = next.currentTrackId?.startsWith(`${next.surahNumber}_`);
  if (prevHasTrack || nextHasTrack) {
    if (prev.currentTrackId !== next.currentTrackId) return false;
  }
  return true;
});

const MushafSurahBlock = React.memo(function MushafSurahBlock({
  surahData, sIdx, screenWidth, currentTrackId, isPlaying,
  bookmarkedSet, selectedBookAyahNumber, selectedBookAyahX, selectedBookAyahY,
  selectedBookAyahSurah, onBookmarkFlag, onPlayAyah, onStopAyah, onLongPress, onDismissSelection,
  mushafColors,
}) {
  const isSelectedSurah = selectedBookAyahSurah === surahData.surahNumber;
  const textContainerRef = useRef(null);

  const findAyahFromTarget = useCallback((target) => {
    let el = target;
    while (el) {
      const ayahNum = el?.dataset?.ayahNumber;
      if (ayahNum) {
        const num = parseInt(ayahNum, 10);
        return surahData.ayahs.find((a) => a.number === num) || null;
      }
      el = el.parentElement;
    }
    return null;
  }, [surahData.ayahs]);

  const handleLongPress = useCallback((e) => {
    if (!onLongPress) return;
    try {
      const locX = e?.nativeEvent?.locationX ?? 0;
      const locY = e?.nativeEvent?.locationY ?? 0;

      let foundAyah = null;
      if (Platform.OS === "web") {
        if (e?.nativeEvent?.target) {
          foundAyah = findAyahFromTarget(e.nativeEvent.target);
        }
        if (!foundAyah) {
          const clientX = e?.nativeEvent?.clientX ?? e?.nativeEvent?.pageX ?? 0;
          const clientY = e?.nativeEvent?.clientY ?? e?.nativeEvent?.pageY ?? 0;
          if (clientX && clientY && typeof document !== "undefined") {
            const el = document.elementFromPoint(clientX, clientY);
            if (el) {
              foundAyah = findAyahFromTarget(el);
            }
          }
        }
      }

      if (!foundAyah) {
        foundAyah = surahData.ayahs[0];
      }

      onLongPress(foundAyah, locX, locY, surahData.surahNumber);
    } catch (_) { }
  }, [onLongPress, surahData, findAyahFromTarget]);

  return (
    <View>
      {sIdx > 0 && <View style={styles.surahDivider} />}
      <SurahBanner name={surahData.meta.name} width={screenWidth} textColor={mushafColors?.text} />
      {surahData.surahNumber !== 9 && (
        <Text style={[styles.mushafBismillah, mushafColors && { color: mushafColors.text }]}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ {surahData.surahNumber === 1 ? "﴿١﴾" : ""}
        </Text>
      )}
      <View ref={textContainerRef} style={{ position: "relative", direction: "rtl" }}>
        <Pressable
          onLongPress={handleLongPress}
          onPress={onDismissSelection}
          delayLongPress={400}
          style={{ direction: "rtl" }}
        >
          <MushafAyahsTextBlock
            ayahs={surahData.ayahs}
            surahNumber={surahData.surahNumber}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            bookmarkedSet={bookmarkedSet}
            selectedAyahNumber={isSelectedSurah ? selectedBookAyahNumber : null}
            textColor={mushafColors?.text}
            activeStyle={mushafColors?.activeStyle}
          />
        </Pressable>
        {isSelectedSurah && selectedBookAyahNumber != null && (() => {
          const selAyah = surahData.ayahs.find((a) => a.number === selectedBookAyahNumber);
          const selTrackId = selAyah ? `${surahData.surahNumber}_${selAyah.numberInSurah}` : null;
          const isAyahPlaying = isPlaying && currentTrackId === selTrackId;
          return (
            <View style={[styles.mushafActionRow, { left: selectedBookAyahX - 40, top: selectedBookAyahY - 40 }]}>
              <Pressable
                style={[styles.mushafActionBtn, mushafColors && { backgroundColor: mushafColors.btnBg, borderColor: mushafColors.btnBorder }]}
                onPress={onBookmarkFlag}
                hitSlop={8}
              >
                <Ionicons
                  name={bookmarkedSet.has(selectedBookAyahNumber) ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color={mushafColors?.btnIcon || "#8C7563"}
                />
              </Pressable>
              <Pressable
                style={[styles.mushafActionBtn, mushafColors && { backgroundColor: mushafColors.btnBg, borderColor: mushafColors.btnBorder }]}
                onPress={isAyahPlaying ? onStopAyah : onPlayAyah}
                hitSlop={8}
              >
                <Ionicons
                  name={isAyahPlaying ? "stop" : "play"}
                  size={18}
                  color={mushafColors?.btnIcon || "#8C7563"}
                />
              </Pressable>
            </View>
          );
        })()}
      </View>
    </View>
  );
}, (prev, next) => {
  if (prev.surahData !== next.surahData) return false;
  if (prev.sIdx !== next.sIdx) return false;
  if (prev.screenWidth !== next.screenWidth) return false;
  if (prev.isPlaying !== next.isPlaying) return false;
  if (prev.bookmarkedSet !== next.bookmarkedSet) return false;
  if (prev.onLongPress !== next.onLongPress) return false;
  if (prev.mushafColors !== next.mushafColors) return false;

  const prevHasTrack = prev.currentTrackId?.startsWith(`${prev.surahData.surahNumber}_`);
  const nextHasTrack = next.currentTrackId?.startsWith(`${next.surahData.surahNumber}_`);
  if (prevHasTrack || nextHasTrack) {
    if (prev.currentTrackId !== next.currentTrackId) return false;
  }

  const prevIsSelected = prev.selectedBookAyahSurah === prev.surahData.surahNumber;
  const nextIsSelected = next.selectedBookAyahSurah === next.surahData.surahNumber;
  if (prevIsSelected || nextIsSelected) {
    if (prev.selectedBookAyahNumber !== next.selectedBookAyahNumber) return false;
    if (prev.selectedBookAyahX !== next.selectedBookAyahX) return false;
    if (prev.selectedBookAyahY !== next.selectedBookAyahY) return false;
    if (prev.selectedBookAyahSurah !== next.selectedBookAyahSurah) return false;
  }

  return true;
});

export default function SurahDetailScreen() {
  const { id, ayah } = useLocalSearchParams();
  const [bookmarkPopup, setBookmarkPopup] = useState<{ ayah: any } | null>(null);
  const [selectedBookAyah, setSelectedBookAyah] = useState<{
    ayah: any
    surahNumber: number
    x: number
    y: number
  } | null>(null)
  const bookScrollYRef = useRef(0)
  const mushafLayoutRef = useRef({ x: 0, y: 0 })

  const { isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const audioDrivenRef = useRef(false);
  const initialAyahNumber = ayah ? parseInt(ayah, 10) : null
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
  const bookScrollRef = useRef(null);

  const [viewMode, setViewMode] = useState(DEFAULT_VIEW_MODE)
  const [ayahs, setAyahs] = useState([]);
  const [surahName, setSurahName] = useState("");
  const [surahArabicName, setSurahArabicName] = useState("");
  const [surahEnglishName, setSurahEnglishName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bookPageIndex, setBookPageIndex] = useState(0);

  const surahNumber = parseInt(id || "1", 10);

  const [bookSurahs, setBookSurahs] = useState([]);
  const [loadingNextSurah, setLoadingNextSurah] = useState(false);
  const loadedSurahsRef = useRef(new Set());
  const [visibleBookSurah, setVisibleBookSurah] = useState(surahNumber);
  const surahLayoutsRef = useRef({});
  const isDownloaded = surahStatus[surahNumber] === "downloaded";
  const isDownloading = surahStatus[surahNumber] === "downloading";
  const ayahHeightsRef = useRef({})

  const AYAH_CARD_HEIGHT = 180
  const AYAH_SEPARATOR_HEIGHT = 10
  const LIST_HEADER_HEIGHT = surahNumber !== 9 ? 140 : 90

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

      combined[0].arabicText = combined[0].arabicText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "")
      if (surahNumber === 1) {
        combined.splice(0, 1);
      }
      setAyahs(combined);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSurahForBook = useCallback(async (num) => {
    if (loadedSurahsRef.current.has(num) || num > 114) return;
    loadedSurahsRef.current.add(num);
    try {
      const [arabicData, translationData, allSurahs] = await Promise.all([
        fetchSurahArabic(num),
        fetchSurahTranslation(num),
        fetchSurahs(),
      ]);
      const surahInfo = allSurahs.find((s) => s.number === num);
      const meta = arabicData.length > 0 && arabicData[0].surah
        ? arabicData[0].surah
        : surahInfo
          ? { name: surahInfo.name, englishName: surahInfo.englishName, englishNameTranslation: surahInfo.englishNameTranslation, numberOfAyahs: surahInfo.numberOfAyahs, revelationType: surahInfo.revelationType, number: surahInfo.number }
          : { name: "", englishName: "", englishNameTranslation: "", numberOfAyahs: 0, revelationType: "", number: num };

      const combined = arabicData.map((a, i) => {
        const localUri = getLocalAudioUri(num, a.numberInSurah);
        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          arabicText: a.text,
          translationText: translationData[i]?.text || "",
          audio: a.audio,
          localAudio: localUri || undefined,
        };
      });
      console.log(combined[0].arabicText)
      if (num !== 1) {
        combined[0].arabicText = combined[0].arabicText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "");
      }

      if (num === 1) {
        combined.splice(0, 1);
      }
      setBookSurahs((prev) => [...prev, { surahNumber: num, meta, ayahs: combined }]);
    } catch (e) {
      loadedSurahsRef.current.delete(num);
    }
  }, []);

  const loadNextBookSurah = useCallback(async () => {
    if (loadingNextSurah) return;
    const lastLoaded = bookSurahs.length > 0 ? bookSurahs[bookSurahs.length - 1].surahNumber : surahNumber;
    const nextNum = lastLoaded + 1;
    if (nextNum > 114) return;
    setLoadingNextSurah(true);
    await loadSurahForBook(nextNum);
    if (nextNum + 1 <= 114) {
      await loadSurahForBook(nextNum + 1);
    }
    setLoadingNextSurah(false);
  }, [bookSurahs, surahNumber, loadingNextSurah, loadSurahForBook]);

  useEffect(() => {
    loadedSurahsRef.current = new Set();
    setBookSurahs([]);
    const init = async () => {
      await loadSurahForBook(surahNumber);
      if (surahNumber + 1 <= 114) {
        loadSurahForBook(surahNumber + 1);
      }
    };
    init();
  }, [surahNumber]);

  useEffect(() => {
    loadSurah();
    return () => {
      audioDrivenRef.current = false;
      stopAudio();
    };
  }, [surahNumber]);

  useEffect(() => {
    if (!initialAyahNumber || ayahs.length === 0 || !flatListRef.current) return;

    const index = initialAyahNumber - 1;
    if (index < 0 || index >= ayahs.length) return;

    const timeout = setTimeout(() => {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0,
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [ayahs, initialAyahNumber]);

  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(VIEW_MODE_KEY)
        if (savedMode === "original" || savedMode === "book") {
          setViewMode(savedMode)
        }
      } catch (e) {
        setViewMode(DEFAULT_VIEW_MODE)
      }
    }

    loadViewMode()
  }, [])

  const changeViewMode = async (mode) => {
    setViewMode(mode)

    try {
      await AsyncStorage.setItem(VIEW_MODE_KEY, mode)
    } catch (e) {
    }
  }

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
    safeHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const tracks = buildTracks();
    if (tracks.length > 0) {
      await playQueue(tracks, 0);
    }
  }, [buildTracks, playQueue]);

  const handlePlayFromHere = useCallback(async (ayah) => {
    safeHaptic(Haptics.ImpactFeedbackStyle.Light);
    const tracks = buildTracks();
    const startIdx = tracks.findIndex((t) => t.ayahNumberInSurah === ayah.numberInSurah);
    if (startIdx >= 0) {
      await playQueue(tracks, startIdx);
    }
  }, [buildTracks, playQueue]);

  const handlePauseResume = useCallback(async () => {
    safeHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await pauseAudio();
    } else {
      await resumeAudio();
    }
  }, [isPlaying, pauseAudio, resumeAudio]);

  const handleBookmark = useCallback(
    (ayah) => {
      safeHaptic(Haptics.ImpactFeedbackStyle.Light);
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
  const getItemLayout = (data, index) => ({
    length: AYAH_CARD_HEIGHT + AYAH_SEPARATOR_HEIGHT,
    offset: (AYAH_CARD_HEIGHT + AYAH_SEPARATOR_HEIGHT) * index + LIST_HEADER_HEIGHT,
    index,
  });

  const handleDownload = useCallback(async () => {
    safeHaptic(Haptics.ImpactFeedbackStyle.Medium);
    await downloadSurah(surahNumber);
    loadSurah();
  }, [surahNumber, downloadSurah]);

  const isThisSurahPlaying = currentTrackId?.startsWith(`${surahNumber}_`) ?? false;
  const visibleBookSurahName = useMemo(() =>
    bookSurahs.find((s) => s.surahNumber === visibleBookSurah)?.meta?.name || surahArabicName,
    [bookSurahs, visibleBookSurah, surahArabicName]
  );
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
    const charsPerLine = Math.max(1, Math.floor(textWidth / 6.1));
    const lineHeight = 65;
    const footerHeight = 48;
    const bismillahTotalHeight = 65 + 14;
    const availableHeight = bookPageAvailableHeight - footerHeight;

    const pages: any[][] = [];
    let currentPage: any[] = [];
    let totalChars = 0;
    let isFirstPage = true;

    for (let i = 0; i < ayahs.length; i++) {
      const ayahText = `${ayahs[i].arabicText} ﴿${getArabicNumber(ayahs[i].numberInSurah)}﴾ `;
      const newTotalChars = totalChars + ayahText.length;

      const extraHeight = (isFirstPage && currentPage.length === 0 && surahNumber !== 9) ? bismillahTotalHeight : 0;
      const totalLines = Math.max(1, Math.ceil(newTotalChars / charsPerLine));
      const textHeight = totalLines * lineHeight + extraHeight;

      if (currentPage.length > 0 && textHeight > availableHeight) {
        pages.push(currentPage);
        isFirstPage = false;
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

  const isVisibleSurahPlaying = currentTrackId ? currentTrackId.startsWith(`${visibleBookSurah}_`) : false;

  const handleBookPlayFromPage = useCallback(async () => {
    safeHaptic(Haptics.ImpactFeedbackStyle.Medium);

    if (isVisibleSurahPlaying && isPlaying) {
      await pauseAudio();
      return;
    }

    if (isVisibleSurahPlaying && !isPlaying) {
      await resumeAudio();
      return;
    }

    const surahData = bookSurahs.find((s) => s.surahNumber === visibleBookSurah);
    if (!surahData) return;

    const tracks = surahData.ayahs
      .filter((a) => a.localAudio || a.audio)
      .map((a) => ({
        id: `${visibleBookSurah}_${a.numberInSurah}`,
        uri: a.localAudio || a.audio,
        ayahNumberInSurah: a.numberInSurah,
      }));
    if (tracks.length === 0) return;

    await playQueue(tracks, 0);
  }, [bookSurahs, visibleBookSurah, isVisibleSurahPlaying, isPlaying, playQueue, pauseAudio, resumeAudio]);

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

  const prevTrackIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!audioDrivenRef.current || !bookPages.length) return

    const currentPageAyahs = bookPages[bookPageIndex]
    if (!currentPageAyahs?.length) return

    const lastAyahNumber = currentPageAyahs[currentPageAyahs.length - 1].numberInSurah

    const prevTrackNum = prevTrackIdRef.current ? parseInt(prevTrackIdRef.current.split('_')[1], 10) : null
    const currentTrackNum = currentTrackId ? parseInt(currentTrackId.split('_')[1], 10) : null

    if (prevTrackNum === lastAyahNumber && currentTrackNum !== lastAyahNumber) {
      if (bookPageIndex < bookPages.length - 1) {
        setTimeout(() => {
          if (bookPageIndex < bookPages.length - 1) {
            goToNextPage()
          }
        }, 100)
      }
    }

    prevTrackIdRef.current = currentTrackId
  }, [currentTrackId, bookPageIndex, bookPages, goToNextPage])

  const visibleBookSurahRef = useRef(visibleBookSurah);
  useEffect(() => {
    visibleBookSurahRef.current = visibleBookSurah;
  }, [visibleBookSurah]);

  const selectedBookAyahRef = useRef(selectedBookAyah);
  useEffect(() => {
    selectedBookAyahRef.current = selectedBookAyah;
  }, [selectedBookAyah]);

  const bookSurahsRef = useRef(bookSurahs);
  useEffect(() => {
    bookSurahsRef.current = bookSurahs;
  }, [bookSurahs]);

  const handleBookmarkFlag = useCallback(() => {
    const sel = selectedBookAyahRef.current;
    if (!sel) return;
    const currentBookSurahs = bookSurahsRef.current;
    toggleBookmark({
      ayahNumber: sel.ayah.number,
      surahNumber: sel.surahNumber,
      surahName: currentBookSurahs.find(s => s.surahNumber === sel.surahNumber)?.meta?.name || surahArabicName,
      surahEnglishName: currentBookSurahs.find(s => s.surahNumber === sel.surahNumber)?.meta?.englishName || surahEnglishName,
      arabicText: sel.ayah.arabicText,
      translationText: sel.ayah.translationText,
      numberInSurah: sel.ayah.numberInSurah,
    });
    setSelectedBookAyah(null);
  }, [toggleBookmark, surahArabicName, surahEnglishName]);

  const handlePlayAyahFlag = useCallback(async () => {
    const sel = selectedBookAyahRef.current;
    if (!sel) return;
    safeHaptic(Haptics.ImpactFeedbackStyle.Light);
    const audioUri = sel.ayah.localAudio || sel.ayah.audio;
    if (audioUri) {
      const track = {
        id: `${sel.surahNumber}_${sel.ayah.numberInSurah}`,
        uri: audioUri,
        ayahNumberInSurah: sel.ayah.numberInSurah,
      };
      await playQueue([track], 0);
    } else {
      setSelectedBookAyah(null);
    }
  }, [playQueue]);

  const handleStopAyahFlag = useCallback(() => {
    stopAudio();
    setSelectedBookAyah(null);
  }, [stopAudio]);

  const bookmarkedSet = useMemo(() => {
    const set = new Set();
    for (const surahData of bookSurahs) {
      for (const ayah of surahData.ayahs) {
        if (isBookmarked(ayah.number)) {
          set.add(ayah.number);
        }
      }
    }
    return set;
  }, [bookSurahs, isBookmarked]);


  const renderAyah = useCallback(({ item, index }) => {
    return (
      <AyahCard
        ayah={item}
        theme={theme}
        isDark={isDark}
        isBookmarked={isBookmarked(item.number)}
        isCurrentPlaying={currentTrackId === `${surahNumber}_${item.numberInSurah}` && isPlaying}
        isCurrentLoading={currentTrackId === `${surahNumber}_${item.numberInSurah}` && isLoading}
        onPlayFromHere={handlePlayFromHere}
        onBookmark={handleBookmark}
      />
    );
  }, [theme, isDark, isBookmarked, currentTrackId, surahNumber, isPlaying, isLoading, handlePlayFromHere, handleBookmark]);

  const longPressHandler = useCallback((ayah, locX, locY, sNum) => {
    try {
      const newSelection = {
        ayah: { ...ayah },
        surahNumber: sNum,
        x: locX,
        y: locY,
      };
      safeHaptic(Haptics.ImpactFeedbackStyle.Medium);
      InteractionManager.runAfterInteractions(() => {
        setSelectedBookAyah(newSelection);
      });
    } catch (_) { }
  }, []);

  const dismissSelection = useCallback(() => {
    const sel = selectedBookAyahRef.current;
    if (!sel) return;
    const selTrackId = `${sel.surahNumber}_${sel.ayah.numberInSurah}`;
    if (isPlaying && currentTrackId === selTrackId) return;
    setSelectedBookAyah(null);
  }, [isPlaying, currentTrackId]);

  const prevIsPlayingRef = useRef(false);
  const prevTrackForSelRef = useRef<string | null>(null);
  useEffect(() => {
    prevIsPlayingRef.current = isPlaying;
    prevTrackForSelRef.current = currentTrackId;
  }, [selectedBookAyah]);
  useEffect(() => {
    const sel = selectedBookAyahRef.current;
    if (sel) {
      const selTrackId = `${sel.surahNumber}_${sel.ayah.numberInSurah}`;
      const wasPlayingThisAyah = prevIsPlayingRef.current && prevTrackForSelRef.current === selTrackId;
      const stoppedNow = !isPlaying || currentTrackId !== selTrackId;
      if (wasPlayingThisAyah && stoppedNow) {
        setSelectedBookAyah(null);
      }
      prevTrackForSelRef.current = currentTrackId;
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, currentTrackId]);

  const mushafColors = useMemo(() => ({
    text: theme.text,
    btnBg: theme.mushafBtnBg,
    btnBorder: theme.mushafBtnBorder,
    btnIcon: theme.mushafBtnIcon,
    activeStyle: { backgroundColor: theme.mushafActive, color: theme.text },
  }), [theme]);

  const renderBookSurahItem = useCallback(({ item: surahData, index: sIdx }) => {
    return (
      <MushafSurahBlock
        surahData={surahData}
        sIdx={sIdx}
        screenWidth={screenWidth}
        currentTrackId={currentTrackId}
        isPlaying={isPlaying}
        bookmarkedSet={bookmarkedSet}
        selectedBookAyahNumber={selectedBookAyah?.surahNumber === surahData.surahNumber ? selectedBookAyah?.ayah.number : null}
        selectedBookAyahX={selectedBookAyah?.surahNumber === surahData.surahNumber ? selectedBookAyah?.x : 0}
        selectedBookAyahY={selectedBookAyah?.surahNumber === surahData.surahNumber ? selectedBookAyah?.y : 0}
        selectedBookAyahSurah={selectedBookAyah?.surahNumber ?? null}
        onBookmarkFlag={handleBookmarkFlag}
        onPlayAyah={handlePlayAyahFlag}
        onStopAyah={handleStopAyahFlag}
        onLongPress={longPressHandler}
        onDismissSelection={dismissSelection}
        mushafColors={mushafColors}
      />
    );
  }, [screenWidth, currentTrackId, isPlaying, bookmarkedSet, selectedBookAyah, handleBookmarkFlag, handlePlayAyahFlag, handleStopAyahFlag, longPressHandler, dismissSelection, mushafColors]);

  const bookSurahKeyExtractor = useCallback((item) => item.surahNumber.toString(), []);

  const handleBookFlatListScroll = useCallback((e) => {
    bookScrollYRef.current = e.nativeEvent.contentOffset.y;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const scrollY = contentOffset.y;
    const viewportCenter = scrollY + layoutMeasurement.height / 2;
    const layouts = surahLayoutsRef.current;
    let found = null;
    for (const key of Object.keys(layouts)) {
      const { y, height } = layouts[key];
      if (viewportCenter >= y && viewportCenter < y + height) {
        found = parseInt(key, 10);
        break;
      }
    }
    if (found && found !== visibleBookSurahRef.current) {
      setVisibleBookSurah(found);
    }
  }, []);


  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background, paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>

          <View style={styles.topBarCenter} />
          <View style={styles.topBarRight} />
        </View>

        <View style={styles.centered}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={theme.textSecondary}
          />

          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            Could not load this surah
          </Text>

          <Pressable
            onPress={loadSurah}
            style={({ pressed }) => [
              styles.retryButton,
              {
                backgroundColor: "#40433f",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const toggleBar = (
    <View style={styles.toggleContainer}>
      <Pressable
        onPress={() => changeViewMode("original")}
        style={[
          styles.toggleBtn,
          viewMode === "original" && { backgroundColor: theme.border },
        ]}
      >
        <Ionicons
          name="list-outline"
          size={16}
          color={viewMode === "original" ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.toggleText,
            { color: viewMode === "original" ? theme.text : theme.textSecondary },
          ]}
        >
          List
        </Text>
      </Pressable>
      <Pressable
        onPress={() => changeViewMode("book")}
        style={[
          styles.toggleBtn,
          viewMode === "book" && { backgroundColor: theme.border },
        ]}
      >
        <Ionicons
          name="book-outline"
          size={16}
          color={viewMode === "book" ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.toggleText,
            { color: viewMode === "book" ? theme.text : theme.textSecondary },
          ]}
        >
          Book
        </Text>
      </Pressable>
    </View>
  );

  if (viewMode === "book") {
    return (
      <View style={[styles.container, { backgroundColor: theme.mushafBg }]}>
        <RadialGradientBg width={screenWidth} height={screenHeight} bgColor={theme.mushafBg} />
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
              {visibleBookSurahName}
            </Text>
          </View>
          <View style={styles.topBarRight}>
            <Pressable
              onPress={handleBookPlayFromPage}
              hitSlop={12}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              {isLoading && isVisibleSurahPlaying ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Ionicons
                  name={isPlaying && isVisibleSurahPlaying ? "pause" : "play"}
                  size={22}
                  color={theme.accent}
                />
              )}
            </Pressable>
          </View>
        </View>

        <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
          {toggleBar}
        </View>
        <FlatList
          ref={bookScrollRef}
          data={bookSurahs}
          keyExtractor={bookSurahKeyExtractor}
          renderItem={renderBookSurahItem}
          contentContainerStyle={styles.mushafContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS !== 'web'}
          windowSize={3}
          maxToRenderPerBatch={1}
          initialNumToRender={1}
          updateCellsBatchingPeriod={100}
          onScroll={handleBookFlatListScroll}
          scrollEventThrottle={32}
          onEndReached={loadNextBookSurah}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <>
              {loadingNextSurah ? (
                <View style={styles.mushafLoadingMore}>
                  <ActivityIndicator size="small" color="#706c67" />
                </View>
              ) : null}
              <View style={{ height: 120 }} />
            </>
          }
        />
        {bookmarkPopup && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 999, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }]}
            onPress={() => setBookmarkPopup(null)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.bookmarkPopupCard}>
                <Text style={styles.bookmarkPopupAyahPreview} numberOfLines={3}>
                  {bookmarkPopup.ayah.arabicText}
                </Text>
                <View style={styles.bookmarkPopupDivider} />
                <Pressable
                  onPress={() => {
                    const { ayah } = bookmarkPopup;
                    safeHaptic(Haptics.ImpactFeedbackStyle.Light);
                    toggleBookmark({
                      ayahNumber: ayah.number,
                      surahNumber: ayah.surahNumber,
                      surahName: bookSurahs.find(s => s.surahNumber === ayah.surahNumber)?.meta?.name || surahArabicName,
                      surahEnglishName: bookSurahs.find(s => s.surahNumber === ayah.surahNumber)?.meta?.englishName || surahEnglishName,
                      arabicText: ayah.arabicText,
                      translationText: ayah.translationText,
                      numberInSurah: ayah.numberInSurah,
                    });
                    setBookmarkPopup(null);
                  }}
                  style={({ pressed }) => [styles.bookmarkPopupBtn, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons
                    name={isBookmarked(bookmarkPopup.ayah.number) ? "bookmark" : "bookmark-outline"}
                    size={20}
                    color="#8C7563"
                  />
                  <Text style={styles.bookmarkPopupText}>
                    {isBookmarked(bookmarkPopup.ayah.number) ? "Remove Bookmark" : "Bookmark Ayah"}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
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

        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={info => {
          const averageItemHeight = 200;
          const offset = info.index * averageItemHeight;
          flatListRef.current?.scrollToOffset({ offset, animated: false });
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0,
            });
          }, 300);
        }}
        ListHeaderComponent={
          <View>
            {surahNumber !== 9 ? (
              <View style={styles.bismillah}>
                <Text style={[styles.bismillahText, { color: theme.arabicText }]}>
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ {surahNumber === 1 ? "﴿١﴾" : ""}
                </Text>
              </View>
            ) : null}
            <Pressable
              onPress={isThisSurahPlaying ? handlePauseResume : handlePlayFromStart}
              style={({ pressed }) => [
                styles.playAllButton,
                {
                  backgroundColor: isThisSurahPlaying
                    ? (isDark ? "rgba(58,58,58,0.5)" : "rgba(228,210,201,0.5)")
                    : theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={18}
                color="#8C7563"
              />
              <Text style={[
                styles.playAllText,
                { color: "#8C7563" },
              ]}>
                {isPlaying ? "Pause" : "Play from Start"}
              </Text>
            </Pressable>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        initialNumToRender={10}
      />

      {isThisSurahPlaying || (currentTrackId?.startsWith(`${surahNumber}_`) && !isPlaying && currentAyahInSurah) ? (
        <View style={[
          styles.playerBar,
          {
            backgroundColor: "#8C7563",
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
              <Ionicons name="play-skip-back" size={20} color="#fef9f3" />
            </Pressable>
            <Pressable onPress={handlePauseResume} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fef9f3" />
              ) : (
                <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={36} color="#fef9f3" />
              )}
            </Pressable>
            <Pressable onPress={skipNext} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Ionicons name="play-skip-forward" size={20} color="#fef9f3" />
            </Pressable>
            <Pressable onPress={stopAudio} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginLeft: 4 })}>
              <Ionicons name="close" size={22} color="rgba(254,249,243,0.6)" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const AyahCard = React.memo(function AyahCard({
  ayah, theme, isDark, isBookmarked, isCurrentPlaying,
  isCurrentLoading, onPlayFromHere, onBookmark,
}) {
  const hasAudio = !!(ayah.localAudio || ayah.audio);

  return (
    <View style={[
      styles.ayahCard,
      {
        backgroundColor: isCurrentPlaying
          ? "rgba(228,210,201,0.4)"
          : theme.ayahBg,
        borderColor: isCurrentPlaying ? theme.tint : theme.border,
        borderWidth: isCurrentPlaying ? 1.5 : 1,
      },
    ]}>
      <View style={styles.ayahHeader}>
        <View
          style={[
            styles.verseNumBadge,
            { backgroundColor: theme.border },
          ]}
        >
          <Text style={[styles.verseNumText, { color: theme.text }]}>{ayah.numberInSurah}</Text>
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

      <View style={{ direction: "rtl" }}>
        <Text style={[styles.ayahArabic, { color: theme.arabicText }]}>{ayah.arabicText}</Text>
      </View>

      <View style={{ direction: "ltr" }}>
        <Text style={[styles.ayahTranslation, { color: theme.translationText }]}>{ayah.translationText}</Text>
      </View>
    </View>
  );
});

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
    textAlign: "justify",
    fontFamily: "Amiri_400Regular",
    marginBottom: 12,
    writingDirection: "rtl",

  },
  ayahTranslation: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
    textAlign: "justify",
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
    color: "#fef9f3",
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
    color: "#fef9f3",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  playerSurahText: {
    color: "rgba(254,249,243,0.7)",
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
  mushafScroll: {
    flex: 1,
  },
  mushafContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  surahDivider: {
    height: 1,
    backgroundColor: "rgba(164,159,150,0.3)",
    marginHorizontal: 10,
    marginTop: 36,
  },
  mushafBismillah: {
    fontSize: 26,
    fontFamily: "ScheherazadeNew_700Bold",
    color: "#0c0c0c",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 52,
  },
  mushafArabicText: {
    textAlign: Platform.OS === "web" ? "justify" : "justify",
    fontSize: 24,
    lineHeight: 65,
    fontFamily: "Amiri_400Regular",
    color: "#0c0c0c",
    writingDirection: "rtl",

    paddingHorizontal: 0,
  },
  mushafTextActive: {
    backgroundColor: "#FFD5CC",
    color: "#0c0c0c",
  },
  mushafVerseMarker: {
    fontSize: 18,
    color: "#706c67",
    fontFamily: "Amiri_400Regular",
  },
  mushafLoadingMore: {
    paddingVertical: 30,
    alignItems: "center",
  },
  mushafTextBookmarked: {
    color: "#8C7563",
    backgroundColor: "rgba(140,117,99,0.12)",
  },

  bookmarkPopupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  bookmarkPopupCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 8,
    width: 260,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  bookmarkPopupAyahPreview: {
    fontSize: 19,
    fontFamily: "ScheherazadeNew_700Bold",
    color: "#0c0c0c",
    textAlign: "right",
    paddingHorizontal: 16,
    paddingVertical: 12,
    lineHeight: 36,
  },
  bookmarkPopupDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  bookmarkPopupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bookmarkPopupText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#40433f",
  },

  mushafAyahText: {
    writingDirection: "rtl",
    fontSize: 24,
    lineHeight: 65,
    textAlign: "justify",
    fontFamily: "Amiri_400Regular",
    color: "#0c0c0c",
  },
  mushafTextSelected: {
    backgroundColor: "rgba(140,117,99,0.07)",
  },
  mushafAyahRow: {
    position: "relative",
    marginBottom: 2,
  },
  mushafBookmarkFlag: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef9f3",
    borderWidth: 1,
    borderColor: "rgba(140,117,99,0.3)",
    zIndex: 999
  },
  mushafBookmarkFlagNum: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#8C7563",
  },
  mushafActionRow: {
    position: "absolute",
    flexDirection: "row",
    gap: 6,
    zIndex: 999,
  },
  mushafActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef9f3",
    borderWidth: 1,
    borderColor: "rgba(140,117,99,0.3)",
  },
});