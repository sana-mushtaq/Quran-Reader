import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

interface BookmarkedAyah {
  ayahNumber: number;
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  arabicText: string;
  translationText: string;
  numberInSurah: number;
}

interface QuranContextValue {
  bookmarks: BookmarkedAyah[];
  isBookmarked: (ayahNumber: number) => boolean;
  toggleBookmark: (ayah: BookmarkedAyah) => void;
  currentAudio: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  playAudio: (url: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
}

const QuranContext = createContext<QuranContextValue | null>(null);

const BOOKMARKS_KEY = "@quran_bookmarks";

export function QuranProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkedAyah[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBookmarks();
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) setBookmarks(JSON.parse(stored));
    } catch {}
  };

  const saveBookmarks = async (newBookmarks: BookmarkedAyah[]) => {
    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
    } catch {}
  };

  const isBookmarked = useCallback(
    (ayahNumber: number) => bookmarks.some((b) => b.ayahNumber === ayahNumber),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (ayah: BookmarkedAyah) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.ayahNumber === ayah.ayahNumber);
        const next = exists
          ? prev.filter((b) => b.ayahNumber !== ayah.ayahNumber)
          : [...prev, ayah];
        saveBookmarks(next);
        return next;
      });
    },
    []
  );

  const playAudio = useCallback(
    async (url: string) => {
      try {
        if (sound) {
          await sound.unloadAsync();
        }
        setIsLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true }
        );
        setSound(newSound);
        setCurrentAudio(url);
        setIsPlaying(true);
        setIsLoading(false);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentAudio(null);
            }
          }
        });
      } catch {
        setIsLoading(false);
      }
    },
    [sound]
  );

  const pauseAudio = useCallback(async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }, [sound]);

  const stopAudio = useCallback(async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  }, [sound]);

  const value = useMemo(
    () => ({
      bookmarks,
      isBookmarked,
      toggleBookmark,
      currentAudio,
      isPlaying,
      isLoading,
      playAudio,
      pauseAudio,
      stopAudio,
    }),
    [bookmarks, isBookmarked, toggleBookmark, currentAudio, isPlaying, isLoading, playAudio, pauseAudio, stopAudio]
  );

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
}

export function useQuran() {
  const ctx = useContext(QuranContext);
  if (!ctx) throw new Error("useQuran must be used within QuranProvider");
  return ctx;
}
