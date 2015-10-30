@ECHO OFF
REM (C) Copyright 2015, Siemens AG
REM Author: Marcos J. S. Rocha
REM
REM SPDX-License-Identifier:     BSD-2-Clause

:checkPrivileges
NET FILE 1>NUL 2>NUL
IF "%errorlevel%" == "0" ( GOTO gotPrivileges ) ELSE ( GOTO getPrivileges ) 

:getPrivileges 
IF '%1'=='ELEV' (GOTO gotPrivileges)  
ECHO ***** Invoking UAC for Privilege Escalation *****
SETLOCAL DisableDelayedExpansion
SET "batchPath=%~0"
SETLOCAL EnableDelayedExpansion
ECHO SET UAC = CreateObject^("Shell.Application"^) > "%temp%\OEgetPrivileges.vbs" 
ECHO UAC.ShellExecute "!batchPath!", "ELEV %1 %2 %3", "", "runas", 1 >> "%temp%\OEgetPrivileges.vbs" 
"%temp%\OEgetPrivileges.vbs" 
EXIT /B 

:gotPrivileges 
::::::::::::::::::::::::::::
::START
::::::::::::::::::::::::::::
REM SETLOCAL

ECHO __________________________________
ECHO     Proxy Config Tool v0.9.2
ECHO __________________________________

REM ######## DEFAULT VALUES #########
SET DEFAULT_HTTP_PROXY=http://127.0.0.1:3128

REM ######## SCRIPT VARS #########
SET MY_FILENAME=%~n0
SET MY_PATH=%~dp0

REM Remove 1st param "ELEV"
IF "%1"=="ELEV" (
  SHIFT
)

IF "%1"=="" (
  SET MY_HTTP_PROXY=%DEFAULT_HTTP_PROXY%
) ELSE (
  SET MY_HTTP_PROXY=%1
)
SET MY_HTTPS_PROXY=%MY_HTTP_PROXY%
IF /I "%MY_HTTP_PROXY%"=="NoProxy" (
  SET NO_PROXY=1
) ELSE (
  SET NO_PROXY=0
)

IF "%NO_PROXY%"=="0" (
  REM Extract PROXY_HOST and PROXY_PORT from e.g. http://127.0.0.1:3128
  SET PROXY_HOST_PORT=%MY_HTTP_PROXY:~7,100%
  FOR /F "tokens=1,2,3 delims==:" %%A IN ('SET PROXY_HOST_PORT') DO (
    @ECHO "HOST/PORT=%%B/%%C"
    SET PROXY_HOST=%%B
    SET PROXY_PORT=%%C
  )
)


ECHO ###
ECHO Configuring HTTP(S)_PROXY=%MY_HTTP_PROXY% (NoProxy=%NO_PROXY%)
ECHO Usage: 
ECHO   %MY_FILENAME% [HTTP_PROXY]: config default or specified proxy (default proxy: %DEFAULT_HTTP_PROXY%), e.g.:
ECHO     %MY_FILENAME%
ECHO     %MY_FILENAME% http://127.0.0.1:3128
ECHO     %MY_FILENAME% http://127.0.0.1:8888
ECHO     %MY_FILENAME% NoProxy
ECHO ###

:setEnvVarsProxy
ECHO # Persistenly storing environment variables (requires running with Administrator rights)...
IF "%NO_PROXY%"=="0" (
  SETX -m HTTP_PROXY %MY_HTTP_PROXY%
  SETX -m HTTPS_PROXY %MY_HTTPS_PROXY%
  SETX -m PROXY %MY_HTTP_PROXY%
  SETX -m GRADLE_OPTS "-Dhttp.proxyHost=%PROXY_HOST% -Dhttp.proxyPort=%PROXY_PORT% -Dhttps.proxyHost=%PROXY_HOST% -Dhttps.proxyPort=%PROXY_PORT%"
  SET HTTP_PROXY=%MY_HTTP_PROXY%
  SET HTTPS_PROXY=%MY_HTTPS_PROXY%
  SET HTTP_PROXY=%MY_HTTP_PROXY%
  SET GRADLE_OPTS="-Dhttp.proxyHost=%PROXY_HOST% -Dhttp.proxyPort=%PROXY_PORT% -Dhttps.proxyHost=%PROXY_HOST% -Dhttps.proxyPort=%PROXY_PORT%"
) ELSE (
  SETX -m HTTP_PROXY ""
  SETX -m HTTPS_PROXY ""
  SETX -m PROXY ""
  SETX -m GRADLE_OPTS ""
  SET HTTP_PROXY=
  SET HTTPS_PROXY=
  SET PROXY=
  SET GRADLE_OPTS=
)
ECHO Environment Variables Result (might need to start a new CMD for seeing changes):
SET HTTP_PROXY
SET HTTPS_PROXY
SET PROXY
SET GRADLE_OPTS

:setGitProxy
ECHO # Configuring GIT proxy...
IF "%NO_PROXY%"=="0" (
  git config --global http.proxy %MY_HTTP_PROXY%
  git config --global https.proxy %MY_HTTPS_PROXY%
  git config --global url."http://".insteadOf git://
  git config --global http.sslVerify false
) ELSE (
  git config --global --unset-all http.proxy
  git config --global --unset-all https.proxy
  git config --global url."http://".insteadOf git://
  git config --global http.sslVerify true
)
ECHO GIT Config Result:
git config --global -l

:setNpmProxy
ECHO # Configuring NPM proxy, NPM registry and certificate check...
IF "%NO_PROXY%"=="0" (
  call npm config set proxy %MY_HTTP_PROXY%
  call npm config set https-proxy %MY_HTTPS_PROXY%
  call npm set strict-ssl false
  call npm config set registry http://registry.npmjs.org/
) ELSE (
  call npm config delete proxy 
  call npm config delete https-proxy 
  call npm set strict-ssl true
  call npm config set registry https://registry.npmjs.org/
)
ECHO NPM Config Result
call npm config list



ECHO **********************************************************
ECHO ***** Manual tasks:
ECHO ***** 1) Consider restarting cmd shell
ECHO ***** 2) Consider setting Win7 SDK path (for required native compilation) by calling:
ECHO *****    "C:\Program Files\Microsoft SDKs\Windows\v7.1\bin\Setenv.cmd" /Release /x64
ECHO ***** 3) Consider setting bower proxy settings manually by editing the file .bowerrc 
ECHO **********************************************************

ECHO **********************************************************
ECHO ***** If errors persist, consider:
ECHO *****   1) Removing node_modules directory and 
ECHO *****   2) Cleaning npm cache (stored at  %AppData%/npm-cache) by executing: npm cache clean
ECHO **********************************************************

:theEnd
PAUSE
EXIT /B

REM ENDLOCAL
