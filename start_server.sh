#!/bin/sh

# Set webserver port
export PORT=9000

# Set production/development environment
export NODE_ENV=development

# Set nodejs app path
export NODE_APP=server/app.js

# Start application
echo Starting $NODE_APP...
node $NODE_APP
