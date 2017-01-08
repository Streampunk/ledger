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

// QueryAPI implementation

var express = require('express');
var immutable = require('seamless-immutable');
var NodeStore = require('./NodeStore.js');
var mdns = require('mdns-js');
var bodyparser = require('body-parser');
var uuid = require('uuid');
var WebSocketServer = require('ws').Server;
var os = require('os');
var url = require('url');
const EventEmitter = require('events');
var util = require('util');

var pathEnum = ["/nodes", "/devices", "/sources", "/flows", "/senders", "/receivers"];
var firstExtNetIf = require('./Util.js').getFirstExternalNetworkInterface().address;

function QueryAPI (port, storeFn, serviceName, pri, modifyEvents, iface) {
  EventEmitter.call(this);
  var app = express();
  var server = null;
  var wss = null;
  var mdnsService = null;
  var webSockets = {};
  var wsFilter = {};
  var instanceUUID = uuid.v4();
  if (!pri || Number(pri) !== pri || pri % 1 !== 0) pri = 100;
  if (!serviceName || typeof serviceName !== 'string') serviceName = 'ledger_query';
  var api = this;

  if (modifyEvents && typeof modifyEvents === 'object' &&
       modifyEvents.on && typeof modifyEvents.on === 'function') { // Pass it on
    modifyEvents.on('modify', function (ev) {
      api.emit('modify', ev);
    });
  };
  if (!iface) iface = '0.0.0.0';
  if (iface !== '0.0.0.0') firstExtNetIf = iface;

  function setPagingHeaders(res, total, pageOf, pages, size) {
    if (pageOf) res.set('X-Streampunk-Ledger-PageOf', pageOf.toString());
    if (size) res.set('X-Streampunk-Ledger-Size', size.toString());
    if (pages) res.set('X-Streampunk-Ledger-Pages', pages.toString());
    if (total) res.set('X-Streampunk-Ledger-Total', total.toString());
    return res;
  }

  /**
   * Returns the port that this Query API is configured to use.
   * @return {Number} Port for this node API.
   */
  this.getPort = function () {
    return port;
  }

  /**
   * Initialise the Query APIs routing table.
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
      res.json(['query/']);
    });

    app.get('/x-nmos/query/', function (req, res) {
      res.json([ "v1.0/" ]);
    });

    var qapi = express();
    // Mount all other methods at this base path
    app.use('/x-nmos/query/v1.0/', qapi);

    qapi.get('/', function (req, res) {
      res.json([
        "subscriptions/",
        "flows/",
        "sources/",
        "nodes/",
        "devices/",
        "senders/",
        "receivers/"
      ]);
    });

    // List nodes
    qapi.get('/nodes', function (req, res, next) {
      storeFn().getNodes(req.query,
        function (err, nodes, total, pageOf, pages, size) {
          if (err) next(err);
          else setPagingHeaders(res, total, pageOf, pages, size).json(nodes);
      });
    });

    // Get single node
    qapi.get('/nodes/:id', function (req, res, next) {
      storeFn().getNode(req.params.id, function (err, node) {
        if (err) next(err);
        else res.json(node);
      });
    });

    // List devices
    qapi.get('/devices/', function (req, res, next) {
      storeFn().getDevices(req.query,
          function (err, devices, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(devices);
      });
    });

    // Get a single device
    qapi.get('/devices/:id', function (req, res, next) {
      storeFn().getDevice(req.params.id, function (err, device) {
        if (err) next(err);
        else res.json(device);
      });
    });

    // List sources
    qapi.get('/sources/', function (req, res, next) {
      storeFn().getSources(req.query,
          function(err, sources, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(sources);
      });
    });

    // Get a single source
    qapi.get('/sources/:id', function (req, res, next) {
      storeFn().getSource(req.params.id, function (err, source) {
        if (err) next(err);
        else res.json(source);
      });
    });

    // List flows
    qapi.get('/flows/', function (req, res, next) {
      storeFn().getFlows(req.query,
          function (err, flows, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(flows);
      });
    });

    // Get a single flow
    qapi.get('/flows/:id', function (req, res, next) {
      storeFn().getFlow(req.params.id, function (err, flow) {
        if (err) next(err);
        else res.json(flow);
      });
    });

    // List senders
    qapi.get('/senders/', function (req, res, next) {
      storeFn().getSenders(req.query,
         function(err, senders, pageOf, size, page, total) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, page, size).json(senders);
      });
    });

    // Get a single sender
    qapi.get('/senders/:id', function (req, res, next) {
      storeFn().getSender(req.params.id, function (err, sender) {
        if (err) next(err);
        else res.json(sender);
      });
    });

    // List receivers
    qapi.get('/receivers/', function (req, res, next) {
      storeFn().getReceivers(req.query,
          function(err, receivers, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(receivers);
      });
    });

    // Get a single receiver
    qapi.get('/receivers/:id', function (req, res, next) {
      storeFn().getReceiver(req.params.id, function(err, receiver) {
        if (err) next(err);
        else res.json(receiver);
      });
    });

    qapi.post('/subscriptions', function (req, res, next) {
      var sub = req.body;
      if (!sub.max_update_rate_ms)
        return next(NodeStore.prototype.statusError(400,
          "Subscription must have a 'max_update_rate_ms' property."));
      if (typeof sub.persist === 'undefined')
        return next(NodeStore.prototype.statusError(400,
          "Subscription must have a 'persist' property."));
      if (!sub.resource_path)
        return next(NodeStore.prototype.statusError(400,
          "Subscription must have a 'resource_path' property."));
      if (!sub.params)
        return next(NodeStore.prototype.statusError(400,
          "Subscription must have a 'params' property, although this may be an " +
          "empty object."));
      if (typeof sub.max_update_rate_ms !== 'number' ||
           sub.max_update_rate_ms < 0)
        return next(NodeStore.prototype.statusError(400,
          "Subscription parameter 'max_update_rate_ms' should be a number and " +
          "greater than or equal to 0."));
      sub.max_update_rate_ms = sub.max_update_rate_ms | 0;
      if (typeof sub.persist !== 'boolean')
        return next(NodeStore.prototype.statusError(400,
          "Subscription parameter 'persist' must be a boolean."));
      if (typeof sub.resource_path !== 'string' ||
           pathEnum.indexOf(sub.resource_path) === -1)
        return next(NodeStore.prototype.statusError(400,
          "Subscription parameter 'resource_path' must be one of " +
          pathEnum.toString() + "."));
      if (typeof sub.params !== 'object')
        return next(NodeStore.prototype.statusError(400,
          "Subscription parameter 'params' must be an object."));
      sub.id = uuid.v4();
      sub.ws_href = `ws://${firstExtNetIf}:${server.address().port}/` +
        `ws/?uid=${sub.id}`;
      if (webSockets[sub.id]) {
        webSockets[sub.id] = sub;
        res.status(200).json(sub);
      } else {
        console.log("Creating subscription.", sub.ws_href);
        webSockets[sub.id] = sub;
        res.status(201).json(sub);
      };
    });

    qapi.get('/subscriptions', function (req, res, next) {
      res.json(Object.keys(webSockets).map(function (k) {
        return webSockets[k];
      }));
    });

    qapi.get('/subscriptions/:id', function (req, res, next) {
      if (!webSockets[req.params.id])
        return next(NodeStore.prototype.statusError(404,
          `A web socket subscription with id '${req.params.id}' is now known ` +
          `to this query API.`));
      res.json(webSockets[req.params.id]);
    });

    qapi.delete('/subscriptions/:id', function (req, res, next) {
      if (!webSockets[req.params.id])
        return next(NodeStore.prototype.statusError(404,
          `On delete, a web socket subscription with id '${req.params.id}' is now known ` +
          `to this query API.`));
      if (webSockets[req.params.id].persist === false) {
        return next(NodeStore.prototype.statusError(403,
          `A delete request is made against a non-persistent subscription with ` +
          `id '${req.params.id}' that is ` +
          `managed by the Query API and cannot be deleted.`));
      }
      delete webSockets[req.params.id];
      res.status(204).end();
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
   * Start the Query API server. If the port is already in use, the server
   * will be closed.
   * @param  {QueryAPI~trackStatus=} cb Optional callback to track API starting
   *                                    or errors.
   * @return {QueryAPI}                 This object with an asynchronous request
   *                                    to start the server.
   */
  this.start = function (cb) {
    server = app.listen(port, iface, function (e) {
      var host = server.address().address;
      var port = server.address().port;
      if (e) {
        if (e.code == 'EADDRINUSE') {
          console.log('Address http://%s:%s already in use.', host, port);
          server.close();
        };
        if (cb) cb(e);
      } else {
        console.log('Streampunk media ledger query service running at http://%s:%s',
          host, port);
        if (cb) cb();
      };
    });

    wss = new WebSocketServer({ server : server });
    wss.on('connection', connectWS.bind(this));
    wss.on('error', console.error.bind(null, 'Websocket Error:'));

    this.startMDNS();

    return this;
  }

  this.startMDNS = function startMDNS() {
    // mdns.excludeInterface('0.0.0.0');
    if (serviceName === 'none') return; // For REST service acceptance testing
    mdnsService = mdns.createAdvertisement(mdns.tcp('nmos-query'), port, {
      name : serviceName,
      txt : {
        pri : pri
      }
    });

    mdnsService.start();

    process.on('SIGINT', function () {
      if (mdnsService) {
        mdnsService.stop();
        console.log('Stopping ledger query service MDNS.');
      }

      setTimeout(function onTimeout() {
        process.exit();
      }, 1000);
    });
  }

  /**
   * Stop the server running the Query API.
   * @param  {QueryAPI~trackStatus=} cb Optional callback that tracks when the
   *                                   server is stopped.
   * @return {QueryAPI}                 This object with an asynchronous request
   *                                   to stop the server.
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
           ' Server is not set for this Query API and so cannot be stopped.'));
         else
           cb(new Error('Server is not set for this Query API and so cannot be stopped.'));
         server = null;
       }.bind(this));
     }
     wss.close();

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
       if (cb) cb(new Error('MDNS advertisement is not set for this Query API and so cannot be stopped.'));
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

   function connectWS (ws) {
     var reqUrl = url.parse(ws.upgradeReq.url, true);
     if (!reqUrl.query.uid || !webSockets[reqUrl.query.uid]) {
       return ws.close(1008, JSON.stringify({
         code : 404,
         error : `Subscription with identifier '${reqUrl.query.uid}' could not be found.`
       }));
     }
     var sub = webSockets[reqUrl.query.uid];
     ws.ledgerID = uuid.v4();
     if (wsFilter[sub.resource_path]) {
       wsFilter[sub.resource_path].push({ sub : sub, socket : ws });
     } else {
       wsFilter[sub.resource_path] = [ { sub : sub, socket : ws } ];
     }
     ws.on('close', function () {
       wsFilter[sub.resource_path] = wsFilter[sub.resource_path].filter(function (x) {
         return x.socket.ledgerID !== ws.ledgerID;
       });
       if (!sub.persist && !wsFilter[sub.resource_path].find(function (x) {
         return x.sub.id === sub.id;
       })) {
         delete webSockets[sub.id];
       };
     });
     var method = `get${sub.resource_path[1].toUpperCase()}${sub.resource_path.slice(2)}`;
     storeFn()[method]("",
       function (err, resources, total, pageOf, pages, size) {
         if (err) return console.error('Failed to read resources on websocket connection.');
         var tsBase = Date.now();
         var ts = `${tsBase / 1000|0}:${tsBase % 1000 * 1000000}`;
         var g = {
           grain_type : "event",
           source_id : instanceUUID,
           flow_id : sub.id,
           origin_timestamp : ts,
           sync_timestamp : ts,
           creation_timestamp : ts,
           rate : { numerator: 0, denominator: 1 },
           duration : { numerator: 0, denominator: 1 },
           grain : {
             type : "urn:x-nmos:format:data.event",
             topic : `${sub.resourcePath}/`,
             data : resources.map(function (ro) {
               return { path : ro.id, pre : ro, post : ro };
             })
           }
         };
         ws.send(JSON.stringify(g), { mask : false});
         ws.lastTime = tsBase;
     });
   };

   this.on('modify', function (ev) {
     var subs = wsFilter[ev.topic.slice(0, -1)];
     if (subs) {
       subs.forEach(function (subWs) {
         if (!Object.keys(subWs.sub.params).every(function (k) {
           var preMatch = (ev.data[0].pre && ev.data[0].pre[k]) === subWs.sub.params[k];
           var postMatch = (ev.data[0].post && ev.data[0].post[k]) === subWs.sub.params[k];
           return preMatch || postMatch;
         })) return;
         var tsBase = Date.now();
         var ts = `${tsBase / 1000|0}:${tsBase % 1000 * 1000000}`;
         var g = {
           grain_type : "event",
           source_id : instanceUUID,
           flow_id : subWs.sub.id,
           origin_timestamp : ts,
           sync_timestamp : ts,
           creation_timestamp : ts,
           rate : { numerator: 0, denominator: 1 },
           duration : { numerator: 0, denominator: 1 },
           grain : {
             type : "urn:x-nmos:format:data.event",
             topic : ev.topic,
             data : ev.data
           }
         };
         if (subWs.builder) {
           subWs.builder.grain.data.push(g.grain.data[0]);
           g.grain.data = subWs.builder.grain.data;
           subWs.builder = g;
         } else {
           subWs.builder = g;
         }
         if (subWs.lastTime &&
             tsBase - subWs.lastTime < subWs.sub.max_update_rate_ms) {
           if (!subWs.timeout) {
             subWs.timeout = setTimeout(function () {
               subWs.socket.send(JSON.stringify(subWs.builder), { mask : false });
               delete subWs.builder;
               delete subWs.timeout;
               subWs.lastTime = tsBase;
             }, subWs.sub.max_update_rate_ms - (tsBase - subWs.lastTime));
           }
         } else {
           subWs.socket.send(JSON.stringify(subWs.builder), { mask : false });
           delete subWs.builder;
           delete subWs.timeout;
           subWs.lastTime = tsBase;
         };
       });
     };
   });

   if (!validPort(port))
     return new Error('Port is not a valid value. Must be an integer greater than zero.');
   // return immutable(this, { prototype : QueryAPI.prototype });
}

/**
 * Function called when server has been started or stopped.
 * @callback {QueryAPI~trackStatus}
 * @param {Error=} Set if an error occurred when starting or stopping the server.
 */

util.inherits(QueryAPI, EventEmitter);

module.exports = QueryAPI;
