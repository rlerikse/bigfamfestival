# Installing Android NDK

The build is failing because the Android NDK (Native Development Kit) version 27.1.12297006 is not installed. Here's how to install it:

## Option 1: Using Android Studio (Recommended)

1. **Open Android Studio**
   - If you don't have it, download from: https://developer.android.com/studio

2. **Open SDK Manager**
   - Go to: **File** > **Settings** (or **Android Studio** > **Preferences** on Mac)
   - Navigate to: **Appearance & Behavior** > **System Settings** > **Android SDK**

3. **Install NDK**
   - Click on the **SDK Tools** tab
   - Check the box for **"NDK (Side by side)"**
   - Make sure version **27.1.12297006** is selected (or check the box to install it)
   - Click **Apply** to download and install

4. **Accept Licenses**
   - Android Studio will prompt you to accept licenses during installation
   - Accept all licenses when prompted

5. **Rebuild**
   - After installation completes, go back to your terminal
   - Run: `cd mobile && npx expo run:android`

## Option 2: Manual Installation (Advanced)

If you can't use Android Studio, you can manually download and install the NDK:

1. **Download NDK**
   - Go to: https://developer.android.com/ndk/downloads
   - Download NDK version 27.1.12297006 for Windows

2. **Extract to SDK directory**
   - Extract to: `C:\Users\dizzy\AppData\Local\Android\Sdk\ndk\27.1.12297006`

3. **Accept License**
   - The license file should already exist at: `C:\Users\dizzy\AppData\Local\Android\Sdk\licenses\android-ndk-license`
   - If not, create it with content: `24333f8a63b6825ea9c5514f83c2829b517d6550`

## Option 3: Use a Different NDK Version (Workaround)

If you want to use a different NDK version that's already installed, you can modify the build configuration. However, this may cause compatibility issues.

## Quick Check

After installation, verify the NDK is installed:

```powershell
Test-Path "C:\Users\dizzy\AppData\Local\Android\Sdk\ndk\27.1.12297006"
```

If this returns `True`, the NDK is installed and you can try building again.

## Why is NDK Required?

The NDK is required for React Native/Expo apps that use native modules. Even if your app doesn't directly use native code, some dependencies may require it.

