# LABEL LENS AI — Android APK Packaging Guide

**Project**: LABEL LENS AI ("Smart Packaged Commodity Compliance Assistant")  
**Hackathon Problem Statement**: SIH26034  
**Framework**: Capacitor v7 + React 18 + Vite 5 + Tailwind v4  

---

## 1. Architecture Overview

LABEL LENS AI is built as a cross-platform progressive application utilizing **Capacitor** to bridge the modern React frontend with native Android device capabilities (camera capture, file selection, offline caching, and responsive viewport handling).

The native Android project is generated and maintained inside `frontend/android/`.

```
frontend/
├── dist/                          # Production compiled web assets
├── src/                           # React / TypeScript source code
├── capacitor.config.ts            # Capacitor native configuration
└── android/                       # Native Android Studio project
    ├── app/
    │   ├── src/main/
    │   │   ├── AndroidManifest.xml # Camera, storage & network permissions
    │   │   └── assets/public/     # Synced web bundle
    │   └── build.gradle           # Native app dependencies
    ├── build.gradle               # Project Gradle config
    └── gradlew / gradlew.bat      # Gradle build wrappers
```

---

## 2. Environment Status & Honest Notice

> [!NOTE]
> In this specific local environment, the Capacitor integration is fully initialized and verified:
> - `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android` are installed.
> - The native project directory `frontend/android` is fully generated and synced.
> - Because Android Studio and the Android SDK / Java JDK are not pre-installed on this machine, direct APK binary compilation (`.apk` output) must be performed on a machine equipped with Android Studio or the Android Command-Line Tools.
>
> Follow the exact instructions below to compile and run the APK on your development machine.

---

## 3. Prerequisites for Building the APK

To build the APK, ensure your computer has:
1. **Node.js** (v18 or v20 LTS)
2. **Java Development Kit (JDK)**: JDK 17 (recommended for Gradle 8+)
3. **Android Studio**: Ladybug / Hedgehog or newer
4. **Android SDK**: API Level 34 (Android 14) or API Level 33

---

## 4. Mobile API Configuration

When running inside an Android emulator or on a physical smartphone, `localhost` refers to the device itself, not your backend server on your computer.

The frontend is programmed to automatically detect the native runtime:
* **Android Emulator**: Automatically defaults to `http://10.0.2.2:8000` (the standard Android loopback alias for the host machine).
* **Physical Android Device**: Connect your phone to the same Wi-Fi network as your computer, find your computer's local IP address (e.g. `192.168.1.50`), and configure `frontend/.env.local`:
  ```env
  VITE_API_URL=http://192.168.1.50:8000
  ```
* **Production Deployed Backend**: Point `VITE_API_URL` to your production HTTPS domain:
  ```env
  VITE_API_URL=https://api.labellens.ai
  ```

---

## 5. Step-by-Step Build Workflow

### Step 1: Build the Production Web Bundle
Navigate to the `frontend/` directory and compile the optimized web distribution:
```bash
cd frontend
npm run build
```
This runs `tsc -b && vite build` and generates the production files into `frontend/dist/`.

### Step 2: Synchronize Assets with Native Android
Copy the web bundle and update any Capacitor plugin configurations:
```bash
npx cap sync android
```
You should see:
```
√ Copying web assets from dist to android/app/src/main/assets/public
√ Creating capacitor.config.json in android/app/src/main/assets
√ Updating Android plugins
[success] Android sync finished!
```

### Step 3: Open in Android Studio
Launch the project in Android Studio:
```bash
npx cap open android
```
*(Or open Android Studio manually, select "Open an Existing Project", and browse to `C:\Users\maram\Downloads\vishnu\frontend\android`.)*

### Step 4: Build Debug APK
#### Option A: Via Command Line (Terminal inside `frontend/android`)
```bash
cd android
./gradlew assembleDebug       # On macOS/Linux
gradlew.bat assembleDebug     # On Windows
```
The output APK will be located at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Via Android Studio UI
1. Click **Build** in the top menu bar.
2. Select **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
3. Android Studio will notify you when complete with a clickable link: **locate**.

### Step 5: Build Signed Release APK
To create a production-ready APK for distribution or submission to judges:
1. In Android Studio, go to **Build** -> **Generate Signed Bundle / APK...**
2. Choose **APK** and click **Next**.
3. Select your keystore (or click **Create new...** to generate a keystore).
4. Select destination folder and choose **release** build variant.
5. Check **V1 (Jar Signature)** and **V2 (Full APK Signature)**.
6. Click **Finish**.

The signed APK will be created in:
`frontend/android/app/release/app-release.apk`

---

## 6. Permissions & Manifest Configuration

The native project includes all permissions required for package label inspection:
- `android.permission.INTERNET`: For connecting to the Legal Metrology analysis backend.
- `android.permission.CAMERA`: For direct capture of packaged commodity labels.
- `android.permission.READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`: For gallery uploads.

These are defined in:
`frontend/android/app/src/main/AndroidManifest.xml`
