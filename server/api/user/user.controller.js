/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var _ = require('lodash');
var users = require('../../config/users').getUsers();
var userSocket = require('./user.socket.js');

// Get list of users
exports.index = function(req, res) {
  console.log('index', req.path);
  if (req.path === '/reset') {
    // reset users to the default value
    console.log('Resetting to default configuration...');
    users = require('../../config/users').setUsersToDefault();
    // notify new config through websocket
    userSocket.onUserChange();
  }
  res.json(users);
};

// Get user
exports.getUser = function(req, res) {
  var userId = req.params.userId;
  var userIndex = _.findIndex(users, {id: userId});
  if (userIndex === -1) {
    return res.status(404).send('user not found');
  }
  var user = users[userIndex];
  res.json(user);
};

// Set user
exports.setUser = function(req, res) {
  var userId = req.params.userId;
  var uploadedUser = req.body;
  //console.log('setUser ' + userId, uploadedUser);
  var userIndex = _.findIndex(users, {id: userId});
  if (userIndex === -1) {
    return res.status(404).send('user not found');
  }
  var user = users[userIndex];
  _.merge(user, uploadedUser);

  // notify modified user ID through websocket
  userSocket.onUserChange(user);

  res.json(user);
};

// Delete user
exports.deleteUser = function(req, res) {
  var userId = req.params.userId;
  var removedUsers = _.remove(users, {id: userId});
  if (removedUsers.length === 0) {
    return res.status(404).send();
  }

  // notify deleted user ID through websocket
  var delUser = removedUsers[0];
  userSocket.onUserDelete(delUser);

  return res.json(removedUsers);
};


