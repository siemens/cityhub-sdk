#!/bin/sh

echo "Installing SDK production dependencies..."
echo "Note: consider setting proxy variables through the script config_proxy[.bat,.sh], if you are behind a (corporate) firewall."

echo "=> Installing node npm packages..."
npm install --verbose --production

echo "=> Installing bower packages..."
bower install --verbose

echo "SDK Installation finished."
