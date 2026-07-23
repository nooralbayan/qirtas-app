@echo off
echo Cleaning old build...
rd /s /q C:\qirtas_build 2>nul
mkdir C:\qirtas_build

echo Copying files safely...
xcopy "%CD%\*" "C:\qirtas_build\" /E /H /C /I /Y /EXCLUDE:%CD%\exclude.txt

echo Installing dependencies...
cd /d C:\qirtas_build
call npm install

echo Running Expo Prebuild...
call npx expo prebuild --platform android --clean

echo Setting local.properties...
echo sdk.dir=C:\\AndroidSdk > C:\qirtas_build\android\local.properties

echo Starting final Android Build...
call C:\ultimate_build.bat
