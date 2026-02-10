import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { Surah, AyahEdition } from "./quran-api";

const SURAHS_LIST_KEY = "@quran_surahs_list";
const SURAH_ARABIC_PREFIX = "@quran_surah_arabic_";
const SURAH_TRANSLATION_PREFIX = "@quran_surah_translation_";
const ALL_DATA_CACHED_KEY = "@quran_all_data_cached";
const AUDIO_DIR = (FileSystem.documentDirectory || "") + "quran_audio/";

export async function ensureAudioDir() {
  if (Platform.OS === "web") return;
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
}

export async function cacheSurahsList(surahs: Surah[]) {
  await AsyncStorage.setItem(SURAHS_LIST_KEY, JSON.stringify(surahs));
}

export async function getCachedSurahsList(): Promise<Surah[] | null> {
  const data = await AsyncStorage.getItem(SURAHS_LIST_KEY);
  return data ? JSON.parse(data) : null;
}

export async function cacheSurahArabic(surahNumber: number, ayahs: AyahEdition[]) {
  await AsyncStorage.setItem(
    SURAH_ARABIC_PREFIX + surahNumber,
    JSON.stringify(ayahs)
  );
}

export async function getCachedSurahArabic(surahNumber: number): Promise<AyahEdition[] | null> {
  const data = await AsyncStorage.getItem(SURAH_ARABIC_PREFIX + surahNumber);
  return data ? JSON.parse(data) : null;
}

export async function cacheSurahTranslation(surahNumber: number, ayahs: AyahEdition[]) {
  await AsyncStorage.setItem(
    SURAH_TRANSLATION_PREFIX + surahNumber,
    JSON.stringify(ayahs)
  );
}

export async function getCachedSurahTranslation(surahNumber: number): Promise<AyahEdition[] | null> {
  const data = await AsyncStorage.getItem(SURAH_TRANSLATION_PREFIX + surahNumber);
  return data ? JSON.parse(data) : null;
}

export function getAudioFilePath(surahNumber: number, ayahNumber: number): string {
  return `${AUDIO_DIR}${surahNumber}_${ayahNumber}.mp3`;
}

export async function isAudioDownloaded(surahNumber: number, ayahNumber: number): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const path = getAudioFilePath(surahNumber, ayahNumber);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

export async function isSurahAudioDownloaded(surahNumber: number, totalAyahs: number): Promise<boolean> {
  if (Platform.OS === "web") return false;
  for (let i = 1; i <= totalAyahs; i++) {
    const exists = await isAudioDownloaded(surahNumber, i);
    if (!exists) return false;
  }
  return true;
}

export async function isSurahTextCached(surahNumber: number): Promise<boolean> {
  const arabic = await AsyncStorage.getItem(SURAH_ARABIC_PREFIX + surahNumber);
  const translation = await AsyncStorage.getItem(SURAH_TRANSLATION_PREFIX + surahNumber);
  return arabic !== null && translation !== null;
}

export async function downloadAyahAudio(
  surahNumber: number,
  ayahNumberInSurah: number,
  audioUrl: string
): Promise<void> {
  if (Platform.OS === "web") return;
  await ensureAudioDir();
  const filePath = getAudioFilePath(surahNumber, ayahNumberInSurah);
  const info = await FileSystem.getInfoAsync(filePath);
  if (info.exists) return;

  await FileSystem.downloadAsync(audioUrl, filePath);
}

export async function deleteSurahAudio(surahNumber: number, totalAyahs: number): Promise<void> {
  if (Platform.OS === "web") return;
  for (let i = 1; i <= totalAyahs; i++) {
    const filePath = getAudioFilePath(surahNumber, i);
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  }
}

export async function deleteAllAudio(): Promise<void> {
  if (Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(AUDIO_DIR, { idempotent: true });
    await ensureAudioDir();
  }
}

export async function setAllDataCached(value: boolean) {
  await AsyncStorage.setItem(ALL_DATA_CACHED_KEY, JSON.stringify(value));
}

export async function isAllDataCached(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ALL_DATA_CACHED_KEY);
  return val ? JSON.parse(val) : false;
}

export async function getOfflineStorageSize(): Promise<string> {
  if (Platform.OS === "web") return "0 MB";
  try {
    const info = await FileSystem.getInfoAsync(AUDIO_DIR);
    if (info.exists && "size" in info) {
      const mb = ((info as any).size || 0) / (1024 * 1024);
      return `${mb.toFixed(1)} MB`;
    }
  } catch {}
  return "Unknown";
}
