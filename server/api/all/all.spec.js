/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

beforeEach(function(done) {
  console.log('beforeEach Resetting devices to default config...');
  request(app).get('/api/devices/reset').end(function(err, res) {
    done();
  });
});

describe('GET /api/all/availableParkingSpaces', function() {
  it('should respond with JSON devices availableParkingSpaces array', function(done) {
    request(app)
      .get('/api/all/AvailableParkingSpaces')
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

