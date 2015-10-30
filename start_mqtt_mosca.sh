#!/bin/sh
echo "Starting MQTT Broker Mosca using mqtt port 1883 and ws port 9883..."
mosca -v --http-port 9883 --http-bundle --http-static ./ | bunyan
