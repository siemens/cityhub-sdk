/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

angular.module('chSensorsApp', [
  'btford.socket-io',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'cgNotify',
  'mqttService'
])
  .constant('_', _)
  .config(function($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  });
