# Ayah

A Qur’an learning platform for Android-first development, combining a Qur’an reader and study experience with guided memorization, Arabic learning, and a planned AI teacher.

## Current prototype features

- Navy-and-gold home screen and Ayah of the Day
- Auto, Light, Dark, and Sepia appearance themes
- Guided memorization practice using a small reviewed sample set
- Session-only practice counter and progress dashboard
- Saved ayah bookmarks (session-only; persistent sync is not connected)
- Qur’an Library screen with surah search and chapter navigation UI
- Qur’an reader screen designed for Uthmani Arabic and translations
- Arabic starter vocabulary lesson, alphabet classroom, and quizzes
- AI teacher preview with Hamza/Maryam selection and language picker (no live AI/audio yet)
- Ayah Plus preview; no billing or trial is active

## Product direction

Ayah aims to bring together the strengths of Quran.com-style reading, study, audio, search, and reflection with Tarteel-style memorization practice, recitation feedback, and learning analytics. It will also include the user's requested Arabic courses, milestone quizzes, selectable themes, Hamza/Maryam teaching assistants, and a clearly differentiated free and Plus experience.

Planned reader/study capabilities include all 114 surahs, multiple verified translations, word-by-word meaning and pronunciation, tafsir, verse search, notes, collections, reading bookmarks, repeat controls, reciter audio, and reading goals. Planned memorization capabilities include guided hifdh, revision scheduling, recitation checking, voice-based ayah search, and surah-level progress. These are roadmap items, not claims that they already work.

## Technology

- React Native
- Expo SDK 54
- JavaScript

## Run in GitHub Codespaces

Open this repository in a Codespace. The included `.devcontainer/devcontainer.json` installs dependencies, starts the Expo web preview, and forwards port 8081 automatically. When Codespaces shows port 8081, open the forwarded address in the browser. If it does not start automatically, run:

```bash
npm install
npx expo start --web --host 0.0.0.0
```

If Expo reports that web support is missing, run:

```bash
npx expo install react-dom react-native-web @expo/metro-runtime
```

Then open the forwarded port shown by Codespaces (usually port 8081) in the browser.

## Qur’an font rendering

The reader supports two connected Unicode editions:
- Uthmani / QPC Hafs using Quran Foundation's Uthmanic Hafs font and matching `text_qpc_hafs` field.
- IndoPak Nastaleeq using Quran Foundation's compatible IndoPak Nastaleeq font and matching `text_indopak_nastaleeq` field.

The app loads the matching TTF font at runtime through Expo Font. The backend accepts only the `uthmani` and `indopak` script values and requests the matching verse field. Quran Foundation's font-rendering documentation specifies that IndoPak text must use its compatible font, and gives conditions for font use, including developer-account requirements and app attribution. Include an accessible credit in the app: "Qur’an fonts provided by Quran Foundation." Do not redistribute the font files as standalone downloads.

After these changes are pulled into Codespaces, run `npm install` to install Expo Font and refresh the lockfile, then restart the Expo preview.

## Android

This is an Expo React Native project. Android testing can be done with Expo Go on an Android device or an Android emulator. A distributable Android build will be configured after the core app flow is tested.

## Qur’an content connection

The Library and Reader UI are in place, but they intentionally do not invent or bundle Qur’an text. Run the backend in `server/` with its own environment file and configure the app's `EXPO_PUBLIC_AYAH_API_URL` as the backend URL ending in `/api` (for local development, `http://localhost:3001/api`). The backend routes are:

- `GET /chapters` → `{ "chapters": [{ "id": 1, "name_simple": "Al-Fatihah", "name_arabic": "الفاتحة", "translated_name": { "name": "The Opener" }, "verses_count": 7, "revelation_place": "makkah" }] }`
- `GET /translations?language=en` → `{ "translations": [{ "id": 131, "name": "Dr. Mustafa Khattab, the Clear Quran", "author_name": "Dr. Mustafa Khattab", "language_name": "english" }] }` (the actual list is supplied by Quran Foundation and varies by language)
- `GET /chapters/:id/verses?page=1&per_page=50&translation_id=131&script=uthmani&language=en` → verses with selected Arabic text, full-ayah translation, and verified `words` entries containing word text, transliteration, translation, position, and word-audio asset path. The app currently displays word meanings and transliteration; word audio playback is the next milestone.

Start the backend with `cd server && npm install && npm start`. Copy `server/.env.example` to `server/.env` and fill in credentials obtained for your own Quran Foundation backend app. Keep `server/.env` private. The backend obtains and caches Quran Foundation Content API access tokens on the server. Never put a Quran Foundation client secret or private API token in this Expo app, source control, or an `EXPO_PUBLIC_` variable. New Quran Foundation integrations require a backend/server app and approved Content API access; their pre-live dataset is limited to Al-Fatihah and Al-Baqarah. Production access is needed for the complete Qur’an dataset. The example backend requests the granular `content.quran.read`, `content.translations.read`, and `content.audio.read` scopes; existing credentials may require the `content` scope configured for that app. Your Developer Console app must be approved for audio access. Existing credentials may need their approved scope list updated before audio requests work. See the [Quran Foundation API quickstart](https://api-docs.quran.com/docs/quickstart/) and [verses-by-chapter reference](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/verses-by-chapter-number/).

## Recitation audio

The Listen screen now loads chapter-reciter choices from the secure backend, retrieves a chapter audio URL for the selected reciter and surah, and provides play/pause, restart, repeat, and previous/next surah controls. The reader's word-by-word cards also show a "Hear word" control when Quran Foundation supplies a word audio asset.

The backend exposes:
- `GET /api/audio/reciters?language=en`
- `GET /api/audio/chapters/:reciterId/:chapterId`

Audio metadata is retrieved server-side using the distinct chapter-reciter resource IDs and the `content.audio.read` permission. Word pronunciation assets are resolved against Quran Foundation's audio CDN. Do not mix chapter-reciter IDs with ayah-by-ayah recitation IDs. Audio playback requires a configured and deployed backend with approved audio access. Offline downloads and background playback are not enabled.

The Expo app uses `expo-audio`. After pulling the changes in Codespaces, run `npm install` and restart Expo. Test playback on a device/browser with audio output; this code has not yet been integration-tested against live credentials.

## Still to build

- Secure backend and verified full Qur’an data connection
- Persistent accounts, bookmarks, notes, collections, and progress sync
- Tafsir, related ayahs, search, and reflection tools
- Ayah-level recitation timing, advanced playback queue, background controls, and offline support
- Recitation recognition and word-level memorization feedback
- Full revision plans, streaks, and analytics
- Live AI teacher and reviewed Arabic curriculum
- Notifications, subscription billing, and one-time trial enforcement

Qur’an text, translations, tafsir, and audio must be checked against trusted sources and usage permissions before release. Authentication, AI, audio, billing, notifications, and permanent storage are not connected yet. Current practice and bookmark data reset when the app restarts.
