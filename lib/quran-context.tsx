import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

const QuranContext = createContext(null);

const BOOKMARKS_KEY = "@quran_bookmarks";

export function QuranProvider({ children }) {

  //bookmarks
  const [bookmarks, setBookmarks] = useState([]);

  //current audio playing
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAyahInSurah, setCurrentAyahInSurah] = useState(null);

  ///next in queue
  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);
  const [queueIndex, setQueueIndex] = useState(0);
  const [totalTracksInQueue, setTotalTracksInQueue] = useState(0);

  //sounds
  const soundRef = useRef(null);
  const nextSoundRef = useRef(null);
  const nextIndexRef = useRef(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    //load bookmarks
    loadBookmarks();
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
    return () => {
      soundRef.current?.unloadAsync();
      nextSoundRef.current?.unloadAsync();
    };
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only set state if the parsed data is actually an array
        setBookmarks(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      setBookmarks([]);
    }
  };

  const saveBookmarks = async (newBookmarks) => {
    try {
      //store ayah into array of book marks
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
    } catch { }
  };

  const isBookmarked = useCallback(
    (ayahNumber) => {
      // Ensure bookmarks is always treated as an array before using .some()
      const safeBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
      return safeBookmarks.some((b) => b.ayahNumber === ayahNumber);
    },
    [bookmarks]
  );
  const toggleBookmark = useCallback(
    (ayah) => {
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

  //alraedy load the next audio
  const preloadNext = useCallback(async (afterIndex) => {
    const queue = queueRef.current;
    const nextIdx = afterIndex + 1;
    if (nextIdx >= queue.length) {
      if (nextSoundRef.current) {
        await nextSoundRef.current.unloadAsync();
        nextSoundRef.current = null;
      }
      nextIndexRef.current = null;
      return;
    }

    if (nextIndexRef.current === nextIdx && nextSoundRef.current) {
      return;
    }

    if (nextSoundRef.current) {
      await nextSoundRef.current.unloadAsync();
      nextSoundRef.current = null;
    }

    try {
      const nextTrack = queue[nextIdx];
      const { sound: preloaded } = await Audio.Sound.createAsync(
        { uri: nextTrack.uri },
        { shouldPlay: false }
      );
      if (queueRef.current === queue && queueIndexRef.current === afterIndex) {
        nextSoundRef.current = preloaded;
        nextIndexRef.current = nextIdx;
      } else {
        await preloaded.unloadAsync();
      }
    } catch { }
  }, []);

  //go to next audio
  const advanceToNext = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const nextIdx = queueIndexRef.current + 1;
    const queue = queueRef.current;

    if (nextIdx >= queue.length) {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTrackId(null);
      setCurrentAyahInSurah(null);
      queueRef.current = [];
      setTotalTracksInQueue(0);
      setQueueIndex(0);
      queueIndexRef.current = 0;
      isTransitioningRef.current = false;
      return;
    }

    const nextTrack = queue[nextIdx];
    queueIndexRef.current = nextIdx;
    setQueueIndex(nextIdx);
    setCurrentTrackId(nextTrack.id);
    setCurrentAyahInSurah(nextTrack.ayahNumberInSurah);

    const oldSound = soundRef.current;

    if (nextSoundRef.current && nextIndexRef.current === nextIdx) {
      soundRef.current = nextSoundRef.current;
      nextSoundRef.current = null;
      nextIndexRef.current = null;

      try {
        await soundRef.current.playAsync();
        setIsPlaying(true);

        soundRef.current.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            advanceToNext();
          }
        });
      } catch {
        isTransitioningRef.current = false;
        advanceToNext();
        return;
      }

      if (oldSound) {
        oldSound.setOnPlaybackStatusUpdate(null);
        oldSound.unloadAsync();
      }

      isTransitioningRef.current = false;
      preloadNext(nextIdx);
    } else {
      if (nextSoundRef.current) {
        await nextSoundRef.current.unloadAsync();
        nextSoundRef.current = null;
        nextIndexRef.current = null;
      }

      setIsLoading(true);
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: nextTrack.uri },
          { shouldPlay: true }
        );
        if (oldSound) {
          oldSound.setOnPlaybackStatusUpdate(null);
          await oldSound.unloadAsync();
        }
        soundRef.current = newSound;
        setIsPlaying(true);
        setIsLoading(false);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            advanceToNext();
          }
        });

        isTransitioningRef.current = false;
        preloadNext(nextIdx);
      } catch {
        setIsLoading(false);
        isTransitioningRef.current = false;
        advanceToNext();
      }
    }
  }, [preloadNext]);

  const playTrackAtIndex = useCallback(async (index) => {
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

    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (nextSoundRef.current) {
      await nextSoundRef.current.unloadAsync();
      nextSoundRef.current = null;
      nextIndexRef.current = null;
    }
    isTransitioningRef.current = false;

    const track = queue[index];
    queueIndexRef.current = index;
    setQueueIndex(index);
    setCurrentTrackId(track.id);
    setCurrentAyahInSurah(track.ayahNumberInSurah);
    setIsLoading(true);

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true }
      );
      soundRef.current = newSound;
      setIsPlaying(true);
      setIsLoading(false);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          advanceToNext();
        }
      });

      preloadNext(index);
    } catch {
      setIsLoading(false);
      queueIndexRef.current = index;
      advanceToNext();
    }
  }, [advanceToNext, preloadNext]);

  const playQueue = useCallback(async (tracks, startIndex) => {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (nextSoundRef.current) {
      await nextSoundRef.current.unloadAsync();
      nextSoundRef.current = null;
      nextIndexRef.current = null;
    }
    isTransitioningRef.current = false;
    queueRef.current = tracks;
    setTotalTracksInQueue(tracks.length);
    await playTrackAtIndex(startIndex);
  }, [playTrackAtIndex]);

  const playSingle = useCallback(async (uri) => {
    const singleTrack = { id: uri, uri, ayahNumberInSurah: 0 };
    queueRef.current = [singleTrack];
    setTotalTracksInQueue(1);
    await playTrackAtIndex(0);
  }, [playTrackAtIndex]);

  const pauseAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const resumeAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, []);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (nextSoundRef.current) {
      await nextSoundRef.current.unloadAsync();
      nextSoundRef.current = null;
      nextIndexRef.current = null;
    }
    isTransitioningRef.current = false;
    setCurrentTrackId(null);
    setIsPlaying(false);
    setCurrentAyahInSurah(null);
    queueRef.current = [];
    setTotalTracksInQueue(0);
    setQueueIndex(0);
  }, []);

  const skipNext = useCallback(async () => {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    isTransitioningRef.current = false;
    await playTrackAtIndex(queueIndexRef.current + 1);
  }, [playTrackAtIndex]);

  const skipPrev = useCallback(async () => {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    isTransitioningRef.current = false;
    await playTrackAtIndex(Math.max(0, queueIndexRef.current - 1));
  }, [playTrackAtIndex]);

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
