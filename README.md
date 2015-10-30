# City Hub Sensors SDK
##### Date: Oct 2015, Authors: MR, TA
The City Hub Sensors SDK provides an emulation environment for the City Hub devices and their sensors (available parking spaces, available bikes (bike-sharing), temperature, humidity, ambient noise, traffic density, etc). Sensor values are be basically set through REST APIs. Sensor values can be queried through REST APIs (sample web application provided), or directly acquired through a pub/sub middleware (MQTT topics). Moreover, this SDK provides a sample transaction API for booking parking spaces and bikes.

This SDK provides:
  - A web application for emulating and getting/setting the status of City Hub devices (based on Node.js, AngularJS and Mosca MQTT Broker)
  - A command line tool for setting sensor values in a automated way (Node.js command line application)

# Installation
How to setup the NodeJS/JavaScript development environment required for this project (tested on Ubuntu 14.04 LTS / Windows 7 64-Bit).

## Windows-only Prerequisites

- Install Microsoft Windows SDK (required for compiling native dependencies and tools)
  - Download and install Microsoft Windows SDK for your Windows version (e.g. from [https://www.microsoft.com/en-us/download/details.aspx?id=8279]())
  - Make sure that you set the Microsoft Windows SDK environment variables before installing any node packages that require native compilation,
    by typing the following command in the console `<MS-SDK-PATH>\bin\Setenv.cmd /Release /x64`, e.g.:
    ```
        "C:\Program Files\Microsoft SDKs\Windows\v7.1\bin\Setenv.cmd" /Release /x64
    ```

## Install Dependencies

1. Install Node.js and npm
  - Download and install [Node.js](http://nodejs.org/)
  - Make sure node and npm are installed properly. Check this by typing:
    ```
        node --version
        npm --version
    ```
  - *(Optional)* Set npm proxy if required (e.g. by using the config scripts config_proxy.sh or config_proxy.bat)

2. Install Grunt and Bower using npm (executing shell commands with administrator rights might be required)
  - Type the following to install grunt and bower:
  ```
    npm install -g bower grunt grunt-cli
    bower --version
    grunt --version
  ```

3. *(Optional)* Install [Mosca](https://github.com/mcollina/mosca) MQTT broker
  - Type (executing with Administrator rights might be required):
  ```
     npm install -g mosca bunyan
     mosca --version
  ```

4. Automatically install project npm & bower dependencies excluding MQTT Mosca (executing with administrator rights might be required)
  - Windows:
    ```
       install.bat
    ```
  - Linux (sudo might be required):
    ```
       ./install.sh
    ```

5. Make sure that a modern web browser is installed (tested on Chrome v46)

Start the Application
---------------------
1. Start node application (the web browser will be automatically started, build process / server / browser automatically restarted/refreshed upon changes).
  - Type the following command in the console for starting the application:
  ```
     npm start
  ```

2. *(Optional)* Start MQTT Broker Mosca (if installed), by typing:
  - Windows:
  ```
     start_mqtt_mosca.bat
  ```
  - Linux:
  ```
     ./start_mqtt_mosca.sh
  ```

3. Check/set sensor values
  - Using a web browser: [http://localhost:9000]()
  - Using the command line application, check script usage:
  ```
     node cli/sensor.js --help
  ```
