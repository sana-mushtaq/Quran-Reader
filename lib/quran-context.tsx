import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

interface QuranContextValue {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  currentAudio: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  playAudio: (url: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  playMultipleAudios: (urls: string[]) => Promise<void>;
}

const QuranContext = createContext<QuranContextValue | null>(null);

const READING_POS_KEY = "@quran_reading_position";

export function QuranProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPageState] = useState(1);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  useEffect(() => {
    loadReadingPosition();
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

  const loadReadingPosition = async () => {
    try {
      const stored = await AsyncStorage.getItem(READING_POS_KEY);
      if (stored) {
        const page = parseInt(stored, 10);
        if (!isNaN(page) && page > 0) {
          setCurrentPageState(page);
        }
      }
    } catch {}
  };

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page);
    AsyncStorage.setItem(READING_POS_KEY, page.toString()).catch(() => {});
  }, []);

  const playSingleAudio = useCallback(
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
        return newSound;
      } catch {
        setIsLoading(false);
        return null;
      }
    },
    [sound]
  );

  const playAudio = useCallback(
    async (url: string) => {
      setAudioQueue([]);
      setQueueIndex(0);
      const newSound = await playSingleAudio(url);
      if (newSound) {
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            setCurrentAudio(null);
          }
        });
      }
    },
    [playSingleAudio]
  );

  const playMultipleAudios = useCallback(
    async (urls: string[]) => {
      if (urls.length === 0) return;
      setAudioQueue(urls);
      setQueueIndex(0);

      const playNext = async (index: number, currentSound: Audio.Sound | null) => {
        if (index >= urls.length) {
          setIsPlaying(false);
          setCurrentAudio(null);
          setAudioQueue([]);
          return;
        }

        try {
          if (currentSound) {
            await currentSound.unloadAsync();
          }
          setIsLoading(index === 0);
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: urls[index] },
            { shouldPlay: true }
          );
          setSound(newSound);
          setCurrentAudio(urls[index]);
          setIsPlaying(true);
          setIsLoading(false);
          setQueueIndex(index);

          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              playNext(index + 1, newSound);
            }
          });
        } catch {
          setIsLoading(false);
          setIsPlaying(false);
        }
      };

      await playNext(0, sound);
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
      setAudioQueue([]);
    }
  }, [sound]);

  const value = useMemo(
    () => ({
      currentPage,
      setCurrentPage,
      currentAudio,
      isPlaying,
      isLoading,
      playAudio,
      pauseAudio,
      stopAudio,
      playMultipleAudios,
    }),
    [currentPage, setCurrentPage, currentAudio, isPlaying, isLoading, playAudio, pauseAudio, stopAudio, playMultipleAudios]
  );

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
}

export function useQuran() {
  const ctx = useContext(QuranContext);
  if (!ctx) throw new Error("useQuran must be used within QuranProvider");
  return ctx;
}
