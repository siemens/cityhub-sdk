/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

describe('Controller: MainCtrl', function() {

  // load the controller's module
  beforeEach(module('chSensorsApp'));
  beforeEach(module('socketMock'));

  var MainCtrl;
  var scope;
  var $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function(_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/devices')
      .respond([
      {index: 1, name: 'Temperature', info: 'Temperature sensor, -50 - +60 Celsius', type: 'float', value: 0.0, minValue: -50.0, maxValue: 60.0},
      {index: 2, name: 'Humidity', info: 'Atmospheric relative humidity sensor, 10 - 95% RH', type: 'float', value: 0.0, minValue: 10.0, maxValue: 95.0},
      {index: 3, name: 'UVB', info: 'Ultraviolet light sensor that responds primarily to UVB radiation, 290-320 nm', type: 'float', value: 0.0, minValue: 290.0, maxValue: 320.0},
      {index: 4, name: 'AmbientNoise', info: 'Ambient noise sensor in Decibels 0-200 dBA', type: 'float', value: 0.0, minValue: 0.0, maxValue: 200.0},
      {index: 5, name: 'CarbonDioxide', info: 'Carbon Dioxide Sensor, 0-2000ppm', type: 'integer', value: 0, minValue: 0, maxValue: 2000},
      {index: 6, name: 'Proximity', info: 'Proximity sensor based e.g. on ultra-sound sensor, 0-800cm', type: 'integer', value: 0, minValue: 0, maxValue: 800}
      ]);
    $httpBackend.expectGET('/api/users')
      .respond([{id: 'user1', email: 'user1@mail.com', password: 'user1.pass', info: 'test user'},
        {id: 'user2', email: 'user2@mail.com', password: 'user2.pass', info: 'test user'},
        {id: 'user3', email: 'user3@mail.com', password: 'user3.pass', info: 'test user'},
        {id: 'user4', email: 'user4@mail.com', password: 'user4.pass', info: 'test user'},
        {id: 'user5', email: 'user5@mail.com', password: 'user5.pass', info: 'test user'}]);

    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of sensors to the scope', function() {
    $httpBackend.flush();
    expect(scope.devices.length).toBe(6);
  });
});
