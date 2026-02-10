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
  const res = await fetch(`${BASE_URL}/surah`);
  const json = await res.json();
  if (json.code === 200) return json.data;
  throw new Error("Failed to fetch surahs");
}

export async function fetchSurahArabic(surahNumber: number): Promise<AyahEdition[]> {
  const res = await fetch(`${BASE_URL}/surah/${surahNumber}/ar.alafasy`);
  const json = await res.json();
  if (json.code === 200) return json.data.ayahs;
  throw new Error("Failed to fetch surah arabic");
}

export async function fetchSurahTranslation(surahNumber: number): Promise<AyahEdition[]> {
  const res = await fetch(`${BASE_URL}/surah/${surahNumber}/en.asad`);
  const json = await res.json();
  if (json.code === 200) return json.data.ayahs;
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

export function getArabicNumber(num: number): string {
  const arabicDigits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return num
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
}
