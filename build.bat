@echo off
chcp 65001 > nul
echo ============================================
echo   VSE - Build
echo ============================================
echo.

pyinstaller --version > nul 2>&1
if errorlevel 1 (
    echo [!] PyInstaller not found. Installing...
    pip install pyinstaller
)

echo [1/4] Cleaning old builds...
if exist build  rmdir /s /q build
if exist dist   rmdir /s /q dist

echo [2/4] Building VSE + WorkshopBrowser (shared _internal)...
pyinstaller rimmod.spec --noconfirm
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo [3/4] Moving web_static and lang to root...
REM Move web_static from _internal to root so Flask can find it
if exist "dist\VSE\_internal\web_static" (
    move "dist\VSE\_internal\web_static" "dist\VSE\web_static" > nul
    echo   Moved: web_static
)
REM Move lang from _internal to root
if exist "dist\VSE\_internal\lang" (
    move "dist\VSE\_internal\lang" "dist\VSE\lang" > nul
    echo   Moved: lang
)

echo [4/4] Copying Python DLL to root...
for %%f in (dist\VSE\_internal\python3*.dll) do (
    copy /y "%%f" "dist\VSE\" > nul
    echo   Copied: %%~nxf
)

echo.
echo ============================================
echo   Done!  dist\VSE\
echo ============================================
echo.
echo   dist\VSE\
echo   |- VSE.exe
echo   |- WorkshopBrowser.exe
echo   |- python3xx.dll
echo   |- web_static\
echo   |- lang\
echo   |- _internal\
echo.
pause
