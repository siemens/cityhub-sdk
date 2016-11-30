/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
/* global io */
'use strict';

angular.module('chSensorsApp')
  .factory('socket', function(socketFactory) {

    // socket.io now auto-configures its connection when we omit a connection url
    var ioSocket = io('', {
      // Send auth token on connection, you will need to DI the Auth service above
      // 'query': 'token=' + Auth.getToken()
      path: '/socket.io-client'
    });

    var socket = socketFactory({
      ioSocket: ioSocket
    });

    /**
     * Helper method for copying angular annotations (improves UI refresh upon updates)
     * @param dst
     * @param src
     */
    function copyAngularAnnotations(dst, src) {
      for (var key in src) {
        var srcVal = src[key];
        var dstVal = dst[key];
        if (Array.isArray(srcVal) && Array.isArray(dstVal)) {
          for (var i = 0; i < srcVal.length; i++) {
            // check identity through id property
            var srcId = srcVal[i].id;
            if (srcId) {
              var indexDst = _.findIndex(dstVal, {id: srcId});
              if (indexDst !== -1) {
                copyAngularAnnotations(dstVal[indexDst], srcVal[i]);
              }
            }
          }
        }
        if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
          // copy angular $$hashKey fields
          //console.log('copyAngularAnnotations ' + key + '=' + srcVal);
          dst[key] = srcVal;
        }
      }
    }

    var isConnected = false;
    var isLoading = false;

    return {
      socket: socket,

      isConnected: function() {
        return isConnected;
      },

      isLoading: function() {
        return isLoading;
      },

      /**
       * Register listeners to socket.io connect/disconnect
       *
       * @param {Function} cb(event)
       */
      syncConnection: function(cb) {
        cb = cb || angular.noop;
        socket.on('connect', function() {
          //console.log('socket.on connect');
          var ev = 'connect';
          isConnected = true;
          cb(ev);
        });
        socket.on('disconnect', function() {
          cb = cb || angular.noop;
          //console.log('socket.on disconnect');
          isConnected = false;
          isLoading = false;
          var ev = 'disconnect';
          cb(ev);
        });
      },

      /**
       * Removes listeners for socket connection
       *
       * @param cb
       */
      unsyncConnection: function(cb) {
        socket.removeListener('connect', cb);
        socket.removeListener('disconnect', cb);
      },

      /**
       * Register listeners to sync an array with updates on a model
       *
       * Takes the array we want to sync, the model name that socket updates are sent from,
       * and an optional callback function after new items are updated.
       *
       * @param {String} modelName
       * @param {Array} array
       * @param {Function} cb
       */
      syncUpdates: function(modelName, array, cb) {
        //console.log('syncUpdates(' + modelName + ', ', array, ')');
        cb = cb || angular.noop;

        /**
         * Syncs item creation/updates on 'model:save'
         */
        socket.on(modelName + ':save', function(item) {
          var oldItemIndex = _.findIndex(array, {id: item.id});
          var event;

          // replace oldItem if it exists
          // otherwise just add item to the collection
          if (oldItemIndex >= 0) {
            // replace old item (and copy angular annotations for optimizing UI updates)
            copyAngularAnnotations(item, array[oldItemIndex]);
            array[oldItemIndex] = item;
            event = 'updated';
          } else {
            // add new item
            array.push(item);
            event = 'created';
          }

          cb(event, item, array);
        });

        /**
         * Syncs removed items on 'model:remove'
         */
        socket.on(modelName + ':remove', function(item) {
          var event = 'deleted';
          _.remove(array, {id: item.id});
          cb(event, item, array);
        });
      },

      /**
       * Removes listeners for a models updates on the socket
       *
       * @param modelName
       */
      unsyncUpdates: function(modelName) {
        socket.removeAllListeners(modelName + ':save');
        socket.removeAllListeners(modelName + ':remove');
      }
    };
  });
