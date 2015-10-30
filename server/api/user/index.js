/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var express = require('express');
var controller = require('./user.controller.js');

var router = express.Router();

router.get('/', controller.index);
router.get('/reset', controller.index);
router.get('/:userId', controller.getUser);
router.post('/:userId', controller.setUser);
router.delete('/:userId', controller.deleteUser);

module.exports = router;
