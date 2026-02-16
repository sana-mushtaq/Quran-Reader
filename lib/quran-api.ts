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

//base api when the app is loaded first time it will fetch from there
const BASE_URL = "https://api.alquran.cloud/v1";

//fetch all surahs
export async function fetchSurahs() {
  //if there are surah in cache fetch from thre
  const cached = await getCachedSurahsList();
  if (cached) return cached;

  //else go to the url
  const res = await fetch(`${BASE_URL}/surah`);
  const json = await res.json();
  if (json.code === 200) {
    await cacheSurahsList(json.data);
    return json.data;
  }
  throw new Error("Failed to fetch surahs");
}

//fetch surah audio
export async function fetchSurahArabic(surahNumber) {
  const cached = await getCachedSurahArabic(surahNumber);
  if (cached) return cached;
  
  const res = await fetch(`${BASE_URL}/surah/${surahNumber}/ar.alafasy`);
  const json = await res.json();
  if (json.code === 200) {
    const surahMeta = {
      number: json.data.number,
      name: json.data.name,
      englishName: json.data.englishName,
      englishNameTranslation: json.data.englishNameTranslation,
      numberOfAyahs: json.data.numberOfAyahs,
      revelationType: json.data.revelationType,
    };
    const ayahsWithSurah = json.data.ayahs.map((a) => ({
      ...a,
      surah: surahMeta,
    }));
    await cacheSurahArabic(surahNumber, ayahsWithSurah);
    return ayahsWithSurah;
  }
  throw new Error("Failed to fetch surah arabic");
}

///fetch surah translation
export async function fetchSurahTranslation(surahNumber) {

  //if there are surah in cache fetch from thre
  const cached = await getCachedSurahTranslation(surahNumber);
  if (cached) return cached;
  
  //else go to the url
  const res = await fetch(`${BASE_URL}/surah/${surahNumber}/en.asad`);
  const json = await res.json();
  if (json.code === 200) {
    await cacheSurahTranslation(surahNumber, json.data.ayahs);
    return json.data.ayahs;
  }
  throw new Error("Failed to fetch surah translation");
}

//fetch random ayah for ayan calendar
export async function fetchRandomAyah() {
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

//if there is a surah in cache go there
async function getDailyVerseFromCache(globalAyahNumber){
  try {
    const surahs = await getCachedSurahsList();
    if (!surahs) return null;

    let cumulative = 0;
    let targetSurah = null;
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

    const surahMeta = {
      number: targetSurah.number,
      name: targetSurah.name,
      englishName: targetSurah.englishName,
      englishNameTranslation: targetSurah.englishNameTranslation,
      numberOfAyahs: targetSurah.numberOfAyahs,
      revelationType: targetSurah.revelationType,
    };

    return {
      arabic: { ...arabic, surah: arabic.surah || surahMeta },
      translation: { ...translation, surah: translation.surah || surahMeta },
    };
  } catch {
    return null;
  }
}
//get audio uri
export function getLocalAudioUri(
  surahNumber,
  ayahNumberInSurah
){
  if (Platform.OS === "web") return null;
  const downloaded = isAudioDownloaded(surahNumber, ayahNumberInSurah);
  if (downloaded) {
    return getAudioFilePath(surahNumber, ayahNumberInSurah);
  }
  return null;
}

//get arabic number of the surah
export function getArabicNumber(num) {
  const arabicDigits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return num
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
}
