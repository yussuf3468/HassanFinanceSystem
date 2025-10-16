# Android Quick Start — Lenzro ERP

## 1) Prepare

- Install Android Studio + SDK + JDK 17
- Create Google Play Developer account ($25 one-time)
- Prepare assets (icon 512×512, feature 1024×500, screenshots)
- Create a privacy policy URL

## 2) Build & Open

```powershell
npm run android
```

## 3) Create Keystore (one-time)

```powershell
keytool -genkeypair -v -keystore hassan-lenzro.keystore -alias lenzro -keyalg RSA -keysize 2048 -validity 10000
```

- Move keystore to `android/` folder or a secure path
- Copy `android/keystore.properties.example` to `android/keystore.properties`
- Fill values; DO NOT COMMIT the real file

## 4) Set Version

Edit `android/app/build.gradle`:

```gradle
versionCode 1   // +1 on each release
versionName "1.0.0"
```

## 5) Build AAB Bundle

- In Android Studio: Build → Generate Signed Bundle → release
- Or terminal:

```powershell
npm run android:bundle
```

Bundle path: `android/app/build/outputs/bundle/release/app-release.aab`

## 6) Upload to Play Console

- Create app record, upload `.aab`
- Fill Store listing, Data Safety, App content, Privacy policy
- Submit for review; promote from internal testing to production

## Notes

- After changes, run `npm run build:mobile` to sync assets
- If a blank screen appears, ensure `dist` exists and Capacitor `webDir` is `dist`
- Supabase: only use anon key in client (you already do)
