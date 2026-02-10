import AsyncStorage from "@react-native-async-storage/async-storage";
import { Paths, File as FSFile, Directory as FSDirectory } from "expo-file-system";
import ExpoFileSystem from "expo-file-system/src/ExpoFileSystem";
import { Platform } from "react-native";
import { Surah, AyahEdition } from "./quran-api";

const SURAHS_LIST_KEY = "@quran_surahs_list";
const SURAH_ARABIC_PREFIX = "@quran_surah_arabic_";
const SURAH_TRANSLATION_PREFIX = "@quran_surah_translation_";
const ALL_DATA_CACHED_KEY = "@quran_all_data_cached";

function getAudioDir(): FSDirectory | null {
  if (Platform.OS === "web") return null;
  return new FSDirectory(Paths.document, "quran_audio");
}

export function ensureAudioDir() {
  if (Platform.OS === "web") return;
  const dir = getAudioDir();
  if (dir && !dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
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

function getAudioFile(surahNumber: number, ayahNumber: number): FSFile | null {
  if (Platform.OS === "web") return null;
  const dir = getAudioDir();
  if (!dir) return null;
  return new FSFile(dir, `${surahNumber}_${ayahNumber}.mp3`);
}

export function getAudioFilePath(surahNumber: number, ayahNumber: number): string | null {
  const file = getAudioFile(surahNumber, ayahNumber);
  return file ? file.uri : null;
}

export function isAudioDownloaded(surahNumber: number, ayahNumber: number): boolean {
  if (Platform.OS === "web") return false;
  const file = getAudioFile(surahNumber, ayahNumber);
  return file ? file.exists : false;
}

export function isSurahAudioDownloaded(surahNumber: number, totalAyahs: number): boolean {
  if (Platform.OS === "web") return false;
  for (let i = 1; i <= totalAyahs; i++) {
    if (!isAudioDownloaded(surahNumber, i)) return false;
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
  ensureAudioDir();

  const file = getAudioFile(surahNumber, ayahNumberInSurah);
  if (!file) return;
  if (file.exists) return;

  const dir = getAudioDir();
  if (!dir) return;

  await ExpoFileSystem.downloadFileAsync(audioUrl, file);
}

export function deleteSurahAudio(surahNumber: number, totalAyahs: number): void {
  if (Platform.OS === "web") return;
  for (let i = 1; i <= totalAyahs; i++) {
    const file = getAudioFile(surahNumber, i);
    if (file && file.exists) {
      file.delete();
    }
  }
}

export function deleteAllAudio(): void {
  if (Platform.OS === "web") return;
  const dir = getAudioDir();
  if (dir && dir.exists) {
    dir.delete();
  }
  ensureAudioDir();
}

export async function setAllDataCached(value: boolean) {
  await AsyncStorage.setItem(ALL_DATA_CACHED_KEY, JSON.stringify(value));
}

export async function isAllDataCached(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ALL_DATA_CACHED_KEY);
  return val ? JSON.parse(val) : false;
}
