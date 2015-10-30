@ECHO OFF


REM Set webserver port
SET PORT=9000

REM Set production/development environment
ET NODE_ENV=development

REM Set nodejs app path
SET NODE_APP=server/app.js

REM start application
echo Starting %NODE_APP%...
node %NODE_APP%
