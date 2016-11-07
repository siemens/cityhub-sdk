# City Hub SDK
##### Last update: November 2016, Authors: Marcos Rocha, Tobias Aigner
The City Hub SDK provides an emulation environment for the City Hub devices and their sensors (available parking spaces, available bikes (bike-sharing), temperature, humidity, ambient noise, traffic density, etc). Sensor values are be basically set through REST APIs. Sensor values can be queried through REST APIs (sample web application provided), or directly acquired through a pub/sub middleware (MQTT topics). Moreover, this SDK provides a sample transaction API for booking parking spaces and bikes.

This SDK provides:
  - A web application for emulating and getting/setting the status of City Hub devices (based on Node.js, AngularJS and Mosca MQTT Broker)
  - A web application for displaying a map with markers providing infos about the City Hubs their sensor values.
  - A command line tool for setting sensor values in a automated way (Node.js command line application)

# Installation
How to setup the NodeJS/JavaScript development environment required for this project (tested on Ubuntu 16.04 LTS / Windows 7 64-Bit).

# Windows-only Prerequisites (npm binary build dependencies)
  - Install Microsoft Visual Studio Community 2015 https://www.visualstudio.com/ (Custom install, Select Visual C++ during the installation)
  - Config npm for VS2015: ```npm config set msvs_version 2015 --global```

## Install Development Environment & Dependencies
1. Install Node.js and npm
  - Download and install [Node.js v6.x](https://nodejs.org/download/release/latest-v6.x/) for your platform (at least npm v6.3.1 has been tested and works fine, the warnings can be ignored)
  - Make sure node and npm are installed properly. Check this by typing:
  ```
  node --version
  npm --version
  ```
  - *(Optional)* If you are connected to the internet through e.g. a corporate proxy, set npm proxy if required (e.g. by using the config scripts config_proxy.sh or config_proxy.bat)

2. Install Grunt and Bower using npm (executing shell commands with administrator rights, i.e. under Linux: `sudo`, might be required)
  - Type the following commands to install grunt and bower:
  ```
    npm install -g bower grunt grunt-cli
    bower --version
    grunt --version
  ```

3. *(Optional)* Install [Mosca](https://github.com/mcollina/mosca) MQTT broker
  - Type the following commands (executing with Administrator rights, i.e. under Linux: `sudo`, might be required):
  ```
     npm install -g mosca bunyan
     mosca --version
  ```

4. Automatically install project npm & bower dependencies excluding MQTT Mosca (executing with administrator rights, i.e. under Linux: `sudo`, might be required)
    ```
       npm install
       bower install
    ```

5. Make sure that a modern web browser is installed (tested on Chrome v54). Consider installing some plugins, e.g.:
  - A REST API test tool, such as Postman https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en
  - A MQTT client, such as MQTTLens https://chrome.google.com/webstore/detail/mqttlens/hemojaaeigabkbcookmlgmdigohjobjm?hl=en

6. Install an appropriate JavaScript IDE (e.g. https://code.visualstudio.com/ or https://www.jetbrains.com/webstorm/)

7. *(Optional)* Install GIT
  - Download and install GIT
    http://msysgit.github.io/
  - Make sure that GIT is on the system path (e.g. for Windows add "C:\Program Files\Git\cmd" to your PATH environment variable)


Start the Application
---------------------
1. Start node application
  - Type the following command in the console for starting the application:
  ```
     grunt serve
  ```
  OR
  ```
     npm start
  ```
  - Open the web browser with the URL [http://localhost:9000]()

2. *(Optional)* Start MQTT Broker Mosca (if installed), by typing:
  ```
     npm run start-mqtt
  ```

3. Check/set sensor values
  - Using a web browser: [http://localhost:9000]()
  - Using the command line application, check script usage:
  ```
     node cli/sensor.js --help
  ```

# Technologies
Links to the technologies used by the SDK:
  - Node.js https://nodejs.org/dist/latest-v6.x/docs/api/synopsis.html
  - AngularJS https://code.angularjs.org/1.4.14/docs/guide
  - LeafletJS http://leafletjs.com/examples.html
  - MQTT https://en.wikipedia.org/wiki/MQTT

# Project / Source Code Structure
Overview of the project structure
---------------------------------
| Path           | Contents |
|----------------|----------|
| . | README.md, LICENSE.txt, installation/helper scripts, etc. |
| ./client | HTML5 / JavaScript web client (based on AngularJS) |
| ./client/main | Main web client for querying/setting City Hub devices and their sensor values |
| ./client/map | Sample City Hub application: displays map with markers for all City Hub devices |
| ./client/mqtt | MQTT web client |
| ./client/rest | REST web client (for test purposes) |
| ./server | Node.js web application server |
| ./server/config/sensors.js | Default values for City Hub devices (device coordinates, info, sensor values, etc.) |
| ./cli | Command line application for setting sensor values (through REST APIs), either single values or values scheduled via day-of-the-week-based timestamps |
| ./values | JSON files containing sample/forecast values for sensors (array of {dayOfWeek: 0-6, time: 0-24:0-59:0-59, value: 1234}) |
