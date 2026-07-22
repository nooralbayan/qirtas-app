$ErrorActionPreference = 'Stop'

Write-Host "=== Copying project to safe path (no Arabic chars) ==="
$sourcePath = "C:\Users\نورالدين\Documents\GitHub\qirtas-app\qirtas-mobile"
$safePath = "C:\qirtas_build"

# Remove old build folder if exists
if (Test-Path $safePath) {
    Write-Host "Removing old build folder..."
    Remove-Item -Recurse -Force $safePath
}

# Copy project excluding node_modules, android, jdk folders (we'll reinstall)
Write-Host "Copying project files..."
New-Item -ItemType Directory -Force -Path $safePath | Out-Null
Get-ChildItem -Path $sourcePath -Exclude "node_modules","android","jdk17_extracted","jdk17.zip","build_apk.ps1" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $safePath -Recurse -Force
}

Write-Host "Files copied to $safePath"

# Set up Java 17
$jdkDir = Get-ChildItem -Path "$sourcePath\jdk17_extracted" -Directory | Select-Object -First 1
$env:JAVA_HOME = $jdkDir.FullName
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
Write-Host "Using JAVA_HOME: $env:JAVA_HOME"

# Install node_modules in safe path
Write-Host "Installing node_modules in safe path..."
Set-Location $safePath
cmd /c "npm install"

# Run expo prebuild in safe path
Write-Host "Running expo prebuild..."
cmd /c "npx expo prebuild --platform android --clean"

# Build APK
Write-Host "Building APK..."
Set-Location "$safePath\android"
.\gradlew.bat assembleRelease
Set-Location $safePath

$apkSrc = "$safePath\android\app\build\outputs\apk\release\app-release.apk"
$apkDest = "C:\Users\نورالدين\Desktop\qirtas-mobile.apk"

if (Test-Path $apkSrc) {
    Copy-Item -Path $apkSrc -Destination $apkDest -Force
    Write-Host ""
    Write-Host "=== SUCCESS! ==="
    Write-Host "APK saved to your Desktop: $apkDest"
} else {
    Write-Host "BUILD FAILED - APK not found."
}
