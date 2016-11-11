/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
/**
 * Express configuration
 */
'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');

module.exports = function(app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());

  if ('production' === env) {
    // production-only config
  } else if ('development' === env || 'test' === env) {
    // development-only config
    app.use(require('connect-livereload')());
  }

  app.use(express.static(path.join(config.root, '.tmp')));
  app.use(express.static(path.join(config.root, 'client')));
  app.set('appPath', path.join(config.root, 'client'));
  app.use(morgan('dev'));
  app.use(errorHandler()); // Error handler - has to be last
};
