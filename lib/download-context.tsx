import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  cacheSurahsList,
  cacheSurahArabic,
  cacheSurahTranslation,
  downloadAyahAudio,
  isSurahTextCached,
  isSurahAudioDownloaded,
  ensureAudioDir,
  deleteSurahAudio,
  deleteAllAudio,
  setAllDataCached,
} from "./offline-storage";
import { fetchSurahs, fetchSurahArabic, fetchSurahTranslation, Surah } from "./quran-api";

const DOWNLOAD_STATUS_KEY = "@quran_download_status";

export type SurahDownloadStatus = "none" | "downloading" | "downloaded" | "error";

interface DownloadProgress {
  currentSurah: number;
  currentAyah: number;
  totalAyahs: number;
  totalSurahs: number;
  completedSurahs: number;
  overallPercent: number;
}

interface DownloadContextValue {
  surahStatus: Record<number, SurahDownloadStatus>;
  isDownloadingAll: boolean;
  downloadProgress: DownloadProgress | null;
  downloadAllContent: () => Promise<void>;
  downloadSurah: (surahNumber: number) => Promise<void>;
  cancelDownload: () => void;
  removeSurahDownload: (surahNumber: number, totalAyahs: number) => Promise<void>;
  removeAllDownloads: () => Promise<void>;
  totalDownloaded: number;
  initComplete: boolean;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [surahStatus, setSurahStatus] = useState<Record<number, SurahDownloadStatus>>({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [initComplete, setInitComplete] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    loadSavedStatus();
  }, []);

  const loadSavedStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem(DOWNLOAD_STATUS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSurahStatus(parsed);
      }
    } catch {}
    setInitComplete(true);
  };

  const saveStatus = async (status: Record<number, SurahDownloadStatus>) => {
    try {
      await AsyncStorage.setItem(DOWNLOAD_STATUS_KEY, JSON.stringify(status));
    } catch {}
  };

  const updateSurahStatus = useCallback((surahNumber: number, status: SurahDownloadStatus) => {
    setSurahStatus((prev) => {
      const next = { ...prev, [surahNumber]: status };
      saveStatus(next);
      return next;
    });
  }, []);

  const downloadSurah = useCallback(async (surahNumber: number) => {
    if (Platform.OS === "web") return;

    updateSurahStatus(surahNumber, "downloading");
    try {
      await ensureAudioDir();

      let arabicData = await fetchSurahArabic(surahNumber);
      let translationData = await fetchSurahTranslation(surahNumber);

      await cacheSurahArabic(surahNumber, arabicData);
      await cacheSurahTranslation(surahNumber, translationData);

      for (let i = 0; i < arabicData.length; i++) {
        const ayah = arabicData[i];
        if (ayah.audio) {
          await downloadAyahAudio(surahNumber, ayah.numberInSurah, ayah.audio);
        }
      }

      updateSurahStatus(surahNumber, "downloaded");
    } catch {
      updateSurahStatus(surahNumber, "error");
    }
  }, [updateSurahStatus]);

  const downloadAllContent = useCallback(async () => {
    if (Platform.OS === "web") return;

    cancelRef.current = false;
    setIsDownloadingAll(true);

    try {
      await ensureAudioDir();
      const surahs = await fetchSurahs();
      await cacheSurahsList(surahs);

      const totalSurahs = surahs.length;
      let completedSurahs = 0;

      for (let s = 0; s < surahs.length; s++) {
        if (cancelRef.current) break;

        const surah = surahs[s];
        const surahNum = surah.number;

        const alreadyCached = surahStatus[surahNum] === "downloaded";
        if (alreadyCached) {
          const textCached = await isSurahTextCached(surahNum);
          const audioCached = await isSurahAudioDownloaded(surahNum, surah.numberOfAyahs);
          if (textCached && audioCached) {
            completedSurahs++;
            setDownloadProgress({
              currentSurah: surahNum,
              currentAyah: 0,
              totalAyahs: surah.numberOfAyahs,
              totalSurahs,
              completedSurahs,
              overallPercent: Math.round((completedSurahs / totalSurahs) * 100),
            });
            continue;
          }
        }

        updateSurahStatus(surahNum, "downloading");

        try {
          const [arabicData, translationData] = await Promise.all([
            fetchSurahArabic(surahNum),
            fetchSurahTranslation(surahNum),
          ]);

          await cacheSurahArabic(surahNum, arabicData);
          await cacheSurahTranslation(surahNum, translationData);

          for (let a = 0; a < arabicData.length; a++) {
            if (cancelRef.current) break;

            const ayah = arabicData[a];
            if (ayah.audio) {
              await downloadAyahAudio(surahNum, ayah.numberInSurah, ayah.audio);
            }

            setDownloadProgress({
              currentSurah: surahNum,
              currentAyah: a + 1,
              totalAyahs: arabicData.length,
              totalSurahs,
              completedSurahs,
              overallPercent: Math.round(
                ((completedSurahs + (a + 1) / arabicData.length) / totalSurahs) * 100
              ),
            });
          }

          if (!cancelRef.current) {
            updateSurahStatus(surahNum, "downloaded");
            completedSurahs++;
          }
        } catch {
          updateSurahStatus(surahNum, "error");
          completedSurahs++;
        }
      }

      if (!cancelRef.current) {
        await setAllDataCached(true);
      }
    } catch {}

    setIsDownloadingAll(false);
    setDownloadProgress(null);
  }, [surahStatus, updateSurahStatus]);

  const cancelDownload = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const removeSurahDownload = useCallback(async (surahNumber: number, totalAyahs: number) => {
    await deleteSurahAudio(surahNumber, totalAyahs);
    updateSurahStatus(surahNumber, "none");
  }, [updateSurahStatus]);

  const removeAllDownloads = useCallback(async () => {
    await deleteAllAudio();
    await setAllDataCached(false);
    setSurahStatus({});
    await AsyncStorage.removeItem(DOWNLOAD_STATUS_KEY);
  }, []);

  const totalDownloaded = useMemo(
    () => Object.values(surahStatus).filter((s) => s === "downloaded").length,
    [surahStatus]
  );

  const value = useMemo(
    () => ({
      surahStatus,
      isDownloadingAll,
      downloadProgress,
      downloadAllContent,
      downloadSurah,
      cancelDownload,
      removeSurahDownload,
      removeAllDownloads,
      totalDownloaded,
      initComplete,
    }),
    [
      surahStatus,
      isDownloadingAll,
      downloadProgress,
      downloadAllContent,
      downloadSurah,
      cancelDownload,
      removeSurahDownload,
      removeAllDownloads,
      totalDownloaded,
      initComplete,
    ]
  );

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>;
}

export function useDownload() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error("useDownload must be used within DownloadProvider");
  return ctx;
}
