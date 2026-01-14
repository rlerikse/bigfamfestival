@echo off
echo ===== FULL EXPO RESET FOR EAS BUILD =====
echo.

REM Navigate to the project directory
cd /d E:\repos\bigfamfestival\mobile

echo === STEP 1: Removing native folders ===
echo Removing android directory...
if exist android rd /s /q android
echo Removing ios directory...
if exist ios rd /s /q ios

echo === STEP 2: Cleaning npm cache ===
echo Removing node_modules...
if exist node_modules rd /s /q node_modules
echo Removing package-lock.json...
if exist package-lock.json del /f package-lock.json
echo Removing yarn.lock...
if exist yarn.lock del /f yarn.lock
echo Clearing npm cache...
call npm cache clean --force

echo === STEP 3: Clearing Metro bundler cache ===
echo Clearing Metro bundler cache...
del /s /q %TEMP%\metro-* 2>NUL
echo Clearing Watchman watches...
watchman watch-del-all 2>NUL || echo Watchman not available, skipping...

echo === STEP 4: Reinstalling dependencies ===
echo Installing dependencies...
call npm install --legacy-peer-deps

echo === STEP 5: Preparing for EAS build ===
echo Logging in to Expo (if needed)...
call npx expo login --non-interactive || echo Already logged in or using environment variables

echo.
echo ===== RESET COMPLETE =====
echo.
echo Now you can build your app with EAS using one of these commands:
echo.
echo For development build (for testing):
echo   npx eas build --platform android --profile development
echo.
echo For internal preview build:
echo   npx eas build --platform android --profile preview
echo.
echo For production build:
echo   npx eas build --platform android --profile production
echo.

echo.
echo ===== BUILD CLEAN COMPLETE =====
echo.
echo Now run:
echo npx expo run:android
echo.

pause