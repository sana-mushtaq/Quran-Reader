import surahListData from "@/assets/data/surah-list.json";
import quranData from "@/assets/data/quran-data.json";

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

const typedQuranData = quranData as Record<string, {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: Array<{
    number: number;
    numberInSurah: number;
    text: string;
    audio?: string;
    translation: string;
  }>;
}>;

export function fetchSurahs(): Surah[] {
  return surahListData as Surah[];
}

export function fetchSurahArabic(surahNumber: number): AyahEdition[] {
  const surah = typedQuranData[surahNumber.toString()];
  if (!surah) throw new Error("Surah not found");

  return surah.ayahs.map((a) => ({
    number: a.number,
    text: a.text,
    numberInSurah: a.numberInSurah,
    audio: a.audio,
    surah: {
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      numberOfAyahs: surah.numberOfAyahs,
      revelationType: surah.revelationType,
    },
  }));
}

export function fetchSurahTranslation(surahNumber: number): AyahEdition[] {
  const surah = typedQuranData[surahNumber.toString()];
  if (!surah) throw new Error("Surah not found");

  return surah.ayahs.map((a) => ({
    number: a.number,
    text: a.translation,
    numberInSurah: a.numberInSurah,
    surah: {
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      numberOfAyahs: surah.numberOfAyahs,
      revelationType: surah.revelationType,
    },
  }));
}

export function fetchRandomAyah(): {
  arabic: AyahEdition;
  translation: AyahEdition;
} {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const totalAyahs = 6236;
  const ayahIndex = (dayOfYear % totalAyahs) + 1;

  let globalCount = 0;
  for (let s = 1; s <= 114; s++) {
    const surah = typedQuranData[s.toString()];
    if (!surah) continue;
    for (const ayah of surah.ayahs) {
      globalCount++;
      if (globalCount === ayahIndex) {
        const surahInfo = {
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: surah.revelationType,
        };
        return {
          arabic: {
            number: ayah.number,
            text: ayah.text,
            numberInSurah: ayah.numberInSurah,
            audio: ayah.audio,
            surah: surahInfo,
          },
          translation: {
            number: ayah.number,
            text: ayah.translation,
            numberInSurah: ayah.numberInSurah,
            surah: surahInfo,
          },
        };
      }
    }
  }

  const fallback = typedQuranData["1"];
  const firstAyah = fallback.ayahs[0];
  const fallbackSurah = {
    number: fallback.number,
    name: fallback.name,
    englishName: fallback.englishName,
    englishNameTranslation: fallback.englishNameTranslation,
    numberOfAyahs: fallback.numberOfAyahs,
    revelationType: fallback.revelationType,
  };
  return {
    arabic: {
      number: firstAyah.number,
      text: firstAyah.text,
      numberInSurah: firstAyah.numberInSurah,
      audio: firstAyah.audio,
      surah: fallbackSurah,
    },
    translation: {
      number: firstAyah.number,
      text: firstAyah.translation,
      numberInSurah: firstAyah.numberInSurah,
      surah: fallbackSurah,
    },
  };
}

export function getArabicNumber(num: number): string {
  const arabicDigits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return num
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
}
