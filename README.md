# Ayah

Ayah is an Android-first Qur’an reading, memorization, Arabic learning, and study prototype. It is being built around verified Qur’an content, a focused hifdh workflow, thoughtful study tools, and a clearly separated future Ayah Plus experience.

## Current prototype features

- Navy-and-gold home screen with Ayah of the Day and quick access to learning tools
- Auto, Light, Dark, and Sepia themes
- Qur’an library, surah navigation, Uthmani/QPC Hafs and IndoPak reader modes, translations, word-by-word study, personal notes, bookmarks, collections, and search
- Reader preferences, translation choice, last-reading position, and recent search history saved locally
- Chapter recitation library, preferred reciter, full-surah playback, repeat controls, position resume, and ayah audio controls when supplied by the content response
- Ayah timestamp highlighting and seek-to-ayah when the selected chapter recording actually includes compatible timing metadata
- Ayah-by-ayah practice queue with per-ayah repeat, selected-page queue, pause/resume, and recall mode that hides the Arabic on screen
- Guided memorization sessions for selected surah ranges, up to 50 ayahs per session
- Memorization planner, full-surah progress tracker, Smart Revision queue, and suggested review intervals based on the learner's own check-ins
- Adjustable daily reading and memorization targets; reading activity counts only when the learner explicitly marks an ayah as read
- Local practice-session history, seven-day insights, a 30-day activity heatmap, tracker summaries, and recent sessions
- 30/60/90-day Khatmah planning with a daily pace estimate and progress based on explicitly marked unique ayahs
- Browse Qur’an content by Juz, Hizb, Rub al-Hizb, Manzil, Ruku, or a selected Mushaf page layout, with validated backend routes and random ayah discovery
- Source-attributed Surah introductions with resource selection, subject to provider chapter-info coverage
- Translation-reading layout that emphasizes the selected verified translation without displaying Arabic or word cards
- Compare two source translations in the reader, pin up to two verses for study, and share an ayah from the reader
- Multi-collection bookmarking: an ayah can belong to Favorites, Study, and Memorization at the same time
- On-demand related-hadith panel, showing the source collection, reference, and any grading metadata returned by Quran Foundation
- JSON backup export, validated restore with a supported-key allowlist (including pinned verse comparisons and reading plans), and a clear-local-data control
- Backend connection diagnostics for checking the configured content API and server credential presence without exposing secrets
- Arabic starter vocabulary expanded to six everyday words, a 12-letter classroom, recognition quizzes, and locally saved lesson progress
- Ayah Plus Tafsir catalogue and commentary UI, subject to provider access approval and content licensing
- AI Teacher and Ayah Plus previews; live AI, user accounts, subscriptions, and billing are not connected

## Current product-quality improvements

- Local preference loading now resets malformed saved JSON safely instead of parsing it twice or leaving an unreadable value in place.
- Verse keys stay tied to their original ayah numbers when the reader's notes-only filter is active.
- Direct references such as `2:255` open the exact ayah; recent text searches are saved locally and stale search requests are cancelled when leaving the screen.
- The Continue Reading shortcut restores the saved ayah as well as its surah and page.
- Reader translation language and translation ID persist locally. Backup restore validates the Ayah schema and imports only known preference keys, including per-surah audio positions.
- Arabic vocabulary and letter progress, plus best checkpoint scores, are saved locally and resume on return.
- Opening a page no longer automatically counts all displayed ayahs as read. Learners explicitly mark ayahs as read, making daily reading goals more meaningful.
- Full-surah and individual-ayah players stop one another when switching playback modes. Individual ayah audio has pause/resume and a stop control for selected-range queues. Audio URLs are restricted to the supported Quran Foundation audio hosts.
- Completed guided sessions are stored in a bounded local history (up to 250 entries) and appear in the Learning Insights screen.
- Daily targets can be changed from the Goals screen.
- Backup and privacy tools explain what is stored locally and allow the user to export or clear local learning data.
- The backend includes a versioned status endpoint, bounded upstream request timeouts, a production CORS allowlist requirement, short-lived provider response caching, an extra search rate limit, and strict pagination bounds.
- The in-app connection screen checks the configured backend status and reports whether server credentials are configured without revealing the credentials.

## Product direction

Ayah aims to bring together the strengths of Quran.com-style reading, study, audio, search, and reflection with Tarteel-style memorization practice, recitation feedback, and learning analytics. It will also include the user's requested Arabic courses, milestone quizzes, selectable themes, Hamza/Maryam teaching assistants, and a clearly differentiated free and Plus experience.

Planned reader/study capabilities include all 114 surahs, multiple verified translations, word-by-word meaning and pronunciation, tafsir, verse search, notes, collections, reading bookmarks, repeat controls, reciter audio, and reading goals. Planned memorization capabilities include guided hifdh, revision scheduling, recitation checking, voice-based ayah search, and surah-level progress. These are roadmap items, not claims that they already work. In particular, live recitation mistake detection, voice search, secure user accounts, cloud sync, offline audio downloads, and subscription billing need separate validated services and production setup.

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

## Project quality checks

Run these from the repository root in Codespaces after installing dependencies:

```bash
npm install
npm run check
npx expo export --platform web
```

The 61 source regression checks verify app wiring, storage and reader behavior, navigation, hadith and comparison features, backup/privacy screens, audio controls, backend diagnostics, and server security settings. The `npm run check` command also runs eighteen Node built-in unit tests for verse references, page calculation, language mapping, recent-search handling, backups, translation comparison, collections, Khatmah calculations, safe audio URLs, and pinned verse validation. The Expo export confirms that the web preview bundles successfully. The GitHub Actions workflow runs both checks on pushes and pull requests.

