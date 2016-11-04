/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';
/* global describe, beforeEach, expect, it, spyOn, L*/

describe('Controller: MapCtrl', function() {

  // load the controller's module
  beforeEach(
    module('chSensorsApp', function($provide) {
    })
  );
  beforeEach(module('socketMock'));

  var MainCtrl;
  var scope;
  var $httpBackend;

  // Initialize the controller and a mock scope
  // $scope, $http, $location, $interval
  beforeEach(inject(function(_$httpBackend_, $controller, $rootScope) {
    // mock leaflet
    spyOn(L, 'map').andReturn({setView: function() {return this;}, hasLayer: function() {return true;}, addLayer: function() {}, removeLayer: function() {}});
    spyOn(L.control, 'scale').andReturn({addTo: function() {}});

    $httpBackend = _$httpBackend_;
    $httpBackend.whenGET(/\/api\/device.*/).respond(200, []);

    scope = $rootScope.$new();
    MainCtrl = $controller('MapCtrl', {
      $scope: scope
    });

  }));

  describe('map test', function() {

    it('dummy test', function() {
      $httpBackend.flush();
      expect(true).toBe(true);
    });

  });
});
