/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';
/* globals L */

angular.module('chSensorsApp')
  .controller('MapCtrl', ['$scope', '$http', '$location', '$interval', 'socket', function ($scope, $http, $location, $interval, socket) {

    // get query params, latitude, longitude, radius
    var latitude = $location.search().lat ? $location.search().lat : 48.13720;
    var longitude = $location.search().lng ? $location.search().lng : 11.57533;
    var zoom = $location.search().zoom ? $location.search().zoom : 15;

    var AUTO_RELOAD_INTERVAL_MS = ($location.search().autoreload || $location.search().autoreload === 0) ? $location.search().autoreload : 0; // per default no auto-reload

    // create marker icons
    L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
    // http://fortawesome.github.io/Font-Awesome/icons/
    var cityhubIcon = L.AwesomeMarkers.icon({
      icon: 'lightbulb-o',
      markerColor: 'orange'
    });
    var homeIcon = L.AwesomeMarkers.icon({
      icon: 'home',
      markerColor: 'lightblue'
    });

    // create map layers
    var baseLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'Map data &copy; OpenStreetMap contributors, ' +
      'CC-BY-SA, ' +
      'Imagery © Mapbox',
      id: 'map'
    });
    var cityhubLayer;
    var homeMarker = new L.marker([latitude, longitude], {icon: homeIcon}).bindPopup('You are here');
    var homeLayer = new L.LayerGroup(homeMarker);
    var layers = [baseLayer, homeLayer];

    // create map
    var map;
    try { // try catch block for dealing with 'Error: Map container not found' in test
      map = L.map('map', {layers: layers, zoomControl: false}).setView([latitude, longitude], zoom);
      L.control.scale().addTo(map);
      L.control.zoom({position: 'bottomright'}).addTo(map);
      console.log('map.controller: creted map');
    } catch (err) {
      console.warn('map.controller: error initializing map: ' + err);
    }

    function loadPois(map) {
      var url = '/api/devices';
      $http({method: 'GET', url: url, timeout: 30000}).then(function successCallback(response) {
        var pois = response.data;
        console.log('Loaded ' + pois.length + ' POIs', pois);
        var markers = [];
        // create POI markers
        pois.forEach(function (poi) {
          var popUpStr = '<b>' + poi.id + ' - ' + poi.info + '</b>';
          if (poi.sensors) {
            for(var i = 0; i < poi.sensors.length; i++) {
              popUpStr += '<br/>' + poi.sensors[i].id + ': ' + poi.sensors[i].value;
            }
          }
          var marker = L.marker([poi.latitude, poi.longitude], {icon: cityhubIcon}).bindPopup(popUpStr);
          markers.push(marker);
        });
        // create layer
        var newLayer = new L.LayerGroup(markers);
        if (map.hasLayer(cityhubLayer)) {
          map.removeLayer(cityhubLayer);
        }
        cityhubLayer = newLayer;
        map.addLayer(cityhubLayer);
        console.log('Added layer with ' + pois.length + ' POIs to map.');
      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        var error = 'loadPois error loading ' + url + '. status=' + response.status + ' data="' + response.data + '"';
        console.warn(error);
        callback(error, undefined);
      });
    }

    function init() {
      loadPois(map);
    }

    if (AUTO_RELOAD_INTERVAL_MS > 0) {
      var reloadPromise = $interval($scope.loadData, AUTO_RELOAD_INTERVAL_MS);
    }

    /**
     * Cancel all active timers
     */
    function destroy() {
      if (reloadPromise) {
        $interval.cancel(reloadPromise);
        reloadPromise = undefined;
      }
    }

    $scope.$on('$destroy', destroy);
    init();
  }
  ]);
