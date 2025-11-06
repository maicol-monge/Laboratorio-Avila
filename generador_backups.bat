@echo off
REM ----------------------------
REM Backup automático MySQL (.bat)
REM ----------------------------

REM --- CONFIGURACIÓN (edita estos valores) ---
set "MYSQLDUMP=C:\xampp\mysql\bin\mysqldump.exe"
set "DB_USER=root"
set "DB_PASS="
set "DB_NAME=laboratorioavila"

REM Carpeta donde se guardarán los backups (asegúrate que exista o se creará)
set "BACKUP_ROOT=C:\backups\labavila"

REM Cuántos días mantener (archivos más antiguos serán eliminados)
set "RETENTION_DAYS=7"
REM --------------------------------------------

REM Crear carpeta si no existe
if not exist "%BACKUP_ROOT%" (
    mkdir "%BACKUP_ROOT%"
)

REM Fecha/hora para el nombre del archivo (YYYY-MM-DD_HH-MM-SS)
for /f "tokens=1-5 delims=/:. " %%a in ("%date% %time%") do (
    set dd=%%a
)
REM Usamos powershell para formato fiable
for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"`) do set TIMESTAMP=%%i

set "SQL_FILE=%BACKUP_ROOT%\backup_%DB_NAME%_%TIMESTAMP%.sql"
set "ZIP_FILE=%BACKUP_ROOT%\backup_%DB_NAME%_%TIMESTAMP%.zip"

echo ======================================================
echo Iniciando backup de la BD %DB_NAME% - %TIMESTAMP%
echo SQL: %SQL_FILE%
echo ZIP: %ZIP_FILE%
echo ------------------------------------------------------

REM Ejecutar mysqldump
"%MYSQLDUMP%" -u "%DB_USER%" --routines --events --single-transaction --quick "%DB_NAME%" > "%SQL_FILE%"
if errorlevel 1 (
    echo ERROR: mysqldump fallo. Revisa credenciales y ruta de mysqldump.
    echo %DATE% %TIME% - mysqldump ERROR >> "%BACKUP_ROOT%\backup_log.txt"
    goto :EOF
)

REM Comprimir usando PowerShell (Compress-Archive)
powershell -NoProfile -Command "Compress-Archive -Path '%SQL_FILE%' -DestinationPath '%ZIP_FILE%' -Force"
if errorlevel 1 (
    echo ERROR: compresión falló.
    echo %DATE% %TIME% - compress ERROR >> "%BACKUP_ROOT%\backup_log.txt"
    goto :EOF
)

REM Borrar el archivo .sql (ya está en zip)
del /f /q "%SQL_FILE%"


echo %DATE% %TIME% - Backup creado: %ZIP_FILE% >> "%BACKUP_ROOT%\backup_log.txt"
echo Backup completado correctamente.

REM -------------------------
REM Limpiar backups viejos
REM -------------------------
echo Eliminando backups con más de %RETENTION_DAYS% dias...
forfiles -p "%BACKUP_ROOT%" -s -m *.zip -d -%RETENTION_DAYS% -c "cmd /c del @path" 2>nul

echo Limpieza finalizada.
echo ======================================================
