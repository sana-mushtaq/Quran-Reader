import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"
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
} from "./offline-storage"
import { fetchSurahs, fetchSurahArabic, fetchSurahTranslation } from "./quran-api"

const DOWNLOAD_STATUS_KEY = "@quran_download_status"

// create context for download manager
const DownloadContext = createContext(null)

export function DownloadProvider({ children }) {
  const [surahStatus, setSurahStatus] = useState({})
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(null)
  const [initComplete, setInitComplete] = useState(false)
  const cancelRef = useRef(false)

  // on mount, load saved download status
  useEffect(() => {
    loadSavedStatus()
  }, [])

  // load saved download status from storage
  const loadSavedStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem(DOWNLOAD_STATUS_KEY)
      if (saved) {
        setSurahStatus(JSON.parse(saved))
      }
    } catch {}
    setInitComplete(true)
  }

  // save current download status to storage
  const saveStatus = async (status) => {
    try {
      await AsyncStorage.setItem(DOWNLOAD_STATUS_KEY, JSON.stringify(status))
    } catch {}
  }

  // update status of a single surah
  const updateSurahStatus = useCallback((surahNumber, status) => {
    setSurahStatus((prev) => {
      const next = { ...prev, [surahNumber]: status }
      saveStatus(next)
      return next
    })
  }, [])

  // download a single surah
  const downloadSurah = useCallback(async (surahNumber) => {
    if (Platform.OS === "web") return

    updateSurahStatus(surahNumber, "downloading")
    try {
      await ensureAudioDir()
      const arabicData = await fetchSurahArabic(surahNumber)
      const translationData = await fetchSurahTranslation(surahNumber)

      await cacheSurahArabic(surahNumber, arabicData)
      await cacheSurahTranslation(surahNumber, translationData)

      // download audio for each ayah
      for (let i = 0; i < arabicData.length; i++) {
        const ayah = arabicData[i]
        if (ayah.audio) {
          await downloadAyahAudio(surahNumber, ayah.numberInSurah, ayah.audio)
        }
      }

      updateSurahStatus(surahNumber, "downloaded")
    } catch {
      updateSurahStatus(surahNumber, "error")
    }
  }, [updateSurahStatus])

  // download all surahs with progress tracking
  const downloadAllContent = useCallback(async () => {
    if (Platform.OS === "web") return

    cancelRef.current = false
    setIsDownloadingAll(true)

    try {
      await ensureAudioDir()
      const surahs = await fetchSurahs()
      await cacheSurahsList(surahs)

      const totalSurahs = surahs.length
      let completedSurahs = 0

      for (let s = 0; s < surahs.length; s++) {
        if (cancelRef.current) break

        const surah = surahs[s]
        const surahNum = surah.number

        // skip if already downloaded and cached
        const alreadyCached = surahStatus[surahNum] === "downloaded"
        if (alreadyCached) {
          const textCached = await isSurahTextCached(surahNum)
          const audioCached = isSurahAudioDownloaded(surahNum, surah.numberOfAyahs)
          if (textCached && audioCached) {
            completedSurahs++
            setDownloadProgress({
              currentSurah: surahNum,
              currentAyah: 0,
              totalAyahs: surah.numberOfAyahs,
              totalSurahs,
              completedSurahs,
              overallPercent: Math.round((completedSurahs / totalSurahs) * 100),
            })
            continue
          }
        }

        updateSurahStatus(surahNum, "downloading")

        try {
          const [arabicData, translationData] = await Promise.all([
            fetchSurahArabic(surahNum),
            fetchSurahTranslation(surahNum),
          ])

          await cacheSurahArabic(surahNum, arabicData)
          await cacheSurahTranslation(surahNum, translationData)

          for (let a = 0; a < arabicData.length; a++) {
            if (cancelRef.current) break
            const ayah = arabicData[a]
            if (ayah.audio) {
              await downloadAyahAudio(surahNum, ayah.numberInSurah, ayah.audio)
            }

            // update progress
            setDownloadProgress({
              currentSurah: surahNum,
              currentAyah: a + 1,
              totalAyahs: arabicData.length,
              totalSurahs,
              completedSurahs,
              overallPercent: Math.round(
                ((completedSurahs + (a + 1) / arabicData.length) / totalSurahs) * 100
              ),
            })
          }

          if (!cancelRef.current) {
            updateSurahStatus(surahNum, "downloaded")
            completedSurahs++
          }
        } catch {
          updateSurahStatus(surahNum, "error")
          completedSurahs++
        }
      }

      if (!cancelRef.current) {
        await setAllDataCached(true)
      }
    } catch {}

    setIsDownloadingAll(false)
    setDownloadProgress(null)
  }, [surahStatus, updateSurahStatus])

  // cancel any ongoing downloads
  const cancelDownload = useCallback(() => {
    cancelRef.current = true
  }, [])

  // remove a single surah's download
  const removeSurahDownload = useCallback(async (surahNumber, totalAyahs) => {
    deleteSurahAudio(surahNumber, totalAyahs)
    updateSurahStatus(surahNumber, "none")
  }, [updateSurahStatus])

  // remove all downloads and reset
  const removeAllDownloads = useCallback(async () => {
    deleteAllAudio()
    await setAllDataCached(false)
    setSurahStatus({})
    await AsyncStorage.removeItem(DOWNLOAD_STATUS_KEY)
  }, [])

  // count total downloaded surahs
  const totalDownloaded = useMemo(
    () => Object.values(surahStatus).filter((s) => s === "downloaded").length,
    [surahStatus]
  )

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
  )

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>
}

export function useDownload() {
  const ctx = useContext(DownloadContext)
  if (!ctx) throw new Error("useDownload must be used within DownloadProvider")
  return ctx
}