The CI workflow runs the source checks and unit tests before exporting the Expo web preview.

Check the backend separately with:

```bash
node --check server/index.js
npm install --prefix server
```

These checks do not replace device testing, live Quran Foundation credential approval, Qur’an text/audio validation, or testing on Android and iPad browsers.

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
- `GET /chapters/:id/verses?page=1&per_page=50&translation_id=131&script=uthmani&language=en` → verses with selected Arabic text, full-ayah translation, and verified `words` entries containing word text, transliteration, translation, position, and word-audio asset path. The app displays word meanings and transliteration and provides word-audio controls when a word audio asset is returned.

Start the backend with `cd server && npm install && npm start`. Copy `server/.env.example` to `server/.env` and fill in credentials obtained for your own Quran Foundation backend app. Keep `server/.env` private. The backend obtains and caches Quran Foundation Content API access tokens on the server. Never put a Quran Foundation client secret or private API token in this Expo app, source control, or an `EXPO_PUBLIC_` variable. New Quran Foundation integrations require a backend/server app and approved Content API access; their pre-live dataset is limited to Al-Fatihah and Al-Baqarah. Production access is needed for the complete Qur’an dataset. The example backend requests the granular `content.quran.read`, `content.translations.read`, and `content.audio.read` scopes for existing reader/audio features. Tafsir uses a separate cached token requesting only `content.tafsirs.read`, so missing Tafsir approval does not block the other content features. Your Developer Console backend app must be approved for Tafsir access before the Tafsir catalogue and commentary endpoints can work. Existing credentials may require their approved scope list to be updated. See the [Quran Foundation API quickstart](https://api-docs.quran.com/docs/quickstart/) and [verses-by-chapter reference](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/verses-by-chapter-number/).

## Reader navigation and personal notes

The Qur’an reader supports direct navigation to an ayah number, previous/next 50-ayah pages, and a filter that shows only ayahs with personal notes. Notes are stored locally on the device using AsyncStorage under the `readerNotes` key and are attached to the ayah reference (for example, `2:255`). They are not synced to an account or cloud yet. Page navigation replaces the visible page results to avoid duplicating ayahs when moving backward and forward. Translation choices, Arabic script edition, and word-by-word display remain available in the reader.

## Tafsir library (Ayah Plus)

The Ayah Plus Tafsir screen loads the available Tafsir catalogue and retrieves commentary for one selected ayah. The backend exposes:

- `GET /api/tafsirs?language=en` → available source IDs, titles, authors, and language metadata.
- `GET /api/tafsirs/:resourceId/ayah/:surah/:ayah` → source-attributed commentary for the requested ayah.

These routes proxy Quran Foundation Content API v4 resources and ayah-level Tafsir endpoints. The backend requests a separate token with the granular `content.tafsirs.read` scope; that permission must be approved for the backend app in the Quran Foundation Developer Console. If token creation fails, check the approved scopes for that client rather than putting credentials in the mobile app. Tafsir permission is isolated so it does not replace the existing reader/audio token. Commentary is displayed with the source and author metadata supplied by the catalogue. The app strips HTML for readable text; rich formatting and cross-source comparison are future improvements. Tafsir content licensing and attribution requirements must be reviewed before public release.

See the [Quran Foundation Tafsir catalogue reference](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/tafsirs/) and [ayah-level Tafsir reference](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-ayah-tafsirs/).

## Recitation audio

The Listen screen now loads chapter-reciter choices from the secure backend, retrieves a chapter audio URL for the selected reciter and surah, and provides play/pause, restart, repeat, and previous/next surah controls. The reader's word-by-word cards also show a "Hear word" control when Quran Foundation supplies a word audio asset.

The backend exposes:
- `GET /api/audio/reciters?language=en`
- `GET /api/audio/chapters/:reciterId/:chapterId`

Audio metadata is retrieved server-side using the distinct chapter-reciter resource IDs and the `content.audio.read` permission. Word pronunciation assets are resolved against Quran Foundation's audio CDN. Do not mix chapter-reciter IDs with ayah-by-ayah recitation IDs. Audio playback requires a configured and deployed backend with approved audio access. Offline downloads and background playback are not enabled.

The Expo app uses `expo-audio`. After pulling the changes in Codespaces, run `npm install` and restart Expo. Test playback on a device/browser with audio output; this code has not yet been integration-tested against live credentials.

## Still to build and verify before release

- Secure account authentication and cloud sync across devices
- Runtime and device testing of all reader, audio, storage, and navigation flows
- Provider-approved production Qur’an content access, verified translation choices, and audio availability
- Confirmation of the actual timestamp shape for chapter recordings; highlighting is conditional on compatible timestamp data
- Real recitation recognition with carefully validated Arabic pronunciation and tajwid evaluation; current self-ratings are not AI accuracy scores
- Reviewed, complete Arabic curriculum with lesson progression and assessment content
- Live AI Teacher, with safety, source grounding, and usage-cost controls
- Push notifications and working reminder scheduling
- Store-compliant subscriptions, trial enforcement, and entitlement checks for Ayah Plus
- Accessibility, performance, privacy, security, licensing, and app-store release review

Qur’an text, translations, tafsir, fonts, and audio must be checked against trusted sources and usage permissions before release. Authentication, cloud sync, live AI, push notifications, and billing are not connected. Audio and Tafsir require a configured backend and approved provider access. Local data can be lost when device storage is cleared, so users should export a backup before resetting or changing devices.
