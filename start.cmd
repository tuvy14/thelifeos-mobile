@echo off
REM Foolproof launcher for TheLifeOS mobile app.
REM Double-click this file, or run it from any terminal — it always
REM starts Expo from THIS folder (fixes "Cannot determine Expo SDK version"
REM which happens when `npx expo start` is run from the wrong directory).
cd /d "%~dp0"
echo Starting TheLifeOS (Expo) from %cd%
echo Scan the QR code below with the Expo Go app on your iPhone.
echo.
npx expo start
pause
