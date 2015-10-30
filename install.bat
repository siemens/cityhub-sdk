@ECHO OFF
REM Set paths here
SET MS_SDK_PATH="C:\Program Files\Microsoft SDKs\Windows\v7.1\bin\Setenv.cmd"

ECHO Installing SDK production dependencies...
ECHO "Note: consider setting proxy variables through the script config_proxy[.bat,.sh], if you are behind a (corporate) firewall."

ECHO "=> Setting native compilation environment"
CALL %MS_SDK_PATH% /Release /x64

ECHO "=> Installing node npm packages..."
npm install --verbose --production

ECHO "=> Installing bower packages..."
bower install --verbose

ECHO SDK Installation finished.
