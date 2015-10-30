/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var express = require('express');
var controller = require('./all.controller');

var router = express.Router();

router.get('/:sensorId', controller.getSensors);

module.exports = router;
