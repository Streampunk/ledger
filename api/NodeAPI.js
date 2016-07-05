/* Copyright 2016 Streampunk Media Ltd.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
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
var Promise = require('promise');
var assert = require('assert');

var knownResourceTypes = ['device', 'flow', 'source', 'receiver', 'sender'];
  // self is treated as a special case

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
  var healthcheck = null;
  var storePromise = Promise.resolve(store);
  var sdps = {};

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
   * @deprecated Use putResource, getResource and deleteResource etc.
   */
  this.setStore = function (replacementStore) {
    if (!validStore(replacementStore))
      return new Error('The given replacement store is not valid.');
    store = replacementStore;
    storePromise = Promise.resolve(store);
    return null;
  }

  /**
   * Returns the [store]{@link NodeStore} used to produce results.
   * @return {NodeStore} Store backing this Node API.
   * @deprecated Use putResource, getResource and deleteResource etc.
   */
  this.getStore = function () {
    return store;
  }

  function nameToCamel (n) {
    if (n.toLowerCase().endsWith('s')) n = n.slice(0, -1);
    return n.length > 0 ? n.substring(0, 1).toUpperCase() +
      n.substring(1).toLowerCase() : '';
  }

  /**
   * Create or update a resource (device, source, flow, sender, receiver)
   * in the underlying [store]{@link NodeStore} of this node API. Calls to this
   * methods are serialized into a chain of promises.
   *
   * Note that the underlying store may preform referential integrity checks on
   * the resources and so the order in which they are created is important.
   * @param  {[type]}   resource Resource to be created or updated
   * @param  {Function=} cb      Optional callback - node style - with error as the
   *                             first argument and the put resource as the second.
   * @return {Promise}           When no callback is provided, a promise that
   *                             resolves to the put resource.
   */
  this.putResource = function (resource, cb) {
    var nextState = storePromise.then(function (store) {
      var putFn = Promise.denodeify(store['put' + resource.constructor.name]);
      return putFn.call(store, resource);
    });
    storePromise = nextState.then(function (ro) {
      store = ro.store;
      pushResource(ro.resource);
      return store;
    }, function (e) { console.error(e); });
    return nextState.then(function (ro) { return ro.resource; }).nodeify(cb);
  }

  /**
   * Retrieve the value of a resource (device, source, flow, sender, receiver)
   * in the underlying [store]{@link NodeStore} of this node API. Calls to this
   * method resolve at the end of the current chain of serialized store-changing promises.
   * @param  {string}    id   UUID identifier of the resource to be retrieved.
   * @param  {string=}   type Optional type name for the resource to be retrieved.
   *                          Providing a type name is more efficient.
   * @param  {Function=} cb   Optional callback - node style - with error as the
   *                          first argument and the requested resource as the second.
   * @return {Promise}        When no callback is provided, a promise that resolves
   *                          to the requested resource.
   */
  this.getResource = function (id, type, cb) {
    return storePromise.then(function (store) {
      if (type && typeof type === 'string' &&
           knownResourceTypes.some(function (x) {
             return type.toLowerCase() === x }) ) {
        var getFn = Promise.denodeify(store['get' + nameToCamel(type)]);
        return getFn.call(store, id);
      } else {
        var wobble = Promise.all(knownResourceTypes.map(function (x) {
          return Promise.denodeify(store['get' + nameToCamel(x)]).call(store, id)
            .then(function (s) { return s; }, function (e) { return null; }); }));
        return wobble.then(function (a) {
          var result = a.find(function (x) { return x !== null; });
          if (result) return result;
          else throw new Error("Could not find a resource with the given identifier.");
        });
      }
    }).nodeify(cb);
  }

  /**
   * Retrieve a list of the requested type of resources (device, source, flow,
   * sender, receiver) in the underlying [store]{@link NodeStore} of this node API.
   * Calls to this method resolve at the end of the current chain of serialized
   * store-changing promises.
   * @param  {string}    type Name of the type of resource to retrieve.
   * @param  {Function=} cb   Optional callback - node style - with any error
   *                          as the first argument and the resulting list of
   *                          resources as the second.
   * @return {Promise}        When no callback is provided, a promise that resolves
   *                          to the list of resources.
   */
  this.getResources = function (type, cb) {
    return storePromise.then(function (store) {
      return new Promise(function (resolve, reject) {
        if (type && typeof type === 'string' &&
             knownResourceTypes.some(function (x) {
               return type.toLowerCase() === x ||
                 type.slice(0, -1).toLowerCase() === x; }) ) {
          var getFn = Promise.denodeify(store['get' + nameToCamel(type) + 's']);
          resolve(getFn.call(store));
        } else { reject(new Error('Type is not a string or a known type.')) };
      });
    }).nodeify(cb);
  }

  /**
   * Delete a resource (device, source, flow, sender, receiver) in the underlying
   * [store]{@link NodeStore} of this node API. Calls to this method resolve at
   * the end of the current chain of serialized store-changing promises.
   * @param  {string}    id   UUID identifier of the resource to be deleted.
   * @param  {string}    type Type of the resource to delete. Unlike with
   *                          getResource, the type must be provided.
   * @param  {Function=} cb   Optional callback - node style - with any error
   *                          as the first argument and the identifier of the
   *                          deleted resource as the second.
   * @return {Promise}        When no callback is provided, a promise that resolves
   *                          to the identifier of the resource being deleted.
   */
  this.deleteResource = function (id, type, cb) {
    var nextState = storePromise.then(function (store) {
      return new Promise(function (resolve, reject) {
        if (type && typeof type === 'string' &&
             knownResourceTypes.some(function (x) {
               return type.toLowerCase() === x; }) ) {
          var deleteFn = Promise.denodeify(store['delete' + nameToCamel(type)]);
          resolve(deleteFn.call(store, id));
        } else {
          reject(new Error('Type is not a string or a known type.')); };
      });
    });
    storePromise = nextState.then(function (ro) {
      store = ro.store;
      registerDelete(ro.id, type);
      return store;
    });
    return nextState.then(function (ro) { return ro.id; }).nodeify(cb);
  }

  /**
   * Retrieve the details of the node represented by this node API. Calls to this
   * method resolve at the end of the current chain of serialized store-changing
   * promises.
   * @param  {Function=} cb Opitonal callback - node style - with any error as the
   *                        first argument and details of the node as the second.
   * @return {Promise}      When no callback is provided, a promise that resolves
   *                        to the details of the node.
   */
  this.getSelf = function (cb) {
    return storePromise.then(function (store) {
      var selfFn = Promise.denodeify(store.getSelf);
      return selfFn.call(store);
    }).nodeify(cb);
  }

  /**
   * Update the details of the <em>self</em> node representd by this node API. Calls to this
   * method resolve at the end of the current chain of serialized store-changing
   * promises. The identifier of the node cannot be changed.
   * @param  {Node}      newSelf Updated details for the self node.
   * @param  {Function=} cb      Optional callback - node style - with any error
   *                             as the first argument and details of the updated
   *                             self node as the second.
   * @return {Promise}           When no callback is provided, a promise that
   *                             resolves to the update self node.
   */
  this.putSelf = function (newSelf, cb) {
    var nextState = storePromise.then(function (store) {
      var selfFn = Promise.denodeify(store.putSelf);
      return selfFn.call(store, newSelf);
    });
    storePromise = nextState.then(function (ro) {
      store = ro.store;
      return store;
    });
    return nextState.then(function (ro) { return ro.resource; }).nodeify(cb);
  }

  /**
   * Returns the port that this Node API is configured to use.
   * @return {Number} Port for this node API.
   */
  this.getPort = function () {
    return port;
  }

  /**
   * Put an SDP store into the local cache, as served from the /sdp resource.
   * Existing SDP files with the same identifier will be overwritten. Identifiers
   * are assumed to be the associated NMOS identifier.
   * @param  {string} id  UUID of the sender associated with this SDP file.
   * @param  {string} sdp String representation of the SDP file to cache.
   */
  this.putSDP = function (id, sdp) {
    sdps[id] = sdp;
  }

  /**
   * Delete the SDP associated with the given source identifier from the internal
   * cache.
   * @param  {string}  id UUID of the sender associated with this SDP file.
   * @return {Boolean}    Whether or not the sender was successfully deleted.
   */
  this.deleteSDP = function (id) {
    return sdps.hasOwnProperty(id) && delete sdps[id];
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

    app.get('/sdp/:id.sdp', function (req, res, next) {
      var sdp = sdps[req.params.id];
      if (!sdp) return next();
      res.set('Content-Type', 'application/sdp');
      res.send(new Buffer(sdp));
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
      if (req.body.id === undefined) {
        this.getResource(req.params.id, 'receiver', function (err, receiver) {
          if (err) return next(err);
          receiver = receiver
            .set('subscription', { sender_id : null })
            .set('version', Sender.prototype.generateVersion());
          this.putResource(receiver, function (e, ro) {
            if (e) return next(e);
            return res.status(202).json(req.body);
          }.bind(this));
        }.bind(this));
        return;
      };
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
        this.putResource(receiver, function (e, ro) {
          if (e) return next(e);
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

    startMDNS();

    return this;
  }

  var browser = null;
  var mdnsService = null;
  var regConnected = false;
  var regAddress = null;
  var regPort = null;
  var candidates = [];
  function startMDNS() {
    // mdns.excludeInterface('0.0.0.0');

    console.log('Starting MDNS');
    mdnsService = mdns.createAdvertisement(mdns.tcp('nmos-node'), port, {
      name : 'ledger',
      txt : { }
    });
    if (!browser) {
      browser = mdns.createBrowser('_nmos-registration._tcp.local.');
      browser.on('ready', function () {
        console.log('ready for mdns');
        candidates = [];
        browser.discover();
      });
    } else { // Strange behaviour where ready event is not called on reset
      browser = mdns.createBrowser('_nmos-registration._tcp.local.');
      setTimeout(() => { candidates = []; browser.discover(); console.log("DISCOVER"); }, 5000);
    }
    var selectionTimer = null;
    browser.on('update', function (data) {
      if (regConnected) return;
      if (data.fullname && data.fullname.indexOf('_nmos-registration._tcp') >= 0) {
        console.log("Found a registration service.", data.fullname, data.txt.length > 0 ? data.txt[0] : "");
        candidates.push(data);
        if (!selectionTimer) selectionTimer = setTimeout(function () {
          selectCandidate(candidates); }, 1000);
        }
    });
    browser.on('error', console.error);
    function selectCandidate(candidates) {
      function extractPri(x) {
        var match = x.txt[0].match(/pri=([0-9]+)/);
        if (match) return +match[1];
        else return NaN;
      }
      if (candidates.length > 0) {
        var selected = candidates.sort(function (x, y) {
          return extractPri(x) > extractPri(y);
        })[0];
        console.log(`Selected registration service at http://${selected.addresses[0]}:${selected.port} ` +
          `with priority ${extractPri(selected)}.`);
        regConnected = true;
        regAddress = selected.addresses[0];
        regPort = selected.port;
        storePromise.then(function (s) {
          registerSelf();
          s.getDevices(function (e, ds) { ds.forEach(function (d) {
            // don't push senders and receivers ... bootstrap issue
            pushResource(d.set("senders", []).set("receivers", []));
          }); });
          s.getSources(function (e, ss) { ss.forEach(pushResource); });
          s.getFlows(function (e, fs) { fs.forEach(pushResource); });
          s.getSenders(function (e, ss) { ss.forEach(pushResource); });
          s.getReceivers(function (e, rs) { rs.forEach(pushResource); });
          return s;
        });
      }
      selectionTimer = null;
    }
  }

  function pushResource (r) {
    if (!regConnected) return;
    var resourceType = r.constructor.name.toLowerCase();
    var reqBody = JSON.stringify({
      type : resourceType,
      data : r
    });
    var req = http.request({
      hostname: regAddress,
      port: regPort,
      path: '/x-nmos/registration/v1.0/resource',
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Content-Length' : reqBody.length
      }
    }, function (res) {
      // console.log('PUSHED response', res.statusCode);
      if (res.statusCode >= 300) {
        console.error(`Received status code ${res.statusCode} when pushing ${resourceType}.`);
        res.setEncoding('utf8');
        res.on('data', function (errBody) {
          console.error(`Error message body: ${errBody}`);
          resetMDNS();
        });
      } else {
        res.on('error', function (e) {
          console.error(`Error during push of ${resourceType}: ${e}`);
          resetMDNS();
        });
        // res.setEncoding('utf8'); res.on('data', console.log);
        res.on('end', function () {
          console.log(`Pushed ${resourceType} and received Location ${res.headers.location}.`);
        });
      }
    });

    req.on('error', (e) => {
      console.error(`Problem with ${resourceType} request: ${e.message}`);
      resetMDNS();
    });

    req.write(reqBody);
    req.end();
  }

  function registerDelete (rid, resourceType) {
    if (!regConnected) return;
    var resourceType = resourceType.toLowerCase();
    var req = http.request({
      hostname: regAddress,
      port : regPort,
      path : `/x-nmos/registration/v1.0/resource/${resourceType}s/${rid}`,
      method : 'DELETE'
    }, function (res) {
      if (res.statusCode !== 204)
        console.error(`Failed to delete ${resourceType} with id ${rid}.`);
      res.on('error', function (e) {
        console.error(`Response error when deleting registered resournce: ${e}`);
        resetMDNS();
      })
    });

    req.on('error', function (e) {
      console.error(`Request error when deleting registered resource: ${e}`);
      resetMDNS();
    });
    req.end();
  }

  function registerSelf() {
    // Register node
    var payload = JSON.stringify({
      type: "node",
      data: store.self
    });
    var req = http.request({
      hostname : regAddress,
      port : regPort,
      path : '/x-nmos/registration/v1.0/resource',
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Content-Length' : payload.length
      }
    }, function(res) {
      if (res.statusCode == 201) {
        console.log(`NMOS node registered with http://${regAddress}:${regPort}`);
        // Start health check ticker
        healthcheck = setInterval(function() {
          var req = http.request({
            hostname : regAddress,
            port : regPort,
            path : '/x-nmos/registration/v1.0/health/nodes/' + store.self.id,
            method: 'POST'
          }, function(res) {
            if (res.statusCode != 200)
              console.log(`Unexpected health check response ${res.statusCode}.`);
            res.on('error', function (err) {
              console.error(`Error with healthcheck response from http://${regAddress}:${regPort}: ${err}`);
              resetMDNS();
            });
            res.setEncoding('utf8');
            res.on('data', console.log);
          });
          req.on('error', function (err) {
            console.error(`Error with healthcheck request to http://${regAddress}:${regPort}: ${err}`);
            resetMDNS();
          });
          req.end();
        }
        ,5000);
      } else {
        console.error(`Error registering node with http://${regAddress}:${regPort} with status ${res.statusCode}: ${err}`);
        res.setEncoding('utf8');
        res.on('data', console.error);
        resetMDNS();
      }
    });
    req.write(payload);
    req.on('error', function (err) {
      console.error(`Error sending node registration to http://${regAddress}:${regPort}: ${err}`);
      resetMDNS();
    });
    req.end();
  }

  function resetMDNS() {
    console.log("Resetting NodeAPI MDNS registration services.");
    clearInterval(healthcheck);
    if (browser) browser.stop();
    setTimeout(function () {
      regConnected = false;
      startMDNS();
    }, 5000);
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
    if (browser) {
      browser.stop();
      browser = null;
    }
    if (mdnsService) {
      mdnsService.stop();
      mdnsService.networking.stop();
      mdnsService = null;
    }
    if (healthcheck) clearInterval(healthcheck);
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
