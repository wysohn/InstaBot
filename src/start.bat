@ECHO OFF

::Check if node is installed
CALL node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 GOTO NODENOTFOUND

::Accept username and password from command arguemnts
:INPUT_USERNAME
set /p "user=User Name?>> "
if "%user%"=="" goto INPUT_USERNAME

:INPUT_PASSWORD
set /p "pass=Password?>> "
if "%pass%"=="" goto INPUT_PASSWORD

cls

ECHO User name: %user%
GOTO APP

:APP
ECHO Starting application...

::Start the application
setlocal 
    set USER_ID=%user%
    set PASSWORD=%pass%
    start node index.js
endlocal

ECHO Closing in 5 seconds...
timeout 5 > NUL

EXIT 0

:NODENOTFOUND
ECHO Node not found. Please install node and add it to your path.
ECHO https://nodejs.org/
ECHO Closing in 5 seconds...
timeout 5 > NUL