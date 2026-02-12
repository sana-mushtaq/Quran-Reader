import AsyncStorage from "@react-native-async-storage/async-storage";
import { Paths, File as FSFile, Directory as FSDirectory } from "expo-file-system";
import { Platform } from "react-native";
import { Surah, AyahEdition } from "./quran-api";

const SURAHS_LIST_KEY = "@quran_surahs_list";
const SURAH_ARABIC_PREFIX = "@quran_surah_arabic_";
const SURAH_TRANSLATION_PREFIX = "@quran_surah_translation_";
const ALL_DATA_CACHED_KEY = "@quran_all_data_cached";

//get audio directory wheere surah audios are saved
function getAudioDir() {
  if (Platform.OS === "web") return null;
  return new FSDirectory(Paths.document, "quran_audio");
}

//cehck if directory exist
export function ensureAudioDir() {
  if (Platform.OS === "web") return;
  const dir = getAudioDir();
  if (dir && !dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
}

//set surah in cache
export async function cacheSurahsList(surahs) {
  await AsyncStorage.setItem(SURAHS_LIST_KEY, JSON.stringify(surahs));
}

//get surah from cache
export async function getCachedSurahsList() {
  const data = await AsyncStorage.getItem(SURAHS_LIST_KEY);
  return data ? JSON.parse(data) : null;
}

//surah audio
export async function cacheSurahArabic(surahNumber, ayahs) {
  await AsyncStorage.setItem(
    SURAH_ARABIC_PREFIX + surahNumber,
    JSON.stringify(ayahs)
  );
}

//get surah audio
export async function getCachedSurahArabic(surahNumber) {
  const data = await AsyncStorage.getItem(SURAH_ARABIC_PREFIX + surahNumber);
  return data ? JSON.parse(data) : null;
}

//cache surah translation
export async function cacheSurahTranslation(surahNumber, ayahs) {
  await AsyncStorage.setItem(
    SURAH_TRANSLATION_PREFIX + surahNumber,
    JSON.stringify(ayahs)
  );
}

//get surah translation
export async function getCachedSurahTranslation(surahNumber){
  const data = await AsyncStorage.getItem(SURAH_TRANSLATION_PREFIX + surahNumber);
  return data ? JSON.parse(data) : null;
}

//get audio file from storage
function getAudioFile(surahNumber, ayahNumber) {
  if (Platform.OS === "web") return null;
  const dir = getAudioDir();
  if (!dir) return null;
  return new FSFile(dir, `${surahNumber}_${ayahNumber}.mp3`);
}

//get file path where audio is stored
export function getAudioFilePath(surahNumber, ayahNumber){
  const file = getAudioFile(surahNumber, ayahNumber);
  return file ? file.uri : null;
}

//if audio id downloaded return true else false
export function isAudioDownloaded(surahNumber, ayahNumber) {
  if (Platform.OS === "web") return false;
  const file = getAudioFile(surahNumber, ayahNumber);
  return file ? file.exists : false;
}

//check if surah is doiwnlaoded
export function isSurahAudioDownloaded(surahNumber, totalAyahs) {
  if (Platform.OS === "web") return false;
  for (let i = 1; i <= totalAyahs; i++) {
    if (!isAudioDownloaded(surahNumber, i)) return false;
  }
  return true;
}

//check id surah arabic number is caches
export async function isSurahTextCached(surahNumber) {
  const arabic = await AsyncStorage.getItem(SURAH_ARABIC_PREFIX + surahNumber);
  const translation = await AsyncStorage.getItem(SURAH_TRANSLATION_PREFIX + surahNumber);
  return arabic !== null && translation !== null;
}

//download audio
export async function downloadAyahAudio(
  surahNumber,
  ayahNumberInSurah ,
  audioUrl
){
  if (Platform.OS === "web") return;
  ensureAudioDir();

  const file = getAudioFile(surahNumber, ayahNumberInSurah);
  if (!file) return;
  if (file.exists) return;

  const dir = getAudioDir();
  if (!dir) return;

  await FSFile.downloadFileAsync(audioUrl, file);
}

//delete surah audio
export function deleteSurahAudio(surahNumber, totalAyahs) {
  if (Platform.OS === "web") return;
  for (let i = 1; i <= totalAyahs; i++) {
    const file = getAudioFile(surahNumber, i);
    if (file && file.exists) {
      file.delete();
    }
  }
}

//deleet all audios
export function deleteAllAudio() {
  if (Platform.OS === "web") return;
  const dir = getAudioDir();
  if (dir && dir.exists) {
    dir.delete();
  }
  ensureAudioDir();
}

//set all items in cache
export async function setAllDataCached(value) {
  await AsyncStorage.setItem(ALL_DATA_CACHED_KEY, JSON.stringify(value));
}

//check if all items are cached retun true else false
export async function isAllDataCached(){
  const val = await AsyncStorage.getItem(ALL_DATA_CACHED_KEY);
  return val ? JSON.parse(val) : false;
}
