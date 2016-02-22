/* Copyright 2016 Christine S. MacNeill

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
var bodyparser = require('body-parser');
var immutable = require('seamless-immutable');
var NodeStore = require('./NodeStore.js');
var mdns = require('mdns-js');
var http = require('http');
var Sender = require('../model/Sender.js');
var getResourceName = require('./Util.js').getResourceName;

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
    if (total) res.set('X-Streampunk-Ledger-Total', total.toString());
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

    app.use(function(req, res, next) {
      // TODO enhance this to better supports CORS
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, PUT, POST, HEAD, OPTIONS, DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type, Accept");
      res.header("Access-Control-Max-Age", "3600");

      if (req.method == 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    app.use(bodyparser.json());

    app.get('/', function (req, res) {
      res.json(['x-nmos/']);
    });

    app.get('/x-nmos/', function (req, res) {
      res.json(['node/']);
    });

    app.get('/x-nmos/node/', function (req, res) {
      res.json([ "v1.0/" ]);
    });

    var napi = express();
    // Mount all other methods at this base path
    app.use('/x-nmos/node/v1.0/', napi);

    napi.get('/', function (req, res) {
      res.json([
          "self/",
          "sources/",
          "flows/",
          "devices/",
          "senders/",
          "receivers/"
      ]);
    });

    napi.get('/self/', function (req, res, next) {
      store.getSelf(function (err, self) {
        if (err) next(err);
        else res.json(self);
      });
    });

    // List devices
    napi.get('/devices/', function (req, res, next) {
      store.getDevices(req.query,
          function (err, devices, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(devices);
      });
    });

    // Get a single device
    napi.get('/devices/:id', function (req, res, next) {
      store.getDevice(req.params.id, function (err, device) {
        if (err) next(err);
        else res.json(device);
      });
    });

    // List sources
    napi.get('/sources/', function (req, res, next) {
      store.getSources(req.query,
          function(err, sources, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(sources);
      });
    });

    // Get a single source
    napi.get('/sources/:id', function (req, res, next) {
      store.getSource(req.params.id, function (err, source) {
        if (err) next(err);
        else res.json(source);
      });
    });

    // List flows
    napi.get('/flows/', function (req, res, next) {
      store.getFlows(req.query,
          function (err, flows, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(flows);
      });
    });

    // Get a single flow
    napi.get('/flows/:id', function (req, res, next) {
      store.getFlow(req.params.id, function (err, flow) {
        if (err) next(err);
        else res.json(flow);
      });
    });

    // List senders
    napi.get('/senders/', function (req, res, next) {
      store.getSenders(req.query,
         function(err, senders, pageOf, size, page, total) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, page, size).json(senders);
      });
    });

    // Get a single sender
    napi.get('/senders/:id', function (req, res, next) {
      store.getSender(req.params.id, function (err, sender) {
        if (err) next(err);
        else res.json(sender);
      });
    });

    // List receivers
    napi.get('/receivers/', function (req, res, next) {
      store.getReceivers(req.query,
          function(err, receivers, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(receivers);
      });
    });

    // Get a single receiver
    napi.get('/receivers/:id', function (req, res, next) {
      store.getReceiver(req.params.id, function(err, receiver) {
        if (err) next(err);
        else res.json(receiver);
      });
    });

    napi.put('/receivers/:id/target', function (req, res, next) {
      var updatedSender = Sender.prototype.parse(req.body);
      store.getReceiver(req.params.id, function(err, receiver) {
        if (err) return next(err);
        if (updatedSender.transport !== receiver.transport) {
          return next(NodeStore.prototype.statusError(400,
            "Cannot subscribe a receiver to a sender with different transport types."));
        }
        receiver = receiver
          .set('subscription', { sender_id: updatedSender.id })
          .set('version', Sender.prototype.generateVersion());
        store.putReceiver(receiver, function (e, sndr, str) {
          if (e) return next(e);
          this.setStore(str);
          res.status(202).json(updatedSender);
        }.bind(this));
      }.bind(this));
    }.bind(this));

    app.use(function (err, req, res, next) {
      if (err.status) {
        res.status(err.status).json({
          code: err.status,
          error: (err.message) ? err.message : 'Internal server error. No message available.',
          debug: (err.stack) ? err.stack : 'No stack available.'
        });
      } else {
        res.status(500).json({
          code: 500,
          error: (err.message) ? err.message : 'Internal server error. No message available.',
          debug: (err.stack) ? err.stack : 'No stack available.'
        })
      }
    });

    app.use(function (req, res, next) {
      res.status(404).json({
          code : 404,
          error : `Could not find the requested resource '${req.path}'.`,
          debug : req.path
        });
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
        console.log('Streampunk media ledger node service running at http://%s:%s',
          host, port);
        if (cb) cb();
      };
    });

  //  this.startMDNS();

    return this;
  }

  var browser = null;
  var registrationDetails = null;
  this.startMDNS = function () {
    // mdns.excludeInterface('0.0.0.0');
    browser = mdns.createBrowser('_ips-registration._tcp.local.');
    browser.on('ready', function () {
      console.log('ready for mdns');
      browser.discover();
    });
    browser.on('update', function (data) {
      if (data.query[0].startsWith('_ips-registration._tcp')) {
        registerNode(data.addresses[0], data.port);
      }
    });
  }

  function pushResource(r) {
    var resourceType = r.constructor.name;
    var reqBody = new Buffer(JSON.stringify({
      type : resourceType,
      data : r
    }));
    var req = http.request({
      hostname: regAddress,
      port: regPort,
      path: 'x-ipstudio/registration/v1.0/resource',
      method: POST,
      headers: {
        'Content-Type' : 'application/json',
        'Content-Length' : reqBody.length
      }
    }, function (res) {
      if (res.statusCode >= 300) {
        console.error('Received status code ' + res.statusCode +
          ' when posting ' + resourceType + '.');
      }
      console.log('Posted ' + resourceType + ' with Location ' +
        res.headers.Location + '.');
      res.end();
    });

    req.on('error', (e) => {
     console.error(`Problem with ${resourceType} request: ${e.message}`);
    });

    req.write(reqBody);
    req.end();
  }

  function registerNode(regAddress, regPort) {
    var snap = store;
    registerResource(snap);
    snap.devices.forEach(registerResource);
    snap.sources.forEach(registerResource);
    snap.flows.forEach(registerResource);
    snap.senders.forEach(registerResource);
    snap.receivers.forEach(registerResource);

    function health() {
      setTimeout(function () {
        var req = http.request({
          hostname : reqAddress,
          port : reqPort,
          path : 'x-ipstudio/registration/v1.0/resource/' + store.self.id,
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json'
          }
        }, function (res) {
          console.log("Health check.");
          res.end();
        });
        health();
      },5000);
    }
    req.end();
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
      Number(port) === port &&
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
    return new Error('Port is not a valid value. Must be an integer greater than zero.');
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
