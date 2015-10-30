/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var should = require('should');
var app = require('../../app');
var defaultDevices = require('../../config/sensors').getDefaultDevices();
var request = require('supertest');

beforeEach(function(done) {
  console.log('beforeEach Resetting devices to default config...');
  request(app).get('/api/devices/reset').end(function(err, res) {
    done();
  });
});

describe('GET /api/devices', function() {
  it('should respond with JSON devices array', function(done) {
    request(app)
      .get('/api/devices')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.be.instanceof(Array);
        done();
      });
  });
});

describe('GET /api/devices/reset', function() {
  it('should respond with JSON default devices array', function(done) {
    request(app)
      .get('/api/devices/reset')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.be.instanceof(Array);
        done();
      });
  });
});

describe('GET /api/devices/ch1', function() {
  it('should respond with JSON device object', function(done) {
    request(app)
      .get('/api/devices/ch1')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('POST /api/devices/ch1', function() {
  it('should respond with JSON device object', function(done) {
    var device = JSON.parse(JSON.stringify(defaultDevices[0]));
    device.sensors = [];
    request(app)
      .post('/api/devices/ch1')
      .send(device)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('DELETE /api/devices/ch1', function() {
  it('should delete JSON device object', function(done) {
    request(app)
      .delete('/api/devices/ch1')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('GET /api/devices/ch1/Temperature', function() {
  it('should respond with JSON sensor object', function(done) {
    request(app)
      .get('/api/devices/ch1/Temperature')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('POST /api/devices/ch1/Temperature', function() {
  it('should respond with JSON sensor object', function(done) {
    var sensor = defaultDevices[0].sensors[0];
    sensor.value += 1;
    request(app)
      .post('/api/devices/ch1/Temperature')
      .send(sensor)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('DELETE /api/devices/ch1/Temperature', function() {
  it('should deleted JSON sensor object', function(done) {
    request(app)
      .delete('/api/devices/ch1/Temperature')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});
