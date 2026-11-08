# Ayah

A Qur'an memorization companion app, beginning with Android.

## Current features

- Navy-and-gold home screen
- Daily reflection ayah
- Interactive memorization practice card with reveal/hide translation
- Practice-session counter for the current app session
- Review card with reveal/hide translation
- Reciter preference selector (audio playback is not connected yet)
- Simple daily memorization target selector
- Bottom navigation between Home, Learn, Review, and Plan

## Technology

- React Native
- Expo SDK 54
- JavaScript

## Run in GitHub Codespaces

Open this repository in a Codespace, then run:

```bash
npm install
npx expo start --web --host 0.0.0.0
```

If Expo reports that web support is missing, run:

```bash
npx expo install react-dom react-native-web @expo/metro-runtime
```

Then open the forwarded port shown by Codespaces (usually port 8081) in the browser.

## Android

This is an Expo React Native project. Android testing can be done with Expo Go on an Android device or an Android emulator. A distributable Android build will be configured after the core app flow is tested.

## Still to build

- Persistent accounts and progress storage
- Verified Qur'an text/translation data source
- Verified recitation audio and playback controls
- Recitation/repetition tools
- Daily reminders and user settings

Qur'an text, translations, and audio must be checked against trusted sources before release. The current practice counter and plan selection are temporary in-memory state and reset when the app restarts.
