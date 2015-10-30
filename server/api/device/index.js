/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var express = require('express');
var controller = require('./device.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/reset', controller.index);
router.get('/:deviceId', controller.getDevice);
router.post('/:deviceId', controller.setDevice);
router.delete('/:deviceId', controller.deleteDevice);
router.get('/:deviceId/:sensorId', controller.getSensor);
router.post('/:deviceId/:sensorId', controller.setSensor);
router.post('/:deviceId/:sensorId/increase', controller.increaseSensor);
router.post('/:deviceId/:sensorId/decrease', controller.decreaseSensor);
router.post('/:deviceId/:sensorId/process', controller.process);
router.delete('/:deviceId/:sensorId', controller.deleteSensor);

module.exports = router;
