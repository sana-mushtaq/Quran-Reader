# Quran App

## Overview

This is a Quran reading and listening mobile application built with Expo (React Native) and an Express backend server. The app allows users to browse all 114 surahs, read Arabic text with English translations, listen to audio recitations (Al Afasy edition), bookmark favorite ayahs, and view a daily random verse. It supports both light and dark themes with an Islamic-inspired color palette (emerald, gold, cream).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: Expo Router v6 with file-based routing and typed routes
  - Tab layout at `app/(tabs)/` with three tabs: Home (daily verse), Surahs (browse list), Bookmarks (saved ayahs)
  - Dynamic route `app/surah/[id].tsx` for individual surah detail/reading view
- **State Management**: React Context (`QuranProvider` in `lib/quran-context.tsx`) for bookmarks and audio playback state, plus TanStack React Query for server data fetching
- **Data Persistence**: AsyncStorage for local bookmark storage on device
- **Audio**: `expo-av` for Quran recitation playback with background audio support
- **Fonts**: Google Fonts — Inter (UI text) and Amiri (Arabic text)
- **Styling**: StyleSheet-based with a custom theme system (`constants/colors.ts`) supporting light/dark modes via `useColorScheme`
- **External API**: Al Quran Cloud API (`api.alquran.cloud/v1`) for surah lists, Arabic text with audio (ar.alafasy edition), and English translations

### Backend (Express)
- **Framework**: Express 5 running on Node.js with TypeScript (compiled via tsx in dev, esbuild for production)
- **Purpose**: Primarily serves as an API proxy/server and serves the static web build in production. Currently has minimal custom routes defined in `server/routes.ts`
- **CORS**: Dynamic CORS configuration based on Replit environment variables, also allows localhost origins for Expo web development
- **Storage**: In-memory storage (`MemStorage` class in `server/storage.ts`) implementing an `IStorage` interface with basic user CRUD — designed to be swapped for database-backed storage

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` — currently has a `users` table with `id` (UUID), `username`, and `password` fields
- **Validation**: Drizzle-Zod integration for insert schema validation
- **Migrations**: Drizzle Kit configured to output to `./migrations` directory
- **Note**: The database schema exists but the app currently uses in-memory storage. The PostgreSQL connection requires a `DATABASE_URL` environment variable

### Build & Deployment
- **Development**: Two parallel processes — `expo:dev` for the mobile/web app and `server:dev` for the Express backend
- **Production**: Custom build script (`scripts/build.js`) handles static web export from Expo, then Express serves the built files
- **Path Aliases**: `@/*` maps to project root, `@shared/*` maps to `./shared/`

### Key Design Patterns
- **Shared code**: The `shared/` directory contains schema definitions used by both frontend and backend
- **Error handling**: Custom ErrorBoundary component wrapping the entire app with a user-friendly fallback UI
- **Platform adaptation**: Components handle web vs native differences (e.g., `KeyboardAwareScrollViewCompat`, platform-specific tab layouts with liquid glass support on iOS 26+)

## External Dependencies

- **Al Quran Cloud API** (`https://api.alquran.cloud/v1`): Free public API providing Quran text, translations, and audio recitations. No API key required. Used for fetching surah metadata, Arabic text with audio (ar.alafasy edition), English translations, and random ayahs
- **PostgreSQL**: Database configured via `DATABASE_URL` environment variable, used with Drizzle ORM. Currently the app uses in-memory storage but is set up to migrate to Postgres
- **AsyncStorage**: Local device storage for persisting bookmarks client-side
- **Google Fonts**: Inter and Amiri fonts loaded via `@expo-google-fonts` packages
- **Expo Services**: Standard Expo build and development infrastructure