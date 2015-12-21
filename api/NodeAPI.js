/* Copyright 2015 Christine S. MacNeill

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by appli cable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var express = require('express');
var immutable = require('seamless-immutable');
var NodeStore = require('./NodeStore.js');

/**
 * Create an instance of the Node API.
 * @constructor
 * @param {number}    port  Port number of which to run the API. Expected to be
 *                          an integer.
 * @param {NodeStore} store Store containing access to the details of the node.
 * @return {(NodeAPI|Error)}  Creates a NodeAPI or returns an error.
 */
function NodeAPI (port, store) {
  var app = express();
  var server = null;

  function setPagingHeaders(res, total, pageOf, pages, size) {
    if (pageOf) res.set('X-Streampunk-Ledger-PageOf', pageOf.toString());
    if (size) res.set('X-Streampunk-Ledger-Size', size.toString());
    if (pages) res.set('X-Streampunk-Ledger-Pages', pages.toString());
    if (total) res.set('X-Streampink-Ledger-Total', total.toString());
    return res;
  }

  /**
   * Replace the [store]{@link NodeStore} set for this API.
   * @param {NodeAPI} replacementStore Store to use to replace the current one.
   * @return {(Error|null)}  Error if a problem, otherwise null for success.
   */
  this.setStore = function (replacementStore) {
    if (!validStore(replacementStore))
      return new Error('The given replacement store is not valid.');
    store = replacementStore;
    return null;
  }

  /**
   * Returns the [store]{@link NodeStore} used to produce results.
   * @return {NodeStore} Store backing this Node API.
   */
  this.getStore = function () {
    return store;
  }

  /**
   * Returns the port that this Node API is configured to use.
   * @return {Number} Port for this node API.
   */
  this.getPort = function () {
    return port;
  }

  /**
   * Initialise the Node APIs routing table.
   * @return {NodeAPI} Returns this object with the routing table initialised and
   *                   ready to {@link NodeAPI#start}.
   */
  this.init = function() {
    app.get('/x-ipstudio/node/', function (req, res) {
      res.json([ "v1.0" ]);
    });

    // Mount all other methods at this base path
    app.use('/x-ipstudio/node/v1.0/', function (req, res, next) {
      next();
    }

    app.get('/', function (req, res) {
      res.json([
          "self/",
          "sources/",
          "flows/",
          "devices/",
          "senders/",
          "receivers/"
      ]);
    });

    app.get('/self/', function (req, res, next) {
      state.getSelf(function (err, self) {
        if (err) next(err);
        else res.json(self);
      });
    });

    // List devices
    app.get('/devices/', function (req, res, next) {
      store.getDevices(req.query.skip, req.query.limit,
          function (err, devices, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(devices);
      });
    });

    // Get a single device
    app.get('/devices/:id', function (req, res, next) {
      store.getDevice(req.param.id, function (err, device) {
        if (err) next(err);
        else res.json(device);
      });
    });

    // List sources
    app.get('/sources/', function (req, res, next) {
      store.getSources(req.query.skip, req.query.limit,
          function(err, sources, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(sources);
      });
    });

    // Get a single source
    app.get('/sources/:id', function (req, res, next) {
      store.getSource(req.param.id, function (err, source) {
        if (err) next(err);
        else res.json(source);
      });
    });

    // List flows
    app.get('/flows/', function (req, res, next) {
      store.getFlows(req.query.skip, req.query.limit,
          function (err, flows, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(flows);
      });
    });

    // Get a single flow
    app.get('/flows/:id', function (req, res, next) {
      store.getFlow(req.param.id, function (err, flow) {
        if (err) next(err);
        else res.json(flow);
      });
    });

    // List senders
    app.get('/senders/', function (req, res, next) {
      store.getSenders(req.query.skip, req.query.limit,
         function(err, senders, pageOf, size, page, total) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(senders);
      });
    });

    // Get a single sender
    app.get('/senders/:id', function (req, res, next) {
      store.getSender(req.param.id, function (err, sender) {
        if (err) next(err);
        else res.json(sender);
      });
    });

    // List receivers
    app.get('/receivers/', function (req, res, next) {
      store.getReceivers(req.query.skip, req.query.limit,
          function(err, receivers, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(receivers);
      });
    });

    // Get a single receiver
    app.get('/receivers/:id', function (req, res, next) {
      store.getReceiver(req.param.id, function(err, receiver) {
        if (err) next(err);
        else res.json(receiver);
      });
    });

    app.use(function (err, req, res, next) {
      if (err) {
        var status = err.status ? err.status : 404;
        res.status(status).json({
          status: status,
          error: err.message,
          debug: err.stack
        });
      }
      else {
        res.status(404).json({
          status : 404,
          error : 'Could not find the requested resource.',
          debug : req.path
        });
      }
    });

    return this;
  }

  /**
   * Start the Node API server. If the port is already in use, the server
   * will be closed.
   * @param  {NodeAPI~trackStatus=} cb Optional callback to track API starting
   *                                   or errors.
   * @return {NodeAPI}                 This object with an asynchronous request
   *                                   to start the server.
   */
  this.start = function (cb) {
    server = app.listen(port, function (e) {
      var host = server.address().address;
      var port = server.address().port;
      if (e) {
        if (e.code == 'EADDRINUSE') {
          console.log('Address http://%s:%s already in use.', host, port);
          server.close();
        };
        if (cb) cb(e);
      } else {
        console.log('Streampunk media ledger service running at http://%s:%s',
          host, port);
        if (cb) cb();
      };
    });

    return this;
  }

  /**
   * Stop the server running the Node API.
   * @param  {NodeAPI~trackStatus=} cb Optional callback that tracks when the
   *                                   server is stopped.
   * @return {NodeAPI}                 This object with an asynchronous request
   *                                   to stop the server.
   */
  this.stop = function(cb) {
    if (server) server.close(cb);
    else {
      if (cb) cb(new Error('Server is not set for this Node API and so cannot be stopped.'));
    }
    server = null;
    return this;
  }

  // Check the validity of a port
  function validPort(port) {
    return port &&
      Number(port) === port && 0
      port % 1 === 0 &&
      port > 0;
  }

  // Check that a store has a sufficient contract for this API
  function validStore(store) {
    return store &&
      typeof store.getSelf === 'function' &&
      typeof store.getDevices === 'function' &&
      typeof store.getDevice === 'function' &&
      typeof store.getSources === 'function' &&
      typeof store.getSource === 'function' &&
      typeof store.getSenders === 'function' &&
      typeof store.getSender === 'function' &&
      typeof store.getReceivers === 'function' &&
      typeof store.getReceiver === 'function' &&
      typeof store.getFlows === 'function' &&
      typeof store.getFlow === 'function';
  }

  if (!validPort(port))
    return new Error('Port is not a valid value. Must be an interger greater than zero.');
  if (!validStore(store))
    return new Error('Store does not have a sufficient contract.');
  return immutable(this, { prototype : NodeAPI.prototype });
}

/**
 * Function called when server has been started or stopped.
 * @callback {NodeAPI~trackStatus}
 * @param {Error=} Set if an error occurred when starting or stopping the server.
 */

module.exports = NodeAPI;
