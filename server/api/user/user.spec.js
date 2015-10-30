/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var should = require('should');
var app = require('../../app');
var defaultUsers = require('../../config/users').getDefaultUsers();
var request = require('supertest');

beforeEach(function(done) {
  console.log('beforeEach Resetting users  to default config...');
  request(app).get('/api/users/reset').end(function(err, res) {
    done();
  });
});

describe('GET /api/users', function() {
  it('should respond with JSON users array', function(done) {
    request(app)
      .get('/api/users')
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

describe('GET /api/users/reset', function() {
  it('should respond with JSON default users array', function(done) {
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

describe('GET /api/users/user1', function() {
  it('should respond with JSON user object', function(done) {
    request(app)
      .get('/api/users/user1')
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

describe('POST /api/users/user1', function() {
  it('should respond with JSON user object', function(done) {
    var user = JSON.parse(JSON.stringify(defaultUsers[0]));
    request(app)
      .post('/api/users/user1')
      .send(user)
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

describe('DELETE /api/users/user1', function() {
  it('should delete JSON user object', function(done) {
    request(app)
      .delete('/api/users/user1')
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

