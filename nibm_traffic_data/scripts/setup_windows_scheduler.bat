@echo off
REM Sushaasan — Windows Task Scheduler Setup
REM Run this once as Administrator to schedule daily collection at 6 AM

SET PYTHON_PATH=%~dp0..\..\..\..\..\AppData\Local\Programs\Python\Python312\python.exe
SET SCRIPT_PATH=%~dp0run_daily.py
SET TASK_NAME=Sushaasan_NIBM_Daily_Collection

echo Setting up Sushaasan daily data collection...
echo Script: %SCRIPT_PATH%
echo Time: 6:00 AM daily

schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "\"%PYTHON_PATH%\" \"%SCRIPT_PATH%\"" ^
  /sc daily ^
  /st 06:00 ^
  /f ^
  /rl HIGHEST

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Task scheduled: %TASK_NAME%
    echo Runs daily at 6:00 AM
    echo.
    echo To verify: schtasks /query /tn "%TASK_NAME%"
    echo To run now: schtasks /run /tn "%TASK_NAME%"
    echo To delete: schtasks /delete /tn "%TASK_NAME%" /f
) ELSE (
    echo.
    echo FAILED. Try running as Administrator.
    echo Or schedule manually in Task Scheduler:
    echo   Action: python "%SCRIPT_PATH%"
    echo   Trigger: Daily at 6:00 AM
)

pause
