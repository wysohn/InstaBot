@ECHO OFF

::Check if node is installed
CALL node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 GOTO NODENOTFOUND

::Accept username and password from command arguemnts
:INPUT_USERNAME
set /p user="User Name?>> "
if "%user%"=="" goto INPUT_USERNAME

:INPUT_PASSWORD
set /p pass="Password?>> "
if "%pass%"=="" goto INPUT_PASSWORD

:INPUT_GUI
set /p gui="GUI? (y/n)>> "
if "%gui%"=="" goto INPUT_GUI

cls

ECHO User name: %user%
GOTO APP

:APP
ECHO Starting application...

::Instal puppeteer
call npm install puppeteer

::Start the application
setlocal 
    if "%gui%"=="y" (set GUI="true") else (set GUI="false")

    SETLOCAL EnableDelayedExpansion
    set USER_ID=!user!
    set PASSWORD=!pass!
    start node index.js !GUI!
endlocal

ECHO Closing in 5 seconds...
timeout 5 > NUL

EXIT 0

:NODENOTFOUND
ECHO Node not found. Please install node and add it to your path.
ECHO https://nodejs.org/
ECHO Closing in 5 seconds...
timeout 5 > NUL