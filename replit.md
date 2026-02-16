# Quran App (القران الكريم)

## Overview
A Quran reading and listening app built with Expo (React Native) for web. Features daily verse display, surah browsing, bookmarking, and audio playback. Uses the Al Quran Cloud API for Quranic data.

## Project Architecture
- **Framework**: Expo SDK 54 with React Native Web
- **Routing**: expo-router (file-based routing)
- **State Management**: React Query (@tanstack/react-query) + React Context
- **Language**: TypeScript
- **API**: https://api.alquran.cloud/v1 (external, no auth required)

## Directory Structure
- `app/` - Expo Router pages (file-based routing)
  - `(tabs)/` - Tab navigation (Home, Surahs, Bookmarks)
  - `surah/[id].tsx` - Individual surah view
- `components/` - Reusable React components
- `lib/` - Business logic, API calls, context providers
- `constants/` - Theme colors and configuration
- `assets/` - Images and static assets

## Running the App
- **Dev server**: `npx expo start --web --port 5000 --host lan`
- The app runs on port 5000 for web preview
- Uses Metro bundler for web builds

## Key Dependencies
- expo, expo-router, react-native-web
- @tanstack/react-query for data fetching
- expo-av for audio playback
- @expo-google-fonts for Arabic (Amiri) and Latin (Inter) fonts
