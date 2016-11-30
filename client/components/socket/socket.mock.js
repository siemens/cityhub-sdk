/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

angular.module('socketMock', [])
  .factory('socket', function() {
    return {
      socket: {
        connect: function() {},
        on: function() {},
        emit: function() {},
        receive: function() {}
      },

      syncConnection: function() {},
      unsyncConnection: function() {},

      syncUpdates: function() {},
      unsyncUpdates: function() {}
    };
  });
