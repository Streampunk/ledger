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
var immutable = require('seamless-immutable');
var bodyparser = require('body-parser');
var Node = require('../model/Node.js');
var Device = require('../model/Device.js');
var Source = require('../model/Source.js');
var Sender = require('../model/Sender.js');
var Receiver = require('../model/Receiver.js');
var Flow = require('../model/Flow.js');
var uuid = require('uuid');
var mdns = require('mdns-js');
var NodeStore = require('./NodeStore.js');

function RegistrationAPI (port, store, serviceName, pri) {
  var app = express();
  var server = null;
  if (!pri || Number(pri) !== pri || pri % 1 !== 0) pri = 100;
  if (!serviceName || typeof serviceName !== 'string') serviceName = 'ledger_reg';

  var nodeHealth = {};
  var mdnsService = null;

  /**
   * Returns the port that this Registration API is configured to use.
   * @return {Number} Port for this node API.
   */
  this.getPort = function () {
    return port;
  }

  /**
   * Replace the [store]{@link NodeStore} set for this API.
   * @param {NodeStore} replacementStore Store to use to replace the current one.
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
   * @return {NodeStore} Store backing this Registration API.
   */
  this.getStore = function () {
    return store;
  }

  /**
   * Initialise the Registration APIs routing table.
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
      res.json(['registration/']);
    });

    app.get('/x-nmos/registration/', function (req, res) {
      res.json([ "v1.0/" ]);
    });

    var rapi = express();
    // Mount all other methods at this base path
    app.use('/x-nmos/registration/v1.0/', rapi);

    rapi.get('/', function (req, res) {
      res.json([
        "resource/",
        "health/"
      ]);
    });

    rapi.post('/resource', function (req, res, next) {
      var input = req.body;
      var value = null;
      try {
        switch (input.type) {
          case 'node':
            value = Node.prototype.parse(input.data);
            break;
          case 'source':
            value = Source.prototype.parse(input.data);
            break;
          case 'sender':
            value = Sender.prototype.parse(input.data);
            break;
          case 'receiver':
            value = Receiver.prototype.parse(input.data);
            break;
          case 'device':
            value = Device.prototype.parse(input.data);
            break;
          case 'flow':
            value = Flow.prototype.parse(input.data);
            break;
          default:
            break;
        }
      } catch (e) {
        e.status = 400;
        return next(e);
      }

      if (value) {
        var fnName = 'put' + input.type.charAt(0).toUpperCase() +
          input.type.substring(1).toLowerCase();
        store[fnName](value, function (err, ro) {
          if (err) return next(err);
            res.status((Object.keys(
              store[input.type + 's']).indexOf(ro.resource.id) < 0) ? 201 : 200);
          this.setStore(ro.store);
          res.set('Location', `/x-nmos/registration/v1.0/resource/${input.type}s/${ro.resource.id}`);
          res.json(ro.resource);
        }.bind(this));
      } else {
        next(NodeStore.prototype.statusError(400,
          `Unable to process resource with given type '${input.type}'.`));
      }
    }.bind(this));

    rapi.delete('/resource/:resourceType/:resourceID', function (req, res, next) {
      var type = 'delete' + req.params.resourceType.slice(0, 1).toUpperCase() +
        req.params.resourceType.slice(1, -1);
      this.getStore().constructor.prototype[type].call(this.getStore(),
          req.params.resourceID, function (e, ro) {
        if (e) return next(e);
        this.setStore(ro.store);
        res.status(204).end();
      }.bind(this));
    }.bind(this));

    // Show a registered resource (for debug use only)
    rapi.get('/resource/:resourceType/:resourceID', function (req, res, next) {
      var type = 'get' + req.params.resourceType.slice(0, 1).toUpperCase() +
        req.params.resourceType.slice(1, -1);
      this.getStore().constructor.prototype[type].call(this.getStore(),
          req.params.resourceID, function (e, item) {
        if (e) return next(e);
        res.json(item);
      }.bind(this));
    }.bind(this));

    rapi.post('/health/nodes/:nodeID', function (req, res, next) {
      if (req.params.nodeID.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) == null) {
        return next(NodeStore.prototype.statusError(400,
          'Given node identifier path parameter on health check is not a valid UUID.'));
      }
      var healthNow = Date.now() / 1000|0;
      nodeHealth[req.params.nodeID] = healthNow;
      res.json({ health : `${healthNow}` });
    });

    // Show a Node's health (for debug use only)
    rapi.get('/health/nodes/:nodeID', function (req, res, next) {
      if (nodeHealth.hasOwnProperty(req.param.nodeID)) {
        res.json({ health : nodeHealth[req.param.nodeID] });
      } else {
        next();
      }
    });

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
   * Start the Registration API server. If the port is already in use, the server
   * will be closed.
   * @param  {RegistrationAPI~trackStatus=} cb Optional callback to track API starting
   *                                           or errors.
   * @return {RegistrationAPI}                 This object with an asynchronous request
   *                                           to start the server.
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
        console.log('Streampunk media ledger registration service running at http://%s:%s',
          host, port);
        if (cb) cb();
      };
    });

    this.startMDNS();

    return this;
  }

  this.startMDNS = function startMDNS() {
    if (serviceName === 'none') return; // For acceptance testing of REST API
    mdnsService = mdns.createAdvertisement(mdns.tcp('nmos-registration'), port, {
      name : serviceName,
      txt : {
        pri : pri
      }
    });

    mdnsService.start();

    if (process.listenerCount('SIGINT') === 0) {
      process.on('SIGINT', function () {
        if (mdnsService) mdnsService.stop();

        setTimeout(function onTimeout() {
          process.exit();
        }, 1000);
      });
    }
  }

  /**
   * Stop the server running the Registration API.
   * @param  {RegistrationAPI~trackStatus=} cb Optional callback that tracks when the
   *                                           server is stopped.
   * @return {RegistrationAPI}                 This object with an asynchronous request
   *                                           to stop the server.
   */
  this.stop = function(cb) {
    var error = '';
    if (server) {
      server.close(function () {
        this.stopMDNS(cb);
        server = null;
      }.bind(this));
    } else {
      this.stopMDNS(function (e) {
        if (e) cb(new Error(e.message +
          ' Server is not set for this Registration API and so cannot be stopped.'));
        else
          cb(new Error('Server is not set for this Registration API and so cannot be stopped.'));
        server = null;
      }.bind(this));
    }

    return this;
  }

  this.stopMDNS = function (cb) {
    if (serviceName === 'none') return cb(); // For REST service acceptance testing
    if (mdnsService) {
      mdnsService.stop();
      mdnsService.networking.stop();
      mdnsService = null;
      if (cb) cb();
    } else {
      if (cb) cb(new Error('MDNS advertisement is not set for this Registration API and so cannot be stopped.'));
    }

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
      typeof store.getNodes === 'function' &&
      typeof store.getNode === 'function' &&
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
      // TODO add more of the required methods ... or drop this check?
  }

  if (!validPort(port))
    return new Error('Port is not a valid value. Must be an integer greater than zero.');
  if (!validStore(store))
    return new Error('Store does not have a sufficient contract.');
  return immutable(this, { prototype : RegistrationAPI.prototype });
}

/**
 * Function called when server has been started or stopped.
 * @callback {RegistrationAPI~trackStatus}
 * @param {Error=} Set if an error occurred when starting or stopping the server.
 */

module.exports = RegistrationAPI;
