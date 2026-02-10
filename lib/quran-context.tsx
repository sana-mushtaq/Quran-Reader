import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
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

export interface AudioTrack {
  id: string;
  uri: string;
  ayahNumberInSurah: number;
}

interface QuranContextValue {
  bookmarks: BookmarkedAyah[];
  isBookmarked: (ayahNumber: number) => boolean;
  toggleBookmark: (ayah: BookmarkedAyah) => void;
  currentTrackId: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  playQueue: (tracks: AudioTrack[], startIndex: number) => Promise<void>;
  playSingle: (uri: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  currentAyahInSurah: number | null;
  totalTracksInQueue: number;
  queueIndex: number;
}

const QuranContext = createContext<QuranContextValue | null>(null);

const BOOKMARKS_KEY = "@quran_bookmarks";

export function QuranProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkedAyah[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAyahInSurah, setCurrentAyahInSurah] = useState<number | null>(null);

  const queueRef = useRef<AudioTrack[]>([]);
  const queueIndexRef = useRef(0);
  const [queueIndex, setQueueIndex] = useState(0);
  const [totalTracksInQueue, setTotalTracksInQueue] = useState(0);

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

  const playTrackAtIndex = useCallback(async (index: number) => {
    const queue = queueRef.current;
    if (index < 0 || index >= queue.length) {
      setIsPlaying(false);
      setCurrentTrackId(null);
      setCurrentAyahInSurah(null);
      queueRef.current = [];
      setTotalTracksInQueue(0);
      setQueueIndex(0);
      return;
    }

    const track = queue[index];
    queueIndexRef.current = index;
    setQueueIndex(index);
    setCurrentTrackId(track.id);
    setCurrentAyahInSurah(track.ayahNumberInSurah);
    setIsLoading(true);

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          playTrackAtIndex(queueIndexRef.current + 1);
        }
      });
    } catch {
      setIsLoading(false);
      playTrackAtIndex(queueIndexRef.current + 1);
    }
  }, [sound]);

  const playQueue = useCallback(async (tracks: AudioTrack[], startIndex: number) => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    queueRef.current = tracks;
    setTotalTracksInQueue(tracks.length);
    await playTrackAtIndex(startIndex);
  }, [sound, playTrackAtIndex]);

  const playSingle = useCallback(async (uri: string) => {
    const singleTrack: AudioTrack = { id: uri, uri, ayahNumberInSurah: 0 };
    queueRef.current = [singleTrack];
    setTotalTracksInQueue(1);
    await playTrackAtIndex(0);
  }, [playTrackAtIndex]);

  const pauseAudio = useCallback(async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }, [sound]);

  const resumeAudio = useCallback(async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  }, [sound]);

  const stopAudio = useCallback(async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setCurrentTrackId(null);
    setIsPlaying(false);
    setCurrentAyahInSurah(null);
    queueRef.current = [];
    setTotalTracksInQueue(0);
    setQueueIndex(0);
  }, [sound]);

  const skipNext = useCallback(async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    await playTrackAtIndex(queueIndexRef.current + 1);
  }, [sound, playTrackAtIndex]);

  const skipPrev = useCallback(async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    await playTrackAtIndex(Math.max(0, queueIndexRef.current - 1));
  }, [sound, playTrackAtIndex]);

  const value = useMemo(
    () => ({
      bookmarks,
      isBookmarked,
      toggleBookmark,
      currentTrackId,
      isPlaying,
      isLoading,
      playQueue,
      playSingle,
      pauseAudio,
      resumeAudio,
      stopAudio,
      skipNext,
      skipPrev,
      currentAyahInSurah,
      totalTracksInQueue,
      queueIndex,
    }),
    [bookmarks, isBookmarked, toggleBookmark, currentTrackId, isPlaying, isLoading, playQueue, playSingle, pauseAudio, resumeAudio, stopAudio, skipNext, skipPrev, currentAyahInSurah, totalTracksInQueue, queueIndex]
  );

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
}

export function useQuran() {
  const ctx = useContext(QuranContext);
  if (!ctx) throw new Error("useQuran must be used within QuranProvider");
  return ctx;
}
