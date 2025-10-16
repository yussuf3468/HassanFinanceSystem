# Android Release Guide — Lenzro ERP

This guide helps you build, sign, and publish the Android app to Google Play.

## Prerequisites

- Java JDK 17
- Android Studio (latest)
- Android SDK + Platform Tools
- Google Play Developer account (one-time $25)
- App assets: Icon (512x512), Feature graphic (1024x500), Screenshots
- Privacy policy URL

## 1) Build your web app

```powershell
npm run build
```

## 2) Copy assets into Android project

```powershell
npx cap copy android
```

## 3) Open Android Studio

```powershell
npx cap open android
```

Let Gradle sync. You can run on a device/emulator from Android Studio (Run ▶).

## 4) Create a signing keystore

```powershell
keytool -genkeypair -v -keystore hassan-lenzro.keystore -alias lenzro -keyalg RSA -keysize 2048 -validity 10000
```

Store the password securely.

## 5) Configure signing in Android Studio

- Open `android/app` module settings → Build Types → Release
- Create a new signing config using your keystore
- Assign signing config to the `release` build type

Alternatively, create `android/keystore.properties` (do NOT commit):

```
storeFile=../hassan-lenzro.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=lenzro
keyPassword=YOUR_KEY_PASSWORD
```

And reference in `app/build.gradle` (if you prefer code-based signing config).

## 6) Build the release bundle (AAB)

In Android Studio: Build → Generate Signed Bundle/APK → Android App Bundle → select release.

Or via terminal:

```powershell
cd android
./gradlew bundleRelease
```

The output `.aab` is in `android/app/build/outputs/bundle/release/app-release.aab`.

## 7) Play Console steps

- Create app → Fill out store listing
- Upload `.aab` to an internal testing track first
- Fill Data Safety + App content (target audience, content rating)
- Privacy policy URL
- Submit for review; after internal testing, promote to production

## Notes

- Supabase keys are public anon keys; keep service role keys out of the app
- If you change web code, run `npm run build` then `npx cap copy android`
- For deep links or intent filters, edit `AndroidManifest.xml`

## Troubleshooting

- If blank screen: ensure `dist` exists and `webDir` is set to `dist` in `capacitor.config.ts`
- Network errors: Capacitor uses https scheme; ensure APIs are HTTPS
- Splash/icon: use Android Studio Image Asset tool to set adaptive icons
