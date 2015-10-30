/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

angular.module('chSensorsApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('rest', {
        url: '/rest',
        templateUrl: 'app/rest/rest.html',
        controller: 'RestCtrl'
      });
  });
