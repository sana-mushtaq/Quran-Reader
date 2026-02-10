import {
  getCachedSurahsList,
  cacheSurahsList,
  getCachedSurahArabic,
  cacheSurahArabic,
  getCachedSurahTranslation,
  cacheSurahTranslation,
  getAudioFilePath,
  isAudioDownloaded,
} from "./offline-storage";
import { Platform } from "react-native";

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  hizbQuarter: number;
}

export interface AyahEdition {
  number: number;
  text: string;
  numberInSurah: number;
  audio?: string;
  surah?: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  };
}

const BASE_URL = "https://api.alquran.cloud/v1";

export async function fetchSurahs(): Promise<Surah[]> {
  const cached = await getCachedSurahsList();
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/surah`);
  const json = await res.json();
  if (json.code === 200) {
    await cacheSurahsList(json.data);
    return json.data;
  }
  throw new Error("Failed to fetch surahs");
}

export async function fetchSurahArabic(surahNumber: number): Promise<AyahEdition[]> {
  const cached = await getCachedSurahArabic(surahNumber);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/surah/${surahNumber}/ar.alafasy`);
  const json = await res.json();
  if (json.code === 200) {
    await cacheSurahArabic(surahNumber, json.data.ayahs);
    return json.data.ayahs;
  }
  throw new Error("Failed to fetch surah arabic");
}

export async function fetchSurahTranslation(surahNumber: number): Promise<AyahEdition[]> {
  const cached = await getCachedSurahTranslation(surahNumber);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/surah/${surahNumber}/en.asad`);
  const json = await res.json();
  if (json.code === 200) {
    await cacheSurahTranslation(surahNumber, json.data.ayahs);
    return json.data.ayahs;
  }
  throw new Error("Failed to fetch surah translation");
}

export async function fetchRandomAyah(): Promise<{
  arabic: AyahEdition;
  translation: AyahEdition;
}> {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const ayahNumber = (dayOfYear % 6236) + 1;

  const cached = await getDailyVerseFromCache(ayahNumber);
  if (cached) return cached;

  const [arabicRes, translationRes] = await Promise.all([
    fetch(`${BASE_URL}/ayah/${ayahNumber}/ar.alafasy`),
    fetch(`${BASE_URL}/ayah/${ayahNumber}/en.asad`),
  ]);

  const arabicJson = await arabicRes.json();
  const translationJson = await translationRes.json();

  if (arabicJson.code === 200 && translationJson.code === 200) {
    return {
      arabic: arabicJson.data,
      translation: translationJson.data,
    };
  }
  throw new Error("Failed to fetch daily ayah");
}

async function getDailyVerseFromCache(globalAyahNumber: number): Promise<{
  arabic: AyahEdition;
  translation: AyahEdition;
} | null> {
  try {
    const surahs = await getCachedSurahsList();
    if (!surahs) return null;

    let cumulative = 0;
    let targetSurah: Surah | null = null;
    let numberInSurah = 0;

    for (const surah of surahs) {
      if (cumulative + surah.numberOfAyahs >= globalAyahNumber) {
        targetSurah = surah;
        numberInSurah = globalAyahNumber - cumulative;
        break;
      }
      cumulative += surah.numberOfAyahs;
    }

    if (!targetSurah) return null;

    const arabicAyahs = await getCachedSurahArabic(targetSurah.number);
    const translationAyahs = await getCachedSurahTranslation(targetSurah.number);

    if (!arabicAyahs || !translationAyahs) return null;

    const arabic = arabicAyahs.find((a) => a.numberInSurah === numberInSurah);
    const translation = translationAyahs.find((a) => a.numberInSurah === numberInSurah);

    if (!arabic || !translation) return null;

    return { arabic, translation };
  } catch {
    return null;
  }
}

export async function getLocalAudioUri(
  surahNumber: number,
  ayahNumberInSurah: number
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const downloaded = await isAudioDownloaded(surahNumber, ayahNumberInSurah);
  if (downloaded) {
    return getAudioFilePath(surahNumber, ayahNumberInSurah);
  }
  return null;
}

export function getArabicNumber(num: number): string {
  const arabicDigits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return num
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
}
