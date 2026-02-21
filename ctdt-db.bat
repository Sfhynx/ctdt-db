@echo off
setlocal

if "%1"=="" (
    echo Uso: ctdt-db.bat [install ^| start]
    echo.
    echo   install  - Instala dependencias del frontend (npm) y del backend (dotnet restore)
    echo   start    - Arranca backend y frontend a la vez
    exit /b 1
)

if /i "%1"=="install" goto install
if /i "%1"=="start" goto start

echo Opcion no valida: %1
echo Uso: ctdt-db.bat [install ^| start]
exit /b 1

:install
echo === Instalando dependencias del frontend ===
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo Error al instalar dependencias del frontend.
    cd /d "%~dp0"
    exit /b 1
)
cd /d "%~dp0"

echo.
echo === Restaurando paquetes del backend ===
dotnet restore backend\backend.csproj
if errorlevel 1 (
    echo Error al restaurar el backend.
    exit /b 1
)

echo.
echo Instalacion completada.
exit /b 0

:start
echo === Arrancando backend y frontend ===
cd /d "%~dp0frontend"
call npm run start:full
cd /d "%~dp0"
exit /b 0