@echo off
echo ===== FIXING EXPO PROJECT CONFIGURATION =====
echo.

REM Navigate to the project directory
cd /d E:\repos\bigfamfestival\mobile

echo === Updating dependencies ===
call npx expo install --fix

echo.
echo === Running expo-doctor again ===
call npx expo-doctor

echo.
echo === FIXES COMPLETE ===
echo.
echo If there are still issues, please run:
echo   npx expo install --check
echo to see what dependencies need updating.
echo.
echo To build with EAS, run:
echo   npx eas build --platform android --profile preview
echo.

pause