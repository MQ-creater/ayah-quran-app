# Ayah — 57-step product build plan

This plan tracks the next 57 engineering and release steps. “Built — verify” means prototype code exists and still needs runtime, content, or device validation. “Next” means it is not implemented. “Blocked” means it depends on a provider permission, secure service, or external approval. Nothing in this document claims full Quran.com/Tarteel parity.

## Reader and Qur’an study

1. **Surah library and metadata** — Built — verify against the production content catalogue and all 114 surahs.
2. **Uthmani and IndoPak text modes** — Built — verify font licensing, rendering, punctuation, and script/text-field matching on Android.
3. **Multiple translations** — Built — verify the approved translations available for each selected language.
4. **Side-by-side translation comparison** — Built — verify provider responses, source labels, and language changes.
5. **Word-by-word meanings and transliteration** — Built — verify word alignment and source coverage for all surahs.
6. **Word-level pronunciation playback** — Built — verify each returned audio asset and playback lifecycle on devices.
7. **Direct ayah-reference navigation** — Built — test valid/invalid keys and deep links such as 2:255.
8. **Juz, Hizb, Rub al-Hizb, Manzil, and Ruku browsing** — Built — verify each endpoint against approved production data.
9. **Mushaf page navigation** — Built — verify all supported Mushaf IDs and their page ranges.
10. **Mushaf line layout** — Built — verify line/page metadata and make the responsive view easier to read.
11. **Random ayah discovery** — Built — verify filtering and provider response shape.
12. **Surah introductions and context** — Built — verify source coverage, author details, and licensing before release.
13. **Tafsir catalogue and ayah commentary** — Built — verify approved tafsir scopes, attribution, and licensing.
14. **Related hadith references** — Built — verify the separate hadith permission, source metadata, and grading fields. Do not present hadith as tafsir.
15. **Reader reading modes and accessibility** — Partly built — complete font-size presets, contrast checks, screen-reader testing, and reduced-motion handling.

## Study tools and personal organization

16. **Verse bookmarks** — Built — verify migration from older saved-ayah formats.
17. **Multiple bookmark collections** — Built — test add/remove, empty collections, renaming, and duplicate handling.
18. **Personal ayah notes** — Built — add note search, editing conflict handling, and export/import tests.
19. **Pinned verse comparison** — Built — verify that pins and captured text persist across pages, surahs, and backup restore.
20. **Ayah sharing** — Built — check share-sheet output on Android and web, including text direction and attribution.
21. **Study notebook search** — Built — improve search filtering, collection views, and empty states.
22. **Related-ayah study links** — Next — add only provider-supported references with clear source labels.
23. **Footnote handling** — Next — preserve footnote markers and display the matching source footnotes instead of silently stripping them.
24. **Reflection journal prompts** — Next — create optional, non-authoritative prompts; do not generate tafsir or issue religious rulings.
25. **Surah/topic study playlists** — Next — let learners build ordered reading sets from verified references.

## Reading goals, memorization, and recitation

26. **Explicit reading check-ins** — Built — verify a page load never counts as a completed reading action.
27. **Daily reading and memorization goals** — Built — test goal changes, day boundaries, and zero-activity days.
28. **30-day learning activity heatmap** — Built — test time zones and make clear that activity is not recitation accuracy.
29. **30/60/90-day Khatmah plan** — Built — test plan start, restart, pause, and progress calculation.
30. **Full-surah memorization tracker** — Built — validate all 6,236 verse references and status changes.
31. **Guided memorization sessions** — Built — test ranges across surah boundaries and interrupted sessions.
32. **Revision queue and scheduling** — Built — validate due dates, local time changes, and learner-controlled ratings.
33. **Selected-ayah recitation queue** — Built — test missing audio, network interruptions, repeat counts, and stop behavior.
34. **Full-surah player** — Built — verify resume, next/previous, repeat, and background lifecycle on devices.
35. **Timestamp-based ayah highlighting** — Conditional — only enable when the selected recording supplies verified compatible timestamps.
36. **Voice ayah search** — Blocked — integrate and validate Arabic speech recognition; do not imitate this with ordinary text search.
37. **Real-time recitation feedback** — Blocked — requires an evaluated speech model, Arabic pronunciation experts, clear confidence thresholds, and false-positive handling.
38. **Tajwid feedback** — Blocked — requires qualified review and validated tajwid-specific models; a basic microphone transcript is not tajwid assessment.
39. **Memorization analytics** — Next — add review accuracy only when supported by recorded learner assessments, not invented AI scores.
40. **Study reminders and notifications** — Next — implement opt-in scheduling, timezone behavior, quiet hours, and device permissions.

## Arabic Academy and teacher experience

41. **Arabic alphabet classroom** — Built — expand the lesson set and test letter forms in initial, medial, final, and isolated positions.
42. **Beginner vocabulary lessons** — Partly built — build a reviewed, ordered curriculum with audio from permitted sources.
43. **Arabic quizzes and milestone tests** — Partly built — add answer explanations, retries, and reliable progress recovery.
44. **Grammar pathway** — Next — develop a staged beginner-to-intermediate syllabus reviewed by qualified Arabic educators.
45. **Pronunciation practice** — Blocked — add microphone capture only with a clear privacy notice and a validated feedback service.
46. **AI Teacher preview** — Built — the Hamza/Maryam selector is a preview, not a connected teacher.
47. **Live AI Teacher** — Blocked — add source-grounded retrieval, safety controls, privacy safeguards, rate limits, and transparent usage costs.
48. **Teacher lesson plans** — Next — create structured sessions that distinguish language learning from Qur’anic interpretation.

## Accounts, Ayah Plus, platform quality, and release

49. **Secure user accounts** — Blocked — implement approved OAuth/OIDC sign-in and secure session management.
50. **Cloud sync across devices** — Blocked — use authenticated user APIs for bookmarks, notes, collections, goals, and reading position.
51. **Offline reading** — Next — design a licensed, integrity-checked cache with explicit storage controls and deletion.
52. **Offline audio downloads** — Next — verify redistribution/download rights, storage use, and background playback behavior before enabling.
53. **Ayah Plus entitlement model** — Next — define free/Plus feature access in one testable policy, not scattered UI conditions.
54. **Store subscriptions and trial enforcement** — Blocked — integrate store billing, server-side receipt validation, restoration, cancellation, and clear pricing disclosures.
55. **Privacy and security review** — Next — audit data collection, retention, export/delete behavior, permissions, dependency risks, and server logs.
56. **Automated and device testing** — Next — run unit tests, source checks, Expo export, Android/iPad testing, audio tests, accessibility checks, and provider integration tests.
57. **Production launch review** — Blocked — obtain production Content API access, review all Qur’an text/audio/translation/tafsir licenses and attribution, complete app-store policy review, and verify support and incident processes.

## Engineering rule

Ayah must prefer correct source material and honest capability labels over feature-count claims. Prototype controls must say when a backend, provider permission, account, subscription, or speech engine is not connected. No AI feature may claim to verify memorization, tajwid, or pronunciation until it has been independently evaluated for that exact task.
