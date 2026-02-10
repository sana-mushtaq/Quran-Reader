import surahListData from "@/assets/data/surah-list.json";
import quranData from "@/assets/data/quran-data.json";

export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
}

export interface AyahData {
  globalNumber: number;
  numberInSurah: number;
  surahNumber: number;
  arabicText: string;
  translation: string;
  audio?: string;
}

export interface QuranPage {
  pageNumber: number;
  ayahs: AyahData[];
  surahHeaders: { surahNumber: number; beforeAyahIndex: number }[];
}

const typedQuranData = quranData as Record<string, {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs?: number;
  revelationType: string;
  ayahs: Array<{
    number: number;
    numberInSurah: number;
    text: string;
    audio?: string;
    translation: string;
  }>;
}>;

const surahList: SurahInfo[] = (surahListData as any[]).map((s) => ({
  number: s.number,
  name: s.name,
  englishName: s.englishName,
  englishNameTranslation: s.englishNameTranslation,
  revelationType: s.revelationType,
  numberOfAyahs: typedQuranData[s.number.toString()]?.ayahs?.length ?? 0,
}));

let allAyahsCache: AyahData[] | null = null;
let allPagesCache: QuranPage[] | null = null;
let surahPageMapCache: Map<number, number> | null = null;

function getAllAyahs(): AyahData[] {
  if (allAyahsCache) return allAyahsCache;
  const ayahs: AyahData[] = [];
  for (let s = 1; s <= 114; s++) {
    const surah = typedQuranData[s.toString()];
    if (!surah) continue;
    for (const a of surah.ayahs) {
      ayahs.push({
        globalNumber: a.number,
        numberInSurah: a.numberInSurah,
        surahNumber: s,
        arabicText: a.text,
        translation: a.translation,
        audio: a.audio,
      });
    }
  }
  allAyahsCache = ayahs;
  return ayahs;
}

const AYAHS_PER_PAGE = 6;

function buildPages(): QuranPage[] {
  if (allPagesCache) return allPagesCache;
  const allAyahs = getAllAyahs();
  const pages: QuranPage[] = [];
  let currentPage: AyahData[] = [];
  let surahHeaders: { surahNumber: number; beforeAyahIndex: number }[] = [];
  let lastSurah = 0;

  for (const ayah of allAyahs) {
    if (ayah.surahNumber !== lastSurah) {
      if (currentPage.length > 0 && currentPage.length >= 3) {
        pages.push({
          pageNumber: pages.length + 1,
          ayahs: [...currentPage],
          surahHeaders: [...surahHeaders],
        });
        currentPage = [];
        surahHeaders = [];
      }
      surahHeaders.push({ surahNumber: ayah.surahNumber, beforeAyahIndex: currentPage.length });
      lastSurah = ayah.surahNumber;
    }

    currentPage.push(ayah);

    if (currentPage.length >= AYAHS_PER_PAGE) {
      pages.push({
        pageNumber: pages.length + 1,
        ayahs: [...currentPage],
        surahHeaders: [...surahHeaders],
      });
      currentPage = [];
      surahHeaders = [];
    }
  }

  if (currentPage.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      ayahs: [...currentPage],
      surahHeaders: [...surahHeaders],
    });
  }

  allPagesCache = pages;
  return pages;
}

function buildSurahPageMap(): Map<number, number> {
  if (surahPageMapCache) return surahPageMapCache;
  const pages = buildPages();
  const map = new Map<number, number>();
  for (const page of pages) {
    for (const ayah of page.ayahs) {
      if (!map.has(ayah.surahNumber)) {
        map.set(ayah.surahNumber, page.pageNumber);
      }
    }
  }
  surahPageMapCache = map;
  return map;
}

export function getSurahList(): SurahInfo[] {
  return surahList;
}

export function getSurahInfo(surahNumber: number): SurahInfo | undefined {
  return surahList.find((s) => s.number === surahNumber);
}

export function getQuranPages(): QuranPage[] {
  return buildPages();
}

export function getTotalPages(): number {
  return buildPages().length;
}

export function getPage(pageNumber: number): QuranPage | undefined {
  const pages = buildPages();
  return pages[pageNumber - 1];
}

export function getPageForSurah(surahNumber: number): number {
  const map = buildSurahPageMap();
  return map.get(surahNumber) ?? 1;
}

export function getArabicNumber(num: number): string {
  const arabicDigits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return num.toString().split("").map((d) => arabicDigits[parseInt(d)]).join("");
}
